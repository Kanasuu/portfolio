"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Award, BadgeCheck, GraduationCap, Medal, Trophy } from "lucide-react";
import { useState } from "react";
import { achievements, certifications } from "@/data/content";
import { accentClasses } from "@/lib/accent";
import { openProject } from "@/lib/projectEvents";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const icons = [Trophy, Award, Medal, GraduationCap];
const PREVIEW = 6;

export default function Achievements() {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? certifications : certifications.slice(0, PREVIEW);

  return (
    <section id="achievements" aria-labelledby="achievements-title" className="section">
      <div className="container-x">
        <SectionHeading
          id="achievements-title"
          eyebrow="Achievements"
          title={
            <>
              A few <em className="font-normal text-iris">proud</em> moments.
            </>
          }
        />

        <div className="grid gap-5 @xl:grid-cols-2 @5xl:grid-cols-4">
          {achievements.map((ach, i) => {
            const a = accentClasses[ach.accent];
            const Icon = icons[i] ?? Award;
            return (
              <Reveal key={ach.title} delay={i * 0.06}>
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex h-full flex-col rounded-[1.75rem] border border-line bg-white/80 p-6 hover:shadow-[var(--shadow-soft)]"
                >
                  <span className={`grid size-12 place-items-center rounded-2xl ${a.bg} ${a.text}`}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <p className="mt-5 text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">{ach.meta}</p>
                  <h3 className="mt-1 font-display text-xl font-medium leading-snug">{ach.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{ach.detail}</p>
                  {ach.projectId && (
                    <button
                      type="button"
                      onClick={() => openProject(ach.projectId!)}
                      className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-iris underline-offset-4 hover:underline"
                    >
                      See the project <ArrowUpRight className="size-4" aria-hidden />
                    </button>
                  )}
                </motion.article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-14">
          <div className="rounded-[2rem] bg-gradient-to-br from-lilac via-pearl to-mint p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-medium">Certifications</h3>
                <p className="mt-1 text-sm text-ink-soft">Courses completed through Cisco Networking Academy.</p>
              </div>
              <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">{certifications.length} courses</span>
            </div>
            <ul id="cert-list" className="mt-6 grid gap-2.5 @xl:grid-cols-2 @4xl:grid-cols-3">
              {shown.map((c) => (
                <li key={c} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold">
                  <BadgeCheck className="size-4 shrink-0 text-mint-deep" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
            {certifications.length > PREVIEW && (
              <button
                type="button"
                aria-expanded={showAll}
                aria-controls="cert-list"
                onClick={() => setShowAll((v) => !v)}
                className="mt-5 rounded-full border border-white bg-white/70 px-5 py-2.5 text-sm font-semibold hover:bg-white"
              >
                {showAll ? "Show fewer" : `Show all ${certifications.length}`}
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
