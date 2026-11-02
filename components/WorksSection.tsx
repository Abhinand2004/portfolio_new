"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  ArrowLeft,
  ArrowUp,
  CalendarCheck,
  ChartColumn,
  Check,
  CheckCheck,
  ChevronDown,
  Contact,
  EllipsisVertical,
  Inbox,
  Keyboard,
  LayoutTemplate,
  Megaphone,
  MessageCircle,
  Mic,
  Paperclip,
  PhoneOff,
  Plus,
  Search,
  SendHorizontal,
  Settings,
  Smile,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Android, Iphone, Safari } from "@/components/ui/device-mocks";

const SERVICES = [
  {
    id: "web",
    short: "Web & SaaS",
    title: "Web & SaaS Development",
    lead: "SaaS platforms and API-driven products — like WhatsApp Business inboxes on the Meta Cloud API — fast, responsive and production-ready.",
    tags: ["Next.js", "Node.js", "Meta Cloud API", "PostgreSQL"],
  },
  {
    id: "mobile",
    short: "Mobile",
    title: "Mobile App Development",
    lead: "One React Native codebase that feels native on both Android and iOS — offline-ready and store-ready.",
    tags: ["React Native", "Expo", "Meta Cloud API", "Push notifications"],
  },
  {
    id: "ai",
    short: "AI Agents",
    title: "AI Agent Development",
    lead: "Voice and chat agents that understand intent, call your tools and get real work done.",
    tags: ["Azure OpenAI", "Ollama", "Tool calling", "Voice"],
  },
] as const;

/** Scroll progress at which each service is fully on stage (also the snap points) */
const STOPS = [0, 0.5, 1];
/** Progress ranges that fill each step's bar; boundaries match the visual crossfades */
const STEP_RANGES: [number, number][] = [
  [0, 0.32],
  [0.32, 0.68],
  [0.68, 1],
];
const activeAt = (p: number) => (p < 0.32 ? 0 : p < 0.68 ? 1 : 2);
const clamp = (v: number) => Math.min(1, Math.max(0, v));

const useVisibility = (opacity: MotionValue<number>) =>
  useTransform(opacity, (o) => (o <= 0.001 ? "hidden" : "visible"));

/* ---------------------------------------------------------------- Web */

/* WhatsApp Business inbox on the Meta Cloud API — shared by the web and mobile mocks */

