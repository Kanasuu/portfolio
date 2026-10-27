"use client";

import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Briefcase, FileText, FolderGit2, Mail, Sparkles, Trophy, UserRound, Wrench, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "@/data/content";
import { reactCharacter, type Reaction } from "@/lib/characterEvents";
import { onOpenProject } from "@/lib/projectEvents";
import About from "../About";
import Achievements from "../Achievements";
import Contact from "../Contact";
import Experience from "../Experience";
import Projects from "../Projects";
import Skills from "../Skills";
import HeroCharacter from "../character/HeroCharacter";
import { useCharacterPointer } from "../character/useCharacterPointer";
import AuroraSky from "./AuroraSky";

type PlaceId = "about" | "projects" | "skills" | "experience" | "achievements" | "contact";

type Place = {
  id: PlaceId;
  label: string;
  hint: string;
  Icon: LucideIcon;
  /** Planet accent colour. */
  color: string;
  /** Position on the orbit ring, degrees clockwise from the right. */
  angle: number;
  reaction: Reaction;
};

const places: Place[] = [
  { id: "about", label: "About", hint: "Who I am", Icon: UserRound, color: "#f472b6", angle: 212, reaction: { clip: "spin", line: "Nice to meet you." } },
  { id: "projects", label: "Projects", hint: "Case studies", Icon: FolderGit2, color: "#a78bfa", angle: 180, reaction: { clip: "laptop", line: "Here's what I've been building." } },
  { id: "skills", label: "Skills", hint: "Tools I use", Icon: Wrench, color: "#2dd4bf", angle: 148, reaction: { line: "The tools I work with." } },
  { id: "experience", label: "Experience", hint: "Where I've worked", Icon: Briefcase, color: "#fb923c", angle: -32, reaction: { line: "Here's where I've shipped work." } },
  { id: "achievements", label: "Achievements", hint: "Awards & certificates", Icon: Trophy, color: "#facc15", angle: 0, reaction: { clip: "celebrate", line: "A few milestones I'm proud of." } },
  { id: "contact", label: "Contact", hint: "Get in touch", Icon: Mail, color: "#60a5fa", angle: 32, reaction: { clip: "contact", line: "I'd love to hear from you." } },
];

const isPlace = (id: string): id is PlaceId => places.some((p) => p.id === id);

/**
 * One-screen galaxy map: Kanasu's character in the middle of space, with the sections orbiting her
 * as planets. A planet opens its section in a glass panel (a sheet on small screens) and she reacts
 * with her own clip per section (spin, laptop, celebrate, contact).
 */
