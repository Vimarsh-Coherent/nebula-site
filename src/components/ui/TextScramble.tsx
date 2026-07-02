"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * TextScramble — a "decoding" reveal: the text resolves out of a stream of random
 * glyphs, left to right. On-brand texture for an AI/automation studio without
 * being noisy (best on short eyebrow labels / headings / the wordmark).
 *
 * Triggers:
 *   - "view"  → decodes once when it first scrolls into view (default).
 *   - "mount" → decodes immediately on mount (good for always-visible wordmarks).
 * `scrambleOnHover` re-runs the decode each time the element is hovered.
 *
 * Reduced-motion → renders the final text immediately, no animation.
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>*#";

export default function TextScramble({
  children,
  className,
  as: Tag = "span",
  /** ms per character to fully resolve. */
  speed = 38,
  /** When to first run the decode. */
  trigger = "view",
  /** Re-run the decode whenever the element is hovered. */
  scrambleOnHover = false,
}: {
  children: string;
  className?: string;
  as?: React.ElementType;
  speed?: number;
  trigger?: "view" | "mount";
  scrambleOnHover?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(children);
  const rafRef = useRef(0);

  // Run one left-to-right decode of `children`, returns a cleanup canceller.
  const run = useCallback(() => {
    if (reduced) {
      setText(children);
      return;
    }
    const target = children;
    cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();

    const tick = (now: number) => {
      // How many characters have resolved so far.
      const resolved = (now - startTime) / speed;
      let out = "";
      let done = true;
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (ch === " ") {
          out += " ";
          continue;
        }
        if (i < resolved) {
          out += ch;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          done = false;
        }
      }
      setText(out);
      if (!done) rafRef.current = requestAnimationFrame(tick);
      else setText(target);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [children, reduced, speed]);

  useEffect(() => {
    if (reduced) {
      setText(children);
      return;
    }
    const el = ref.current;
    if (!el) return;

    if (trigger === "mount") {
      run();
      return () => cancelAnimationFrame(rafRef.current);
    }

    let started = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [children, reduced, trigger, run]);

  return (
    <Tag
      ref={ref}
      className={cn(className)}
      aria-label={children}
      onPointerEnter={scrambleOnHover ? run : undefined}
    >
      <span aria-hidden>{text}</span>
    </Tag>
  );
}
