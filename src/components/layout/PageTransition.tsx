"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Page transition used via `app/template.tsx` (which remounts on every
 * navigation). On entry, a solid panel wipes upward to reveal the page while
 * the content fades in. Disabled under prefers-reduced-motion.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>

      {/* Wipe panel: covers the viewport, then collapses upward. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[65] bg-background"
        style={{ transformOrigin: "top" }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      />
    </>
  );
}
