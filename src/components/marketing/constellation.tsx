"use client";

import { motion } from "motion/react";

// Argo Navis-inspired star field. Decorative, behind the hero; aria-hidden.
const STARS: [number, number, number][] = [
  [8, 22, 1.4], [16, 64, 1.1], [24, 38, 1.8], [31, 80, 1.2], [38, 14, 1.3], [44, 52, 2.2], [52, 30, 1.1],
  [58, 72, 1.6], [63, 18, 1.2], [70, 46, 1.9], [77, 84, 1.1], [83, 26, 1.5], [90, 58, 1.3], [95, 12, 1.0],
  [12, 88, 1.0], [48, 90, 1.2], [86, 74, 1.1], [3, 48, 1.2], [67, 61, 1.0], [35, 66, 1.0],
];
const LINES: [number, number][] = [
  [2, 5], [5, 6], [6, 9], [9, 11], [5, 7], [7, 18], [9, 12], [4, 6], [11, 13],
];

export function Constellation({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="0.12" fill="none" opacity="0.5">
        {LINES.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={STARS[a][0]}
            y1={STARS[a][1]}
            x2={STARS[b][0]}
            y2={STARS[b][1]}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.4, delay: 0.6 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {STARS.map(([x, y, r], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={r * 0.22}
          fill="currentColor"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.55, 0.9] }}
          transition={{ duration: 6 + (i % 5), delay: i * 0.12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}
