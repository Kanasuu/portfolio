"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import { hasWebGL } from "@/lib/webgl";

const HeroScene = lazy(() => import("./HeroScene"));

/** Soft static backdrop used before the scene loads, without WebGL, or if the scene crashes. */
function StaticBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 top-16 size-80 rounded-full bg-blush/80 blur-3xl" />
      <div className="absolute right-0 top-1/3 size-96 rounded-full bg-lavender/50 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-mint/80 blur-3xl" />
    </div>
  );
}

class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D scene disabled, using the static backdrop instead.", error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SceneLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setSupported(hasWebGL());
    const el = ref.current;
    if (!el) return;
    // Stop rendering frames while the hero is scrolled out of view.
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 -z-10">
      <StaticBackdrop />
      {supported && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <div className="absolute inset-0 animate-[fadein_1.2s_ease-out_both]">
              <HeroScene active={visible} />
            </div>
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  );
}
