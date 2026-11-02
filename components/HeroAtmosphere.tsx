"use client";

import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; vx: number; vy: number; z: number; r: number; a: number; seed: number; glow: number };
type Ember = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number };
type Ripple = { x: number; y: number; t: number };

const REPEL_RADIUS = 170;
const MAX_EMBERS = 140;

/**
 * Cursor-reactive hero atmosphere: drifting dust motes on depth layers that
 * scatter and catch light near the cursor, a damped warm spotlight, ember
 * sparks shed by fast movement, and a light ripple on click.
 */
export default function HeroAtmosphere({ targetId = "top" }: { targetId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = document.getElementById(targetId);
    const ctx = canvas?.getContext("2d");
    if (!canvas || !hero || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let w = 0, h = 0, dpr = 1;
    let raf = 0, visible = true, last = performance.now();

    const pointer = { x: 0, y: 0, sx: 0, sy: 0, active: false, energy: 0, lastMove: 0 };
    const motes: Mote[] = [];
    const embers: Ember[] = [];
    const ripples: Ripple[] = [];

    const spawnMote = (m?: Mote): Mote => {
      const z = 0.25 + Math.random() * 0.75;
      const mote = m ?? ({} as Mote);
      mote.x = Math.random() * w;
      mote.y = Math.random() * h;
      mote.vx = 0;
      mote.vy = 0;
      mote.z = z;
      mote.r = 0.5 + z * 1.6;
      mote.a = 0.12 + z * 0.35;
      mote.seed = Math.random() * 1000;
      mote.glow = 0;
      return mote;
    };

    const resize = () => {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round((finePointer ? 70 : 28) * Math.min(1, (w * h) / (1440 * 900)) + 10);
      while (motes.length < target) motes.push(spawnMote());
      motes.length = target;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (!pointer.active) {
        pointer.sx = x;
        pointer.sy = y;
      }
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const speed = Math.hypot(dx, dy);
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.lastMove = performance.now();
      pointer.energy = Math.min(1, pointer.energy + speed / 260);

      const count = Math.min(4, Math.floor(speed / 14));
      for (let i = 0; i < count && embers.length < MAX_EMBERS; i++) {
        const life = 0.6 + Math.random() * 0.7;
        embers.push({
          x: x - dx * Math.random(),
          y: y - dy * Math.random(),
          vx: -dx * 0.6 + (Math.random() - 0.5) * 40,
          vy: -dy * 0.6 + (Math.random() - 0.5) * 40 - 20,
          life,
          max: life,
          r: 0.8 + Math.random() * 1.6,
        });
      }
      start();
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 });
      pointer.energy = 1;
      start();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const light = document.body.classList.contains("light-mode");
      const rgb = light ? "180, 83, 9" : "230, 158, 81";
      const hot = light ? "146, 64, 14" : "255, 214, 170";

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";

      // Damped spotlight
      const idle = now - pointer.lastMove > 1400 || !pointer.active;
      pointer.energy += ((idle ? 0 : 0.35) - pointer.energy) * (idle ? 0.03 : 0.04);
      pointer.sx += (pointer.x - pointer.sx) * 0.09;
      pointer.sy += (pointer.y - pointer.sy) * 0.09;
      const lightAmt = Math.max(0, pointer.energy);
      if (lightAmt > 0.01) {
        const rad = 260 + lightAmt * 120;
        const g = ctx.createRadialGradient(pointer.sx, pointer.sy, 0, pointer.sx, pointer.sy, rad);
        g.addColorStop(0, `rgba(${rgb}, ${(light ? 0.1 : 0.16) * lightAmt})`);
        g.addColorStop(0.45, `rgba(${rgb}, ${(light ? 0.04 : 0.06) * lightAmt})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(pointer.sx - rad, pointer.sy - rad, rad * 2, rad * 2);
      }

      // Dust motes
      const px = parseFloat(hero.style.getPropertyValue("--px") || "0");
      const py = parseFloat(hero.style.getPropertyValue("--py") || "0");
      const t = now / 1000;
      for (const m of motes) {
        m.vy += (-6 * m.z - m.vy) * dt;
        m.vx += Math.sin(t * 0.4 + m.seed) * 4 * dt;

        if (pointer.active) {
          const dx = m.x - pointer.x;
          const dy = m.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < REPEL_RADIUS && d > 0.1) {
            const f = (1 - d / REPEL_RADIUS) ** 2;
            m.vx += (dx / d) * f * 420 * m.z * dt;
            m.vy += (dy / d) * f * 420 * m.z * dt;
            m.glow = Math.min(1, m.glow + f * 3 * dt * 4);
          }
        }
        m.glow = Math.max(0, m.glow - dt * 0.8);
        m.vx *= 1 - 1.6 * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        if (m.y < -10 || m.x < -20 || m.x > w + 20) {
          spawnMote(m);
          m.y = h + 5;
        } else if (m.y > h + 10) {
          m.y = -5;
        }

        const ox = m.x + px * 20 * m.z;
        const oy = m.y + py * 14 * m.z;
        const twinkle = 0.75 + Math.sin(t * 1.7 + m.seed) * 0.25;
        const a = (m.a * twinkle + m.glow * 0.6) * (light ? 0.7 : 1);
        const r = m.r * (1 + m.glow * 0.8);
        if (m.glow > 0.05) {
          ctx.fillStyle = `rgba(${rgb}, ${a * 0.25})`;
          ctx.beginPath();
          ctx.arc(ox, oy, r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${m.glow > 0.3 ? hot : rgb}, ${a})`;
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ember sparks
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life -= dt;
        if (e.life <= 0) {
          embers.splice(i, 1);
          continue;
        }
        e.vx *= 1 - 2.4 * dt;
        e.vy = e.vy * (1 - 2.4 * dt) - 30 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        const k = e.life / e.max;
        ctx.fillStyle = `rgba(${k > 0.6 ? hot : rgb}, ${k * (light ? 0.55 : 0.85)})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (0.4 + k * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      // Click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += dt;
        const k = rp.t / 1.1;
        if (k >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const ease = 1 - (1 - k) ** 3;
        ctx.strokeStyle = `rgba(${rgb}, ${(1 - k) * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, 12 + ease * 220, 0, Math.PI * 2);
        ctx.stroke();
      }

      start();
    };

    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    const onVisibility = () => !document.hidden && start();

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(hero);
    io.observe(hero);
    document.addEventListener("visibilitychange", onVisibility);
    if (finePointer) {
      hero.addEventListener("pointermove", onMove, { passive: true });
      hero.addEventListener("pointerleave", onLeave);
      hero.addEventListener("pointerdown", onDown);
    }
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("pointerdown", onDown);
    };
  }, [targetId]);

  return <canvas ref={canvasRef} className="hero-atmosphere" aria-hidden="true" />;
}
