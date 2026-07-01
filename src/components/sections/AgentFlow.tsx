"use client";

import { useEffect, useRef } from "react";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import { AGENT_FLOW } from "@/lib/content";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/hooks";
import { clamp } from "@/lib/utils";

/**
 * AgentFlow — a living agent-orchestration graph.
 *
 * Specialized "agents" (nodes) are wired into a branching pipeline. Glowing task
 * packets continuously route along the edges; a node pulses when a packet arrives
 * and then forwards it down a random outgoing edge (Deploy loops back to Intake,
 * Reviewer can bounce work back to the Planner — the agentic retry loop). Moving
 * the cursor energizes nearby agents and the links between them.
 *
 * Node chips are real, accessible HTML positioned by normalized coords (so they
 * stay crisp and screen-readable); the canvas behind draws only the edges + the
 * traveling packets, reading the same coords scaled to the measured box.
 *
 *  - Reduced-motion → static graph (no loop, packets parked mid-edge).
 *  - Cursor energizing only on fine pointers.
 *  - rAF pauses off-screen (IntersectionObserver) and while the tab is hidden.
 */

type NodeId =
  | "intake"
  | "planner"
  | "research"
  | "build"
  | "review"
  | "deploy";

type Node = {
  id: NodeId;
  label: string;
  role: string;
  // normalized position in the graph box (0..1)
  x: number;
  y: number;
};

const NODES: Node[] = [
  { id: "intake", label: "Intake", role: "Understands the ask", x: 0.08, y: 0.5 },
  { id: "planner", label: "Planner", role: "Breaks down the work", x: 0.3, y: 0.5 },
  { id: "research", label: "Researcher", role: "Gathers context", x: 0.52, y: 0.18 },
  { id: "build", label: "Builder", role: "Produces the work", x: 0.52, y: 0.82 },
  { id: "review", label: "Reviewer", role: "Checks quality", x: 0.74, y: 0.5 },
  { id: "deploy", label: "Deploy", role: "Ships + monitors", x: 0.93, y: 0.5 },
];

// from → to. `feedback` edges are the agentic retry loops (drawn dashed).
type Edge = { from: NodeId; to: NodeId; feedback?: boolean };
const EDGES: Edge[] = [
  { from: "intake", to: "planner" },
  { from: "planner", to: "research" },
  { from: "planner", to: "build" },
  { from: "research", to: "review" },
  { from: "build", to: "review" },
  { from: "review", to: "deploy" },
  { from: "review", to: "planner", feedback: true }, // bounce back for a fix
  { from: "deploy", to: "intake", feedback: true }, // continuous loop
];

const NODE_INDEX: Record<NodeId, number> = Object.fromEntries(
  NODES.map((n, i) => [n.id, i]),
) as Record<NodeId, number>;

// Outgoing edges per node (forward edges weighted higher than feedback loops).
const OUT: Record<NodeId, number[]> = NODES.reduce(
  (acc, n) => {
    acc[n.id] = EDGES.map((e, i) => (e.from === n.id ? i : -1)).filter(
      (i) => i >= 0,
    );
    return acc;
  },
  {} as Record<NodeId, number[]>,
);

