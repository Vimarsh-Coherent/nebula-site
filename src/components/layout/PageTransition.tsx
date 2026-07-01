"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Route transition, driven from `app/template.tsx` (which remounts on every
 * navigation). The viewport opens like a new page being unsealed: it starts
 * fully covered, a glowing accent seam draws across the middle, then twin
 * panels part — top up, bottom down — to reveal the page, which lifts and
 * scales into place behind them. Disabled under prefers-reduced-motion.
 */

// Expo in/out — slow start, fast middle, soft landing. Reads as "unsealing".
const EASE = [0.83, 0, 0.17, 1] as const;

// Sequencing (seconds).
const SEAM_DRAW = 0.35; // seam streaks across the middle
const PART_DELAY = 0.34; // panels begin parting just before the seam settles
const PART_DUR = 0.72; // how long the halves take to clear the screen
const REVEAL_DELAY = 0.46; // content starts emerging as the gap opens

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();

  if (reduced) return <>{children}</>;

  return (
    <>
      {/* Page content: lifts and settles in through the opening gap. */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 28, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.72, delay: REVEAL_DELAY, ease: "easeOut" }}
      >
        {children}
      </motion.div>

      {/* The opening cover — two halves that part from a glowing seam. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[65] overflow-hidden"
      >
        {/* Top half retreats upward. */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[51%] bg-background"
          initial={{ y: 0 }}
          animate={{ y: "-101%" }}
          transition={{ duration: PART_DUR, delay: PART_DELAY, ease: EASE }}
        />
        {/* Bottom half retreats downward. */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[51%] bg-background"
          initial={{ y: 0 }}
          animate={{ y: "101%" }}
          transition={{ duration: PART_DUR, delay: PART_DELAY, ease: EASE }}
        />

        {/* Accent seam: streaks across, then fades as the halves split. */}
        <motion.div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 origin-center bg-accent shadow-[0_0_28px_4px_var(--accent)]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: SEAM_DRAW + PART_DELAY,
            ease: "easeInOut",
            times: [0, SEAM_DRAW / (SEAM_DRAW + PART_DELAY), 1],
            opacity: {
              duration: SEAM_DRAW + PART_DELAY + 0.2,
              times: [0, 0.45, 0.7, 1],
              ease: "easeInOut",
            },
          }}
        />
      </div>
    </>
  );
}
