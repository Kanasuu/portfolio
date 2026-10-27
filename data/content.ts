/*
 * All portfolio facts live here.
 *
 * Sources: Kanasu_Vinay_Resume.pdf (Sept 2026), the Cisco/NetAcad resume variant,
 * the JCMS repository docs and Kanasu's COMPLETED log, and the Vintech and
 * Find My Nest source code. Anything not backed by those is marked `todo`
 * and must be filled in by Kanasu before it is treated as fact.
 */

export type Accent = "rose" | "lavender" | "mint" | "peach";

export type ProjectLink = { label: string; href: string };

export type Project = {
  id: string;
  name: string;
  tagline: string;
  kind: string;
  featured: boolean;
  accent: Accent;
  problem?: string;
  contribution: string[];
  stack: string[];
  highlights: string[];
  links: ProjectLink[];
  /** Shown instead of links when there is nothing public to link to. */
  linkNote?: string;
  /** Visible "details to be added" marker. Each one is a TODO for Kanasu. */
  todo?: string;
};

export const profile = {
  name: "Kanasu V.",
  fullName: "Kanasu Vinay",
  role: "Computer Science Engineering student & developer",
  graduation: "2027",
  location: "Tiptur, Karnataka, India",
  college: "Kalpataru Institute of Technology (VTU)",
  degree: "B.E. Computer Science & Engineering",
  cgpa: "8.20",
  languages: ["Kannada", "English", "Hindi"],
  email: "kanasuuvinay@gmail.com",
  linkedin: "https://www.linkedin.com/in/kanasu-vinay-522600290",
  github: "https://github.com/Kanasuu",
  resume: "/resume.pdf",
};

