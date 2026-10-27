"use client";

import { useEffect, useRef } from "react";

/**
 * A soft ring that trails the native cursor and swells over interactive
 * elements. The system cursor stays visible, so this is decoration only.
 * Only enabled for fine pointers without a reduced-motion preference.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let scale = 1;
    let goal = 1;
    let raf = 0;

    const move = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const t = e.target as Element | null;
      goal = t?.closest("a, button, [role='button'], canvas") ? 1.8 : 1;
      el.style.opacity = "1";
    };
    const hide = () => (el.style.opacity = "0");
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      scale += (goal - scale) * 0.15;
      el.style.transform = `translate3d(${pos.x - 14}px, ${pos.y - 14}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] size-7 rounded-full border-2 border-iris/50 bg-lavender/10 opacity-0 mix-blend-multiply transition-opacity duration-300"
    />
  );
}
