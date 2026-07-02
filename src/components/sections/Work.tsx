import Link from "next/link";
import { WORK } from "@/lib/content";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import Tilt from "@/components/ui/Tilt";
import WorkCard from "@/components/sections/WorkCard";

/** Work — case-study grid with image hover reveals. Placeholder content for now. */
export default function Work() {
  return (
    <Section id="work" className="overflow-hidden">
      {/* Ambient depth glow tying the grid to the hero palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 h-[40rem] w-[40rem] rounded-full bg-accent-glow/[0.07] blur-[130px]"
      />
      <Container className="relative">
        <div className="flex items-end justify-between">
          <div>
            <Reveal>
              <Label>Selected work</Label>
            </Reveal>
            <Reveal as="h2" className="font-display mt-5 text-4xl font-medium sm:text-5xl">
              Products we&apos;ve shipped.
            </Reveal>
          </div>
          <Reveal className="hidden sm:block">
            <Link
              href="/work"
              data-cursor
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {WORK.map((item, i) => (
            <Reveal key={item.id} delay={(i % 2) * 0.08}>
              <Tilt max={4}>
                <WorkCard item={item} />
              </Tilt>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
