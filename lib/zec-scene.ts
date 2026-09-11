/**
 * ZEC climber: a three.js scene of a mountaineer on a near-vertical rock face.
 *
 * The wall is a displaced plane driven by layered simplex noise, tilted 5
 * degrees past vertical (a 95 degree face), with strata, ledges, scattered
 * holds, lichen and snow computed per vertex. A rigged climber is animated
 * procedurally: climbing when the price rises, slipping and being caught by
 * the rope when it falls, and resting, chalking up or placing protection when
 * it is flat. Nothing is labelled; the price pill lives in the React layer.
 *
 * All audio is synthesised with the Web Audio API (wind, scrapes, drill,
 * rockfall, rope catch): no assets, and nothing plays until the user turns
 * sound on.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Simplex noise (2D), Stefan Gustavson's public-domain algorithm.
// ---------------------------------------------------------------------------

const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];
function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  return (xin: number, yin: number) => {
    const s2 = (xin + yin) * F2;
    const i = Math.floor(xin + s2);
    const j = Math.floor(yin + s2);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = GRAD[perm[ii + perm[jj]] & 7];
      t0 *= t0;
      n += t0 * t0 * (g[0] * x0 + g[1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7];
      t1 *= t1;
      n += t1 * t1 * (g[0] * x1 + g[1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7];
      t2 *= t2;
      n += t2 * t2 * (g[0] * x2 + g[1] * y2);
    }
    return 70 * n; // roughly -1..1
  };
}

const noise = makeNoise(20260911);
function fbm(x: number, y: number, oct = 5, lac = 2.05, gain = 0.5) {
  let a = 0.5;
  let f = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * noise(x * f, y * f);
    norm += a;
    a *= gain;
    f *= lac;
  }
  return sum / norm;
}

// ---------------------------------------------------------------------------
// The mountain: a heightfield with a summit, a near-vertical cliff band on the
// front face (the route), gentler slopes and forest below, and other peaks
// behind. World +y is up; the climber's face is on the +z side.
// ---------------------------------------------------------------------------

const TERRAIN_SIZE = 560;
type PeakSpec = { cx: number; cz: number; H: number; rTop: number; rCliff: number; apron: number; face: number };

/** Main peak: H = summit height, rCliff = radius where the cliff band ends on the front. */
const MAIN: PeakSpec = { cx: 0, cz: 0, H: 74, rTop: 4.5, rCliff: 16, apron: 110, face: 1 };
const OTHERS: PeakSpec[] = [
  { cx: -150, cz: -170, H: 96, rTop: 8, rCliff: 40, apron: 150, face: 0.4 },
  { cx: 140, cz: -210, H: 82, rTop: 7, rCliff: 34, apron: 140, face: 0.3 },
  { cx: -40, cz: -290, H: 110, rTop: 10, rCliff: 46, apron: 170, face: 0.2 },
  { cx: 230, cz: -60, H: 48, rTop: 6, rCliff: 30, apron: 120, face: 0.3 },
  // The ones the side camera looks toward.
  { cx: -150, cz: 60, H: 66, rTop: 7, rCliff: 30, apron: 120, face: 0.5 },
  { cx: -230, cz: -50, H: 104, rTop: 11, rCliff: 46, apron: 170, face: 0.3 },
  { cx: -140, cz: 170, H: 40, rTop: 6, rCliff: 26, apron: 110, face: 0.4 },
  { cx: -70, cz: 240, H: 30, rTop: 5, rCliff: 22, apron: 100, face: 0.4 },
  { cx: 120, cz: 150, H: 26, rTop: 5, rCliff: 20, apron: 100, face: 0.3 },
];

function peakHeight(x: number, z: number, p: PeakSpec): number {
  const dx = x - p.cx;
  const dz = z - p.cz;
  const r = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz); // 0 = facing +z (the camera side)
  const faceness = (0.5 + 0.5 * Math.cos(ang)) * p.face; // 1 on the front
  const rc = p.rCliff + (1 - faceness) * 26; // the back is a broad ridge, not a cliff
  const hBase = p.H * 0.28;
  if (r < p.rTop) return p.H - (r / p.rTop) * (r / p.rTop) * 2.5;
  if (r < rc) return p.H - ((p.H - hBase) * (r - p.rTop)) / (rc - p.rTop);
  const a = Math.max(0, 1 - (r - rc) / p.apron);
  return hBase * Math.pow(a, 1.7);
}

/** Terrain height at world (x, z). */
function terrain(x: number, z: number): number {
  let h = peakHeight(x, z, MAIN);
  for (const o of OTHERS) h = Math.max(h, peakHeight(x, z, o));
  // Rolling ground and crags. Bigger relief on steep ground so the cliff is craggy.
  const steep = Math.min(1, Math.max(0, (h - 20) / 30));
  h += fbm(x * 0.03, z * 0.03, 4) * 5;
  h += fbm(x * 0.13 + 4, z * 0.13 - 2, 4) * (1.2 + steep * 3.2);
  h += fbm(x * 0.5 - 9, z * 0.5 + 3, 3) * (0.25 + steep * 0.9);
  h += Math.abs(fbm(x * 0.22 + 30, z * 0.22 - 17, 3)) * steep * 1.6; // ridged crags
  // Strata on the cliff: horizontal ledges.
  h += Math.sin(h * 0.9 + fbm(x * 0.08, z * 0.08) * 3) * 0.35 * steep;
  return h;
}

const _n1 = new THREE.Vector3();
/** Surface normal at (x, z) by finite differences. */
function terrainNormal(x: number, z: number, out = _n1): THREE.Vector3 {
  const e = 0.35;
  const hx = terrain(x + e, z) - terrain(x - e, z);
  const hz = terrain(x, z + e) - terrain(x, z - e);
  return out.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
}

/** The route: up the front cliff band from its base to the summit, zigzagging. */
function routeCurve(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = MAIN.rCliff + 0.6 - t * (MAIN.rCliff + 0.6 - (MAIN.rTop - 0.4));
    const ang = Math.sin(t * 9.5) * 0.24 + Math.sin(t * 3.1) * 0.12;
    const x = r * Math.sin(ang);
    const z = r * Math.cos(ang);
    pts.push(new THREE.Vector3(x, terrain(x, z), z));
  }
  const c = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
  c.arcLengthDivisions = 800;
  return c;
}

// ---------------------------------------------------------------------------
// Textures generated on a canvas (grain, clouds, shield decal)
// ---------------------------------------------------------------------------

function grainTexture(size = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = (i / size) | 0;
    const n = 0.5 + 0.5 * fbm(x * 0.06, y * 0.06, 4);
    const g = 0.5 + 0.5 * noise(x * 0.9, y * 0.9);
    const v = Math.round(150 + n * 70 + g * 30);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 50);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Tangent-space normal map derived from the same grain heightfield. */
