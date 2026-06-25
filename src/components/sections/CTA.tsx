import { CTA as CTA_CONTENT } from "@/lib/content";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import AnimatedText from "@/components/ui/AnimatedText";
import MagneticButton from "@/components/ui/MagneticButton";

/** CTA band — oversized invitation with a magnetic primary button over an accent glow. */
export default function CTA() {
  return (
    <Section id="cta" className="overflow-hidden">
      {/* Soft accent glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]"
      />
      {/* Slow rotating aurora ring — a 3D echo of the hero orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 animate-[spin_26s_linear_infinite] rounded-full opacity-25 blur-2xl [background:conic-gradient(from_0deg,transparent,var(--accent),transparent_38%,var(--accent-glow),transparent_72%,var(--accent),transparent)] [mask:radial-gradient(closest-side,transparent_56%,#000_62%,#000_74%,transparent_82%)]"
      />
      <Container className="relative text-center">
        <Reveal className="flex justify-center">
          <Label>{CTA_CONTENT.label}</Label>
        </Reveal>

        <AnimatedText
          as="h2"
          split="lines"
          className="font-display mx-auto mt-8 max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] font-semibold"
        >
          {CTA_CONTENT.headline}
        </AnimatedText>

        <Reveal className="mt-12 flex justify-center" delay={0.1}>
          <MagneticButton href={CTA_CONTENT.href} strength={28} className="px-9 py-4 text-base">
            {CTA_CONTENT.buttonLabel}
          </MagneticButton>
        </Reveal>
      </Container>
    </Section>
  );
}
