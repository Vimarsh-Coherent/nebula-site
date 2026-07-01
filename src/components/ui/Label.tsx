import { cn } from "@/lib/utils";
import TextScramble from "@/components/ui/TextScramble";

/** Small uppercase eyebrow label with an accent dot — used above section headings. */
export default function Label({
  children,
  className,
  /** When true (and children is a string), the text decodes in on view-enter. */
  scramble = false,
}: {
  children: React.ReactNode;
  className?: string;
  scramble?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.2em] text-muted",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
      {scramble && typeof children === "string" ? (
        <TextScramble>{children}</TextScramble>
      ) : (
        children
      )}
    </span>
  );
}
