import { cn } from "@/lib/utils";

/** Standardized section wrapper: vertical rhythm + optional anchor id. */
export default function Section({
  id,
  children,
  className,
  full = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** Skip default vertical padding (for full-bleed sections like the hero). */
  full?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative",
        !full && "py-[var(--section-py)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