export const projects: Project[] = [
  {
    id: "deepfake",
    name: "Deepfake Detection System",
    tagline: "An AI system that spots deepfakes, edited photos and manipulated videos.",
    kind: "Hackathon · 1st place",
    featured: true,
    accent: "rose",
    problem:
      "Convincing fake images and videos are now easy to make and hard to spot by eye. The goal was a tool that tells people when a photo or video has been faked or edited.",
    contribution: [
      "Built an AI detection system for fake images, edited photos and manipulated videos.",
      "Won 1st place and a ₹10,000 cash prize at AI-Thon, a state-level hackathon.",
    ],
    stack: [],
    highlights: [],
    links: [],
    linkNote: "No public repository or demo yet.",
    // TODO(Kanasu): add the model/approach, tech stack, your role in the team, and a repo/demo link if one exists.
    todo: "Tech stack and technical write-up coming soon.",
  },
  {
    id: "jcms",
    name: "Judicial Case Management System",
    tagline: "Decision support that predicts case timelines, ranks hearings by urgency and keeps citizens informed.",
    kind: "College major project · team of 4",
    featured: true,
    accent: "lavender",
    problem:
      "India has about 52 million pending court cases. Hearings are often scheduled first-come-first-served, litigants can't tell how long a case will take, and checking status can mean a trip to court.",
    contribution: [
      "Owned the admin app and the shared design system (UI kit).",
      "Built login and authentication on both the Express backend and the React frontend.",
      "Built the admin dashboard, the case queue ranked by P-Score, case detail pages, the weekly schedule screen and the notification log.",
      "Wrote the admin case APIs and the hearing-update API with Express and Prisma.",
      "Ran the admin accessibility audit: keyboard and automated checks (55/55 passing) plus a hands-on NVDA screen-reader pass.",
    ],
    stack: ["React (Vite)", "Tailwind CSS", "React Router", "Recharts", "Node.js", "Express", "Prisma", "PostgreSQL", "MSW", "FastAPI (ML service)"],
    highlights: [
      "Decision support, not decision making: generated schedules are recommendations, and registrar overrides are logged with a reason.",
      "Each case's P-Score (0–100) is shown with its breakdown, so the ranking can be explained.",
      "Mock Service Worker mode let the admin frontend be built and tested before the live backend was ready.",
      "The session token is kept in memory and sessionStorage; moving to an httpOnly cookie is documented as the next hardening step.",
    ],
    links: [],
    linkNote: "The team repository is private.",
  },
  {
    id: "vintech",
    name: "Vintech Tiptur",
    tagline: "Online showroom and service desk for a family-owned laptop shop.",
    kind: "Real-world project · family business",
    featured: true,
    accent: "mint",
    problem: "A local laptop shop in Tiptur needed a place online to show its products and services.",
    contribution: [
      "Designed and built the website.",
      "Product catalogue, service booking and a service-status lookup for customers.",
      "Admin area for products (including bulk upload), services and sales.",
    ],
    stack: ["React", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "Supabase", "TanStack Query"],
    highlights: ["Built with AI-assisted development (Lovable) on a Supabase backend, with database migrations kept in the repository."],
    links: [],
    // TODO(Kanasu): add the live shop URL if the site is deployed.
    linkNote: "Live link to be added.",
  },
  {
    id: "findmynest",
    name: "Find My Nest",
    tagline: "A rental finder for Tiptur that connects tenants with property owners.",
    kind: "Web app project",
    featured: true,
    accent: "peach",
    problem: "Finding a rental in a smaller town usually means word of mouth. Find My Nest puts listings, applications and owner contact in one place.",
    contribution: [
      "Built the rental-search web app across the front end, back end and database connectivity.",
      "Separate dashboards for tenants and property owners, property detail pages and a rental-application flow.",
      "Verification endpoints for OTP and Aadhaar-number format, plus an AI chat assistant powered by Google Gemini.",
    ],
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Clerk", "Vercel AI SDK", "Google Gemini", "Radix UI"],
    highlights: ["Next.js API routes handle applications, OTP verification and the chat assistant."],
    links: [],
    // TODO(Kanasu): add a repo or demo link you are happy to share.
    linkNote: "Repository and demo links to be added.",
  },
  {
    id: "studybuddy",
    name: "Study Buddy",
    tagline: "AI academic planner that builds study schedules, quizzes and flashcards.",
    kind: "Hackathon · Scaler School of Technology",
    featured: false,
    accent: "lavender",
    contribution: ["Led the complete UI design, structure flow and feature functionality."],
    stack: [],
    highlights: [],
    links: [],
    todo: "Tech stack to be added.",
  },
  {
    id: "smartaudit",
    name: "Smart Audit & Tax Compliance",
    tagline: "An AI-powered auditing concept for GST filing, fraud detection and compliance checks.",
    kind: "Unisys Innovation Program · national level",
    featured: false,
    accent: "mint",
    contribution: ["Designed the concept as part of the Unisys Innovation Program."],
    stack: [],
    highlights: [],
    links: [],
    todo: "Architecture details to be added.",
  },
  {
    id: "learnsphere",
    name: "LearnSphere",
    tagline: "A learning platform built on the MERN stack.",
    kind: "Project",
    featured: false,
    accent: "rose",
    contribution: [],
    stack: ["MongoDB", "Express", "React", "Node.js"],
    highlights: [],
    links: [],
    // TODO(Kanasu): add what it does, your role and links.
    todo: "Write-up coming soon.",
  },
  {
    id: "college",
    name: "College Management System",
    tagline: "A system for managing college records and workflows.",
    kind: "College project",
    featured: false,
    accent: "peach",
    contribution: [],
    stack: [],
    highlights: [],
    links: [],
    // TODO(Kanasu): confirm the description, add the stack, your role and links.
    todo: "Write-up coming soon.",
  },
];