function grainNormalTexture(size = 256, strength = 2.2): THREE.CanvasTexture {
  const h = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = (i / size) | 0;
    h[i] = 0.5 + 0.5 * fbm(x * 0.06, y * 0.06, 4) + 0.25 * noise(x * 0.9, y * 0.9) + 0.12 * noise(x * 2.3, y * 2.3);
  }
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = Math.round((-dx / len * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 50);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

function cloudTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const blob = (x: number, y: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  };
  blob(128, 72, 70, 0.9);
  blob(80, 78, 50, 0.85);
  blob(176, 80, 54, 0.85);
  blob(110, 50, 40, 0.8);
  blob(150, 48, 36, 0.8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shieldTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "#1C3A5F";
  ctx.beginPath();
  ctx.moveTo(64, 14);
  ctx.lineTo(108, 30);
  ctx.lineTo(108, 66);
  ctx.bezierCurveTo(108, 92, 84, 108, 64, 116);
  ctx.bezierCurveTo(44, 108, 20, 92, 20, 66);
  ctx.lineTo(20, 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#f4b728";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(44, 46);
  ctx.lineTo(84, 46);
  ctx.lineTo(44, 84);
  ctx.lineTo(84, 84);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------
// Audio: everything synthesised
// ---------------------------------------------------------------------------

class Sound {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  windGain: GainNode | null = null;
  noiseBuf: AudioBuffer | null = null;
  enabled = false;

  enable() {
    if (this.enabled) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(ctx.destination);
    // 2s of white noise, reused by everything.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    // Wind: noise through a slowly wandering bandpass, gusting.
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 380;
    bp.Q.value = 0.6;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.18;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(g.gain);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.023;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 160;
    lfo2.connect(lfo2Gain).connect(bp.frequency);
    src.connect(bp).connect(lp).connect(g).connect(this.master);
    src.start();
    lfo.start();
    lfo2.start();
    this.windGain = g;
    this.enabled = true;
    this.master.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.5);
    if (ctx.state === "suspended") ctx.resume();
  }

  disable() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    this.master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
    this.ctx = null;
    this.master = null;
    this.windGain = null;
    this.enabled = false;
  }

  private burst(freq: number, q: number, dur: number, vol: number, type: BiquadFilterType = "bandpass") {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.05);
  }

  /** Boot scraping on rock. */
  scrape() {
    this.burst(1400 + Math.random() * 800, 1.2, 0.09 + Math.random() * 0.05, 0.16);
  }
  /** Hand slapping a hold. */
  slap() {
    this.burst(700, 2, 0.05, 0.1);
  }
  /** Drill / hammer tick. */
  tick() {
    this.burst(3200 + Math.random() * 1200, 6, 0.03, 0.2);
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = 2400 + Math.random() * 600;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.03);
  }
  /** Falling rock hitting the face. */
  thump(size = 1) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sine";
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(110 * size, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35 * size, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.3);
    this.burst(500, 1, 0.12, 0.2 * size, "lowpass");
  }
  /** The rope snapping taut: whoosh + creak. */
  ropeCatch() {
    this.burst(900, 0.7, 0.35, 0.3, "highpass");
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    const t = ctx.currentTime + 0.12;
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.45);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(f).connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.55);
  }
  /** A sharp breath out. */
  breath() {
    this.burst(1200, 0.5, 0.5, 0.05, "bandpass");
  }
  gust(strength: number) {
    if (!this.windGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.cancelScheduledValues(t);
    this.windGain.gain.setTargetAtTime(0.18 + strength * 0.3, t, 0.8);
    this.windGain.gain.setTargetAtTime(0.18, t + 2.5, 1.5);
  }
}

// ---------------------------------------------------------------------------
// The climber rig
// ---------------------------------------------------------------------------

type Limb = { shoulder: THREE.Group; elbow: THREE.Group; hand: THREE.Object3D; l1: number; l2: number };
type Leg = { hip: THREE.Group; knee: THREE.Group; foot: THREE.Object3D; l1: number; l2: number };

interface Rig {
  root: THREE.Group; // at the pelvis; +y up, faces the wall (-z is toward the wall)
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: Limb;
  armR: Limb;
  legL: Leg;
  legR: Leg;
  tieIn: THREE.Object3D;
  lamp: THREE.SpotLight;
}

function capsule(r: number, len: number, mat: THREE.Material, sx = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
  m.scale.set(sx, 1, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildClimber(): Rig {
  const gold = new THREE.MeshStandardMaterial({ color: 0xf4b728, roughness: 0.62, metalness: 0.02 });
  const goldDark = new THREE.MeshStandardMaterial({ color: 0xb8850f, roughness: 0.7 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd2a077, roughness: 0.7 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x1f2a3a, roughness: 0.85 });
  const boot = new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.9 });
  const navy = new THREE.MeshStandardMaterial({ color: 0x1c3a5f, roughness: 0.45, metalness: 0.1 });
  const strap = new THREE.MeshStandardMaterial({ color: 0x22201d, roughness: 0.9 });
  const glove = new THREE.MeshStandardMaterial({ color: 0x2a2623, roughness: 0.85 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc2c6cc, roughness: 0.3, metalness: 0.95 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x8e9299, roughness: 0.35, metalness: 0.9 });
  const pack = new THREE.MeshStandardMaterial({ color: 0x5b3d0a, roughness: 0.85 });
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a5e12, roughness: 0.9 });
  const rope = new THREE.MeshStandardMaterial({ color: 0xd8462f, roughness: 0.8 });
  const lens = new THREE.MeshStandardMaterial({ color: 0x1b2430, roughness: 0.15, metalness: 0.6 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Pelvis + harness with gear loops, carabiners and ice screws
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.22, 2, 2, 2), pants);
  body.add(pelvis);
  const harness = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.03, 8, 24), strap);
  harness.rotation.x = Math.PI / 2;
  harness.position.y = 0.06;
  body.add(harness);
  for (const sx of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 16), strap);
    loop.rotation.x = Math.PI / 2;
    loop.position.set(sx * 0.12, -0.08, 0);
    body.add(loop);
    // Carabiners on the gear loops
    for (let i = 0; i < 2; i++) {
      const c = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14), metal);
      c.position.set(sx * 0.2, -0.02 - i * 0.05, 0.05 + i * 0.06);
      c.rotation.y = Math.PI / 2;
      body.add(c);
    }
    // Ice screws
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), steel);
    screw.position.set(sx * 0.2, -0.1, -0.06);
    screw.rotation.z = sx * 0.2;
    body.add(screw);
  }
  const chalkBag = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 12), goldDark);
  chalkBag.position.set(0.02, -0.02, 0.2);
  body.add(chalkBag);
  const tieIn = new THREE.Object3D();
  tieIn.position.set(0, 0.06, -0.2);
  body.add(tieIn);
  const carab = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 14), metal);
  carab.position.copy(tieIn.position);
  carab.position.y += 0.02;
  body.add(carab);

  // Torso: a puffy down jacket with baffles, hood rolled at the neck
  const torso = new THREE.Group();
  torso.position.y = 0.12;
  body.add(torso);
  const chest = capsule(0.235, 0.34, gold, 1.35, 0.85);
  chest.position.y = 0.3;
  torso.add(chest);
  for (const yy of [0.14, 0.26, 0.38, 0.5]) {
    const baffle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 6, 28), goldDark);
    baffle.rotation.x = Math.PI / 2;
    baffle.scale.set(1.35, 0.85, 1);
    baffle.position.y = yy;
    torso.add(baffle);
  }
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.46, 0.012), goldDark);
  zip.position.set(0, 0.3, -0.2);
  torso.add(zip);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), gold);
  hood.scale.set(1.7, 0.55, 0.9);
  hood.position.set(0, 0.6, 0.16);
  torso.add(hood);

  // Backpack: mat, rope coil, side pockets, straps, the shield
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.44, 0.19, 2, 2, 2), pack);
  bag.position.set(0, 0.3, 0.28);
  torso.add(bag);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.08, 0.2), goldDark);
  lid.position.set(0, 0.55, 0.28);
  torso.add(lid);
  for (const sx of [-1, 1]) {
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.14), pack);
    pocket.position.set(sx * 0.18, 0.24, 0.28);
    torso.add(pocket);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.42, 0.02), strap);
    st.position.set(sx * 0.1, 0.32, -0.03);
    torso.add(st);
  }
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 12), mat);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 0.06, 0.3);
  torso.add(roll);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 8, 20), rope);
  coil.position.set(0, 0.62, 0.3);
  coil.rotation.x = Math.PI / 2;
  torso.add(coil);
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), navy);
  bottle.position.set(0.19, 0.4, 0.3);
  torso.add(bottle);
  const shieldTex = shieldTexture();
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ map: shieldTex, transparent: true, roughness: 0.8 }));
  decal.position.set(0, 0.3, 0.377);
  torso.add(decal);

  // Head: balaclava, helmet with side shields, goggles, headlamp
  const head = new THREE.Group();
  head.position.y = 0.66;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), navy); // balaclava
  skull.position.y = 0.1;
  head.add(skull);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.35), skin);
  face.position.set(0, 0.1, -0.03);
  face.rotation.x = -Math.PI / 2;
  head.add(face);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), navy);
  helmet.position.y = 0.1;
  head.add(helmet);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.133, 0.012, 6, 24), gold);
  brim.rotation.x = Math.PI / 2;
  brim.position.y = 0.075;
  head.add(brim);
  for (const sx of [-1, 1]) {
    const sd = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshStandardMaterial({ map: shieldTex, transparent: true, roughness: 0.6 }));
    sd.position.set(sx * 0.141, 0.12, 0.01);
    sd.rotation.y = sx * Math.PI / 2;
    head.add(sd);
  }
  const goggle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.075, 0.06, 2, 2, 2), lens);
  goggle.position.set(0, 0.11, -0.115);
  head.add(goggle);
  const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.085, 0.02), strap);
  goggleFrame.position.set(0, 0.11, -0.095);
  head.add(goggleFrame);
  const gStrap = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.012, 6, 24), strap);
  gStrap.rotation.x = Math.PI / 2;
  gStrap.position.y = 0.11;
  head.add(gStrap);
  const lampBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.03), strap);
  lampBody.position.set(0, 0.18, -0.135);
  head.add(lampBody);
  const lampLens = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), new THREE.MeshStandardMaterial({ color: 0xfff2c4, emissive: 0xffe9a8, emissiveIntensity: 1.2 }));
  lampLens.position.set(0, 0.18, -0.151);
  head.add(lampLens);
  const lamp = new THREE.SpotLight(0xffe7b0, 0, 6, Math.PI / 6, 0.6, 1.2);
  lamp.position.set(0, 0.18, -0.15);
  lamp.target.position.set(0, 0.2, -2);
  head.add(lamp);
  head.add(lamp.target);

  // Arms: shoulder -> elbow -> gloved hand with an ice axe
  const makeArm = (sx: number): Limb => {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 0.27, 0.5, 0);
    torso.add(shoulder);
    const upper = capsule(0.075, 0.22, gold);
    upper.position.y = -0.15;
    shoulder.add(upper);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 6, 16), goldDark);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.27;
    shoulder.add(cuff);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    const fore = capsule(0.065, 0.2, gold);
    fore.position.y = -0.13;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), glove);
    hand.scale.set(1, 1.15, 0.8);
    hand.position.y = -0.29;
    elbow.add(hand);
    // Ice axe held in the hand: shaft continues past the hand, pick at the end
    const axe = new THREE.Group();
    axe.position.y = -0.29;
    elbow.add(axe);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.5, 8), strap);
    shaft.position.y = -0.14;
    axe.add(shaft);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8), gold);
    grip.position.y = 0.03;
    axe.add(grip);
    const headAxe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.18), steel);
    headAxe.position.set(0, -0.39, -0.06);
    axe.add(headAxe);
    const pick = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.09, 6), steel);
    pick.rotation.x = -Math.PI / 2;
    pick.position.set(0, -0.395, -0.19);
    axe.add(pick);
    const leash = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 5, 10), strap);
    leash.position.y = 0.0;
    axe.add(leash);
    return { shoulder, elbow, hand, l1: 0.3, l2: 0.29 };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Legs: hip -> knee -> boot with gaiter and crampons
  const makeLeg = (sx: number): Leg => {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.12, -0.08, 0);
    body.add(hip);
    const thigh = capsule(0.085, 0.32, pants);
    thigh.position.y = -0.2;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);
    const shin = capsule(0.07, 0.28, pants);
    shin.position.y = -0.17;
    knee.add(shin);
    const gaiter = capsule(0.078, 0.12, navy);
    gaiter.position.y = -0.3;
    knee.add(gaiter);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.28, 2, 2, 2), boot);
    foot.position.set(0, -0.4, -0.06);
    knee.add(foot);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.025, 0.29), goldDark);
    sole.position.set(0, -0.46, -0.06);
    knee.add(sole);
    // Crampon: frame + front points + downward spikes
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.27), steel);
    frame.position.set(0, -0.475, -0.06);
    knee.add(frame);
    for (const [px, pz] of [[-0.04, -0.18], [0.04, -0.18], [-0.045, -0.06], [0.045, -0.06], [-0.04, 0.05], [0.04, 0.05]]) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.04, 5), steel);
      spike.rotation.x = Math.PI;
      spike.position.set(px, -0.5, pz);
      knee.add(spike);
    }
    for (const px of [-0.03, 0.03]) {
      const front = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.05, 5), steel);
      front.rotation.x = -Math.PI / 2;
      front.position.set(px, -0.47, -0.22);
      knee.add(front);
    }
    return { hip, knee, foot, l1: 0.4, l2: 0.43 };
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return { root, body, torso, head, armL, armR, legL, legR, tieIn, lamp };
}

