"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { clamp } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Infinite horizontal marquee that reacts to scroll velocity (trionn-style):
 * scrolling speeds the loop up and skews the text; direction follows scroll
 * direction. Renders the content twice and loops via xPercent: -50.
 * Under reduced-motion it renders a single static, non-animated row.
 */
export default function Marquee({
  items,
  className = "",
  baseDuration = 24,
}: {
  items: string[];
  className?: string;
  baseDuration?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    if (!track) return;

    const ctx = gsap.context(() => {
      const loop = gsap.to(track, {
        xPercent: -50,
        repeat: -1,
        ease: "none",
        duration: baseDuration,
      });

      let dir = 1;
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          const v = self.getVelocity();
          if (v !== 0) dir = v > 0 ? 1 : -1;
          loop.timeScale(dir * (1 + clamp(Math.abs(v) / 600, 0, 4)));
          gsap.to(track, {
            skewX: clamp(v / 300, -16, 16),
            duration: 0.4,
            overwrite: true,
          });
        },
      });

      return () => st.kill();
    }, track);

    return () => ctx.revert();
  }, [reduced, baseDuration]);

  // Two copies so the -50% loop is seamless.
  const content = (
    <div className="flex shrink-0 items-center gap-10 px-5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-10">
          <span>{item}</span>
          <span className="text-accent" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`relative flex overflow-hidden border-y border-border py-6 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] ${className}`}
      role="presentation"
    >
      <div ref={trackRef} className="font-display flex whitespace-nowrap text-4xl font-medium uppercase tracking-tight text-foreground/80 sm:text-5xl md:text-6xl">
        {content}
        {content}
      </div>
    </div>
  );
}
