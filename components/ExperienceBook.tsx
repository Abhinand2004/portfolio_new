"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ArrowDown, ArrowUpRight, Trophy } from "lucide-react";
import { EDUCATION, EXPERIENCE, formatDuration, formatPeriod, type Experience } from "@/lib/data";

const CHAPTERS = EXPERIENCE.length;
// Cover + prologue + one leaf per role; the epilogue is printed on the last page under the stack
const LEAVES = CHAPTERS + 2;

// Scroll timeline in arbitrary units: lead-in, flip/hold per leaf, closing hold
const LEAD = 0.5;
const FLIP = 1;
const HOLD = 0.75;
const TAIL = 0.9;
const TOTAL = LEAD + LEAVES * FLIP + (LEAVES - 1) * HOLD + TAIL;

const Z_TURNING = 60;
const Z_CAST = 55;

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const pad2 = (n: number) => String(n).padStart(2, "0");
const leafProgress = (u: number, k: number) => easeInOut(clamp((u - LEAD - k * (FLIP + HOLD)) / FLIP));

function Page({ side, folio, children }: { side: "left" | "right"; folio?: string; children: ReactNode }) {
  return (
    <div className={`bk-page bk-page--${side}`}>
      <div className="bk-page-inner">{children}</div>
      {folio && <span className="bk-folio">{folio}</span>}
    </div>
  );
}

function CoverArt() {
  return (
    <svg className="bk-cover-art" viewBox="0 0 200 170" aria-hidden="true">
      <defs>
        <radialGradient id="bkc-glow" cx="100" cy="100" r="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd59a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd59a" stopOpacity="0" />
        </radialGradient>
        <clipPath id="bkc-arch">
          <path d="M30 150V70a70 70 0 0 1 140 0v80Z" />
        </clipPath>
      </defs>

      <path d="M30 150V70a70 70 0 0 1 140 0v80Z" fill="#1c4a4f" stroke="#f3e3c3" strokeOpacity="0.35" />
      <g clipPath="url(#bkc-arch)">
        <circle cx="145" cy="38" r="10" fill="#f3e3c3" />
        <circle cx="150" cy="34" r="9" fill="#1c4a4f" />
        {[
          [55, 30],
          [76, 17],
          [118, 20],
          [60, 56],
          [163, 64],
          [95, 36],
        ].map(([x, y], i) => (
          <circle key={i} className="bkc-star" cx={x} cy={y} r="1.3" style={{ animationDelay: `${i * 0.45}s` }} />
        ))}
        <text x="44" y="86" className="bkc-code">{"</>"}</text>
        <text x="140" y="84" className="bkc-code">{"{ }"}</text>
        <circle className="bkc-glow" cx="100" cy="100" r="62" fill="url(#bkc-glow)" />
      </g>

      {/* Boy */}
      <path d="M84 104c2-8 30-8 32 0" fill="#c97f37" />
      <path d="M64 150c0-32 14-46 36-46s36 14 36 46Z" fill="#e69e51" />
      <path d="M95 106l-1 12M105 106l1 12" stroke="#f3e3c3" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="95" y="92" width="10" height="12" fill="#c98a5e" />
      <circle cx="83" cy="82" r="3.5" fill="#d99a6c" />
      <circle cx="117" cy="82" r="3.5" fill="#d99a6c" />
      <circle cx="100" cy="80" r="17" fill="#e3a77a" />
      <path d="M82 78c-2-18 12-22 22-20 12 0 18 8 14 20-4-8-12-10-18-8-6-4-14 0-18 8Z" fill="#2a1a12" />
      <path d="M81 80a19 19 0 0 1 38 0" fill="none" stroke="#f3e3c3" strokeWidth="3" />
      <rect x="77" y="75" width="6" height="12" rx="2.5" fill="#f3e3c3" />
      <rect x="117" y="75" width="6" height="12" rx="2.5" fill="#f3e3c3" />
      <path d="M92 84q2.5 2 5 0M103 84q2.5 2 5 0" fill="none" stroke="#2a1a12" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M96 91q4 3 8 0" fill="none" stroke="#8a4b2a" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="90" cy="89" r="2.2" fill="#e57b6a" opacity="0.35" />
      <circle cx="110" cy="89" r="2.2" fill="#e57b6a" opacity="0.35" />
      <path d="M74 120q-7 7-5 14M126 120q7 7 5 14" fill="none" stroke="#e69e51" strokeWidth="9" strokeLinecap="round" />
      <circle cx="69" cy="134" r="4.5" fill="#e3a77a" />
      <circle cx="131" cy="134" r="4.5" fill="#e3a77a" />

      {/* Desk, laptop, mug, plant */}
      <rect x="18" y="136" width="164" height="7" rx="2" fill="#8a5a33" />
      <rect x="26" y="143" width="148" height="27" fill="#6d4426" opacity="0.55" />
      <path d="M70 136l4-32h52l4 32Z" fill="#e9dcc4" />
      <text x="100" y="125" textAnchor="middle" className="bkc-logo">{"</>"}</text>
      <rect x="64" y="134" width="72" height="3" rx="1.5" fill="#cfc0a3" />

      <path className="bkc-steam" d="M150 116q-3-5 0-10t0-10" />
      <path className="bkc-steam" d="M156 116q-3-5 0-10t0-10" style={{ animationDelay: "1.2s" }} />
      <rect x="146" y="120" width="14" height="16" rx="2.5" fill="#f3e3c3" />
      <path d="M160 124q6 0 6 5t-6 5" fill="none" stroke="#f3e3c3" strokeWidth="2.5" />

      <ellipse cx="36" cy="113" rx="4" ry="10" fill="#6fa37a" transform="rotate(-25 36 113)" />
      <ellipse cx="45" cy="112" rx="4" ry="10" fill="#5b8f67" transform="rotate(22 45 112)" />
      <ellipse cx="40" cy="107" rx="3.5" ry="11" fill="#7cb387" />
      <path d="M30 136l3-14h14l3 14Z" fill="#c97f37" />
    </svg>
  );
}

