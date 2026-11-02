"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  type TouchEvent,
} from "react";
import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Database,
  Monitor,
  Plug,
  Plus,
  Server,
  Smartphone,
  Wrench,
} from "lucide-react";
import {
  siDocker,
  siExpo,
  siExpress,
  siJavascript,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPrisma,
  siReact,
  siSqlite,
  siTailwindcss,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

import { cn } from "@/lib/utils";
import { SKILL_GROUPS, SKILLS, type Skill, type SkillGroup, type SkillIcon } from "@/lib/data";
import { AnimatedBeam } from "@/registry/magicui/animated-beam";

const ICONS: Record<SkillIcon, SimpleIcon> = {
  javascript: siJavascript,
  typescript: siTypescript,
  react: siReact,
  nextjs: siNextdotjs,
  expo: siExpo,
  tailwind: siTailwindcss,
  nodejs: siNodedotjs,
  express: siExpress,
  mongodb: siMongodb,
  postgresql: siPostgresql,
  prisma: siPrisma,
  sqlite: siSqlite,
  docker: siDocker,
};

// Near-black brand colours (Next.js, Express, GitHub…) would vanish in dark
// mode, so those icons inherit the theme text colour instead.
function iconFill(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.15 ? "currentColor" : `#${hex}`;
}

function BrandIcon({ icon }: { icon: SkillIcon }) {
  const { title, path, hex } = ICONS[icon];
  return (
    <svg role="img" viewBox="0 0 24 24" fill={iconFill(hex)} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <path d={path} />
    </svg>
  );
}

const GROUP_ICONS: Record<SkillGroup["icon"], typeof Monitor> = {
  frontend: Monitor,
  backend: Server,
  mobile: Smartphone,
  database: Database,
  integrations: Plug,
  ai: BrainCircuit,
  tools: Wrench,
  more: Plus,
};

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 };

const groupsContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const groupCard: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)", transition: INSTANT },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

const panelBody: Variants = {
  out: {},
  in: { transition: { staggerChildren: 0.025 } },
  exit: { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.18 } },
};

const panelItem: Variants = {
  out: { opacity: 0, y: 12, filter: "blur(4px)" },
  in: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
};

const pad = (n: number) => String(n).padStart(2, "0");
const GROUP_COUNT = SKILL_GROUPS.length;
const MAX_ITEMS = Math.max(...SKILL_GROUPS.map((g) => g.items.length));
const TOTAL_TOOLS = new Set(SKILL_GROUPS.flatMap((g) => g.items)).size;

