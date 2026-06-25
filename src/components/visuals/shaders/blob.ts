/**
 * GLSL for the hero's distorted "nebula orb" — a high-poly icosphere whose
 * surface ripples with fbm noise (vertex displacement) and warps toward the
 * cursor, shaded with a glossy iridescent fresnel material meant to bloom.
 *
 * Uses three.js' injected built-ins (position, normal, modelMatrix,
 * cameraPosition, projectionMatrix, modelViewMatrix) — so it's only valid as a
 * THREE.ShaderMaterial, not a raw-WebGL program.
 *
 * Uniforms (set from HeroBlob):
 *   uTime        seconds since mount
 *   uPointer     cursor in [-1,1], CPU-eased
 *   uAmp         base ripple amplitude
 *   uPointerAmp  extra bulge toward the cursor
 *   uColorA/B    brand accent colors (blue / violet)
 */

const SNOISE = /* glsl */ `
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
`;

export const blobVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uAmp;
  uniform float uPointerAmp;

  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vDisp;

  ${SNOISE}

  float fbm(vec3 p){
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  // Displace a surface point outward along its normal by fbm + a cursor-facing bulge.
  vec3 displace(vec3 pos, vec3 nor, out float disp) {
    float n = fbm(pos * 1.4 + vec3(0.0, 0.0, uTime * 0.28));
    vec3 pdir = normalize(vec3(uPointer, 0.7));
    float bulge = max(dot(nor, pdir), 0.0);
    disp = n * uAmp + bulge * bulge * uPointerAmp;
    return pos + nor * disp;
  }

  void main() {
    float disp;
    vec3 dp = displace(position, normal, disp);

    // Recompute the normal from two displaced neighbours so lighting follows the ripples.
    vec3 t1 = normalize(cross(normal, vec3(0.0, 1.0, 0.001)));
    vec3 t2 = normalize(cross(normal, t1));
    float eps = 0.01;
    float d1; vec3 p1 = displace(position + t1 * eps, normal, d1);
    float d2; vec3 p2 = displace(position + t2 * eps, normal, d2);
    vec3 newNormal = normalize(cross(p1 - dp, p2 - dp));
    if (dot(newNormal, normal) < 0.0) newNormal = -newNormal;

    vDisp = disp;
    vec4 worldPos = modelMatrix * vec4(dp, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * newNormal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(dp, 1.0);
  }
`;

export const blobFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;

  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vDisp;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // On-brand iridescence: oscillate between accent blue and violet (driven by
    // view angle, ripple depth, time) with a cyan shimmer in the highlights.
    float ph = dot(N, V) * 0.5 + vDisp * 0.9 + uTime * 0.04;
    float s = sin(ph * 6.28318) * 0.5 + 0.5;
    vec3 irid = mix(uColorA, uColorB, s);
    irid = mix(irid, vec3(0.45, 0.85, 1.0), 0.16 * s * s);

    vec3 col = irid * (0.20 + fres * 1.45);
    // Bright fresnel rim — the part the bloom pass latches onto.
    col += vec3(0.55, 0.72, 1.0) * fres * 0.85;

    gl_FragColor = vec4(col, 1.0);
  }
`;
