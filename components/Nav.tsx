"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { profile } from "@/data/content";

const links = [
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
];

const observed = ["about", "projects", "skills", "experience", "achievements", "contact"];

export default function Nav() {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id === "experience" ? "achievements" : entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    observed.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full px-3 py-2 transition-all duration-500 sm:px-4 ${
          scrolled || open ? "glass" : "border border-transparent"
        }`}
      >
        <a href="#top" className="group flex items-center gap-2 rounded-full px-2 py-1 font-display text-lg font-semibold text-ink">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-blush via-lilac to-mint shadow-sm transition-transform duration-500 group-hover:rotate-[20deg]">
            <Sparkles className="size-4 text-iris" aria-hidden />
          </span>
          Kanasu V.
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                aria-current={active === link.id ? "true" : undefined}
                className="relative block rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink aria-[current]:text-ink"
              >
                {active === link.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white shadow-[var(--shadow-soft)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener"
            className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-pearl transition hover:bg-iris sm:inline-flex"
          >
            <FileText className="size-4" aria-hidden /> Resume
          </a>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-ink hover:bg-white/70 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass mx-auto mt-2 max-w-6xl rounded-3xl p-3 md:hidden"
          >
            <ul className="grid gap-1">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 font-semibold text-ink hover:bg-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener"
                  className="mt-1 flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 font-semibold text-pearl"
                >
                  <FileText className="size-4" aria-hidden /> View resume
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
