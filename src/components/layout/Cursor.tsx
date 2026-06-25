"use client";

import { useEffect, useRef } from "react";
import { lerp } from "@/lib/utils";
import { useFinePointer } from "@/lib/hooks";

/**
 * Custom cursor: a precise dot that tracks the pointer 1:1, and a larger ring
 * that follows with eased inertia. The ring grows + tints over interactive
 * elements (anything matching `a, button, [data-cursor]`).
 *
 * Only mounts on fine-pointer (mouse) devices; touch devices keep native behavior.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const enabled = useFinePointer();

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.add("has-custom-cursor");

    // Target (real mouse) vs. rendered (eased) positions.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: target.x, y: target.y };
    let hovering = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      // Dot is instant.
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      // Detect interactive targets for the magnetic/grow state.
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest("a, button, [data-cursor]");
      if (interactive !== hovering) {
        hovering = interactive;
        ringRef.current?.classList.toggle("cursor-ring--hover", interactive);
      }
    };

    const render = () => {
      ring.x = lerp(ring.x, target.x, 0.18);
      ring.y = lerp(ring.y, target.y, 0.18);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      }
      raf = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-accent"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[70] -ml-5 -mt-5 h-10 w-10 rounded-full border border-foreground/40 transition-[width,height,border-color,background-color,opacity] duration-300 ease-out"
      />
      {/* Hover state styling kept inline-adjacent for locality. */}
      <style>{`
        .cursor-ring--hover {
          width: 4rem;
          height: 4rem;
          margin-left: -2rem;
          margin-top: -2rem;
          border-color: var(--accent);
          background-color: color-mix(in srgb, var(--accent) 12%, transparent);
        }
      `}</style>
    </>
  );
}
