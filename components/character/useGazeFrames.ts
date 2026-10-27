"use client";

import { useMotionValueEvent, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CharacterPointer } from "./useCharacterPointer";

export const GAZE_BASE = "/character/gaze/";

type Extra = "blink" | "smile" | "talkA" | "talkO" | "talkE";
type Manifest = {
  cols: number;
  rows: number;
  frames: string[][];
  extras: Partial<Record<Extra, string>>;
  /** Full picture the patches are drawn over. Without it, frames are full size. */
  base?: string;
  patch?: { x: number; y: number; w: number; h: number };
  /** Transparent frames (scripts/remove_background.py): patches replace the base instead of covering it. */
  alpha?: boolean;
};
/** Decoded images; w/h/px/py is the patch rectangle, cw/ch the full canvas. */
type Loaded = { m: Manifest; img: Map<string, HTMLImageElement>; w: number; h: number; px: number; py: number; cw: number; ch: number };

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Cursor tracking from pre-rendered frames (scripts/pack_gaze_frames.py): the same picture
 * re-posed for a grid of head/eye directions, plus blink, smile and talking-mouth frames.
 * The pose nearest the (spring-smoothed) pointer is drawn on a canvas; the springs sweep through
 * the closely spaced poses, so the head turns smoothly. Returns a ref for that canvas plus talk/smile controls.
 * `enabled: false` skips loading entirely.
 */
