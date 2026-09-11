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
// The wall
// ---------------------------------------------------------------------------

const WALL_W = 76;
const WALL_H = 150;
const WALL_TILT = THREE.MathUtils.degToRad(5); // past vertical: a 95 degree face

/** Surface relief at wall-local (x, y). Positive = protrudes toward the camera. */
function relief(x: number, y: number): number {
  const macro = fbm(x * 0.045, y * 0.045, 4) * 4.4;
  const meso = fbm(x * 0.16 + 3.1, y * 0.16 - 1.7, 4) * 0.9;
  const micro = fbm(x * 0.55 - 7.3, y * 0.55 + 2.2, 3) * 0.22;
  // Strata: near-horizontal bands with a slight dip, broken by noise.
  const band = Math.sin(y * 0.55 + fbm(x * 0.08, y * 0.02) * 2.4) * 0.28;
  // Ledges: staircase steps every ~11 units, softened.
  const step = ((y % 11) + 11) % 11;
  const ledge = step < 1.4 ? (1 - step / 1.4) * 0.5 * (0.5 + 0.5 * fbm(x * 0.2, y)) : 0;
  return macro + meso + micro + band + ledge;
}

// Route up the face in wall-local (x, y). Slight zigzag, like real pitches.
const ROUTE_XY: [number, number][] = [
  [-3.5, -66], [1.5, -58], [-2.5, -50], [3.2, -42], [-1, -34], [2.8, -26],
  [-3.4, -18], [1.4, -10], [-2, -2], [3.4, 6], [-0.8, 14], [2.2, 22],
  [-2.8, 30], [1.6, 38], [-1.2, 46], [2.6, 54], [-0.6, 62], [0.4, 68],
];

