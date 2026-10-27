"use client";

import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionTemplate,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import SpeechBubble from "./SpeechBubble";
import type { CharacterPointer } from "./useCharacterPointer";

const GREETED_KEY = "kanasu:greeted";
const GREETING = ["Hiii! Welcome to my little universe ✨", "I'm Kanasu! Let's explore my work together 💗"];
const TAP_LINES = [
  "Hi there! 👋",
  "Thanks for visiting my little universe 💗",
  "Psst… the floating gems open my projects ✨",
  "Scroll down for the full case studies 🌷",
];

/**
 * FALLBACK character: the supplied illustration as layered 2.5D artwork.
 * Used when WebGL is unavailable, the VRM model is missing in production, or it fails to load.
 * The real character is the VRM in ./vrm (see HeroCharacter.tsx).
 *
 * The source is a single flat illustration, so the eyes, head and hands cannot
 * move independently. The "life" comes from layering instead: the frame leans
 * and tilts toward the cursor, the portrait shifts and tilts slightly inside it
 * (window depth), a soft light follows the cursor across her face, and gestures
 * (knock, wave) move the whole frame.
 *
 * To swap in a rigged GLB later, keep this component's props (`pointer`,
 * `targetRef`) and the greeting/bubble logic, and replace the <motion.button>
 * frame with a canvas that maps `pointer` to head/eye bones and plays
 * knock/wave clips. Keep this version as the reduced-motion / no-WebGL fallback.
 */
export default function PortraitCharacter({
  pointer,
  targetRef,
}: {
  pointer: CharacterPointer;
  targetRef: React.RefObject<HTMLDivElement | null>;
}) {
  const reduce = useReducedMotion() ?? false;
  const gesture = useAnimationControls();
  const [message, setMessage] = useState<string | null>(null);
  const [knockId, setKnockId] = useState(0);
  const [waveId, setWaveId] = useState(0);
  const timers = useRef<number[]>([]);
  const tapIndex = useRef(0);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const knock = useCallback(() => {
    if (reduce) return;
    setKnockId((k) => k + 1);
    void gesture.start({
      scale: [1, 1.03, 1, 1.03, 1],
      transition: { duration: 0.7, times: [0, 0.16, 0.4, 0.56, 1], ease: "easeOut" },
    });
  }, [gesture, reduce]);

  const wave = useCallback(() => {
    if (reduce) return;
    setWaveId((w) => w + 1);
    void gesture.start({
      rotate: [0, -4, 3.5, -2.5, 1.5, 0],
      transition: { duration: 1.1, ease: "easeInOut" },
    });
  }, [gesture, reduce]);

  // First-visit greeting. The flag is written when the greeting actually shows,
  // so React Strict Mode's double-mount in development doesn't swallow it.
  // Add ?greet to the URL to replay it.
  useEffect(() => {
    let firstVisit = false;
    try {
      firstVisit = !window.localStorage.getItem(GREETED_KEY);
    } catch {
      firstVisit = false;
    }
    if (new URLSearchParams(window.location.search).has("greet")) firstVisit = true;
    if (!firstVisit) return;

    // Each step schedules the next, so every message gets its full time on screen
    // even if the main thread stalls (e.g. while the 3D scene compiles on a slow device).
    later(() => {
      knock();
      later(() => {
        setMessage(GREETING[0]);
        markGreeted();
        later(() => {
          setMessage(GREETING[1]);
          later(() => setMessage(null), 5300);
        }, 3200);
      }, 550);
    }, reduce ? 400 : 1100);
    return clearTimers;
  }, [reduce, knock, later, clearTimers]);

  const dismiss = useCallback(() => {
    clearTimers();
    markGreeted();
    setMessage(null);
  }, [clearTimers]);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, dismiss]);

  const sayHi = () => {
    clearTimers();
    markGreeted();
    wave();
    setMessage(TAP_LINES[tapIndex.current++ % TAP_LINES.length]);
    later(() => setMessage(null), 4200);
  };

  // Pointer → smoothed motion values → transforms. Springs give the gentle ease back to rest.
  const sx = useSpring(pointer.x, { stiffness: 70, damping: 18, mass: 0.7 });
  const sy = useSpring(pointer.y, { stiffness: 70, damping: 18, mass: 0.7 });
  const rotateY = useTransform(sx, [-1, 1], [-10, 10]);
  const rotateX = useTransform(sy, [-1, 1], [7, -7]);
  const lean = useTransform(sx, [-1, 1], [-10, 10]);
  const headTilt = useTransform(sx, [-1, 1], [-2.5, 2.5]);
  const depthX = useTransform(sx, (v) => v * -12);
  const depthY = useTransform(sy, (v) => v * -8);
  const sheenX = useTransform(sx, [-1, 1], ["-30%", "30%"]);
  const lightX = useTransform(sx, [-1, 1], ["36%", "64%"]);
  const lightY = useTransform(sy, [-1, 1], ["22%", "42%"]);
  const light = useMotionTemplate`radial-gradient(circle at ${lightX} ${lightY}, rgb(255 255 255 / 0.34), transparent 40%)`;

  return (
    <motion.div
      ref={targetRef}
      className="relative mx-auto w-full max-w-[17rem] sm:max-w-[22rem] lg:max-w-[25rem]"
      initial={reduce ? false : { opacity: 0, y: 32, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.25 }}
    >
      <Layer
        x={sx}
        y={sy}
        amount={-26}
        className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,#f9c6d9_0%,transparent_55%),radial-gradient(circle_at_75%_70%,#c9b8f4_0%,transparent_55%),radial-gradient(circle_at_60%_20%,#c6eedf_0%,transparent_45%)] opacity-90 blur-2xl"
      />
      <Layer x={sx} y={sy} amount={-14} className="arch absolute -inset-3 rotate-[-4deg] border-2 border-white/70" />

      <SpeechBubble message={message} onDismiss={dismiss} />

      <div className="relative motion-safe:animate-breathe">
        <motion.div animate={gesture} style={{ x: lean, transformOrigin: "50% 100%" }}>
          <motion.button
            type="button"
            onClick={sayHi}
            aria-label="Say hi to Kanasu"
            whileHover={reduce ? undefined : { y: -4 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            style={{ rotateX, rotateY, transformPerspective: 1100 }}
            className="arch pointer-events-auto relative block aspect-[4/5] w-full cursor-pointer overflow-hidden border-[6px] border-white/85 bg-lilac shadow-[var(--shadow-lift)] will-change-transform focus-visible:outline-offset-[6px]"
          >
            <motion.div
              className="absolute -inset-5"
              style={{ x: depthX, y: depthY, rotate: headTilt, transformOrigin: "50% 75%" }}
            >
              <Image
                src="/character.webp"
                alt="Illustrated portrait of Kanasu: long dark wavy hair, a lavender top and a warm smile, in a softly lit pastel room"
                fill
                priority
                sizes="(min-width: 1024px) 25rem, (min-width: 640px) 22rem, 17rem"
                className="object-cover object-[50%_28%]"
              />
            </motion.div>
            <motion.div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: light }} />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.35)_50%,transparent_65%)] mix-blend-soft-light"
              style={{ x: sheenX }}
            />
            {knockId > 0 && <KnockRipples key={knockId} />}
          </motion.button>
        </motion.div>
        <AnimatePresence>{waveId > 0 && <WaveHand key={waveId} />}</AnimatePresence>
      </div>

      {/* The floating island the portal rests on */}
      <Layer x={sx} y={sy} amount={6} className="relative mx-auto -mt-3 h-8 w-[78%]">
        <div className="absolute left-1/2 top-1/2 h-14 w-[55%] -translate-x-1/2 bg-gradient-to-b from-lavender/80 to-transparent [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-mint to-mint-mid shadow-[0_18px_30px_-12px_rgb(108_79_207/0.35)]" />
      </Layer>

      <Chip x={sx} y={sy} amount={18} className="-left-4 top-[12%] sm:-left-12" delay="0s" dot="bg-rose">
        1st place · AI-Thon
      </Chip>
      <Chip x={sx} y={sy} amount={24} className="-right-3 top-[46%] sm:-right-10" delay="1.2s" dot="bg-lavender">
        React · Node · Python
      </Chip>
      <Chip x={sx} y={sy} amount={14} className="-left-2 bottom-[18%] sm:-left-8" delay="2.1s" dot="bg-mint-mid">
        CSE · Class of 2027
      </Chip>

      {["left-[8%] top-[2%] size-4", "right-[6%] top-[12%] size-3", "right-[14%] bottom-[24%] size-5", "left-[44%] -top-6 size-3"].map(
        (pos, i) => (
          <svg
            key={pos}
            aria-hidden
            viewBox="0 0 24 24"
            className={`pointer-events-none absolute ${pos} fill-white drop-shadow-[0_0_6px_rgb(201_184_244/0.9)] motion-safe:animate-twinkle`}
            style={{ animationDelay: `${i * 0.7}s` }}
          >
            <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
          </svg>
        ),
      )}
    </motion.div>
  );
}

