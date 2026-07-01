"use client";

import { useState } from "react";
import { HERO } from "@/lib/content";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import MagneticButton from "@/components/ui/MagneticButton";
import AnimatedText from "@/components/ui/AnimatedText";
import AgentSwarm from "@/components/visuals/AgentSwarm";
import { Notch, type NotchItem } from "@/components/ui/notch";
import { motion } from "framer-motion";

/** Notch color presets → the swarm's two flow colors. */
const ORB_COLORS: Record<string, { a: string; b: string }> = {
  "#5b8cff": { a: "#5b8cff", b: "#9d7bff" }, // Blue (brand)
  "#9d7bff": { a: "#9d7bff", b: "#c084fc" }, // Violet
  "#10b981": { a: "#10b981", b: "#22d3ee" }, // Emerald
  "#f43f5e": { a: "#f43f5e", b: "#fb7185" }, // Rose
};

/** Notch energy presets → swarm flow strength + time-rate. */
const ORB_ENERGY: Record<string, { amp: number; spin: number }> = {
  calm: { amp: 0.42, spin: 0.6 },
  balanced: { amp: 0.65, spin: 1.0 },
  wild: { amp: 1.05, spin: 1.6 },
};

/**
 * Hero — first viewport. Editorial headline + CTAs sit in front of the 3D
 * nebula orb, which the Notch control lets visitors retune live.
 */
export default function Hero() {
  const [color, setColor] = useState("#5b8cff");
  const [energy, setEnergy] = useState("balanced");

  const orb = ORB_COLORS[color] ?? ORB_COLORS["#5b8cff"];
  const motionPreset = ORB_ENERGY[energy] ?? ORB_ENERGY.balanced;

  const notchItems: NotchItem[] = [
    {
      id: "color",
      label: "Orb color",
      value: color,
      onChange: setColor,
      options: [
        { id: "#5b8cff", label: "Blue" },
        { id: "#9d7bff", label: "Violet" },
        { id: "#10b981", label: "Emerald" },
        { id: "#f43f5e", label: "Rose" },
      ],
    },
    {
      id: "energy",
      label: "Energy",
      value: energy,
      onChange: setEnergy,
      options: [
        { id: "calm", label: "Calm" },
        { id: "balanced", label: "Balanced" },
        { id: "wild", label: "Wild" },
      ],
    },
  ];

  return (
    <section
      id="hero"
      className="relative flex min-h-svh items-center overflow-hidden pt-28"
    >
      {/* Centerpiece (behind content): the full-bleed GPU agent swarm over the
          site-wide storm. A left-side wash + vignette keep the left-aligned
          headline crisp while the swarm breathes across the viewport. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <AgentSwarm
          colorA={orb.a}
          colorB={orb.b}
          amp={motionPreset.amp}
          spin={motionPreset.spin}
        />

        {/* Wash the headline side darker for contrast (desktop): solid dark
            across the left column, fading out past the headline. */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,var(--background)_0%,var(--background)_34%,transparent_70%)] md:block" />
        {/* Tame the bright right edge so the swarm doesn't clip to white. */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_left,var(--background)_0%,transparent_22%)] md:block" />
        {/* Top scrim keeps the nav legible over the swarm. */}
        <div className="absolute inset-x-0 top-0 hidden h-32 bg-gradient-to-b from-background/90 to-transparent md:block" />
        {/* Mobile: stronger top-weighted scrim so the stacked headline stays legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/10 md:hidden" />
        {/* Soft vignette to settle the edges */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_70%_45%,transparent_46%,var(--background)_92%)]" />
      </div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Label scramble>{HERO.label}</Label>
        </motion.div>

        {/* Headline reveals line-by-line */}
        <h1 className="font-display mt-6 max-w-5xl text-[clamp(2.75rem,9vw,7.5rem)] font-semibold">
          {HERO.headline.map((line, i) => (
            <AnimatedText
              key={line}
              as="span"
              split="lines"
              delay={0.35 + i * 0.12}
              className="block"
            >
              {line}
            </AnimatedText>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-muted"
        >
          {HERO.subline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.05 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <MagneticButton href={HERO.primaryCta.href}>
            {HERO.primaryCta.label}
          </MagneticButton>
          <MagneticButton href={HERO.secondaryCta.href} variant="secondary">
            {HERO.secondaryCta.label}
          </MagneticButton>
        </motion.div>
      </Container>

      {/* Interaction hint (trionn-style "dare to touch the lines") */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 right-6 hidden items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted md:flex lg:right-12"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Move your cursor — bend the swarm
      </motion.div>

      {/* Live background control — retunes the orb in real time */}
      <Notch
        items={notchItems}
        position="bottom"
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      />
    </section>
  );
}