function routeCurve(): THREE.CatmullRomCurve3 {
  const pts = ROUTE_XY.map(([x, y]) => new THREE.Vector3(x, y, relief(x, y)));
  const c = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
  c.arcLengthDivisions = 600;
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

type Limb = { shoulder: THREE.Group; elbow: THREE.Group; hand: THREE.Object3D };
type Leg = { hip: THREE.Group; knee: THREE.Group; foot: THREE.Object3D };

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
  const gold = new THREE.MeshStandardMaterial({ color: 0xf4b728, roughness: 0.75, metalness: 0.02 });
  const goldDark = new THREE.MeshStandardMaterial({ color: 0xb8850f, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd2a077, roughness: 0.7 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x2f2a26, roughness: 0.9 });
  const boot = new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.95 });
  const navy = new THREE.MeshStandardMaterial({ color: 0x1c3a5f, roughness: 0.4, metalness: 0.15 });
  const strap = new THREE.MeshStandardMaterial({ color: 0x22201d, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.35, metalness: 0.9 });
  const pack = new THREE.MeshStandardMaterial({ color: 0x6b4708, roughness: 0.85 });
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a5e12, roughness: 0.9 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Pelvis + harness
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.2, 2, 2, 2), pants);
  pelvis.castShadow = true;
  body.add(pelvis);
  const harness = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 8, 24), strap);
  harness.rotation.x = Math.PI / 2;
  harness.position.y = 0.06;
  body.add(harness);
  for (const sx of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 16), strap);
    loop.rotation.x = Math.PI / 2;
    loop.position.set(sx * 0.11, -0.08, 0);
    body.add(loop);
  }
  const chalkBag = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 12), goldDark);
  chalkBag.position.set(0.02, -0.02, 0.2);
  body.add(chalkBag);
  const tieIn = new THREE.Object3D();
  tieIn.position.set(0, 0.06, -0.19);
  body.add(tieIn);
  const carab = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 14), metal);
  carab.position.copy(tieIn.position);
  carab.position.y += 0.02;
  body.add(carab);

  // Torso
  const torso = new THREE.Group();
  torso.position.y = 0.12;
  body.add(torso);
  const chest = capsule(0.2, 0.34, gold, 1.35, 0.8);
  chest.position.y = 0.3;
  torso.add(chest);
  // Jacket seams / zipper
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.46, 0.012), goldDark);
  zip.position.set(0, 0.3, -0.17);
  torso.add(zip);
  // Backpack with mat, straps and the shield decal
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.17, 2, 2, 2), pack);
  bag.position.set(0, 0.32, 0.25);
  bag.castShadow = true;
  torso.add(bag);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 12), mat);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 0.58, 0.25);
  torso.add(roll);
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), navy);
  bottle.position.set(0.18, 0.28, 0.24);
  torso.add(bottle);
  for (const sx of [-1, 1]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.02), strap);
    st.position.set(sx * 0.1, 0.32, -0.02);
    torso.add(st);
  }
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.2),
    new THREE.MeshStandardMaterial({ map: shieldTexture(), transparent: true, roughness: 0.8 }),
  );
  decal.position.set(0, 0.32, 0.337);
  torso.add(decal);

  // Head + helmet + headlamp
  const head = new THREE.Group();
  head.position.y = 0.66;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), skin);
  skull.position.y = 0.1;
  skull.castShadow = true;
  head.add(skull);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), navy);
  helmet.position.y = 0.1;
  helmet.castShadow = true;
  head.add(helmet);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.012, 6, 24), gold);
  brim.rotation.x = Math.PI / 2;
  brim.position.y = 0.075;
  head.add(brim);
  const lampBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.03), strap);
  lampBody.position.set(0, 0.11, -0.135);
  head.add(lampBody);
  const lampLens = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), new THREE.MeshStandardMaterial({ color: 0xfff2c4, emissive: 0xffe9a8, emissiveIntensity: 1.2 }));
  lampLens.position.set(0, 0.11, -0.151);
  head.add(lampLens);
  const lamp = new THREE.SpotLight(0xffe7b0, 0, 6, Math.PI / 6, 0.6, 1.2);
  lamp.position.set(0, 0.11, -0.15);
  lamp.target.position.set(0, 0.2, -2);
  head.add(lamp);
  head.add(lamp.target);

  // Arms: shoulder -> elbow -> hand
  const makeArm = (sx: number): Limb => {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 0.25, 0.5, 0);
    torso.add(shoulder);
    const upper = capsule(0.06, 0.24, gold);
    upper.position.y = -0.15;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    const fore = capsule(0.05, 0.22, skin);
    fore.position.y = -0.14;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), skin);
    hand.scale.set(1, 1.2, 0.7);
    hand.position.y = -0.29;
    hand.castShadow = true;
    elbow.add(hand);
    return { shoulder, elbow, hand };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Legs: hip -> knee -> foot
  const makeLeg = (sx: number): Leg => {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.12, -0.08, 0);
    body.add(hip);
    const thigh = capsule(0.08, 0.32, pants);
    thigh.position.y = -0.2;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);
    const shin = capsule(0.065, 0.3, pants);
    shin.position.y = -0.18;
    knee.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.26, 2, 2, 2), boot);
    foot.position.set(0, -0.4, -0.06);
    foot.castShadow = true;
    knee.add(foot);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.02, 0.27), goldDark);
    sole.position.set(0, -0.455, -0.06);
    knee.add(sole);
    return { hip, knee, foot };
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
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Renderer -------------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf2ead9, 14, 70);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);

  // Sky ------------------------------------------------------------------------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(320, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0xe8dcc2) },
        mid: { value: new THREE.Color(0xf7f1e3) },
        bot: { value: new THREE.Color(0xf3e9d5) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP;
        void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.7)) : mix(mid, bot, pow(-h, 0.8)); gl_FragColor = vec4(c, 1.0); }`,
    }),
  );
  scene.add(sky);

  // Lights ---------------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xfff5e0, 0x9a8a68, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d2, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -9;
  sun.shadow.camera.right = sun.shadow.camera.top = 9;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);
  const rim = new THREE.DirectionalLight(0xf4b728, 0.5);
  rim.position.set(-20, 10, -8);
  scene.add(rim);

  // Sun disc
  const sunSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.9, depthWrite: false, fog: false }),
  );
  sunSprite.scale.set(28, 28, 1);
  sunSprite.position.set(150, 130, -180);
  scene.add(sunSprite);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(), color: 0xf4b728, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
  sunGlow.scale.set(120, 70, 1);
  sunGlow.position.copy(sunSprite.position);
  scene.add(sunGlow);

  // Wall -----------------------------------------------------------------------
  const wall = new THREE.Group();
  wall.rotation.x = WALL_TILT;
  scene.add(wall);

  const geo = new THREE.PlaneGeometry(WALL_W, WALL_H, 220, 460);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(0xc9b085); // warm sandstone
  const cB = new THREE.Color(0x8f7650); // shadowed rock
  const cC = new THREE.Color(0xd9c7a2); // light band
  const cLichen = new THREE.Color(0x7f8a5a);
  const cSnow = new THREE.Color(0xfbf8f0);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = relief(x, y);
    pos.setZ(i, z);
    // Colour by relief, band and altitude.
    const n = 0.5 + 0.5 * fbm(x * 0.12 + 11, y * 0.12 - 4, 3);
    const band = 0.5 + 0.5 * Math.sin(y * 0.55 + fbm(x * 0.08, y * 0.02) * 2.4);
    tmp.copy(cB).lerp(cA, THREE.MathUtils.clamp(0.25 + z * 0.16 + n * 0.3, 0, 1));
    tmp.lerp(cC, band * 0.35 * n);
    // Steep facets (crevice walls, undersides of ledges) sit in shadow.
    const slope = Math.abs(relief(x + 0.4, y) - z) + Math.abs(relief(x, y + 0.4) - z);
    tmp.multiplyScalar(THREE.MathUtils.clamp(1.05 - slope * 0.5, 0.55, 1.05));
    const lichen = fbm(x * 0.3 - 20, y * 0.3 + 9, 3);
    if (y < 10 && lichen > 0.38) tmp.lerp(cLichen, THREE.MathUtils.clamp((lichen - 0.38) * 3, 0, 0.7));
    // Snow settles on upward facets high up.
    const up = relief(x, y + 0.6) - z; // positive = face tilts upward
    const snowAmt = THREE.MathUtils.clamp((y - 38) / 18, 0, 1) * THREE.MathUtils.clamp(up * 2.2 + 0.25, 0, 1);
    if (snowAmt > 0) tmp.lerp(cSnow, snowAmt);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const grain = grainTexture();
  const grainNormal = grainNormalTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: grain,
    roughnessMap: grain,
    normalMap: grainNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughness: 0.96,
    metalness: 0,
  });
  const wallMesh = new THREE.Mesh(geo, wallMat);
  wallMesh.receiveShadow = true;
  wallMesh.castShadow = true;
  wall.add(wallMesh);

  // Holds and loose rock on the face
  const holdGeo = new THREE.DodecahedronGeometry(0.28, 0);
  const holdMat = new THREE.MeshStandardMaterial({ roughness: 0.9, vertexColors: false });
  const holds = new THREE.InstancedMesh(holdGeo, holdMat, 2200);
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
  for (let i = 0; i < 2200; i++) {
    const x = (rnd() - 0.5) * WALL_W * 0.96;
    const y = (rnd() - 0.5) * WALL_H * 0.96;
    const z = relief(x, y);
    const sc = 0.18 + rnd() * rnd() * 0.85;
    v3.set(x, y, z - 0.08 * sc);
    e.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
    q.setFromEuler(e);
    s3.set(sc * (0.7 + rnd() * 0.6), sc * (0.5 + rnd() * 0.5), sc * (0.6 + rnd() * 0.5));
    m4.compose(v3, q, s3);
    holds.setMatrixAt(i, m4);
    const shade = 0.6 + rnd() * 0.5;
    holds.setColorAt(i, tmp.setRGB(0.66 * shade, 0.55 * shade, 0.38 * shade));
  }
  holds.instanceMatrix.needsUpdate = true;
  if (holds.instanceColor) holds.instanceColor.needsUpdate = true;
  wall.add(holds);

  // Tufts of grass in crevices low on the face
  const tuftGeo = new THREE.ConeGeometry(0.12, 0.5, 5);
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x6f7a4d, roughness: 1 });
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, 140);
  for (let i = 0; i < 140; i++) {
    const x = (rnd() - 0.5) * WALL_W * 0.9;
    const y = -WALL_H / 2 + rnd() * rnd() * 60;
    const z = relief(x, y);
    v3.set(x, y, z + 0.1);
    e.set(-0.5 + rnd() * 0.4, rnd() * 6.28, (rnd() - 0.5) * 0.6);
    q.setFromEuler(e);
    const sc = 0.6 + rnd() * 0.9;
    s3.set(sc, sc, sc);
    m4.compose(v3, q, s3);
    tufts.setMatrixAt(i, m4);
  }
  tufts.instanceMatrix.needsUpdate = true;
  wall.add(tufts);

  // Distant peaks --------------------------------------------------------------
  const peakMat = new THREE.MeshStandardMaterial({ color: 0xd8cbae, roughness: 1, flatShading: true });
  for (let i = 0; i < 5; i++) {
    const g = new THREE.ConeGeometry(18 + i * 6, 40 + (i % 3) * 14, 7, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) * (0.8 + noise(k * 0.3, i) * 0.3));
    g.computeVertexNormals();
    const peak = new THREE.Mesh(g, peakMat);
    peak.position.set(-70 + i * 38, -60 + (i % 2) * 8, -70 - i * 10);
    scene.add(peak);
  }

  // Clouds ---------------------------------------------------------------------
  const cloudTex = cloudTexture();
  const clouds: THREE.Sprite[] = [];
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.55 + rnd() * 0.3, depthWrite: false }));
    const sc = 18 + rnd() * 26;
    sp.scale.set(sc, sc * 0.5, 1);
    sp.position.set(-90 + rnd() * 180, -20 + rnd() * 80, -45 - rnd() * 60);
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
  const moteCount = 420;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(moteCount * 3);
  const moteVel = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (rnd() - 0.5) * 16;
    motePos[i * 3 + 1] = (rnd() - 0.5) * 14;
    motePos[i * 3 + 2] = (rnd() - 0.5) * 8;
    moteVel[i * 3] = (rnd() - 0.5) * 0.3;
    moteVel[i * 3 + 1] = -0.25 - rnd() * 0.6;
    moteVel[i * 3 + 2] = (rnd() - 0.5) * 0.2;
  }
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true }),
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
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xd8c9a4, size: 0.09, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dust);

  // Falling rocks ---------------------------------------------------------------
  const rockGeo = new THREE.DodecahedronGeometry(0.09, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a7350, roughness: 0.95 });
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
  wall.add(anchorGroup);
  const anchorMetal = new THREE.MeshStandardMaterial({ color: 0xc4c7cc, roughness: 0.3, metalness: 0.9 });
  const anchorSling = new THREE.MeshStandardMaterial({ color: 0x1c3a5f, roughness: 0.8 });
  const anchors: THREE.Vector3[] = []; // wall-local
  function addAnchor(local: THREE.Vector3) {
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
    g.position.copy(local);
    g.position.z += 0.02;
    anchorGroup.add(g);
    anchors.push(local.clone().add(new THREE.Vector3(0, -0.24, 0.1)));
    if (anchors.length > 6) {
      anchors.shift();
      anchorGroup.remove(anchorGroup.children[0]);
    }
  }
  const startPt = route.getPointAt(0);
  addAnchor(new THREE.Vector3(startPt.x - 0.6, startPt.y - 0.2, relief(startPt.x - 0.6, startPt.y - 0.2)));

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
    r.m.position.set(wp.x + (Math.random() - 0.5) * 0.6, wp.y - 0.6, wp.z + 0.2);
    r.v.set((Math.random() - 0.5) * 1.2, -0.5 - Math.random(), 0.6 + Math.random() * 0.8);
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
  function poseArm(a: Limb, shoulderX: number, shoulderZ: number, elbowX: number, k: number) {
    lerpAngle(a.shoulder, "x", shoulderX, k);
    lerpAngle(a.shoulder, "z", shoulderZ, k);
    lerpAngle(a.elbow, "x", elbowX, k);
  }
  function poseLeg(l: Leg, hipX: number, hipZ: number, kneeX: number, k: number) {
    lerpAngle(l.hip, "x", hipX, k);
    lerpAngle(l.hip, "z", hipZ, k);
    lerpAngle(l.knee, "x", kneeX, k);
  }
  const D = THREE.MathUtils.degToRad;

  function updatePose(dt: number) {
    const k = Math.min(1, dt * 7);
    const t = clock;
    const b = rig.body;
    const h = rig.head;
    switch (phase) {
      case "climb": {
        // Four-limb ladder cycle. Period scales a little with speed.
        const per = 1.5;
        const ph = (t / per) * Math.PI * 2;
        const sL = Math.sin(ph);
        const sR = Math.sin(ph + Math.PI);
        // Arms reach up alternately (shoulder x negative = arm forward/up).
        poseArm(rig.armL, D(150 + 22 * sL), D(-8 + 10 * sL), D(-28 - 22 * Math.max(0, -sL)), k);
        poseArm(rig.armR, D(150 + 22 * sR), D(8 - 10 * sR), D(-28 - 22 * Math.max(0, -sR)), k);
        // Legs: frog position, stepping opposite to the arms.
        poseLeg(rig.legL, D(62 - 24 * sR), D(-22), D(-70 - 26 * Math.max(0, sR)), k);
        poseLeg(rig.legR, D(62 - 24 * sL), D(22), D(-70 - 26 * Math.max(0, sL)), k);
        b.position.y += (0.05 * Math.sin(ph * 2) - b.position.y) * k;
        b.position.x += (0.05 * sL - b.position.x) * k;
        lerpAngle(b, "x", D(12), k);
        lerpAngle(b, "z", D(4 * sL), k);
        lerpAngle(h, "x", D(-28 + 6 * Math.sin(ph * 2)), k);
        lerpAngle(h, "y", D(6 * sL), k);
        // Footfalls: scrape + dust twice per cycle.
        const step = Math.floor((t / per) * 2);
        if (step !== lastStep) {
          lastStep = step;
          sound.scrape();
          if (Math.random() < 0.5) sound.slap();
          const foot = step % 2 ? rig.legL.foot : rig.legR.foot;
          emitDust(foot.getWorldPosition(v3), 8);
        }
        break;
      }
      case "rest": {
        // Straight arms, hang low, breathe. Occasionally shake out.
        poseArm(rig.armL, D(168), D(-10), D(-8), k);
        poseArm(rig.armR, D(166), D(10), D(-10), k);
        poseLeg(rig.legL, D(70), D(-26), D(-96), k);
        poseLeg(rig.legR, D(58), D(24), D(-84), k);
        b.position.y += (-0.06 + 0.012 * Math.sin(t * 2.1) - b.position.y) * k;
        b.position.x += (0 - b.position.x) * k;
        lerpAngle(b, "x", D(18 + 1.5 * Math.sin(t * 2.1)), k);
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
        // One hand off the wall, shaking the pump out.
        const wig = Math.sin(t * 16) * 0.5;
        poseArm(rig.armL, D(168), D(-10), D(-8), k);
        poseArm(rig.armR, D(-20 - 8 * wig), D(28 + 6 * wig), D(-30 + 20 * Math.sin(t * 16)), k);
        poseLeg(rig.legL, D(70), D(-26), D(-96), k);
        poseLeg(rig.legR, D(58), D(24), D(-84), k);
        b.position.y += (-0.05 - b.position.y) * k;
        lerpAngle(b, "x", D(16), k);
        lerpAngle(b, "z", D(-6), k);
        lerpAngle(h, "x", D(-6), k);
        lerpAngle(h, "y", D(30), k);
        break;
      }
      case "chalk": {
        // Right hand dips into the chalk bag behind the hip, then back.
        const p = phaseT / IDLE_DUR.chalk;
        const dip = p < 0.35 ? p / 0.35 : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
        const wig = p >= 0.35 && p < 0.7 ? Math.sin(t * 18) * 0.15 : 0;
        poseArm(rig.armL, D(166), D(-8), D(-10), k);
        poseArm(rig.armR, D(160 - 190 * dip - wig * 30), D(12 + 20 * dip), D(-20 - 50 * dip), k);
        poseLeg(rig.legL, D(66), D(-24), D(-92), k);
        poseLeg(rig.legR, D(60), D(22), D(-86), k);
        b.position.y += (-0.04 - b.position.y) * k;
        lerpAngle(b, "x", D(16), k);
        lerpAngle(b, "z", D(-4 * dip), k);
        lerpAngle(h, "x", D(-4), k);
        lerpAngle(h, "y", D(-10 + 30 * dip), k);
        break;
      }
      case "clip": {
        // Drill a bolt at chest height, then clip the rope through it.
        const p = phaseT / IDLE_DUR.clip;
        const hammer = p > 0.12 && p < 0.62 ? Math.sin(t * 22) : 0;
        poseArm(rig.armL, D(166), D(-8), D(-10), k);
        poseArm(rig.armR, D(118 - 14 * hammer), D(18), D(-70 + 30 * Math.max(0, hammer)), 0.5);
        poseLeg(rig.legL, D(66), D(-24), D(-92), k);
        poseLeg(rig.legR, D(60), D(22), D(-86), k);
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
          const hp = rig.armR.hand.getWorldPosition(v3);
          wall.worldToLocal(hp);
          hp.z = relief(hp.x, hp.y);
          addAnchor(hp);
          sound.slap();
        }
        break;
      }
      case "look": {
        // Look down at the exposure, then up at the line.
        const p = phaseT / IDLE_DUR.look;
        const look = p < 0.5 ? Math.sin(p * Math.PI) : -Math.sin((p - 0.5) * Math.PI);
        poseArm(rig.armL, D(166), D(-8), D(-12), k);
        poseArm(rig.armR, D(164), D(8), D(-12), k);
        poseLeg(rig.legL, D(68), D(-26), D(-94), k);
        poseLeg(rig.legR, D(60), D(24), D(-86), k);
        b.position.y += (-0.05 - b.position.y) * k;
        lerpAngle(b, "x", D(16 + 8 * look), k);
        lerpAngle(b, "z", 0, k);
        lerpAngle(h, "x", D(40 * look - 8), k);
        lerpAngle(h, "y", D(20 * Math.sin(t * 0.8)), k);
        break;
      }
      case "slip": {
        // Feet skate off, body peels back, arms grab at air.
        const flail = Math.sin(t * 14);
        poseArm(rig.armL, D(120 - 40 * flail), D(-40), D(-40), 0.4);
        poseArm(rig.armR, D(120 + 40 * flail), D(40), D(-40), 0.4);
        poseLeg(rig.legL, D(20 - 30 * flail), D(-30), D(-30), 0.4);
        poseLeg(rig.legR, D(20 + 30 * flail), D(30), D(-30), 0.4);
        lerpAngle(b, "x", D(38), 0.2);
        lerpAngle(b, "z", D(14 * flail), 0.3);
        lerpAngle(h, "x", D(-40), 0.3);
        lerpAngle(h, "y", D(20 * flail), 0.3);
        break;
      }
      case "recover": {
        // Swing back into the wall, get feet on, shake it off.
        const p = Math.min(1, phaseT / 2.2);
        const settle = 1 - p;
        poseArm(rig.armL, D(160), D(-12), D(-30 - 40 * settle), k);
        poseArm(rig.armR, D(158), D(12), D(-30 - 40 * settle), k);
        poseLeg(rig.legL, D(60 + 20 * settle * Math.sin(t * 6)), D(-24), D(-90), k);
        poseLeg(rig.legR, D(58 - 20 * settle * Math.sin(t * 6)), D(22), D(-86), k);
        lerpAngle(b, "x", D(18 + 14 * settle), k);
        lerpAngle(b, "z", D(8 * settle * Math.sin(t * 9)), k);
        lerpAngle(h, "x", D(-6 + 30 * settle), k);
        lerpAngle(h, "y", D(20 * settle * Math.sin(t * 5)), k);
        break;
      }
    }
  }

  // Frame loop ---------------------------------------------------------------
  const wallLocal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const wallNormal = new THREE.Vector3();
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
    const surface = relief(wallLocal.x, wallLocal.y);
    // Hang off the surface by about arm's length; a little further when slipping.
    const off = phase === "slip" ? 0.9 : phase === "recover" ? 0.75 : 0.62;
    wallLocal.z = surface + off;
    wallLocal.x += swing * 0.35;
    wallLocal.y += phase === "slip" ? 0 : Math.abs(swing) * -0.1;
    rig.root.position.copy(wallLocal);
    wall.localToWorld(rig.root.position);
    // Face the wall (-z), tilt with the tangent and the pendulum.
    rig.root.rotation.set(WALL_TILT, 0, THREE.MathUtils.clamp(-tangent.x * 0.5, -0.35, 0.35) + swing * 0.6);
    updatePose(dt);

    // Headlamp comes on in the shade high on the wall; a subtle touch.
    rig.lamp.intensity += (((wallLocal.y > 40 ? 1.2 : 0.35) - rig.lamp.intensity) * dt) * 1.5;

    // Rope ----------------------------------------------------------------------
    const tie = rig.tieIn.getWorldPosition(v3).clone();
    const pts: THREE.Vector3[] = anchors.slice(-3).map((a) => wall.localToWorld(a.clone()));
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
        mid.z += sag * 0.35;
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

    // Camera: side on, a little out from the face and below, looking up the line
    // so the climber is in profile against the rock with the drop underneath.
    const target = rig.root.position;
    wallNormal.set(0, 0, 1).applyEuler(wall.rotation);
    const side = new THREE.Vector3(1, 0, 0);
    const desired = target
      .clone()
      .addScaledVector(side, 6.2)
      .addScaledVector(wallNormal, 2.0)
      .addScaledVector(up, -1.2);
    // Handheld drift.
    desired.y += Math.sin(clock * 0.51) * 0.1;
    desired.z += Math.sin(clock * 0.37) * 0.12;
    const look = target.clone().addScaledVector(up, 0.9).addScaledVector(wallNormal, 0.9);
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
      // Keep the motes in a box around the camera target.
      if (y < -7) y += 14;
      if (x < -8) x += 16;
      if (x > 8) x -= 16;
      if (z < -4) z += 8;
      if (z > 4) z -= 8;
      motePos[i * 3] = x;
      motePos[i * 3 + 1] = y;
      motePos[i * 3 + 2] = z;
    }
    motes.position.copy(target).addScaledVector(wallNormal, 2);
    moteGeo.attributes.position.needsUpdate = true;
    (motes.material as THREE.PointsMaterial).opacity = wallLocal.y > 30 ? 0.7 : 0.3;

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
      // Bounce if we pass into the wall.
      const lp = wall.worldToLocal(r.m.position.clone());
      const surf = relief(lp.x, lp.y);
      if (lp.z < surf + 0.1) {
        lp.z = surf + 0.1;
        r.m.position.copy(wall.localToWorld(lp));
        r.v.z = Math.abs(r.v.z) * 0.45 + 0.4;
        r.v.y *= 0.6;
        r.v.x += (Math.random() - 0.5) * 0.6;
        sound.thump(0.5 + r.m.scale.x * 0.4);
      }
    }

    // Ambient life ---------------------------------------------------------------
    for (const c of clouds) {
      c.position.x += dt * 0.35;
      if (c.position.x > 110) c.position.x = -110;
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
      holdGeo.dispose();
      grain.dispose();
      grainNormal.dispose();
      cloudTex.dispose();
      if (ropeMesh) ropeMesh.geometry.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
