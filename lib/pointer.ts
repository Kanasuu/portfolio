"use client";

import { useEffect } from "react";

/**
 * One shared, mutable pointer position in normalized coordinates (-1..1 from the
 * viewport centre). Read it inside animation loops instead of storing it in React
 * state, so moving the mouse never triggers a re-render.
 */
export const pointer = { x: 0, y: 0, active: false };

let listeners = 0;

function onMove(e: PointerEvent) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  pointer.active = true;
}

function onLeave() {
  pointer.x = 0;
  pointer.y = 0;
  pointer.active = false;
}

export function usePointerTracking() {
  useEffect(() => {
    if (listeners++ === 0) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    return () => {
      if (--listeners === 0) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      }
    };
  }, []);
}
