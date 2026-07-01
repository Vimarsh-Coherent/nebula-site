# Nebula — Build Handoff & Ceiling Log

> Living document. Append, don't rewrite. The point of this file is so no future
> session (human or agent) re-attempts a direction that already proved to be
> "generic AI output" or hit a wall. **If you try something and it doesn't reach
> the bar, log it under "Ceiling / Do-Not-Repeat" with _why_.**

Last updated: 2026-06-27

---

## 0. The bar we're aiming for

The brief: **the most dynamic, extraordinary, next-level UI for an AI-automation /
agentic studio that exists.** Not "a nice premium template." The test is simple:

> A skilled designer should look at it and think *"how did they build that?"* —
> not *"oh, another dark-mode studio site with a glowing blob."*

If a section could be produced by any competent person prompting an AI for a
"modern agency landing page," it is **not done**.

---

## 1. Stack & constraints (read before writing code)

- **Next.js 16.2.9** (Turbopack) — `AGENTS.md` warns this is a *modified* Next with
  breaking changes vs. training data. Before using any Next-specific API (routing,
  metadata, server components, `next/font`, image), check `node_modules/next/dist/docs/`.
  Adding `"use client"` components into existing client pages is proven-safe (Hero,
  Stats, Process all do it).
- **React 19.2**, **Tailwind v4** (CSS-first `@theme inline` in `globals.css`; tokens
  are CSS vars — `bg-background`, `text-muted`, `bg-accent`, `bg-accent-glow`).
- **Three.js 0.184** (raw, not R3F for the perf-critical bits) + `postprocessing`
  (BloomEffect/EffectComposer). `@react-three/fiber` + `drei` are installed but
  the hero/background use vanilla three on purpose (smaller runtime, no type-graph leak).
- **GSAP 3** via `@/lib/gsap` (ScrollTrigger + SplitText pre-registered — import from there).
- **Framer Motion 12** for component-level spring/layout animation.
- **Lenis** smooth scroll, mounted once in layout via `SmoothScroll`.
- Dev server: `npm run dev` → http://localhost:3000 (Turbopack).

### Non-negotiable conventions (every animated thing must obey)
- Gate heavy motion on `usePrefersReducedMotion()` → render a calm static frame.
- Simplify on `useIsMobile()` (lower particle counts, DPR cap ~1.5).
- Custom cursor / pointer effects only when `useFinePointer()`.
- Pause rAF loops when off-screen (`IntersectionObserver`) **and** when tab hidden
  (`visibilitychange`). Cap `devicePixelRatio` (2 desktop / 1.5 mobile).
- Interactive elements get `data-cursor` so the custom `Cursor` reacts.
- Utils: `cn`, `clamp`, `lerp` in `@/lib/utils`. Content lives in `@/lib/content.ts`,
  brand in `@/lib/brand.ts` — never hard-code copy in components.

---

## 2. Current inventory (the baseline as of this handoff)

**Layout** (`src/components/layout/`): `SmoothScroll` (Lenis), `Cursor`, `Grain`
(film grain + vignette via CSS), `Nav`, `Footer`, `Preloader`, `ScrollProgress`,
`PageTransition`, `template.tsx`.

**Visuals** (`src/components/visuals/`):
- `SiteBackground` → mounts `LightingScene` + `LogoMark`, fixed `-z-10`, shares a
  scroll-progress ref + a `flash` ref.
- `LightingScene` — raw-WebGL fullscreen-triangle storm shader (drifting blue/violet
  blooms, cursor parallax, lightning flashes, dims past hero). Solid, keep.
- `LogoMark` — SVG spiral galaxy that "opens" on scroll + lights on lightning flash.
- `HeroBlob` — Three.js icosphere + fbm vertex displacement + fresnel + bloom; cursor
  lean; retunable via the `Notch`. **Competent but generic** (see ceiling log).
- `InteractiveField` — canvas 2D point-mesh, cursor repulsion + click blasts. Currently
  not mounted anywhere on the home flow.

**Sections** (`src/components/sections/`): `Hero`, `Manifesto`, `Services`, `Process`
(GSAP pinned horizontal scroll), `Stats` (count-up), `Work` (gradient-cover cards),
`WorkCard`, `CTA`, `ContactForm`.

**UI primitives** (`src/components/ui/`): `AnimatedText` (SplitText line/word reveal),
`Reveal`, `MagneticButton`, `Marquee`, `Tilt`, `Parallax`, `RollText`, `Label`,
`Section`, `Container`, `PageHeader`, `notch` (Dynamic-Island control).

