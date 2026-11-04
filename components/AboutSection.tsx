"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Hand, QrCode, RotateCw } from "lucide-react";

// *word* marks an accent word (serif italic, amber)
// First entry is the lead line, the second the supporting paragraph
const MANIFESTO = [
  "Hi, I'm Abhinand — a software engineer from *Kerala* who builds with *modern* technology.",
  "I work across diverse stacks, stay ahead of evolving technologies, and bring ideas to *life* through complete development and deployment pipelines. I collaborate with clients, understand their needs, and turn their ideas into *reliable,* *scalable* products that work as good as they *look.*",
];

let wordIndex = 0;
const PARAGRAPHS = MANIFESTO.map((para) =>
  para.split(" ").map((token) => {
    const accent = /^\*.+\*[.,:]?$/.test(token);
    return { text: accent ? token.replace(/\*/g, "") : token, accent, index: wordIndex++ };
  }),
);
const WORD_COUNT = wordIndex;

const BARCODE = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1, 3, 2, 4, 1, 2];

// Card hangs from (140, 0) in strap space; the hook rests 160px below
const STRAP_LEN = 160;
const AUTO_FLIP_AT = 0.74;

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

function Word({
  text,
  accent,
  progress,
  range,
}: {
  text: string;
  accent: boolean;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, ["0.35em", "0em"]);
  return (
    <motion.span className={accent ? "ax-w ax-w--accent" : "ax-w"} style={{ opacity, y }}>
      {text}
    </motion.span>
  );
}

function useKeralaTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

