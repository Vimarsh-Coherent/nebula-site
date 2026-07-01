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
import { swarmFragmentShader, swarmVertexShader } from "./shaders/swarm";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { lerp } from "@/lib/utils";

/**
 * The hero centerpiece: a many-thousand-particle "agent swarm" rendered as a
 * single THREE.Points cloud. All motion is closed-form in the vertex shader
 * (curl-noise flow + cursor gravity well + intro/disperse envelopes) so there is
 * no per-frame CPU work over the particles and no GPGPU state — see shaders/swarm.ts.
 *
 *  - Converges from a far shell on first paint (uIntro 0 -> 1).
 *  - Bends around an eased cursor gravity well; the whole cloud leans to the pointer.
 *  - Disperses + fades as the hero scrolls away (uDisperse / uOpacity).
 *  - Bloom pass for the glow. DPR capped, fewer particles on mobile.
 *  - Reduced-motion -> one static frame, no loop, no cursor.
 *  - rAF pauses off-screen (IntersectionObserver) and while the tab is hidden.
 */
type SwarmUniforms = {
  uColorA: { value: THREE.Color };
  uColorB: { value: THREE.Color };
  uAmp: { value: number };
  uSpeed: { value: number };
};

export default function AgentSwarm({
  colorA = "#5b8cff",
  colorB = "#9d7bff",
  amp = 0.6,
  spin = 1,
}: {
  colorA?: string;
  colorB?: string;
  /** Flow displacement strength (Notch "energy"). */
  amp?: number;
  /** Flow time-rate (Notch "energy"). */
  spin?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();

  // Live config read by the loop / retune effect — lets the Notch change the
  // swarm without tearing down the WebGL scene.
  const uniformsRef = useRef<SwarmUniforms | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const propsRef = useRef({ colorA, colorB, amp, spin });
  propsRef.current = { colorA, colorB, amp, spin };

  // Live retune from the Notch — update uniforms in place, no rebuild.
  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;
    u.uColorA.value.set(colorA);
    u.uColorB.value.set(colorB);
    u.uAmp.value = amp;
    u.uSpeed.value = spin;
    renderRef.current?.(); // repaint immediately (matters under reduced-motion)
  }, [colorA, colorB, amp, spin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // WebGL unavailable → transparent canvas, storm still shows.
    }
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    // --- particle seed cloud: uniform-ish fill of a flattened ellipsoid ---
    const COUNT = mobile ? 2600 : 7200;
    const positions = new Float32Array(COUNT * 3);
    const rand = new Float32Array(COUNT);
    const R = 4.2;
    for (let i = 0; i < COUNT; i++) {
      // uniform point in a sphere, then flatten to a wide nebula
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = R * Math.cbrt(Math.random());
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta) * 1.7;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 1.0;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.9;
      rand[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: propsRef.current.spin },
      uAmp: { value: propsRef.current.amp },
      uIntro: { value: reduced ? 1 : 0 },
      uDisperse: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerR: { value: 2.4 },
      uSize: { value: mobile ? 2.4 : 3.0 },
      uPixelRatio: { value: dpr },
      uColorA: { value: new THREE.Color(propsRef.current.colorA) },
      uColorB: { value: new THREE.Color(propsRef.current.colorB) },
      uOpacity: { value: 1 },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      vertexShader: swarmVertexShader,
      fragmentShader: swarmFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    // Weight the swarm into the right of the frame so the left-aligned headline
    // sits on clean dark. Cursor mapping below subtracts the same offset so the
    // gravity well still tracks the pointer over the displaced cloud.
    const CENTER_X = mobile ? 0 : 3.4;
    const CENTER_Y = mobile ? 0 : -0.9;
    points.position.set(CENTER_X, CENTER_Y, 0);
    scene.add(points);

    // Bloom for the glow.
    const composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new EffectPass(
        camera,
        new BloomEffect({
          // Only the hottest cores bloom — keeps the field crisp instead of a
          // blown-out white haze where particles overlap.
          intensity: 0.55,
          luminanceThreshold: 0.5,
          luminanceSmoothing: 0.32,
          mipmapBlur: true,
          kernelSize: KernelSize.MEDIUM,
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

    // Eased pointer in [-1,1]; mapped to world XY in the loop.
    const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    // Scroll dispersion: 0 at top → 1 once the hero has scrolled away.
    let disperseTarget = 0;
    const onScroll = () => {
      const span = Math.max(window.innerHeight * 0.9, 1);
      disperseTarget = Math.min(1, Math.max(0, window.scrollY / span));
    };
    onScroll();

    const renderFrame = () => {
      // Map eased pointer to the swarm's world span (minus the cloud offset so
      // the gravity well lines up with the displaced particles).
      uniforms.uPointer.value.set(ptr.x * 6.2 - CENTER_X, ptr.y * 3.6 - CENTER_Y);
      // Lean the whole cloud toward the cursor + a slow idle yaw.
      points.rotation.y = ptr.x * 0.35 + uniforms.uTime.value * 0.02;
      points.rotation.x = -ptr.y * 0.22;
      composer.render();
    };
    renderRef.current = renderFrame;

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uTime.value += dt;
      // Ease the entrance, pointer, and dispersion.
      uniforms.uIntro.value = Math.min(1, uniforms.uIntro.value + dt * 0.6);
      const k = 1 - Math.pow(0.0025, dt);
      ptr.x = lerp(ptr.x, ptr.tx, k);
      ptr.y = lerp(ptr.y, ptr.ty, k);
      uniforms.uDisperse.value = lerp(uniforms.uDisperse.value, disperseTarget, 0.06);
      uniforms.uOpacity.value = lerp(1, 0.0, Math.min(disperseTarget * 1.15, 1));
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

    let onScreen = true;
    let tabVisible = !document.hidden;
    const maybeRun = () => (onScreen && tabVisible ? start() : stop());

    if (reduced) {
      renderFrame(); // single static frame
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      maybeRun();
    }
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      maybeRun();
    };
    document.addEventListener("visibilitychange", onVisibility);

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
      window.removeEventListener("scroll", onScroll);
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
