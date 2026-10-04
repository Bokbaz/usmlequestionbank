"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

// Long, decelerating scroll on marketing pages only. Native scrolling for reduced motion.
// The tree is identical either way so server and client markup always match.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <ReactLenis root options={{ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: !reduce }}>
      {children}
    </ReactLenis>
  );
}