export default function AboutSection() {
  const reduced = useReducedMotion();
  const time = useKeralaTime();

  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const strapWeaveRef = useRef<SVGPathElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const draggingRef = useRef(false);
  const manualFlipRef = useRef(false);
  const autoFlipRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, initX: 0, initY: 0 });
  const phys = useRef({
    x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0,
    angle: 0, vAngle: 0, rotX: 0, rotY: 0, flip: 0,
  });

  // enter: 0 → 1 while the section slides up over the hero
  // progress: 0 → 1 across the pinned stage
  const enter = useMotionValue(0);
  const progress = useMotionValue(0);
  const enterS = useSpring(enter, { stiffness: 90, damping: 22, mass: 0.6 });
  const progressS = useSpring(progress, { stiffness: 110, damping: 28, mass: 0.5 });

  const rigY = useTransform(enterS, [0.78, 1], [-720, 0], { clamp: true });
  const headOpacity = useTransform(enterS, [0.55, 1], [0, 1]);
  const headY = useTransform(enterS, [0.55, 1], [-16, 0]);
  const glowScale = useTransform(progressS, [0, 1], [0.8, 1.15]);
  const wordX = useTransform(progressS, [0, 1], ["4vw", "-38vw"]);
  const wordOpacity = useTransform(enterS, [0.4, 1], [0, 1]);
  const copyY = useTransform(progressS, [0, 1], ["5vh", "-3vh"]);
  const signClip = useTransform(progressS, [0.8, 0.95], ["inset(-20% 100% -20% 0%)", "inset(-20% 0% -20% 0%)"]);
  const signOpacity = useTransform(progressS, [0.78, 0.84], [0, 1]);
  const railScale = useTransform(progressS, [0, 1], [0, 1]);

  // Scroll → progress values, plus a pendulum kick from scroll velocity
  useEffect(() => {
    const section = sectionRef.current;
    const scroller = section?.closest<HTMLElement>(".layout-container");
    if (!section || !scroller) return;
    if (reduced) {
      enter.set(1);
      progress.set(1);
      return;
    }

    let raf = 0;
    let last = scroller.scrollTop;
    const update = () => {
      raf = 0;
      const top = scroller.scrollTop;
      const vh = scroller.clientHeight;
      const rel = top - section.offsetTop;
      const p = clamp(rel / (section.offsetHeight - vh));
      enter.set(clamp(1 + rel / vh));
      progress.set(p);
      autoFlipRef.current = p > AUTO_FLIP_AT;

      const delta = top - last;
      last = top;
      if (rel > -vh && rel < section.offsetHeight) {
        phys.current.vAngle += clamp(delta * 0.006, -0.8, 0.8);
        phys.current.vx += clamp(delta * 0.02, -1.5, 1.5);
      }
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
    };
  }, [reduced, enter, progress]);

  // Spring-damped pendulum, written straight to the DOM each frame
  useEffect(() => {
    let t = 0;
    let frame = 0;
    const loop = () => {
      t += 0.025;
      const s = phys.current;

      if (!draggingRef.current) {
        const sway = reduced ? 0 : Math.sin(t * 1.2) * 10;
        const bob = reduced ? 0 : Math.cos(t * 1.5) * 5;
        s.vx = (s.vx - 0.08 * (s.x - sway)) * 0.88;
        s.vy = (s.vy - 0.08 * (s.y - bob)) * 0.88;
        s.x += s.vx;
        s.y += s.vy;
        s.vAngle = (s.vAngle + ((s.x / 140) * 22 - s.angle) * 0.1) * 0.86;
        s.angle += s.vAngle;
        s.rotY += (s.vx * 0.7 - s.rotY) * 0.12;
        s.rotX += (-s.vy * 0.5 - s.rotX) * 0.12;
      } else {
        s.vx = (s.targetX - s.x) * 0.45;
        s.vy = (s.targetY - s.y) * 0.45;
        s.x += s.vx;
        s.y += s.vy;
        s.angle += ((s.x / 180) * 36 - s.angle) * 0.3;
        s.rotY = s.x / 10;
        s.rotX = -s.y / 15;
      }

      const flipTarget = manualFlipRef.current !== autoFlipRef.current ? 180 : 0;
      s.flip += (flipTarget - s.flip) * 0.1;

      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotateZ(${s.angle}deg) rotateY(${s.rotY + s.flip}deg) rotateX(${s.rotX}deg)`;
        cardRef.current.dataset.side = s.flip > 90 ? "back" : "front";
      }
      if (sheenRef.current) {
        sheenRef.current.style.backgroundPosition = `${50 + s.x * 0.6}% ${50 + s.rotY * 2}%`;
      }
      if (strapRef.current && strapWeaveRef.current) {
        const hx = 140 + s.x;
        const hy = STRAP_LEN + s.y;
        const d = `M 140 0 C ${140 + s.x * 0.15} ${STRAP_LEN / 2}, ${hx} ${hy - 40}, ${hx} ${hy}`;
        strapRef.current.setAttribute("d", d);
        strapWeaveRef.current.setAttribute("d", d);
      }

      frame = requestAnimationFrame(loop);
    };

    // Only simulate while the card can actually be seen
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!frame) frame = requestAnimationFrame(loop);
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    io.observe(section);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const s = phys.current;
      const d = dragStart.current;
      s.targetX = clamp(d.initX + e.clientX - d.x, -240, 240);
      s.targetY = clamp(d.initY + e.clientY - d.y, -60, 170);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      phys.current.vx *= 1.4;
      phys.current.vy *= 1.4;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onCardPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    setHasInteracted(true);
    dragStart.current = { x: e.clientX, y: e.clientY, initX: phys.current.x, initY: phys.current.y };
  };

  const toggleFlip = () => {
    manualFlipRef.current = !manualFlipRef.current;
    setHasInteracted(true);
  };

  const n = WORD_COUNT;
  const renderWords = (words: (typeof PARAGRAPHS)[number]) =>
    words.map((w) => {
      const start = 0.04 + (w.index / n) * 0.66;
      return <Word key={w.index} text={w.text} accent={w.accent} progress={progressS} range={[start, start + 0.07]} />;
    });

  return (
    <section id="about" ref={sectionRef} className="ax" aria-label="About">
      <div className="ax-stage">
        <div className="ax-bg" aria-hidden="true" />
        <motion.div className="ax-glow" style={{ scale: glowScale }} aria-hidden="true" />
        <motion.div className="ax-word" style={{ x: wordX, opacity: wordOpacity }} aria-hidden="true">
          about me
        </motion.div>

        <motion.header className="ax-head" style={{ opacity: headOpacity, y: headY }}>
          <span className="ax-head-label">
            <b>01</b> About
          </span>
          <span className="ax-clock">
            <i aria-hidden="true" />
            Kerala, IN {time && `· ${time} IST`}
          </span>
        </motion.header>

        <div className="ax-grid">
          <div className="ax-lanyard">
            <motion.div className="ax-rig" style={{ y: rigY, perspective: 1200 }}>
              <div className="ax-ribbon" aria-hidden="true" />
              <svg className="ax-strap" viewBox="0 0 280 160" aria-hidden="true">
                <path
                  ref={strapRef}
                  d={`M 140 0 C 140 60, 140 100, 140 ${STRAP_LEN}`}
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                <path
                  ref={strapWeaveRef}
                  d={`M 140 0 C 140 60, 140 100, 140 ${STRAP_LEN}`}
                  fill="none"
                  stroke="#3a3a3a"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              </svg>

              <div
                ref={cardRef}
                className={`ax-card${isDragging ? " is-dragging" : ""}`}
                onPointerDown={onCardPointerDown}
              >
                <div className="ax-clasp" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>

                {/* Front */}
                <div className="ax-face">
                  <div ref={sheenRef} className="ax-sheen" aria-hidden="true" />
                  <div className="ax-slot" />
                  <div className="ax-meta">
                    <span>
                      <span className="ax-dot" />
                      Visitor pass
                    </span>
                    <b>N° 001</b>
                  </div>
                  <div className="ax-photo">
                    <Image src="/user5.png" alt="Abhinand C" fill sizes="290px" draggable={false} />
                    <span className="ax-photo-tag">ABOUT / 2026</span>
                  </div>
                  <div className="ax-id">
                    <div>
                      <h3>
                        Abhinand <em>C.</em>
                      </h3>
                      <p>Software Engineer · Kerala</p>
                    </div>
                    <button type="button" className="ax-flip" onClick={toggleFlip} aria-label="Flip the pass">
                      <RotateCw size={12} />
                    </button>
                  </div>
                  <div className="ax-barcode" aria-hidden="true">
                    {BARCODE.map((w, i) => (
                      <span key={i} style={{ width: w * 1.6 }} />
                    ))}
                  </div>
                </div>

                {/* Back */}
                <div className="ax-face ax-face--back">
                  <div className="ax-slot" />
                  <p className="ax-back-title">
                    Made in <b>Kerala</b>,
                    <br />
                    shipped worldwide.
                  </p>
                  <dl className="ax-specs">
                    <div>
                      <dt>ROLE</dt>
                      <dd>Software Engineer</dd>
                    </div>
                    <div>
                      <dt>BUILDS</dt>
                      <dd>Web · Mobile · APIs</dd>
                    </div>
                    <div>
                      <dt>WORKS</dt>
                      <dd>Remote / On-site</dd>
                    </div>
                    <div>
                      <dt>STATUS</dt>
                      <dd className="is-live">Open to work</dd>
                    </div>
                  </dl>
                  <div className="ax-back-foot">
                    <span className="ax-qr" aria-hidden="true">
                      <QrCode size={40} />
                    </span>
                    <button type="button" className="ax-flip" onClick={toggleFlip}>
                      <RotateCw size={11} /> Flip back
                    </button>
                  </div>
                </div>
              </div>

              <span className={`ax-hint${hasInteracted ? " is-gone" : ""}`}>
                <Hand size={13} strokeWidth={1.75} />
                Grab the pass
              </span>
            </motion.div>
          </div>

          <motion.div className="ax-copy" style={{ y: copyY }}>
            <p className="ax-manifesto">{renderWords(PARAGRAPHS[0])}</p>
            <p className="ax-body">{renderWords(PARAGRAPHS[1])}</p>
            <motion.div className="ax-sign" style={{ opacity: signOpacity }}>
              <small>— Yours truly</small>
              <motion.span style={{ clipPath: signClip }}>Abhinand</motion.span>
            </motion.div>
          </motion.div>
        </div>

        <div className="ax-rail">
          <span>Scroll</span>
          <div className="ax-rail-track">
            <motion.i style={{ scaleX: railScale }} />
          </div>
          <a href="#experience">Next — Journey</a>
        </div>
      </div>
    </section>
  );
}
