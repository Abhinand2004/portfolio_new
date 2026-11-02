"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_REPLAY_EVENT } from "@/components/HeroMotion";

export const SITE_READY_EVENT = "site:ready";

/* ---------- Isometric hairline keyboard (generated, deterministic so SSR matches) ---------- */

type V2 = [number, number];
type V3 = [number, number, number];

const U = 17; // svg units per key unit
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

// 60% layout, key widths in units per row (back row first)
const ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];
const ENTER = { row: 2, col: 11 };

const MARGIN = 0.42;
const CASE_H = 0.62;
const CAP_H = 0.4;
const GAP = 0.05;
const TOP_INSET = 0.13;

const project = ([x, y, z]: V3): V2 => [(x - y) * COS * U, ((x + y) * SIN - z) * U];

/** Rounded rectangle in the keyboard plane; each point carries its outward normal angle */
function roundedRect(x: number, y: number, w: number, d: number, r: number, seg = 5) {
  const pts: { p: V2; a: number }[] = [];
  const corners: [number, number, number][] = [
    [x + w - r, y + r, -Math.PI / 2],
    [x + w - r, y + d - r, 0],
    [x + r, y + d - r, Math.PI / 2],
    [x + r, y + r, Math.PI],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = start + (i / seg) * (Math.PI / 2);
      pts.push({ p: [cx + Math.cos(a) * r, cy + Math.sin(a) * r], a });
    }
  }
  return pts;
}

