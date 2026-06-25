"use client";

import { useState } from "react";
import { HERO } from "@/lib/content";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import MagneticButton from "@/components/ui/MagneticButton";
import AnimatedText from "@/components/ui/AnimatedText";
import HeroBlob from "@/components/visuals/HeroBlob";
import { Notch, type NotchItem } from "@/components/ui/notch";
import { motion } from "framer-motion";

/** Notch color presets → the orb's two iridescence colors. */
const ORB_COLORS: Record<string, { a: string; b: string }> = {
  "#5b8cff": { a: "#5b8cff", b: "#9d7bff" }, // Blue (brand)
  "#9d7bff": { a: "#9d7bff", b: "#c084fc" }, // Violet
  "#10b981": { a: "#10b981", b: "#22d3ee" }, // Emerald
  "#f43f5e": { a: "#f43f5e", b: "#fb7185" }, // Rose
};

/** Notch energy presets → ripple amplitude + idle spin speed. */
const ORB_ENERGY: Record<string, { amp: number; spin: number }> = {
  calm: { amp: 0.18, spin: 0.03 },
  balanced: { amp: 0.28, spin: 0.05 },
  wild: { amp: 0.44, spin: 0.09 },
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
      {/* Centerpiece (behind content): the 3D nebula orb over the site-wide storm.
          A glow halo gives it depth; a left-side wash + vignette keep the
          left-aligned headline crisp while the orb glows on the right. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {/* Depth halo behind the orb */}
        <div className="absolute right-[6%] top-1/2 h-[64vmin] w-[64vmin] -translate-y-1/2 rounded-full bg-accent/20 blur-[100px] animate-[float_16s_ease-in-out_infinite]" />
        <div className="absolute right-[16%] top-[40%] h-[34vmin] w-[34vmin] rounded-full bg-accent-glow/20 blur-[80px] animate-[float2_20s_ease-in-out_infinite]" />

        <HeroBlob
          colorA={orb.a}
          colorB={orb.b}
          amp={motionPreset.amp}
          spin={motionPreset.spin}
        />

        {/* Wash the headline side darker for contrast (desktop) */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,var(--background)_10%,transparent_62%)] md:block" />
        {/* Mobile: stronger top-weighted scrim so the stacked headline stays legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/45 to-background/15 md:hidden" />
        {/* Soft vignette weighted toward the orb */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_72%_45%,transparent_46%,var(--background)_94%)]" />
      </div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Label>{HERO.label}</Label>
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
        Move your cursor — warp the orb
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
