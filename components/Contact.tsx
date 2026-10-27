"use client";

import { ArrowUpRight, Check, Copy, FileText, Github, Linkedin, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { profile } from "@/data/content";
import { openRecruiter } from "./recruiter/RecruiterChat";
import Reveal from "./Reveal";

const links = [
  { label: "LinkedIn", sub: "kanasu-vinay", href: profile.linkedin, icon: Linkedin },
  { label: "GitHub", sub: "@Kanasuu", href: profile.github, icon: Github },
  { label: "Resume", sub: "PDF", href: profile.resume, icon: FileText },
];

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section id="contact" aria-labelledby="contact-title" className="section pb-16">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-14 text-pearl sm:px-12 sm:py-20">
            <div aria-hidden className="absolute -left-20 -top-24 size-80 rounded-full bg-rose/40 blur-3xl" />
            <div aria-hidden className="absolute -bottom-24 right-0 size-96 rounded-full bg-iris/50 blur-3xl" />
            <div aria-hidden className="absolute bottom-10 left-1/3 size-48 rounded-full bg-mint-mid/30 blur-3xl" />

            <div className="relative grid gap-12 @4xl:grid-cols-[1.1fr_0.9fr] @4xl:items-end">
              <div>
                <p className="mb-3 text-xs font-bold tracking-[0.16em] text-lavender uppercase">Contact</p>
                <h2 id="contact-title" className="font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
                  Let&rsquo;s build something <em className="font-normal text-rose">lovely</em> and solid.
                </h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-pearl/80">
                  I&rsquo;m open to software development internships and graduate roles. The quickest way to reach me is email.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-2 rounded-full bg-pearl px-6 py-3.5 font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <Mail className="size-4" aria-hidden /> {profile.email}
                  </a>
                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-2 rounded-full border border-pearl/30 px-5 py-3.5 font-semibold text-pearl transition hover:bg-pearl/10"
                  >
                    {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                    {copied ? "Copied" : "Copy email"}
                  </button>
                  <button
                    type="button"
                    onClick={openRecruiter}
                    className="inline-flex items-center gap-2 rounded-full border border-pearl/30 px-5 py-3.5 font-semibold text-pearl transition hover:bg-pearl/10"
                  >
                    <Sparkles className="size-4" aria-hidden /> Ask my AI recruiter
                  </button>
                  <span role="status" className="sr-only">
                    {copied ? "Email address copied to clipboard" : ""}
                  </span>
                </div>
              </div>

              <ul className="grid gap-3">
                {links.map(({ label, sub, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 rounded-3xl border border-pearl/15 bg-pearl/5 p-4 transition hover:border-pearl/30 hover:bg-pearl/10"
                    >
                      <span className="grid size-12 place-items-center rounded-2xl bg-pearl/10">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold">{label}</span>
                        <span className="block text-sm text-pearl/70">{sub}</span>
                      </span>
                      <ArrowUpRight className="size-5 text-pearl/70 transition group-hover:rotate-45 group-hover:text-pearl" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
