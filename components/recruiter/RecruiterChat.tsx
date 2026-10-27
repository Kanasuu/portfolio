"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, RotateCcw, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { profile } from "@/data/content";

type Turn = { role: "user" | "assistant"; content: string };
type Pending = { content: string; status: "sending" | "error"; error?: string };

const ENDPOINT = "/api/ai-recruiter/chat";
const MAX_CHARS = 800;
const HISTORY_TURNS = 12;
const OPEN_EVENT = "portfolio:open-recruiter";

const WELCOME =
  "Hi! I'm Kanasu's AI Recruiter. Ask me about her skills, projects, achievements or experience. What would you like to explore?";
const SUGGESTIONS = [
  "What are Kanasu's strongest technical skills?",
  "Tell me about the JCMS project and what she built.",
  "What did she do during her Cyient internship?",
  "What achievements does she have?",
  "How can I contact her?",
];

// Only links from the verified profile become clickable.
const SAFE_LINKS = new Map<string, string>([
  [profile.linkedin, profile.linkedin],
  [profile.github, profile.github],
  [profile.resume, profile.resume],
]);

export function openRecruiter() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function RecruiterChat() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [input, setInput] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Check configuration once, the first time the panel opens.
  useEffect(() => {
    if (!open || configured !== null) return;
    fetch(ENDPOINT)
      .then((r) => r.json() as Promise<{ configured: boolean }>)
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(true));
  }, [open, configured]);

  useEffect(() => {
    if (!open) return;
    // The input is disabled when chat isn't configured; focus the close button instead.
    if (configured === false) closeRef.current?.focus();
    else inputRef.current?.focus();
  }, [open, configured]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, pending, open]);

  const close = useCallback(() => {
    setOpen(false);
    // The launcher re-mounts after the panel closes; return focus to it on the next frame.
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim().slice(0, MAX_CHARS);
      if (!message || pending?.status === "sending") return;
      setInput("");
      setPending({ content: message, status: "sending" });
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history: turns.slice(-HISTORY_TURNS) }),
          signal: ctrl.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string; message?: string };
        if (!res.ok || !data.reply) {
          if (data.error === "not_configured") setConfigured(false);
          setPending({ content: message, status: "error", error: data.message ?? "Something went wrong. Please try again." });
          return;
        }
        setTurns((t) => [...t, { role: "user", content: message }, { role: "assistant", content: data.reply! }]);
        setPending(null);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setPending({ content: message, status: "error", error: "Couldn't reach the assistant. Check your connection and try again." });
      }
    },
    [pending, turns],
  );

  const busy = pending?.status === "sending";

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={launcherRef}
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.6 }}
            aria-label="Open Kanasu's AI Recruiter chat"
            className="glass fixed bottom-4 right-4 z-[60] flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold text-ink shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 hover:bg-white sm:bottom-6 sm:right-6"
          >
            <Avatar size="size-10" />
            <span className="hidden sm:inline">Ask my AI recruiter</span>
            <span className="sm:hidden">Ask AI</span>
            <Sparkles className="size-4 text-iris" aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-modal="false"
            aria-labelledby="recruiter-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-x-3 bottom-3 z-[60] flex max-h-[min(80svh,40rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white bg-pearl/95 shadow-[var(--shadow-lift)] backdrop-blur-xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem]"
          >
            <header className="flex items-center gap-3 border-b border-line bg-gradient-to-r from-blush via-lilac to-mint px-4 py-3">
              <Avatar size="size-11" />
              <div className="min-w-0 flex-1">
                <h2 id="recruiter-title" className="font-display text-lg font-medium leading-tight">
                  Kanasu&rsquo;s AI Recruiter
                </h2>
                <p className="truncate text-xs text-ink-soft">Answers from her verified portfolio · AI can make mistakes</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close chat"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white/70 transition hover:bg-white"
              >
                <X className="size-4" />
              </button>
            </header>

            <div ref={listRef} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              <Bubble role="assistant">{WELCOME}</Bubble>

              {configured === false && (
                <p className="rounded-2xl border border-dashed border-lavender bg-white/70 px-4 py-3 text-sm text-ink-soft">
                  The AI Recruiter isn&rsquo;t switched on yet. In the meantime, reach Kanasu at{" "}
                  <a className="font-semibold text-iris underline" href={`mailto:${profile.email}`}>
                    {profile.email}
                  </a>
                  .
                </p>
              )}

              {turns.map((t, i) => (
                <Bubble key={i} role={t.role}>
                  {t.content}
                </Bubble>
              ))}

              {pending && <Bubble role="user">{pending.content}</Bubble>}
              {busy && <Typing />}
              {pending?.status === "error" && (
                <div role="alert" className="flex flex-wrap items-center gap-2 rounded-2xl bg-blush/70 px-4 py-3 text-sm text-ink">
                  <span className="flex-1">{pending.error}</span>
                  {configured !== false && (
                    <button
                      type="button"
                      onClick={() => send(pending.content)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold transition hover:bg-pearl"
                    >
                      <RotateCcw className="size-3.5" aria-hidden /> Retry
                    </button>
                  )}
                </div>
              )}

              {turns.length === 0 && !pending && configured !== false && (
                <div className="pt-1">
                  <p className="mb-2 text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">Try asking</p>
                  <ul className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((q) => (
                      <li key={q}>
                        <button
                          type="button"
                          onClick={() => send(q)}
                          className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-sm font-medium text-ink transition hover:border-lavender hover:bg-lilac/60"
                        >
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <form
              className="flex items-end gap-2 border-t border-line bg-white/80 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <label htmlFor="recruiter-input" className="sr-only">
                Ask a question about Kanasu
              </label>
              <textarea
                id="recruiter-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_CHARS}
                disabled={configured === false}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={configured === false ? "Chat isn't available yet" : "Ask about skills, projects, experience…"}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-pearl px-3.5 py-2.5 text-sm text-ink outline-none transition [field-sizing:content] placeholder:text-ink-soft/70 focus:border-lavender focus-visible:outline-2 focus-visible:outline-iris disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy || configured === false}
                aria-label="Send question"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-pearl transition hover:bg-iris disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-5" aria-hidden />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Avatar({ size }: { size: string }) {
  return (
    <span className={`relative ${size} shrink-0 overflow-hidden rounded-full border-2 border-white bg-lilac shadow-sm`}>
      <Image src="/character.webp" alt="" fill sizes="44px" className="scale-150 object-cover object-[50%_22%]" />
    </span>
  );
}

function Bubble({ role, children }: { role: Turn["role"]; children: string }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 text-sm leading-relaxed ${
          mine ? "rounded-br-md bg-ink text-pearl" : "rounded-bl-md border border-line bg-white text-ink"
        }`}
      >
        {mine ? <p className="whitespace-pre-wrap">{children}</p> : <RichText text={children} />}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start" aria-label="The assistant is typing">
      <div className="flex gap-1 rounded-[1.25rem] rounded-bl-md border border-line bg-white px-4 py-3.5">
        {[0, 0.15, 0.3].map((d) => (
          <span key={d} className="size-2 rounded-full bg-lavender motion-safe:animate-bounce" style={{ animationDelay: `${d}s` }} />
        ))}
      </div>
    </div>
  );
}

/** Minimal, safe rendering: paragraphs, "- " bullet lists, **bold**, and verified links only. */
function RichText({ text }: { text: string }) {
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ type: "p", lines: [] });
      continue;
    }
    const bullet = /^[-*•]\s+/.test(trimmed);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      const item = trimmed.replace(/^[-*•]\s+/, "");
      if (last?.type === "ul") last.lines.push(item);
      else blocks.push({ type: "ul", lines: [item] });
    } else if (last?.type === "p" && last.lines.length) last.lines.push(trimmed);
    else blocks.push({ type: "p", lines: [trimmed] });
  }
  return (
    <div className="space-y-2">
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.type === "ul" ? (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l} />
                </li>
              ))}
            </ul>
          ) : (
            <p key={i}>
              <Inline text={b.lines.join(" ")} />
            </p>
          ),
        )}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|\/resume\.pdf|[\w.+-]+@[\w-]+\.[\w.]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        const clean = part.replace(/[.,;:!?]+$/, "");
        const tail = part.slice(clean.length);
        const href = SAFE_LINKS.get(clean) ?? (clean === profile.email ? `mailto:${profile.email}` : null);
        if (href)
          return (
            <Fragment key={i}>
              <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="font-semibold text-iris underline underline-offset-2">
                {clean}
              </a>
              {tail}
            </Fragment>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
