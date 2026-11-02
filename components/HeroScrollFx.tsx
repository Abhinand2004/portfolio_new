"use client";

import { useEffect } from "react";

/**
 * Publishes how far the hero has been scrolled away (0 → 1) as `--hero-p`
 * on the hero element, so CSS can drive a scroll-linked exit parallax.
 */
export default function HeroScrollFx({ targetId = "top" }: { targetId?: string }) {
  useEffect(() => {
    const hero = document.getElementById(targetId);
    const scroller = hero?.closest<HTMLElement>(".layout-container");
    if (!hero || !scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const p = (scroller.scrollTop - hero.offsetTop) / hero.offsetHeight;
      hero.style.setProperty("--hero-p", Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      hero.style.removeProperty("--hero-p");
    };
  }, [targetId]);

  return null;
}
