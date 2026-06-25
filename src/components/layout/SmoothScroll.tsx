"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Site-wide inertia/smooth scrolling via Lenis, synced to GSAP's ticker so
 * ScrollTrigger animations stay perfectly in lockstep with the scroll position.
 *
 * Disabled entirely under prefers-reduced-motion (native scroll takes over).
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1, // higher = heavier/floatier inertia
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    // Keep ScrollTrigger's cached scroll position in sync with Lenis.
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's RAF so there's a single animation loop.
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