function SkillGroups() {
  const [active, setActive] = useState(0);
  const indexRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const group = SKILL_GROUPS[active];
  const Icon = GROUP_ICONS[group.icon];

  const go = (step: number) => setActive((a) => (a + step + GROUP_COUNT) % GROUP_COUNT);

  // When the tabs become a horizontal chip rail, keep the active chip centred
  useEffect(() => {
    const rail = indexRef.current;
    const tab = tabsRef.current[active];
    if (!rail || !tab || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollTo({ left: tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (active + step + GROUP_COUNT) % GROUP_COUNT;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.div
      className="tk"
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.2 }}
      variants={groupsContainer}
    >
      <motion.div
        ref={indexRef}
        className="tk-index"
        role="tablist"
        aria-label="Skill categories"
        aria-orientation="vertical"
        variants={groupCard}
        onKeyDown={onKeyDown}
      >
        {SKILL_GROUPS.map((g, i) => {
          const selected = i === active;
          const TabIcon = GROUP_ICONS[g.icon];
          return (
            <button
              key={g.title}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tk-tab-${i}`}
              aria-selected={selected}
              aria-controls="tk-panel"
              tabIndex={selected ? 0 : -1}
              className={cn("tk-tab", selected && "is-active")}
              onClick={() => setActive(i)}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setActive(i);
              }}
            >
              {selected && (
                <motion.span
                  layoutId="tk-tab-bg"
                  className="tk-tab-bg"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="tk-tab-num">{pad(i + 1)}</span>
              <TabIcon className="tk-tab-icon" size={15} strokeWidth={1.8} aria-hidden="true" />
              <span className="tk-tab-title">{g.title}</span>
              <span className="tk-tab-meter" aria-hidden="true">
                <span style={{ width: `${(g.items.length / MAX_ITEMS) * 100}%` }} />
              </span>
              <span className="tk-tab-count">{pad(g.items.length)}</span>
            </button>
          );
        })}
      </motion.div>

      <motion.div
        id="tk-panel"
        className="tk-panel"
        role="tabpanel"
        aria-labelledby={`tk-tab-${active}`}
        variants={groupCard}
        onPointerMove={onPointerMove}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="tk-panel-glow" aria-hidden="true" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={active}
            className="tk-panel-numeral"
            aria-hidden="true"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.25 } }}
          >
            {pad(active + 1)}
          </motion.span>
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={group.title}
            className="tk-panel-body"
            initial="out"
            animate="in"
            exit="exit"
            variants={panelBody}
          >
            <header className="tk-panel-head">
              <motion.span className="tk-panel-icon" variants={panelItem}>
                <Icon size={22} strokeWidth={1.6} />
              </motion.span>
              <div className="tk-panel-heading">
                <motion.p className="tk-panel-kicker" variants={panelItem}>
                  Discipline {pad(active + 1)} / {pad(GROUP_COUNT)}
                </motion.p>
                <motion.h3 variants={panelItem}>{group.title}</motion.h3>
              </div>
              <motion.span className="tk-panel-count" variants={panelItem}>
                <strong>{pad(group.items.length)}</strong>
                tools
              </motion.span>
            </header>
            <ul className="tk-list">
              {group.items.map((item, i) => (
                <motion.li key={item} variants={panelItem}>
                  <span className="tk-list-num">{pad(i + 1)}</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        <footer className="tk-panel-foot">
          <span className="tk-panel-total">
            {TOTAL_TOOLS} tools · {GROUP_COUNT} disciplines
          </span>
          <button type="button" className="tk-nav" aria-label="Previous category" onClick={() => go(-1)}>
            <ChevronLeft size={18} strokeWidth={1.8} />
          </button>
          <span className="tk-progress" aria-hidden="true">
            {SKILL_GROUPS.map((g, i) => (
              <span key={g.title} className={cn(i === active && "is-on")} />
            ))}
          </span>
          <button type="button" className="tk-nav" aria-label="Next category" onClick={() => go(1)}>
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

const Circle = forwardRef<HTMLDivElement, { className?: string; children?: ReactNode }>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn("skill-hub", className)}>
      {children}
    </div>
  )
);
Circle.displayName = "Circle";

function SkillNode({
  skill,
  side,
  index,
  total,
  containerRef,
  hubRef,
}: {
  skill: Skill;
  side: "left" | "right";
  index: number;
  total: number;
  containerRef: RefObject<HTMLDivElement | null>;
  hubRef: RefObject<HTMLDivElement | null>;
}) {
  const dotRef = useRef<HTMLSpanElement>(null);
  // Distance from the vertical centre: outer rows land slightly above/below
  // the hub's centre so the curves fan out instead of overlapping.
  const offset = index - (total - 1) / 2;
  const dir = side === "left" ? 1 : -1;

  return (
    <div className={cn("skill-node", `skill-node--${side}`)}>
      <div className="skill-anchor">
      <motion.div
        className={cn("skill-card", side === "left" ? "skill-card--left" : "skill-card--right")}
        whileHover={{ x: -dir * 4, transition: { duration: 0.35, ease: EASE } }}
      >
        <div className="skill-tile">
          <BrandIcon icon={skill.icon} />
        </div>
        <span className="skill-name">{skill.name}</span>
        <ChevronRight className="skill-chevron" size={16} strokeWidth={1.75} aria-hidden="true" />
      </motion.div>
      <span ref={dotRef} className="skill-dot" aria-hidden="true" />
      </div>
      {/* Outside .skill-anchor so the SVG positions against the beam container */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={hubRef}
        toRef={dotRef}
        cubic
        startYOffset={offset * 9}
        reverse={side === "right"}
        duration={4 + (index % 3)}
        delay={index * 0.25}
        pathColor="#E69E51"
        pathWidth={1.25}
        pathOpacity={0.3}
        gradientStartColor="#FFD29A"
        gradientStopColor="#E69E51"
        drawDuration={0}
      />
    </div>
  );
}

export default function SkillsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);

  const column = (side: "left" | "right", skills: Skill[]) => (
    <div className="skills-col">
      {skills.map((skill, i) => (
        <SkillNode
          key={skill.name}
          skill={skill}
          side={side}
          index={i}
          total={skills.length}
          containerRef={containerRef}
          hubRef={hubRef}
        />
      ))}
    </div>
  );

  return (
    <section id="skills" className="section skills-section">
      <MotionConfig reducedMotion="user">
        <div className="skills-stage">
          <div className="section-label skills-label">
            <span>05</span> — Skills
          </div>
          <h2 className="section-title skills-title">
            The <em>stack</em> I build with.
          </h2>

          <div className="skills-beam-wrap">
            <div className="skills-col-titles">
              {["Frontend & Mobile", "Backend & Data"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div ref={containerRef} className="skills-beam">
              <div className="skills-aura" aria-hidden="true" />
              {column("left", SKILLS.frontend)}
              <div className="skill-hub-slot">
                <Circle ref={hubRef} className="is-live">
                  <span>A.</span>
                </Circle>
              </div>
              {column("right", SKILLS.backend)}
            </div>
          </div>
        </div>

        <div className="skill-groups-label" data-reveal>
          The full toolkit
        </div>
        <SkillGroups />
      </MotionConfig>
    </section>
  );
}
