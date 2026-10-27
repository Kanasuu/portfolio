"use client";

import { MotionConfig } from "framer-motion";
import { usePointerTracking } from "@/lib/pointer";

export default function MotionRoot({ children }: { children: React.ReactNode }) {
  usePointerTracking();
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
