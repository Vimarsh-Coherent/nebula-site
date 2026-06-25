"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Notch — a Dynamic-Island-style floating control. Collapsed it's a small pill
 * showing the current selections; tapped it morphs open into a panel of grouped
 * option pickers. Each item drives external state through its `onChange`.
 *
 * Options whose `id` is a hex color (`#…`) render as swatches; everything else
 * renders as labelled pills.
 *
 * Positioning: defaults to `fixed` at the bottom-center (override with
 * `className`). Keeping the literal `fixed` class means a parent can scope it to
 * a container with `[&_.fixed]:absolute`, as in the demo.
 */

export type NotchOption = { id: string; label: string };

export type NotchItem = {
  id: string;
  label: string;
  options: NotchOption[];
  value: string;
  onChange: (id: string) => void;
};

export type NotchProps = {
  items: NotchItem[];
  position?: "top" | "bottom";
  className?: string;
};

const isColor = (id: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(id);

export function Notch({ items, position = "bottom", className }: NotchProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const reduce = useReducedMotion();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fromBottom = position === "bottom";

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex w-fit flex-col",
        fromBottom ? "items-center justify-end" : "items-center justify-start",
        className ?? "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
      )}
    >
      <motion.div
        layout
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }
        }
        className="pointer-events-auto overflow-hidden rounded-[1.75rem] border border-border bg-surface/80 text-foreground shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open ? (
            <motion.div
              key="panel"
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
              className="flex w-[17rem] flex-col gap-4 p-4"
              role="group"
              aria-labelledby={labelId}
            >
              <div className="flex items-center justify-between">
                <span
                  id={labelId}
                  className="text-xs font-medium uppercase tracking-[0.18em] text-muted"
                >
                  Customize
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-2 py-1 text-xs text-muted transition-colors hover:text-foreground"
                  data-cursor
                >
                  Done
                </button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-2">
                  <span className="text-xs text-muted">{item.label}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.options.map((opt) => {
                      const active = item.value === opt.id;
                      if (isColor(opt.id)) {
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => item.onChange(opt.id)}
                            aria-label={opt.label}
                            aria-pressed={active}
                            title={opt.label}
                            data-cursor
                            style={{ background: opt.id }}
                            className={cn(
                              "h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition-transform",
                              active
                                ? "ring-2 ring-foreground"
                                : "ring-1 ring-border hover:scale-110",
                            )}
                          />
                        );
                      }
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => item.onChange(opt.id)}
                          aria-pressed={active}
                          data-cursor
                          className={cn(
                            "rounded-full px-3 py-1.5 text-sm transition-colors",
                            active
                              ? "bg-foreground text-background"
                              : "bg-surface-2 text-muted hover:text-foreground",
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.button
              key="pill"
              type="button"
              layout
              onClick={() => setOpen(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
              aria-expanded={open}
              aria-label="Open background controls"
              data-cursor
              className="flex items-center gap-3 px-4 py-2.5"
            >
              {items.map((item) => {
                const current = item.options.find((o) => o.id === item.value);
                return (
                  <span key={item.id} className="flex items-center gap-1.5">
                    {isColor(item.value) ? (
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-border"
                        style={{ background: item.value }}
                      />
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {current?.label ?? item.value}
                      </span>
                    )}
                  </span>
                );
              })}
              <span className="text-xs text-muted">Customize</span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Notch;
