"use client";

import { useEffect, useRef } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Interactive point-mesh — the hero centerpiece (trionn-style "touch the lines").
 *
 * A responsive grid of points connected to their right/down neighbours forms a
 * warping mesh. The pointer repels nearby points (spring physics return them),
 * points brighten toward the accent colour as the cursor approaches, and
 * pressing/holding fires a radial "blast" ripple that shoves points outward.
 *
 * Performance:
 *  - O(n) — only grid-neighbour connections, no all-pairs distance checks.
 *  - devicePixelRatio capped at 2.
 *  - rAF loop pauses when the canvas scrolls off-screen (IntersectionObserver).
 *  - Reduced-motion → a single static mesh is drawn (no loop, no interaction).
 *  - Touch / coarse-pointer devices get the static mesh too.
 *
 * In Phase 2 this can be swapped for a WebGL/R3F particle system; the hero only
 * depends on it filling the background, so the swap stays isolated here.
 */
export default function InteractiveField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };
    let points: P[] = [];
    let cols = 0;
    let rows = 0;
    let w = 0;
    let h = 0;

    // Pointer state (in CSS px).
    const mouse = { x: -9999, y: -9999, down: false };
    // Active blast ripples.
    let blasts: { x: number; y: number; r: number }[] = [];

    const SPACING = () => (window.innerWidth < 768 ? 46 : 64);
    const MOUSE_R = 150; // influence radius
    const SPRING = 0.06;
    const DAMP = 0.86;

    function build() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gap = SPACING();
      cols = Math.ceil(w / gap) + 1;
      rows = Math.ceil(h / gap) + 1;
      points = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const y = r * gap;
          points.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
    }

    function idx(c: number, r: number) {
      return r * cols + c;
    }

    function step(interactive: boolean) {
      // Physics
      if (interactive) {
        for (const p of points) {
          // Spring back to origin
          p.vx += (p.ox - p.x) * SPRING;
          p.vy += (p.oy - p.y) * SPRING;

          // Pointer repulsion
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_R * MOUSE_R) {
            const d = Math.sqrt(d2) || 1;
            const force = (1 - d / MOUSE_R) * (mouse.down ? 9 : 4);
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }

          // Blast ripples
          for (const b of blasts) {
            const bx = p.x - b.x;
            const by = p.y - b.y;
            const bd = Math.sqrt(bx * bx + by * by) || 1;
            const ring = Math.abs(bd - b.r);
            if (ring < 60) {
              const force = (1 - ring / 60) * 6;
              p.vx += (bx / bd) * force;
              p.vy += (by / bd) * force;
            }
          }

          p.vx *= DAMP;
          p.vy *= DAMP;
          p.x += p.vx;
          p.y += p.vy;
        }

        // Advance + expire blasts
        blasts.forEach((b) => (b.r += 14));
        blasts = blasts.filter((b) => b.r < Math.hypot(w, h));
      }

      // Draw
      ctx!.clearRect(0, 0, w, h);

      // Lines to right + down neighbours
      ctx!.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[idx(c, r)];
          const near = interactive ? proximity(p) : 0;
          const alpha = 0.05 + near * 0.5;
          drawLineTo(p, c + 1, r, alpha, near);
          drawLineTo(p, c, r + 1, alpha, near);
        }
      }

      // Points
      for (const p of points) {
        const near = interactive ? proximity(p) : 0;
        if (near < 0.04) continue;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1 + near * 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(91,140,255,${0.2 + near * 0.8})`;
        ctx!.fill();
      }
    }

    function proximity(p: P) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      return d < MOUSE_R ? 1 - d / MOUSE_R : 0;
    }

    function drawLineTo(p: P, c: number, r: number, baseAlpha: number, near: number) {
      if (c >= cols || r >= rows) return;
      const q = points[idx(c, r)];
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
      ctx!.lineTo(q.x, q.y);
      // Blend muted → accent near the cursor.
      ctx!.strokeStyle =
        near > 0.05
          ? `rgba(91,140,255,${baseAlpha})`
          : `rgba(138,143,152,${baseAlpha})`;
      ctx!.stroke();
    }

    // ---- lifecycle ----
    const interactive = !reduced && fine;
    let raf = 0;
    let visible = true;

    const loop = () => {
      step(true);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (!interactive || raf) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    build();
    if (interactive) {
      start();
    } else {
      step(false); // single static frame
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.down = true;
      blasts.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, r: 0 });
    };
    const onUp = () => (mouse.down = false);
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onResize = () => {
      build();
      if (!interactive) step(false);
    };

    if (interactive) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("resize", onResize);

    // Pause rendering when off-screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced, fine]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
