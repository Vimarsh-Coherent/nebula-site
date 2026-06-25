/**
 * GLSL for the site "lighting" background — a full-screen screen-quad effect.
 *
 * Look: a dark thunderstorm. Rolling near-black storm clouds (domain-warped
 * fbm) drift over a near-black base, a soft cool glow trails the cursor, and at
 * semi-random intervals a jagged lightning bolt strikes down toward the cursor —
 * flooding the scene with a brief blue-white flash — with film grain on top.
 *
 * The flash envelope is mirrored in JS (see `stormFlash` in LightingScene) off
 * the same time base so the foreground logo can brighten in sync with each bolt.
 *
 * Uniforms (set from LightingScene):
 *   uTime        seconds since mount
 *   uResolution  drawing-buffer size in px (for aspect-correct UVs)
 *   uMouse       cursor in [-1,1], already CPU-lerped (parallax, never snaps)
 *   uColorA/B    accent colors (blue / violet)
 *   uColorBg     dark base color
 *   uIntensity   master brightness
 *   uSpeed       global time multiplier
 */

// Fullscreen-quad passthrough: a plane built with args [2, 2] already spans the
// clip-space range [-1, 1] on x/y, so we bypass the camera matrices entirely and
// the effect always covers the viewport regardless of the R3F camera.
export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorBg;
  uniform float uIntensity;
  uniform float uSpeed;

  // ---- Ashima 3D simplex noise (public domain) -----------------------------
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float hash11(float p){ return fract(sin(p * 127.1) * 43758.5453); }

  // Fractal brownian motion over the 3D simplex noise (z = slow time drift).
  float fbm(vec2 p, float t){
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(vec3(p, t));
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Aspect-correct, centered coordinates.
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vUv - 0.5;
    p.x *= aspect;

    float t = uTime * uSpeed;

    // Cursor in the same centered space (uMouse already eased on the CPU).
    vec2 cur = vec2(uMouse.x * 0.5 * aspect, uMouse.y * 0.5);

    // ---- rolling storm clouds (domain-warped fbm) ----
    vec2 cp = p * 1.6;
    vec2 warp = vec2(
      fbm(cp * 0.8 + t * 0.03,       t * 0.05),
      fbm(cp * 0.8 + 7.3 - t * 0.02, t * 0.05)
    );
    float clouds = fbm(cp + warp * 1.2, t * 0.04);
    clouds = clouds * 0.5 + 0.5;     // → 0..1
    clouds = pow(clouds, 1.4);       // deepen the darks

    // Dark base, a faint cool tint where cloud is denser, darker toward the floor.
    vec3 col = mix(uColorBg, mix(uColorBg, uColorA, 0.35), clouds);
    col *= 0.7 + 0.5 * vUv.y;

    // ---- soft glow trailing the cursor ----
    float cd = length(p - cur);
    col += mix(uColorA, uColorB, 0.4) * smoothstep(0.55, 0.0, cd) * 0.10;

    // ---- lightning ----
    // Flash envelope: per-interval random chance, sharp decay, a quick flicker.
    float ft   = t * 0.7;
    float idx  = floor(ft);
    float lt   = fract(ft);
    float fl   = step(0.58, hash11(idx))
               * exp(-lt * 8.0)
               * mix(0.5, 1.0, step(0.5, fract(lt * 6.0)));

    // Bolt strikes from the top toward the cursor, with a per-strike offset.
    vec2 tip = cur + vec2((hash11(idx + 1.0) * 2.0 - 1.0) * 0.18,
                          (hash11(idx + 2.0) - 0.5) * 0.15);
    float topY = 0.62;
    float h    = max(topY - tip.y, 0.001);
    float yy   = clamp((topY - p.y) / h, 0.0, 1.0);
    float jag  = snoise(vec3(yy * 5.0 + idx, idx * 3.1, 0.0)) * 0.10
               + snoise(vec3(yy * 13.0 + idx * 2.0, idx * 1.7, 0.0)) * 0.04;
    float pathX = mix(tip.x + (hash11(idx) * 2.0 - 1.0) * 0.22, tip.x, yy)
                + jag * (1.0 - yy * 0.25);
    float d     = abs(p.x - pathX);
    float inRng = step(tip.y, p.y) * step(p.y, topY);
    float bolt  = (smoothstep(0.010, 0.0, d) + smoothstep(0.10, 0.0, d) * 0.5) * inRng;

    col += mix(vec3(0.85, 0.92, 1.0), uColorA, 0.25) * bolt * fl * 3.0;
    // Whole-scene illumination from the flash (clouds light up).
    col += mix(uColorA, vec3(1.0), 0.35) * fl * (0.18 + clouds * 0.25);

    col *= uIntensity;

    // Animated film grain.
    float grain = fract(sin(dot(gl_FragCoord.xy + t * 60.0, vec2(12.9898, 78.233))) * 43758.5453);
    col += (grain - 0.5) * 0.03;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;
