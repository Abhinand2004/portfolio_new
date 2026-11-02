"use client";

import { useEffect, useRef } from "react";

// Beyond this distance (in viewports) a smooth scroll would drag through every pinned,
// scroll-driven section in between, so we jump most of the way behind a quick veil instead.
const FAST_TRAVEL_VIEWPORTS = 1.5;
// How much of the final approach is still smooth-scrolled, so the target section animates in
const APPROACH_VIEWPORTS = 0.6;
const VEIL_MS = 220;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
// rAF pauses in background tabs, so never let the veil hang waiting on it
const nextFrame = () =>
  Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), wait(60)]);

function scrollEnd(scroller: HTMLElement) {
  return new Promise<void>((resolve) => {
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      scroller.removeEventListener("scrollend", done);
      resolve();
    };
    scroller.addEventListener("scrollend", done, { once: true });
    // Fallback for browsers without `scrollend`
    timer = window.setTimeout(done, 1400);
  });
}

export default function SmoothAnchors() {
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".layout-container");
    if (!scroller) return;
    let travelling = false;

    const travel = async (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const target = id === "top" ? 0 : el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      const vh = scroller.clientHeight;
      const distance = target - scroller.scrollTop;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        scroller.scrollTo({ top: target, behavior: "instant" });
        return;
      }
      if (Math.abs(distance) <= vh * FAST_TRAVEL_VIEWPORTS) {
        scroller.scrollTo({ top: target, behavior: "smooth" });
        return;
      }

      const veil = veilRef.current;
      travelling = true;
      // Snap points along the way would otherwise grab the instant jump
      scroller.style.scrollSnapType = "none";
      try {
        veil?.classList.add("is-on");
        await wait(VEIL_MS);

        const approach = Math.min(vh * APPROACH_VIEWPORTS, Math.abs(distance));
        scroller.scrollTo({ top: target - Math.sign(distance) * approach, behavior: "instant" });
        await nextFrame();

        veil?.classList.remove("is-on");
        scroller.scrollTo({ top: target, behavior: "smooth" });
        await scrollEnd(scroller);
      } finally {
        veil?.classList.remove("is-on");
        scroller.style.scrollSnapType = "";
        travelling = false;
      }
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href^='#']");
      const id = link?.getAttribute("href")?.slice(1);
      if (!link || !id || !document.getElementById(id)) return;
      // Stops Next's <Link> from running its own hash navigation
      e.preventDefault();
      if (travelling) return;
      history.pushState(null, "", `#${id}`);
      void travel(id);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <div ref={veilRef} className="nav-veil" aria-hidden="true" />;
}