function Cover() {
  return (
    <div className="bk-cover">
      <div className="bk-cover-frame">
        <span className="bk-cover-kicker">Vol. I · A developer&apos;s journey</span>
        <h3 className="bk-cover-title">
          The Career
          <em>Story</em>
        </h3>
        <CoverArt />
        <div className="bk-cover-foot">
          <p className="bk-cover-author">Abhinand C.</p>
          <p className="bk-cover-meta">{EXPERIENCE[0].start.slice(0, 4)} — Present</p>
        </div>
      </div>
    </div>
  );
}

function Contents() {
  return (
    <Page side="left" folio="i">
      <span className="bk-kicker">Contents</span>
      <h4 className="bk-heading">
        In this <em>book</em>
      </h4>
      <ol className="bk-toc">
        <li>
          <b>—</b>
          <span className="bk-toc-name">
            Prologue
            <small>Where it began</small>
          </span>
          <i className="bk-toc-dots" />
          <span className="bk-toc-page">1</span>
        </li>
        {EXPERIENCE.map((job, i) => (
          <li key={job.company}>
            <b>{pad2(i + 1)}</b>
            <span className="bk-toc-name">
              {job.company}
              <small>{job.chapter}</small>
            </span>
            <i className="bk-toc-dots" />
            <span className="bk-toc-page">{i * 2 + 2}</span>
          </li>
        ))}
        <li>
          <b>—</b>
          <span className="bk-toc-name">Epilogue</span>
          <i className="bk-toc-dots" />
          <span className="bk-toc-page">{CHAPTERS * 2 + 3}</span>
        </li>
      </ol>
      <p className="bk-epigraph">Every role a chapter, every project a page.</p>
    </Page>
  );
}

