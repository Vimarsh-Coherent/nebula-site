"use client";

import Link from "next/link";
import { useRef } from "react";
import type { WorkItem } from "@/lib/content";
import WorkCover from "@/components/visuals/WorkCover";

/**
 * Work card. The cover is a live, generative animation per project (WorkCover)
 * that spins up on hover. Two microinteractions on top:
 *  - a circular "View" badge that follows the cursor inside the card
 *  - a result-metric chip + title that shift to the accent on hover
 */
export default function WorkCard({ item }: { item: WorkItem }) {
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
      <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-border transition-[border-color,transform] duration-500 group-hover:border-foreground/20">
        {/* Live generative cover (subtle zoom on hover) */}
        <WorkCover
          variant={item.variant}
          className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* Top edge: result metric chip */}
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-foreground/90 backdrop-blur-md">
            {item.metric}
          </span>
          <span className="text-[0.7rem] uppercase tracking-[0.15em] text-muted">
            {item.year}
          </span>
        </div>

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
          {item.category}
        </span>
      </div>
    </Link>
  );
}
