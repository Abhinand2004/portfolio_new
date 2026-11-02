export const PROFILE = {
  name: "Abhinand C",
  role: "Software Engineer",
  headline: "Beyond the Stack — Building Software That Works in the Real World.",
  tagline:
    "Software Engineer building full-stack web applications, cross-platform mobile experiences, and API-driven solutions using modern technologies.",
  specializations: ["Full-Stack Development", "Mobile Application Development", "API Integrations"],
  location: "Palakkad, Kerala, India",
  organization: "Codely.AI Private Limited",
  linkedin: "https://www.linkedin.com/in/abhinandc2004/",
  github: "https://github.com/Abhinand2004",
  // TODO: replace with your real Instagram and professional email
  instagram: "https://instagram.com",
  email: "abhinandc293@gmail.com",
  workModes: ["On-site", "Hybrid", "Remote"],
};

export type Experience = {
  company: string;
  role: string;
  type: string;
  /** "YYYY-MM"; `end` omitted for the current role */
  start: string;
  end?: string;
  location: string;
  workMode: string;
  current?: boolean;
  summary: string;
  /** Chapter title and short narrative used by the experience book */
  chapter: string;
  story: string[];
  highlights: string[];
  skills: string[];
  milestone?: string;
};

// Ordered as a career journey: Level 01 (first role) → current role.
// TODO: confirm the Synnefo Solutions internship dates.
export const EXPERIENCE: Experience[] = [
  {
    company: "Synnefo Solutions",
    role: "MERN Stack Developer Intern",
    type: "Training & Internship",
    start: "2024-06",
    end: "2025-01",
    location: "Ernakulam, Kerala",
    workMode: "On-site",
    summary:
      "My entry into professional software development — practical full-stack experience and a first real look at how frontend interfaces, backend services and databases work together.",
    chapter: "Where it got real",
    story: [
      "Synnefo Solutions is where practice turned into the real thing. It began as training — the MERN stack, one concept at a time — and quietly grew into an internship before I even noticed the shift.",
      "Then, far earlier than I expected, they handed me my first real project. Real requirements, real deadlines, real bugs: React screens talking to Node and Express APIs, data living in MongoDB, and me in the middle figuring out how it all fits together.",
      "Somewhere between that first commit and the last bug fix, the passion stopped being a question. My professional journey had begun.",
    ],
    highlights: [
      "Learned MERN stack fundamentals and built reusable React components.",
      "Integrated frontend screens with backend APIs.",
      "Worked with MongoDB data models and CRUD operations.",
      "Built responsive pages and sharpened debugging and development workflows.",
    ],
    skills: ["React.js", "Node.js", "Express.js", "MongoDB", "JavaScript", "Responsive UI"],
  },
  {
    company: "Softroniics",
    role: "MERN Stack Developer",
    type: "Full-time",
    start: "2025-07",
    end: "2026-01",
    location: "Perinthalmanna, Kerala",
    workMode: "On-site",
    summary:
      "Developed and maintained full-stack web applications while deepening my knowledge of frontend architecture, backend services, API integrations and development workflows.",
    chapter: "Owning the whole pipeline",
    story: [
      "I walked into Softroniics already carrying something most freshers don't — strong fundamentals and real project experience from my internship. So instead of starting from zero, I started building.",
      "As a MERN stack developer I moved across different projects, and I never worked on just a ticket. I owned complete pipelines — from the React screen to the API, the auth, the database and back again — and saw features through end to end.",
      "I also had interns working under me, and helping them get unstuck taught me as much as any project did. Then came the hackathon — and I walked away with First Prize.",
    ],
    highlights: [
      "Worked across multiple full-stack projects with React.js, Next.js, Node.js and Express.js.",
      "Owned complete feature pipelines — UI, REST APIs, authentication and database — not just tickets.",
      "Supported and guided the interns on the team through their tasks.",
      "Delivered responsive UIs and handled ongoing application maintenance.",
    ],
    skills: ["React.js", "Next.js", "Node.js", "Express.js", "MongoDB", "REST APIs", "Auth"],
    milestone: "First Prize — Softroniics Hackathon",
  },
  {
    company: "Codely.AI",
    role: "Software Engineer",
    type: "Full-time",
    start: "2026-02",
    location: "Kozhikode, Kerala",
    workMode: "On-site",
    current: true,
    summary:
      "Expanding into full-stack product engineering and cross-platform mobile development — contributing to web and mobile applications and integrating external services into their workflows.",
    chapter: "Beyond the browser",
    story: [
      "Today I'm at Codely.AI in Kozhikode, where the work reaches past the browser — into phones, platforms and the services that connect them.",
      "I build React Native and Expo apps that keep working offline, wire products into Meta's platforms and messaging, handle auth and sessions, and carry apps all the way through Android and iOS releases.",
      "This chapter is still being written — and it's the most exciting one yet.",
    ],
    highlights: [
      "Build full-stack web features and connect frontends to backend systems.",
      "Develop React Native and Expo apps with offline data and local persistence.",
      "Integrate third-party APIs, Meta platforms, messaging, auth and sessions.",
      "Debug, improve performance and support Android & iOS release workflows.",
    ],
    skills: ["Next.js", "React Native", "Expo", "TypeScript", "Node.js", "SQLite", "Meta APIs", "OAuth 2.0"],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseYm = (ym: string) => ym.split("-").map(Number) as [number, number];

const formatYm = (ym: string) => {
  const [y, m] = parseYm(ym);
  return `${MONTHS[m - 1]} ${y}`;
};

/** e.g. "Jul 2025 — Jan 2026" or "Feb 2026 — Present" */
export const formatPeriod = (job: Experience) =>
  `${formatYm(job.start)} — ${job.end ? formatYm(job.end) : "Present"}`;

/** Inclusive month count, matching how LinkedIn reports tenure */
export function formatDuration(job: Experience, now = new Date()) {
  const [sy, sm] = parseYm(job.start);
  const [ey, em] = job.end ? parseYm(job.end) : [now.getFullYear(), now.getMonth() + 1];
  const months = Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest) parts.push(`${rest} month${rest > 1 ? "s" : ""}`);
  return parts.join(" ");
}

// TODO: add the completion year.
export const EDUCATION = {
  qualification: "Diploma in Computer Engineering",
  institution: "Government Polytechnic College, Shoranur",
  detail: "Kerala, India",
};

export type Project = {
  title: string;
  category: string;
  description: string;
  features: string[];
  stack: string[];
  icon: "web" | "mobile" | "chat" | "shield" | "offline" | "ai";
};

// Client and product names are kept private; work is grouped by the kind of
// engineering problem and the technologies involved.
export const PROJECTS: Project[] = [
  {
    title: "Full-Stack SaaS Applications",
    category: "Web Application Development",
    description:
      "Contributed to web-based software products spanning frontend development, backend services, database integration, authentication and external platform connectivity.",
    features: ["Frontend development", "Backend services", "Database integration", "Auth & platform connectivity"],
    stack: ["React.js", "Next.js", "Node.js", "Express.js", "MongoDB", "PostgreSQL", "REST APIs"],
    icon: "web",
  },
  {
    title: "Cross-Platform Mobile Apps",
    category: "Mobile Engineering",
    description:
      "Worked on Android and iOS apps — connecting mobile interfaces to backend services, handling local data, improving UI and supporting build and distribution workflows.",
    features: ["Android & iOS apps", "Backend-connected UI", "Local data handling", "Build & distribution"],
    stack: ["React Native", "TypeScript", "Expo", "SQLite", "REST APIs"],
    icon: "mobile",
  },
  {
    title: "Messaging & Platform Integrations",
    category: "API Engineering",
    description:
      "Integrated external messaging and social platform capabilities into application workflows — API communication, request and response handling, and debugging integration issues.",
    features: ["Messaging integrations", "Request & response handling", "Service integration", "Integration debugging"],
    stack: ["Meta APIs", "WhatsApp Business", "REST APIs", "Webhooks"],
    icon: "chat",
  },
  {
    title: "Authentication & Sessions",
    category: "Backend Integration",
    description:
      "Worked on authentication workflows connecting frontend and backend systems, including token-based API requests, OAuth integrations and server-side session management.",
    features: ["Token-based API requests", "OAuth integrations", "Server-side sessions", "Frontend ↔ backend auth"],
    stack: ["JWT", "OAuth 2.0", "Bearer tokens", "REST APIs"],
    icon: "shield",
  },
  {
    title: "Offline Data & Mobile Reliability",
    category: "Mobile Application Engineering",
    description:
      "Contributed to local persistence and offline data access in mobile apps, and troubleshot synchronization, network-dependent workflows and responsiveness.",
    features: ["Local persistence", "Offline data access", "Sync troubleshooting", "App responsiveness"],
    stack: ["React Native", "SQLite", "REST APIs"],
    icon: "offline",
  },
  {
    title: "AI-Powered Integrations",
    category: "AI Application Development",
    description:
      "Exploring AI APIs and tooling for bringing AI capabilities into software applications — from hosted models to local and in-browser options.",
    features: ["Hosted LLM APIs", "Local models", "In-browser ML", "Prototyping AI features"],
    stack: ["Azure OpenAI API", "Ollama", "TensorFlow.js"],
    icon: "ai",
  },
];

export type Service = {
  title: string;
  description: string;
  icon: "layout" | "mobile" | "plug" | "shield";
};

export const SERVICES: Service[] = [
  {
    title: "Full-Stack Web",
    description:
      "Responsive React and Next.js interfaces wired to Node.js and Express backends, with MongoDB or PostgreSQL behind them.",
    icon: "layout",
  },
  {
    title: "Cross-Platform Mobile",
    description:
      "Android and iOS apps with React Native and Expo — local persistence, offline access and build & release workflows.",
    icon: "mobile",
  },
  {
    title: "API & Platform Integrations",
    description:
      "Third-party REST APIs, Meta and WhatsApp Business integrations, webhooks — and the debugging that comes with them.",
    icon: "plug",
  },
  {
    title: "Auth & Backend Workflows",
    description:
      "JWT, OAuth 2.0 and server-side session flows that keep frontend and backend talking securely and reliably.",
    icon: "shield",
  },
];

export const TECH_STACK = [
  "React.js",
  "Next.js",
  "TypeScript",
  "React Native",
  "Expo",
  "Node.js",
  "Express.js",
  "MongoDB",
  "PostgreSQL",
  "Prisma",
  "SQLite",
  "Tailwind CSS",
  "Redux",
  "Meta APIs",
  "WhatsApp Business",
  "OAuth 2.0",
  "Docker",
  "Azure OpenAI",
  "Framer Motion",
];

export type SkillIcon =
  | "javascript"
  | "typescript"
  | "react"
  | "nextjs"
  | "expo"
  | "tailwind"
  | "nodejs"
  | "express"
  | "mongodb"
  | "postgresql"
  | "prisma"
  | "sqlite"
  | "docker";

export type Skill = { name: string; icon: SkillIcon };

// Rendered as the left and right columns of the animated beam diagram.
// Keep both columns the same length so the layout stays symmetric.
export const SKILLS: { frontend: Skill[]; backend: Skill[] } = {
  frontend: [
    { name: "JavaScript", icon: "javascript" },
    { name: "TypeScript", icon: "typescript" },
    { name: "React", icon: "react" },
    { name: "Next.js", icon: "nextjs" },
    { name: "React Native", icon: "react" },
    { name: "Expo", icon: "expo" },
    { name: "Tailwind CSS", icon: "tailwind" },
  ],
  backend: [
    { name: "Node.js", icon: "nodejs" },
    { name: "Express", icon: "express" },
    { name: "MongoDB", icon: "mongodb" },
    { name: "PostgreSQL", icon: "postgresql" },
    { name: "Prisma", icon: "prisma" },
    { name: "SQLite", icon: "sqlite" },
    { name: "Docker", icon: "docker" },
  ],
};

export type SkillGroup = {
  title: string;
  icon: "frontend" | "backend" | "mobile" | "database" | "integrations" | "ai" | "tools" | "more";
  items: string[];
};

export const SKILL_GROUPS: SkillGroup[] = [
  {
    title: "Frontend",
    icon: "frontend",
    items: ["React.js", "Next.js", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "Material UI", "Redux", "Framer Motion", "Vite", "Responsive design", "Component architecture"],
  },
  {
    title: "Backend",
    icon: "backend",
    items: ["Node.js", "Express.js", "REST APIs", "API integration", "Auth & authorization", "JWT", "OAuth 2.0", "Server-side sessions", "Webhooks"],
  },
  {
    title: "Mobile",
    icon: "mobile",
    items: ["React Native", "Expo", "EAS", "NativeWind", "SQLite", "Local persistence", "Offline data", "Mobile API integration", "Android & iOS builds", "TestFlight"],
  },
  {
    title: "Databases",
    icon: "database",
    items: ["MongoDB", "Mongoose", "PostgreSQL", "Prisma", "SQLite", "CRUD operations", "Data modeling"],
  },
  {
    title: "Integrations",
    icon: "integrations",
    items: ["Meta APIs", "WhatsApp Business Platform", "Instagram & Facebook", "Google OAuth", "Cloudinary", "Third-party REST APIs", "Webhooks"],
  },
  {
    title: "AI & Emerging",
    icon: "ai",
    items: ["Azure OpenAI API", "Ollama", "TensorFlow.js", "AI API integration"],
  },
  {
    title: "Tools & Platforms",
    icon: "tools",
    items: ["Git", "GitHub", "Postman", "Docker", "Xcode", "Android Studio", "Vercel", "Netlify", "Play Console", "App Store Connect"],
  },
  {
    title: "Also worked with",
    icon: "more",
    items: ["WordPress REST API", "WPGraphQL", "WooCommerce", "SEO fundamentals", "Go (basics)"],
  },
];

export type Achievement = {
  title: string;
  tag: string;
  description: string;
  icon: "trophy" | "mobile" | "rocket";
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    title: "Hackathon — First Prize",
    tag: "Softroniics",
    description:
      "Won first prize in a hackathon at Softroniics — practical problem-solving and contributing to a technical project under time pressure.",
    icon: "trophy",
  },
  {
    title: "Web to Mobile Engineering",
    tag: "React Native · Expo",
    description:
      "Grew from MERN stack web development into cross-platform mobile, building Android and iOS apps with React Native and Expo.",
    icon: "mobile",
  },
  {
    title: "Application Release Experience",
    tag: "Google Play · App Store",
    description:
      "Prepared mobile builds, validated releases and worked through Google Play and Apple App Store distribution workflows.",
    icon: "rocket",
  },
];

export const INTERESTS = [
  "Modern web & mobile tech",
  "Software architecture",
  "AI tools & APIs",
  "Movies",
  "Football — Messi",
];

export const STATS = [
  { value: "2+", label: "Years building" },
  { value: "3", label: "Companies" },
  { value: "1st", label: "Hackathon prize" },
  { value: "2", label: "Mobile platforms" },
];