export default function AgentFlow() {
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const pad = 0.04; // keep edges off the very rim

    // pixel position of a node, honoring a small inner padding
    const px = (n: Node) => (pad + n.x * (1 - 2 * pad)) * w;
    const py = (n: Node) => (pad + n.y * (1 - 2 * pad)) * h;

    // Quadratic control point: bow each edge slightly off the straight line.
    const ctrl = (a: Node, b: Node) => {
      const ax = px(a);
      const ay = py(a);
      const bx = px(b);
      const by = py(b);
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      // perpendicular offset, scaled by length
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const bow = len * 0.12;
      return { ax, ay, bx, by, cx: mx + nx * bow, cy: my + ny * bow };
    };

    const bez = (t: number, p0: number, p1: number, p2: number) => {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    };

    type Packet = { edge: number; t: number; speed: number };
    const packets: Packet[] = [];
    const seedPackets = () => {
      packets.length = 0;
      // start packets fanning across the network so it reads alive immediately
      const starts = [0, 0, 1, 2, 3, 4, 5, 1, 2, 6];
      for (const e of starts) {
        packets.push({
          edge: e,
          t: Math.random(),
          speed: 0.22 + Math.random() * 0.16,
        });
      }
    };
    seedPackets();

    const pulse: number[] = NODES.map(() => 0);

    const mouse = { x: -9999, y: -9999 };
    const interactive = !reduced && fine;

    const resize = () => {
      const rect = box.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const C_ACCENT = "91,140,255"; // --accent
    const C_GLOW = "157,123,255"; // --accent-glow

    let dash = 0;

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);

      // node energy from cursor proximity (0..1)
      const energy = NODES.map((n) => {
        if (!interactive) return 0;
        const d = Math.hypot(px(n) - mouse.x, py(n) - mouse.y);
        const R = Math.min(w, h) * 0.32;
        return clamp(1 - d / R, 0, 1);
      });

      dash -= dt * 60;

      // --- edges ---
      for (const e of EDGES) {
        const a = NODES[NODE_INDEX[e.from]];
        const b = NODES[NODE_INDEX[e.to]];
        const c = ctrl(a, b);
        const lit = Math.max(energy[NODE_INDEX[e.from]], energy[NODE_INDEX[e.to]]);
        const base = e.feedback ? 0.14 : 0.22;
        ctx.beginPath();
        ctx.moveTo(c.ax, c.ay);
        ctx.quadraticCurveTo(c.cx, c.cy, c.bx, c.by);
        ctx.lineWidth = e.feedback ? 1 : 1.4;
        ctx.strokeStyle = `rgba(${e.feedback ? C_GLOW : C_ACCENT},${base + lit * 0.5})`;
        if (e.feedback) ctx.setLineDash([3, 7]);
        else ctx.setLineDash([2, 6]);
        ctx.lineDashOffset = dash;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- packets (glow via additive compositing) ---
      ctx.globalCompositeOperation = "lighter";
      for (const p of packets) {
        const e = EDGES[p.edge];
        const a = NODES[NODE_INDEX[e.from]];
        const b = NODES[NODE_INDEX[e.to]];
        const c = ctrl(a, b);
        // short trail
        for (let s = 0; s < 5; s++) {
          const tt = clamp(p.t - s * 0.045, 0, 1);
          const x = bez(tt, c.ax, c.cx, c.bx);
          const y = bez(tt, c.ay, c.cy, c.by);
          const a0 = (1 - s / 5) * 0.5;
          const rad = 3.2 - s * 0.4;
          const col = e.feedback ? C_GLOW : C_ACCENT;
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 3);
          g.addColorStop(0, `rgba(${col},${a0})`);
          g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, rad * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // bright head
        const hx = bez(p.t, c.ax, c.cx, c.bx);
        const hy = bez(p.t, c.ay, c.cy, c.by);
        ctx.fillStyle = "rgba(235,240,255,0.95)";
        ctx.beginPath();
        ctx.arc(hx, hy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // --- node halos (the chips themselves are HTML on top) ---
      ctx.globalCompositeOperation = "lighter";
      NODES.forEach((n, i) => {
        // faint always-on presence + brighter pulse/energy on top
        const glow = Math.max(0.12, pulse[i], energy[i] * 0.85);
        const x = px(n);
        const y = py(n);
        const rad = 24 + glow * 28;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${C_ACCENT},${0.26 * glow})`);
        g.addColorStop(1, `rgba(${C_ACCENT},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
    };

    const advance = (dt: number) => {
      for (let i = 0; i < pulse.length; i++) pulse[i] = Math.max(0, pulse[i] - dt * 1.8);

      for (const p of packets) {
        p.t += p.speed * dt;
        if (p.t >= 1) {
          const e = EDGES[p.edge];
          const arrived = NODE_INDEX[e.to];
          pulse[arrived] = 1; // node lights up on receipt
          // forward down a random outgoing edge of the node we just reached
          const outs = OUT[e.to];
          p.edge = outs.length
            ? outs[Math.floor(Math.random() * outs.length)]
            : 0; // safety: should always have an outgoing edge (deploy loops)
          p.t = 0;
          p.speed = 0.2 + Math.random() * 0.18;
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      advance(dt);
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf || reduced) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0); // repaint static frame at the new size
    });
    ro.observe(box);

    if (reduced) {
      draw(0); // single static frame
    } else {
      if (interactive) {
        box.addEventListener("pointermove", onMove);
        box.addEventListener("pointerleave", onLeave);
      }
      // run only while on-screen + tab visible
      let onScreen = true;
      let tabVisible = !document.hidden;
      const maybeRun = () => (onScreen && tabVisible ? start() : stop());
      const io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          maybeRun();
        },
        { threshold: 0 },
      );
      io.observe(box);
      const onVis = () => {
        tabVisible = !document.hidden;
        maybeRun();
      };
      document.addEventListener("visibilitychange", onVis);

      return () => {
        stop();
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        box.removeEventListener("pointermove", onMove);
        box.removeEventListener("pointerleave", onLeave);
      };
    }

    return () => {
      stop();
      ro.disconnect();
    };
  }, [reduced, fine]);

  return (
    <Section id="orchestration" className="overflow-hidden">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <Label scramble>{AGENT_FLOW.label}</Label>
            </Reveal>
            <Reveal
              as="h2"
              className="font-display mt-5 max-w-2xl text-4xl font-medium sm:text-5xl"
            >
              {AGENT_FLOW.headline}
            </Reveal>
          </div>
          <Reveal as="p" className="max-w-sm text-muted">
            {AGENT_FLOW.subline}
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <div
            ref={boxRef}
            className="relative h-[clamp(22rem,52vw,34rem)] w-full rounded-3xl border border-border bg-surface/30 [box-shadow:inset_0_1px_0_0_rgba(245,246,247,0.04)]"
          >
            <canvas
              ref={canvasRef}
              aria-hidden
              className="absolute inset-0 h-full w-full"
            />

            {/* Accessible, crisp agent chips positioned by normalized coords. */}
            {NODES.map((n) => (
              <div
                key={n.id}
                data-cursor
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(0.04 + n.x * 0.92) * 100}%`,
                  top: `${(0.04 + n.y * 0.92) * 100}%`,
                }}
              >
                <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface/80 px-3.5 py-2 backdrop-blur-md transition-colors duration-300 hover:border-accent/60">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
                  <span className="text-sm font-medium leading-none text-foreground">
                    {n.label}
                  </span>
                </div>
                {/* role tooltip on hover/focus */}
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {n.role}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Screen-reader description of the pipeline the graph depicts. */}
        <ol className="sr-only">
          {AGENT_FLOW.pipeline.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
