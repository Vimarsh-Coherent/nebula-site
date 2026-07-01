/**
 * Agent-swarm point cloud shaders.
 *
 * The motion is fully deterministic in the vertex shader — each particle's live
 * position is a closed-form function of its seed, time, and the pointer, so there
 * is NO GPGPU ping-pong / FBO state to manage (robust, leak-free). Particles ride
 * a divergence-free curl-noise flow field (so they swirl without bunching up),
 * bend around a cursor gravity well, and converge from a far shell on intro.
 *
 * Simplex noise: Ashima / Stefan Gustavson (public domain).
 */

const SIMPLEX_3D = /* glsl */ `
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
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
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
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

vec3 snoiseVec3(vec3 x){
  float s  = snoise(x);
  float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
  float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
  return vec3(s, s1, s2);
}

vec3 curlNoise(vec3 p){
  const float e = 0.18;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = snoiseVec3(p - dx); vec3 px1 = snoiseVec3(p + dx);
  vec3 py0 = snoiseVec3(p - dy); vec3 py1 = snoiseVec3(p + dy);
  vec3 pz0 = snoiseVec3(p - dz); vec3 pz1 = snoiseVec3(p + dz);
  float x = py1.z - py0.z - pz1.y + pz0.y;
  float y = pz1.x - pz0.x - px1.z + px0.z;
  float z = px1.y - px0.y - py1.x + py0.x;
  return normalize(vec3(x, y, z) / (2.0 * e) + 1e-5);
}
`;

export const swarmVertexShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uSpeed;     // flow time-rate (Notch "energy")
uniform float uAmp;       // flow displacement strength (Notch "energy")
uniform float uIntro;     // 0 -> 1 entrance (converge from far shell)
uniform float uDisperse;  // 0 -> 1 scroll dispersion
uniform vec2  uPointer;   // eased pointer, world-space XY
uniform float uPointerR;  // gravity-well radius
uniform float uSize;      // base point size (px @ dpr 1)
uniform float uPixelRatio;

attribute float aRand;    // per-particle 0..1

varying float vSpeed;     // local flow magnitude (drives colour)
varying float vRand;
varying float vGlow;      // pointer proximity glow (drives brightness)

${SIMPLEX_3D}

void main() {
  vec3 seed = position;
  float t = uTime * uSpeed;

  // --- divergence-free flow advection (one curl octave + a cheap wobble) ---
  vec3 flow = curlNoise(seed * 0.32 + vec3(0.0, 0.0, t * 0.08));
  vec3 p = seed + flow * uAmp * (1.0 + uDisperse * 1.7);
  // secondary fine detail without a second (expensive) curl call
  p += vec3(
    sin(t * 0.9 + seed.y * 1.7),
    cos(t * 0.8 + seed.z * 1.5),
    sin(t * 1.1 + seed.x * 1.3)
  ) * (0.06 * uAmp);

  // --- entrance: converge from a far shell along the seed direction ---
  vec3 shell = normalize(seed + 1e-4) * (length(seed) + 9.0);
  float intro = smoothstep(0.0, 1.0, uIntro);
  p = mix(shell, p, intro);

  // --- cursor gravity well: repel in XY + bulge toward viewer ---
  vec2 toP = p.xy - uPointer;
  float d = length(toP);
  float infl = exp(-(d * d) / max(uPointerR * uPointerR, 1e-3));
  p.xy += normalize(toP + 1e-4) * infl * 1.9;
  p.z += infl * 1.1;
  vGlow = infl;

  vSpeed = length(flow);
  vRand = aRand;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // "hub" agents (top ~6%) render larger + brighter so the field reads as a network
  float hub = step(0.94, aRand);
  float size = uSize * mix(1.0, 3.4, hub) * (0.55 + aRand * 0.9);
  size *= (0.6 + intro * 0.4);                 // small while converging
  gl_PointSize = size * uPixelRatio * (320.0 / max(-mv.z, 0.1));
}
`;

export const swarmFragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying float vSpeed;
varying float vRand;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;

  float soft = smoothstep(0.5, 0.0, r);     // soft round falloff
  float core = smoothstep(0.16, 0.0, r);     // hot center

  vec3 col = mix(uColorA, uColorB, clamp(vSpeed * 1.4 + vRand * 0.4, 0.0, 1.0));
  col += core * 0.15;                        // faint incandescent core
  col = mix(col, vec3(1.0), vGlow * 0.30);   // gentle whiten near the cursor

  // Very low base alpha so even the densest additive overlap stays a coloured
  // glow rather than blooming into a desaturated white haze.
  float a = soft * uOpacity * (0.06 + vRand * 0.18 + vGlow * 0.40);
  gl_FragColor = vec4(col, a);               // additive blend in the material
}
`;
