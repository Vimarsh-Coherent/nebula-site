"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

type Props = {
  children: string;
  /** Rendered element/tag, e.g. "h1", "h2", "p". */
  as?: React.ElementType;
  className?: string;
  /** Reveal granularity. "lines" is best for headlines. */
  split?: "lines" | "words";
  stagger?: number;
  delay?: number;
};

/**
 * Scroll-triggered text reveal using GSAP SplitText. Splits the text into masked
 * lines (or words) that rise into view as the element enters the viewport.
 *
 * Waits for fonts to load before splitting so line breaks are measured correctly.
 * Under prefers-reduced-motion the text renders statically with no animation.
 */
export default function AnimatedText({
  children,
  as: Tag = "div",
  className,
  split = "lines",
  stagger = 0.12,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    let splitter: SplitText | null = null;
    let ctx: gsap.Context | null = null;
    let cancelled = false;

    const run = () => {
      if (cancelled || !el) return;
      // `mask` wraps each line/word in an overflow-hidden box for a clean reveal.
      splitter = new SplitText(el, { type: split, mask: split });
      const targets = split === "lines" ? splitter.lines : splitter.words;

      ctx = gsap.context(() => {
        gsap.from(targets, {
          yPercent: 115,
          duration: 1,
          ease: "power4.out",
          stagger,
          delay,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      }, el);
    };

    // Ensure web fonts are ready so SplitText measures lines accurately.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(run);
    else run();

    return () => {
      cancelled = true;
      ctx?.revert();
      splitter?.revert();
    };
  }, [reduced, split, stagger, delay, children]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
