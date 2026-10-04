"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

// Long, decelerating scroll on marketing pages only. Disabled for reduced motion.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
