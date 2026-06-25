"use client";

import { useEffect, useRef } from "react";
import LightingScene from "./LightingScene";
import LogoMark from "./LogoMark";

/**
 * The dynamic page backdrop: a cursor-lit WebGL field with the Nebula mark
 * opening up over it as you scroll.
 *
 * Mounted once in the root layout, fixed and behind all content (`-z-10`,
 * non-interactive). A single scroll-progress ref (0 at the top → 1 once the
 * hero has scrolled away) is shared with both children so they read it inside
 * their own animation loops without triggering React re-renders.
 */
export default function SiteBackground() {
  const progress = useRef(0);
  // Current lightning-flash strength (0..~1), published by LightingScene and
  // read by LogoMark so the galaxy lights up with each bolt.
  const flash = useRef(0);

  useEffect(() => {
    const update = () => {
      // Progress completes a little past the first viewport.
      const span = Math.max(window.innerHeight * 1.15, 1);
      progress.current = Math.min(1, Math.max(0, window.scrollY / span));
    };
    update();
    // Lenis drives native scroll, so a passive scroll listener stays in sync.
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <LightingScene progress={progress} flash={flash} />
      <LogoMark progress={progress} flash={flash} />
    </div>
  );
}
