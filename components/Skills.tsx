"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import { useState } from "react";
import { projects, skillGroups } from "@/data/content";
import { accentClasses } from "@/lib/accent";
import { openProject } from "@/lib/projectEvents";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const allSkills = skillGroups.flatMap((g) => g.skills.map((s) => ({ ...s, accent: g.accent, group: g.title })));

export default function Skills() {
  const [selected, setSelected] = useState("React");
  const skill = allSkills.find((s) => s.name === selected) ?? allSkills[0];
  const a = accentClasses[skill.accent];

  return (
    <section id="skills" aria-labelledby="skills-title" className="section">
      <div className="container-x">
        <SectionHeading
          id="skills-title"
          eyebrow="Skills"
          title={
            <>
              Tools I&rsquo;ve <em className="font-normal text-mint-deep">actually</em> used.
            </>
          }
          intro="No skill bars or percentages. Pick a skill to see where it shows up in my work."
        />

        <div className="grid gap-8 @4xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-5 @xl:grid-cols-2">
            {skillGroups.map((g, gi) => {
              const ga = accentClasses[g.accent];
              return (
                <Reveal key={g.title} delay={gi * 0.05}>
                  <fieldset className="h-full rounded-[1.75rem] border border-line bg-white/70 p-5">
                    <legend className="sr-only">{g.title}</legend>
                    <p className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
                      <span aria-hidden className={`size-2.5 rounded-full ${ga.dot}`} />
                      {g.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {g.skills.map((s) => {
                        const on = s.name === selected;
                        return (
                          <button
                            key={s.name}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setSelected(s.name)}
                            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${
                              on ? `${ga.bg} text-ink shadow-[var(--shadow-soft)] ring-2 ${ga.ring} -translate-y-0.5` : "bg-mist text-ink-soft hover:bg-white hover:text-ink"
                            }`}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.1}>
            <div className="@4xl:sticky @4xl:top-0">
              <div aria-live="polite" className={`relative overflow-hidden rounded-[2rem] ${a.bg} p-7 transition-colors duration-500`}>
                <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-white/40" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="relative"
                  >
                    <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">{skill.group}</p>
                    <h3 className="mt-2 font-display text-4xl font-medium">{skill.name}</h3>
                    <p className="mt-5 flex gap-3 leading-relaxed text-ink">
                      <Quote className={`mt-1 size-4 shrink-0 ${a.text}`} aria-hidden />
                      {skill.evidence}
                    </p>
                    {skill.projects && skill.projects.length > 0 && (
                      <div className="mt-6">
                        <p className="mb-2 text-sm font-semibold text-ink-soft">Seen in</p>
                        <ul className="flex flex-wrap gap-2">
                          {skill.projects.map((id) => {
                            const p = projects.find((x) => x.id === id);
                            if (!p) return null;
                            return (
                              <li key={id}>
                                <button
                                  type="button"
                                  onClick={() => openProject(id)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-white"
                                >
                                  {p.name} <ArrowUpRight className="size-3.5" aria-hidden />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
