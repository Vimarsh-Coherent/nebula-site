"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  KernelSize,
  RenderPass,
} from "postprocessing";
import { blobFragmentShader, blobVertexShader } from "./shaders/blob";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { lerp } from "@/lib/utils";

/**
 * The 3D hero centerpiece: a distorted, iridescent "nebula orb" rendered with
 * vanilla Three.js (no R3F — see LightingScene for why) over a transparent
 * canvas, so the site-wide storm shows through behind it.
 *
 * A high-poly icosphere is rippled by fbm noise in the vertex shader and bulges
 * toward the cursor; a glossy fresnel/iridescent material is pushed through a
 * bloom pass for the glow. The whole orb also leans toward the pointer.
 *
 *  - Reduced-motion → one static frame, no loop, no cursor.
 *  - rAF pauses when the hero scrolls off-screen (IntersectionObserver).
 *  - DPR capped + lower geometry detail on mobile.
 */
type BlobUniforms = {
  uColorA: { value: THREE.Color };
  uColorB: { value: THREE.Color };
  uAmp: { value: number };
};

export default function HeroBlob({
  colorA = "#5b8cff",
  colorB = "#9d7bff",
  amp = 0.28,
  spin = 0.05,
}: {
  colorA?: string;
  colorB?: string;
  amp?: number;
  spin?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();

  // Live config read by the render loop / color effects — lets the Notch retune
  // the orb without tearing down and rebuilding the WebGL scene.
  const uniformsRef = useRef<BlobUniforms | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const cfgRef = useRef({ spin });
  // Latest props for the setup effect's initial values (read without re-running it).
  const propsRef = useRef({ colorA, colorB, amp });
  propsRef.current = { colorA, colorB, amp };

  // Live retune from the Notch — update uniforms in place, no scene rebuild.
  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;
    u.uColorA.value.set(colorA);
    u.uColorB.value.set(colorB);
    u.uAmp.value = amp;
    renderRef.current?.(); // repaint immediately (matters under reduced-motion)
  }, [colorA, colorB, amp]);

  useEffect(() => {
    cfgRef.current.spin = spin;
  }, [spin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // WebGL unavailable → transparent canvas, storm still shows.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.85);

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uAmp: { value: propsRef.current.amp },
      uPointerAmp: { value: 0.22 },
      uColorA: { value: new THREE.Color(propsRef.current.colorA) },
      uColorB: { value: new THREE.Color(propsRef.current.colorB) },
    };
    uniformsRef.current = uniforms;

    const geometry = new THREE.IcosahedronGeometry(1.15, mobile ? 24 : 48);
    const material = new THREE.ShaderMaterial({
      vertexShader: blobVertexShader,
      fragmentShader: blobFragmentShader,
      uniforms,
    });
    const orb = new THREE.Mesh(geometry, material);
    // Offset to the right so the left-aligned headline stays clear (centered on
    // mobile, where the headline sits above it and the edge fade carries contrast).
    orb.position.x = mobile ? 0 : 1.35;
    orb.position.y = mobile ? 0 : 0.1;
    scene.add(orb);

    // Bloom for the glossy glow.
    const composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new EffectPass(
        camera,
        new BloomEffect({
          intensity: 1.25,
          luminanceThreshold: 0.18,
          luminanceSmoothing: 0.5,
          mipmapBlur: true,
          kernelSize: KernelSize.LARGE,
        }),
      ),
    );

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
    };
    resize();

    // Eased pointer (target vs rendered), in [-1, 1].
    const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    const renderFrame = () => {
      uniforms.uPointer.value.set(ptr.x, ptr.y);
      // Lean the orb toward the cursor + a slow idle spin (speed set by the Notch).
      orb.rotation.y = ptr.x * 0.5 + uniforms.uTime.value * cfgRef.current.spin;
      orb.rotation.x = -ptr.y * 0.4;
      composer.render();
    };
    renderRef.current = renderFrame;

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uTime.value += dt;
      const k = 1 - Math.pow(0.002, dt);
      ptr.x = lerp(ptr.x, ptr.tx, k);
      ptr.y = lerp(ptr.y, ptr.ty, k);
      renderFrame();
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

    // Only run while the hero is on-screen AND the tab is visible.
    let onScreen = true;
    let tabVisible = !document.hidden;
    const maybeRun = () => (onScreen && tabVisible ? start() : stop());

    if (reduced) {
      renderFrame(); // single static frame
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      maybeRun();
    }
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      maybeRun();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pause when the hero is off-screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        maybeRun();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      renderRef.current = null;
      uniformsRef.current = null;
      composer.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [reduced, mobile]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
