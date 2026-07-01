"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * TextScramble — a "decoding" reveal: the text resolves out of a stream of random
 * glyphs, left to right, when it first scrolls into view. On-brand texture for an
 * AI/automation studio without being noisy (best on short eyebrow labels / short
 * headings).
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
}: {
  children: string;
  className?: string;
  as?: React.ElementType;
  speed?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(children);

  useEffect(() => {
    if (reduced) {
      setText(children);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const target = children;
    let raf = 0;
    let started = false;
    let startTime = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      // How many characters have resolved so far.
      const resolved = elapsed / speed;
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
      if (!done) raf = requestAnimationFrame(tick);
      else setText(target);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          startTime = performance.now();
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [children, reduced, speed]);

  return (
    <Tag ref={ref} className={cn(className)} aria-label={children}>
      <span aria-hidden>{text}</span>
    </Tag>
  );
}