// ---------------------------------------------------------------------------
// Two-bone IK in world space
// ---------------------------------------------------------------------------

const _ikA = new THREE.Vector3();
const _ikB = new THREE.Vector3();
const _ikC = new THREE.Vector3();
const _ikQ = new THREE.Quaternion();
const _ikM = new THREE.Matrix4();
const _ikPQ = new THREE.Quaternion();

/** Orient `obj` so its local -Y points along `dir` (world), with local +Z toward `hint`. */
function aimMinusY(obj: THREE.Object3D, dir: THREE.Vector3, hint: THREE.Vector3) {
  const y = _ikA.copy(dir).normalize().negate(); // local +y
  const z = _ikB.copy(hint).addScaledVector(y, -hint.dot(y));
  if (z.lengthSq() < 1e-6) z.set(0, 0, 1).addScaledVector(y, -y.z);
  z.normalize();
  const x = _ikC.crossVectors(y, z).normalize();
  _ikM.makeBasis(x, y, z);
  _ikQ.setFromRotationMatrix(_ikM);
  obj.parent!.getWorldQuaternion(_ikPQ);
  obj.quaternion.copy(_ikPQ.invert().multiply(_ikQ));
}

const _S = new THREE.Vector3();
const _D = new THREE.Vector3();
const _P = new THREE.Vector3();
const _E = new THREE.Vector3();
/** Point a two-bone chain (upper group -> lower group -> end at local -l2) at `target`, bending toward `pole`. */
function solveTwoBone(upper: THREE.Group, lower: THREE.Group, l1: number, l2: number, target: THREE.Vector3, pole: THREE.Vector3) {
  upper.getWorldPosition(_S);
  _D.subVectors(target, _S);
  const dist = THREE.MathUtils.clamp(_D.length(), 0.05, l1 + l2 - 0.01);
  _D.normalize();
  const cosA = THREE.MathUtils.clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
  const a = Math.acos(cosA);
  _P.copy(pole).addScaledVector(_D, -pole.dot(_D));
  if (_P.lengthSq() < 1e-6) _P.set(0, 0, 1).addScaledVector(_D, -_D.z);
  _P.normalize();
  _E.copy(_S).addScaledVector(_D, l1 * cosA).addScaledVector(_P, l1 * Math.sin(a));
  aimMinusY(upper, _ikA.subVectors(_E, _S), _P);
  upper.updateMatrixWorld(true);
  aimMinusY(lower, _ikA.subVectors(target, _E), _P);
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export type ClimbKind = "climb" | "slip";
export interface ZecScene {
  setTarget(t: number, kind: ClimbKind | "jump"): void;
  setSound(on: boolean): void;
  setPaused(paused: boolean): void;
  destroy(): void;
}

type Phase = "climb" | "slip" | "recover" | "rest" | "chalk" | "clip" | "shake" | "look";

const IDLE: Phase[] = ["rest", "chalk", "clip", "look", "shake", "rest", "clip", "look"];
const IDLE_DUR: Record<string, number> = { rest: 4.5, chalk: 3.2, clip: 5.4, look: 3.6, shake: 3.2 };

export function createZecScene(container: HTMLElement, initialT: number): ZecScene {
  let flagMesh: THREE.Mesh | null = null;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Renderer -------------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe6edf5, 45, 280);

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 900);

  // Sky ------------------------------------------------------------------------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(800, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x6f9ccc) },
        mid: { value: new THREE.Color(0xd8e4f0) },
        bot: { value: new THREE.Color(0xe4ebf2) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP;
        void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.7)) : mix(mid, bot, pow(-h, 0.8)); gl_FragColor = vec4(c, 1.0); }`,
    }),
  );
  scene.add(sky);

  // Lights ---------------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xdfeaf8, 0x8fa4bc, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e8, 2.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 140;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -14;
  sun.shadow.camera.right = sun.shadow.camera.top = 14;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);
  const rim = new THREE.DirectionalLight(0xbfd8ff, 0.6);
  rim.position.set(-20, 10, -8);
  scene.add(rim);

  // Sun disc
  const sunSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ color: 0xfff8ea, transparent: true, opacity: 0.9, depthWrite: false, fog: false }),
  );
  sunSprite.scale.set(28, 28, 1);
  sunSprite.position.set(260, 190, -420);
  scene.add(sunSprite);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(), color: 0xf4b728, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
  sunGlow.scale.set(120, 70, 1);
  sunGlow.position.copy(sunSprite.position);
  scene.add(sunGlow);

  // Terrain ----------------------------------------------------------------------
  // Two meshes sharing one material: a fine patch around the peak (where the
  // climber is) and a coarse far terrain that dips slightly under the patch.
  const cRock = new THREE.Color(0x6b665f);
  const cRockDark = new THREE.Color(0x3a3634);
  const cRockLight = new THREE.Color(0x9a948c);
  const cScree = new THREE.Color(0x7d7a74);
  const cGrass = new THREE.Color(0x5d6b4c);
  const cForest = new THREE.Color(0x35482f);
  const cSnow = new THREE.Color(0xf6f8fb);
  const cSnowShade = new THREE.Color(0xc9d6e6);
  const cIce = new THREE.Color(0xbfd6e8);
  const tmp = new THREE.Color();
  const nrm = new THREE.Vector3();
  const FINE = 84;

  function buildTerrain(size: number, segs: number, sinkUnderFine: boolean): THREE.BufferGeometry {
    const g = new THREE.PlaneGeometry(size, size, segs, segs);
    g.rotateX(-Math.PI / 2); // lie flat: x right, z toward the camera
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      let y = terrain(x, z);
      if (sinkUnderFine) {
        const inside = Math.max(Math.abs(x), Math.abs(z));
        const k = THREE.MathUtils.clamp(1 - (inside - FINE / 2 + 6) / 6, 0, 1);
        y -= k * 0.8;
      }
      p.setY(i, y);
    }
    g.computeVertexNormals();
    const n = g.attributes.normal as THREE.BufferAttribute;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const flat = n.getY(i); // 1 = level, 0 = vertical
      const nz = 0.5 + 0.5 * fbm(x * 0.09 + 11, z * 0.09 - 4, 3);
      tmp.copy(cRockDark).lerp(cRock, THREE.MathUtils.clamp(0.3 + nz * 0.5 + flat * 0.25, 0, 1));
      tmp.lerp(cRockLight, nz * nz * 0.35);
      if (y < 16 && flat > 0.6) tmp.lerp(cForest, THREE.MathUtils.clamp((flat - 0.6) * 2 * (1 - y / 16), 0, 0.8));
      if (y < 22 && flat > 0.5) tmp.lerp(cGrass, THREE.MathUtils.clamp((flat - 0.5) * (1 - y / 22) * nz, 0, 0.4));
      if (flat > 0.4 && flat < 0.7) tmp.lerp(cScree, 0.3);
      // Snow: settles on anything that isn't too steep; higher up it clings to
      // steeper rock too, and the summit is fully white. Blue in the shade.
      const settle = THREE.MathUtils.clamp((flat - 0.32) * 2.4, 0, 1) * THREE.MathUtils.clamp((y - 6) / 8, 0, 1);
      const cling = THREE.MathUtils.clamp((y - 30) / 26, 0, 1) * THREE.MathUtils.clamp((flat - 0.08) * 1.9, 0, 1);
      const snow = Math.max(settle, cling) * (0.75 + 0.25 * nz);
      if (snow > 0) {
        const shade = THREE.MathUtils.clamp(0.55 - flat, 0, 0.5) * 1.4;
        tmp.lerp(shade > 0.2 ? cSnowShade : cSnow, snow);
        if (fbm(x * 0.4 + 50, z * 0.4 - 33, 2) > 0.42 && flat < 0.5) tmp.lerp(cIce, snow * 0.6);
      }
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }

  const grain = grainTexture();
  grain.repeat.set(70, 70);
  const grainNormal = grainNormalTexture();
  grainNormal.repeat.set(70, 70);
  const wallMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: grain,
    roughnessMap: grain,
    normalMap: grainNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.9,
    metalness: 0,
  });
  const geo = buildTerrain(FINE, 336, false); // 0.25 units per vertex around the peak
  const wallMesh = new THREE.Mesh(geo, wallMat);
  wallMesh.receiveShadow = true;
  wallMesh.castShadow = true;
  scene.add(wallMesh);
  const farGeo = buildTerrain(TERRAIN_SIZE, 180, true);
  const farMesh = new THREE.Mesh(farGeo, wallMat);
  farMesh.receiveShadow = true;
  scene.add(farMesh);

  // Loose rock and holds on the cliff band
  const holdGeo = new THREE.DodecahedronGeometry(0.28, 0);
  const holdMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const HOLDS = 1600;
  const holds = new THREE.InstancedMesh(holdGeo, holdMat, HOLDS);
  holds.castShadow = true;
  holds.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let placed = 0;
  let guard = 0;
  while (placed < HOLDS && guard++ < 40000) {
    const ang = (rnd() - 0.5) * 2.4;
    const r = MAIN.rTop + rnd() * (MAIN.rCliff + 10 - MAIN.rTop);
    const x = r * Math.sin(ang);
    const z = r * Math.cos(ang);
    terrainNormal(x, z, nrm);
    if (nrm.y > 0.75 && rnd() < 0.7) continue; // mostly on the steep stuff
    const y = terrain(x, z);
    const sc = 0.18 + rnd() * rnd() * 0.9;
    v3.set(x, y - 0.06 * sc, z);
    e.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
    q.setFromEuler(e);
    s3.set(sc * (0.7 + rnd() * 0.6), sc * (0.5 + rnd() * 0.5), sc * (0.6 + rnd() * 0.5));
    m4.compose(v3, q, s3);
    holds.setMatrixAt(placed, m4);
    const shade = 0.5 + rnd() * 0.5;
    holds.setColorAt(placed, tmp.setRGB(0.42 * shade, 0.4 * shade, 0.38 * shade));
    placed++;
  }
  holds.count = placed;
  holds.instanceMatrix.needsUpdate = true;
  if (holds.instanceColor) holds.instanceColor.needsUpdate = true;
  scene.add(holds);

  // Forest on the lower slopes: conifers
  const treeGeo = new THREE.ConeGeometry(0.9, 3.2, 6);
  treeGeo.translate(0, 1.4, 0);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x3f5a3a, roughness: 1 });
  const TREES = 1400;
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, TREES);
  trees.castShadow = true;
  let tPlaced = 0;
  guard = 0;
  while (tPlaced < TREES && guard++ < 60000) {
    const x = (rnd() - 0.5) * 300;
    const z = (rnd() - 0.5) * 220 + 60;
    const y = terrain(x, z);
    terrainNormal(x, z, nrm);
    if (y > 24 || nrm.y < 0.6) continue;
    if (Math.hypot(x, z) < MAIN.rCliff + 4) continue;
    const sc = 0.7 + rnd() * 0.9;
    v3.set(x, y - 0.2, z);
    e.set(0, rnd() * 6.28, 0);
    q.setFromEuler(e);
    s3.set(sc, sc * (0.9 + rnd() * 0.5), sc);
    m4.compose(v3, q, s3);
    trees.setMatrixAt(tPlaced, m4);
    const g = 0.75 + rnd() * 0.5;
    const dust = THREE.MathUtils.clamp((y - 4) / 20, 0.15, 0.7);
    trees.setColorAt(tPlaced, tmp.setRGB(0.2 * g, 0.32 * g, 0.2 * g).lerp(cSnow, dust));
    tPlaced++;
  }
  trees.count = tPlaced;
  trees.instanceMatrix.needsUpdate = true;
  if (trees.instanceColor) trees.instanceColor.needsUpdate = true;
  scene.add(trees);

  // Grass tufts in cracks on the lower cliff
  const tuftGeo = new THREE.ConeGeometry(0.12, 0.5, 5);
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x8a8460, roughness: 1 });
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, 70);
  for (let i = 0; i < 70; i++) {
    const ang = (rnd() - 0.5) * 2;
    const r = MAIN.rCliff - 3 + rnd() * 9;
    const x = r * Math.sin(ang);
    const z = r * Math.cos(ang);
    const y = terrain(x, z);
    v3.set(x, y + 0.05, z);
    e.set(-0.3 + rnd() * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.6);
    q.setFromEuler(e);
    const sc = 0.25 + rnd() * 0.35;
    s3.set(sc, sc, sc);
    m4.compose(v3, q, s3);
    tufts.setMatrixAt(i, m4);
  }
  tufts.instanceMatrix.needsUpdate = true;
  scene.add(tufts);

  // Snow piled on ledges of the cliff band, and cornices near the top
  const clumpGeo = new THREE.SphereGeometry(0.34, 10, 8);
  const clumpMat = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.85 });
  const CLUMPS = 900;
  const clumps = new THREE.InstancedMesh(clumpGeo, clumpMat, CLUMPS);
  clumps.castShadow = true;
  clumps.receiveShadow = true;
  let cPlaced = 0;
  guard = 0;
  while (cPlaced < CLUMPS && guard++ < 60000) {
    const ang = (rnd() - 0.5) * 2.6;
    const r = MAIN.rTop - 1 + rnd() * (MAIN.rCliff + 14 - MAIN.rTop);
    const x = r * Math.sin(ang);
    const z = r * Math.cos(ang);
    terrainNormal(x, z, nrm);
    if (nrm.y < 0.45) continue; // only where snow can sit
    const y = terrain(x, z);
    const sc = 0.5 + rnd() * 1.4;
    v3.set(x, y + 0.02, z);
    e.set(0, rnd() * 6.28, 0);
    q.setFromEuler(e);
    s3.set(sc * (0.8 + rnd() * 0.8), sc * 0.38, sc * (0.7 + rnd() * 0.8));
    m4.compose(v3, q, s3);
    clumps.setMatrixAt(cPlaced, m4);
    cPlaced++;
  }
  clumps.count = cPlaced;
  clumps.instanceMatrix.needsUpdate = true;
  scene.add(clumps);

  // Summit marker: a cairn and a small flag
  {
    const top = new THREE.Vector3(0, terrain(0, 0), 0);
    const cairnMat = new THREE.MeshStandardMaterial({ color: 0x55504b, roughness: 1 });
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 - i * 0.09, 0), cairnMat);
      st.position.set(top.x, top.y + 0.3 + i * 0.5, top.z);
      st.castShadow = true;
      scene.add(st);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x3a3129 }));
    pole.position.set(top.x + 0.4, top.y + 1.4, top.z);
    scene.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshStandardMaterial({ color: 0xf4b728, side: THREE.DoubleSide, roughness: 0.8 }));
    flag.position.set(top.x + 0.87, top.y + 2.35, top.z);
    scene.add(flag);
    flagMesh = flag;
  }

  // Clouds ---------------------------------------------------------------------
  const cloudTex = cloudTexture();
  const clouds: THREE.Sprite[] = [];
  for (let i = 0; i < 14; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.55 + rnd() * 0.3, depthWrite: false }));
    const sc = 40 + rnd() * 70;
    sp.scale.set(sc, sc * 0.5, 1);
    const a = rnd() * Math.PI * 2;
    const rr = 120 + rnd() * 150;
    sp.position.set(Math.cos(a) * rr, 26 + rnd() * 80, Math.sin(a) * rr);
    scene.add(sp);
    clouds.push(sp);
  }

  // Birds ----------------------------------------------------------------------
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x4a4238, side: THREE.DoubleSide });
  const birds: { g: THREE.Group; l: THREE.Mesh; r: THREE.Mesh; phase: number; radius: number; height: number; speed: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const wing = new THREE.PlaneGeometry(0.9, 0.25);
    const l = new THREE.Mesh(wing, birdMat);
    const r = new THREE.Mesh(wing, birdMat);
    l.position.x = -0.45;
    r.position.x = 0.45;
    g.add(l, r);
    scene.add(g);
    birds.push({ g, l, r, phase: rnd() * 6.28, radius: 20 + rnd() * 25, height: 10 + rnd() * 30, speed: 0.12 + rnd() * 0.1 });
  }

  // Snow / dust motes ----------------------------------------------------------
  const moteCount = 900;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(moteCount * 3);
  const moteVel = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (rnd() - 0.5) * 16;
    motePos[i * 3 + 1] = (rnd() - 0.5) * 14;
    motePos[i * 3 + 2] = (rnd() - 0.5) * 8;
    moteVel[i * 3] = -0.9 - rnd() * 1.6; // wind across the face
    moteVel[i * 3 + 1] = -0.35 - rnd() * 0.9;
    moteVel[i * 3 + 2] = (rnd() - 0.5) * 0.5;
  }
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.065, transparent: true, opacity: 0.75, depthWrite: false, sizeAttenuation: true }),
  );
  scene.add(motes);

  // Sparks (when placing a bolt) and boot dust ---------------------------------
  const sparkCount = 40;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkVel = new Float32Array(sparkCount * 3);
  const sparkLife = new Float32Array(sparkCount);
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffd36b, size: 0.05, transparent: true, opacity: 0.95, depthWrite: false }));
  sparks.visible = false;
  scene.add(sparks);
  const dustCount = 60;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustVel = new Float32Array(dustCount * 3);
  const dustLife = new Float32Array(dustCount);
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xf2f6fb, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  scene.add(dust);

  // Falling rocks ---------------------------------------------------------------
  const rockGeo = new THREE.DodecahedronGeometry(0.09, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4542, roughness: 0.95 });
  const rocks: { m: THREE.Mesh; v: THREE.Vector3; w: THREE.Vector3; life: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(rockGeo, rockMat);
    m.castShadow = true;
    m.visible = false;
    scene.add(m);
    rocks.push({ m, v: new THREE.Vector3(), w: new THREE.Vector3(), life: 0 });
  }

  // Route, anchors, rope --------------------------------------------------------
  const route = routeCurve();
  const anchorGroup = new THREE.Group();
  scene.add(anchorGroup);
  const anchorMetal = new THREE.MeshStandardMaterial({ color: 0xc4c7cc, roughness: 0.3, metalness: 0.9 });
  const anchorSling = new THREE.MeshStandardMaterial({ color: 0x1c3a5f, roughness: 0.8 });
  const anchors: THREE.Vector3[] = []; // world space, the clip point
  function addAnchor(at: THREE.Vector3) {
    const g = new THREE.Group();
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), anchorMetal);
    bolt.rotation.x = Math.PI / 2;
    g.add(bolt);
    const hanger = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 16), anchorMetal);
    hanger.position.z = 0.06;
    g.add(hanger);
    const draw = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.015), anchorSling);
    draw.position.set(0, -0.12, 0.08);
    g.add(draw);
    const gate = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.011, 6, 14), anchorMetal);
    gate.position.set(0, -0.24, 0.09);
    g.add(gate);
    const n = terrainNormal(at.x, at.z).clone();
    g.position.copy(at).addScaledVector(n, 0.02);
    g.lookAt(g.position.clone().add(n));
    anchorGroup.add(g);
    anchors.push(at.clone().add(new THREE.Vector3(0, -0.24, 0)).addScaledVector(n, 0.1));
    if (anchors.length > 6) {
      anchors.shift();
      anchorGroup.remove(anchorGroup.children[0]);
    }
  }
  const startPt = route.getPointAt(0);
  addAnchor(new THREE.Vector3(startPt.x - 0.6, terrain(startPt.x - 0.6, startPt.z + 0.2), startPt.z + 0.2));

  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd8462f, roughness: 0.75 });
  let ropeMesh: THREE.Mesh | null = null;
  const ropeCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()], false, "catmullrom", 0.3);

  // Climber ---------------------------------------------------------------------
  const rig = buildClimber();
  scene.add(rig.root);
  const climberScale = 1.05;
  rig.root.scale.setScalar(climberScale);

  // State -----------------------------------------------------------------------
  const sound = new Sound();
  let phase: Phase = "climb";
  let phaseT = 0; // seconds into the phase
  let idleIdx = 0;
  let curT = initialT;
  let fromT = initialT;
  let toT = initialT;
  let moveStart = 0;
  let moveDur = 1;
  let moveKind: ClimbKind = "climb";
  let clock = 0;
  let paused = false;
  let destroyed = false;
  let lastStep = -1;
  let clipTicks = 0;
  let ropeCaught = false;
  let anchorPlaced = false;
  let breathAt = 0;
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let camInit = false;
  const bodyOffset = new THREE.Vector3(); // slip/recover extra motion (wall-local)
  let swingVel = 0;
  let swing = 0; // pendulum rotation after a catch

  const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  function setPhase(p: Phase) {
    phase = p;
    phaseT = 0;
    if (p === "clip") {
      clipTicks = 0;
      anchorPlaced = false;
    }
  }

  function nextIdle() {
    setPhase(IDLE[idleIdx % IDLE.length]);
    idleIdx++;
  }

  function beginMove(to: number, kind: ClimbKind) {
    fromT = curT;
    toT = THREE.MathUtils.clamp(to, 0, 1);
    moveStart = clock;
    const dist = Math.abs(toT - fromT) * route.getLength();
    moveKind = kind;
    if (kind === "slip") {
      moveDur = THREE.MathUtils.clamp(0.6 + dist * 0.22, 0.9, 2.4);
      ropeCaught = false;
      setPhase("slip");
      // Kick some rocks loose.
      for (let i = 0; i < 5; i++) spawnRock();
      sound.gust(0.6);
    } else {
      moveDur = THREE.MathUtils.clamp(1.6 + dist * 1.1, 2.2, 14);
      setPhase("climb");
    }
  }

  function spawnRock() {
    const r = rocks.find((k) => !k.m.visible);
    if (!r) return;
    const wp = rig.root.position;
    r.m.position.set(wp.x + (Math.random() - 0.5) * 0.6, wp.y - 0.6, wp.z);
    r.m.position.addScaledVector(surfN, 0.3);
    r.v.set((Math.random() - 0.5) * 1.2, -0.5 - Math.random(), 0).addScaledVector(surfN, 0.6 + Math.random() * 0.8);
    r.w.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
    r.life = 2.6;
    r.m.visible = true;
    r.m.scale.setScalar(0.6 + Math.random() * 0.9);
  }

  function emitSparks(at: THREE.Vector3) {
    sparks.visible = true;
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = at.x;
      sparkPos[i * 3 + 1] = at.y;
      sparkPos[i * 3 + 2] = at.z;
      sparkVel[i * 3] = (Math.random() - 0.5) * 2.4;
      sparkVel[i * 3 + 1] = Math.random() * 1.6;
      sparkVel[i * 3 + 2] = Math.random() * 1.8 + 0.2;
      sparkLife[i] = 0.25 + Math.random() * 0.35;
    }
  }

  function emitDust(at: THREE.Vector3, n = 10) {
    let placed = 0;
    for (let i = 0; i < dustCount && placed < n; i++) {
      if (dustLife[i] > 0) continue;
      dustPos[i * 3] = at.x + (Math.random() - 0.5) * 0.2;
      dustPos[i * 3 + 1] = at.y;
      dustPos[i * 3 + 2] = at.z;
      dustVel[i * 3] = (Math.random() - 0.5) * 0.8;
      dustVel[i * 3 + 1] = -0.2 - Math.random() * 0.8;
      dustVel[i * 3 + 2] = 0.2 + Math.random() * 0.6;
      dustLife[i] = 0.6 + Math.random() * 0.5;
      placed++;
    }
  }

  // Pose helpers ---------------------------------------------------------------
  const lerpAngle = (o: THREE.Object3D, axis: "x" | "y" | "z", target: number, k: number) => {
    o.rotation[axis] += (target - o.rotation[axis]) * k;
  };
  const D = THREE.MathUtils.degToRad;

  // Contacts: where each hand and foot is planted on the mountain (world).
  type Contact = { pos: THREE.Vector3; from: THREE.Vector3; to: THREE.Vector3; lift: number; planted: boolean };
  const mkContact = (): Contact => ({ pos: new THREE.Vector3(), from: new THREE.Vector3(), to: new THREE.Vector3(), lift: -1, planted: false });
  const contacts = { hL: mkContact(), hR: mkContact(), fL: mkContact(), fR: mkContact() };
  const STEP_ORDER: (keyof typeof contacts)[] = ["hR", "fL", "hL", "fR"];
  let lastWindow = -1;
  // Frame at the climber, filled in each frame before posing.
  const fR = new THREE.Vector3(); // right
  const fU = new THREE.Vector3(); // up the slope
  const fN = new THREE.Vector3(); // out of the rock
  const tmpV = new THREE.Vector3();
  const tmpW = new THREE.Vector3();

  /** Drop a point onto the mountain surface along the local normal. */
  function toSurface(p: THREE.Vector3): THREE.Vector3 {
    for (let i = 0; i < 4; i++) {
      const d = p.y - terrain(p.x, p.z);
      const n = terrainNormal(p.x, p.z);
      p.addScaledVector(n, -d * n.y);
    }
    return p;
  }

  /** Ideal contact for a limb relative to the body, on the surface, plus stand-off. */
  function idealContact(key: keyof typeof contacts, out: THREE.Vector3, lead = 0): THREE.Vector3 {
    const P = rig.root.position;
    const hand = key === "hL" || key === "hR";
    const sx = key === "hL" || key === "fL" ? -1 : 1;
    out.copy(P)
      .addScaledVector(fU, (hand ? 0.98 : -0.5) + lead)
      .addScaledVector(fR, sx * (hand ? 0.3 : 0.24))
      .addScaledVector(fN, -0.4);
    toSurface(out);
    // Hands hold the axes: the pick is in the ice, the glove stands off the surface.
    out.addScaledVector(fN, hand ? 0.2 : 0.09);
    return out;
  }

  function plantAll(instant: boolean) {
    for (const key of STEP_ORDER) {
      const c = contacts[key];
      idealContact(key, c.to);
      if (instant || !c.planted) {
        c.pos.copy(c.to);
        c.lift = -1;
      } else {
        c.from.copy(c.pos);
        c.lift = 0;
      }
      c.planted = true;
    }
  }

  /** Move planted limbs' contacts along their lift arcs; re-plant anything overstretched. */
  function updateContacts(dt: number, stepping: boolean, per: number) {
    if (stepping) {
      const cycle = (clock / per) % 1;
      const win = Math.floor(cycle * 4);
      if (win !== lastWindow) {
        lastWindow = win;
        const key = STEP_ORDER[win];
        const c = contacts[key];
        c.from.copy(c.pos);
        idealContact(key, c.to, 0.32);
        c.lift = 0;
      }
    }
    for (const key of STEP_ORDER) {
      const c = contacts[key];
      if (c.lift >= 0) {
        c.lift = Math.min(1, c.lift + dt / (stepping ? per * 0.25 : 0.45));
        const e = c.lift < 0.5 ? 2 * c.lift * c.lift : 1 - Math.pow(-2 * c.lift + 2, 2) / 2;
        c.pos.lerpVectors(c.from, c.to, e).addScaledVector(fN, Math.sin(c.lift * Math.PI) * 0.16);
        if (c.lift >= 1) {
          c.lift = -1;
          c.pos.copy(c.to);
          if (key === "fL" || key === "fR") {
            sound.scrape();
            emitDust(c.pos, 8);
          } else sound.slap();
        }
      } else {
        // Overstretched (after a slip or a big move): step it in.
        const joint = key === "hL" ? rig.armL.shoulder : key === "hR" ? rig.armR.shoulder : key === "fL" ? rig.legL.hip : rig.legR.hip;
        joint.getWorldPosition(tmpV);
        const reach = key === "hL" || key === "hR" ? 0.57 : 0.8;
        if (tmpV.distanceTo(c.pos) > reach) {
          c.from.copy(c.pos);
          idealContact(key, c.to);
          c.lift = 0;
        }
      }
    }
  }

  /** IK the four limbs onto their contacts (or FK where a limb is free). */
  function solveLimbs(freeArmR: boolean, freeAll: boolean) {
    rig.root.updateMatrixWorld(true);
    const poleL = tmpV.copy(fR).multiplyScalar(-0.7).addScaledVector(fN, 0.75);
    const poleR = tmpW.copy(fR).multiplyScalar(0.7).addScaledVector(fN, 0.75);
    if (!freeAll) {
      solveTwoBone(rig.armL.shoulder, rig.armL.elbow, rig.armL.l1, rig.armL.l2, contacts.hL.pos, poleL);
      if (!freeArmR) solveTwoBone(rig.armR.shoulder, rig.armR.elbow, rig.armR.l1, rig.armR.l2, contacts.hR.pos, poleR);
      const kneeL = tmpV.copy(fR).multiplyScalar(-0.9).addScaledVector(fN, 0.55);
      const kneeR = tmpW.copy(fR).multiplyScalar(0.9).addScaledVector(fN, 0.55);
      solveTwoBone(rig.legL.hip, rig.legL.knee, rig.legL.l1, rig.legL.l2, contacts.fL.pos, kneeL);
      solveTwoBone(rig.legR.hip, rig.legR.knee, rig.legR.l1, rig.legR.l2, contacts.fR.pos, kneeR);
    }
  }

  function fkArmR(shoulderX: number, shoulderZ: number, elbowX: number, k: number) {
    lerpAngle(rig.armR.shoulder, "x", shoulderX, k);
    lerpAngle(rig.armR.shoulder, "y", 0, k);
    lerpAngle(rig.armR.shoulder, "z", shoulderZ, k);
    lerpAngle(rig.armR.elbow, "x", elbowX, k);
    lerpAngle(rig.armR.elbow, "y", 0, k);
    lerpAngle(rig.armR.elbow, "z", 0, k);
  }
  function fkArmL(shoulderX: number, shoulderZ: number, elbowX: number, k: number) {
    lerpAngle(rig.armL.shoulder, "x", shoulderX, k);
    lerpAngle(rig.armL.shoulder, "y", 0, k);
    lerpAngle(rig.armL.shoulder, "z", shoulderZ, k);
    lerpAngle(rig.armL.elbow, "x", elbowX, k);
    lerpAngle(rig.armL.elbow, "y", 0, k);
    lerpAngle(rig.armL.elbow, "z", 0, k);
  }
  function fkLeg(l: Leg, hipX: number, hipZ: number, kneeX: number, k: number) {
    lerpAngle(l.hip, "x", hipX, k);
    lerpAngle(l.hip, "y", 0, k);
    lerpAngle(l.hip, "z", hipZ, k);
    lerpAngle(l.knee, "x", kneeX, k);
    lerpAngle(l.knee, "y", 0, k);
    lerpAngle(l.knee, "z", 0, k);
  }

  function updatePose(dt: number) {
    const k = Math.min(1, dt * 7);
    const t = clock;
    const b = rig.body;
    const h = rig.head;
    const per = 1.6;
    let freeR = false;
    let freeAll = false;

    switch (phase) {
      case "climb": {
        updateContacts(dt, true, per);
        const ph = (t / per) * Math.PI * 2;
        b.position.y += (0.04 * Math.sin(ph * 2) - b.position.y) * k;
        b.position.x += (0.05 * Math.sin(ph) - b.position.x) * k;
        lerpAngle(b, "x", D(10), k);
        lerpAngle(b, "z", D(3 * Math.sin(ph)), k);
        lerpAngle(h, "x", D(-26 + 5 * Math.sin(ph * 2)), k);
        lerpAngle(h, "y", D(6 * Math.sin(ph)), k);
        break;
      }
      case "rest": {
        updateContacts(dt, false, per);
        b.position.y += (-0.05 + 0.012 * Math.sin(t * 2.1) - b.position.y) * k;
        b.position.x += (0 - b.position.x) * k;
        lerpAngle(b, "x", D(16 + 1.5 * Math.sin(t * 2.1)), k);
        lerpAngle(b, "z", 0, k);
        lerpAngle(h, "x", D(-10), k);
        lerpAngle(h, "y", D(10 * Math.sin(t * 0.5)), k);
        if (t - breathAt > 3.4) {
          breathAt = t;
          sound.breath();
        }
        break;
      }
      case "shake": {
        updateContacts(dt, false, per);
        freeR = true;
        const wig = Math.sin(t * 16) * 0.5;
        fkArmR(D(-20 - 8 * wig), D(28 + 6 * wig), D(-30 + 20 * Math.sin(t * 16)), k);
        b.position.y += (-0.04 - b.position.y) * k;
        lerpAngle(b, "x", D(14), k);
        lerpAngle(b, "z", D(-6), k);
        lerpAngle(h, "x", D(-6), k);
        lerpAngle(h, "y", D(30), k);
        break;
      }
      case "chalk": {
        updateContacts(dt, false, per);
        freeR = true;
        const p = phaseT / IDLE_DUR.chalk;
        const dip = p < 0.35 ? p / 0.35 : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
        const wig = p >= 0.35 && p < 0.7 ? Math.sin(t * 18) * 0.15 : 0;
        fkArmR(D(160 - 190 * dip - wig * 30), D(12 + 20 * dip), D(-20 - 50 * dip), k);
        b.position.y += (-0.03 - b.position.y) * k;
        lerpAngle(b, "x", D(14), k);
        lerpAngle(b, "z", D(-4 * dip), k);
        lerpAngle(h, "x", D(-4), k);
        lerpAngle(h, "y", D(-10 + 30 * dip), k);
        break;
      }
      case "clip": {
        updateContacts(dt, false, per);
        freeR = true;
        const p = phaseT / IDLE_DUR.clip;
        const hammer = p > 0.12 && p < 0.62 ? Math.sin(t * 22) : 0;
        fkArmR(D(118 - 14 * hammer), D(18), D(-70 + 30 * Math.max(0, hammer)), 0.5);
        b.position.y += (-0.02 - b.position.y) * k;
        b.position.x += (0.03 * hammer - b.position.x) * 0.5;
        lerpAngle(b, "x", D(12), k);
        lerpAngle(b, "z", D(-3), k);
        lerpAngle(h, "x", D(-2), k);
        lerpAngle(h, "y", D(22), k);
        if (p > 0.12 && p < 0.62) {
          const tick = Math.floor(t * 3.5);
          if (tick !== clipTicks) {
            clipTicks = tick;
            sound.tick();
            emitSparks(rig.armR.hand.getWorldPosition(v3));
          }
        }
        if (p >= 0.66 && !anchorPlaced) {
          anchorPlaced = true;
          const hp = rig.armR.hand.getWorldPosition(v3).clone();
          toSurface(hp);
          addAnchor(hp);
          sound.slap();
        }
        break;
      }
      case "look": {
        updateContacts(dt, false, per);
        const p = phaseT / IDLE_DUR.look;
        const look = p < 0.5 ? Math.sin(p * Math.PI) : -Math.sin((p - 0.5) * Math.PI);
        b.position.y += (-0.04 - b.position.y) * k;
        lerpAngle(b, "x", D(14 + 8 * look), k);
        lerpAngle(b, "z", 0, k);
        lerpAngle(h, "x", D(40 * look - 8), k);
        lerpAngle(h, "y", D(20 * Math.sin(t * 0.8)), k);
        break;
      }
      case "slip": {
        // Everything lets go: limbs flail in FK.
        freeAll = true;
        for (const key of STEP_ORDER) contacts[key].planted = false;
        const flail = Math.sin(t * 14);
        fkArmL(D(120 - 40 * flail), D(-40), D(-40), 0.4);
        fkArmR(D(120 + 40 * flail), D(40), D(-40), 0.4);
        fkLeg(rig.legL, D(20 - 30 * flail), D(-30), D(-30), 0.4);
        fkLeg(rig.legR, D(20 + 30 * flail), D(30), D(-30), 0.4);
        lerpAngle(b, "x", D(38), 0.2);
        lerpAngle(b, "z", D(14 * flail), 0.3);
        lerpAngle(h, "x", D(-40), 0.3);
        lerpAngle(h, "y", D(20 * flail), 0.3);
        break;
      }
      case "recover": {
        // Swing back in and get everything planted again, one limb at a time.
        if (!contacts.hL.planted) plantAll(false);
        updateContacts(dt, false, per);
        const p = Math.min(1, phaseT / 2.2);
        const settle = 1 - p;
        lerpAngle(b, "x", D(16 + 14 * settle), k);
        lerpAngle(b, "z", D(8 * settle * Math.sin(t * 9)), k);
        lerpAngle(h, "x", D(-6 + 30 * settle), k);
        lerpAngle(h, "y", D(20 * settle * Math.sin(t * 5)), k);
        break;
      }
    }
    solveLimbs(freeR, freeAll);
  }

  // Frame loop ---------------------------------------------------------------
  const wallLocal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const wallNormal = new THREE.Vector3();
  const surfN = new THREE.Vector3(0, 0, 1);
  const basis = new THREE.Matrix4();
  let last = performance.now();
  let raf = 0;

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  function frame(now: number) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (paused) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    phaseT += dt;

    // Movement along the route -------------------------------------------------
    if (phase === "climb" || phase === "slip") {
      const p = THREE.MathUtils.clamp((clock - moveStart) / moveDur, 0, 1);
      if (moveKind === "climb") {
        curT = fromT + (toT - fromT) * (reduce ? 1 : easeInOut(p));
        if (p >= 1) nextIdle();
      } else {
        // Gravity: accelerate down, overshoot, get caught, spring back.
        let e: number;
        if (p < 0.6) {
          const q = p / 0.6;
          e = 1.12 * q * q;
        } else {
          const q = (p - 0.6) / 0.4;
          e = 1.12 - 0.12 * (1 - Math.pow(1 - q, 2.4));
          if (!ropeCaught) {
            ropeCaught = true;
            sound.ropeCatch();
            swingVel = 3.2;
            for (let i = 0; i < 3; i++) spawnRock();
          }
        }
        curT = fromT + (toT - fromT) * (reduce ? 1 : e);
        if (p >= 1) setPhase("recover");
      }
    } else if (phase === "recover") {
      if (phaseT > 2.3) nextIdle();
    } else {
      if (phaseT > (IDLE_DUR[phase] ?? 4)) nextIdle();
    }

    // Pendulum swing after a catch (decays).
    swingVel += -swing * 9 * dt - swingVel * 1.4 * dt;
    swing += swingVel * dt;

    // Place the climber on the route -------------------------------------------
    route.getPointAt(THREE.MathUtils.clamp(curT, 0, 1), wallLocal);
    route.getTangentAt(THREE.MathUtils.clamp(curT, 0.001, 0.999), tangent);
    terrainNormal(wallLocal.x, wallLocal.z, surfN);
    // Hang off the surface by about arm's length; a little further when slipping.
    const off = phase === "slip" ? 0.95 : phase === "recover" ? 0.78 : 0.62;
    rig.root.position.copy(wallLocal).addScaledVector(surfN, off);
    // Basis: face into the rock, "up" along the slope, swing about the normal.
    const upSlope = up.clone().addScaledVector(surfN, -up.dot(surfN)).normalize();
    const right = new THREE.Vector3().crossVectors(upSlope, surfN).normalize();
    fR.copy(right);
    fU.copy(upSlope);
    fN.copy(surfN);
    basis.makeBasis(right, upSlope, surfN);
    rig.root.quaternion.setFromRotationMatrix(basis);
    rig.root.rotateOnAxis(new THREE.Vector3(0, 0, 1), THREE.MathUtils.clamp(-tangent.x * 0.4, -0.3, 0.3) + swing * 0.6);
    rig.root.position.addScaledVector(right, swing * 0.35);
    if (!contacts.hL.planted && phase !== "slip") plantAll(true);
    updatePose(dt);

    // Headlamp comes on in the shade high on the wall; a subtle touch.
    rig.lamp.intensity += (((wallLocal.y > 58 ? 1.2 : 0.35) - rig.lamp.intensity) * dt) * 1.5;

    // Rope ----------------------------------------------------------------------
    const tie = rig.tieIn.getWorldPosition(v3).clone();
    const pts: THREE.Vector3[] = anchors.slice(-3).map((a) => a.clone());
    pts.push(tie);
    const ropePts: THREE.Vector3[] = [];
    const tension = phase === "slip" && ropeCaught ? 1 : phase === "recover" ? 0.8 : phase === "rest" ? 0.35 : 0.15;
    for (let i = 0; i < pts.length; i++) {
      ropePts.push(pts[i]);
      if (i < pts.length - 1) {
        const a = pts[i];
        const bpt = pts[i + 1];
        const len = a.distanceTo(bpt);
        const lastSpan = i === pts.length - 2;
        const sag = len * 0.18 * (lastSpan ? 1 - tension * 0.9 : 0.7);
        const mid = a.clone().lerp(bpt, 0.5);
        mid.y -= sag;
        mid.addScaledVector(surfN, sag * 0.35);
        ropePts.push(mid);
      }
    }
    ropeCurve.points = ropePts;
    if (ropeMesh) {
      ropeMesh.geometry.dispose();
      scene.remove(ropeMesh);
    }
    ropeMesh = new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 64, 0.022, 6, false), ropeMat);
    ropeMesh.castShadow = true;
    scene.add(ropeMesh);

    // Camera: side on, pulled back so the flank of the mountain, the drop and
    // the sky are in frame with the climber in profile against the face.
    const target = rig.root.position;
    wallNormal.copy(surfN);
    wallNormal.y = 0;
    wallNormal.normalize();
    const side = new THREE.Vector3().crossVectors(up, wallNormal).normalize().negate(); // to the climber's right
    const desired = target
      .clone()
      .addScaledVector(side, 9.5)
      .addScaledVector(wallNormal, 4.6)
      .addScaledVector(up, -1.0);
    // Handheld drift.
    desired.y += Math.sin(clock * 0.51) * 0.12;
    desired.addScaledVector(wallNormal, Math.sin(clock * 0.37) * 0.15);
    const look = target.clone().addScaledVector(up, 1.5).addScaledVector(wallNormal, 0.8);
    if (!camInit || reduce) {
      camPos.copy(desired);
      camLook.copy(look);
      camInit = true;
    } else {
      camPos.lerp(desired, Math.min(1, dt * 1.6));
      camLook.lerp(look, Math.min(1, dt * 2.2));
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    camera.rotation.z += Math.sin(clock * 0.29) * 0.006;

    // Sun follows so the shadow map stays tight around the climber.
    sun.position.copy(target).add(new THREE.Vector3(26, 24, 16));
    sun.target.position.copy(target);
    sun.target.updateMatrixWorld();

    // Sky stays centred on the camera.
    sky.position.copy(camera.position);

    // Particles ----------------------------------------------------------------
    for (let i = 0; i < moteCount; i++) {
      let x = motePos[i * 3] + moteVel[i * 3] * dt;
      let y = motePos[i * 3 + 1] + moteVel[i * 3 + 1] * dt;
      let z = motePos[i * 3 + 2] + moteVel[i * 3 + 2] * dt;
      // Keep the motes in a box around the climber.
      if (y < -7) y += 14;
      if (x < -8) x += 16;
      if (x > 8) x -= 16;
      if (y > 7) y -= 14;
      if (z < -4) z += 8;
      if (z > 4) z -= 8;
      motePos[i * 3] = x;
      motePos[i * 3 + 1] = y;
      motePos[i * 3 + 2] = z;
    }
    motes.position.copy(target).addScaledVector(wallNormal, 2);
    moteGeo.attributes.position.needsUpdate = true;
    (motes.material as THREE.PointsMaterial).opacity = 0.55 + 0.35 * Math.max(0, Math.sin(clock * 0.21)); // gusts of spindrift

    if (sparks.visible) {
      let alive = false;
      for (let i = 0; i < sparkCount; i++) {
        if (sparkLife[i] <= 0) continue;
        alive = true;
        sparkLife[i] -= dt;
        sparkVel[i * 3 + 1] -= 9.8 * dt;
        sparkPos[i * 3] += sparkVel[i * 3] * dt;
        sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt;
        sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
      }
      sparkGeo.attributes.position.needsUpdate = true;
      if (!alive) sparks.visible = false;
    }
    for (let i = 0; i < dustCount; i++) {
      if (dustLife[i] <= 0) {
        dustPos[i * 3 + 1] = -9999;
        continue;
      }
      dustLife[i] -= dt;
      dustVel[i * 3 + 1] -= 2.5 * dt;
      dustPos[i * 3] += dustVel[i * 3] * dt;
      dustPos[i * 3 + 1] += dustVel[i * 3 + 1] * dt;
      dustPos[i * 3 + 2] += dustVel[i * 3 + 2] * dt;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // Rocks: gravity, bounce off the face, tumble.
    for (const r of rocks) {
      if (!r.m.visible) continue;
      r.life -= dt;
      if (r.life <= 0) {
        r.m.visible = false;
        continue;
      }
      r.v.y -= 9.8 * dt;
      r.m.position.addScaledVector(r.v, dt);
      r.m.rotation.x += r.w.x * dt;
      r.m.rotation.y += r.w.y * dt;
      r.m.rotation.z += r.w.z * dt;
      // Bounce off the mountain.
      const gy = terrain(r.m.position.x, r.m.position.z);
      if (r.m.position.y < gy + 0.1) {
        const n = terrainNormal(r.m.position.x, r.m.position.z).clone();
        r.m.position.y = gy + 0.1;
        const vn = r.v.dot(n);
        r.v.addScaledVector(n, -1.55 * vn); // reflect with damping
        r.v.multiplyScalar(0.7);
        r.v.x += (Math.random() - 0.5) * 0.6;
        sound.thump(0.5 + r.m.scale.x * 0.4);
      }
    }

    // Ambient life ---------------------------------------------------------------
    for (const c of clouds) {
      c.position.x += dt * 0.6;
      if (c.position.x > 380) c.position.x = -380;
    }
    for (const bd of birds) {
      bd.phase += dt * bd.speed;
      bd.g.position.set(
        target.x + Math.cos(bd.phase) * bd.radius,
        target.y + bd.height + Math.sin(bd.phase * 2.3) * 2,
        target.z - 20 + Math.sin(bd.phase) * bd.radius * 0.4,
      );
      bd.g.rotation.y = -bd.phase + Math.PI / 2;
      const flap = Math.sin(clock * 9 + bd.phase * 7) * 0.7;
      bd.l.rotation.z = flap;
      bd.r.rotation.z = -flap;
    }
    if (Math.random() < dt * 0.05) sound.gust(Math.random() * 0.5);
    if (flagMesh) flagMesh.rotation.y = Math.sin(clock * 5.5) * 0.35 + Math.sin(clock * 1.3) * 0.15;

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // Public API -------------------------------------------------------------------
  return {
    setTarget(t, kind) {
      if (kind === "jump") {
        curT = fromT = toT = THREE.MathUtils.clamp(t, 0, 1);
        return;
      }
      beginMove(t, kind);
    },
    setSound(on) {
      if (on) sound.enable();
      else sound.disable();
    },
    setPaused(p) {
      paused = p;
      if (p) sound.gust(0);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      sound.disable();
      renderer.dispose();
      geo.dispose();
      farGeo.dispose();
      holdGeo.dispose();
      grain.dispose();
      grainNormal.dispose();
      cloudTex.dispose();
      if (ropeMesh) ropeMesh.geometry.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
