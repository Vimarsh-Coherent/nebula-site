"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { clamp, lerp } from "@/lib/utils";

/**
 * Nebula brand mark living in the background: a glowing spiral galaxy (swirling
 * arms + scattered stars around a bright core) with the NEBULA wordmark beneath.
 *
 * It "opens up" with scroll — a vertical aperture parts while the galaxy scales,
 * winds open (rotation) and its wordmark tracking spreads, then it dissolves as
 * you move deeper so it stays out of the content's way. It also brightens on
 * every lightning flash (the shared `flash` ref, published by LightingScene).
 *
 * Driven by the shared scroll `progress` ref (0 at top → 1 past the hero), eased
 * in a local rAF and written to a `--p` CSS variable + opacity so the heavy
 * lifting stays on the compositor. Reduced-motion → a calm static pose.
 */

type ProgressRef = { current: number };

/** Logarithmic-spiral arm as an SVG path, centered on the 240×240 viewBox. */
function spiralArm(offset: number, turns: number, b: number, scale: number) {
  const cx = 120;
  const cy = 120;
  const steps = 140;
  const thetaMax = turns * Math.PI * 2;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * thetaMax;
    const r = scale * Math.exp(b * th);
    const a = th + offset;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
  }
  return d;
}

// Three arms, evenly offset, sharing a tight log-spiral profile.
const ARMS = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((o) =>
  spiralArm(o, 2.6, 0.2, 2.2),
);

// A scattering of background stars (fixed so they ride the galaxy as it spins).
const STARS: Array<[number, number, number]> = [
  [62, 72, 1.2],
  [182, 92, 1.0],
  [150, 172, 1.4],
  [80, 158, 1.0],
  [120, 52, 0.9],
  [196, 142, 1.1],
  [54, 120, 1.0],
  [168, 56, 0.8],
];

export default function LogoMark({
  progress,
  flash,
}: {
  progress: ProgressRef;
  flash: ProgressRef;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      // A gentle, half-open resting pose with no animation.
      el.style.setProperty("--p", "0.45");
      el.style.opacity = "0.2";
      return;
    }

    let raf = 0;
    let shown = 0;
    const tick = () => {
      const target = clamp(progress.current, 0, 1);
      shown = lerp(shown, target, 0.12);
      el.style.setProperty("--p", shown.toFixed(4));
      // Base bloom envelope: present at rest, peaks through the hero, dissolves
      // deeper down — then lit further by each lightning flash.
      const base =
        0.14 * (1 - shown) + Math.sin(clamp(shown, 0, 1) * Math.PI) * 0.18;
      const lit = base + flash.current * 0.55;
      el.style.opacity = Math.min(lit, 0.95).toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, progress, flash]);

  return (
    <div ref={ref} aria-hidden className="nebula-logo">
      <svg viewBox="0 0 240 240" fill="none">
        <defs>
          <radialGradient id="nebula-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#eaf0ff" stopOpacity="0.95" />
            <stop offset="22%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="var(--accent-glow)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-glow)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-glow)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Faint galactic disk halo */}
        <circle cx="120" cy="120" r="115" fill="url(#nebula-halo)" />

        {/* Spinning galaxy: spiral arms + stars */}
        <g className="nebula-galaxy nebula-spin">
          {ARMS.map((d, i) => (
            <path
              key={d}
              d={d}
              stroke={i % 2 ? "var(--accent-glow)" : "currentColor"}
              strokeWidth="1.4"
              strokeOpacity="0.5"
              strokeLinecap="round"
            />
          ))}
          {STARS.map(([x, y, r]) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={r}
              fill="currentColor"
              fillOpacity="0.7"
            />
          ))}
        </g>

        {/* Bright core */}
        <circle cx="120" cy="120" r="52" fill="url(#nebula-core)" />
        <circle cx="120" cy="120" r="6.5" fill="#eaf0ff" />

        {/* Wordmark — tracking opens with scroll */}
        <text x="120" y="236" textAnchor="middle" className="nebula-word">
          NEBULA
        </text>
      </svg>
    </div>
  );
}