export type SkillGroup = { title: string; accent: Accent; skills: Skill[] };
export type Skill = { name: string; evidence: string; projects?: string[] };

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    accent: "lavender",
    skills: [
      { name: "Python", evidence: "Core language on my resume, backed by Cisco Python Essentials 1 & 2." },
      { name: "JavaScript", evidence: "The JCMS admin app and its Express APIs are plain JavaScript.", projects: ["jcms"] },
      { name: "TypeScript", evidence: "Used in the Vintech and Find My Nest codebases.", projects: ["vintech", "findmynest"] },
      { name: "C", evidence: "Part of my programming foundation from coursework." },
      { name: "Java (basics)", evidence: "Working knowledge from coursework." },
      { name: "C++ (learning)", evidence: "Currently learning, alongside data structures and algorithms." },
      { name: "SQL", evidence: "Database connectivity with SQL, listed on my resume." },
    ],
  },
  {
    title: "Web",
    accent: "rose",
    skills: [
      { name: "React", evidence: "Built the whole JCMS admin app and UI kit in React.", projects: ["jcms", "vintech"] },
      { name: "Next.js", evidence: "Find My Nest uses Next.js pages and API routes.", projects: ["findmynest"] },
      { name: "Node.js & Express", evidence: "Wrote the JCMS auth, admin case and hearing-update APIs.", projects: ["jcms"] },
      { name: "Tailwind CSS", evidence: "Styling layer of the JCMS UI kit and the Vintech site.", projects: ["jcms", "vintech"] },
      { name: "HTML & CSS", evidence: "Foundation of every front end I've built." },
      { name: "Accessibility", evidence: "Ran keyboard, automated and NVDA screen-reader audits on the JCMS admin screens.", projects: ["jcms"] },
    ],
  },
  {
    title: "Data & backend",
    accent: "mint",
    skills: [
      { name: "PostgreSQL & Prisma", evidence: "JCMS admin APIs read and write PostgreSQL through Prisma.", projects: ["jcms"] },
      { name: "Supabase", evidence: "Backend and database for the Vintech site.", projects: ["vintech"] },
      { name: "Power BI", evidence: "Built an Employee Utilization Dashboard during my Cyient internship." },
      { name: "Data analysis", evidence: "Dashboards and reporting at Cyient; Cisco Introduction to Data Science." },
    ],
  },
  {
    title: "Tools & practice",
    accent: "peach",
    skills: [
      { name: "Git & GitHub", evidence: "Branch-and-pull-request workflow on the four-person JCMS team.", projects: ["jcms"] },
      { name: "AI-assisted development", evidence: "Used across my projects, including Vintech (Lovable) and Find My Nest's Gemini assistant.", projects: ["vintech", "findmynest"] },
      { name: "Prompt engineering", evidence: "Listed on my resume and used in AI-driven hackathon builds.", projects: ["deepfake", "studybuddy"] },
      { name: "Data structures & algorithms", evidence: "Ongoing practice alongside C++." },
    ],
  },
];

export type Achievement = { title: string; detail: string; meta: string; accent: Accent; projectId?: string };

export const achievements: Achievement[] = [
  {
    title: "1st place, AI-Thon",
    detail: "State-level hackathon, won with the Deepfake Detection System. ₹10,000 cash prize.",
    meta: "Hackathon win",
    accent: "rose",
    projectId: "deepfake",
  },
  {
    title: "Unisys Innovation Program",
    detail: "National-level program. Designed Smart Audit & Tax Compliance, an AI-powered auditing concept.",
    meta: "National program",
    accent: "lavender",
    projectId: "smartaudit",
  },
  {
    title: "Scaler School of Technology Hackathon",
    detail: "Built Study Buddy and led its UI design, flow and features.",
    meta: "Hackathon",
    accent: "mint",
    projectId: "studybuddy",
  },
  {
    title: "CGPA 8.20",
    detail: "B.E. Computer Science & Engineering, Kalpataru Institute of Technology (VTU), through 6th semester.",
    meta: "Academics",
    accent: "peach",
  },
];

export const certifications = [
  "Python Essentials 1",
  "Python Essentials 2",
  "Introduction to Data Science",
  "Cybersecurity Essentials",
  "Apply AI: Analyze Customer Reviews",
  "CCNA: Introduction to Networks",
  "CCNA: Switching, Routing & Wireless Essentials",
  "CCNA: Enterprise Networking, Security & Automation",
  "Getting Started with Cisco Packet Tracer",
  "Exploring Networking with Cisco Packet Tracer",
  "Introduction to Modern AI",
];

export type ExperienceItem = {
  type: "Internship" | "Team project" | "Real-world project" | "Hackathon";
  title: string;
  org: string;
  when: string;
  points: string[];
  projectId?: string;
};

export const experience: ExperienceItem[] = [
  {
    type: "Internship",
    title: "Software Developer Intern",
    org: "Cyient",
    when: "Jul – Aug 2026",
    points: [
      "Built and maintained interactive Power BI dashboards from employee data for business reporting.",
      "Developed an Employee Utilization Dashboard to visualize workforce data and support decisions.",
    ],
  },
  {
    type: "Team project",
    title: "Admin app & design system lead",
    org: "JCMS, college major project",
    when: "2026",
    points: [
      "Owned the admin experience end to end, from the UI kit through to the Express and Prisma APIs.",
      "Led the accessibility audit of the admin screens.",
    ],
    projectId: "jcms",
  },
  {
    type: "Real-world project",
    title: "Website designer & developer",
    org: "Vintech Tiptur (family business)",
    when: "",
    points: ["Designed and built the shop's online showroom and service desk."],
    projectId: "vintech",
  },
];
