"use client";

import { useEffect, useRef } from "react";
import type { WorkVariant } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * WorkCover — a living, generative canvas "cover" for a case-study card. Each
 * project gets a distinct motif (see `WorkVariant`) themed by an accent pair, so
 * the Work grid reads as a showcase of running systems rather than flat art.
 *
 * One shared harness: seeded so each cover is stable across reloads, eases an
 * `intensity` toward 1 while the card is hovered (faster + brighter), draws a
 * single static frame under reduced-motion, and pauses its rAF when scrolled
 * off-screen. DPR capped at 2.
 *
 * Motifs:
 *  - routes : packets routing between hubs along curved lanes (automation/logistics)
 *  - vitals : a scrolling ECG-style waveform with soft pulses (health/MVP)
 *  - ledger : a live animated bar chart with a scanning highlight (finance ops)
 *  - mesh   : a node lattice rippling under traveling waves (architecture/marketplace)
 */

// hex → [r,g,b]
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Small deterministic PRNG so each cover is stable per-seed.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTE: Record<WorkVariant, { a: string; b: string }> = {
  routes: { a: "#5b8cff", b: "#9d7bff" },
  vitals: { a: "#22d3ee", b: "#5b8cff" },
  ledger: { a: "#9d7bff", b: "#e879f9" },
  mesh: { a: "#5b8cff", b: "#22d3ee" },
};

const SEED: Record<WorkVariant, number> = {
  routes: 1337,
  vitals: 7,
  ledger: 99,
  mesh: 2025,
};

