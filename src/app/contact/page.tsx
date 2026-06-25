import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/sections/ContactForm";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a free discovery call or tell us about your idea.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        label="Contact"
        title="Let's talk."
        subtitle="Book a free discovery call or send us a note. No pressure, no jargon — just a conversation about what you want to build."
      />

      <Section className="pt-0">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <Reveal className="space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  Email
                </p>
                <a
                  href={`mailto:${BRAND.email}`}
                  data-cursor
                  className="font-display mt-2 block text-2xl transition-colors hover:text-accent"
                >
                  {BRAND.email}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  Follow
                </p>
                <ul className="mt-3 space-y-2">
                  {BRAND.socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        data-cursor
                        className="text-muted transition-colors hover:text-foreground"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <ContactForm />
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