function ChapterStory({ job, index }: { job: Experience; index: number }) {
  return (
    <Page side="right" folio={String(index * 2 + 3)}>
      <header className="bk-running">
        <span>Chapter {pad2(index + 1)}</span>
        <span>{job.type}</span>
      </header>
      <div className="bk-chapter-head">
        <span className="bk-year">{job.start.slice(0, 4)}</span>
        <span className="bk-kicker">{job.chapter}</span>
        <h3 className="bk-company">{job.company}</h3>
        <p className="bk-role">{job.role}</p>
      </div>
      <ul className="bk-meta">
        <li>
          <b>{formatPeriod(job)}</b>
          <span>{formatDuration(job)}</span>
        </li>
        <li>
          <span>
            {job.location} · {job.workMode}
          </span>
          {job.current && (
            <span className="bk-now">
              <span className="pulse-dot" />
              Now
            </span>
          )}
        </li>
      </ul>
      <div className="bk-story bk-story--chapter">
        {job.story.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Page>
  );
}

function ChapterNotes({ job, index }: { job: Experience; index: number }) {
  return (
    <Page side="left" folio={String(index * 2 + 2)}>
      <header className="bk-running">
        <span>{job.company}</span>
        <span>Notes</span>
      </header>
      <span className="bk-kicker">Chapter {pad2(index + 1)} · Highlights</span>
      <h4 className="bk-heading">
        What I <em>did</em>
      </h4>
      <ol className="bk-points">
        {job.highlights.map((h, i) => (
          <li key={h}>
            <b>{pad2(i + 1)}</b>
            <span>{h}</span>
          </li>
        ))}
      </ol>
      <div className="bk-notes-foot">
        {job.milestone && (
          <p className="bk-award">
            <Trophy size={14} strokeWidth={1.75} />
            {job.milestone}
          </p>
        )}
        <div className="bk-stack">
          <span className="bk-label">Tools of the trade</span>
          <ul>
            {job.skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </Page>
  );
}

function LookingBack() {
  return (
    <Page side="left" folio={String(CHAPTERS * 2 + 2)}>
      <header className="bk-running">
        <span>Looking back</span>
        <span>So far</span>
      </header>
      <span className="bk-kicker">Looking back</span>
      <h4 className="bk-heading">
        The road <em>so far</em>
      </h4>
      <ol className="bk-points">
        <li>
          <b>+2</b>
          <span>Computer Science — the first spark.</span>
        </li>
        <li>
          <b>Dip.</b>
          <span>
            {EDUCATION.qualification}, {EDUCATION.institution}.
          </span>
        </li>
        {EXPERIENCE.map((job) => (
          <li key={job.company}>
            <b>{job.start.slice(0, 4)}</b>
            <span>
              {job.company} — {job.chapter.toLowerCase()}.
            </span>
          </li>
        ))}
      </ol>
      <p className="bk-epigraph">One chapter at a time.</p>
    </Page>
  );
}

function Epilogue() {
  return (
    <Page side="right" folio={String(CHAPTERS * 2 + 3)}>
      <header className="bk-running">
        <span>Epilogue</span>
        <span>To be continued</span>
      </header>
      <div className="bk-epilogue">
        <span className="bk-kicker">The next chapter</span>
        <h3 className="bk-epilogue-title">
          Still being <em>written.</em>
        </h3>
        <p>Open to new roles, freelance builds and collaborations — let&apos;s make the next page a good one.</p>
        <a href="#contact" className="bk-epilogue-link" tabIndex={-1}>
          Let&apos;s write it together
          <ArrowUpRight size={14} strokeWidth={1.75} />
        </a>
      </div>
    </Page>
  );
}

function Prologue() {
  return (
    <Page side="right" folio="1">
      <header className="bk-running">
        <span>Prologue</span>
        <span>Before the chapters</span>
      </header>
      <div className="bk-chapter-head">
        <span className="bk-year">+2</span>
        <h3 className="bk-company">Where it began</h3>
        <p className="bk-role">Higher Secondary · Computer Science</p>
      </div>
      <p className="bk-summary">
        It started in my Plus Two computer science class — the first time I wrote code and watched a machine do
        exactly what I told it to. That curiosity stuck, and it never really switched off.
      </p>
      <div className="bk-story">
        <p>
          After school, I went on to a {EDUCATION.qualification} at {EDUCATION.institution}. Long lab hours, first
          real projects and the small thrill of finally fixing a stubborn bug — that&apos;s where the hobby started to
          look like a future.
        </p>
        <p>
          Somewhere in those years, the decision made itself: this wouldn&apos;t stay just an interest. It would be my
          <em> profession.</em>
        </p>
      </div>
    </Page>
  );
}

// Each spread pairs a leaf's back (left page) with the next leaf's front (right page)
const LEAF_FACES: { front: ReactNode; back: ReactNode; key: string }[] = [
  { key: "cover", front: <Cover />, back: <Contents /> },
  { key: "prologue", front: <Prologue />, back: <ChapterNotes job={EXPERIENCE[0]} index={0} /> },
  ...EXPERIENCE.map((job, i) => ({
    key: job.company,
    front: <ChapterStory job={job} index={i} />,
    back: i + 1 < CHAPTERS ? <ChapterNotes job={EXPERIENCE[i + 1]} index={i + 1} /> : <LookingBack />,
  })),
];

function chapterLabel(turned: number) {
  if (turned === 0) return "Cover";
  if (turned === 1) return "Prologue · Where it began";
  if (turned > CHAPTERS + 1) return "Epilogue";
  return `Chapter ${pad2(turned - 1)} · ${EXPERIENCE[turned - 2].company}`;
}

export default function ExperienceSection() {
  const reduced = useReducedMotion() ?? false;

  const sectionRef = useRef<HTMLElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const castLRef = useRef<HTMLSpanElement>(null);
  const castRRef = useRef<HTMLSpanElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const turnedRef = useRef(0);
  const [turned, setTurned] = useState(0);

  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 120, damping: 30, mass: 0.6 });
  const hintOpacity = useTransform(progress, [0, 0.03], [1, 0]);
  const barScale = useTransform(smooth, [0, 1], [0, 1]);

  // Pinned-stage scroll progress, read from the page's scroll container
  useEffect(() => {
    const section = sectionRef.current;
    const scroller = section?.closest<HTMLElement>(".layout-container");
    if (!section || !scroller) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const range = section.offsetHeight - scroller.clientHeight;
      progress.set(clamp((scroller.scrollTop - section.offsetTop) / (range || 1)));
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
  }, [progress]);

  // One motion value drives every leaf, written straight to the DOM
  useEffect(() => {
    const source = reduced ? progress : smooth;

    const apply = (p: number) => {
      const u = p * TOTAL;
      let castL = 0;
      let castR = 0;
      let count = 0;
      const eases = Array.from({ length: LEAVES }, (_, k) => leafProgress(u, k));
      let lastTurned = -1;
      let firstUnturned = LEAVES;
      eases.forEach((e, k) => {
        if (e >= 1) lastTurned = k;
        if (e <= 0 && firstUnturned === LEAVES) firstUnturned = k;
      });

      for (let k = 0; k < LEAVES; k++) {
        const e = eases[k];
        const bend = Math.sin(Math.PI * e);
        if (e >= 0.5) count++;
        if (e > 0 && e < 1) {
          if (e < 0.5) castR = Math.sin(2 * Math.PI * e);
          else castL = Math.sin(2 * Math.PI * (e - 0.5));
        }

        const leaf = leafRefs.current[k];
        if (!leaf) continue;
        leaf.style.transform = `perspective(3200px) rotateY(${(-180 * e).toFixed(2)}deg)`;
        leaf.style.zIndex = String(e > 0 && e < 1 ? Z_TURNING : e >= 1 ? k + 1 : LEAVES - k);
        leaf.style.setProperty("--bend", bend.toFixed(3));
        // Coplanar leaves can ignore z-index in 3D, so hide any page that's buried in the stack
        const visible = (e > 0 && e < 1) || k === lastTurned || k === firstUnturned;
        leaf.style.visibility = visible ? "visible" : "hidden";
      }

      const book = bookRef.current;
      if (book) {
        book.style.setProperty("--open", leafProgress(u, 0).toFixed(4));
        book.style.setProperty("--exit", clamp((u - (TOTAL - TAIL * 0.5)) / (TAIL * 0.5)).toFixed(4));
      }
      if (castLRef.current) castLRef.current.style.opacity = (castL * 0.5).toFixed(3);
      if (castRRef.current) castRRef.current.style.opacity = (castR * 0.5).toFixed(3);

      if (count !== turnedRef.current) {
        turnedRef.current = count;
        setTurned(count);
      }
    };

    apply(source.get());
    return source.on("change", apply);
  }, [reduced, progress, smooth]);

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="bk"
      aria-labelledby="bk-title"
      style={{ "--bk-leaves": LEAVES } as CSSProperties}
    >
      <div className="bk-stage">
        <span className="bg-script bk-script" aria-hidden="true">
          Chapters
        </span>

        <header className="bk-head">
          <div className="section-label">
            Career <span>Journey</span>
          </div>
          <h2 id="bk-title" className="bk-title">
            The story <em>so far</em>
          </h2>
        </header>

        <div className="bk-scene" aria-hidden="true">
          <div ref={bookRef} className="bk-book">
            <span className="bk-shadow" />
            <span className="bk-block bk-block--left" />
            <span className="bk-block bk-block--right" />
            <div className="bk-base">
              <Epilogue />
            </div>
            <span ref={castLRef} className="bk-cast bk-cast--left" style={{ zIndex: Z_CAST }} />
            <span ref={castRRef} className="bk-cast bk-cast--right" style={{ zIndex: Z_CAST }} />
            <span className="bk-spine" />

            {LEAF_FACES.map((leaf, k) => (
              <div
                key={leaf.key}
                ref={(el) => {
                  leafRefs.current[k] = el;
                }}
                className="bk-leaf"
                style={{ zIndex: LEAVES - k }}
              >
                <div className="bk-face bk-face--front">
                  {leaf.front}
                  <span className="bk-shade" />
                </div>
                <div className="bk-face bk-face--back">
                  {leaf.back}
                  <span className="bk-shade" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="bk-foot" aria-hidden="true">
          <motion.span className="bk-hint" style={{ opacity: hintOpacity }}>
            <ArrowDown size={13} strokeWidth={1.75} />
            Scroll to turn the page
          </motion.span>
          <div className="bk-progress">
            <span className="bk-progress-label">{chapterLabel(turned)}</span>
            <span className="bk-progress-track">
              <motion.i style={{ scaleX: barScale }} />
            </span>
          </div>
        </footer>

        <ol className="sr-only">
          <li>
            <h3>Prologue</h3>
            <p>
              Started with Computer Science in Higher Secondary (+2), then completed a {EDUCATION.qualification} at{" "}
              {EDUCATION.institution}, where I decided to turn the interest into a profession.
            </p>
          </li>
          {EXPERIENCE.map((j) => (
            <li key={j.company}>
              <h3>
                {j.role} at {j.company}
              </h3>
              <p>
                {formatPeriod(j)} · {j.type} · {j.location} · {j.workMode}
              </p>
              {j.milestone && <p>{j.milestone}</p>}
              {j.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <ul>
                {j.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <p>Skills: {j.skills.join(", ")}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
