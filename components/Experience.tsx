"use client";

import { ArrowUpRight, Briefcase, Store, Users } from "lucide-react";
import { experience } from "@/data/content";
import { openProject } from "@/lib/projectEvents";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const typeStyle = {
  Internship: { icon: Briefcase, chip: "bg-lilac text-iris" },
  "Team project": { icon: Users, chip: "bg-blush text-rose-deep" },
  "Real-world project": { icon: Store, chip: "bg-mint text-mint-deep" },
  Hackathon: { icon: Users, chip: "bg-peach text-peach-deep" },
} as const;

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="section bg-gradient-to-b from-pearl via-[#fbf3f8] to-pearl">
      <div className="container-x">
        <SectionHeading
          id="experience-title"
          eyebrow="Experience"
          title={
            <>
              Where I&rsquo;ve <em className="font-normal text-rose-deep">shipped</em> work.
            </>
          }
          intro="Each entry is labelled as an internship, a team project or real-world work."
        />

        <ol className="relative space-y-6 border-l-2 border-dashed border-lavender/70 pl-6 sm:pl-10">
          {experience.map((e, i) => {
            const t = typeStyle[e.type];
            const Icon = t.icon;
            return (
              <li key={e.title} className="relative">
                <span aria-hidden className="absolute -left-[2.15rem] top-6 grid size-8 place-items-center rounded-full border-4 border-pearl bg-lavender sm:-left-[3.15rem]">
                  <span className="size-2 rounded-full bg-white" />
                </span>
                <Reveal delay={i * 0.05}>
                  <article className="rounded-[1.75rem] border border-line bg-white/80 p-6 transition hover:shadow-[var(--shadow-soft)]">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${t.chip}`}>
                        <Icon className="size-3.5" aria-hidden /> {e.type}
                      </span>
                      {e.when && <span className="text-sm font-semibold text-ink-soft">{e.when}</span>}
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-medium">{e.title}</h3>
                    <p className="font-semibold text-ink-soft">{e.org}</p>
                    <ul className="mt-4 space-y-2">
                      {e.points.map((pt) => (
                        <li key={pt} className="flex gap-3 leading-relaxed text-ink-soft">
                          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-rose" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    {e.projectId && (
                      <button
                        type="button"
                        onClick={() => openProject(e.projectId!)}
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-iris underline-offset-4 hover:underline"
                      >
                        View the project <ArrowUpRight className="size-4" aria-hidden />
                      </button>
                    )}
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
