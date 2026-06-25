"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /** Vertical offset (px) to rise from. */
  y?: number;
  delay?: number;
  duration?: number;
};

/**
 * Generic scroll reveal: fades + rises its children once when they enter the
 * viewport. Use to wrap cards, paragraphs, images, etc.
 * No-ops (renders statically) under prefers-reduced-motion.
 */
export default function Reveal({
  children,
  className,
  as: Tag = "div",
  y = 28,
  delay = 0,
  duration = 0.9,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        y,
        opacity: 0,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, y, delay, duration]);

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
