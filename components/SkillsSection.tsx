"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Wind } from "lucide-react";
import {
  siAndroidstudio,
  siAppstore,
  siClaude,
  siCloudinary,
  siCss,
  siDocker,
  siExpo,
  siExpress,
  siFramer,
  siGit,
  siGithub,
  siGo,
  siGoogle,
  siGoogleplay,
  siGraphql,
  siHtml5,
  siInstagram,
  siJavascript,
  siJsonwebtokens,
  siMeta,
  siMongodb,
  siMongoose,
  siMui,
  siMysql,
  siNativescript,
  siNestjs,
  siNetlify,
  siNextdotjs,
  siNodedotjs,
  siOllama,
  siPostgresql,
  siPostman,
  siPrisma,
  siReact,
  siRedux,
  siSentry,
  siSqlite,
  siTailwindcss,
  siTensorflow,
  siTypescript,
  siVercel,
  siVite,
  siWhatsapp,
  siWoocommerce,
  siWordpress,
  siXcode,
  siGooglemaps,
  type SimpleIcon,
} from "simple-icons";

import { cn } from "@/lib/utils";
import { SKILL_GROUPS } from "@/lib/data";

const ICONS: Record<string, SimpleIcon> = {
  "React.js": siReact,
  "Next.js": siNextdotjs,
  "NestJS": siNestjs,
  JavaScript: siJavascript,
  TypeScript: siTypescript,
  HTML5: siHtml5,
  CSS3: siCss,
  CSS: siCss,
  "Tailwind CSS": siTailwindcss,
  Tailwind: siTailwindcss,
  NativeWind: siNativescript,
  "Material UI": siMui,
  Redux: siRedux,
  "Framer Motion": siFramer,
  Vite: siVite,
  "Node.js": siNodedotjs,
  "Express.js": siExpress,
  JWT: siJsonwebtokens,
  "React Native": siReact,
  Expo: siExpo,
  EAS: siExpo,
  SQLite: siSqlite,
  MongoDB: siMongodb,
  Mongoose: siMongoose,
  PostgreSQL: siPostgresql,
  Prisma: siPrisma,
  "Meta APIs": siMeta,
  "WhatsApp Business Platform": siWhatsapp,
  "Instagram & Facebook": siInstagram,
  "Google OAuth": siGoogle,
  Cloudinary: siCloudinary,
  Ollama: siOllama,
  "TensorFlow.js": siTensorflow,
  Git: siGit,
  GitHub: siGithub,
  Postman: siPostman,
  Docker: siDocker,
  Xcode: siXcode,
  "Android Studio": siAndroidstudio,
  Vercel: siVercel,
  Netlify: siNetlify,
  "Play Console": siGoogleplay,
  TestFlight: siAppstore,
  "App Store Connect": siAppstore,
  Claude: siClaude,
  Sentry: siSentry,
  Geo: siGooglemaps,
  SQL: siMysql,
  "Meta API": siMeta,
  "WordPress REST API": siWordpress,
  WPGraphQL: siGraphql,
  WooCommerce: siWoocommerce,
  "Go (basics)": siGo,
  Go: siGo,
};

// Must match the .sn-c* paper colours in globals.css
const PAPER_COUNT = 8;

type SkillNote = { name: string; group: string; color: number; no: number };
type Slot = { key: string; seed: number; skill: SkillNote };

function normalizeSkillKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const REQUESTED_SKILL_ORDER = [
  "git",
  "gitub",
  "nextjs",
  "reactjs",
  "reactnative",
  "nodejs",
  "nestjs",
  "express",
  "mongodb",
  "seo",
  "geo",
  "sql",
  "docker",
  "playconsole",
  "testflight",
  "prisma",
  "expo",
  "claude",
  "senty",
  "meta api",
  "js",
  "ts",
  "html",
  "css",
  "tailwing",
  "nativewind",
  "go",
  "jwt",
] as const;

