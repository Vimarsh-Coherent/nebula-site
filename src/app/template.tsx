import PageTransition from "@/components/layout/PageTransition";

/**
 * `template.tsx` remounts on every navigation (unlike `layout.tsx`), which makes
 * it the right place to drive enter animations / page transitions.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
