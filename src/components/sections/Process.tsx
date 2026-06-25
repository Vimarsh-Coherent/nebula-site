"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { PROCESS } from "@/lib/content";
import Label from "@/components/ui/Label";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Process — five steps from Idea to Scale.
 *
 * Desktop (≥768px, motion allowed): the section pins and the steps scroll
 * horizontally as you scroll down (GSAP ScrollTrigger pin + scrub). In Phase 2
 * the 3D centerpiece will morph through a state per step here.
 *
 * Mobile / reduced-motion: falls back to a normal vertical stack (no pin).
 */
export default function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) return;

    // matchMedia handles the breakpoint + auto-cleanup on resize.
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const distance = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => mm.revert();
  }, [reduced]);

  return (
    <section ref={sectionRef} id="process" className="relative">
      <div
        className={cn(
          "flex min-h-svh flex-col md:h-svh md:flex-row md:items-center",
          reduced ? "md:overflow-x-auto" : "md:overflow-hidden",
        )}
      >
        <div
          ref={trackRef}
          className="flex flex-col gap-6 px-6 py-24 sm:px-8 md:flex-row md:items-stretch md:gap-8 md:py-0 lg:px-12"
        >
          {/* Intro panel */}
          <div className="flex w-full shrink-0 flex-col justify-center md:w-[34vw] md:pr-8">
            <Label>How we work</Label>
            <h2 className="font-display mt-5 text-4xl font-medium sm:text-5xl">
              A clear path from idea to scale.
            </h2>
            <p className="mt-5 max-w-sm text-muted">
              Five steps, fully transparent. You always know where your product
              is and what happens next.
            </p>
          </div>

          {/* Step panels */}
          {PROCESS.map((step) => (
            <article
              key={step.index}
              data-cursor
              className="group relative flex w-full shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface/40 p-8 transition-colors duration-500 hover:border-foreground/15 hover:bg-surface md:w-[30vw] md:max-w-md"
            >
              {/* Corner glow on hover */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <span className="font-display text-6xl font-semibold text-accent/80 transition-colors duration-500 group-hover:text-accent">
                  {step.index}
                </span>
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-accent shadow-[0_0_16px_var(--accent)]"
                />
              </div>
              <div className="relative mt-16">
                <h3 className="font-display text-3xl font-medium">{step.title}</h3>
                <p className="mt-4 leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
