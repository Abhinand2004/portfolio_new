"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PROFILE } from "@/lib/data";
import { HERO_REPLAY_EVENT } from "@/components/HeroMotion";

const ICON_PATHS = {
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  linkedin:
    "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  gmail:
    "M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.39l-9 6.49-9-6.49V21H1.5C.65 21 0 20.35 0 19.5v-15c0-.42.2-.8.52-1.05.3-.25.7-.35 1.08-.25L12 9.51l10.4-6.31c.38-.1.78 0 1.08.25.32.25.52.63.52 1.05z",
};

const ICONS = [
  { name: "github", path: ICON_PATHS.github, link: PROFILE.github },
  { name: "linkedin", path: ICON_PATHS.linkedin, link: PROFILE.linkedin },
  { name: "instagram", path: ICON_PATHS.instagram, link: PROFILE.instagram },
  { name: "gmail", path: ICON_PATHS.gmail, link: `mailto:${PROFILE.email}` },
];

/* ── Palette ── */
const PALETTE = {
  light: { face: "#f0ece1", border: "#d4cdc3", icon: "#1f1d1a" },
  // Warm graphite: lifts off the near-black hero without going grey, pairs with the amber accent
  dark: { face: "#2a2621", border: "#3d372f", icon: "#ece4d4" },
};

/* ── Front-face card texture: rounded inset panel, hairline border, icon ── */
function createFaceTexture(path: string, colors: (typeof PALETTE)["light"]) {
  if (typeof document === "undefined") return null;
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const inset = 6;
  ctx.beginPath();
  ctx.roundRect(inset, inset, S - inset * 2, S - inset * 2, 34);
  ctx.fillStyle = colors.face;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  ctx.fillStyle = colors.icon;
  ctx.translate(S / 2, S / 2);
  ctx.scale(4.2, 4.2);
  ctx.translate(-12, -12);
  ctx.fill(new Path2D(path));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ── Single Cube ── */
const easeOutBack = (t: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const REST_RX = 0.3;
const REST_RY = 0.4;

function Cube({
  index,
  icon,
  isLight,
  isMobile,
  reduced,
  replay,
}: {
  index: number;
  icon: (typeof ICONS)[number];
  isLight: boolean;
  isMobile: boolean;
  reduced: boolean;
  replay: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const faceMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const hovered = useRef(false);
  const hoverAmt = useRef(0);

  const colors = isLight ? PALETTE.light : PALETTE.dark;
  const texture = useMemo(() => createFaceTexture(icon.path, colors), [icon.path, colors]);
  useEffect(() => () => texture?.dispose(), [texture]);

  // Phase 5 of the hero timeline: drop in from ~1.0s, staggered
  const delay = 1.0 + index * 0.12;
  const DURATION = 0.75;
  const elapsed = useRef(0);

  useEffect(() => {
    elapsed.current = 0;
  }, [replay]);

  // Fixed landing positions — perfectly equal spacing
  const CUBE_SIZE = 0.5;
  const GAP = 0.7; // center-to-center distance
  const START_X = -(ICONS.length - 1) * GAP * 0.5; // center the group
  // Desktop: shifted left and down; mobile: centred in its own band
  const targetX = START_X + index * GAP - (isMobile ? 0 : 0.5);
  const targetY = isMobile ? 0 : -0.6;

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (reduced) {
      mesh.position.set(targetX, targetY, 0);
      mesh.rotation.set(REST_RX, REST_RY, 0);
      mesh.scale.setScalar(1);
      return;
    }

    elapsed.current += Math.min(delta, 0.05);
    const p = THREE.MathUtils.clamp((elapsed.current - delay) / DURATION, 0, 1);
    const pop = easeOutBack(p);
    // Drop with a slight overshoot below the rest line, then settle
    const drop = 1 - pop;

    hoverAmt.current = THREE.MathUtils.damp(hoverAmt.current, hovered.current ? 1 : 0, 10, delta);
    const h = hoverAmt.current;

    // Idle float (±~4px) and subtle tilt, faded in once landed
    const t = state.clock.elapsedTime;
    const idle = p;
    const bob = Math.sin(t * 1.3 + index * 1.4) * 0.035 * idle;
    const tiltX = Math.sin(t * 0.9 + index) * 0.06 * idle;
    const tiltY = Math.cos(t * 0.7 + index * 0.8) * 0.1 * idle;

    mesh.position.x = targetX;
    mesh.position.y = targetY + drop * 0.9 + bob + h * 0.1;
    mesh.rotation.x = REST_RX + drop * -0.8 + tiltX - h * 0.1;
    mesh.rotation.y = REST_RY + drop * 1.6 + tiltY + h * 0.25;
    mesh.scale.setScalar(Math.max(0, pop) * (1 + h * 0.08));

    const glow = h * (isLight ? 0.18 : 0.35);
    if (matRef.current) matRef.current.emissiveIntensity = glow;
    if (faceMatRef.current) faceMatRef.current.emissiveIntensity = glow;
  });

  const radius = CUBE_SIZE * 0.14;
  const faceSize = CUBE_SIZE - radius * 1.1;

  return (
    <RoundedBox
      ref={meshRef}
      args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]}
      radius={radius}
      smoothness={5}
      position={[targetX, targetY, 0]}
      scale={reduced ? 1 : 0}
      onClick={() => window.open(icon.link, "_blank")}
      onPointerOver={() => {
        hovered.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "auto";
      }}
    >
      <meshStandardMaterial
        ref={matRef}
        color={colors.face}
        emissive="#e69e51"
        emissiveIntensity={0}
        roughness={isLight ? 0.75 : 0.6}
        metalness={0}
      />
      {texture && (
        <mesh position={[0, 0, CUBE_SIZE / 2 + 0.002]}>
          <planeGeometry args={[faceSize, faceSize]} />
          <meshStandardMaterial
            ref={faceMatRef}
            map={texture}
            transparent
            emissive="#e69e51"
            emissiveIntensity={0}
            roughness={isLight ? 0.75 : 0.6}
            metalness={0}
          />
        </mesh>
      )}
    </RoundedBox>
  );
}

/* ── Scene ── */
export default function SocialCubes() {
  const [isLight, setIsLight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const onReplay = () => setReplay((r) => r + 1);
    window.addEventListener(HERO_REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(HERO_REPLAY_EVENT, onReplay);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const check = () => setIsLight(document.body.classList.contains("light-mode"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="social-cubes-container">
      <Canvas
        key={isMobile ? "mobile" : "desktop"}
        flat
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, isMobile ? 3.2 : 5], fov: 32 }}
        dpr={[1, 2]}
      >
        <React.Suspense fallback={null}>
          {/* Top-front key so the lid reads brightest and the left side falls off; ~π total keeps true palette colour */}
          <ambientLight intensity={isLight ? 2.4 : 2.8} />
          <directionalLight position={[1, 5, 4]} intensity={isLight ? 1.1 : 2.2} color={isLight ? "#ffffff" : "#ffe0bd"} />
          <directionalLight position={[-4, 1, 3]} intensity={isLight ? 0.15 : 0.4} />

          {ICONS.map((icon, i) => (
            <Cube key={icon.name} index={i} icon={icon} isLight={isLight} isMobile={isMobile} reduced={reduced} replay={replay} />
          ))}
        </React.Suspense>
      </Canvas>
    </div>
  );
}
