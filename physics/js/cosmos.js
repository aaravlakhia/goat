/* The universe behind the page: tens of thousands of glowing particles that
   rebuild themselves into each discovery as you move through the story. A
   uranium core for the title, a spiral of the twelve for the map, then
   parabolas, orbits, field lines, light, radium, curved space, gold foil,
   hydrogen, matter waves, benzene, fission, merging black holes, GPS and a
   galaxy.

   WebGL2. Every formation is worked out on the graphics card from each
   particle's own random numbers, so the page's JavaScript stays free. When
   the scene changes, the card records where every particle is (transform
   feedback) and they fly from there to the new shape, so a change of mind
   halfway through a flight is seamless. Without WebGL2 the page keeps its
   plain dark background and the 2D hero. */
(function () {
  'use strict';

  const PH = window.PH;

  // Each formation's number in the shader, and how the camera looks at it:
  // either a slow full turn (spin, radians per second) or a gentle swing
  // around the angle that shows it best (yaw and swing).
  const SCENES = {
    hero: { id: 1, pitch: 0.3, spin: 0.06 },
    map: { id: 2, pitch: 0.16, spin: 0.05 },
    galileo: { id: 3, pitch: 0.42, spin: 0.07 },
    newton: { id: 4, pitch: 0.55, spin: 0.05 },
    faraday: { id: 5, pitch: 0.28, yaw: 0.35, swing: 0.45 },
    maxwell: { id: 6, pitch: 0.24, yaw: 0.15, swing: 0.35 },
    curie: { id: 7, pitch: 0.2, spin: 0.06 },
    einstein: { id: 8, pitch: 0.55, spin: 0.05 },
    rutherford: { id: 9, pitch: 0.3, yaw: 0, swing: 0.4 },
    bohr: { id: 10, pitch: 0.2, yaw: 0, swing: 0.5 },
    debroglie: { id: 11, pitch: 0.62, yaw: -0.5, swing: 0.35 },
    raman: { id: 12, pitch: 0.2, spin: 0.05 },
    meitner: { id: 13, pitch: 0.25, yaw: 0.1, swing: 0.35 },
    ligo: { id: 14, pitch: 0.62, spin: 0.04 },
    pocket: { id: 15, pitch: 0.28, spin: 0.05 },
    galaxy: { id: 16, pitch: 0.7, spin: 0.03 }
  };

  // Where the formation sits for each part of the page: screen offset x and
  // y (-1 to 1), zoom, brightness while reading, and brightness just after
  // it changes. First entry wide screens, then narrow ones.
  const PLACES = {
    hero: [[0.42, 0.0, 1.08, 1.0, 1.0], [0.0, 0.36, 0.8, 0.85, 1.0]],
    map: [[0.0, 0.0, 1.0, 0.6, 0.85], [0.0, 0.0, 0.95, 0.45, 0.7]],
    page: [[-0.52, -0.06, 0.68, 0.46, 0.85], [0.0, 0.05, 0.9, 0.3, 0.6]],
    cinema: [[0.4, 0.0, 1.12, 1.0, 1.0], [0.0, 0.42, 0.85, 1.0, 1.0]]
  };

  // The Calm look: while the reader is in the text, the formation fades to a
  // faint glow, flaring only briefly as it changes. [reading, just after]
  const CALM = {
    map: [[0.48, 0.72], [0.36, 0.56]],
    page: [[0.12, 0.46], [0.08, 0.34]]
  };

  const SHOCK_GAP = 350; // ms between ripples, so fast clicking can't strobe

  const FOV = (38 * Math.PI) / 180;
  const MORPH = 1.8;   // seconds for particles to reach a new formation
  const BANG = 2.6;    // the opening burst
  const WARP = 1.8;    // the camera's swoop between exhibits

  const VS = `#version 300 es
precision highp float;

layout(location = 0) in vec4 aA;
layout(location = 1) in vec4 aB;
layout(location = 2) in vec3 aSnapPos;
layout(location = 3) in vec4 aSnapCol;

uniform float uScene;
uniform float uMorph;
uniform float uStagger;
uniform float uBang;
uniform float uTime;
uniform float uCount;
uniform mat4 uView;
uniform mat4 uProj;
uniform vec2 uShift;
uniform float uAspect;
uniform float uPx;
uniform float uDist;
uniform float uGain;
uniform vec3 uMouse;
uniform vec4 uShock[3];
uniform vec4 uWave[3];
uniform vec3 uStars[12];
uniform vec3 uStarCol[12];
uniform vec2 uEdges[14];
uniform float uFocus;
uniform float uFocusAmt;

out vec3 vPos;
out vec4 vCol;
out vec3 vRGB;

const float PI = 3.14159265;
const float TAU = 6.28318531;
const float GOLDEN = 2.39996323;
const vec3 GLOW = vec3(0.36, 0.76, 1.0);
const vec3 AMBER = vec3(1.0, 0.71, 0.33);
const vec3 RED = vec3(1.0, 0.38, 0.3);
const vec3 WHITE = vec3(0.96, 0.94, 0.9);
const vec3 PINK = vec3(0.96, 0.42, 0.68);
const vec3 GREEN = vec3(0.3, 1.0, 0.46);
const vec3 TEAL = vec3(0.3, 0.92, 0.72);

float hash1(float n) { return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }

// A direction spread evenly over a sphere, from two random numbers.
vec3 sdir(float u, float v) {
  float y = 2.0 * u - 1.0;
  float r = sqrt(max(0.0, 1.0 - y * y));
  float a = TAU * v;
  return vec3(r * cos(a), y, r * sin(a));
}

// A point spread evenly through a ball of radius 1.
vec3 ball(float u, float v, float w) { return sdir(u, v) * pow(w, 0.33333); }

// Point j of m, spaced evenly over a sphere by the golden angle.
vec3 golden(float j, float m) {
  float y = 1.0 - 2.0 * (j + 0.5) / m;
  float r = sqrt(max(0.0, 1.0 - y * y));
  float a = fract(j * 0.38196601) * TAU;
  return vec3(r * cos(a), y, r * sin(a));
}

mat3 rx(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 ry(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rz(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }

vec3 perp(vec3 d) {
  return normalize(abs(d.y) < 0.9 ? cross(d, vec3(0.0, 1.0, 0.0)) : cross(d, vec3(1.0, 0.0, 0.0)));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0 + i.z * 113.0;
  return mix(mix(mix(hash1(n), hash1(n + 1.0), f.x), mix(hash1(n + 57.0), hash1(n + 58.0), f.x), f.y),
             mix(mix(hash1(n + 113.0), hash1(n + 114.0), f.x), mix(hash1(n + 170.0), hash1(n + 171.0), f.x), f.y), f.z);
}

// ---------- 1. Title: a uranium core; fission fronts sweep through it ----------
void sceneHero(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (f < 0.86) {
    float K = 9.0;
    float M = max(1.0, floor(uCount * 0.86 / K));
    float k = floor(b.x / M);
    float j = b.x - k * M;
    vec3 d = ry(k * 1.7) * rx(k * 0.9) * golden(j, M);
    float R = 0.3 + 1.75 * (k + 1.0) / K;
    p = d * R + (a.xyz - 0.5) * 0.02 + 0.012 * sin(t * 2.2 + a.xyz * 40.0);
    vec3 base = mix(GLOW, WHITE, (1.0 - k / K) * 0.6) * (0.42 + 0.3 * a.w);
    float flash = 0.0;
    float spent = 0.0;
    vec3 push = vec3(0.0);
    for (int w = 0; w < 3; w++) {
      vec4 wv = uWave[w];
      if (wv.w <= 0.0) continue;
      vec3 rel = p - wv.xyz;
      float dist = length(rel);
      float passed = wv.w * 1.15 - dist;
      if (passed <= 0.0) continue;
      float fl = exp(-passed * 4.5);
      flash += fl;
      push += rel / max(dist, 0.001) * fl * 0.16;
      spent = max(spent, smoothstep(0.0, 0.3, passed) * (1.0 - smoothstep(2.5, 5.0, wv.w)));
    }
    flash = min(flash, 1.5);
    p += push;
    c = mix(base, AMBER * 0.2, spent * 0.6) + AMBER * flash * 0.85 + WHITE * flash * flash * 0.25;
    s = 0.85 + 0.45 * a.z + flash * 1.3;
  } else {
    // Neutrons racing just ahead of each front.
    int w = int(min(2.0, floor(a.x * 3.0)));
    vec4 wv = uWave[w];
    vec3 d = sdir(a.y, a.z);
    p = wv.xyz + d * wv.w * 1.15 * (1.03 + 0.3 * a.w);
    float vis = step(0.001, wv.w) * (1.0 - smoothstep(1.9, 2.3, length(p))) * smoothstep(0.0, 0.15, wv.w);
    c = mix(GLOW, WHITE, 0.55) * 1.3 * vis;
    s = 1.4 * vis + 0.01;
  }
}

// ---------- 2. Map: the twelve on a rising spiral of time; ideas flow along the links ----------
void sceneMap(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (f < 0.22) {
    int k = int(min(11.0, floor(a.x * 12.0)));
    float r = 0.025 + 0.3 * pow(a.w, 3.0);
    p = uStars[k] + sdir(a.y, a.z) * r;
    float core = 1.0 - smoothstep(0.0, 0.14, r);
    float tw = 0.85 + 0.15 * sin(t * 2.0 + float(k) * 1.3);
    // The star under the pointer on the chain map flares; the rest dim.
    float hot = uFocusAmt * (1.0 - step(0.5, abs(float(k) - uFocus)));
    float calm = 1.0 - 0.45 * (uFocusAmt - hot);
    c = (uStarCol[k] * (0.3 + 0.9 * core) + WHITE * core * 0.45) * tw * (calm + 1.6 * hot);
    s = 0.9 + 1.4 * core + 1.2 * hot * core;
  } else if (f < 0.82) {
    int e = int(min(13.0, floor(a.x * 14.0)));
    vec2 ed = uEdges[e];
    vec3 A = uStars[int(ed.x)];
    vec3 B = uStars[int(ed.y)];
    vec3 mid = 0.5 * (A + B);
    vec3 C = mid + normalize(vec3(mid.x, 0.0, mid.z) + vec3(0.001)) * 0.75 + vec3(0.0, 0.2, 0.0);
    float u = fract(a.y + t * (0.07 + 0.03 * hash1(float(e))));
    float v = 1.0 - u;
    p = v * v * A + 2.0 * u * v * C + u * u * B + sdir(a.w, b.z) * 0.025;
    float pulse = pow(0.5 + 0.5 * cos(TAU * fract(a.y * 4.0)), 6.0);
    float on = uFocusAmt * max(1.0 - step(0.5, abs(ed.x - uFocus)), 1.0 - step(0.5, abs(ed.y - uFocus)));
    float calm = 1.0 - 0.6 * (uFocusAmt - on);
    c = mix(uStarCol[int(ed.x)], uStarCol[int(ed.y)], u) * (0.3 + 0.9 * pulse) * (calm + 1.4 * on);
    s = 0.75 + 0.9 * pulse + 0.5 * on;
  } else {
    float u = -0.06 + 1.12 * a.x;
    float th = -1.2 + u * 6.6;
    p = vec3(cos(th) * 1.55, -1.65 + 3.3 * u, sin(th) * 1.55) + sdir(a.y, a.z) * 0.22 * sqrt(a.w);
    c = mix(GLOW, WHITE, 0.4) * 0.12;
    s = 0.7;
  }
}

// ---------- 3. Galileo: a fountain of parabolas, everything falling with the same g ----------
void sceneGalileo(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  float g = 2.4;
  float base = -0.85;
  if (f < 0.92) {
    float arc = floor(a.x * 54.0);
    float ring = floor(arc / 18.0);
    float az = (mod(arc, 18.0) + 0.5 * ring) / 18.0 * TAU;
    float el = radians(60.0 + 10.0 * ring);
    float v = 2.55 * (0.95 + 0.1 * hash1(arc));
    float T = 2.0 * v * sin(el) / g;
    float mover = step(0.62, f);
    float tau = mover > 0.5 ? fract(a.y + t * 0.5 / T) * T : a.y * T;
    float d = v * cos(el) * tau;
    float y = v * sin(el) * tau - 0.5 * g * tau * tau;
    p = vec3(cos(az) * d, base + y, sin(az) * d) + sdir(a.z, a.w) * 0.01;
    float hgt = y / (v * v / (2.0 * g));
    c = mover > 0.5 ? mix(GLOW, mix(AMBER, WHITE, 0.4), hgt) * 0.95 : GLOW * 0.14;
    s = mover > 0.5 ? 1.5 : 0.75;
  } else {
    float ring = floor(a.x * 3.0);
    float el = radians(60.0 + 10.0 * ring);
    float R = 2.55 * 2.55 * sin(2.0 * el) / g;
    float an = TAU * a.y;
    p = vec3(cos(an) * R, base, sin(an) * R);
    c = WHITE * 0.16;
    s = 0.8;
  }
}

// ---------- 4. Newton: planets on Kepler ellipses, a comet with its tail away from the Sun ----------
const float PA[6] = float[6](0.55, 0.85, 1.2, 1.62, 2.1, 1.5);
const float PE[6] = float[6](0.2, 0.06, 0.1, 0.08, 0.12, 0.8);
const float PW[6] = float[6](0.3, 1.9, 3.6, 0.8, 2.6, 4.3);
const float PI6[6] = float[6](0.05, -0.04, 0.03, -0.05, 0.04, 0.45);
const float PP[6] = float[6](0.0, 2.1, 4.0, 1.2, 5.2, 0.6);
const vec3 PC[6] = vec3[6](AMBER, GLOW, TEAL, PINK, WHITE, vec3(0.7, 0.9, 1.0));

vec3 kepler(int o, float M) {
  float e = PE[o];
  M = mod(M + PI, TAU) - PI;
  float E = M + 0.85 * e * sign(sin(M));
  for (int i = 0; i < 4; i++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  float A = PA[o];
  vec3 q = vec3(A * (cos(E) - e), 0.0, A * sqrt(1.0 - e * e) * sin(E));
  return rx(PI6[o]) * ry(PW[o]) * q;
}

void sceneNewton(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (f < 0.09) {
    p = sdir(a.x, a.y) * pow(a.z, 1.8) * 0.3;
    float core = 1.0 - pow(a.z, 0.6);
    c = mix(AMBER, WHITE, core * 0.7) * (0.35 + 0.8 * core);
    s = 1.1 + core;
  } else if (f < 0.6) {
    int o = int(min(5.0, floor(a.x * 6.0)));
    float n = 0.9 / pow(PA[o], 1.5);
    p = kepler(o, TAU * a.y + n * t) + sdir(a.z, a.w) * 0.008;
    c = PC[o] * 0.26;
    s = 0.8;
  } else if (f < 0.95) {
    int o = int(min(5.0, floor(a.x * 6.0)));
    float n = 0.9 / pow(PA[o], 1.5);
    float M0 = n * t + PP[o];
    float fade = 1.0 - a.y;
    if (o == 5) {
      vec3 hd = kepler(o, M0);
      float tail = a.y * (0.25 + 0.6 / (0.3 + length(hd)));
      p = hd + normalize(hd + vec3(0.0001)) * tail + sdir(a.z, a.w) * 0.03 * a.y;
    } else {
      p = kepler(o, M0 - a.y * a.y * 0.5) + sdir(a.z, a.w) * (0.05 + 0.01 * float(o)) * sqrt(a.w) * fade;
    }
    c = PC[o] * fade * fade * 0.95;
    s = 0.6 + 1.1 * fade;
  } else {
    p = sdir(a.x, a.y) * (3.2 + a.z);
    c = WHITE * 0.1 * (0.4 + a.w);
    s = 0.7;
  }
}

// ---------- 5. Faraday: a magnet through a coil; field lines, and current when it moves ----------
const float FL[5] = float[5](0.55, 0.85, 1.25, 1.75, 2.4);

void sceneFaraday(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  float xm = sin(t * 0.75);
  float vm = cos(t * 0.75);
  float I = abs(vm);
  if (f < 0.62) {
    float L = FL[int(min(4.0, floor(a.x * 5.0)))];
    float phi = (floor(a.z * 10.0) + 0.5) / 10.0 * TAU;
    float th0 = asin(sqrt(min(0.95, 0.3 / L)));
    float u = fract(a.y + t * 0.14 / L);
    float th = th0 + u * (PI - 2.0 * th0);
    float r = L * sin(th) * sin(th);
    p = vec3(r * cos(th) + xm, r * sin(th) * cos(phi), r * sin(th) * sin(phi));
    float dash = pow(0.5 + 0.5 * cos(TAU * fract(a.y * 6.0)), 10.0);
    float fade = 1.0 - smoothstep(2.2, 2.8, length(p));
    c = mix(GLOW, WHITE, 0.2 * dash) * (0.26 + 0.9 * dash) * fade;
    s = 0.75 + 0.8 * dash;
  } else if (f < 0.76) {
    vec3 q = vec3(a.x * 1.1 - 0.55, (a.y - 0.5) * 0.26, (a.z - 0.5) * 0.26);
    p = q + vec3(xm, 0.0, 0.0);
    c = (q.x > 0.0 ? RED : vec3(0.35, 0.55, 1.0)) * 0.4;
    s = 0.9;
  } else if (f < 0.95) {
    float u = a.x;
    float an = u * 10.0 * TAU;
    p = vec3(-0.45 + 0.9 * u, cos(an) * 0.47, sin(an) * 0.47) + sdir(a.y, a.z) * 0.018;
    float flow = 0.5 + 0.5 * sin(u * 140.0 - t * 12.0 * sign(vm));
    c = mix(vec3(0.5, 0.28, 0.12) * 0.35, mix(AMBER, WHITE, 0.3 * flow) * (0.5 + 0.9 * flow), I);
    s = 0.9 + 0.8 * I * flow;
  } else if (f < 0.975) {
    float side = step(0.5, a.x) * 2.0 - 1.0;
    p = mix(vec3(side * 0.45, -0.47, 0.0), vec3(side * 0.1, -1.12, 0.0), a.y) + sdir(a.z, a.w) * 0.008;
    c = vec3(0.5, 0.28, 0.12) * 0.3 + AMBER * 0.3 * I * I;
    s = 0.7;
  } else {
    float lit = I * I;
    p = vec3(0.0, -1.3, 0.0) + ball(a.x, a.y, a.z) * 0.17;
    c = mix(vec3(0.3, 0.25, 0.2) * 0.2, mix(AMBER, WHITE, 0.5) * 1.3, lit);
    s = 1.0 + lit * 1.5;
  }
}

// ---------- 6. Maxwell: one light wave, shortening from radio to violet ----------
void sceneMaxwell(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  float A = 0.7;
  float w = 2.3;
  if (f < 0.56) {
    float isB = step(0.3, f);
    float x = -2.8 + 5.6 * a.x;
    float v = A * sin(19.2 * exp(0.25 * x) - w * t);
    p = (isB > 0.5 ? vec3(x, 0.0, v) : vec3(x, v, 0.0)) + sdir(a.y, a.z) * 0.012;
    c = isB > 0.5 ? mix(AMBER, WHITE, 0.25) * 0.75 : mix(hue(0.78 * a.x), WHITE, 0.25) * 0.85;
    s = 1.0;
  } else if (f < 0.86) {
    float n = floor(a.x * 56.0);
    float x = -2.8 + (n + 0.5) * 0.1;
    float v = A * sin(19.2 * exp(0.25 * x) - w * t) * a.y;
    float isB = step(0.5, a.z);
    p = isB > 0.5 ? vec3(x, 0.0, v) : vec3(x, v, 0.0);
    c = (isB > 0.5 ? AMBER : hue(0.78 * (x + 2.8) / 5.6)) * (0.14 + 0.3 * a.y);
    s = 0.7;
  } else {
    float x = -2.8 + 5.6 * a.x;
    p = vec3(x, -1.2 + (a.y - 0.5) * 0.1, (a.z - 0.5) * 0.5);
    c = hue(0.78 * a.x) * 0.55;
    s = 0.9;
  }
  p = ry(-0.5) * p;
}

// ---------- 7. Curie: a radioactive nucleus firing alpha, beta and gamma rays ----------
void sceneCurie(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (f < 0.3) {
    float m = floor(a.x * 64.0);
    vec3 ctr = golden(m, 64.0) * 0.44 * pow(hash1(m + 3.0), 0.33);
    ctr += 0.018 * sin(t * 11.0 + m * vec3(1.7, 2.3, 3.1));
    p = ctr + ball(a.y, a.z, a.w) * 0.12;
    c = mix(vec3(0.7, 0.82, 1.0), RED, step(0.5, hash1(m + 7.0))) * 0.42;
    s = 1.0;
  } else if (f < 0.9) {
    float e = floor(a.x * 72.0);
    float kind = mod(e, 3.0);
    float speed = kind < 0.5 ? 0.2 : (kind < 1.5 ? 0.34 : 0.5);
    float cyc = t * speed + hash1(e);
    float ci = floor(cyc);
    float ph = fract(cyc);
    vec3 dir = sdir(hash1(e * 3.1 + ci * 1.37), hash1(e * 7.3 + ci * 2.11));
    float r = 0.5 + ph * 3.0 - a.y * (kind < 0.5 ? 0.22 : 0.45);
    vec3 s1 = perp(dir);
    vec3 s2 = cross(dir, s1);
    p = dir * r;
    if (kind < 0.5) p += sdir(a.z, a.w) * 0.05;
    else if (kind < 1.5) p += (s1 * cos(r * 16.0) + s2 * sin(r * 16.0)) * 0.06;
    else p += s1 * sin(r * 34.0) * 0.035;
    float fade = smoothstep(0.45, 0.65, r) * (1.0 - smoothstep(2.2, 3.4, r));
    vec3 col = kind < 0.5 ? AMBER : (kind < 1.5 ? GLOW : GREEN);
    c = col * fade * (0.35 + 0.6 * (1.0 - a.y));
    s = (kind < 0.5 ? 1.5 : 1.0) * fade + 0.01;
  } else {
    p = sdir(a.x, a.y) * (0.56 + 0.06 * a.z);
    c = mix(GLOW, GREEN, 0.4) * 0.1 * (0.7 + 0.3 * sin(t * 3.0 + a.w * 6.28));
    s = 0.9;
  }
}

// ---------- 8. Einstein: mass curves space; a planet circles the dip, starlight bends ----------
float well(vec2 q) { return 0.4 - 1.25 / sqrt(1.0 + dot(q, q) / 0.3); }

void sceneEinstein(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (f < 0.74) {
    float fam = step(0.5, a.x);
    float m = floor(fract(a.x * 2.0) * 25.0);
    float across = -3.0 + m * 0.25;
    float along = -3.0 + 6.0 * a.y;
    vec2 q = fam > 0.5 ? vec2(across, along) : vec2(along, across);
    float r = length(q);
    float h = well(q) + 0.025 * sin(r * 5.0 - t * 1.6) * exp(-r * 0.4);
    p = vec3(q.x, h, q.y);
    float depth = clamp((0.45 - h) / 1.3, 0.0, 1.0);
    float edge = 1.0 - smoothstep(2.3, 3.0, max(abs(q.x), abs(q.y)));
    c = mix(GLOW * 0.26, mix(GLOW, WHITE, 0.5) * 0.9, depth * depth) * edge;
    s = 0.75 + depth;
  } else if (f < 0.81) {
    vec3 o = ball(a.x, a.y, a.z);
    p = vec3(0.0, -0.55, 0.0) + o * 0.3;
    float core = 1.0 - length(o);
    c = mix(AMBER, WHITE, core) * (0.4 + 0.6 * core);
    s = 1.1 + core;
  } else if (f < 0.87) {
    float ang = t * 0.9 - a.y * 1.1;
    vec2 q = vec2(cos(ang), sin(ang)) * 1.3;
    float fade = 1.0 - a.y;
    p = vec3(q.x, well(q) + 0.1, q.y) + sdir(a.z, a.w) * 0.07 * fade;
    c = mix(GLOW, WHITE, 0.35) * fade * fade;
    s = 0.4 + 1.2 * fade;
  } else {
    float side = step(0.5, a.x) * 2.0 - 1.0;
    float x = -3.0 + 6.0 * a.y;
    float z = side * (1.05 - 0.125 * (x + sqrt(x * x + 0.5)));
    p = vec3(x, 0.55, z) + sdir(a.z, a.w) * 0.012;
    float pulse = pow(0.5 + 0.5 * cos(TAU * (a.y * 5.0 - t * 0.35)), 10.0);
    c = mix(WHITE, AMBER, 0.3) * (0.12 + 0.8 * pulse);
    s = 0.8 + pulse;
  }
}

// ---------- 9. Rutherford: alpha particles at a gold nucleus; a few bounce back ----------
void sceneRutherford(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (f < 0.6) {
    // 150 alpha tracks, each following its Coulomb hyperbola: impact
    // parameter bb, and half the distance of closest approach head-on, A.
    float id = floor(a.x * 150.0);
    float h = hash1(id * 1.3 + 0.7);
    float bb = 0.02 + 1.3 * h;
    float psi = TAU * hash1(id * 2.9 + 0.1);
    float A = 0.12;
    float cc = sqrt(A * A + bb * bb);
    float Q = 3.0 / cc;
    float q = -Q + 2.0 * Q * fract(a.z + t * 0.2);
    vec2 P = vec2(A * sqrt(1.0 + q * q) + cc, bb * q);
    float xp = (-A * P.x + bb * P.y) / cc;
    float yp = (-bb * P.x - A * P.y) / cc;
    p = vec3(xp, yp * cos(psi), yp * sin(psi)) + sdir(a.y, a.w) * 0.006;
    float rr = length(p);
    float fade = 1.0 - smoothstep(2.3, 3.0, rr);
    float near = exp(-rr * 3.0);
    float bent = smoothstep(0.5, 0.85, 2.0 * atan(A / bb) / PI) * smoothstep(-0.6, 0.6, q * cc);
    c = mix(mix(GLOW, WHITE, near), AMBER, bent) * (0.42 + 1.0 * near + 0.6 * bent) * fade;
    s = (0.9 + 1.2 * near + 0.6 * bent) * fade + 0.01;
  } else if (f < 0.93) {
    float m = floor(a.x * 441.0);
    float row = floor(m / 21.0);
    float col = m - row * 21.0;
    vec2 cell = vec2(col - 10.0 + 0.5 * mod(row, 2.0), row - 10.0) * 0.2;
    float keep = (1.0 - step(2.05, length(cell))) * step(0.05, length(cell));
    p = vec3(0.0, cell) + ball(a.y, a.z, a.w) * 0.03;
    c = AMBER * 0.32 * keep;
    s = 0.85 * keep + 0.01;
  } else if (f < 0.945) {
    p = ball(a.x, a.y, a.z) * 0.05;
    c = mix(AMBER, WHITE, 0.5) * 0.7;
    s = 1.2;
  } else {
    p = sdir(a.x, a.y) * (0.3 + 0.25 * a.z);
    c = GLOW * 0.06;
    s = 0.8;
  }
  p = ry(0.7) * p;
}

// ---------- 10. Bohr: electrons on fixed orbits, photons in hydrogen's colors ----------
void sceneBohr(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  mat3 tilt = rx(1.1) * rz(0.2);
  if (f < 0.05) {
    p = ball(a.x, a.y, a.z) * 0.09;
    c = mix(RED, WHITE, 0.4);
    s = 1.3;
  } else if (f < 0.6) {
    float n = 1.0 + floor(sqrt(a.x) * 5.0);
    float R = 0.1 * n * n + 0.05;
    float th = TAU * a.y + t * 1.2 / (n * n * n);
    p = tilt * vec3(cos(th) * R, (a.z - 0.5) * 0.02, sin(th) * R);
    c = GLOW * 0.26;
    s = 0.8;
  } else if (f < 0.75) {
    float n = 1.0 + floor(a.x * 5.0);
    float R = 0.1 * n * n + 0.05;
    float th = t * 2.6 / (n * sqrt(n)) + n * 1.7 - a.y * a.y * 0.9 / sqrt(n);
    float fade = 1.0 - a.y;
    p = tilt * (vec3(cos(th) * R, 0.0, sin(th) * R) + sdir(a.z, a.w) * 0.03 * fade);
    c = mix(GLOW, WHITE, 0.6) * fade * fade * 1.1;
    s = 0.4 + 1.3 * fade;
  } else {
    // Balmer photons: 656, 486, 434 and 410 nm, each wiggling at its own length.
    float e = floor(a.x * 36.0);
    float kind = mod(e, 4.0);
    vec3 col = kind < 0.5 ? vec3(1.0, 0.13, 0.08) : (kind < 1.5 ? vec3(0.1, 0.85, 1.0) : (kind < 2.5 ? vec3(0.32, 0.36, 1.0) : vec3(0.62, 0.25, 1.0)));
    float wl = kind < 0.5 ? 656.0 : (kind < 1.5 ? 486.0 : (kind < 2.5 ? 434.0 : 410.0));
    float cyc = t * 0.3 + hash1(e);
    float ci = floor(cyc);
    float ph = fract(cyc);
    float oa = TAU * hash1(e * 1.9 + ci);
    vec3 origin = tilt * vec3(cos(oa) * 0.45, 0.0, sin(oa) * 0.45);
    vec3 dir = sdir(hash1(e * 2.3 + ci * 1.7), hash1(e * 5.1 + ci * 0.7));
    float r = ph * 3.0 - a.y * 0.35;
    p = origin + dir * max(r, 0.0) + perp(dir) * sin(r * 9000.0 / wl) * 0.045;
    float fade = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.55, 1.0, ph)) * step(0.0, r);
    c = col * fade * 0.9;
    s = 1.1 * fade + 0.01;
  }
}

// ---------- 11. de Broglie: waves from two slits interfere; stripes on a screen ----------
void sceneDeBroglie(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  vec2 s1 = vec2(-2.6, 0.9);
  vec2 s2 = vec2(-2.6, -0.9);
  float k = 15.7;
  float w = 3.4;
  if (f < 0.8) {
    float G = floor(sqrt(uCount * 0.8));
    float row = floor(b.x / G);
    float col = b.x - row * G;
    float keep = 1.0 - step(G, row);
    vec2 q = vec2(-2.6 + 5.4 * col / (G - 1.0), -2.7 + 5.4 * row / (G - 1.0));
    float r1 = length(q - s1);
    float r2 = length(q - s2);
    float A1 = 1.0 / sqrt(r1 + 0.25);
    float A2 = 1.0 / sqrt(r2 + 0.25);
    float h = 0.14 * (A1 * sin(k * r1 - w * t) + A2 * sin(k * r2 - w * t));
    float amp2 = min(2.0, A1 * A1 + A2 * A2 + 2.0 * A1 * A2 * cos(k * (r1 - r2)));
    p = vec3(q.x, h - 0.2, q.y);
    float crest = smoothstep(-0.05, 0.25, h);
    c = mix(PINK * 0.16, mix(PINK, WHITE, 0.55), crest) * (0.3 + 0.6 * amp2) * keep;
    s = (0.8 + crest * 0.6) * keep + 0.01;
  } else if (f < 0.9) {
    float z = -2.7 + 5.4 * a.x;
    float wall = step(0.1, min(abs(z - 0.9), abs(z + 0.9)));
    p = vec3(-2.75, -0.6 + 0.9 * a.y, z);
    c = WHITE * 0.28 * wall;
    s = 0.8 * wall + 0.01;
  } else {
    float z = -2.7 + 5.4 * a.x;
    vec2 q = vec2(2.8, z);
    float I = 0.5 + 0.5 * cos(k * (length(q - s1) - length(q - s2)));
    float env = exp(-z * z * 0.1);
    p = vec3(2.85, -0.6 + a.y * (0.1 + 1.1 * I * env), z);
    c = mix(PINK, WHITE, 0.4) * (0.15 + 0.8 * I * env);
    s = 0.9;
  }
  p *= 0.8;
}

// ---------- 12. Raman: benzene breathing (its strongest Raman line) in a green laser ----------
void sceneRaman(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  float br = 1.0 + 0.07 * sin(t * 3.0);
  mat3 tilt = rx(0.95) * ry(t * 0.15);
  float RC = 1.0 * br;
  float RH = 1.75 * br;
  if (f < 0.22) {
    float an = floor(a.x * 6.0) * PI / 3.0 + PI / 6.0;
    p = tilt * (vec3(cos(an) * RC, 0.0, sin(an) * RC) + ball(a.y, a.z, a.w) * 0.2);
    c = WHITE * 0.4;
    s = 1.0;
  } else if (f < 0.32) {
    float an = floor(a.x * 6.0) * PI / 3.0 + PI / 6.0;
    p = tilt * (vec3(cos(an) * RH, 0.0, sin(an) * RH) + ball(a.y, a.z, a.w) * 0.12);
    c = vec3(0.6, 0.82, 1.0) * 0.42;
    s = 0.9;
  } else if (f < 0.54) {
    float k = floor(a.x * 12.0);
    float an = mod(k, 6.0) * PI / 3.0 + PI / 6.0;
    float an2 = an + PI / 3.0;
    vec3 A = vec3(cos(an) * RC, 0.0, sin(an) * RC);
    vec3 B = k < 6.0 ? vec3(cos(an2) * RC, 0.0, sin(an2) * RC) : vec3(cos(an) * RH, 0.0, sin(an) * RH);
    p = tilt * (mix(A, B, a.y) + sdir(a.z, a.w) * 0.03);
    c = WHITE * 0.22;
    s = 0.8;
  } else if (f < 0.68) {
    float side = step(0.5, a.x) * 2.0 - 1.0;
    float an = TAU * a.y;
    p = tilt * (vec3(cos(an) * RC, side * 0.3, sin(an) * RC) + sdir(a.z, a.w) * 0.1 * sqrt(b.z));
    c = PINK * 0.45 * (0.7 + 0.3 * sin(an * 3.0 + t * 2.0));
    s = 0.9;
  } else if (f < 0.8) {
    p = vec3(-3.2 + 6.4 * fract(a.x + t * 0.5), 0.0, 0.0) + sdir(a.y, a.z) * 0.03;
    c = GREEN * 0.22;
    s = 0.9;
  } else {
    // Scattered light: nearly all still green; about one in ten here (far
    // fewer in reality) comes out yellow or red, shifted by the vibrations.
    float cyc = t * 0.45 + a.x;
    float ci = floor(cyc);
    float ph = fract(cyc);
    vec3 dir = sdir(hash1(a.y * 97.0 + ci), hash1(a.z * 57.0 + ci));
    p = dir * (0.3 + ph * 2.6);
    float shift = hash1(a.w * 31.0 + ci);
    float raman = step(0.9, shift);
    vec3 col = raman > 0.5 ? (shift > 0.96 ? vec3(1.0, 0.35, 0.1) : vec3(1.0, 0.85, 0.15)) : GREEN;
    float fade = (1.0 - ph) * smoothstep(0.0, 0.08, ph);
    c = col * fade * (raman > 0.5 ? 1.2 : 0.4);
    s = (raman > 0.5 ? 2.0 : 1.0) * fade + 0.01;
  }
}

// ---------- 13. Meitner: a nucleus takes a neutron, stretches like a drop, splits ----------
void sceneMeitner(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  float ph = fract(t / 7.0);
  float cyc = floor(t / 7.0);
  float s1 = smoothstep(0.16, 0.4, ph);
  float s2 = smoothstep(0.41, 0.8, ph);
  float z = (ph - 0.415) / 0.03;
  float flash = exp(-z * z);
  if (f < 0.8) {
    vec3 l = ball(a.x, a.y, a.z) * 0.95;
    float side = l.x >= 0.0 ? 1.0 : -1.0;
    vec3 dirF = normalize(l - vec3(side * 0.35, 0.0, 0.0) + vec3(0.0001));
    float fly = 1.0 - (1.0 - s2) * (1.0 - s2);
    float sep = 0.6 * s1 + 2.6 * fly;
    vec3 frag = vec3(side * sep, 0.0, 0.0) + dirF * (length(l) / 0.95) * 0.75;
    vec3 wob = l * (1.0 + 0.05 * sin(t * 7.0 + l.x * 4.0 + l.y * 3.0));
    p = ph < 0.9 ? mix(wob, frag, s1) : l;
    vec3 col = mix(vec3(0.7, 0.82, 1.0), vec3(1.0, 0.42, 0.3), step(a.w, 0.43));
    float vis = ph < 0.9 ? 1.0 - smoothstep(0.8, 0.87, ph) : smoothstep(0.9, 1.0, ph);
    c = (col * 0.5 + AMBER * flash * 1.5 + AMBER * 0.3 * fly * (1.0 - fly)) * vis;
    s = (1.0 + flash * 1.5) * vis + 0.01;
  } else if (f < 0.85) {
    p = vec3(mix(-3.2, -0.95, clamp(ph / 0.16, 0.0, 1.0)), 0.0, 0.0) + ball(a.x, a.y, a.z) * 0.07;
    float vis = 1.0 - step(0.17, ph);
    c = mix(GLOW, WHITE, 0.4) * 1.2 * vis;
    s = 1.3 * vis + 0.01;
  } else if (f < 0.92) {
    float n = floor(a.x * 3.0);
    vec3 dir = sdir(hash1(n * 1.3 + cyc * 3.7), hash1(n * 2.1 + cyc * 1.9));
    p = dir * (0.3 + max(0.0, ph - 0.41) * 6.0) + ball(a.y, a.z, a.w) * 0.06;
    float vis = step(0.41, ph) * (1.0 - smoothstep(0.75, 0.85, ph));
    c = mix(GLOW, WHITE, 0.4) * 1.2 * vis;
    s = 1.3 * vis + 0.01;
  } else {
    p = sdir(a.x, a.y) * max(0.0, ph - 0.41) * (5.0 + 4.0 * a.z);
    float vis = step(0.41, ph) * (1.0 - smoothstep(0.5, 0.7, ph));
    c = mix(GREEN, WHITE, 0.5) * vis * 0.6;
    s = vis + 0.01;
  }
}

// ---------- 14. LIGO: black holes spiral in; space ripples in a two-armed spiral ----------
float ligoW(float tt) { return 1.9 * pow(max(1.0 - min(tt, 7.0) / 7.0, 0.004), -0.375); }

float ligoPhase(float tt) {
  float t2 = min(tt, 6.972);
  float ph = 1.9 * 7.0 * 1.6 * (1.0 - pow(1.0 - t2 / 7.0, 0.625));
  if (tt > t2) ph += ligoW(t2) * (tt - t2);
  return ph;
}

float ligoSep(float tt) { return 0.62 * pow(max(1.0 - tt / 7.0, 0.0), 0.25) + 0.06; }

void sceneLigo(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  float cyc = mod(t, 10.5);
  if (f < 0.76) {
    float R = 0.3 + floor(a.x * 40.0) * 0.07;
    float ang = TAU * a.y;
    float tr = cyc - R / 1.25;
    float amp = 0.0;
    float ph = 0.0;
    if (tr > 0.0) {
      amp = pow(ligoW(min(tr, 6.97)) / 1.9, 0.6667);
      if (tr > 7.0) amp *= exp(-(tr - 7.0) / 0.35);
      ph = ligoPhase(tr);
    }
    float h = 0.12 * amp * cos(2.0 * ang - 2.0 * ph) / (0.6 + R);
    p = vec3(cos(ang) * R, h - 0.2, sin(ang) * R);
    float lift = clamp(abs(h) * 10.0, 0.0, 1.0);
    c = mix(GLOW * 0.13, mix(GLOW, WHITE, 0.4) * 0.8, lift) * (1.0 - smoothstep(2.4, 3.1, R));
    s = 0.75 + lift;
  } else if (f < 0.9) {
    float which = step(0.5, a.x);
    vec3 ctr = vec3(0.0);
    float rr = 0.15;
    if (cyc < 7.0) {
      float sep = ligoSep(cyc);
      float ph = ligoPhase(cyc);
      vec3 dir = vec3(cos(ph), 0.0, sin(ph));
      ctr = which > 0.5 ? -dir * sep * 0.45 : dir * sep * 0.55;
      rr = which > 0.5 ? 0.11 : 0.095;
    } else {
      float k = cyc - 7.0;
      rr = 0.15 * (1.0 + 0.1 * exp(-k / 0.3) * sin(k * 40.0));
    }
    float an = TAU * a.y;
    vec3 ring = a.z < 0.6 ? vec3(cos(an), 0.0, sin(an)) * rr * (1.0 + 0.8 * a.w) : sdir(a.y, a.w) * rr;
    p = ctr + ring + vec3(0.0, -0.2, 0.0);
    float disk = a.z < 0.6 ? 1.0 - a.w : 0.6;
    c = mix(AMBER, WHITE, 0.5) * (0.35 + 0.8 * disk);
    s = 0.9 + 0.5 * disk;
  } else if (cyc > 7.0) {
    float k = cyc - 7.0;
    p = sdir(a.x, a.y) * k * 3.2 + vec3(0.0, -0.2, 0.0);
    float v = exp(-k * 2.5);
    c = mix(AMBER, WHITE, 0.6) * v;
    s = 1.2 * v + 0.01;
  } else {
    float tt = max(0.0, cyc - a.x * 1.2);
    float sep = ligoSep(tt);
    float ph = ligoPhase(tt);
    vec3 dir = vec3(cos(ph), 0.0, sin(ph));
    p = (a.y > 0.5 ? -dir * sep * 0.45 : dir * sep * 0.55) + vec3(0.0, -0.2, 0.0);
    c = AMBER * 0.35 * (1.0 - a.x);
    s = 0.7;
  }
}

// ---------- 15. Your phone: GPS satellites circling Earth, signals converging on one phone ----------
vec3 gpsSat(float sat, float t) {
  float pl = mod(sat, 6.0);
  float an = floor(sat / 6.0) * TAU / 4.0 + pl * 0.52 + t * 0.3;
  return ry(pl * PI / 3.0) * rx(0.96) * (vec3(cos(an), 0.0, sin(an)) * 2.05);
}

void scenePocket(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  float spin = t * 0.12;
  if (f < 0.55) {
    vec3 d = golden(b.x, max(1.0, floor(uCount * 0.55)));
    float n = 0.65 * vnoise(d * 1.8 + 3.1) + 0.35 * vnoise(d * 4.2 + 7.7);
    float land = smoothstep(0.5, 0.56, n);
    p = ry(spin) * d * 0.95;
    float city = land * step(0.92, hash1(b.x * 0.37 + 1.0));
    c = mix(vec3(0.1, 0.3, 0.65) * 0.45, vec3(0.25, 0.85, 0.6) * 0.6, land) + AMBER * 0.8 * city;
    s = 0.85 + 0.3 * land + 0.6 * city;
  } else if (f < 0.76) {
    float an = TAU * a.y;
    p = ry(floor(a.x * 6.0) * PI / 3.0) * rx(0.96) * (vec3(cos(an), 0.0, sin(an)) * 2.05);
    c = GLOW * 0.16;
    s = 0.7;
  } else if (f < 0.9) {
    float sat = floor(a.x * 24.0);
    vec3 ctr = gpsSat(sat, t);
    vec3 tang = normalize(gpsSat(sat, t + 0.05) - ctr);
    vec3 wing = normalize(cross(tang, normalize(ctr)));
    vec3 o = a.y < 0.45 ? ball(a.z, a.w, b.z) * 0.045 : wing * (a.z - 0.5) * 0.26 + tang * (a.w - 0.5) * 0.05;
    p = ctr + o;
    c = a.y < 0.45 ? WHITE * 0.9 : GLOW * 0.55;
    s = 1.0;
  } else {
    // One signal from the best-placed satellite in each of four planes.
    float k = floor(a.x * 4.0);
    vec3 phone = ry(spin) * normalize(vec3(0.62, 0.34, 0.7)) * 0.97;
    vec3 best = vec3(0.0, 2.05, 0.0);
    float bestDot = -2.0;
    for (int j = 0; j < 4; j++) {
      vec3 sp = gpsSat(k + 6.0 * float(j), t);
      float d = dot(normalize(sp), normalize(phone));
      if (d > bestDot) { bestDot = d; best = sp; }
    }
    float vis = smoothstep(0.05, 0.25, bestDot);
    float pulse = pow(0.5 + 0.5 * cos(TAU * a.y * 3.0), 6.0);
    p = mix(best, phone, fract(a.y + t * 0.55)) + sdir(a.z, a.w) * 0.01;
    c = AMBER * (0.2 + 0.9 * pulse) * vis;
    s = (0.8 + pulse) * vis + 0.01;
  }
}

// ---------- 16. What comes next: a spiral galaxy ----------
void sceneGalaxy(vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (f < 0.14) {
    vec3 o = sdir(a.x, a.y) * pow(a.z, 1.6) * 0.55;
    p = vec3(o.x, o.y * 0.55, o.z);
    float core = 1.0 - sqrt(a.z);
    c = mix(AMBER, WHITE, 0.45) * (0.25 + 0.55 * core);
    s = 0.9 + core;
  } else if (f < 0.93) {
    float arm = floor(a.x * 2.0);
    float d = 0.3 + 2.5 * pow(a.y, 0.85);
    float th = arm * PI + 2.6 * log(d / 0.3 + 1.0) - t * 0.35 / (0.6 + d);
    float wide = step(0.72, fract(a.x * 7.0));
    vec2 g = (vec2(a.z + a.w, b.z + b.w) - 1.0) * (0.03 + 0.05 * d) * (1.4 + wide * 5.0);
    vec3 q = vec3(cos(th) * d, 0.0, sin(th) * d);
    p = q + normalize(q) * g.x + vec3(-sin(th), 0.0, cos(th)) * g.y + vec3(0.0, (a.z - a.w) * 0.06, 0.0);
    float knot = step(0.965, hash1(a.x * 91.0 + a.y * 17.0));
    c = mix(mix(AMBER, WHITE, 0.4), mix(GLOW, WHITE, 0.35), smoothstep(0.4, 1.4, d)) * (0.45 - wide * 0.25) + PINK * knot * 0.8 * (1.0 - wide);
    s = 0.8 + knot * 0.8;
  } else {
    p = sdir(a.x, a.y) * (2.6 + a.z * 1.2);
    c = WHITE * 0.07;
    s = 0.7;
  }
}

void shape(float id, vec4 a, vec4 b, float t, float f, out vec3 p, out vec3 c, out float s) {
  if (id < 1.5) sceneHero(a, b, t, f, p, c, s);
  else if (id < 2.5) sceneMap(a, b, t, f, p, c, s);
  else if (id < 3.5) sceneGalileo(a, b, t, f, p, c, s);
  else if (id < 4.5) sceneNewton(a, b, t, f, p, c, s);
  else if (id < 5.5) sceneFaraday(a, b, t, f, p, c, s);
  else if (id < 6.5) sceneMaxwell(a, b, t, f, p, c, s);
  else if (id < 7.5) sceneCurie(a, b, t, f, p, c, s);
  else if (id < 8.5) sceneEinstein(a, b, t, f, p, c, s);
  else if (id < 9.5) sceneRutherford(a, b, t, f, p, c, s);
  else if (id < 10.5) sceneBohr(a, b, t, f, p, c, s);
  else if (id < 11.5) sceneDeBroglie(a, b, t, f, p, c, s);
  else if (id < 12.5) sceneRaman(a, b, t, f, p, c, s);
  else if (id < 13.5) sceneMeitner(a, b, t, f, p, c, s);
  else if (id < 14.5) sceneLigo(a, b, t, f, p, c, s);
  else if (id < 15.5) scenePocket(a, b, t, f, p, c, s);
  else sceneGalaxy(a, b, t, f, p, c, s);
}

void main() {
  float f = aB.x / uCount;
  vec3 tp;
  vec3 tc;
  float ts;
  shape(uScene, aA, aB, uTime, f, tp, tc, ts);

  // Fly from the recorded position to the new formation, each particle
  // leaving at its own moment and bowing out sideways on the way.
  float pr = clamp(uMorph * (1.0 + uStagger) - aB.y * uStagger, 0.0, 1.0);
  float e = uBang > 0.5 ? 1.0 - pow(1.0 - pr, 4.0) : pr * pr * (3.0 - 2.0 * pr);
  float arc = sin(PI * pr);
  vec3 sw = uBang > 0.5
    ? normalize(tp + vec3(0.0001, 0.0002, 0.0003)) * (0.4 + 1.0 * aA.w)
    : normalize(vec3(aA.w, aB.z, aB.w) - 0.5 + vec3(0.0001)) * (0.2 + 0.6 * aB.w);
  vec3 pos = mix(aSnapPos, tp, e) + sw * arc;
  vec4 col = mix(aSnapCol, vec4(tc, ts), e);
  col.rgb += WHITE * arc * (uBang * 0.8 + 0.2);
  col.a += arc * 0.3;
  // Before the opening burst, every particle waits in one white-hot point.
  float spark = uBang * (1.0 - smoothstep(0.0, 0.12, pr));
  col.rgb += WHITE * spark * 0.06;
  col.a += spark * 5.0;
  vPos = pos;
  vCol = col;

  vec4 clip = uProj * (uView * vec4(pos, 1.0));
  if (clip.w < 0.15) {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vRGB = vec3(0.0);
    return;
  }

  // The pointer pushes particles aside; clicks send out a ring.
  vec2 asp = vec2(uAspect, 1.0);
  vec2 ndc = clip.xy / clip.w + uShift;
  float glow = 0.0;
  vec2 dm = (ndc - uMouse.xy) * asp;
  float dl = length(dm);
  float push = uMouse.z * (1.0 - smoothstep(0.0, 0.28, dl));
  ndc += dm / max(dl, 0.0001) / asp * push * push * 0.1;
  glow += push * 0.35;
  for (int k = 0; k < 3; k++) {
    vec4 sh = uShock[k];
    if (sh.w <= 0.0) continue;
    vec2 ds = (ndc - sh.xy) * asp;
    float dd = length(ds);
    float z = (dd - sh.z * 1.3) / 0.08;
    float band = exp(-z * z) * sh.w * (1.0 - smoothstep(0.5, 1.6, sh.z));
    ndc += ds / max(dd, 0.0001) / asp * band * 0.05;
    glow += band * 0.8;
  }
  gl_Position = vec4(ndc * clip.w, clip.z, clip.w);

  float px = uPx * col.a * (uDist / clip.w) * (1.0 + glow * 0.6);
  float ps = clamp(px, 1.0, 40.0);
  gl_PointSize = ps;
  float energy = min(1.0, (px * px) / (ps * ps));
  float depth = clamp(1.0 + (uDist - clip.w) * 0.2, 0.35, 1.4);
  vRGB = (col.rgb + vec3(0.55, 0.8, 1.0) * glow * 0.5) * uGain * depth * energy * 1.35;
}
`;

  const FS = `#version 300 es
precision mediump float;
in vec3 vRGB;
out vec4 outColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(q, q);
  if (d2 > 1.0) discard;
  float a = exp(-d2 * 2.5) - 0.06 * d2;
  outColor = vec4(vRGB * max(a, 0.0), 1.0);
}
`;

  const UNIFORMS = ['uScene', 'uMorph', 'uStagger', 'uBang', 'uTime', 'uCount', 'uView', 'uProj', 'uShift',
    'uAspect', 'uPx', 'uDist', 'uGain', 'uMouse', 'uShock', 'uWave', 'uStars', 'uStarCol', 'uEdges',
    'uFocus', 'uFocusAmt'];

  function hexRGB(hex, lift) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255;
      return v + (1 - v) * lift;
    });
  }

  // Small seeded random numbers, so the universe looks the same on every visit.
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function wrapAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  function createEngine(canvas) {
    const gl = canvas.getContext('webgl2', {
      alpha: false, antialias: false, depth: false, stencil: false,
      preserveDrawingBuffer: false, powerPreference: 'default'
    });
    if (!gl) return null;

    const small = Math.min(screen.width || 1280, screen.height || 800) < 700;
    const cores = navigator.hardwareConcurrency || 4;
    const N = small ? 16000 : cores >= 8 ? 30000 : 22000;
    const MIN = 6000;
    const fixedQuality = /[?&]cosmos=full\b/.test(location.search);
    let count = N;
    let quality = 1;

    let prog = null, par = null, tf = null;
    const snaps = [null, null], vaos = [null, null];
    let cur = 0, ready = false, lost = false, failed = false;
    const U = {};

    let scene = null, sceneDef = SCENES.hero;
    let morphStart = Infinity, morphDur = MORPH, stagger = 0.55, bang = 0, boost = 0;
    let clock = 0;
    let paused = PH.reducedMotion();
    let look = PH.prefs ? PH.prefs.get('bg') : 'calm';
    let off = look === 'off';
    let held = false, placeName = 'hero', lastShock = 0;

    let aspect = 1, pxRatio = 1;
    let yaw = 0.6, spinAcc = 0.6, pitch = 0.3, fyaw = 0.6, fpitch = 0.3, curDist = 7;
    let warpT = -1, warpDir = 1;
    const view = new Float32Array(16), proj = new Float32Array(16);
    const place = { x: 0, y: 0, zoom: 1, gain: 1, peak: 1, tx: 0, ty: 0, tzoom: 1, tgain: 1, tpeak: 1 };

    const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, s: 0, ts: 0, seen: 0, touch: false };
    const shocks = new Float32Array(12);
    const waves = new Float32Array(12);
    let shockSlot = 0, waveSlot = 0, waveTimer = 1.2;
    let focusIdx = -1, focusAmt = 0, focusTarget = 0;

    let raf = 0, last = 0, busyUntil = 0, ema = 1 / 60, nextCheck = performance.now() + 6000;

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    }

    function build() {
      par = gl.getExtension('KHR_parallel_shader_compile');
      const vs = compile(gl.VERTEX_SHADER, VS);
      const fs = compile(gl.FRAGMENT_SHADER, FS);
      prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.transformFeedbackVaryings(prog, ['vPos', 'vCol'], gl.INTERLEAVED_ATTRIBS);
      gl.linkProgram(prog);
      prog.vs = vs;
      prog.fs = fs;

      // Four random numbers, then the particle's number and three more.
      const rnd = mulberry32(1905);
      const seeds = new Float32Array(N * 8);
      for (let i = 0; i < N; i++) {
        const o = i * 8;
        seeds[o] = rnd(); seeds[o + 1] = rnd(); seeds[o + 2] = rnd(); seeds[o + 3] = rnd();
        seeds[o + 4] = i; seeds[o + 5] = rnd(); seeds[o + 6] = rnd(); seeds[o + 7] = rnd();
      }
      const seedBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
      gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

      // Two records of where every particle is (position, color, size),
      // written in turn whenever the scene changes. They start at zero: every
      // particle in one point, ready for the opening burst.
      for (let k = 0; k < 2; k++) {
        snaps[k] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, snaps[k]);
        gl.bufferData(gl.ARRAY_BUFFER, N * 7 * 4, gl.DYNAMIC_COPY);
        vaos[k] = gl.createVertexArray();
        gl.bindVertexArray(vaos[k]);
        gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
        gl.bindBuffer(gl.ARRAY_BUFFER, snaps[k]);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 28, 0);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 28, 12);
      }
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      tf = gl.createTransformFeedback();
      cur = 0;
      ready = false;
    }

    function fail() {
      failed = true;
      document.documentElement.classList.remove('has-cosmos');
      document.documentElement.classList.add('no-cosmos');
      if (typeof api.onfail === 'function') api.onfail();
    }

    // Shaders compile in the background where the browser allows it, so the
    // page never freezes waiting for them.
    function checkLink() {
      if (ready || failed || !prog) return;
      if (par && !gl.getProgramParameter(prog, par.COMPLETION_STATUS_KHR)) return;
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('[cosmos] ' + (gl.getShaderInfoLog(prog.vs) || '') + (gl.getShaderInfoLog(prog.fs) || '') + (gl.getProgramInfoLog(prog) || ''));
        fail();
        return;
      }
      UNIFORMS.forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
      gl.useProgram(prog);
      uploadMap();
      ready = true;
      if (morphStart === Infinity) morphStart = performance.now();
    }

    // The map's twelve stars on a spiral rising through time, and its links.
    function uploadMap() {
      const story = PH.story;
      const stars = new Float32Array(36), cols = new Float32Array(36), edges = new Float32Array(28);
      if (story) {
        const index = {};
        story.chapters.slice(0, 12).forEach(function (c, k) {
          index[c.id] = k;
          const u = k / 11, th = -1.2 + u * 6.6;
          stars.set([Math.cos(th) * 1.55, -1.65 + 3.3 * u, Math.sin(th) * 1.55], k * 3);
          cols.set(hexRGB(story.lanes[c.lane].color, 0.3), k * 3);
        });
        story.edges.slice(0, 14).forEach(function (e, k) {
          edges[k * 2] = index[e[0]] || 0;
          edges[k * 2 + 1] = index[e[1]] || 0;
        });
      }
      gl.uniform3fv(U.uStars, stars);
      gl.uniform3fv(U.uStarCol, cols);
      gl.uniform2fv(U.uEdges, edges);
    }

    function fitDistance() {
      return 2.55 / (Math.tan(FOV / 2) * Math.min(1, aspect * 1.25) * 0.95);
    }

    function matrices() {
      const f = 1 / Math.tan(FOV / 2), near = 0.1, far = 60, nf = 1 / (near - far);
      proj.fill(0);
      proj[0] = f / aspect;
      proj[5] = f;
      proj[10] = (far + near) * nf;
      proj[11] = -1;
      proj[14] = 2 * far * near * nf;
      // View: turn by yaw, tilt by pitch, then step back.
      const cy = Math.cos(fyaw), sy = Math.sin(fyaw), cp = Math.cos(fpitch), sp = Math.sin(fpitch);
      view[0] = cy; view[1] = sp * sy; view[2] = -cp * sy; view[3] = 0;
      view[4] = 0; view[5] = cp; view[6] = sp; view[7] = 0;
      view[8] = sy; view[9] = -sp * cy; view[10] = cp * cy; view[11] = 0;
      view[12] = 0; view[13] = 0; view[14] = -curDist; view[15] = 1;
    }

    function morphValue(now) {
      return morphStart === Infinity ? 0 : Math.max(0, (now - morphStart) / 1000 / morphDur);
    }

    function uniforms(now) {
      gl.uniform1f(U.uScene, sceneDef.id);
      gl.uniform1f(U.uMorph, Math.min(1, morphValue(now)));
      gl.uniform1f(U.uStagger, stagger);
      gl.uniform1f(U.uBang, bang);
      gl.uniform1f(U.uTime, clock);
      gl.uniform1f(U.uCount, count);
      matrices();
      gl.uniformMatrix4fv(U.uView, false, view);
      gl.uniformMatrix4fv(U.uProj, false, proj);
      gl.uniform2f(U.uShift, place.x, place.y);
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform1f(U.uPx, (small ? 2.0 : 2.3) * pxRatio);
      gl.uniform1f(U.uDist, curDist);
      gl.uniform1f(U.uGain, place.gain + Math.max(0, place.peak - place.gain) * Math.min(1, boost * 1.25));
      gl.uniform3f(U.uMouse, mouse.x, mouse.y, paused ? 0 : mouse.s);
      gl.uniform4fv(U.uShock, shocks);
      gl.uniform4fv(U.uWave, waves);
      gl.uniform1f(U.uFocus, focusIdx);
      gl.uniform1f(U.uFocusAmt, focusAmt);
    }

    // Record where every particle is right now, so the next flight starts there.
    function capture(now) {
      gl.useProgram(prog);
      uniforms(now);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindVertexArray(vaos[cur]);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, snaps[1 - cur]);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.endTransformFeedback();
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      gl.disable(gl.RASTERIZER_DISCARD);
      gl.bindVertexArray(null);
      cur = 1 - cur;
    }

    function addWave(p) {
      const o = waveSlot * 4;
      waves[o] = p[0];
      waves[o + 1] = p[1];
      waves[o + 2] = p[2];
      waves[o + 3] = 0.0001;
      waveSlot = (waveSlot + 1) % 3;
    }

    function randomCorePoint() {
      const r = 1.35 * Math.cbrt(Math.random()), u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      return [r * q * Math.cos(a), r * u, r * q * Math.sin(a)];
    }

    // The point inside the formation under a screen position (-1 to 1).
    function unproject(nx, ny) {
      const t = Math.tan(FOV / 2);
      let dx = (nx - place.x) * t * aspect, dy = (ny - place.y) * t, dz = -1;
      const len = Math.hypot(dx, dy, dz);
      dx /= len; dy /= len; dz /= len;
      const s = -curDist * dz;
      const vx = dx * s, vy = dy * s, vz = dz * s + curDist;
      const cy = Math.cos(fyaw), sy = Math.sin(fyaw), cp = Math.cos(fpitch), sp = Math.sin(fpitch);
      let x = cy * vx + sp * sy * vy - cp * sy * vz;
      let y = cp * vy + sp * vz;
      let z = sy * vx - sp * cy * vy + cp * cy * vz;
      const l = Math.hypot(x, y, z);
      if (l > 1.6) { x *= 1.6 / l; y *= 1.6 / l; z *= 1.6 / l; }
      return [x, y, z];
    }

    function update(dt, now) {
      if (!paused) clock += dt;
      const sc = sceneDef;

      const kp = 1 - Math.exp(-dt * 2.2);
      place.x += (place.tx - place.x) * kp;
      place.y += (place.ty - place.y) * kp;
      place.zoom += (place.tzoom - place.zoom) * kp;
      place.gain += (place.tgain - place.gain) * kp;
      place.peak += (place.tpeak - place.peak) * kp;

      const km = 1 - Math.exp(-dt * 10);
      mouse.x += (mouse.tx - mouse.x) * km;
      mouse.y += (mouse.ty - mouse.y) * km;
      const kpar = 1 - Math.exp(-dt * 1.6);
      mouse.px += ((paused ? 0 : mouse.tx) - mouse.px) * kpar;
      mouse.py += ((paused ? 0 : mouse.ty) - mouse.py) * kpar;
      if (!mouse.touch && now - mouse.seen > 2500) mouse.ts = 0;
      mouse.s += (mouse.ts - mouse.s) * (1 - Math.exp(-dt * 4));

      if (!paused) spinAcc += dt * (sc.spin || 0);
      let target = sc.swing ? sc.yaw + sc.swing * Math.sin(clock * 0.16) : spinAcc;
      if (!paused) target += 0.45 * Math.sin(window.scrollY / 900);
      target += mouse.px * 0.28;
      const kc = 1 - Math.exp(-dt * 2.4);
      yaw += wrapAngle(target - yaw) * kc;
      pitch += (sc.pitch - mouse.py * 0.12 - pitch) * kc;

      let wy = 0, wd = 1;
      if (warpT >= 0) {
        warpT += dt;
        const u = Math.min(1, warpT / WARP);
        wy = warpDir * Math.PI * 2 * (u * u * u * (u * (u * 6 - 15) + 10));
        const sn = Math.sin(Math.PI * u);
        wd = 1 - 0.45 * sn * sn;
        if (u >= 1) warpT = -1;
      }
      fyaw = yaw + wy;
      fpitch = pitch;
      curDist = (fitDistance() / place.zoom) * wd;

      for (let k = 0; k < 3; k++) {
        const o = k * 4;
        if (shocks[o + 3] > 0) {
          shocks[o + 2] += dt;
          if (shocks[o + 2] > 1.8) shocks[o + 3] = 0;
        }
        if (waves[o + 3] > 0 && !paused) {
          waves[o + 3] += dt;
          if (waves[o + 3] > 6) waves[o + 3] = 0;
        }
      }
      if (scene === 'hero' && !paused) {
        waveTimer -= dt;
        if (waveTimer <= 0) {
          addWave(randomCorePoint());
          waveTimer = 3.2 + Math.random() * 1.8;
        }
      }
      boost = Math.max(0, boost - dt / 2.6);
      focusAmt += (focusTarget - focusAmt) * (1 - Math.exp(-dt * 7));
    }

    // If the device struggles, draw fewer particles (they glide into the new
    // arrangement rather than jump).
    function watchSpeed(dt, now) {
      if (fixedQuality || paused || dt <= 0) return;
      ema = ema * 0.94 + dt * 0.06;
      if (now > nextCheck && ema > 0.03 && count > MIN) {
        nextCheck = now + 4000;
        capture(now);
        count = Math.max(MIN, Math.round(count * 0.62));
        quality = Math.max(0.6, quality * 0.85);
        resize();
        bang = 0;
        stagger = 0.3;
        morphDur = 1.2;
        morphStart = now;
        ema = 1 / 40;
      }
    }

    function shocksActive() {
      return shocks[3] > 0 || shocks[7] > 0 || shocks[11] > 0;
    }

    function frame(now) {
      raf = 0;
      if (lost || failed || off || document.hidden) {
        last = 0;
        return;
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (!ready) checkLink();
      if (failed) return;
      update(dt, now);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.027, 0.035, 0.047, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      let m = 0;
      if (ready) {
        gl.useProgram(prog);
        uniforms(now);
        gl.bindVertexArray(vaos[cur]);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.drawArrays(gl.POINTS, 0, count);
        gl.bindVertexArray(null);
        m = morphValue(now);
        watchSpeed(dt, now);
      }
      const busy = !ready || m < 1 || warpT >= 0 || now < busyUntil || shocksActive();
      if (!paused || busy) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function wake() {
      if (!raf && !lost && !failed && !off && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      let dpr = Math.min(window.devicePixelRatio || 1, 1.75) * quality;
      if (w * h * dpr * dpr > 3.2e6) dpr = Math.sqrt(3.2e6 / (w * h));
      const bw = Math.max(1, Math.round(w * dpr)), bh = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      aspect = w / h;
      pxRatio = bw / w;
      applyPlace();
      busyUntil = performance.now() + 600;
      wake();
    }

    function applyPlace() {
      const wide = window.innerWidth >= 900 && aspect > 1.15;
      const v = PLACES[placeName][wide ? 0 : 1];
      const calm = look === 'calm' && CALM[placeName];
      place.tx = v[0];
      place.ty = v[1];
      place.tzoom = v[2];
      place.tgain = calm ? calm[wide ? 0 : 1][0] : v[3];
      place.tpeak = calm ? calm[wide ? 0 : 1][1] : v[4];
    }

    function setPlace(name) {
      if (!PLACES[name] || name === placeName) return;
      placeName = name;
      applyPlace();
      busyUntil = performance.now() + 2500;
      wake();
    }

    // A quick dip in brightness instead of a flight, for readers who have
    // turned motion off.
    function fade() {
      canvas.style.transition = 'none';
      canvas.style.opacity = '0.2';
      void canvas.offsetWidth;
      canvas.style.transition = 'opacity 450ms ease';
      canvas.style.opacity = '1';
    }

    function setScene(name) {
      const def = SCENES[name];
      if (!def || failed || name === scene) return;
      const now = performance.now();
      const first = scene === null;
      if (ready && !first && !off) capture(now);
      scene = name;
      sceneDef = def;
      if (first) {
        bang = paused || off ? 0 : 1;
        morphDur = paused || off ? 0.01 : BANG;
        stagger = 0.3;
        morphStart = ready ? now : Infinity;
      } else {
        bang = 0;
        morphDur = paused || off ? 0.01 : MORPH;
        stagger = 0.55;
        morphStart = now;
        if (paused && !off) fade();
      }
      if (name === 'hero') waveTimer = first ? 1.2 : 0.3;
      boost = 1;
      busyUntil = now + 800;
      wake();
    }

    function warp(dir) {
      if (paused || failed || off) return;
      warpT = 0;
      warpDir = dir < 0 ? -1 : 1;
      wake();
    }

    function shock(cx, cy) {
      const t = performance.now();
      if (paused || failed || off || !ready || t - lastShock < SHOCK_GAP) return;
      lastShock = t;
      if (PH.sound) PH.sound.play('pop');
      const r = canvas.getBoundingClientRect();
      const x = ((cx - r.left) / r.width) * 2 - 1;
      const y = 1 - ((cy - r.top) / r.height) * 2;
      const o = shockSlot * 4;
      shocks[o] = x;
      shocks[o + 1] = y;
      shocks[o + 2] = 0;
      shocks[o + 3] = 1;
      shockSlot = (shockSlot + 1) % 3;
      if (scene === 'hero') addWave(unproject(x, y));
      wake();
    }

    function pointer(cx, cy, type) {
      if (cx === null) {
        mouse.ts = 0;
        mouse.touch = false;
        return;
      }
      const r = canvas.getBoundingClientRect();
      mouse.tx = ((cx - r.left) / r.width) * 2 - 1;
      mouse.ty = 1 - ((cy - r.top) / r.height) * 2;
      mouse.ts = 1;
      mouse.seen = performance.now();
      mouse.touch = type === 'touch';
      if (!paused) wake();
    }

    // Light up one physicist's star on the map formation (null for none).
    function focus(id) {
      const c = id && PH.story && PH.story.byId[id];
      if (c) focusIdx = c.index;
      focusTarget = c ? 1 : 0;
      busyUntil = performance.now() + 900;
      wake();
    }

    // Vivid, Calm or Off. Coming back from Off, the current formation is
    // simply there (no burst, no flight).
    function setLook(v) {
      if (v === look) return;
      const wasOff = off;
      look = v;
      off = v === 'off';
      applyPlace();
      if (wasOff && !off) {
        bang = 0;
        warpT = -1;
        morphDur = 0.01;
        morphStart = ready ? performance.now() : Infinity;
        place.gain = place.tgain;
        place.peak = place.tpeak;
      }
      busyUntil = performance.now() + 1500;
      wake();
    }

    function setPaused(v) {
      paused = !!v;
      if (paused) {
        warpT = -1;
        mouse.ts = 0;
      }
      busyUntil = performance.now() + 1500;
      wake();
    }

    const api = {
      scene: setScene,
      place: setPlace,
      warp: warp,
      shock: shock,
      pointer: pointer,
      focus: focus,
      setPaused: setPaused,
      setLook: setLook,
      hold: function (v) { held = !!v; },
      direct: function () {},
      onfail: null,
      get paused() { return paused; },
      get look() { return look; },
      get held() { return held; },
      get current() { return scene; },
      get ready() { return ready; },
      get particles() { return count; }
    };

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      lost = true;
      ready = false;
    });
    canvas.addEventListener('webglcontextrestored', function () {
      lost = false;
      build();
      bang = paused ? 0 : 1;
      morphDur = paused ? 0.01 : BANG;
      stagger = 0.3;
      morphStart = Infinity;
      wake();
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        last = 0;
        wake();
      }
    });
    window.addEventListener('resize', resize);

    build();
    resize();
    place.x = place.tx;
    place.y = place.ty;
    place.zoom = place.tzoom;
    place.gain = place.tgain;
    place.peak = place.tpeak;
    gl.clearColor(0.027, 0.035, 0.047, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    wake();
    return api;
  }

  /* ---------- Which formation, where: follows the reader down the page ---------- */

  function initDirector(engine) {
    const list = [];
    const add = function (el, name) { if (el) list.push({ el: el, name: name }); };
    add(document.getElementById('top'), 'hero');
    add(document.getElementById('map'), 'map');
    document.querySelectorAll('.chapter').forEach(function (ch) { add(ch, ch.id); });
    add(document.getElementById('pocket'), 'pocket');
    add(document.querySelector('.onward'), 'galaxy');
    add(document.querySelector('.colophon'), 'galaxy');
    let raf = 0;

    function run() {
      raf = 0;
      if (engine.held) return;
      const line = window.innerHeight * 0.45;
      let pick = null;
      for (let i = 0; i < list.length; i++) {
        const el = list[i].el;
        if (!el.offsetHeight) continue;
        if (!pick) pick = list[i].name;
        if (el.getBoundingClientRect().top <= line) pick = list[i].name;
      }
      if (!pick) return;
      engine.place(pick === 'hero' ? 'hero' : pick === 'map' ? 'map' : 'page');
      engine.scene(pick);
    }

    const schedule = function () { if (!raf) raf = requestAnimationFrame(run); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    engine.direct = run;
    run();
  }

  /* ---------- The pointer: particles move aside; a click sends a ripple ---------- */

  function initPointer(engine) {
    window.addEventListener('pointermove', function (e) {
      engine.pointer(e.clientX, e.clientY, e.pointerType);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { engine.pointer(null); });
    window.addEventListener('blur', function () { engine.pointer(null); });
    window.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'touch') engine.pointer(null);
    }, { passive: true });
    // A click or a tap (not the touch that starts a scroll) sends the ripple.
    document.addEventListener('click', function (e) {
      if (e.button !== 0) return;
      const t = e.target;
      if (t && t.closest && t.closest('a, button, input, select, textarea, label, summary, [role="button"], .plate, .chainmap, .masthead, .exhibit-bar, dialog, .cinema, .parts, .phone')) return;
      engine.shock(e.clientX, e.clientY);
    });
  }

  /* ---------- Pause and play the background ---------- */

  function initMotion(engine) {
    const toggle = document.getElementById('motion-toggle');
    const heroBtn = document.getElementById('hero-play');
    function sync() {
      if (toggle) toggle.setAttribute('aria-pressed', String(engine.paused));
      if (heroBtn) heroBtn.textContent = engine.paused ? 'Play' : 'Pause';
    }
    [toggle, heroBtn].forEach(function (b) {
      if (!b) return;
      b.addEventListener('click', function () {
        if (PH.prefs) PH.prefs.set('motion', engine.paused ? 'on' : 'off');
        else engine.setPaused(!engine.paused);
        sync();
      });
    });
    if (PH.prefs) {
      PH.prefs.on(function (name, value) {
        if (name === 'motion') {
          engine.setPaused(value === 'off');
          sync();
        } else if (name === 'bg') {
          engine.setLook(value);
        }
      });
    }
    sync();
  }

  PH.initCosmos = function () {
    const canvas = document.getElementById('cosmos');
    if (!canvas) return;
    let engine = null;
    try {
      engine = createEngine(canvas);
    } catch (err) {
      console.error('[cosmos]', err);
    }
    if (!engine) {
      document.documentElement.classList.add('no-cosmos');
      return;
    }
    document.documentElement.classList.add('has-cosmos');
    PH.cosmos = engine;
    const caption = document.getElementById('hero-caption-text');
    if (caption) {
      caption.innerHTML = '<b>Plate 0.</b> A uranium core in 3D. Every flash is a nucleus splitting and firing neutrons into its neighbors. Click or tap anywhere in the dark to start a chain yourself.';
    }
    initDirector(engine);
    initPointer(engine);
    initMotion(engine);
  };
})();