const REQUESTED_SKILL_MAPPING: Record<string, { name: string; sourceKey: string; group?: string; color?: number }> = {
  git: { name: "Git", sourceKey: "git" },
  gitub: { name: "GitHub", sourceKey: "github" },
  nextjs: { name: "Next.js", sourceKey: "nextjs" },
  reactjs: { name: "React.js", sourceKey: "reactjs" },
  reactnative: { name: "React Native", sourceKey: "reactnative" },
  nodejs: { name: "Node.js", sourceKey: "nodejs" },
  nestjs: { name: "NestJS", sourceKey: "nestjs", group: "Backend", color: 1 },
  express: { name: "Express", sourceKey: "expressjs" },
  mongodb: { name: "MongoDB", sourceKey: "mongodb" },
  seo: { name: "SEO", sourceKey: "seofundamentals" },
  geo: { name: "Geo", sourceKey: "geo", group: "Integrations", color: 4 },
  sql: { name: "SQL", sourceKey: "sql", group: "Databases", color: 3 },
  docker: { name: "Docker", sourceKey: "docker" },
  playconsole: { name: "Play Console", sourceKey: "playconsole" },
  testflight: { name: "TestFlight", sourceKey: "testflight" },
  prisma: { name: "Prisma", sourceKey: "prisma" },
  expo: { name: "Expo", sourceKey: "expo" },
  claude: { name: "Claude", sourceKey: "claude", group: "AI & Emerging", color: 5 },
  senty: { name: "Sentry", sourceKey: "sentry", group: "Tools & Platforms", color: 6 },
  "meta api": { name: "Meta API", sourceKey: "metaapis" },
  js: { name: "JavaScript", sourceKey: "javascript" },
  ts: { name: "TypeScript", sourceKey: "typescript" },
  html: { name: "HTML", sourceKey: "html5" },
  css: { name: "CSS", sourceKey: "css3" },
  tailwing: { name: "Tailwind", sourceKey: "tailwindcss" },
  nativewind: { name: "NativeWind", sourceKey: "nativewind" },
  go: { name: "Go", sourceKey: "gobasics" },
  jwt: { name: "JWT", sourceKey: "jwt" },
};

const SKILL_NOTES: SkillNote[] = (() => {
  const sourceByKey = new Map<string, Omit<SkillNote, "no">>();
  SKILL_GROUPS.forEach((g, gi) =>
    g.items.forEach((name) => {
      const key = normalizeSkillKey(name);
      if (sourceByKey.has(key)) return;
      sourceByKey.set(key, { name, group: g.title, color: gi % PAPER_COUNT });
    })
  );

  const used = new Set<string>();
  const ordered: Omit<SkillNote, "no">[] = [];

  for (const skill of REQUESTED_SKILL_ORDER) {
    const mapped = REQUESTED_SKILL_MAPPING[skill];
    const source = sourceByKey.get(mapped.sourceKey);
    if (source) {
      ordered.push({ ...source, name: mapped.name });
      used.add(mapped.sourceKey);
      continue;
    }
    ordered.push({
      name: mapped.name,
      group: mapped.group ?? "Additional",
      color: mapped.color ?? 0,
    });
  }

  for (const [key, note] of sourceByKey) {
    if (!used.has(key)) ordered.push(note);
  }

  return ordered.map((note, i) => ({ ...note, no: i + 1 }));
})();