export default function DreamMap() {
  const { targetRef, pointer, handlers } = useCharacterPointer();
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState<PlaceId | null>(null);
  // A project to open once the Projects panel mounts (requested from another section).
  const [pendingProject, setPendingProject] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedFrom = useRef<PlaceId | null>(null);
  const activeRef = useRef<PlaceId | null>(null);

  const open = useCallback((id: PlaceId) => {
    if (activeRef.current !== id) reactCharacter(places.find((p) => p.id === id)!.reaction);
    activeRef.current = id;
    setActive(id);
    openedFrom.current ??= id;
    scrollRef.current?.scrollTo({ top: 0 });
    // Keep her in view above the sheet on small screens.
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  }, []);

  const close = useCallback(() => {
    const from = openedFrom.current;
    openedFrom.current = null;
    activeRef.current = null;
    setActive(null);
    history.replaceState(null, "", window.location.pathname + window.location.search);
    if (from) window.requestAnimationFrame(() => document.getElementById(`planet-${from}`)?.focus());
  }, []);

  // Deep links (#projects etc.) open that section.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (isPlace(id)) {
      activeRef.current = id;
      setActive(id);
      openedFrom.current = id;
    }
  }, []);

  // Other sections can ask for a project's case study; route it through the Projects panel.
  useEffect(
    () =>
      onOpenProject((id) => {
        if (active === "projects") return; // the mounted Projects section handles it
        setPendingProject(id);
        open("projects");
      }),
    [active, open],
  );

  // Escape closes the panel (unless a project dialog is open; it closes itself first).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  // Move focus into the panel when it opens; no page scrolling behind the sheet.
  useEffect(() => {
    if (!active) return;
    panelRef.current?.focus({ preventScroll: true });
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [active]);

  const place = places.find((p) => p.id === active) ?? null;
  // With a panel open she stays full size, centred in the space left of it (the panel is min(56rem,52vw) wide, 1.5rem from the right).
  const side = active ? "xl:left-[calc((100vw-min(56rem,52vw)-1.5rem)/2)]" : "xl:left-[63%]";

  return (
    <div
      {...handlers}
      // --h: the character's height. Small screens: a portrait crop at the top. Wide screens: she
      // stands at the bottom of the screen, nearly full height, with the planets orbiting her.
      className="relative isolate min-h-svh overflow-x-clip pb-28 text-moon [--h:min(62svh,34rem)] xl:h-svh xl:overflow-hidden xl:pb-0 xl:[--h:96svh]"
    >
      <AuroraSky />

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4 sm:px-8">
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            close();
          }}
          className="group flex items-center gap-2.5 rounded-full px-2 py-1 font-display text-lg font-semibold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-full border border-white/20 bg-white/5 transition-transform duration-500 group-hover:rotate-[20deg]">
            <Sparkles className="size-4 text-glow-violet" aria-hidden />
          </span>
          {profile.fullName}
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => open("contact")}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-moon/80 transition hover:text-moon sm:inline-flex"
          >
            Contact
          </button>
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-4 py-2 text-sm font-semibold backdrop-blur transition hover:border-white/35 hover:bg-white/[0.12]"
          >
            <FileText className="size-4" aria-hidden /> Resume
          </a>
        </div>
      </header>

      <main id="main" className="relative xl:h-full">
        {/* Soft light behind her so she stands out against space. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute left-1/2 top-[calc(4rem_+_var(--h)*0.45)] -z-10 size-[calc(var(--h)*0.85)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(167_139_250/0.35)_0%,rgb(244_114_182/0.12)_40%,transparent_68%)] blur-2xl transition-[left] duration-700 xl:top-[50%] ${side}`}
        />

        {/* The character: a 4:5 crop on small screens, a wide 4:3 stage anchored to the bottom on wide screens. */}
        <div
          className={`relative mx-auto mt-16 h-[var(--h)] w-[calc(var(--h)*0.8)] max-w-full origin-bottom transition-[left] duration-700 ease-[cubic-bezier(.22,1,.36,1)] xl:absolute xl:bottom-0 xl:mt-0 xl:w-[calc(var(--h)*4/3)] xl:max-w-none xl:-translate-x-1/2 ${side}`}
        >
          <HeroCharacter pointer={pointer} targetRef={targetRef} variant="open" />
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: active ? 0 : 1 }}
          transition={{ duration: 0.35 }}
          inert={active ? true : undefined}
          className="relative z-10 mx-auto mt-2 max-w-md px-6 text-center xl:absolute xl:left-[clamp(1.5rem,5vw,5rem)] xl:top-1/2 xl:mx-0 xl:mt-0 xl:max-w-[22rem] xl:-translate-y-1/2 xl:px-0 xl:text-left"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-emerald-300 opacity-70 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
            </span>
            Open to internships &amp; graduate roles
          </p>
          <h1 className="mt-5 font-display text-[2.6rem] leading-[1.02] font-medium tracking-tight sm:text-[3.4rem]">
            Hi, I&rsquo;m Kanasu.
            <span className="mt-2 block text-[0.52em] leading-tight font-normal">
              A little <em className="text-glow-pink">imagination</em>, a lot of <span className="aurora-text font-semibold">engineering</span>.
            </span>
          </h1>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-moon/70">
            Computer Science Engineering student (class of {profile.graduation}) building web applications and AI tools, from an
            award-winning deepfake detector to a judicial case-management platform.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 xl:justify-start">
            <button
              type="button"
              onClick={() => open("projects")}
              className="group inline-flex items-center gap-2 rounded-full bg-moon px-5 py-3 text-sm font-semibold text-night shadow-[0_8px_30px_-8px_rgb(167_139_250/0.8)] transition hover:-translate-y-0.5 hover:bg-white"
            >
              View projects <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:border-white/40 hover:bg-white/[0.06]"
            >
              <FileText className="size-4" aria-hidden /> Resume
            </a>
          </div>
          <p className="mt-6 hidden text-xs text-moon/45 xl:block">Select a planet to explore, or click me to say hi.</p>
        </motion.div>

        <nav aria-label="Sections" inert={active ? true : undefined}>
          {/* Orbit ring (wide screens). */}
          <div
            aria-hidden
            className={`pointer-events-none absolute top-1/2 -z-[5] hidden h-[calc(var(--h)*0.66)] w-[calc(var(--h)*0.6_+_14rem)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/[0.09] transition-[left,opacity] duration-700 xl:block ${side} ${
              active ? "opacity-0" : "opacity-100"
            }`}
          />
          <ul
            className={`relative z-10 mx-auto mt-10 grid max-w-md grid-cols-3 gap-x-3 gap-y-7 px-4 transition-opacity duration-500 xl:absolute xl:top-1/2 xl:mt-0 xl:block xl:size-0 xl:max-w-none xl:px-0 ${side} ${
              active ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            {places.map((p, i) => (
              <Planet key={p.id} place={p} index={i} pointer={pointer} reduce={reduce} onOpen={open} />
            ))}
          </ul>
        </nav>

        <AnimatePresence>
          {place && (
            <motion.div
              key="panel"
              ref={panelRef}
              id="dream-panel"
              role="dialog"
              aria-modal="false"
              aria-label={place.label}
              tabIndex={-1}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 top-[30svh] z-40 flex flex-col overflow-hidden rounded-t-[1.75rem] border border-white/40 bg-pearl/[0.97] text-ink shadow-[0_-20px_80px_-20px_rgb(124_92_255/0.55)] backdrop-blur-xl outline-none xl:inset-x-auto xl:bottom-6 xl:right-6 xl:top-20 xl:w-[min(56rem,52vw)] xl:rounded-[1.75rem]"
            >
              <div className="flex items-center gap-2 border-b border-line/70 px-3 py-3 sm:px-5">
                <ul className="flex flex-1 gap-1 overflow-x-auto [scrollbar-width:none]" aria-label="Switch section">
                  {places.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => open(p.id)}
                        aria-current={p.id === active ? "true" : undefined}
                        className="relative whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink aria-[current]:text-ink"
                      >
                        {p.id === active && (
                          <motion.span
                            layoutId="panel-pill"
                            className="absolute inset-0 -z-10 rounded-full bg-lilac"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                        {p.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close and go back to the map"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-lilac"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <div ref={scrollRef} className="dream-panel @container flex-1 overflow-y-auto overscroll-contain px-5 pb-28 pt-8 sm:px-9">
                {active === "about" && <About />}
                {active === "projects" && <Projects openOnMount={pendingProject} onOpened={() => setPendingProject(null)} />}
                {active === "skills" && <Skills />}
                {active === "experience" && <Experience />}
                {active === "achievements" && <Achievements />}
                {active === "contact" && <Contact />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <p className="relative mt-16 text-center text-xs text-moon/40 xl:absolute xl:bottom-5 xl:left-[clamp(1.5rem,5vw,5rem)] xl:mt-0 xl:text-left">
        © {new Date().getFullYear()} {profile.fullName}
      </p>
    </div>
  );
}

function Planet({
  place: p,
  index,
  pointer,
  reduce,
  onOpen,
}: {
  place: Place;
  index: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  reduce: boolean;
  onOpen: (id: PlaceId) => void;
}) {
  // Gentle parallax: planets drift toward the cursor, some more than others.
  const depth = 8 + (index % 3) * 5;
  const sx = useSpring(pointer.x, { stiffness: 60, damping: 16 });
  const sy = useSpring(pointer.y, { stiffness: 60, damping: 16 });
  const x = useTransform(sx, (v) => (reduce ? 0 : v * depth));
  const y = useTransform(sy, (v) => (reduce ? 0 : v * depth));
  const { Icon } = p;
  const rad = (p.angle * Math.PI) / 180;

  return (
    <li
      // Wide screens: on the orbit ring (same radii as the ring drawn above).
      style={{ "--ox": Math.cos(rad).toFixed(3), "--oy": Math.sin(rad).toFixed(3), "--c": p.color } as React.CSSProperties}
      className="flex justify-center xl:absolute xl:left-[calc(var(--ox)*(var(--h)*0.3_+_7rem))] xl:top-[calc(var(--oy)*var(--h)*0.33)] xl:-translate-x-1/2 xl:-translate-y-1/2"
    >
      <motion.div style={{ x, y }}>
        <div className="motion-safe:animate-float" style={{ animationDelay: `${-index * 1.3}s`, animationDuration: "7s" }}>
          <button
            id={`planet-${p.id}`}
            type="button"
            onClick={() => onOpen(p.id)}
            aria-controls="dream-panel"
            className="group flex flex-col items-center gap-2 rounded-3xl p-1 text-center"
          >
            <span className="relative grid size-14 place-items-center rounded-full border border-white/15 bg-[radial-gradient(circle_at_32%_28%,rgb(255_255_255/0.22),rgb(255_255_255/0.04)_60%)] shadow-[0_0_24px_-6px_var(--c),inset_0_0_14px_-4px_var(--c)] backdrop-blur-md transition duration-500 group-hover:scale-110 group-hover:border-white/35 group-hover:shadow-[0_0_36px_-2px_var(--c),inset_0_0_18px_-4px_var(--c)] xl:size-16">
              {/* A thin tilted ring, like a small planet's. */}
              <span aria-hidden className="absolute inset-[-7px] rounded-[50%] border border-white/10 [transform:rotate(-18deg)_scaleY(0.38)]" />
              <Icon className="relative size-6 xl:size-7" style={{ color: p.color }} aria-hidden strokeWidth={1.7} />
            </span>
            <span>
              <span className="block whitespace-nowrap text-sm font-semibold text-moon">{p.label}</span>
              <span className="block whitespace-nowrap text-[0.7rem] text-moon/50">{p.hint}</span>
            </span>
          </button>
        </div>
      </motion.div>
    </li>
  );
}
