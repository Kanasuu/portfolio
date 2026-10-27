import { ArrowUp } from "lucide-react";
import { profile } from "@/data/content";

export default function Footer() {
  return (
    <footer className="container-x flex flex-col items-center justify-between gap-4 pb-10 pt-2 text-sm text-ink-soft sm:flex-row">
      <p>
        © {new Date().getFullYear()} {profile.fullName}. Designed and built with Next.js and React Three Fiber.
      </p>
      <a href="#top" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-ink hover:bg-mist">
        Back to top <ArrowUp className="size-4" aria-hidden />
      </a>
    </footer>
  );
}
