"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  BookOpenCheck,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Home,
  Laptop,
  Lightbulb,
  Lock,
  Scale,
  ScanFace,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/data/content";
import { accentClasses } from "@/lib/accent";
import { onOpenProject } from "@/lib/projectEvents";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const icons: Record<string, LucideIcon> = {
  deepfake: ScanFace,
  jcms: Scale,
  vintech: Laptop,
  findmynest: Home,
  studybuddy: BookOpenCheck,
  smartaudit: ClipboardCheck,
  learnsphere: GraduationCap,
  college: Building2,
};

const featured = projects.filter((p) => p.featured);
const more = projects.filter((p) => !p.featured);

// Placement for the four featured projects, in data order (sized by the panel, not the viewport).
const layout = ["@2xl:col-span-2", "", "", "@2xl:col-span-2"];

export default function Projects({ openOnMount, onOpened }: { openOnMount?: string | null; onOpened?: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((id: string) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOpenId(id);
  }, []);

  useEffect(() => onOpenProject(open), [open]);

  // Opened from another section: show that case study straight away.
  useEffect(() => {
    if (!openOnMount) return;
    open(openOnMount);
    onOpened?.();
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    returnFocus.current?.focus?.();
  }, []);

  const active = projects.find((p) => p.id === openId) ?? null;

  return (
    <section id="projects" aria-labelledby="projects-title" className="section bg-gradient-to-b from-pearl via-mist to-pearl">
      <div className="container-x">
        <SectionHeading
          id="projects-title"
          eyebrow="Selected work"
          title={
            <>
              Projects with a <em className="font-normal text-iris">story</em> behind them.
            </>
          }
          intro="Open any project for the problem, what I built, the stack and the decisions behind it."
        />

        <div className="grid gap-5 @2xl:grid-cols-2">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06} className={layout[i]}>
              <FeaturedCard project={p} large={i === 0} onOpen={open} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <h3 className="mb-5 font-display text-2xl font-medium">More projects</h3>
          <ul className="grid gap-3 @xl:grid-cols-2">
            {more.map((p) => {
              const Icon = icons[p.id] ?? Sparkles;
              const a = accentClasses[p.accent];
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => open(p.id)}
                    className="group flex h-full w-full items-start gap-4 rounded-3xl border border-line bg-white/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-transparent hover:bg-white hover:shadow-[var(--shadow-soft)]"
                  >
                    <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${a.bg} ${a.text}`}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">{p.kind}</span>
                      <span className="mt-1 block font-semibold text-ink">{p.name}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{p.tagline}</span>
                    </span>
                    <ArrowUpRight className="size-5 shrink-0 text-ink-soft transition group-hover:rotate-45 group-hover:text-iris" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>

      <ProjectDialog project={active} onClose={close} />
    </section>
  );
}

function FeaturedCard({ project: p, large, onOpen }: { project: Project; large: boolean; onOpen: (id: string) => void }) {
  const reduce = useReducedMotion();
  const Icon = icons[p.id] ?? Sparkles;
  const a = accentClasses[p.accent];

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);

  return (
    <motion.article
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white bg-white/80 shadow-[var(--shadow-soft)] transition-shadow duration-500 hover:shadow-[var(--shadow-lift)]"
    >
      <div className={`relative overflow-hidden ${a.bg} ${large ? "h-52 @2xl:h-60" : "h-36"}`}>
        <motion.div
          aria-hidden
          className="absolute inset-y-0 w-1/2 bg-[radial-gradient(closest-side,rgb(255_255_255/0.75),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ left: glowX, x: "-50%" }}
        />
        <div aria-hidden className="absolute -bottom-10 -right-6 size-40 rounded-full bg-white/40" />
        <div aria-hidden className="absolute -left-8 -top-12 size-32 rounded-full bg-white/30" />
        <Icon
          aria-hidden
          strokeWidth={1.2}
          className={`absolute right-6 ${large ? "bottom-6 size-28 lg:size-36" : "bottom-4 size-20"} ${a.text} opacity-80 transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-110`}
        />
        <span className="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-ink backdrop-blur">{p.kind}</span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className={`font-display font-medium tracking-tight text-ink ${large ? "text-3xl" : "text-2xl"}`}>{p.name}</h3>
        <p className="mt-2 leading-relaxed text-ink-soft">{p.tagline}</p>
        {p.stack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
            {p.stack.slice(0, large ? 6 : 4).map((s) => (
              <li key={s} className="rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-ink-soft">
                {s}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={() => onOpen(p.id)}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-pearl transition after:absolute after:inset-0 after:rounded-[2rem] after:content-[''] hover:bg-iris"
          >
            Read case study <ArrowUpRight className="size-4" aria-hidden />
            <span className="sr-only">: {p.name}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ProjectDialog({ project: p, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) d.showModal();
    if (!p && d.open) d.close();
  }, [p]);

  const a = p ? accentClasses[p.accent] : null;
  const Icon = (p && icons[p.id]) || Sparkles;

  return (
    <dialog
      ref={ref}
      aria-labelledby="project-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[min(90svh,52rem)] w-[min(100%-2rem,46rem)] overflow-y-auto overscroll-contain rounded-[2rem] bg-pearl p-0 text-ink shadow-[var(--shadow-lift)] open:animate-[fadein_.25s_ease-out]"
    >
      {p && a && (
        <article>
          <header className={`relative overflow-hidden ${a.bg} px-6 pb-7 pt-6 sm:px-8`}>
            <Icon aria-hidden strokeWidth={1.2} className={`absolute -bottom-4 right-4 size-32 ${a.text} opacity-40`} />
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">{p.kind}</span>
              <button
                type="button"
                onClick={onClose}
                autoFocus
                className="grid size-10 place-items-center rounded-full bg-white/80 text-ink transition hover:bg-white"
                aria-label="Close project details"
              >
                <X className="size-5" />
              </button>
            </div>
            <h2 id="project-dialog-title" className="relative mt-6 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              {p.name}
            </h2>
            <p className="relative mt-2 max-w-lg text-ink-soft">{p.tagline}</p>
          </header>

          <div className="space-y-7 px-6 py-7 sm:px-8">
            {p.problem && (
              <DialogBlock title="The problem">
                <p className="leading-relaxed text-ink-soft">{p.problem}</p>
              </DialogBlock>
            )}
            {p.contribution.length > 0 && (
              <DialogBlock title="What I did">
                <ul className="space-y-2.5">
                  {p.contribution.map((c) => (
                    <li key={c} className="flex gap-3 leading-relaxed text-ink-soft">
                      <span aria-hidden className={`mt-2.5 size-1.5 shrink-0 rounded-full ${a.dot}`} />
                      {c}
                    </li>
                  ))}
                </ul>
              </DialogBlock>
            )}
            {p.stack.length > 0 && (
              <DialogBlock title="Tech stack">
                <ul className="flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <li key={s} className="rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold">
                      {s}
                    </li>
                  ))}
                </ul>
              </DialogBlock>
            )}
            {p.highlights.length > 0 && (
              <DialogBlock title="Decisions & challenges">
                <ul className="space-y-3">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex gap-3 rounded-2xl bg-mist p-4 text-sm leading-relaxed text-ink-soft">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-iris" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              </DialogBlock>
            )}
            {p.todo && (
              <p className="rounded-2xl border border-dashed border-lavender px-4 py-3 text-sm text-ink-soft">{p.todo}</p>
            )}

            <footer className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
              {p.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-pearl hover:bg-iris"
                >
                  {l.label} <ArrowUpRight className="size-4" aria-hidden />
                </a>
              ))}
              {p.linkNote && (
                <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                  <Lock className="size-4" aria-hidden /> {p.linkNote}
                </span>
              )}
            </footer>
          </div>
        </article>
      )}
    </dialog>
  );
}

function DialogBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="eyebrow mb-3">{title}</h3>
      {children}
    </section>
  );
}
