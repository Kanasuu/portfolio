import type { Accent } from "@/data/content";

// Tailwind class sets per accent, written out in full so the compiler can see them.
export const accentClasses: Record<Accent, { bg: string; soft: string; text: string; ring: string; dot: string; hex: string }> = {
  rose: { bg: "bg-blush", soft: "bg-blush/60", text: "text-rose-deep", ring: "ring-rose/40", dot: "bg-rose", hex: "#ef9bbb" },
  lavender: { bg: "bg-lilac", soft: "bg-lilac/60", text: "text-iris", ring: "ring-lavender/60", dot: "bg-lavender", hex: "#b9a3f2" },
  mint: { bg: "bg-mint", soft: "bg-mint/60", text: "text-mint-deep", ring: "ring-mint-mid/60", dot: "bg-mint-mid", hex: "#8fd6bd" },
  peach: { bg: "bg-peach", soft: "bg-peach/60", text: "text-peach-deep", ring: "ring-peach/70", dot: "bg-[#f5b48e]", hex: "#f5b48e" },
};