function hull(points: V2[]): V2[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: V2[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: V2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

const f = (n: number) => n.toFixed(2);
const pathOf = (pts: V2[], close = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("") + (close ? "Z" : "");

/** Part of a ring at height z whose normal faces the viewer (+x +y), as an open polyline */
function frontArc(ring: { p: V2; a: number }[], z: number) {
  const facing = ring.map(({ a }) => Math.cos(a) + Math.sin(a) > 0.02);
  const start = facing.findIndex((v, i) => v && !facing[(i - 1 + ring.length) % ring.length]);
  const out: V2[] = [];
  for (let i = 0; i < ring.length; i++) {
    const k = (start + i) % ring.length;
    if (!facing[k]) break;
    out.push(project([ring[k].p[0], ring[k].p[1], z]));
  }
  return out;
}

type Shape = { sil: string; lines: string[] };

function solid(x: number, y: number, w: number, d: number, z0: number, h: number, r: number, inset: number, back = 0): Shape {
  const base = roundedRect(x, y, w, d, r);
  const top = roundedRect(x + inset, y + inset - back, w - inset * 2, d - inset * 2, Math.max(0.04, r - inset * 0.4));
  const sil = hull([...base.map(({ p }) => project([p[0], p[1], z0])), ...top.map(({ p }) => project([p[0], p[1], z0 + h]))]);
  const topRing = top.map(({ p }) => project([p[0], p[1], z0 + h]));
  // Front-most vertical edge, from the top face down to the base
  const fb: V3 = [x + w - r * 0.3, y + d - r * 0.3, z0];
  const ft: V3 = [x + w - inset - r * 0.3, y + d - inset - back - r * 0.3, z0 + h];
  return { sil: pathOf(sil), lines: [pathOf(topRing), pathOf([project(ft), project(fb)], false)] };
}

function buildKeyboard() {
  const width = 15 + MARGIN * 2;
  const depth = ROWS.length + MARGIN * 2;

  const caseShape = solid(0, 0, width, depth, 0, CASE_H, 0.55, 0.06);
  const caseBottom = roundedRect(0, 0, width, depth, 0.55);
  const caseLines = [
    ...caseShape.lines.slice(0, 1),
    pathOf(frontArc(caseBottom, CASE_H * 0.42), false),
    pathOf(roundedRect(MARGIN - 0.12, MARGIN - 0.12, 15.24, ROWS.length + 0.24, 0.22).map(({ p }) => project([p[0], p[1], CASE_H])), true),
  ];

  const keys: (Shape & { id: string; order: number })[] = [];
  ROWS.forEach((row, r) => {
    let x = MARGIN;
    row.forEach((w, c) => {
      const kx = x + GAP;
      const ky = MARGIN + r + GAP;
      const s = solid(kx, ky, w - GAP * 2, 1 - GAP * 2, CASE_H - 0.06, CAP_H, 0.14, TOP_INSET, 0.04);
      keys.push({ ...s, id: `${r}-${c}`, order: kx + w / 2 + ky });
      x += w;
    });
  });
  // Painter's order: farthest (smallest x + y) first
  keys.sort((a, b) => a.order - b.order);

  const all = [caseShape.sil, ...keys.map((k) => k.sil)].join(" ");
  const nums = all.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const pad = 6;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const viewBox = `${f(minX)} ${f(minY)} ${f(Math.max(...xs) - minX + pad)} ${f(Math.max(...ys) - minY + pad)}`;

  return { viewBox, caseSil: caseShape.sil, caseLines, keys };
}

const KEYBOARD = buildKeyboard();
const DEFAULT_KEY = `${ENTER.row}-${ENTER.col}`;

function Keyboard() {
  const [hot, setHot] = useState(DEFAULT_KEY);

  return (
    <svg
      className="sl-keyboard"
      viewBox={KEYBOARD.viewBox}
      aria-hidden="true"
      onPointerLeave={() => setHot(DEFAULT_KEY)}
    >
      <path className="sl-sil" d={KEYBOARD.caseSil} />
      {KEYBOARD.caseLines.map((d, i) => (
        <path key={i} className="sl-lo" d={d} />
      ))}
      {KEYBOARD.keys.map((k) => (
        <g key={k.id} className={k.id === hot ? "is-hot" : undefined} onPointerEnter={() => setHot(k.id)}>
          <path className="sl-sil" d={k.sil} />
          {k.lines.map((d, i) => (
            <path key={i} className="sl-lo" d={d} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ---------- Loader overlay ---------- */

const MIN_MS = 900;
const FAILSAFE_MS = 7000;
const HOLD_MS = 220;

function replayHero() {
  const hero = document.getElementById("top");
  if (hero) {
    hero.classList.remove("hero-play");
    void hero.offsetWidth;
    hero.classList.add("hero-play");
  }
  window.dispatchEvent(new Event(HERO_REPLAY_EVENT));
  window.dispatchEvent(new Event(SITE_READY_EVENT));
}

export default function SiteLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let ready = false;
    let shown = 0;
    let raf = 0;
    let doneAt = 0;
    let leaving = false;
    const t0 = performance.now();
    let last = t0;

    const pageLoaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    void Promise.all([pageLoaded, document.fonts?.ready]).then(() => {
      ready = true;
    });

    const paint = () => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown.toFixed(4)})`;
      if (countRef.current) countRef.current.textContent = String(Math.round(shown * 100)).padStart(3, "0");
    };

    const leave = () => {
      if (leaving) return;
      leaving = true;
      cancelAnimationFrame(raf);
      shown = 1;
      paint();
      root.classList.add("is-leaving");
      replayHero();
      const finish = () => setGone(true);
      // Key-stroke transitions bubble up too, so only accept the curtain's own transition
      const onEnd = (e: TransitionEvent) => {
        if (e.target === root) finish();
      };
      root.addEventListener("transitionend", onEnd);
      window.setTimeout(finish, 900);
    };

    const tick = (now: number) => {
      const elapsed = now - t0;
      const dt = Math.min(100, now - last);
      last = now;
      if (elapsed > FAILSAFE_MS) ready = true;
      // Ease toward 90% while waiting, then run home once everything has loaded (frame-rate independent)
      const finishing = ready && elapsed > MIN_MS;
      const target = finishing ? 1 : 0.9 * (1 - Math.exp(-elapsed / 1700));
      shown += (target - shown) * (1 - Math.exp(-dt / (finishing ? 110 : 220)));
      if (finishing && shown > 0.995) shown = 1;
      paint();
      if (shown === 1) {
        doneAt ||= now;
        if (now - doneAt > HOLD_MS) return leave();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // rAF pauses in background tabs; make sure the loader never outlives a hidden load
    const backup = window.setTimeout(leave, FAILSAFE_MS + 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(backup);
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={rootRef} className="site-loader" role="status" aria-label="Loading">
      <div className="sl-art">
        <Keyboard />
      </div>
      <div className="sl-meter" aria-hidden="true">
        <span className="sl-track">
          <span ref={barRef} className="sl-bar" />
        </span>
        <span className="sl-row">
          <span>Loading</span>
          <span ref={countRef} className="sl-count">
            000
          </span>
        </span>
      </div>
    </div>
  );
}
