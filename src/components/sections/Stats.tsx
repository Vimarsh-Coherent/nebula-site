"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { STATS } from "@/lib/content";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";

/** Why us / Stats — animated counters that tick up when scrolled into view. */
export default function Stats() {
  return (
    <Section id="stats">
      <Container>
        <Reveal>
          <Label>Why teams choose us</Label>
        </Reveal>
        <Reveal as="h2" className="font-display mt-5 max-w-2xl text-4xl font-medium sm:text-5xl">
          Outcomes, not promises.
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div className="border-t border-border pt-6">
                <Counter value={stat.value} suffix={stat.suffix} />
                <p className="mt-3 text-sm text-muted">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return; // static value rendered directly below
    const el = ref.current;
    if (!el) return;

    // Trigger the count-up once when the element scrolls into view.
    const obj = { v: 0 };
    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tween = gsap.to(obj, {
            v: value,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => setDisplay(Math.round(obj.v)),
          });
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [reduced, value]);

  return (
    <span ref={ref} className="font-display text-5xl font-semibold sm:text-6xl">
      {reduced ? value : display}
      <span className="text-accent">{suffix}</span>
    </span>
  );
}