export function useGazeFrames({
  pointer,
  reduce,
  enabled = true,
  alpha = false,
  onUnavailable,
}: {
  pointer: CharacterPointer;
  reduce: boolean;
  enabled?: boolean;
  /** Load the background-free frames from gaze/alpha/. */
  alpha?: boolean;
  onUnavailable?: () => void;
}) {
  const dir = GAZE_BASE + (alpha ? "alpha/" : "");
  const [ready, setReady] = useState(false);
  const data = useRef<Loaded | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const override = useRef<Extra | "center" | null>(null);
  const timers = useRef<number[]>([]);
  const talkTimer = useRef<number | undefined>(undefined);
  const unavailable = useRef(onUnavailable);
  useEffect(() => {
    unavailable.current = onUnavailable;
  });

  const sx = useSpring(pointer.x, { stiffness: 120, damping: 20 });
  const sy = useSpring(pointer.y, { stiffness: 120, damping: 20 });

  /** Grid position of the gaze, fractional: (col, row). */
  const gridPos = useCallback(
    (m: Manifest): [number, number] => {
      if (reduce || override.current === "center") return [(m.cols - 1) / 2, (m.rows - 1) / 2];
      return [((clamp(sx.get() * 1.15) + 1) / 2) * (m.cols - 1), ((clamp(sy.get() * 1.25) + 1) / 2) * (m.rows - 1)];
    },
    [reduce, sx, sy],
  );

  const draw = useCallback(() => {
    const d = data.current;
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!d || !c || !ctx) return;
    const { m, img, w, h, px, py, cw, ch } = d;
    if (c.width !== cw || c.height !== ch) {
      c.width = cw;
      c.height = ch;
    }
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, cw, ch);
    if (m.base) ctx.drawImage(img.get(m.base)!, 0, 0);
    // Transparent patches must not let the base's head show through where the hair has moved.
    if (m.alpha) ctx.clearRect(px, py, w, h);

    const o = override.current;
    const extra = o && o !== "center" ? m.extras[o] : undefined;
    if (extra) {
      ctx.drawImage(img.get(extra)!, px, py);
      return;
    }

    // The nearest pose, always a single sharp frame: blending neighbours smeared the face
    // while moving. The poses are close together and the springs sweep through them, so
    // the head still turns smoothly.
    const [fx, fy] = gridPos(m);
    ctx.drawImage(img.get(m.frames[Math.round(fy)][Math.round(fx)])!, px, py);
  }, [gridPos]);

  /** Redraws only when the visible frame changes (the springs fire on every animation frame). */
  const lastKey = useRef("");
  const drawIfChanged = useCallback(() => {
    const m = data.current?.m;
    if (!m) return;
    const [fx, fy] = gridPos(m);
    const key = `${override.current}:${Math.round(fx)}:${Math.round(fy)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    draw();
  }, [gridPos, draw]);

  // Load the manifest and decode every image up front so drawing never waits.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(`${dir}manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : Promise.reject(new Error(`manifest ${r.status}`))))
      .then(async (m) => {
        const names = [...new Set([...(m.base ? [m.base] : []), ...m.frames.flat(), ...Object.values(m.extras)])];
        const img = new Map<string, HTMLImageElement>();
        await Promise.all(
          names.map((src) => {
            const el = new window.Image();
            el.src = dir + src;
            img.set(src, el);
            return el.decode();
          }),
        );
        if (cancelled) return;
        const first = img.get(m.frames[0][0])!;
        const full = m.base ? img.get(m.base)! : first;
        data.current = {
          m,
          img,
          w: m.patch?.w ?? first.naturalWidth,
          h: m.patch?.h ?? first.naturalHeight,
          px: m.patch?.x ?? 0,
          py: m.patch?.y ?? 0,
          cw: full.naturalWidth,
          ch: full.naturalHeight,
        };
        setReady(true);
        draw();
      })
      .catch((e) => {
        console.warn("[character] Gaze frames unavailable.", e);
        if (!cancelled) unavailable.current?.();
      });
    return () => {
      cancelled = true;
    };
    // Load once; `draw` only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Redraw as the springs move (they settle on their own, so this stops when the pointer does).
  useMotionValueEvent(sx, "change", drawIfChanged);
  useMotionValueEvent(sy, "change", drawIfChanged);
  useEffect(draw, [draw, ready]);

  const canvasRef = useCallback(
    (el: HTMLCanvasElement | null) => {
      canvas.current = el;
      draw();
    },
    [draw],
  );

  const setOverride = useCallback(
    (o: Extra | "center" | null) => {
      override.current = o;
      draw();
    },
    [draw],
  );

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      window.clearInterval(talkTimer.current);
    },
    [],
  );

  // Natural blinking, only while she faces the visitor (the blink frame looks straight ahead).
  useEffect(() => {
    if (!ready || !data.current?.m.extras.blink || reduce) return;
    let t: number;
    const schedule = () => {
      t = window.setTimeout(() => {
        const facing = Math.abs(sx.get()) < 0.2 && Math.abs(sy.get()) < 0.25;
        if (facing && override.current === null) {
          setOverride("blink");
          window.setTimeout(() => override.current === "blink" && setOverride(null), 130);
        }
        schedule();
      }, 2200 + Math.random() * 3300);
    };
    schedule();
    return () => window.clearTimeout(t);
  }, [ready, reduce, sx, sy, setOverride]);

  const stopTalking = useCallback(() => {
    window.clearInterval(talkTimer.current);
    talkTimer.current = undefined;
    const o = override.current;
    if (o && o !== "blink" && o !== "smile") setOverride(null);
  }, [setOverride]);

  /** Cycles the talking-mouth frames. Without audio this is a talking animation, not lip sync. */
  const startTalking = useCallback(
    (seconds: number) => {
      const m = data.current?.m;
      if (!m || reduce) return;
      const mouths = (["talkA", "talkO", "talkE"] as const).filter((k) => m.extras[k]);
      if (mouths.length === 0) return;
      window.clearInterval(talkTimer.current);
      const shapes: (Extra | "center")[] = [...mouths, "center"];
      talkTimer.current = window.setInterval(() => setOverride(shapes[Math.floor(Math.random() * shapes.length)]), 115);
      if (Number.isFinite(seconds)) later(stopTalking, seconds * 1000);
    },
    [reduce, later, stopTalking, setOverride],
  );

  const smile = useCallback(
    (ms = 1400) => {
      if (!data.current?.m.extras.smile || reduce) return;
      setOverride("smile");
      later(() => override.current === "smile" && setOverride(null), ms);
    },
    [reduce, later, setOverride],
  );

  return { ready, canvasRef, startTalking, stopTalking, smile, later };
}
