import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import AnimatedText from "@/components/ui/AnimatedText";
import Reveal from "@/components/ui/Reveal";

/** Shared header for sub-routes. Adds top padding to clear the fixed nav. */
export default function PageHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="relative overflow-hidden pt-40 pb-12 sm:pt-48">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
      />
      <Container className="relative">
        <Reveal>
          <Label>{label}</Label>
        </Reveal>
        <AnimatedText
          as="h1"
          split="lines"
          className="font-display mt-6 max-w-4xl text-[clamp(2.5rem,8vw,6rem)] font-semibold"
        >
          {title}
        </AnimatedText>
        {subtitle && (
          <Reveal as="p" className="mt-6 max-w-2xl text-lg text-muted" delay={0.1}>
            {subtitle}
          </Reveal>
        )}
      </Container>
    </header>
  );
}
