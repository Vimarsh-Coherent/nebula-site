"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { BRAND } from "@/lib/brand";
import { usePrefersReducedMotion } from "@/lib/hooks";

const SEEN_KEY = "nebula:intro-seen";

/**
 * First-load intro: brand mark + a 0→100 counter, then the curtain wipes
 * upward to reveal the site. Shows once per browser session. Locks scroll
 * while active. Skipped entirely under prefers-reduced-motion.
 */
export default function Preloader() {
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  // Lock scroll while the curtain is up.
  useEffect(() => {
    document.body.style.overflow = done ? "" : "hidden";
  }, [done]);

  useEffect(() => {
    const skip = reduced || sessionStorage.getItem(SEEN_KEY);
    if (skip) {
      // Defer out of the effect body to avoid a synchronous setState.
      const id = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(id);
    }

    sessionStorage.setItem(SEEN_KEY, "1");
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: 100,
      duration: 1.9,
      ease: "power2.inOut",
      onUpdate: () => setCount(Math.round(obj.v)),
      onComplete: () => setExiting(true),
    });
    return () => tween.kill();
  }, [reduced]);

  if (done) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ y: 0 }}
      animate={{ y: exiting ? "-100%" : 0 }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => {
        if (exiting) setDone(true);
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: exiting ? 0 : 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <span className="h-3 w-3 rounded-full bg-accent shadow-[0_0_20px_var(--accent)]" />
        <span className="font-display text-2xl font-semibold tracking-tight">
          {BRAND.name}
        </span>
      </motion.div>

      {/* Counter */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 sm:bottom-12">
        <span className="font-display text-[clamp(3rem,12vw,8rem)] font-semibold tabular-nums text-foreground/90">
          {count}
        </span>
      </div>

      {/* Progress line */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-border">
        <div
          className="h-full bg-accent shadow-[0_0_12px_var(--accent)]"
          style={{ width: `${count}%` }}
        />
      </div>
    </motion.div>
  );
}
