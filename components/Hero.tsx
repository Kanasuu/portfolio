"use client";

import { motion } from "framer-motion";
import { ArrowDown, FileText, MousePointer2 } from "lucide-react";
import dynamic from "next/dynamic";
import { profile } from "@/data/content";
import HeroCharacter from "./character/HeroCharacter";
import { useCharacterPointer } from "./character/useCharacterPointer";

// The WebGL world loads after the text, so the headline and CTAs are usable immediately.
const SceneLayer = dynamic(() => import("./scene/SceneLayer"), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero() {
  const { targetRef, pointer, handlers } = useCharacterPointer();

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      {...handlers}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[linear-gradient(170deg,#fbe7f0_0%,#efe6fd_45%,#e4f6ef_100%)] pb-20 pt-28 lg:pt-24"
    >
      <SceneLayer />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-pearl" />

      {/* pointer-events-none lets the 3D gems behind this layer receive clicks; interactive children opt back in. */}
      <div className="container-x pointer-events-none relative z-10 grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="max-w-xl">
          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0} className="eyebrow mb-5">
            {profile.name} · Developer
          </motion.p>
          <motion.h1
            id="hero-title"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="font-display text-[2.55rem] leading-[1.04] font-medium tracking-tight text-ink sm:text-6xl lg:text-[4.3rem]"
          >
            A little <em className="font-normal text-rose-deep">imagination.</em>
            <br />A lot of <span className="pearl-text font-semibold">engineering.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 text-lg leading-relaxed text-ink-soft sm:text-xl"
          >
            {/* Each separator stays on the line before it, so a wrapped line never starts with "|". */}
            <span className="whitespace-nowrap">
              Computer Science Engineer<span className="mx-2 text-lavender" aria-hidden>|</span>
            </span>{" "}
            <span className="whitespace-nowrap">
              Developer<span className="mx-2 text-lavender" aria-hidden>|</span>
            </span>{" "}
            <span className="whitespace-nowrap">Creative Thinker</span>
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="pointer-events-auto mt-9 flex flex-wrap gap-3"
          >
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-pearl shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 hover:bg-iris"
            >
              Explore My Work
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
            </a>
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-6 py-3.5 font-semibold text-ink backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
            >
              <FileText className="size-4" aria-hidden /> View Resume
            </a>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-white/60 py-2 pl-2 pr-4 text-sm text-ink-soft backdrop-blur"
          >
            <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-lilac">
              <MousePointer2 className="size-3.5 text-iris" aria-hidden />
              <span className="absolute inset-0 rounded-full ring-2 ring-lavender motion-safe:animate-ping" aria-hidden />
            </span>
            <span className="hidden sm:inline">Move your cursor to explore. Click a floating gem to open a project.</span>
            <span className="sm:hidden">Tap a floating gem to open a project.</span>
          </motion.p>
        </div>

        {/* Top padding on small screens leaves room for the speech bubble above the character. */}
        <div className="pt-12 lg:pt-0">
          <HeroCharacter pointer={pointer} targetRef={targetRef} />
        </div>
      </div>
    </section>
  );
}