const CHATS = [
  { name: "Meera Nair", msg: "Need 2 for lunch", time: "12:40", unread: 2, tag: "Order", hue: 24 },
  { name: "Rahul Krishnan", msg: "Thanks, received it.", time: "12:38", hue: 210 },
  { name: "Fathima S.", msg: "Can I change the address?", time: "12:30", unread: 1, tag: "Support", hue: 280 },
  { name: "Joseph Thomas", msg: "Template: order_confirmed", time: "12:22", hue: 150 },
  { name: "Aisha K.", msg: "Payment link please", time: "12:15", tag: "Payment", hue: 340 },
  { name: "Vivek Menon", msg: "Is delivery free above ₹300?", time: "11:58", hue: 45 },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

function ChatAvatar({ name, hue }: { name: string; hue: number }) {
  return (
    <i className="wa-av" style={{ "--hue": hue } as React.CSSProperties}>
      {initials(name)}
    </i>
  );
}

function ChatList({ tags = true }: { tags?: boolean }) {
  return (
    <ul className="wa-list">
      {CHATS.map((c, i) => (
        <li key={c.name} className="wa-row" data-on={(tags && i === 0) || undefined} data-unread={c.unread || undefined}>
          <ChatAvatar name={c.name} hue={c.hue} />
          <span className="wa-row-text">
            <b>
              {c.name}
              {tags && c.tag && (
                <i className="wa-tag" data-t={c.tag}>
                  {c.tag}
                </i>
              )}
            </b>
            <small>{c.msg}</small>
          </span>
          <span className="wa-row-meta">
            <small>{c.time}</small>
            {c.unread && <em>{c.unread}</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ChatThread() {
  return (
    <div className="wa-thread">
      <span className="wa-day">Today</span>
      <div className="wa-msg wa-in">
        Hi, is the ghee roast available today?<time>12:39</time>
      </div>
      <div className="wa-msg wa-in">
        Need 2 for lunch<time>12:40</time>
      </div>
      <div className="wa-msg wa-out">
        Yes, it&apos;s on today&apos;s menu. 2 × Ghee roast with appam comes to ₹540.
        <time>
          12:41 <CheckCheck />
        </time>
        <span className="wa-btns">
          <span>Confirm order</span>
          <span>View menu</span>
        </span>
      </div>
      <div className="wa-last">
        <div className="wa-typing">
          <i />
          <i />
          <i />
        </div>
        <div className="wa-msg wa-in">
          Confirm order<time>12:42</time>
        </div>
      </div>
    </div>
  );
}

function ChatCompose({ placeholder }: { placeholder: string }) {
  return (
    <div className="wa-compose">
      <span>
        <Smile />
        {placeholder}
        <Paperclip />
      </span>
      <i className="wa-send">
        <SendHorizontal />
      </i>
    </div>
  );
}

const SIDE_NAV = [
  { Icon: Inbox, label: "Inbox", count: 12, on: true },
  { Icon: Contact, label: "Contacts" },
  { Icon: Megaphone, label: "Broadcasts" },
  { Icon: LayoutTemplate, label: "Templates" },
  { Icon: Workflow, label: "Flows" },
  { Icon: ChartColumn, label: "Analytics" },
];

function WebScreen() {
  return (
    <div className="sw">
      <aside className="sw-side">
        <div className="sw-ws">
          <span className="sw-ws-logo">SR</span>
          <span>
            <b>Spice Route</b>
            <small>WhatsApp Business</small>
          </span>
          <ChevronDown />
        </div>
        <nav className="sw-side-nav">
          {SIDE_NAV.map(({ Icon, label, count, on }) => (
            <span key={label} className={on ? "is-on" : undefined}>
              <Icon />
              {label}
              {count && <em>{count}</em>}
            </span>
          ))}
        </nav>
        <div className="sw-side-foot">
          <span>
            <Settings />
            Settings
          </span>
          <span className="sw-me">
            <i>AM</i>
            Anu Mathew
          </span>
        </div>
      </aside>

      <main className="sw-main">
        <div className="sw-top">
          <div>
            <b className="sw-h1">Inbox</b>
            <small className="sw-live">
              <i /> Cloud API connected · +91 98470 12345
            </small>
          </div>
          <span className="sw-search">
            <Search />
            Search chats
            <kbd>⌘K</kbd>
          </span>
          <span className="sw-btn sw-btn--primary">
            <Megaphone /> New broadcast
          </span>
        </div>

        <div className="sw-inbox">
          <ChatList />
          <section className="sw-chat">
            <header className="sw-chat-head">
              <ChatAvatar name="Meera Nair" hue={24} />
              <span>
                <b>Meera Nair</b>
                <small>+91 94471 23456</small>
              </span>
              <span className="sw-session">Session open · 23h left</span>
            </header>
            <ChatThread />
            <ChatCompose placeholder="Type a message" />
          </section>
        </div>
      </main>

      <div className="sw-toast">
        <Check /> Broadcast “Lunch menu” sent to 2,340 contacts
      </div>
      <div className="sw-cursor">
        <svg viewBox="0 0 24 24">
          <path d="M4 3l16 7.5-7 1.8L9.8 19z" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Mobile */

function IosScreen() {
  return (
    <div className="sm sm--ios">
      <div className="sm-toast">
        <span className="sm-toast-icon">
          <MessageCircle />
        </span>
        <span>
          <b>Meera Nair</b>
          <small>Confirm order</small>
        </span>
      </div>
      <div className="sm-head">
        <span>
          <small>Spice Route · WhatsApp</small>
          <div className="sm-title">Chats</div>
        </span>
        <i className="sm-head-act">
          <Plus />
        </i>
      </div>
      <div className="sm-search">
        <Search />
        <span>Search</span>
      </div>
      <div className="sm-seg">
        <span className="is-on">All</span>
        <span>Unread</span>
        <span>Assigned to me</span>
      </div>
      <ChatList tags={false} />
      <nav className="sm-tabs">
        <MessageCircle />
        <Contact />
        <Megaphone />
        <Settings />
      </nav>
    </div>
  );
}

function AndroidScreen() {
  return (
    <div className="sm sm--android sm--chat">
      <div className="sm-toast">
        <span className="sm-toast-icon">
          <Megaphone />
        </span>
        <span>
          <b>Broadcast delivered</b>
          <small>Lunch menu · 2,340 contacts</small>
        </span>
      </div>
      <div className="sm-appbar">
        <ArrowLeft />
        <ChatAvatar name="Meera Nair" hue={24} />
        <span>
          <b>Meera Nair</b>
          <small>Session open · 23h left</small>
        </span>
        <EllipsisVertical />
      </div>
      <ChatThread />
      <ChatCompose placeholder="Message" />
    </div>
  );
}

/* ----------------------------------------------------------------- AI */

const WAVE = Array.from({ length: 28 }, (_, i) => i);

function AgentScreen() {
  return (
    <div className="sa">
      <div className="sa-main">
        <div className="sa-top">
          <span className="sa-badge">
            <i /> Live · Voice agent
          </span>
          <span className="sa-time">00:42</span>
        </div>
        <div className="sa-orb-wrap">
          <span className="sa-ring" />
          <span className="sa-ring" />
          <div className="sa-orb">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="sa-wave">
          {WAVE.map((i) => (
            <i key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <div className="sa-status">
          Listening
          <span className="sa-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="sa-controls">
          <span>
            <Keyboard />
          </span>
          <span className="sa-mic">
            <Mic />
          </span>
          <span className="sa-end">
            <PhoneOff />
          </span>
        </div>
      </div>

      <div className="sa-chat">
        <div className="sa-chat-head">Transcript</div>
        <div className="sa-msg sa-msg--user">Can you move my 3 pm call to tomorrow?</div>
        <div className="sa-tool">
          <CalendarCheck />
          <code>calendar.reschedule()</code>
          <Check className="sa-tool-ok" />
        </div>
        <div className="sa-reply">
          <div className="sa-msg">Done — it&apos;s now tomorrow at 3:00 PM. I&apos;ve let the team know.</div>
          <div className="sa-typing">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="sa-event">
          <span className="sa-event-date">
            <small>Sat</small>
            <b>18</b>
          </span>
          <span className="sa-event-text">
            <b>Team sync</b>
            <small>3:00 – 3:30 PM · 4 guests notified</small>
          </span>
          <span className="sa-event-avatars">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="sa-input">
          <Sparkles />
          Ask your agent anything…
          <span>
            <ArrowUp />
          </span>
        </div>
      </div>

      <span className="sa-float sa-float--a">
        intent · reschedule <b>0.98</b>
      </span>
      <span className="sa-float sa-float--b">
        latency <b>320 ms</b>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- Stage */

function Visuals({ p, active }: { p: MotionValue<number>; active: number }) {
  const webOpacity = useTransform(p, [0.22, 0.36], [1, 0]);
  const webScale = useTransform(p, [0.2, 0.4], [1, 0.8]);
  const webY = useTransform(p, [0.2, 0.4], ["0%", "-6%"]);

  const phOpacity = useTransform(p, [0.28, 0.42, 0.6, 0.72], [0, 1, 1, 0]);
  const phScale = useTransform(p, [0.26, 0.44, 0.6, 0.74], [0.78, 1, 1, 0.84]);
  const phY = useTransform(p, [0.26, 0.44, 0.6, 0.74], ["10%", "0%", "0%", "-6%"]);
  const droidX = useTransform(p, [0.26, 0.46, 0.58, 0.74], ["52%", "0%", "0%", "50%"]);
  const iosX = useTransform(p, [0.26, 0.46, 0.58, 0.74], ["-52%", "0%", "0%", "-50%"]);
  const droidRotate = useTransform(p, [0.26, 0.46, 0.58, 0.74], [0, -4, -4, 0]);
  const iosRotate = useTransform(p, [0.26, 0.46, 0.58, 0.74], [0, 4, 4, 0]);

  const aiOpacity = useTransform(p, [0.64, 0.78], [0, 1]);
  const aiScale = useTransform(p, [0.62, 0.8], [0.82, 1]);
  const aiY = useTransform(p, [0.62, 0.8], ["10%", "0%"]);

  const webVis = useVisibility(webOpacity);
  const phVis = useVisibility(phOpacity);
  const aiVis = useVisibility(aiOpacity);

  return (
    <>
      <motion.div
        className="sv-layer"
        data-active={active === 0}
        style={{ opacity: webOpacity, scale: webScale, y: webY, visibility: webVis }}
      >
        <Safari url="app.spiceroute.in/inbox" className="sv-browser app-web">
          <WebScreen />
        </Safari>
      </motion.div>

      <motion.div
        className="sv-layer"
        data-active={active === 1}
        style={{ opacity: phOpacity, scale: phScale, y: phY, visibility: phVis }}
      >
        <div className="sv-phones">
          <motion.div className="sv-phone sv-phone--android" style={{ x: droidX, rotate: droidRotate }}>
            <Android className="app-android">
              <AndroidScreen />
            </Android>
            <span className="sv-os">Android</span>
          </motion.div>
          <motion.div className="sv-phone sv-phone--ios" style={{ x: iosX, rotate: iosRotate }}>
            <Iphone className="app-ios">
              <IosScreen />
            </Iphone>
            <span className="sv-os">iOS</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="sv-layer"
        data-active={active === 2}
        style={{ opacity: aiOpacity, scale: aiScale, y: aiY, visibility: aiVis }}
      >
        <div className="sv-ai">
          <AgentScreen />
        </div>
      </motion.div>
    </>
  );
}

function StepBar({ progress, range }: { progress: MotionValue<number>; range: [number, number] }) {
  const scaleX = useTransform(progress, range, [0, 1]);
  return (
    <span className="sv-step-bar">
      <motion.i style={{ scaleX }} />
    </span>
  );
}

export default function WorksSection() {
  const reduced = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 110, damping: 26, mass: 0.6 });
  const p = reduced ? progress : smooth;

  // Re-render only when the active service changes
  useMotionValueEvent(progress, "change", (v) => {
    const next = activeAt(v);
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }
  });

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

  // Pause the mockups' looping CSS animations while the section is off-screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => section.toggleAttribute("data-running", entry.isIntersecting),
      { root: section.closest(".layout-container") },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Subtle pointer tilt on the device stage
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(tiltY, { stiffness: 120, damping: 18 });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    tiltX.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
  };
  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const goTo = useCallback(
    (i: number) => {
      const section = sectionRef.current;
      const scroller = section?.closest<HTMLElement>(".layout-container");
      if (!section || !scroller) return;
      const range = section.offsetHeight - scroller.clientHeight;
      scroller.scrollTo({ top: section.offsetTop + STOPS[i] * range, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced],
  );

  return (
    <section ref={sectionRef} id="works" className="sv" aria-labelledby="sv-title">
      {STOPS.map((stop) => (
        <span key={stop} className="sv-snap" style={{ "--stop": stop } as React.CSSProperties} aria-hidden="true" />
      ))}

      <div className="sv-stage" data-tone={SERVICES[active].id}>
        <div className="bg-script sv-script" aria-hidden="true">
          Works
        </div>
        <div className="sv-glow" aria-hidden="true" />

        <header className="sv-head">
          <div className="section-label">
            <span>03</span> — What I Build
          </div>
          <h2 id="sv-title" className="section-title sv-title">
            {SERVICES.map((s, i) => (
              <span
                key={s.id}
                className="sv-title-item"
                data-state={i === active ? "active" : i < active ? "past" : "next"}
                aria-hidden={i !== active}
              >
                {s.id === "web" && (
                  <>
                    <em>Web &amp; SaaS</em> products.
                  </>
                )}
                {s.id === "mobile" && (
                  <>
                    <em>Mobile apps</em> for iOS &amp; Android.
                  </>
                )}
                {s.id === "ai" && (
                  <>
                    <em>AI agents</em> that get work done.
                  </>
                )}
              </span>
            ))}
          </h2>
        </header>

        <div
          className="sv-visual"
          aria-hidden="true"
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <motion.div className="sv-tilt" style={{ rotateX, rotateY, transformPerspective: 1600 }}>
            <Visuals p={p} active={active} />
          </motion.div>
          <div className="sv-floor" />
        </div>

        <div className="sv-body">
          <div className="sv-panels" aria-live="polite">
            {SERVICES.map((s, i) => (
              <article
                key={s.id}
                className="sv-panel"
                data-state={i === active ? "active" : i < active ? "past" : "next"}
                aria-hidden={i !== active}
              >
                <div className="sv-panel-index">
                  {String(i + 1).padStart(2, "0")}
                  <span>/ 03</span>
                </div>
                <h3 className="sv-panel-title">{s.title}</h3>
                <p className="sv-panel-lead">{s.lead}</p>
              </article>
            ))}
          </div>

          <nav className="sv-steps" aria-label="Services">
            {SERVICES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="sv-step"
                aria-current={i === active ? "step" : undefined}
                onClick={() => goTo(i)}
              >
                <span className="sv-step-label">
                  <b>{String(i + 1).padStart(2, "0")}</b>
                  {s.short}
                </span>
                <StepBar progress={progress} range={STEP_RANGES[i]} />
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