export default function WorkCover({
  variant,
  className,
}: {
  variant: WorkVariant;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [ar, ag, ab] = rgb(PALETTE[variant].a);
    const [br, bg, bb] = rgb(PALETTE[variant].b);
    const A = (al: number) => `rgba(${ar},${ag},${ab},${al})`;
    const B = (al: number) => `rgba(${br},${bg},${bb},${al})`;

    let w = 0;
    let h = 0;

    // Per-variant static geometry, (re)built on resize.
    type Hub = { x: number; y: number; r: number };
    type Lane = { a: Hub; c: { x: number; y: number }; b: Hub };
    let hubs: Hub[] = [];
    let lanes: Lane[] = [];
    let packets: { lane: number; t: number; sp: number }[] = [];
    let bars: { x: number; phase: number; freq: number }[] = [];
    let mesh: { x: number; y: number }[] = [];
    let cols = 0;
    let rows = 0;

    const rebuild = () => {
      const rnd = mulberry32(SEED[variant]);
      if (variant === "routes") {
        hubs = Array.from({ length: 6 }, () => ({
          x: (0.12 + rnd() * 0.76) * w,
          y: (0.16 + rnd() * 0.68) * h,
          r: 2 + rnd() * 2.5,
        }));
        lanes = [];
        for (let i = 0; i < hubs.length; i++) {
          const a = hubs[i];
          const b = hubs[(i + 1 + Math.floor(rnd() * 2)) % hubs.length];
          const mx = (a.x + b.x) / 2 + (rnd() - 0.5) * w * 0.2;
          const my = (a.y + b.y) / 2 + (rnd() - 0.5) * h * 0.2;
          lanes.push({ a, c: { x: mx, y: my }, b });
        }
        packets = Array.from({ length: 10 }, () => ({
          lane: Math.floor(rnd() * lanes.length),
          t: rnd(),
          sp: 0.18 + rnd() * 0.22,
        }));
      } else if (variant === "ledger") {
        const n = 22;
        bars = Array.from({ length: n }, (_, i) => ({
          x: i / n,
          phase: rnd() * Math.PI * 2,
          freq: 0.6 + rnd() * 1.4,
        }));
      } else if (variant === "mesh") {
        const gap = Math.max(28, Math.min(w, h) / 7);
        cols = Math.ceil(w / gap) + 1;
        rows = Math.ceil(h / gap) + 1;
        mesh = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++)
            mesh.push({ x: (c / (cols - 1)) * w, y: (r / (rows - 1)) * h });
      }
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };
    resize();

    // intensity eases toward `target` (1 while hovered) for a "spin-up" feel.
    let intensity = 0.0;
    let target = 0.0;
    const onEnter = () => (target = 1);
    const onLeave = () => (target = 0);

    const bez = (t: number, p0: number, p1: number, p2: number) => {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    };

    const drawBackdrop = () => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, A(0.06));
      g.addColorStop(1, B(0.06));
      ctx.fillStyle = "#0a0c10";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const draw = (t: number) => {
      drawBackdrop();
      const boost = 0.45 + intensity * 1.1;

      if (variant === "routes") {
        // lanes
        ctx.lineWidth = 1;
        for (const ln of lanes) {
          ctx.beginPath();
          ctx.moveTo(ln.a.x, ln.a.y);
          ctx.quadraticCurveTo(ln.c.x, ln.c.y, ln.b.x, ln.b.y);
          ctx.strokeStyle = A(0.1 + intensity * 0.18);
          ctx.stroke();
        }
        // packets
        ctx.globalCompositeOperation = "lighter";
        for (const p of packets) {
          const ln = lanes[p.lane];
          const x = bez(p.t, ln.a.x, ln.c.x, ln.b.x);
          const y = bez(p.t, ln.a.y, ln.c.y, ln.b.y);
          const rad = 7;
          const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
          rg.addColorStop(0, B(0.7 * boost));
          rg.addColorStop(1, B(0));
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
        // hubs
        for (const hub of hubs) {
          ctx.fillStyle = A(0.5 + intensity * 0.4);
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, hub.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      } else if (variant === "vitals") {
        // soft baseline glow band
        ctx.globalCompositeOperation = "lighter";
        const speed = 60 + intensity * 120;
        ctx.lineWidth = 2;
        ctx.strokeStyle = A(0.7);
        ctx.shadowColor = A(0.8);
        ctx.shadowBlur = 12 + intensity * 16;
        ctx.beginPath();
        const mid = h * 0.5;
        for (let px = 0; px <= w; px += 2) {
          const u = (px + t * speed) / 46;
          // mostly flat with periodic QRS-style spikes
          const beat = Math.sin(u * 0.6);
          let y = mid + Math.sin(u) * 2;
          const phase = ((u % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          if (phase > 2.6 && phase < 3.0) y = mid - (h * 0.3) * (0.5 + intensity * 0.5);
          else if (phase >= 3.0 && phase < 3.3) y = mid + (h * 0.18) * (0.5 + intensity * 0.5);
          else y += beat * 3;
          if (px === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "source-over";
      } else if (variant === "ledger") {
        const bw = (w / bars.length) * 0.55;
        ctx.globalCompositeOperation = "lighter";
        bars.forEach((b, i) => {
          const v = 0.5 + 0.5 * Math.sin(t * b.freq + b.phase);
          const bh = (0.18 + v * (0.55 + intensity * 0.25)) * h;
          const x = b.x * w + (w / bars.length - bw) / 2;
          const y = h - bh;
          const g = ctx.createLinearGradient(0, y, 0, h);
          g.addColorStop(0, B(0.5 + intensity * 0.35));
          g.addColorStop(1, A(0.05));
          ctx.fillStyle = g;
          ctx.fillRect(x, y, bw, bh);
          // bright cap
          ctx.fillStyle = B(0.8);
          ctx.fillRect(x, y, bw, 2);
          void i;
        });
        // scanning highlight
        const scan = ((t * (0.12 + intensity * 0.2)) % 1) * w;
        const sg = ctx.createLinearGradient(scan - 40, 0, scan + 40, 0);
        sg.addColorStop(0, A(0));
        sg.addColorStop(0.5, A(0.12 + intensity * 0.12));
        sg.addColorStop(1, A(0));
        ctx.fillStyle = sg;
        ctx.fillRect(scan - 40, 0, 80, h);
        ctx.globalCompositeOperation = "source-over";
      } else if (variant === "mesh") {
        // displace lattice with traveling waves
        const amp = 6 + intensity * 14;
        const disp = (x: number, y: number) => {
          const dx = Math.sin(y * 0.02 + t * 1.1) * amp;
          const dy = Math.cos(x * 0.02 + t * 0.9) * amp;
          return [x + dx, y + dy] as const;
        };
        ctx.strokeStyle = A(0.12 + intensity * 0.16);
        ctx.lineWidth = 1;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            const [x, y] = disp(mesh[i].x, mesh[i].y);
            if (c + 1 < cols) {
              const [nx, ny] = disp(mesh[i + 1].x, mesh[i + 1].y);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(nx, ny);
              ctx.stroke();
            }
            if (r + 1 < rows) {
              const [nx, ny] = disp(mesh[i + cols].x, mesh[i + cols].y);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(nx, ny);
              ctx.stroke();
            }
          }
        }
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < mesh.length; i += 1) {
          const [x, y] = disp(mesh[i].x, mesh[i].y);
          ctx.fillStyle = B(0.25 + intensity * 0.4);
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }
    };

    const advance = (dt: number) => {
      intensity += (target - intensity) * Math.min(1, dt * 6);
      if (variant === "routes") {
        const sp = 1 + intensity * 1.4;
        for (const p of packets) {
          p.t += p.sp * dt * sp;
          if (p.t >= 1) {
            p.t = 0;
            // hop to a lane starting near where it ended
            p.lane = (p.lane + 1) % lanes.length;
          }
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      advance(dt);
      draw(t);
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

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0.6);
    });
    ro.observe(parent);

    if (reduced) {
      draw(0.6); // representative static frame
    } else {
      parent.addEventListener("pointerenter", onEnter);
      parent.addEventListener("pointerleave", onLeave);
      const io = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? start() : stop()),
        { threshold: 0 },
      );
      io.observe(canvas);
      return () => {
        stop();
        io.disconnect();
        ro.disconnect();
        parent.removeEventListener("pointerenter", onEnter);
        parent.removeEventListener("pointerleave", onLeave);
      };
    }

    return () => {
      stop();
      ro.disconnect();
    };
  }, [variant, reduced]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
