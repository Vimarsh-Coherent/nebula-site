import { MANIFESTO } from "@/lib/content";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import AnimatedText from "@/components/ui/AnimatedText";
import Reveal from "@/components/ui/Reveal";

/** Manifesto — oversized statement that reveals line-by-line, then a plain-English explainer. */
export default function Manifesto() {
  return (
    <Section id="manifesto">
      <Container>
        <Reveal>
          <Label>{MANIFESTO.label}</Label>
        </Reveal>

        <div className="font-display mt-8 max-w-5xl text-[clamp(1.75rem,5vw,3.75rem)] font-medium leading-[1.05]">
          {MANIFESTO.lines.map((line, i) => (
            <AnimatedText
              key={line}
              as="span"
              split="lines"
              delay={i * 0.05}
              className="block text-foreground/90 [&:nth-child(n+3)]:text-muted"
            >
              {line}
            </AnimatedText>
          ))}
        </div>

        <Reveal
          as="p"
          className="mt-12 max-w-2xl text-lg leading-relaxed text-muted"
          delay={0.1}
        >
          {MANIFESTO.body}
        </Reveal>
      </Container>
    </Section>
  );
}
