import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import Stats from "@/components/sections/Stats";
import CTA from "@/components/sections/CTA";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description: BRAND.description,
};

const VALUES = [
  {
    title: "Clarity first",
    body: "We explain everything in plain language. You'll never feel lost in your own project.",
  },
  {
    title: "Ship, then scale",
    body: "We get something real in front of users fast, then improve with evidence — not guesses.",
  },
  {
    title: "Built to last",
    body: "Sensible architecture and automation so your product keeps working as you grow.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        label="About"
        title="A studio for the non-technical founder."
        subtitle={`${BRAND.name} pairs senior engineering with practical AI to help small teams build real products — and understand every step.`}
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="border-t border-border pt-6">
                  <h3 className="font-display text-2xl font-medium">{v.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Stats />
      <CTA />
    </>
  );
}