// Deterministic hash → [0, 1) so server and client render identical jitter
function rand(seed: number, salt: number) {
  let x = Math.imul(seed + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b);
  x ^= x >>> 15;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

function buildBoard(): Slot[] {
  return SKILL_NOTES.map((skill, i) => ({ key: `${normalizeSkillKey(skill.name)}-${i}`, seed: i, skill }));
}

const pad = (n: number) => String(n).padStart(2, "0");

// Physics tuning (degrees, seconds, px)
const MAX_WIND = 2400;
const SWING = 0.13;
const MAX_SWING = 12;
const LIFT = 0.4;
const LIFT_K = 60;
const LIFT_C = 6.2;
const MAX_LIFT = 26;

type Body = {
  el: HTMLElement;
  x: number;
  y: number;
  a: number;
  av: number;
  l: number;
  lv: number;
  k: number;
  c: number;
  p1: number;
  p2: number;
  landAt: number;
  wa: number;
  wl: number;
  lift: number;
};

export default function SkillsSection() {
  const boardRef = useRef<HTMLUListElement>(null);
  const enteredRef = useRef(false);
  const [cols, setCols] = useState(8);
  const [entered, setEntered] = useState(false);
  const slots = useMemo(() => buildBoard(), []);

  // CSS breakpoints own the column count; mirror it for cascade entrance timing
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const sync = () => {
      const n = parseInt(getComputedStyle(board).getPropertyValue("--cols"), 10);
      if (n > 0) setCols(n);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    // Reduced motion: CSS shows the notes at rest, no physics loop
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bodies: Body[] = Array.from(board.querySelectorAll<HTMLElement>(".sn-note"), (el) => {
      const seed = Number(el.dataset.seed);
      const k = 34 + rand(seed, 11) * 14;
      return {
        el,
        x: 0,
        y: 0,
        a: 0,
        av: 0,
        l: 0,
        lv: 0,
        k,
        c: 2 * 0.16 * Math.sqrt(k),
        p1: rand(seed, 12) * Math.PI * 2,
        p2: rand(seed, 13) * Math.PI * 2,
        landAt: 0,
        wa: Infinity,
        wl: Infinity,
        lift: -1,
      };
    });

    let radius = 220;
    const measure = () => {
      for (const b of bodies) {
        const slot = b.el.parentElement as HTMLElement;
        b.x = slot.offsetLeft + slot.offsetWidth / 2;
        b.y = slot.offsetTop + slot.offsetHeight / 2;
      }
      const w = (bodies[0]?.el.parentElement as HTMLElement | undefined)?.offsetWidth ?? 150;
      radius = Math.max(120, w * 1.5);
    };
    measure();

    // Wind source in client coords; velocity is smoothed and decays when the pointer rests
    let px = -1e5;
    let py = -1e5;
    let vx = 0;
    let vy = 0;
    let lastT = 0;

    const move = (x: number, y: number, ts: number) => {
      const dt = (ts - lastT) / 1000;
      if (lastT && dt > 0 && dt < 0.12) {
        const step = Math.max(dt, 0.008);
        vx += ((x - px) / step - vx) * 0.35;
        vy += ((y - py) / step - vy) * 0.35;
      }
      px = x;
      py = y;
      lastT = ts;
      start();
    };

    const puff = (x: number, y: number, strength: number) => {
      const r = board.getBoundingClientRect();
      const lx = x - r.left;
      const ly = y - r.top;
      const R2 = 2 * radius * radius;
      for (const b of bodies) {
        const dx = b.x - lx;
        const dy = b.y - ly;
        const d2 = dx * dx + dy * dy;
        const f = Math.exp(-d2 / R2);
        if (f < 0.02) continue;
        const d = Math.sqrt(d2) + 1;
        b.av -= (dx / d) * f * 110 * strength;
        b.lv += f * 70 * strength;
      }
      start();
    };

    let raf = 0;
    let last = 0;
    let visible = false;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const t = now / 1000;

      const decay = Math.exp(-dt * 3);
      vx *= decay;
      vy *= decay;
      let speed = Math.hypot(vx, vy);
      const clampK = speed > MAX_WIND ? MAX_WIND / speed : 1;
      const wx = vx * clampK;
      speed *= clampK;

      const r = board.getBoundingClientRect();
      const lx = px - r.left;
      const ly = py - r.top;
      const R2 = 2 * radius * radius;

      for (const b of bodies) {
        if (b.landAt && now >= b.landAt) {
          b.av += (b.p1 > Math.PI ? 1 : -1) * 55;
          b.lv += 35;
          b.landAt = 0;
        }

        let fx = 0;
        let fl = 0;
        if (speed > 5) {
          const dx = b.x - lx;
          const dy = b.y - ly;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 * 4.5) {
            const f = Math.exp(-d2 / R2);
            const d = Math.sqrt(d2) + 1;
            // Push along the gust, plus a radial spread away from its source
            fx = (wx + (dx / d) * speed * 0.4) * f;
            fl = speed * f;
          }
        }

        const breeze = (Math.sin(t * 0.8 + b.p1) + 0.5 * Math.sin(t * 2.1 + b.p2)) * 0.35;
        b.av += (-b.k * (b.a - breeze) - b.c * b.av - fx * SWING) * dt;
        b.a = Math.max(-MAX_SWING, Math.min(MAX_SWING, b.a + b.av * dt));

        b.lv += (-LIFT_K * b.l - LIFT_C * b.lv + fl * LIFT) * dt;
        b.l += b.lv * dt;
        // Paper can't pass through the wall
        if (b.l < 0) {
          b.l = 0;
          if (b.lv < 0) b.lv *= -0.2;
        } else if (b.l > MAX_LIFT) {
          b.l = MAX_LIFT;
          b.lv = 0;
        }

        const a = b.a + b.l * 0.06 * Math.sin(t * 12 + b.p2);
        if (Math.abs(a - b.wa) > 0.005 || Math.abs(b.l - b.wl) > 0.01) {
          b.el.style.transform = `perspective(700px) rotate(${a.toFixed(3)}deg) rotateX(${b.l.toFixed(2)}deg)`;
          b.wa = a;
          b.wl = b.l;
          const lift = Math.round((b.l / MAX_LIFT) * 40) / 40;
          if (lift !== b.lift) {
            b.el.style.setProperty("--lift", String(lift));
            b.lift = lift;
          }
        }
      }

      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    function start() {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !enteredRef.current) {
          enteredRef.current = true;
          setEntered(true);
          const now = performance.now();
          for (const b of bodies) b.landAt = now + Number(b.el.dataset.d) + 280;
        }
        start();
      },
      { threshold: 0.06 }
    );
    io.observe(board);

    const ro = new ResizeObserver(measure);
    ro.observe(board);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") move(e.clientX, e.clientY, e.timeStamp);
    };
    // Touch scrolling cancels pointer events, so follow the finger with touchmove
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) move(touch.clientX, touch.clientY, e.timeStamp);
    };
    const onPointerDown = (e: PointerEvent) => {
      lastT = 0;
      move(e.clientX, e.clientY, e.timeStamp);
      puff(e.clientX, e.clientY, e.pointerType === "touch" ? 1 : 0.7);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    board.addEventListener("touchmove", onTouchMove, { passive: true });
    board.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      board.removeEventListener("touchmove", onTouchMove);
      board.removeEventListener("pointerdown", onPointerDown);
    };
  }, [slots]);

  return (
    <section id="skills" className="section sn-section">
      <header className="sn-head">
        <div>
          <div className="section-label">
            <span>05</span> — Skills
          </div>
          <h2 className="section-title sn-title">
            The <em>stack</em> I build with.
          </h2>
        </div>
        <div className="sn-aside">
          <p className="sn-hint">
            <Wind size={18} strokeWidth={1.6} aria-hidden="true" />
            <span className="sn-hint-pointer">Sweep your cursor across the wall — let the breeze through.</span>
            <span className="sn-hint-touch">Swipe or tap the wall to stir a breeze.</span>
          </p>
          <ul className="sn-legend" aria-label="Note colours">
            {SKILL_GROUPS.map((g, i) => (
              <li key={g.title}>
                <span className={cn("sn-swatch", `sn-c${i % PAPER_COUNT}`)} aria-hidden="true" />
                {g.title}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <ul ref={boardRef} className={cn("sn-board", entered && "is-in")} aria-label="Skills">
        {slots.map((slot, i) => {
          const r = (salt: number) => rand(slot.seed, salt);
          const skill = slot.skill;
          const icon = ICONS[skill.name];
          const delay = Math.floor(i / cols) * 70 + (i % cols) * 35;
          const style = {
            "--r": ((r(1) - 0.5) * 7).toFixed(2),
            "--dx": `${((r(2) - 0.5) * 10).toFixed(1)}px`,
            "--dy": `${((r(3) - 0.5) * 12).toFixed(1)}px`,
            "--s": (0.95 + r(4) * 0.08).toFixed(3),
            "--tr": `${((r(5) - 0.5) * 14).toFixed(1)}deg`,
            "--d": `${delay}ms`,
          } as CSSProperties;
          const paper = skill.color;

          return (
            <li key={slot.key} className="sn-slot" style={style}>
              <span className="sn-shadow" aria-hidden="true" />
              <div className={cn("sn-note", `sn-c${paper}`)} data-seed={slot.seed} data-d={delay}>
                <div className="sn-top">
                  {icon ? (
                    <svg className="sn-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={icon.path} />
                    </svg>
                  ) : (
                    <span />
                  )}
                  <span className="sn-no">{pad(skill.no)}</span>
                </div>
                <span className="sn-name">{skill.name}</span>
                <span className="sn-cat">{skill.group}</span>
              </div>
              {r(8) < 0.6 ? (
                <span className={cn("sn-pin", `sn-pin--${Math.floor(r(9) * 3)}`)} aria-hidden="true" />
              ) : (
                <span className="sn-tape" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
