import { SERVICES } from "@/lib/content";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import Tilt from "@/components/ui/Tilt";
import { cn } from "@/lib/utils";

/** Services — 4 benefit-first cards. Hover/focus reveals detail + bullets. */
export default function Services() {
  return (
    <Section id="services">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <Label>What we do</Label>
            </Reveal>
            <Reveal as="h2" className="font-display mt-5 max-w-2xl text-4xl font-medium sm:text-5xl">
              Everything you need to go from idea to product.
            </Reveal>
          </div>
          <Reveal as="p" className="max-w-sm text-muted">
            No jargon, no hand-waving. Four ways we help you ship — explained in
            plain English.
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((service, i) => (
            <Reveal key={service.id} delay={(i % 2) * 0.08}>
              <Tilt>
                <ServiceCard
                  index={i}
                  title={service.title}
                  blurb={service.blurb}
                  detail={service.detail}
                  bullets={service.bullets}
                />
              </Tilt>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function ServiceCard({
  index,
  title,
  blurb,
  detail,
  bullets,
}: {
  index: number;
  title: string;
  blurb: string;
  detail: string;
  bullets: string[];
}) {
  return (
    <article
      tabIndex={0}
      data-cursor
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 p-8",
        "transition-colors duration-500 hover:border-foreground/15 hover:bg-surface focus-within:border-foreground/15",
      )}
    >
      {/* Accent glow that follows the card on hover */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
        {/* Small animated glyph (rotates on hover) */}
        <span
          aria-hidden
          className="h-6 w-6 rounded-[6px] border border-foreground/20 transition-all duration-500 group-hover:rotate-[225deg] group-hover:border-accent group-hover:shadow-[0_0_16px_var(--accent)]"
        />
      </div>

      <h3 className="font-display mt-10 text-2xl font-medium">{title}</h3>
      <p className="mt-3 text-muted">{blurb}</p>

      {/* Detail reveals on hover/focus via the grid-rows expand trick */}
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <p className="mt-5 text-sm leading-relaxed text-muted/80">{detail}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {bullets.map((b) => (
              <li
                key={b}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