**Pages**: `/` (long scroll), `/work`, `/services`, `/about`, `/contact`.

---

## 3. Ceiling / Do-Not-Repeat (the important part)

> Approaches that look fine in isolation but read as "template / AI-generated" and
> therefore do **not** clear the bar. Don't reach for these again as the *headline*
> moment.

- **The glowing 3D blob/orb hero** (`HeroBlob`). It's the single most common output
  of "make me a modern AI startup hero." Distorted icosphere + fresnel + bloom = a
  visual cliché now. Keep the *rendering quality* lessons (bloom settings, DPR/IO
  gating) but the orb itself should not be the centerpiece.
- **Static gradient "covers" for Work cards** (`from-x to-y` rectangles). Reads as
  placeholder. A showcase needs motion/real depth, not CSS gradients.
- **Decorative blurred radial glows** (`bg-accent/20 blur-[100px]`) as the main
  "wow." Every template does this. Fine as *support*, never as the idea.
- **Count-up stat numbers + reveal-on-scroll cards**. Table stakes, not a moment.
- **Marquee strips of buzzwords.** Filler. Keep at most one, ironically/with craft.

**Lesson:** the difference between "premium template" and "extraordinary" is a
*signature interactive system that is on-theme (agentic/automation) and that the
visitor can't help but play with.* Generic beauty ≠ memorable.

---

## 4. Roadmap to extraordinary (priority order)

1. **[IN PROGRESS] GPU agent-swarm hero** — replace the blob with a many-thousand
   particle field driven entirely in the vertex shader by curl-noise flow + a cursor
   gravity well, bloomed. Particles read as a living swarm of "agents." Deterministic
   GLSL (no fragile GPGPU ping-pong). This is the showstopper first impression.
2. **AgentFlow orchestration section** — an interactive, living node graph: agent
   nodes (Intake → Plan → Research → Build → Review → Ship) with glowing task packets
   continuously routing along edges, nodes pulsing on receipt, cursor energizing
   nearby nodes. The literal "agentic" story, made tactile. Canvas 2D for reliability.
3. **Decode/scramble text** for headline reveals — the "AI is computing this" texture,
   used sparingly on hero + section heads.
4. **Scroll-choreographed narrative** — tie the swarm's state to scroll so the page
   is one journey (coalesce → route → disperse), not stacked sections.
5. **Real Work showcase** — replace gradient covers with motion previews / an
   expanding case-study interaction.

---

## 5. Work log (append per session)

### 2026-06-27 — session 1
- Read full codebase, established conventions above.
- Wrote this handoff.
- **Shipped: GPU agent-swarm hero** (`visuals/AgentSwarm.tsx` + `shaders/swarm.ts`).
  7.2k particles (2.6k mobile), all motion closed-form in the vertex shader
  (curl-noise flow + cursor gravity well + intro convergence + scroll dispersion),
  bloomed. Replaced `HeroBlob` in `Hero.tsx`. The Notch still retunes colour/energy
  live (now mapped to flow strength/time-rate). Verified: tsc clean, no console
  errors, renders. `HeroBlob.tsx` kept in the tree but no longer mounted — safe to
  delete once we're sure we won't revert.
- **Shipped: AgentFlow orchestration section** (`sections/AgentFlow.tsx`, copy in
  `content.ts` → `AGENT_FLOW`). Canvas edges + routing task packets behind crisp,
  accessible HTML agent chips; cursor energizes nearby nodes; Reviewer→Planner and
  Deploy→Intake feedback loops drawn dashed. Wired into home between Services and
  Process. sr-only `<ol>` describes the pipeline for AT.
- **Shipped: TextScramble** (`ui/TextScramble.tsx`) decode-on-view reveal; opt-in via
  `<Label scramble>` on the hero + AgentFlow eyebrows. `aria-label` carries the real
  text; the scrambling span is `aria-hidden`.

#### Notes for next session
- Verify perf on a real low-end GPU; the swarm vertex shader does ~18 snoise/vertex.
  If it stutters, drop COUNT or the curl `e` octave first.
- Still generic / next on the list: Work cards (gradient covers), Process panels,
  and the page lacks a single scroll-choreographed throughline (see roadmap #4/#5).
- `InteractiveField.tsx` is still unmounted — candidate for deletion or reuse.
