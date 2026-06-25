import { cn } from "@/lib/utils";

/** Small uppercase eyebrow label with an accent dot — used above section headings. */
export default function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.2em] text-muted",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
      {children}
    </span>
  );
}
