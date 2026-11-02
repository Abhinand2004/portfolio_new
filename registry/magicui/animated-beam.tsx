"use client";

import { useEffect, useId, useState, type RefObject } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  /** Draw an S-shaped cubic curve (flat at both ends) instead of a quadratic arc. */
  cubic?: boolean;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
  /** When false the beam is hidden; flipping to true draws it from start to end. */
  show?: boolean;
  showDelay?: number;
  drawDuration?: number;
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  cubic = false,
  reverse = false,
  duration = 5,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  show = true,
  showDelay = 0,
  drawDuration = 0.8,
}: AnimatedBeamProps) {
  const id = useId();
  const maskId = `${id}-mask`;
  const [pathD, setPathD] = useState("");
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const gradientCoordinates = reverse
    ? { x1: ["90%", "-10%"], x2: ["100%", "0%"], y1: ["0%", "0%"], y2: ["0%", "0%"] }
    : { x1: ["10%", "110%"], x2: ["0%", "100%"], y1: ["0%", "0%"], y2: ["0%", "0%"] };

  // Reveal radius grows from the path's start point outward
  const revealTo = Math.hypot(svgDimensions.width, svgDimensions.height);

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const rectA = fromRef.current.getBoundingClientRect();
      const rectB = toRef.current.getBoundingClientRect();

      setSvgDimensions({ width: containerRect.width, height: containerRect.height });

      const startX = rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
      const startY = rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
      const endX = rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
      const endY = rectB.top - containerRect.top + rectB.height / 2 + endYOffset;
      const midX = (startX + endX) / 2;

      setOrigin({ x: startX, y: startY });
      setPathD(
        cubic
          ? `M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`
          : `M ${startX},${startY} Q ${midX},${startY - curvature} ${endX},${endY}`
      );
    };

    const resizeObserver = new ResizeObserver(updatePath);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (toRef.current) resizeObserver.observe(toRef.current);
    if (fromRef.current) resizeObserver.observe(fromRef.current);
    window.addEventListener("resize", updatePath);
    updatePath();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePath);
    };
  }, [containerRef, fromRef, toRef, curvature, cubic, startXOffset, startYOffset, endXOffset, endYOffset, show]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none absolute left-0 top-0 transform-gpu stroke-2", className)}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      aria-hidden="true"
    >
      <g mask={`url(#${maskId})`}>
        <path
          d={pathD}
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={pathOpacity}
          strokeLinecap="round"
        />
        <path
          d={pathD}
          strokeWidth={pathWidth}
          stroke={`url(#${id})`}
          strokeOpacity="1"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={svgDimensions.width} height={svgDimensions.height}>
          <motion.circle
            cx={origin.x}
            cy={origin.y}
            fill="white"
            initial={false}
            animate={{ r: show ? revealTo : 0 }}
            transition={
              show ? { delay: showDelay, duration: drawDuration, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }
            }
          />
        </mask>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
