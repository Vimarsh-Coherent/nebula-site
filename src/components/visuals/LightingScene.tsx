"use client";

import { useEffect, useRef } from "react";
import { fragmentShader } from "./shaders/lighting";
import { useFinePointer, useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { lerp } from "@/lib/utils";

/**
 * Site-wide "lighting" background — a WebGL screen-quad running the GLSL in
 * `shaders/lighting.ts`. Soft blue/violet blooms drift on noise-warped paths over
 * a near-black base, and the whole field leans toward the cursor (parallax).
 *
 * Rendered with raw WebGL (the shader is plain GLSL ES 1.00) rather than R3F:
 * one fullscreen triangle, a handful of uniforms, a single rAF loop — no extra
 * runtime and nothing to leak into the rest of the type graph. It's mounted once,
 * fixed behind all content (see SiteBackground), and:
 *  - eases the pointer on the CPU so the light never snaps (`uMouse`),
 *  - dims as you scroll past the hero so deeper sections stay readable,
 *  - falls back to a single static frame under reduced-motion,
 *  - drops the cursor input + caps DPR on touch / mobile.
 */

type ProgressRef = { current: number };

const vertexShader = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

/** "#rrggbb" → sRGB triple in 0..1 (written straight to the framebuffer). */
function srgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Pulled from the design tokens in globals.css.
const COLOR = {
  a: srgb("#5b8cff"), // electric blue
  b: srgb("#9d7bff"), // violet glow
  bg: srgb("#050608"), // near-black canvas
};

const fract = (x: number) => x - Math.floor(x);
const hash11 = (p: number) => fract(Math.sin(p * 127.1) * 43758.5453);

/**
 * Lightning flash envelope — mirrors the GLSL in `shaders/lighting.ts` off the
 * same time base so the foreground logo can brighten in sync with each bolt.
 */
function stormFlash(t: number): number {
  const ft = t * 0.7;
  const idx = Math.floor(ft);
  const lt = ft - idx;
  const occur = hash11(idx) > 0.58 ? 1 : 0;
  const decay = Math.exp(-lt * 8);
  const flick = fract(lt * 6) > 0.5 ? 1 : 0.5;
  return occur * decay * flick;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("LightingScene shader error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function LightingScene({
  progress,
  flash,
}: {
  progress: ProgressRef;
  flash: ProgressRef;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const fine = useFinePointer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return; // WebGL unsupported → graceful no-op (CSS bg remains).

    const interactive = !reduced && fine;
    const speed = reduced ? 0 : mobile ? 0.6 : 1;
    const dprCap = mobile ? 1.5 : 2;

    // ---- program ----
    const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("LightingScene link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // ---- fullscreen triangle ----
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // ---- uniforms ----
    const u = {
      time: gl.getUniformLocation(prog, "uTime"),
      res: gl.getUniformLocation(prog, "uResolution"),
      mouse: gl.getUniformLocation(prog, "uMouse"),
      colorA: gl.getUniformLocation(prog, "uColorA"),
      colorB: gl.getUniformLocation(prog, "uColorB"),
      colorBg: gl.getUniformLocation(prog, "uColorBg"),
      intensity: gl.getUniformLocation(prog, "uIntensity"),
      speed: gl.getUniformLocation(prog, "uSpeed"),
    };
    gl.uniform3fv(u.colorA, COLOR.a);
    gl.uniform3fv(u.colorB, COLOR.b);
    gl.uniform3fv(u.colorBg, COLOR.bg);
    gl.uniform1f(u.speed, speed);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
    };
    resize();

    // Pointer target (raw) + rendered (eased), both in [-1, 1].
    const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      const k = 1 - Math.pow(0.0015, dt);
      ptr.x = lerp(ptr.x, ptr.tx, k);
      ptr.y = lerp(ptr.y, ptr.ty, k);

      gl.uniform1f(u.time, elapsed);
      gl.uniform2f(u.mouse, ptr.x, ptr.y);
      // Dim the field as the hero scrolls away so content stays legible.
      gl.uniform1f(u.intensity, lerp(1.0, 0.45, Math.min(progress.current, 1)));

      // Publish the current flash so the foreground logo can light up with it.
      flash.current = stormFlash(elapsed * speed);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };

    if (interactive) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    // Pause the loop while the tab is hidden (saves battery / GPU).
    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      // Single static frame: calm storm, no cursor, no lightning.
      gl.uniform1f(u.time, 0);
      gl.uniform2f(u.mouse, 0, 0);
      gl.uniform1f(u.intensity, 1.0);
      flash.current = 0;
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (!document.hidden) {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [reduced, mobile, fine, progress, flash]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
