/**
 * Marketing content for the home page sections. All copy is written for a
 * NON-TECHNICAL audience (benefit-first). Swap freely — components read from here.
 */

export const HERO = {
  label: "AI Automation Studio",
  // Bold one-liner. Split across lines for the staggered reveal.
  headline: ["We turn ideas", "into shipped", "products."],
  subline:
    "Orbit helps small and non-technical teams design, build, and automate real products — without needing a technical co-founder.",
  primaryCta: { label: "Start your MVP", href: "/contact" },
  secondaryCta: { label: "See our work", href: "/work" },
} as const;

export const MANIFESTO = {
  label: "Who we help",
  // Each line reveals on scroll.
  lines: [
    "You have the idea.",
    "We have the engineers, the architecture,",
    "and the AI to make it real —",
    "fast, affordable, and built to last.",
  ],
  body: "We work with founders, small businesses, and teams who aren't technical. You bring the vision and domain knowledge; we handle the product, the systems, and the automation — and we explain every step in plain language.",
} as const;

export type Service = {
  id: string;
  title: string;
  blurb: string;
  detail: string;
  bullets: string[];
};

export const SERVICES: Service[] = [
  {
    id: "mvp",
    title: "MVP & Prototype Building",
    blurb: "Get a real, usable product in front of customers in weeks, not months.",
    detail:
      "We take your idea and ship a focused first version you can show investors, test with users, and start selling.",
    bullets: ["Clickable prototype", "Launch-ready MVP", "User-tested flows"],
  },
  {
    id: "architecture",
    title: "Solution Architecture",
    blurb: "A clear technical blueprint so your product can grow without breaking.",
    detail:
      "We design how the pieces fit together — data, integrations, scale — so what you build today still works at 100x.",
    bullets: ["System design", "Tech stack choices", "Scalable foundations"],
  },
  {
    id: "automation",
    title: "AI Automation",
    blurb: "Put the repetitive work on autopilot with practical, reliable AI.",
    detail:
      "From support to operations, we automate the busywork with AI that's measured, safe, and tuned to your business.",
    bullets: ["Workflow automation", "AI assistants", "Smart integrations"],
  },
  {
    id: "team",
    title: "Team Building",
    blurb: "Stand up a product team — or extend yours — with vetted talent.",
    detail:
      "Need ongoing capacity? We assemble and embed the right engineers and designers, then hand over the keys when you're ready.",
    bullets: ["Embedded engineers", "Hiring support", "Knowledge handover"],
  },
];

export type ProcessStep = {
  index: string;
  title: string;
  description: string;
};

export const PROCESS: ProcessStep[] = [
  {
    index: "01",
    title: "Idea",
    description:
      "We pressure-test your concept, define the smallest valuable version, and agree on what success looks like.",
  },
  {
    index: "02",
    title: "Architecture",
    description:
      "We design the system — the data, the AI, the integrations — and map a clear, scalable path forward.",
  },
  {
    index: "03",
    title: "Build",
    description:
      "We ship in fast, visible iterations. You see working software every week, not status reports.",
  },
  {
    index: "04",
    title: "Launch",
    description:
      "We get it live, instrument it, and make sure real users can actually use it without friction.",
  },
  {
    index: "05",
    title: "Scale",
    description:
      "We automate, optimize, and harden — turning a launched product into a growing, dependable system.",
  },
];

export type Stat = {
  value: number;
  suffix: string;
  label: string;
};

export const STATS: Stat[] = [
  { value: 40, suffix: "+", label: "Products shipped" },
  { value: 6, suffix: "wk", label: "Avg. time to MVP" },
  { value: 12, suffix: "k+", label: "Hours automated / yr" },
  { value: 98, suffix: "%", label: "Client retention" },
];

/** Drives which live, generative cover animation a Work card renders. */
export type WorkVariant = "routes" | "vitals" | "ledger" | "mesh";

export type WorkItem = {
  id: string;
  client: string;
  title: string;
  category: string;
  year: string;
  /** Generative cover motif (see WorkCover). */
  variant: WorkVariant;
  /** Headline outcome — shown on the card for the case-study feel. */
  metric: string;
};

export const WORK: WorkItem[] = [
  {
    id: "atlas",
    client: "Atlas Logistics",
    title: "AI dispatch that books itself",
    category: "AI Automation",
    year: "2025",
    variant: "routes",
    metric: "−41% dispatch time",
  },
  {
    id: "bloom",
    client: "Bloom Health",
    title: "Patient intake MVP in 5 weeks",
    category: "MVP Build",
    year: "2025",
    variant: "vitals",
    metric: "5-week launch",
  },
  {
    id: "ledger",
    client: "Ledger & Co.",
    title: "Finance ops, fully automated",
    category: "AI Automation",
    year: "2024",
    variant: "ledger",
    metric: "12k hrs/yr saved",
  },
  {
    id: "verde",
    client: "Verde Market",
    title: "Marketplace architecture rebuild",
    category: "Architecture",
    year: "2024",
    variant: "mesh",
    metric: "100× scale headroom",
  },
];

export const AGENT_FLOW = {
  label: "Agentic orchestration",
  headline: "Your work, routed through a team of agents.",
  subline:
    "We don't bolt one chatbot onto your business. We design a network of specialized agents that hand work to each other — plan, research, build, review, ship — with a human in the loop wherever it counts.",
  // Accessible description of the live graph below.
  pipeline: [
    "Intake captures the request",
    "Planner breaks it into tasks",
    "Researcher and Builder work in parallel",
    "Reviewer checks the output",
    "Deploy ships it — and feeds learnings back to the Planner",
  ],
} as const;

export const CTA = {
  label: "Let's build",
  headline: "Have an idea worth shipping?",
  buttonLabel: "Book a free discovery call",
  href: "/contact",
} as const;
