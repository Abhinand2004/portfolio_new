"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, type Easing } from "motion/react";

type Ease =
  | "none"
  | "linear"
  | `power${1 | 2 | 3 | 4}.${"in" | "out" | "inOut"}`
  | "expo.out"
  | [number, number, number, number];

export interface StrokeTextProps {
  text: string;
  /** Any CSS colour, including `var(--token)` */
  strokeColor?: string;
  fillColor?: string;
  /** On-screen stroke width in pixels, independent of the text size */
  strokeWidth?: number;
  /** Seconds each letter takes to draw its outline */
  drawDuration?: number;
  /** Seconds after a letter finishes drawing before its fill starts */
  fillDelay?: number;
  /** Seconds between consecutive letters */
  stagger?: number;
  /** Seconds before the first letter starts drawing */
  delay?: number;
  /** GSAP-style ease name or a cubic-bezier tuple */
  ease?: Ease;
  trigger?: "mount" | "inView" | "hover";
  /** Window event name that restarts the animation */
  replayOn?: string;
  fillMode?: "wipe" | "fade" | "none";
  /** Pixels, or any CSS length (e.g. "1em" to inherit the parent's size) */
  fontSize?: number | string;
  fontWeight?: number;
  fontFamily?: string;
  /** In pixels at a 100px font size, scaled with the text */
  letterSpacing?: number;
  /** Animate from the last letter to the first */
  reverse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// GSAP ease names mapped to equivalent cubic-bezier curves.
const EASES: Record<string, [number, number, number, number]> = {
  "power1.in": [0.55, 0.085, 0.68, 0.53],
  "power1.out": [0.25, 0.46, 0.45, 0.94],
  "power1.inOut": [0.455, 0.03, 0.515, 0.955],
  "power2.in": [0.55, 0.055, 0.675, 0.19],
  "power2.out": [0.215, 0.61, 0.355, 1],
  "power2.inOut": [0.645, 0.045, 0.355, 1],
  "power3.in": [0.895, 0.03, 0.685, 0.22],
  "power3.out": [0.165, 0.84, 0.44, 1],
  "power3.inOut": [0.77, 0, 0.175, 1],
  "power4.in": [0.755, 0.05, 0.855, 0.06],
  "power4.out": [0.23, 1, 0.32, 1],
  "power4.inOut": [0.86, 0, 0.07, 1],
  "expo.out": [0.16, 1, 0.3, 1],
};

const toEasing = (ease: Ease): Easing =>
  Array.isArray(ease) ? ease : ease === "none" || ease === "linear" ? "linear" : EASES[ease] ?? EASES["power2.out"];

// Text is laid out at this size in SVG user units, then scaled to `fontSize`.
const UNIT = 100;

type Glyph = { char: string; x: number; left: number; width: number };
type Layout = { glyphs: Glyph[]; box: { x: number; y: number; width: number; height: number } };

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function StrokeText({
  text,
  strokeColor = "currentColor",
  fillColor = "currentColor",
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  delay = 0,
  ease = "power2.out",
  trigger = "mount",
  replayOn,
  fillMode = "wipe",
  fontSize = 128,
  fontWeight = 400,
  fontFamily = "inherit",
  letterSpacing = 0,
  reverse = false,
  className,
  style,
}: StrokeTextProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [play, setPlay] = useState(0);
  // Rendered pixels per SVG unit, so `strokeWidth` stays in screen pixels.
  const [pxPerUnit, setPxPerUnit] = useState(1);
  const inView = useInView(svgRef, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const id = React.useId().replace(/:/g, "");

  useEffect(() => {
    if (!replayOn) return;
    const replay = () => setPlay((p) => p + 1);
    window.addEventListener(replayOn, replay);
    return () => window.removeEventListener(replayOn, replay);
  }, [replayOn]);

  const measure = useCallback(() => {
    const el = measureRef.current;
    if (!el || !text) return;
    const glyphs: Glyph[] = [];
    for (let i = 0; i < text.length; i++) {
      const extent = el.getExtentOfChar(i);
      glyphs.push({ char: text[i], x: el.getStartPositionOfChar(i).x, left: extent.x, width: extent.width });
    }
    const b = el.getBBox();
    // Pad so wide strokes and script swashes are never clipped by the viewBox.
    const pad = UNIT * 0.15;
    setLayout({
      glyphs,
      box: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 },
    });
  }, [text]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !layout) return;
    const update = () => {
      const h = svg.getBoundingClientRect().height;
      if (h > 0) setPxPerUnit(h / layout.box.height);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [layout]);

  // Measure after web fonts load, otherwise positions come from the fallback font.
  useIsoLayoutEffect(() => {
    measure();
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    const onFonts = () => measure();
    document.fonts?.addEventListener("loadingdone", onFonts);
    return () => {
      alive = false;
      document.fonts?.removeEventListener("loadingdone", onFonts);
    };
  }, [measure, fontFamily, fontWeight, letterSpacing]);

  const ready = layout !== null;
  const active =
    ready && (reduced || trigger === "hover" || (trigger === "mount" ? true : inView));

  const textStyle: React.CSSProperties = {
    fontFamily,
    fontWeight,
    fontSize: UNIT,
    letterSpacing,
  };

  const scale = typeof fontSize === "number" ? `${fontSize / UNIT}px` : `calc(${fontSize} / ${UNIT})`;
  const easing = toEasing(ease);
  // Dash long enough to cover any glyph outline, including script loops.
  const dash = UNIT * 12;
  const fillDuration = Math.max(0.35, drawDuration * 0.6);
  const visible = layout?.glyphs.filter((g) => g.char.trim()) ?? [];

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={text}
      className={className}
      viewBox={layout ? `${layout.box.x} ${layout.box.y} ${layout.box.width} ${layout.box.height}` : "0 0 1 1"}
      onPointerEnter={trigger === "hover" ? () => setPlay((p) => p + 1) : undefined}
      style={{
        display: "inline-block",
        overflow: "visible",
        height: layout ? `calc(${layout.box.height} * ${scale})` : undefined,
        width: layout ? `calc(${layout.box.width} * ${scale})` : undefined,
        ...style,
      }}
    >
      <text ref={measureRef} x={0} y={0} style={textStyle} visibility="hidden" aria-hidden="true">
        {text}
      </text>

      {active &&
        visible.map((g, i) => {
          const order = reverse ? visible.length - 1 - i : i;
          const drawAt = delay + order * stagger;
          const fillAt = drawAt + drawDuration + fillDelay;
          const clipId = `${id}-clip-${i}`;
          const key = `${play}-${i}`;
          const glyphProps = { x: g.x, y: 0, style: textStyle, "aria-hidden": true as const };
          const reach = UNIT * 0.6;
          const box = layout!.box;

          return (
            <g key={key}>
              {fillMode === "wipe" && (
                <clipPath id={clipId}>
                  <motion.rect
                    x={g.left - reach}
                    y={box.y}
                    height={box.height}
                    initial={{ width: reduced ? g.width + reach * 2 : 0 }}
                    animate={{ width: g.width + reach * 2 }}
                    transition={{ duration: reduced ? 0 : fillDuration, delay: reduced ? 0 : fillAt, ease: easing }}
                  />
                </clipPath>
              )}
              {fillMode !== "none" && (
                <motion.text
                  {...glyphProps}
                  style={{ ...textStyle, fill: fillColor }}
                  clipPath={fillMode === "wipe" ? `url(#${clipId})` : undefined}
                  initial={fillMode === "fade" && !reduced ? { opacity: 0 } : false}
                  animate={fillMode === "fade" ? { opacity: 1 } : undefined}
                  transition={{ duration: fillDuration, delay: fillAt, ease: easing }}
                >
                  {g.char}
                </motion.text>
              )}
              <motion.text
                {...glyphProps}
                fill="none"
                strokeWidth={strokeWidth / pxPerUnit}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={dash}
                style={{ ...textStyle, stroke: strokeColor }}
                initial={{ strokeDashoffset: reduced ? 0 : dash }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: reduced ? 0 : drawDuration, delay: reduced ? 0 : drawAt, ease: easing }}
              >
                {g.char}
              </motion.text>
            </g>
          );
        })}
    </svg>
  );
}
