import { cn } from "@/lib/utils";

/**
 * Hover roll-up label: the text slides up and out while an identical copy
 * slides in from below. Put a `group` on the parent (or pass groupName).
 * Pure CSS — works without JS and respects reduced-motion (transition is
 * neutralized globally).
 */
export default function RollText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full text-foreground transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0"
      >
        {children}
      </span>
    </span>
  );
}
