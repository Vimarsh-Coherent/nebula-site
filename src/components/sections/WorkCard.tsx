"use client";

import Link from "next/link";
import { useRef } from "react";
import type { WorkItem } from "@/lib/content";
import Parallax from "@/components/ui/Parallax";
import { cn } from "@/lib/utils";

/**
 * Work card with two trionn-style microinteractions:
 *  - a circular "View" badge that follows the cursor inside the card
 *  - a parallax cover that drifts as you scroll + zooms on hover
 */
export default function WorkCard({
  item,
  cover,
}: {
  item: WorkItem;
  cover: string;
}) {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const frame = frameRef.current;
    const badge = badgeRef.current;
    if (!frame || !badge) return;
    const rect = frame.getBoundingClientRect();
    badge.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px) translate(-50%, -50%)`;
  };

  return (
    <Link
      ref={frameRef}
      href="/work"
      data-cursor
      onPointerMove={onMove}
      className="group block"
      aria-label={`${item.client} — ${item.title}`}
    >
      <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-border">
        {/* Cover (taller than frame so parallax has room) */}
        <Parallax speed={0.12} className="absolute -inset-y-[12%] inset-x-0">
          <div
            className={cn(
              "h-full w-full bg-gradient-to-br transition-transform duration-700 ease-out group-hover:scale-105",
              cover,
            )}
          />
        </Parallax>

        {/* Darkening on hover */}
        <div className="absolute inset-0 bg-background/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Cursor-following View badge */}
        <span
          ref={badgeRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 flex h-20 w-20 scale-0 items-center justify-center rounded-full bg-accent text-center text-xs font-medium uppercase tracking-[0.12em] text-[#050608] transition-transform duration-300 ease-out group-hover:scale-100"
        >
          View ↗
        </span>
      </div>

      {/* Meta */}
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-medium transition-colors duration-300 group-hover:text-accent">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-muted">{item.client}</p>
        </div>
        <span className="shrink-0 text-xs uppercase tracking-[0.15em] text-muted">
          {item.category} · {item.year}
        </span>
      </div>
    </Link>
  );
}
