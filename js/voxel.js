// Voxel toolkit: a builder that turns cube lists into instanced meshes,
// a seeded random source, blocky figures, and small canvas textures.
import * as THREE from 'three';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shared materials: one lit, one glowing (ignores light, feeds bloom).
export const MAT = {
  solid: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
};

export class Vox {
  constructor(seed = 7) { this.solid = []; this.glow = []; this.r = rng(seed); }
  // Cube with min corner (x,y,z) and edge s. jitter varies lightness per block.
  add(x, y, z, color, s = 1, jitter = 0.035) {
    this.solid.push([x + s / 2, y + s / 2, z + s / 2, s, s, s, color, jitter]);
    return this;
  }
  // Cuboid with explicit size (not split into voxels; used for planks, slabs, poles).
  slab(x, y, z, sx, sy, sz, color, jitter = 0.03) {
    this.solid.push([x + sx / 2, y + sy / 2, z + sz / 2, sx, sy, sz, color, jitter]);
    return this;
  }
  light(x, y, z, color, s = 1, power = 1.6) {
    this.glow.push([x + s / 2, y + s / 2, z + s / 2, s, s, s, color, 0, power]);
    return this;
  }
  lightSlab(x, y, z, sx, sy, sz, color, power = 1.6) {
    this.glow.push([x + sx / 2, y + sy / 2, z + sz / 2, sx, sy, sz, color, 0, power]);
    return this;
  }
  // Fill a box of unit voxels; color may be a function (x,y,z) => hex | null.
  fill(x0, y0, z0, x1, y1, z1, color, s = 1) {
    for (let x = x0; x < x1; x += s) for (let y = y0; y < y1; y += s) for (let z = z0; z < z1; z += s) {
      const c = typeof color === 'function' ? color(x, y, z) : color;
      if (c != null) this.add(x, y, z, c, s);
    }
    return this;
  }
  build() {
    const g = new THREE.Group();
    const make = (list, mat, glow) => {
      if (!list.length) return null;
      const mesh = new THREE.InstancedMesh(BOX, mat, list.length);
      list.forEach((v, i) => {
        _p.set(v[0], v[1], v[2]); _s.set(v[3], v[4], v[5]); _q.identity();
        _m.compose(_p, _q, _s); mesh.setMatrixAt(i, _m);
        _c.set(v[6]);
        if (glow) _c.multiplyScalar(v[8]);
        else if (v[7]) _c.offsetHSL(0, 0, (this.r() - 0.5) * 2 * v[7]);
        mesh.setColorAt(i, _c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      g.add(mesh);
      return mesh;
    };
    g.userData.solid = make(this.solid, MAT.solid, false);
    g.userData.glow = make(this.glow, MAT.glow, true);
    g.userData.solidList = this.solid;
    return g;
  }
}

// ── Blocky figures ────────────────────────────────────────────
// Built on a 0.25 grid with Minecraft-like proportions: a standing figure is 2 units tall.
// Origin is at the feet, centred; the figure faces +z.
const P = 0.25;
export function figure(opts = {}) {
  const o = Object.assign({
    skin: 0xc9a58a, hair: 0x3b2a1c, coat: 0x3a4150, legs: 0x2a2a30, shoes: 0x1a1612,
    hat: null, pose: 'stand', coatLong: false, legH: 3, bodyH: 3, beard: null, hood: null, window: null, seed: 3,
  }, opts);
  const v = new Vox(o.seed);
  const c = (gx, gy, gz, col) => { if (col != null) v.add(gx * P - 0.0001, gy * P, (gz - 1) * P, col, P); };
  const box = (x0, y0, z0, x1, y1, z1, col) => {
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++)
      c(x, y, z, typeof col === 'function' ? col(x, y, z) : col);
  };
  if (o.pose === 'lie') {
    box(-1, 0, 0, 1, 2, 2, (x, y, z) => (y === 0 || z === 0 ? o.hair : o.skin));
    return v.build();
  }
  const L = o.legH, B = o.bodyH, sit = o.pose === 'sit' || o.pose === 'sitDesk' || o.pose === 'slump';
  const legCol = (x, y) => (y === 0 ? o.shoes : (o.coatLong && y >= 1 ? o.coat : o.legs));
  let by;
  if (sit) {
    by = 3;
    box(-1, 2, 0, 1, 3, 4, o.coatLong ? o.coat : o.legs);           // thighs
    box(-1, 0, 3, 1, 2, 4, (x, y) => (y === 0 ? o.shoes : (o.coatLong ? o.coat : o.legs)));
  } else {
    by = L;
    box(-1, 0, 0, 1, L, 2, legCol);
    if (o.coatLong) { box(-2, 1, 0, -1, L - 1, 2, o.coat); box(1, 1, 0, 2, L - 1, 2, o.coat); }
  }
  box(-1, by, 0, 1, by + B, 2, o.coat);                                  // torso
  const fwd = o.pose === 'sitDesk' || o.pose === 'slump';
  for (const ax of [-2, 1]) {
    const hold = (o.pose === 'hold' || o.pose === 'reach') && ax === 1;
    if (fwd || hold) {
      box(ax, by + B - 2, 0, ax + 1, by + B, 2, o.coat);
      box(ax, by + B - 2, 2, ax + 1, by + B - 1, 4, o.coat);
      c(ax, by + B - 2, 4, o.skin);
    } else {
      box(ax, by + 1, 0, ax + 1, by + B, 2, o.coat);
      box(ax, by, 0, ax + 1, by + 1, 2, o.skin);
    }
  }
  const hy = by + B;
  if (o.hood) {
    box(-1, hy, 0, 1, hy + 3, 2, o.hood);
    box(-1, hy + 2, 2, 1, hy + 3, 3, o.hood);                            // brim
    if (o.window) v.light(-0.09, (hy + 1) * P + 0.04, P - 0.04, o.window, 0.18, 2.6);
  } else {
    box(-1, hy, 0, 1, hy + 2, 2, (x, y, z) => (y === hy + 1 || z === 0 ? o.hair : o.skin));
    v.add(-0.17, hy * P + 0.1, P - 0.02, 0x14100c, 0.07, 0);           // eyes
    v.add(0.08, hy * P + 0.1, P - 0.02, 0x14100c, 0.07, 0);
    if (o.hat) v.slab(-0.27, (hy + 2) * P, -0.27, 0.54, 0.07, 0.66, o.hat);
    if (o.beard) box(-1, hy - 2, 2, 1, hy, 3, o.beard);
  }
  const g = v.build();
  if (o.pose === 'slump') g.rotation.x = 0.35;
  return g;
}

// ── Canvas helpers ────────────────────────────────────────────
export function softDot(size = 64, inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function textTexture(text, { font = '700 64px "IM Fell English SC", Georgia, serif', color = '#d8c6a0', w = 1024, h = 128, glow = null, align = 'center' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.font = font; x.textAlign = align; x.textBaseline = 'middle';
  if (glow) { x.shadowColor = glow; x.shadowBlur = 24; }
  x.fillStyle = color; x.fillText(text, align === 'center' ? w / 2 : 16, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { tex: t, canvas: c, ctx: x };
}

export function gradientSky(stops) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// A slowly drifting band of mist made from soft sprites.
export function mistLayer({ count = 30, area = [60, 40], y = [0.3, 2], color = 0x9aa6b4, opacity = 0.12, size = [8, 16], seed = 11 }) {
  const r = rng(seed);
  const tex = softDot(128, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const g = new THREE.Group();
  const items = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, fog: true });
    const s = new THREE.Sprite(m);
    const sz = size[0] + r() * (size[1] - size[0]);
    s.scale.set(sz * 1.8, sz * 0.6, 1);
    s.position.set((r() - 0.5) * area[0], y[0] + r() * (y[1] - y[0]), (r() - 0.5) * area[1]);
    s.userData = { vx: (r() - 0.5) * 0.25 + 0.1, base: s.position.clone(), ph: r() * 6.28, o: opacity };
    g.add(s); items.push(s);
  }
  g.userData.update = (t, dt) => {
    for (const s of items) {
      s.position.x += s.userData.vx * dt;
      if (s.position.x > area[0] / 2) s.position.x -= area[0];
      s.material.opacity = s.userData.o * (0.75 + 0.25 * Math.sin(t * 0.3 + s.userData.ph));
    }
  };
  g.userData.items = items;
  return g;
}

export { THREE };
