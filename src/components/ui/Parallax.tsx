"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Scroll parallax: shifts its child vertically as it passes through the
 * viewport. `speed` is the fraction of travel (0.2 ≈ subtle). Disabled under
 * reduced-motion. Wrap content taller than its clipping frame for image parallax.
 */
export default function Parallax({
  children,
  speed = 0.18,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -speed * 100 },
        {
          yPercent: speed * 100,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
