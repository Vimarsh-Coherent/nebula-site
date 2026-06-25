"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin accent progress bar pinned to the top, tracking page scroll. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  // Smooth the value so it eases rather than snaps.
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[80] h-0.5 origin-left bg-accent shadow-[0_0_10px_var(--accent)]"
    />
  );
}
