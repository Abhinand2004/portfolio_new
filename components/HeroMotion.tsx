"use client";

import { useEffect } from "react";

export const HERO_REPLAY_EVENT = "hero:replay";

/**
 * Damped cursor parallax (`--px` / `--py`, range -1 → 1) on the hero, plus
 * magnetic pull (`--mag-x` / `--mag-y`) on CTA buttons. CSS maps these onto
 * each depth layer via the `translate` property.
 * Also replays the CSS entrance (`.hero-play`) whenever the hero scrolls back into view.
 */
export default function HeroMotion({ targetId = "top" }: { targetId?: string }) {
  useEffect(() => {
    const hero = document.getElementById(targetId);
    if (!hero) return;

    // Once the entrance has finished, its end state equals the resting state,
    // so dropping the class while off-screen is invisible.
    let armed = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.35) {
          if (!armed) {
            armed = true;
            hero.classList.remove("hero-play");
          }
        } else if (armed) {
          armed = false;
          void hero.offsetWidth;
          hero.classList.add("hero-play");
          window.dispatchEvent(new Event(HERO_REPLAY_EVENT));
        }
      },
      { threshold: [0, 0.35, 0.6] }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [targetId]);

  useEffect(() => {
    const hero = document.getElementById(targetId);
    if (!hero) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      hero.style.setProperty("--px", cx.toFixed(4));
      hero.style.setProperty("--py", cy.toFixed(4));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };

    const magnets = Array.from(hero.querySelectorAll<HTMLElement>(".hero-cta, .contact-btn"));
    const magMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.setProperty("--mag-x", `${(dx * 0.25).toFixed(2)}px`);
      el.style.setProperty("--mag-y", `${(dy * 0.35).toFixed(2)}px`);
    };
    const magLeave = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.removeProperty("--mag-x");
      el.style.removeProperty("--mag-y");
    };

    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    magnets.forEach((el) => {
      el.addEventListener("pointermove", magMove);
      el.addEventListener("pointerleave", magLeave);
    });

    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      magnets.forEach((el) => {
        el.removeEventListener("pointermove", magMove);
        el.removeEventListener("pointerleave", magLeave);
        el.style.removeProperty("--mag-x");
        el.style.removeProperty("--mag-y");
      });
      hero.style.removeProperty("--px");
      hero.style.removeProperty("--py");
    };
  }, [targetId]);

  return null;
}