function markGreeted() {
  try {
    window.localStorage.setItem(GREETED_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); the greeting simply shows again next time.
  }
}

/** A decorative layer that drifts with the pointer by `amount` px (negative = opposite direction). */
export function Layer({
  x,
  y,
  amount,
  className,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  amount: number;
  className: string;
  children?: React.ReactNode;
}) {
  const tx = useTransform(x, (v) => v * amount);
  const ty = useTransform(y, (v) => v * amount);
  return (
    <motion.div aria-hidden className={`pointer-events-none ${className}`} style={{ x: tx, y: ty }}>
      {children}
    </motion.div>
  );
}

export function Chip({
  children,
  className,
  delay,
  dot,
  ...layer
}: {
  children: React.ReactNode;
  className: string;
  delay: string;
  dot: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  amount: number;
}) {
  return (
    <Layer {...layer} className={`absolute ${className}`}>
      <div
        className="glass flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-ink motion-safe:animate-drift"
        style={{ animationDelay: delay }}
      >
        <span className={`size-2 rounded-full ${dot}`} />
        {children}
      </div>
    </Layer>
  );
}

/** Two rings spreading across the glass, as if she's tapping on it from inside. */
function KnockRipples() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {[0, 0.28].map((delay) => (
        <motion.span
          key={delay}
          className="absolute left-1/2 top-[58%] size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.6], opacity: [0.85, 0] }}
          transition={{ duration: 0.75, delay, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="absolute left-1/2 top-[74%] -translate-x-1/2 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-iris"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -4] }}
        transition={{ duration: 1.3, times: [0, 0.15, 0.75, 1] }}
      >
        knock knock
      </motion.span>
    </span>
  );
}

function WaveHand() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -right-2 top-[20%] select-none text-4xl drop-shadow-[0_4px_10px_rgb(108_79_207/0.3)] sm:-right-6"
      style={{ transformOrigin: "70% 85%" }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 1, 1, 0], scale: [0.5, 1, 1, 1, 1, 0.85], rotate: [0, 22, -10, 22, -10, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
    >
      👋
    </motion.span>
  );
}
