"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Subtle 3D pointer-tilt — wraps a card so it leans toward the cursor in
 * perspective, echoing the hero orb's depth. Transform-only (compositor-cheap),
 * eased on pointer-leave. Disabled on touch / coarse pointers and under
 * reduced-motion (renders an inert wrapper).
 */
export default function Tilt({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees on each axis. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Call both hooks unconditionally (no short-circuit) to satisfy Rules of Hooks.
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;

  if (!enabled) return <div className={className}>{children}</div>;

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "h-full transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform",
        className,
      )}
    >
      {children}
    </div>
  );
}
