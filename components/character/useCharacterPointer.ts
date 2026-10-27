"use client";

import { useMotionValue, useReducedMotion, type MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";

export type CharacterPointer = {
  /** Cursor direction relative to the character's face, each axis clamped to -1..1. */
  x: MotionValue<number>;
  y: MotionValue<number>;
};

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Tracks the pointer across the hero section and exposes it as motion values
 * relative to the character, so the character leans toward wherever the cursor is.
 * Spread `handlers` on the hero <section>; attach `targetRef` to the character.
 * Values return to 0 when the pointer leaves the hero or a touch ends.
 */
export function useCharacterPointer() {
  const targetRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduce = useReducedMotion();

  const handlers = useMemo(() => {
    const reset = () => {
      x.set(0);
      y.set(0);
    };
    return {
      onPointerMove(e: React.PointerEvent) {
        const el = targetRef.current;
        if (reduce || !el) return;
        const r = el.getBoundingClientRect();
        // Aim from roughly face height. Each side is scaled by its own distance to the
        // viewport edge, so the full range is reachable even though the character is off-centre.
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.35;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        x.set(clamp(dx / Math.max(80, dx < 0 ? cx : window.innerWidth - cx)));
        y.set(clamp(dy / Math.max(80, dy < 0 ? cy : window.innerHeight - cy)));
      },
      onPointerLeave: reset,
      onPointerCancel: reset,
      onPointerUp(e: React.PointerEvent) {
        if (e.pointerType !== "mouse") reset();
      },
    };
  }, [x, y, reduce]);

  return { targetRef, pointer: { x, y } satisfies CharacterPointer, handlers };
}
