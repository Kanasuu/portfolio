"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/** Glass speech bubble above the character (or where `className` places it). Announced politely to screen readers. */
export default function SpeechBubble({
  message,
  onDismiss,
  className = "inset-x-0 bottom-full mb-6 justify-center",
}: {
  message: string | null;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={`pointer-events-none absolute z-20 flex ${className}`}>
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="pointer-events-auto relative flex w-max max-w-[16.5rem] origin-bottom items-start gap-1.5 rounded-[1.4rem] border border-white bg-white/85 py-2.5 pl-4 pr-2 text-sm leading-snug font-semibold text-ink shadow-[var(--shadow-lift)] backdrop-blur-md"
          >
            <p className="pt-0.5">{message}</p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss message"
              className="grid size-6 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-lilac hover:text-ink"
            >
              <X className="size-3.5" aria-hidden />
            </button>
            <span aria-hidden className="absolute -bottom-[7px] left-1/2 size-3.5 -translate-x-1/2 rotate-45 border-b border-r border-white bg-white/85" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
