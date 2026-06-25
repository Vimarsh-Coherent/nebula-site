"use client";

import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";

type Variant = "primary" | "secondary";

type BaseProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  /** Magnetic pull strength (px of travel at the edge). */
  strength?: number;
};

type Props =
  | (BaseProps & { href: string; onClick?: never; type?: never })
  | (BaseProps & {
      href?: never;
      onClick?: () => void;
      type?: "button" | "submit";
    });

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-[#050608] shadow-[0_0_0_0_var(--accent)] hover:shadow-[0_8px_40px_-6px_var(--accent)]",
  secondary:
    "bg-transparent text-foreground border border-border hover:border-foreground/40 hover:bg-surface",
};

/**
 * Magnetic, glowing button. Tracks the pointer while hovered and eases the
 * button + its label toward the cursor for a tactile "magnetic" feel.
 * Renders as a Next <Link> when `href` is set, otherwise a <button>.
 * Magnet is disabled under prefers-reduced-motion.
 */
export default function MagneticButton(props: Props) {
  const { children, variant = "primary", className, strength = 18 } = props;
  const wrapRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    if (reduced || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    const nx = (x / (rect.width / 2)) * strength;
    const ny = (y / (rect.height / 2)) * strength;
    wrapRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    if (labelRef.current) {
      labelRef.current.style.transform = `translate3d(${nx * 0.4}px, ${ny * 0.4}px, 0)`;
    }
  };

  const reset = () => {
    if (wrapRef.current) wrapRef.current.style.transform = "translate3d(0,0,0)";
    if (labelRef.current) labelRef.current.style.transform = "translate3d(0,0,0)";
  };

  const classes = cn(
    "relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium",
    "transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out will-change-transform",
    variants[variant],
    className,
  );

  const inner = (
    <span ref={labelRef} className="inline-flex items-center gap-2 transition-transform duration-300 ease-out">
      {children}
    </span>
  );

  return (
    <span
      ref={wrapRef}
      data-cursor
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="inline-block transition-transform duration-300 ease-out will-change-transform"
    >
      {"href" in props && props.href ? (
        <Link href={props.href} className={classes}>
          {inner}
        </Link>
      ) : (
        <button
          type={props.type ?? "button"}
          onClick={props.onClick}
          className={classes}
        >
          {inner}
        </button>
      )}
    </span>
  );
}
