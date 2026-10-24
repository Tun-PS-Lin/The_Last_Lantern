// The six voxel dioramas for Part One. Each builder returns:
// { scene, shots, cast, actions, update(t, dt), mood(name), post: {bloom, exposure} }
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Vox, figure, rng, softDot, textTexture, gradientSky, mistLayer } from './voxel.js';
import { animate, ease, lerp, wait } from './anim.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function baseScene(bg, fogColor, density) {
  const s = new THREE.Scene();
  s.background = bg instanceof THREE.Texture ? bg : new THREE.Color(bg);
  s.fog = new THREE.FogExp2(fogColor, density);
  return s;
}

function flicker(light, base, t, speed = 1, amt = 0.18) {
  light.intensity = base * (1 - amt + amt * (0.6 * Math.sin(t * 7.3 * speed) + 0.4 * Math.sin(t * 13.1 * speed + 1.7)) * 0.5 + amt * 0.5);
}

// Points cloud with per-particle alpha (vertex colors with 4 channels).
function particles({ count, color = 0xffffff, size = 0.3, tex, blending = THREE.NormalBlending, spawn, step }) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  const m = new THREE.PointsMaterial({ size, map: tex || softDot(64), vertexColors: true, transparent: true, depthWrite: false, blending, sizeAttenuation: true });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  const c = new THREE.Color(color);
  const life = new Float32Array(count), age = new Float32Array(count), vel = new Float32Array(count * 3);
  const P = { pos, vel, life, age, count, active: true };
  for (let i = 0; i < count; i++) { spawn(P, i, true); }
  pts.userData.update = (dt) => {
    for (let i = 0; i < count; i++) {
      age[i] += dt;
      if (age[i] >= life[i]) { if (P.active) spawn(P, i, false); else { col[i * 4 + 3] = 0; continue; } }
      const a = step ? step(P, i, dt) : 1;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b; col[i * 4 + 3] = a;
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
  };
  pts.userData.P = P;
  return pts;
}

function rain({ count = 2400, box = [-20, 0, -12, 26, 18, 30], speed = 20, color = 0x9fb2cc, opacity = 0.32, seed = 5 }) {
  const r = rng(seed);
  const pos = new Float32Array(count * 6);
  const [x0, y0, z0, x1, y1, z1] = box;
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), z = z0 + r() * (z1 - z0);
    pos.set([x, y, z, x + 0.06, y + 0.55, z], i * 6);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, fog: true, depthWrite: false });
  const l = new THREE.LineSegments(g, m); l.frustumCulled = false;
  l.userData.update = dt => {
    const d = speed * dt;
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      pos[o + 1] -= d; pos[o + 4] -= d; pos[o] -= d * 0.05; pos[o + 3] -= d * 0.05;
      if (pos[o + 1] < y0) { const k = y1 - y0; pos[o + 1] += k; pos[o + 4] += k; pos[o] += d * 0.05 * 20; pos[o + 3] += d * 0.05 * 20; }
    }
    g.attributes.position.needsUpdate = true;
  };
  return l;
}

function water(size, color, y = 0) {
  const geo = new THREE.PlaneGeometry(size, size);
  const pr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = new Reflector(geo, {
    clipBias: 0.003, color,
    textureWidth: Math.round(window.innerWidth * pr * 0.6),
    textureHeight: Math.round(window.innerHeight * pr * 0.6),
  });
  w.rotation.x = -Math.PI / 2; w.position.y = y;
  return w;
}

// ═════════════════════════════════════════ HARBOUR ═════════════════════════════════════════
export function buildHarbour() {
  const scene = baseScene(0x111925, 0x141c28, 0.019);
  const r = rng(101);
  const v = new Vox(101);
  // cobbles
  for (let x = -30; x < 30; x++) for (let z = -16; z < 9; z++)
    v.add(x, -1, z, pick(r, [0x34383e, 0x2e3237, 0x3b3f44, 0x2a2d31, 0x31353a]), 1, 0.04);
  // quay wall
  for (let x = -30; x < 30; x++) for (let y = -3; y < -1; y++) v.add(x, y, 8, pick(r, [0x2a2c2f, 0x24262a]));
  // houses
  const houses = [
    { x: -27, w: 7, h: 7, c: 0x45526a }, { x: -19, w: 7, h: 8, c: 0x5a5a58 }, { x: -11, w: 8, h: 8, c: 0x5e4438, hale: true },
    { x: -2, w: 7, h: 7, c: 0x6e6858 }, { x: 6, w: 7, h: 8, c: 0x3e4a56 }, { x: 14, w: 8, h: 7, c: 0x563e3c },
  ];
  const winGlow = [];
  for (const h of houses) {
    const z0 = -15, z1 = -8;
    for (let x = h.x; x < h.x + h.w; x++) for (let y = 0; y < h.h; y++) for (let z = z0; z < z1; z++) {
      const front = z === z1 - 1;
      const lx = x - h.x;
      const isWin = front && (y === 2 || y === 3 || y === 5 || y === 6) && (lx === 1 || lx === 2 || lx === h.w - 3 || lx === h.w - 2);
      const isDoor = front && y < 2 && (lx === Math.floor(h.w / 2));
      if (isWin) {
        const lit = h.hale && y >= 5 && lx >= h.w - 3;
        const dim = (h.hale && y < 4 && lx <= 2) || (!h.hale && r() < 0.12);
        if (lit) v.light(x, y, z + 0.6, 0xffb35a, 1, 1.9), winGlow.push([x, y]);
        else if (dim) v.light(x, y, z + 0.6, 0x7a5a30, 1, 0.9);
        else v.add(x, y, z + 0.6, 0x0d141c, 1, 0.01);
        continue;
      }
      if (isDoor) { v.add(x, y, z + 0.4, 0x22170f); continue; }
      if (!front && z !== z0 && x !== h.x && x !== h.x + h.w - 1 && y !== h.h - 1) continue; // hollow
      v.add(x, y, z, y % 2 ? h.c : new THREE.Color(h.c).offsetHSL(0, 0, -0.02).getHex(), 1, 0.025);
    }
    // gable roof, ridge along x
    for (let k = 0; k < 4; k++)
      for (let x = h.x - 1; x < h.x + h.w + 1; x++)
        for (let z = z0 + k - 1; z < z1 - k + 1; z++)
          if (z === z0 + k - 1 || z === z1 - k) v.add(x, h.h + k, z, 0x1d2126, 1, 0.03);
          else if (k === 3) v.add(x, h.h + k, z, 0x1d2126, 1, 0.03);
    if (h.hale) { v.fill(h.x + 1, h.h, -13, h.x + 2, h.h + 6, -12, 0x2a2420); }
    // window sills
    v.slab(h.x + 0.8, 1.9, -8.15, 1.4, 0.15, 0.3, 0x1c1814); v.slab(h.x + h.w - 3.2, 1.9, -8.15, 1.4, 0.15, 0.3, 0x1c1814);
  }
  // street lamp
  v.slab(-3.15, 0, -5.15, 0.3, 4.2, 0.3, 0x15171a);
  v.slab(-3.4, 4.2, -5.4, 0.8, 0.12, 0.8, 0x15171a);
  v.lightSlab(-3.3, 4.32, -5.3, 0.6, 0.7, 0.6, 0xffb35a, 2.1);
  v.slab(-3.4, 5.02, -5.4, 0.8, 0.15, 0.8, 0x15171a);
  // bollards and a cart
  for (const bx of [-18, -6, 4, 16]) v.slab(bx, 0, 7.3, 0.5, 0.8, 0.5, 0x1e1f22);
  v.slab(9, 0.4, -4, 3, 0.6, 1.6, 0x3a2a1a); v.slab(9.2, 0, -4.2, 0.5, 0.9, 0.2, 0x221810); v.slab(11.3, 0, -4.2, 0.5, 0.9, 0.2, 0x221810);
  // pier
  for (let z = 9; z < 24; z += 0.6) v.slab(8, -0.7, z, 3, 0.18, 0.5, z % 1.2 < 0.6 ? 0x3a2c20 : 0x33261b);
  for (let z = 9.5; z < 24; z += 3) { v.slab(8, -3, z, 0.35, 3, 0.35, 0x1e1812); v.slab(10.65, -3, z, 0.35, 3, 0.35, 0x1e1812); }
  // schooner
  for (let x = -16; x < -3; x++) {
    const taper = x < -14 ? 1 : x > -6 ? (x - -6) * 0.5 : 0;
    v.slab(x, -2.2, 13 + taper * 0.5, 1, 1.8, 3 - taper, 0x22190f);
  }
  v.slab(-15.5, -0.5, 13.3, 12, 0.2, 2.4, 0x3a2c1c);
  v.slab(-12.15, -0.4, 14.35, 0.3, 13, 0.3, 0x1a140e); v.slab(-7.15, -0.4, 14.35, 0.3, 11, 0.3, 0x1a140e);
  v.slab(-15, 8, 14.45, 7, 0.12, 0.12, 0x1a140e);
  v.light(-5, 0.2, 14.3, 0xffa040, 0.35, 1.4);
  scene.add(v.build());

  const sea = water(220, 0x55606e, -1.6); sea.position.z = 60; scene.add(sea);
  const rainL = rain({ box: [-24, -1.5, -10, 26, 18, 30], count: 1600, opacity: 0.22 }); scene.add(rainL);

  const hemi = new THREE.HemisphereLight(0x7a8cb0, 0x1c1c26, 1.5); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fa4c8, 1.6); moon.position.set(-8, 18, 20); scene.add(moon);
  const lamp = new THREE.PointLight(0xff9a40, 16, 20, 1.6); lamp.position.set(-3, 4.7, -4.6); scene.add(lamp);
  const win = new THREE.PointLight(0xffb060, 12, 16, 1.6); win.position.set(-5, 5.5, -6.5); scene.add(win);

  const shots = {
    wide: { pos: [17, 8, 24], target: [-4, 3.5, -8], to: { pos: [3.5, 6, 6], target: [-5, 5.4, -9], dur: 22 } },
  };
  const actions = {
    flash: async () => {
      for (const k of [0, 1]) {
        await animate(0.12, e => (hemi.intensity = lerp(1.5, 5, e)), ease.out);
        await animate(k ? 0.9 : 0.25, e => (hemi.intensity = lerp(5, 1.5, e)), ease.out);
      }
    },
  };
  return {
    scene, shots, actions, cast: {},
    post: { bloom: [0.85, 0.6, 0.55], exposure: 1.55 },
    update(t, dt) { rainL.userData.update(dt); flicker(lamp, 16, t, 0.6, 0.1); flicker(win, 12, t + 3, 0.3, 0.08); },
  };
}

// ═════════════════════════════════════════ BEDROOM ═════════════════════════════════════════
export function buildBedroom() {
  const scene = baseScene(0x07080b, 0x07080b, 0.028);
  const r = rng(202);
  const room = new Vox(202);
  // back wall z=-1, left wall x=-1
  const wallCol = (a, y) => (y < 2 ? 0x3a281c : y === 2 ? 0x24180f : (a % 2 ? 0x24332c : 0x2b3b33));
  for (let x = -1; x < 13; x++) for (let y = 0; y < 8; y++) {
    if (x >= 5 && x < 7 && y >= 3 && y < 6) continue;                     // window opening
    room.add(x, y, -1, wallCol(x, y), 1, 0.02);
  }
  for (let z = 0; z < 11; z++) for (let y = 0; y < 8; y++) room.add(-1, y, z, wallCol(z, y), 1, 0.02);
  // window frame + mullions + curtains
  room.slab(4.8, 2.85, -1.05, 2.4, 0.15, 0.4, 0x2a1a10); room.slab(4.8, 6, -1.05, 2.4, 0.15, 0.4, 0x2a1a10);
  room.slab(5.92, 3, -1.0, 0.16, 3, 0.25, 0x2a1a10); room.slab(5, 4.42, -1.0, 2, 0.16, 0.25, 0x2a1a10);
  for (let y = 2; y < 7; y++) { room.add(4, y, -0.6, 0x5a2626, 1, 0.05); room.add(7, y, -0.6, 0x5a2626, 1, 0.05); }
  // pinned drawings above desk
  [[8.2, 4.4, 0.1], [9.4, 4.9, -0.12], [10.5, 4.3, 0.06], [9.2, 3.6, 0.04], [11.3, 5.0, -0.05]].forEach(([x, y]) =>
    room.slab(x, y, -0.06, 0.8, 0.6, 0.05, pick(r, [0xc9bc9a, 0xd8ccae, 0xbfb08c]), 0.02));
  // bed
  room.slab(0, 0, 0.6, 2.2, 0.9, 5.4, 0x3a2416); room.slab(0, 0, 0, 2.2, 2.6, 0.6, 0x2f1d12);
  room.slab(0.05, 0.9, 0.6, 2.1, 0.35, 5.3, 0xcfc6b2);
  room.slab(0.2, 1.25, 0.75, 1.8, 0.28, 1.0, 0xe6e0d2);
  for (let z = 1.9; z < 5.9; z += 0.5) for (let x = 0; x < 2.2; x += 0.55)
    room.slab(x, 1.25, z, 0.56, 0.22, 0.5, pick(r, [0x6b3434, 0x7a4a2c, 0x51324a, 0x5a3a2a]), 0.02);
  room.slab(0.5, 1.47, 2.0, 1.2, 0.22, 2.6, 0x6b3434);
  // nightstand + lamp
  room.slab(2.5, 0, 0.2, 1, 1.0, 1, 0x3a2416);
  room.slab(2.75, 1.0, 0.45, 0.5, 0.14, 0.5, 0x8a6a30);
  room.lightSlab(2.9, 1.14, 0.6, 0.2, 0.42, 0.2, 0xffb060, 2.4);
  // chair beside bed, facing the bed (-x)
  room.slab(3.3, 0, 3.3, 0.12, 0.5, 0.12, 0x2a1a10); room.slab(4.2, 0, 3.3, 0.12, 0.5, 0.12, 0x2a1a10);
  room.slab(3.3, 0, 4.2, 0.12, 0.5, 0.12, 0x2a1a10); room.slab(4.2, 0, 4.2, 0.12, 0.5, 0.12, 0x2a1a10);
  room.slab(3.25, 0.5, 3.25, 1.1, 0.12, 1.1, 0x4a2a1a); room.slab(4.25, 0.5, 3.25, 0.12, 1.3, 1.1, 0x3a2416);
  // desk + chair
  room.slab(8, 1.1, 0, 3.4, 0.15, 1.4, 0x4a3020);
  for (const [x, z] of [[8.05, 0.05], [11.2, 0.05], [8.05, 1.2], [11.2, 1.2]]) room.slab(x, 0, z, 0.15, 1.1, 0.15, 0x3a2416);
  room.slab(9.1, 0.5, 1.9, 1, 0.12, 1, 0x3a2416); room.slab(9.1, 0.5, 2.8, 1, 1.1, 0.12, 0x3a2416);
  for (const [x, z] of [[9.15, 1.95], [9.95, 1.95], [9.15, 2.75], [9.95, 2.75]]) room.slab(x, 0, z, 0.1, 0.5, 0.1, 0x2a1a10);
  room.slab(8.3, 1.25, 0.2, 0.9, 0.03, 0.7, 0xd8cdb0); room.slab(10.3, 1.25, 0.3, 0.7, 0.03, 0.9, 0xcfc4a6);
  room.slab(10.4, 1.28, 0.5, 0.06, 0.02, 0.5, 0x8a6a30); // dividers on desk
  // kid's floor table + scattered drawings
  room.slab(5.2, 0.6, 5.6, 1.8, 0.12, 1.2, 0x5a3e28);
  for (const [x, z] of [[5.3, 5.65], [6.85, 5.65], [5.3, 6.65], [6.85, 6.65]]) room.slab(x, 0, z, 0.12, 0.6, 0.12, 0x3a2416);
  room.slab(5.5, 0.72, 5.8, 0.8, 0.02, 0.6, 0xd8ccae); room.slab(6.2, 0.72, 6.1, 0.6, 0.02, 0.5, 0xc9bc9a);
  room.slab(7.6, 0.01, 7.4, 0.7, 0.02, 0.5, 0xc9bc9a); room.slab(4.4, 0.01, 8.2, 0.6, 0.02, 0.45, 0xd8ccae);
  // rug
  room.slab(4.4, 0.0, 2.6, 3.6, 0.03, 4.8, 0x4a2a2a, 0.01); room.slab(4.6, 0.01, 2.8, 3.2, 0.03, 4.4, 0x5a3424, 0.01);
  // toy shelf
  room.slab(-0.6, 3.2, 7, 0.5, 0.1, 2.4, 0x3a2416);
  room.slab(-0.5, 3.3, 7.2, 0.3, 0.45, 0.3, 0x6a6a72); room.slab(-0.5, 3.3, 8.0, 0.3, 0.3, 0.6, 0x7a3a2a);
  const roomG = room.build(); scene.add(roomG);
  // sketchbook (on desk), separate so it can glow later
  const book = new Vox(5);
  book.slab(8.55, 1.25, 0.35, 0.5, 0.05, 0.62, 0xe8e0c8); book.slab(9.07, 1.25, 0.35, 0.5, 0.05, 0.62, 0xe0d6bc);
  book.slab(8.65, 1.31, 0.5, 0.3, 0.01, 0.02, 0x2a2420); book.slab(9.15, 1.31, 0.6, 0.3, 0.01, 0.02, 0x2a2420);
  book.slab(8.7, 1.31, 0.7, 0.2, 0.01, 0.02, 0x2a2420); book.slab(9.2, 1.31, 0.75, 0.22, 0.01, 0.02, 0x2a2420);
  scene.add(book.build());

  // floor (separate, so it can fall)
  const floor = new Vox(203);
  for (let x = -1; x < 13; x++) for (let z = -1; z < 11; z++) {
    const plank = [0x4a3424, 0x553c29, 0x4f3726, 0x463020][(z + 4) % 4];
    floor.add(x, -1, z, x % 4 === 0 ? new THREE.Color(plank).offsetHSL(0, 0, -0.03).getHex() : plank, 1, 0.025);
  }
  const floorG = floor.build(); scene.add(floorG);

  // the stair waiting below the floor
  const below = new Vox(204);
  const sector = Math.PI * 2 / 14;
  for (let i = 0; i < 26; i++) {
    const a0 = i * sector, y = -1.6 - i * 0.55;
    for (let rr = 0.8; rr < 3.2; rr += 0.5) for (let k = 0; k < 3; k++) {
      const a = a0 + (k / 3) * sector;
      below.add(6 + Math.cos(a) * rr - 0.25, y, 5 + Math.sin(a) * rr - 0.25, pick(r, [0x26262b, 0x2d2d33, 0x222226]), 0.5, 0.02);
    }
  }
  for (let y = -16; y < -1; y += 1) below.add(5.5, y, 4.5, 0x1d1d22, 1);
  for (let i = 0; i < 10; i++) below.light(6 + (r() - 0.5) * 2, -16.5 + r() * 0.5, 5 + (r() - 0.5) * 2, pick(r, [0xff6a20, 0xff9030]), 0.3, 1.8);
  const belowG = below.build(); scene.add(belowG);
  const ember = new THREE.PointLight(0xff6a24, 0, 30, 1.4); ember.position.set(6, -14, 5); scene.add(ember);

  // night outside the window
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: 0x0f1828, fog: false }));
  sky.position.set(6, 4.5, -4); scene.add(sky);
  const rainL = rain({ count: 500, box: [3.5, 1.5, -3.8, 8.5, 8, -1.3], speed: 14, opacity: 0.4 }); scene.add(rainL);

  // cast
  const mk = (o, pos, rotY) => { const g = figure(o); g.position.set(...pos); g.rotation.y = rotY; scene.add(g); return g; };
  const ELIAS = { coat: 0x3a3f4a, legs: 0x2a2a30, hair: 0x2e2016, hat: 0x4a3d30, seed: 11 };
  const cast = {
    theo: mk({ pose: 'lie', hair: 0x5a3a20, skin: 0xd8b498 }, [1.1, 1.53, 1.35], 0),
    mother: mk({ pose: 'sit', coat: 0x2f4a3c, legs: 0x2f4a3c, coatLong: true, hair: 0x5a3a24, skin: 0xd0ae92, seed: 12 }, [3.75, 0.12, 3.85], -Math.PI / 2),
    doctor: mk({ pose: 'stand', coat: 0x1c1c22, legs: 0x18181c, hair: 0x8a8a8a, skin: 0xc9a58a, seed: 13 }, [2.3, 0, 7.6], Math.PI - 0.35),
    elias: mk({ ...ELIAS, pose: 'stand' }, [8.8, 0, 6.2], -2.25),
    eliasDesk: mk({ ...ELIAS, hat: null, pose: 'sitDesk' }, [9.6, 0.12, 2.35], Math.PI),
    theoDesk: mk({ pose: 'slump', hair: 0x5a3a20, skin: 0xd8b498, coat: 0x5a6a7a, legs: 0x3a3a40, legH: 2, bodyH: 2, seed: 14 }, [6.1, 0.0, 7.6], Math.PI),
    eliasChair: mk({ ...ELIAS, hat: null, pose: 'sit' }, [3.75, 0.12, 3.85], -Math.PI / 2),
  };
  // doctor's bag, yarn
  const bits = new Vox(9);
  bits.slab(2.75, 0, 7.3, 0.55, 0.4, 0.3, 0x111114); bits.add(3.05, 0.0, 3.2, 0x8a2a2a, 0.25);
  const bitsG = bits.build(); scene.add(bitsG);
  cast.doctor.userData.extra = [bitsG];

  const hemi = new THREE.HemisphereLight(0x6a7aa0, 0x2a1a10, 1.1); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x7a90c0, 1.3); moon.position.set(6, 8, -10); moon.target.position.set(4, 0, 5); scene.add(moon, moon.target);
  const lamp = new THREE.PointLight(0xffa040, 10, 16, 1.4); lamp.position.set(3.0, 1.9, 0.9); scene.add(lamp);
  const fill = new THREE.PointLight(0x8a9ac8, 5, 18, 1.4); fill.position.set(9, 4, 9); scene.add(fill);
  let lampBase = 10;

  const shots = {
    room: { pos: [9.6, 4.4, 10.2], target: [2.8, 1.3, 3.6], to: { pos: [8.6, 3.9, 9.0], target: [2.8, 1.3, 3.6], dur: 16 } },
    desk: { pos: [9.85, 2.55, 2.9], target: [8.95, 1.2, 0.45], fov: 38, to: { pos: [9.6, 2.35, 2.5], target: [8.95, 1.2, 0.5], dur: 16 } },
    memory: { pos: [13.4, 4.2, 8.8], target: [7.8, 0.9, 4.9], to: { pos: [12.4, 3.7, 8.2], target: [7.8, 0.95, 4.9], dur: 18 } },
    chair: { pos: [7.8, 2.8, 7.8], target: [2.4, 1.4, 3.2], to: { pos: [7.0, 2.5, 7.0], target: [2.4, 1.4, 3.2], dur: 16 } },
    fall: { pos: [9.6, 7.2, 11.2], target: [5.6, -2.5, 4.8], to: { pos: [8.2, 3.2, 8.4], target: [6, -11, 5], dur: 10 } },
  };

  let collapse = null;
  const actions = {
    flash: async () => {
      sky.material.color.set(0xb0c4ff);
      await animate(0.7, e => sky.material.color.lerpColors(new THREE.Color(0xb0c4ff), new THREE.Color(0x0f1828), e), ease.out);
    },
    collapse: () => {
      const mesh = floorG.userData.solid, list = floorG.userData.solidList;
      const n = list.length, base = list.map(v => V3(v[0], v[1], v[2]));
      const delay = base.map(p => 0.25 + Math.hypot(p.x - 4.5, p.z - 4.5) * 0.09 + r() * 0.35);
      const spin = base.map(() => V3(r() - 0.5, r() - 0.5, r() - 0.5).normalize());
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V3(1, 1, 1), p = V3();
      collapse = { t: 0, step(dt) {
        this.t += dt;
        for (let i = 0; i < n; i++) {
          const k = Math.max(0, this.t - delay[i]);
          p.copy(base[i]); p.y -= 0.5 * 16 * k * k;
          q.setFromAxisAngle(spin[i], k * 2.2);
          const sc = Math.max(0.001, 1 - k * 0.25); s.set(sc, sc, sc);
          m.compose(p, q, s); mesh.setMatrixAt(i, m);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (this.t > 5) { floorG.visible = false; collapse = null; }
      } };
      animate(3.5, e => { ember.intensity = 30 * e; lampBase = lerp(10, 3, e); }, ease.inOut);
    },
  };

  function setCast(names) {
    for (const [k, g] of Object.entries(cast)) {
      const on = names.includes(k);
      g.visible = on; (g.userData.extra || []).forEach(x => (x.visible = on));
    }
  }
  return {
    scene, shots, actions, cast, setCast,
    post: { bloom: [0.8, 0.55, 0.6], exposure: 1.6 },
    mood(name) {
      const memory = name === 'memory';
      const l0 = lampBase, h0 = hemi.intensity; animate(1.2, e => { lampBase = lerp(l0, memory ? 16 : 10, e); hemi.intensity = lerp(h0, memory ? 1.4 : 1.1, e); });
    },
    reset() {
      floorG.visible = true; collapse = null; ember.intensity = 0; lampBase = 10;
      const mesh = floorG.userData.solid, list = floorG.userData.solidList, m = new THREE.Matrix4();
      list.forEach((v, i) => { m.makeTranslation(v[0], v[1], v[2]); mesh.setMatrixAt(i, m); });
      mesh.instanceMatrix.needsUpdate = true;
    },
    update(t, dt) {
      rainL.userData.update(dt); flicker(lamp, lampBase, t, 0.8, 0.22);
      if (collapse) collapse.step(dt);
      if (ember.intensity > 0) flicker(ember, ember.intensity, t, 0.5, 0.1);
      cast.mother.rotation.z = Math.sin(t * 1.3) * 0.015;
    },
  };
}

// ═════════════════════════════════════════ STAIR ═════════════════════════════════════════
const SECT = Math.PI * 2 / 16, STEP_H = 0.5, STEP_R = 3.3;
const stepAngle = i => (i + 0.5) * SECT;
const stepPos = i => V3(Math.cos(stepAngle(i)) * STEP_R, -i * STEP_H, Math.sin(stepAngle(i)) * STEP_R);

export function buildStair() {
  const scene = baseScene(0x060608, 0x060608, 0.04);
  const r = rng(303);
  const v = new Vox(303);
  for (let gx = -5; gx < 5; gx += 0.5) for (let gz = -5; gz < 5; gz += 0.5) {
    const cx = gx + 0.25, cz = gz + 0.25, rad = Math.hypot(cx, cz);
    if (rad < 1.4 || rad > 5.1) continue;
    let a = Math.atan2(cz, cx); if (a < 0) a += Math.PI * 2;
    const sec = Math.floor(a / SECT);
    const edge = (a / SECT - sec) < 0.18;
    for (let T = 0; T < 5; T++) {
      const i = T * 16 + sec; if (i >= 70) continue;
      const y = -i * STEP_H - 0.5;
      v.add(gx, y, gz, edge ? 0x1e1e22 : pick(r, [0x34343a, 0x303036, 0x2c2c31]), 0.5, 0.03);
      v.add(gx, y - 0.5, gz, 0x1f1f23, 0.5, 0.02);
    }
  }
  const candles = [];
  for (let y = -37; y < 5; y++) {
    for (let k = 0; k < 44; k++) {
      const a = k / 44 * Math.PI * 2, rad = 5.8 + (r() < 0.3 ? 0.6 : 0);
      if (r() < 0.04) continue;
      v.add(Math.cos(a) * rad - 0.5, y, Math.sin(a) * rad - 0.5, pick(r, [0x1e1e22, 0x232327, 0x29292e, 0x1a1a1d]), 1, 0.03);
    }
  }
  for (let i = 4; i < 70; i += 7) {
    const a = stepAngle(i) + 0.2, y = -i * STEP_H + 1.1;
    v.light(Math.cos(a) * 5.25 - 0.08, y, Math.sin(a) * 5.25 - 0.08, 0xffa050, 0.16, 2.2);
    v.slab(Math.cos(a) * 5.25 - 0.12, y - 0.12, Math.sin(a) * 5.25 - 0.12, 0.24, 0.12, 0.24, 0x2a2a2a);
    candles.push(V3(Math.cos(a) * 4.9, y + 0.2, Math.sin(a) * 4.9));
  }
  scene.add(v.build());

  // carved names
  const names = [[2, 'ADA WHITCOMBE'], [4, 'SAMUEL ORNE'], [6, 'LUCY BRANDT'], [9, 'JONAH PRATT'], [13, 'M. ELDRIDGE'], [21, 'CORA VANE'], [30, 'H. SALTONSTALL'], [36, 'BEN OKAFOR']];
  const decal = (i, text, color, opacity, glow) => {
    const { tex } = textTexture(text, { font: '600 70px "IM Fell English SC", Georgia, serif', color, glow, w: 1024, h: 128 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: !glow }));
    const p = stepPos(i); m.position.set(p.x, p.y + 0.012, p.z);
    m.rotation.order = 'YXZ'; m.rotation.y = -stepAngle(i); m.rotation.x = -Math.PI / 2;
    scene.add(m); return m;
  };
  names.forEach(([i, t]) => decal(i, t, '#9a9184', 0.55));
  const theo = decal(39, 'THEO HALE', '#ffd9a0', 0, 'rgba(255,170,80,0.9)');
  theo.rotation.y += Math.PI;
  theo.material.color.setScalar(1.6);

  const dust = particles({
    count: 70, color: 0xffe2b0, size: 0.07, blending: THREE.AdditiveBlending,
    spawn(P, i, first) { const p = stepPos(39); P.pos.set([p.x + (r() - 0.5) * 2, p.y + r() * 0.3, p.z + (r() - 0.5) * 2], i * 3); P.vel.set([(r() - 0.5) * 0.1, 0.12 + r() * 0.2, (r() - 0.5) * 0.1], i * 3); P.life[i] = 3 + r() * 3; P.age[i] = first ? r() * 3 : 0; },
    step(P, i) { const k = P.age[i] / P.life[i]; return Math.sin(k * Math.PI) * 0.8 * dustAmt; },
  });
  let dustAmt = 0; scene.add(dust);

  const elias = figure({ coat: 0x3a3f4a, legs: 0x2a2a30, hair: 0x2e2016, hat: 0x4a3d30, seed: 11 });
  scene.add(elias);
  const placeElias = (f) => { const i = f; const p = stepPos(i); elias.position.copy(p); const a = stepAngle(i); elias.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); };
  placeElias(2);

  const hemi = new THREE.HemisphereLight(0x7a88aa, 0x2a1a10, 1.6); scene.add(hemi);
  const below = new THREE.PointLight(0xff7a30, 60, 50, 1.2); below.position.set(0, -36, 0); scene.add(below);
  const above = new THREE.PointLight(0x7a8cc0, 6, 22, 1.5); above.position.set(0, 4, 0); scene.add(above);
  const carry = new THREE.PointLight(0xffc890, 12, 16, 1.2); scene.add(carry);
  const nameLight = new THREE.PointLight(0xffb070, 2, 7, 1.4); const np = stepPos(39); nameLight.position.set(np.x, np.y + 0.8, np.z); scene.add(nameLight);

  const cyl = (r_, a, y, tr, ta, ty, fov) => ({ cyl: { r: r_, a, y, tr, ta, ty }, fov });
  const shots = {
    top: cyl(1.2, -0.6, 4.2, 2.6, 1.3, -3.2, 62),
    fortieth: cyl(2.0, stepAngle(39) - 0.55, -16.2, 3.4, stepAngle(39), -19.5, 54),
  };
  let eliasStep = 2, eliasTarget = 2;
  const actions = {
    walkTo(i, dur = 3.6) { const from = eliasStep; return animate(dur, e => { eliasStep = lerp(from, i, e); }, ease.inOut); },
    theoName: async () => {
      actions.walkTo(37, 3.6);
      await wait(2.6);
      animate(2.4, e => { theo.material.opacity = e; nameLight.intensity = 2 + 4 * e; dustAmt = e; }, ease.inOut);
    },
  };
  return {
    scene, shots, actions, cast: {},
    post: { bloom: [0.9, 0.6, 0.55], exposure: 1.5 },
    reset() { eliasStep = 2; theo.material.opacity = 0; nameLight.intensity = 2; dustAmt = 0; },
    update(t, dt, cam) {
      placeElias(eliasStep);
      elias.position.y += Math.abs(Math.sin(eliasStep * Math.PI)) * 0.06;
      carry.position.copy(cam.position).add(V3(0, -0.3, 0));
      dust.userData.update(dt);
      flicker(below, 60, t, 0.4, 0.15);
    },
  };
}

// ═════════════════════════════════════════ EMBER VAULT ═════════════════════════════════════════
export function buildVault() {
  const scene = baseScene(0x0a0605, 0x0e0806, 0.022);
  const r = rng(404);
  const v = new Vox(404);
  const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
  for (let x = -16; x < 16; x++) for (let z = -16; z < 16; z++) for (let y = 0; y < 15; y++) {
    const d = Math.hypot(x + 0.5, (y + 0.5) * 1.18, z + 0.5) + (hash(x, y, z) - 0.5) * 1.3;
    if (d < 13.2 || d > 14.8) continue;
    if (z < -8 && y > 2 && y < 12 && Math.abs(x + 0.5) < 2.6) continue; // the stair opening
    v.add(x, y, z, pick(r, [0x26252a, 0x2f2c30, 0x1f1e22, 0x2a2624]), 1, 0.03);
  }
  for (let x = -14; x < 14; x++) for (let z = -14; z < 14; z++) {
    const d = Math.hypot(x + 0.5, z + 0.5); if (d > 13.8) continue;
    const ash = d < 5 ? pick(r, [0x4a4642, 0x544f4a, 0x3e3b38]) : pick(r, [0x2c2a28, 0x302d2a, 0x262422]);
    v.add(x, -1, z, ash, 1, 0.03);
  }
  // stair coming in from the back
  for (let i = 0; i < 14; i++) v.slab(-1.8, 11 - i * 0.8, -15.5 + i * 0.55, 3.6, 0.45, 0.6, pick(r, [0x34343a, 0x2c2c31]));
  // basin on legs
  for (const a of [0, 2.09, 4.19]) v.slab(Math.cos(a) * 1.1 - 0.12, 0, Math.sin(a) * 1.1 - 0.12, 0.24, 1.0, 0.24, 0x121214);
  for (let gx = -2; gx < 2; gx += 0.5) for (let gz = -2; gz < 2; gz += 0.5) {
    const d = Math.hypot(gx + 0.25, gz + 0.25);
    if (d < 1.95) v.add(gx, 1.0, gz, 0x18181b, 0.5, 0.03);
    if (d > 1.45 && d < 1.95) v.add(gx, 1.5, gz, 0x1d1d20, 0.5, 0.03);
  }
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.28, d = r() * 1.2;
    v.light(Math.cos(a) * d - 0.15, 1.5 + r() * 0.3, Math.sin(a) * d - 0.15, pick(r, [0xff5a1a, 0xff7a24, 0xffa040, 0xd03a10]), 0.3 + r() * 0.15, 1.6 + r());
  }
  // stones to sit on
  v.slab(-4.0, 0, 0.1, 1.2, 0.5, 1.2, 0x2a2826); v.slab(2.8, 0, 0.3, 1.2, 0.5, 1.2, 0x2a2826);
  scene.add(v.build());

  const warden = (x, z, rot, coat, seed) => {
    const g = figure({ pose: 'sit', coat, legs: coat, coatLong: true, hair: 0x9a948c, skin: 0xb8a08a, beard: 0x8e8a84, seed });
    g.scale.setScalar(1.3); g.position.set(x, 0.62, z); g.rotation.y = rot; scene.add(g); return g;
  };
  const oril = warden(-3.4, 0.7, Math.PI / 2, 0x3d1f1a, 21);
  const saith = warden(3.4, 0.9, -Math.PI / 2, 0x2f2622, 22);

  const smokeTex = softDot(64, 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)');
  const beard = (w, dir) => particles({
    count: 120, color: 0x9a948c, size: 0.55, tex: smokeTex,
    spawn(P, i, first) {
      const base = V3(w.position.x + dir * 0.45, 2.55, w.position.z);
      P.pos.set([base.x + (r() - 0.5) * 0.3, base.y + (r() - 0.5) * 0.15, base.z + (r() - 0.5) * 0.3], i * 3);
      P.vel.set([dir * 0.05 + (r() - 0.5) * 0.08, 0.28 + r() * 0.25, (r() - 0.5) * 0.08], i * 3);
      P.life[i] = 4 + r() * 3; P.age[i] = first ? r() * 6 : 0;
    },
    step(P, i, dt) { const k = P.age[i] / P.life[i]; P.vel[i * 3] += Math.sin(P.age[i] * 1.3 + i) * 0.02 * dt; return (1 - k) * Math.min(1, k * 5) * 0.38; },
  });
  const b1 = beard(oril, 1), b2 = beard(saith, -1); scene.add(b1, b2);
  const sparks = particles({
    count: 90, color: 0xffa040, size: 0.09, blending: THREE.AdditiveBlending,
    spawn(P, i, first) { P.pos.set([(r() - 0.5) * 1.6, 1.8, (r() - 0.5) * 1.6], i * 3); P.vel.set([(r() - 0.5) * 0.3, 0.6 + r() * 1.4, (r() - 0.5) * 0.3], i * 3); P.life[i] = 1.5 + r() * 2.5; P.age[i] = first ? r() * 3 : 0; },
    step(P, i, dt) { const k = P.age[i] / P.life[i]; P.vel[i * 3] += (r() - 0.5) * dt; return (1 - k) * 1.2; },
  });
  scene.add(sparks);

  const elias = figure({ coat: 0x3a3f4a, legs: 0x2a2a30, hair: 0x2e2016, hat: 0x4a3d30, seed: 11, pose: 'hold' });
  elias.position.set(0, 0, -6.2); scene.add(elias);
  const bookV = new Vox(6); bookV.slab(0.05, 1.1, -5.35, 0.36, 0.06, 0.44, 0xe8dcc0);
  const book = bookV.build(); scene.add(book);
  const bookGlow = new Vox(7); bookGlow.lightSlab(0.06, 1.165, -5.34, 0.34, 0.012, 0.42, 0xffc070, 1.0);
  const bookG = bookGlow.build(); bookG.visible = false; scene.add(bookG);
  const bookLight = new THREE.PointLight(0xffc070, 0, 3, 1.8); bookLight.position.set(0.2, 1.3, -5.2); scene.add(bookLight);

  // words in the ash
  const ashCanvas = textTexture('', { w: 1024, h: 160 });
  const ash = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.53), new THREE.MeshBasicMaterial({ map: ashCanvas.tex, transparent: true, depthWrite: false, opacity: 0.95 }));
  ash.rotation.x = -Math.PI / 2; ash.rotation.z = Math.PI / 2; ash.position.set(1.9, 0.02, 2.2); scene.add(ash);
  const writeAsh = (text, k) => {
    const { canvas, ctx, tex } = ashCanvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, canvas.width * k, canvas.height); ctx.clip();
    ctx.font = 'italic 76px "IM Fell English", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,140,60,0.6)'; ctx.shadowBlur = 18; ctx.fillStyle = '#d9cfc0';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2); ctx.restore(); tex.needsUpdate = true;
  };

  const hemi = new THREE.HemisphereLight(0x7a6870, 0x1a0e08, 1.1); scene.add(hemi);
  const fire = new THREE.PointLight(0xff7030, 30, 34, 1.4); fire.position.set(0, 3, 0); scene.add(fire);
  const rim = new THREE.PointLight(0x7a8aba, 8, 26, 1.3); rim.position.set(0, 10, -12); scene.add(rim);

  const shots = {
    arrive: { pos: [0, 7.2, -12.5], target: [0, 1.4, 1], to: { pos: [0, 5.6, -10.2], target: [0, 1.4, 1], dur: 18 } },
    wardens: { pos: [0.2, 3.1, -6.4], target: [0, 1.9, 1.2], fov: 52, to: { pos: [0.1, 2.9, -5.6], target: [0, 1.9, 1.2], dur: 16 } },
    ember: { pos: [-0.6, 4.3, 3.4], target: [1.6, 0.3, 2.2], to: { pos: [-0.2, 3.8, 3.2], target: [1.7, 0.4, 2.2], dur: 14 } },
    book: { pos: [2.6, 2.6, -2.6], target: [0.1, 1.2, -5.8], fov: 46, to: { pos: [2.2, 2.4, -3.0], target: [0.1, 1.2, -5.8], dur: 14 } },
  };
  let fireBase = 30;
  const actions = {
    ashWrite: (state) => {
      const text = { home: 'To bring him home.', see: 'To see what he saw.', call: 'Because I was called.' }[state.purpose] || 'To bring him home.';
      writeAsh(text, 0);
      return wait(1.2).then(() => animate(3.2, e => writeAsh(text, e), ease.inOut));
    },
    bookGlow: () => {
      bookG.visible = true;
      return animate(2.5, e => { bookLight.intensity = 1.6 * e; }, ease.inOut);
    },
    flare: () => animate(1.4, (e, raw) => { fireBase = 30 + 30 * Math.sin(raw * Math.PI); }, ease.linear),
  };
  return {
    scene, shots, actions, cast: {},
    post: { bloom: [1.0, 0.65, 0.5], exposure: 1.45 },
    reset() { writeAsh('', 0); bookG.visible = false; bookLight.intensity = 0; },
    update(t, dt) {
      flicker(fire, fireBase, t, 1, 0.25); b1.userData.update(dt); b2.userData.update(dt); sparks.userData.update(dt);
      if (bookG.visible && bookLight.intensity > 1.5) bookLight.intensity = 1.6 + Math.sin(t * 3) * 0.4;
    },
  };
}

// ═════════════════════════════════════════ HOURGLASS STRAND ═════════════════════════════════════════
export function buildStrand() {
  const sky = gradientSky([[0, '#03050c'], [0.42, '#0c1626'], [0.62, '#22323f'], [0.7, '#2f4150'], [1, '#0b0f16']]);
  const scene = baseScene(sky, 0x1b2733, 0.016);
  const r = rng(505);
  const v = new Vox(505);
  const H = (x, z) => Math.max(-1, Math.floor((z + 2) * 0.2 + 0.7 * Math.sin(x * 0.27) * Math.cos(z * 0.19) + 0.4));
  const pools = [
    { x: -9, z: 3.5, rad: 1.6 }, { x: -3.5, z: 6.5, rad: 1.3 }, { x: 1.5, z: 4.5, rad: 1.9, memory: true },
    { x: 8, z: 2.6, rad: 1.4 }, { x: 13, z: 5.5, rad: 1.5 }, { x: 5.5, z: 9.5, rad: 1.5, empty: true },
  ];
  const inPool = (x, z) => pools.find(p => Math.hypot(x + 0.5 - p.x, z + 0.5 - p.z) < p.rad);
  for (let x = -40; x < 40; x++) for (let z = -12; z < 34; z++) {
    let h = H(x, z); const pool = inPool(x, z); if (pool) h -= 1;
    const wet = h <= 0;
    const col = pool ? (pool.empty ? 0x3a3631 : 0x4a4a44) : wet ? pick(r, [0x5e5547, 0x575043, 0x645a4a]) : pick(r, [0x8a7d62, 0x7d725b, 0x96896b, 0x847859]);
    v.add(x, h - 1, z, col, 1, 0.04);
    v.add(x, h - 2, z, 0x5a5242, 1, 0.02);
  }
  // rocks + lighthouse
  for (let i = 0; i < 60; i++) { const x = -30 + r() * 8, z = -6 + r() * 10; v.add(Math.floor(x), H(x, z) + Math.floor(r() * 2), Math.floor(z), pick(r, [0x2a2a2e, 0x333338, 0x24242a])); }
  for (let y = 0; y < 15; y++) for (let x = -3; x < 3; x++) for (let z = -3; z < 3; z++) {
    const d = Math.hypot(x + 0.5, z + 0.5); const rad = y > 12 ? 1.6 : 2.4 - y * 0.04;
    if (d > rad || (d < rad - 1.2 && y < 13)) continue;
    const col = y >= 12 && y < 14 ? 0x1a2228 : y === 14 ? 0x1a1a1e : (Math.floor(y / 2) % 2 ? 0x8a8a86 : 0x4a2a2a);
    v.add(-27 + x, 1 + y, -1 + z, col, 1, 0.03);
  }
  // scattered clocks (static)
  const clock = (vx, x, y, z, s = 1) => {
    vx.slab(x, y, z, 0.42 * s, 0.08 * s, 0.42 * s, 0x8a6a30); vx.slab(x + 0.04 * s, y + 0.07 * s, z + 0.04 * s, 0.34 * s, 0.03 * s, 0.34 * s, 0xe8e2d0);
    vx.slab(x + 0.2 * s, y + 0.1 * s, z + 0.08 * s, 0.03 * s, 0.01, 0.14 * s, 0x111111); vx.slab(x + 0.2 * s, y + 0.1 * s, z + 0.2 * s, 0.12 * s, 0.01, 0.03 * s, 0x111111);
  };
  for (let i = 0; i < 34; i++) { const x = -20 + r() * 40, z = -1 + r() * 16; if (inPool(x, z)) continue; clock(v, x, H(x, z), z, 0.8 + r() * 0.8); }
  // hook scratches and a burnt match in the empty pool
  const ep = pools.find(p => p.empty), eh = H(ep.x, ep.z) - 1;
  for (let k = 0; k < 3; k++) for (let s = 0; s < 6; s++) v.slab(ep.x - 0.9 + s * 0.28, eh + 0.01, ep.z - 0.5 + k * 0.38 + s * 0.05, 0.3, 0.02, 0.06, 0x15130f);
  v.slab(ep.x + 0.4, eh + 0.02, ep.z + 0.6, 0.38, 0.05, 0.05, 0x6a4a2a); v.slab(ep.x + 0.38, eh + 0.02, ep.z + 0.59, 0.07, 0.07, 0.07, 0x111111);
  scene.add(v.build());

  // pool surfaces
  const poolMeshes = pools.filter(p => !p.empty).map(p => {
    let tex = null;
    if (p.memory) {
      const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
      x.translate(128, 128); x.strokeStyle = '#ffd9a0'; x.lineWidth = 4; x.lineCap = 'round';
      for (let k = 0; k < 8; k++) { x.save(); x.rotate(k * Math.PI / 4); x.beginPath(); x.moveTo(0, 0); x.lineTo(k % 2 ? 9 : 14, -30); x.lineTo(0, k % 2 ? -58 : -96); x.lineTo(k % 2 ? -9 : -14, -30); x.closePath(); x.stroke(); x.restore(); }
      x.beginPath(); x.arc(0, 0, 70, 0, Math.PI * 2); x.stroke(); x.font = '600 34px Georgia'; x.fillStyle = '#ffd9a0'; x.textAlign = 'center'; x.fillText('N', 0, -104);
      tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    }
    const m = new THREE.Mesh(new THREE.CircleGeometry(p.rad * 0.92, 28), new THREE.MeshBasicMaterial({ color: p.memory ? 0x5a8a96 : 0x3f7080, transparent: true, opacity: 0.55, map: tex, toneMapped: false, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(p.x, H(p.x, p.z) - 1 + 0.75, p.z); scene.add(m); m.userData.pool = p; return m;
  });
  const memPool = poolMeshes.find(m => m.userData.pool.memory);
  const memLight = new THREE.PointLight(0xffc080, 0, 8, 1.5); memLight.position.copy(memPool.position).add(V3(0, 1.2, 0)); scene.add(memLight);

  // the sea + stars
  const sea = water(260, 0x7f8a99, 0.35); sea.position.z = -100; scene.add(sea);
  const starG = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 500; i++) { const a = r() * Math.PI * 2, e = 0.12 + r() * 1.2; sp.push(Math.cos(a) * Math.cos(e) * 150, Math.sin(e) * 150, Math.sin(a) * Math.cos(e) * 150 - 40); }
  starG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 0.35, fog: false, transparent: true, opacity: 0.7 })));

  // scuttling clocks
  const crawlers = [];
  for (let i = 0; i < 7; i++) {
    const cv = new Vox(600 + i); clock(cv, -0.21, 0.12, -0.21, 1.1);
    for (const lx of [-0.3, 0.25]) for (const lz of [-0.15, 0.1]) cv.slab(lx, 0, lz, 0.06, 0.14, 0.06, 0x6a5a3a);
    const g = cv.build(); const x = -12 + i * 4 + r() * 2, z = 0.6 + r() * 1.5;
    g.position.set(x, H(x, z), z); g.userData = { x0: x, ph: r() * 6, sp: 0.5 + r() * 0.7 }; scene.add(g); crawlers.push(g);
  }

  // Mother Quill
  const q = new Vox(700);
  for (let x = -5; x < 5; x++) for (let y = 0; y < 4; y++) for (let z = -4; z < 4; z++) {
    const d = Math.hypot((x + 0.5) / 5, (y + 0.5 - 1.5) / 2.2, (z + 0.5) / 4);
    if (d < 1) q.add(x * 0.22, 0.75 + y * 0.22, z * 0.22, (y === 3 && (x + z) % 3 === 0) ? 0xa89c88 : 0xcfc6b4, 0.22, 0.04);
  }
  for (let k = 0; k < 4; k++) for (const side of [-1, 1]) {
    const z = -0.7 + k * 0.45;
    for (let s = 0; s < 4; s++) q.slab(side * (1.05 + s * 0.22) - 0.07, 0.95 - Math.max(0, s - 1) * 0.3, z, 0.16, 0.16, 0.16, 0xb8ad98);
    q.slab(side * 1.75 - 0.06, 0, z, 0.12, 0.5, 0.12, 0xa89c88);
  }
  for (const sx of [-0.35, 0.3]) { q.slab(sx, 1.6, 0.4, 0.1, 0.8, 0.1, 0xcfc6b4); q.add(sx - 0.06, 2.4, 0.34, 0x0a0a0c, 0.22, 0); q.light(sx - 0.02, 2.5, 0.55, 0xffffff, 0.04, 2); }
  const quillBody = q.build();
  const claws = [];
  for (const side of [-1, 1]) {
    const c = new Vox(710); c.slab(-0.22, -0.18, 0, 0.44, 0.36, 0.7, 0xd8cfbd); c.slab(-0.22, 0.2, 0.25, 0.44, 0.14, 0.55, 0xd8cfbd);
    const cg = c.build(); const pivot = new THREE.Group(); pivot.add(cg); pivot.position.set(side * 0.75, 1.2, 0.85); claws.push(pivot);
  }
  const quill = new THREE.Group(); quill.add(quillBody, ...claws);
  const QX = 6.8, QZ = 6.8; const qh = H(QX, QZ);
  quill.position.set(QX, qh - 3, QZ); quill.rotation.y = -2.5; quill.visible = false; scene.add(quill);
  const sandBurst = particles({
    count: 80, color: 0xa89878, size: 0.18, tex: softDot(32),
    spawn(P, i, first) { P.pos.set([QX + (r() - 0.5) * 2.4, qh + 0.1, QZ + (r() - 0.5) * 2.4], i * 3); P.vel.set([(r() - 0.5) * 1.5, 1 + r() * 2.5, (r() - 0.5) * 1.5], i * 3); P.life[i] = 0.8 + r() * 0.8; P.age[i] = first ? 99 : 0; },
    step(P, i, dt) { P.vel[i * 3 + 1] -= 6 * dt; return (1 - P.age[i] / P.life[i]) * 0.9; },
  });
  sandBurst.userData.P.active = false; scene.add(sandBurst);

  const elias = figure({ coat: 0x3a3f4a, legs: 0x2a2a30, hair: 0x2e2016, hat: 0x4a3d30, seed: 11 });
  elias.position.set(3.2, H(3.2, 8.6), 8.6); elias.rotation.y = Math.PI - 0.5; scene.add(elias);

  // backward footprints leading inland
  const fp = []; let px = 4.2, pz = 11;
  for (let i = 0; i < 26; i++) { px += Math.sin(i * 0.4) * 0.15 + 0.08; pz += 0.75; fp.push([px + (i % 2 ? 0.22 : -0.22), H(px, pz), pz]); }
  const fpMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.04, 0.4), new THREE.MeshLambertMaterial({ color: 0x3e382c }), fp.length);
  fp.forEach(([x, y, z], i) => fpMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, y + 0.01, z)));
  fpMesh.count = 0; scene.add(fpMesh);
  const mist = mistLayer({ count: 26, area: [70, 20], y: [2, 6], color: 0x8a96a6, opacity: 0.14, seed: 51 }); mist.position.set(0, 2, 26); scene.add(mist);

  const hemi = new THREE.HemisphereLight(0x9aaacc, 0x3a3020, 1.6); scene.add(hemi);
  const dirL = new THREE.DirectionalLight(0xa0b5d8, 0.9); dirL.position.set(-20, 10, -40); scene.add(dirL);
  const qLight = new THREE.PointLight(0xa8c0ff, 0, 7, 1.5); qLight.position.set(QX - 1.5, qh + 2.5, QZ + 1.5); scene.add(qLight);

  const at = (x, z, dy) => [x, H(x, z) + dy, z];
  const shots = {
    wide: { pos: at(15, 24, 6), target: [-2, 0.6, -2], to: { pos: at(11, 21, 5), target: [-2, 0.6, -2], dur: 20 } },
    pools: { pos: at(-1.4, 10.4, 3.3), target: at(1.6, 4.4, -0.6), to: { pos: at(-0.8, 9.6, 3.0), target: at(1.6, 4.4, -0.6), dur: 14 } },
    empty: { pos: at(8.2, 13.2, 2.8), target: at(5.4, 9.4, -0.6), to: { pos: at(7.4, 12.4, 2.4), target: at(5.4, 9.4, -0.6), dur: 14 } },
    quill: { pos: at(0.8, 13.5, 2.6), target: at(6.6, 7, 1.0), to: { pos: at(1.6, 12.4, 2.3), target: at(6.6, 7, 1.0), dur: 14 } },
    quillClose: { pos: at(4.0, 10.6, 1.8), target: at(6.6, 7.0, 1.2), fov: 44, to: { pos: at(4.4, 10.0, 1.7), target: at(6.6, 7.0, 1.2), dur: 14 } },
    inland: { pos: at(2.4, 5.0, 2.6), target: at(7, 23, 1.5), to: { pos: at(3.2, 8, 2.6), target: at(7, 24, 1.5), dur: 14 } },
  };
  let crawl = true;
  const actions = {
    memoryPool: () => wait(1.5).then(() => animate(2.5, e => { memPool.material.color.lerpColors(new THREE.Color(0x5a8a96), new THREE.Color(0xffd0a0), e); memPool.material.opacity = 0.55 + 0.35 * e; memLight.intensity = 6 * e; })),
    quillRise: () => {
      quill.visible = true; sandBurst.userData.P.active = true; for (let i = 0; i < 80; i++) sandBurst.userData.P.age[i] = 99;
      setTimeout(() => (sandBurst.userData.P.active = false), 1400);
      return animate(2.2, e => { quill.position.y = lerp(qh - 3, qh, e); qLight.intensity = 3 * e; }, ease.out);
    },
    hourOutcome: (s) => {
      if (s.hour === 'trade') {
        const c0 = memPool.material.color.clone();
        return animate(3, e => { memPool.material.color.lerpColors(c0, new THREE.Color(0x4a4a4a), e); memPool.material.opacity = lerp(0.9, 0.5, e); memLight.intensity = lerp(6, 0, e); });
      }
      return wait(2.5).then(() => animate(2.4, e => { quill.position.y = lerp(qh, qh - 3, e); }, ease.in)).then(() => (quill.visible = false));
    },
    footprints: () => animate(4, e => { fpMesh.count = Math.round(e * fp.length); }, ease.linear),
  };
  return {
    scene, shots, actions, cast: {},
    post: { bloom: [0.8, 0.6, 0.6], exposure: 1.4 },
    reset() { quill.visible = false; quill.position.y = qh - 3; fpMesh.count = 0; memLight.intensity = 0; memPool.material.color.set(0x5a8a96); memPool.material.opacity = 0.55; },
    restore(s) { // re-apply outcomes when resuming mid-chapter
      if (s.hour === 'trade') { memPool.material.color.set(0x4a4a4a); }
    },
    update(t, dt) {
      if (crawl) for (const c of crawlers) { const u = c.userData; c.position.x = u.x0 + Math.sin(t * u.sp + u.ph) * 1.6; c.position.y = H(c.position.x, c.position.z) + Math.abs(Math.sin(t * 9 * u.sp)) * 0.03; }
      if (quill.visible) { quill.position.y += Math.sin(t * 1.6) * 0.002; claws[0].rotation.x = Math.sin(t * 2.1) * 0.15; claws[1].rotation.x = Math.sin(t * 2.4 + 1) * 0.15; }
      sandBurst.userData.update(dt); mist.userData.update(t, dt);
      poolMeshes.forEach((m, i) => { if (m !== memPool || memLight.intensity < 0.1) m.material.opacity = (m === memPool ? 0.55 : 0.5) + Math.sin(t * 0.7 + i) * 0.06; });
    },
  };
}

// ═════════════════════════════════════════ MIRELIGHT FENS ═════════════════════════════════════════
export function buildFens() {
  const skyTex = {
    dusk: gradientSky([[0, '#05080c'], [0.5, '#121c24'], [0.68, '#25313a'], [1, '#0a0e12']]),
    night: gradientSky([[0, '#010203'], [0.6, '#06090c'], [1, '#020304']]),
    morning: gradientSky([[0, '#4d5864'], [0.6, '#8a949c'], [1, '#5c656c']]),
  };
  const scene = baseScene(skyTex.dusk, 0x26303a, 0.03);
  const r = rng(808);
  const v = new Vox(808);
  // boardwalk along a curve
  const path = new THREE.CatmullRomCurve3([V3(1, 0, 22), V3(2, 0, 12), V3(-0.5, 0, 4), V3(1.5, 0, -4), V3(4, 0, -12), V3(1, 0, -22), V3(-3, 0, -34)]);
  const P = t => path.getPointAt(t);
  const N = 220;
  for (let i = 0; i < N; i++) {
    const t = i / N, p = P(t), tan = path.getTangentAt(t);
    const side = V3(-tan.z, 0, tan.x);
    for (let k = -2; k <= 2; k++) v.slab(p.x + side.x * k * 0.32 - 0.16, 0.32, p.z + side.z * k * 0.32 - 0.16, 0.32, 0.12, 0.32, (i % 3 === 0) ? 0x3a2c20 : 0x45352a, 0.04);
    if (i % 8 === 0) for (const s of [-1, 1]) v.slab(p.x + side.x * s * 0.8 - 0.08, -1.5, p.z + side.z * s * 0.8 - 0.08, 0.16, 1.9, 0.16, 0x1e1812);
  }
  const onPath = (x, z, w = 1.4) => { for (let i = 0; i <= 80; i++) { const p = P(i / 80); if (Math.hypot(p.x - x, p.z - z) < w) return true; } return false; };
  // hummocks
  const islands = [];
  for (let i = 0; i < 34; i++) {
    const x = -38 + r() * 76, z = -60 + r() * 80, rad = 1 + r() * 3.5;
    if (onPath(x, z, rad + 1)) continue; islands.push([x, z, rad]);
    for (let gx = -rad; gx < rad; gx++) for (let gz = -rad; gz < rad; gz++) {
      if (Math.hypot(gx, gz) > rad) continue;
      v.add(Math.floor(x + gx), -0.78, Math.floor(z + gz), pick(r, [0x2a2620, 0x2f3a28, 0x33402b, 0x262a1f]), 1, 0.04);
    }
  }
  // Hollowmere stilt houses
  const huts = [[-14, -30], [-7, -38], [-21, -42], [10, -44]];
  for (const [hx, hz] of huts) {
    for (const [dx, dz] of [[0, 0], [3.6, 0], [0, 3.6], [3.6, 3.6]]) v.slab(hx + dx, -1, hz + dz, 0.3, 3.2, 0.3, 0x1e1812);
    v.slab(hx - 0.4, 2.2, hz - 0.4, 4.7, 0.25, 4.7, 0x3a2c20);
    v.fill(hx, 2.45, hz, hx + 4, 5.45, hz + 4, (x, y, z) => (x > hx && x < hx + 3 && z > hz && z < hz + 3 ? null : 0x2e241a));
    v.light(hx + 1, 3.4, hz + 3.9, 0xffa850, 0.8, 1.6); v.light(hx + 2.4, 3.4, hz + 3.9, 0xffa850, 0.8, 1.2);
    for (let k = 0; k < 3; k++) v.slab(hx - 0.5 + k * 0.4, 5.45 + k, hz - 0.5 + k * 0.4, 5 - k * 0.8, 1, 5 - k * 0.8, 0x1d1a16);
  }
  scene.add(v.build());

  // reeds
  const REEDS = 1700;
  const reeds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 1, 0.1), new THREE.MeshLambertMaterial({ color: 0xffffff }), REEDS);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), sv = V3(), pv = V3(), col = new THREE.Color();
  let ri = 0;
  while (ri < REEDS) {
    const isl = r() < 0.7 && islands.length ? pick(r, islands) : null;
    let x, z;
    if (isl) { const a = r() * 6.28, d = isl[2] * (0.6 + r() * 0.7); x = isl[0] + Math.cos(a) * d; z = isl[1] + Math.sin(a) * d; }
    else { const p = P(r()); const a = r() * 6.28, d = 1.3 + r() * 3; x = p.x + Math.cos(a) * d; z = p.z + Math.sin(a) * d; }
    if (onPath(x, z, 1.1)) continue;
    let h = 1 + r() * 2.3;
    if (onPath(x, z, 3.2)) h = 0.4 + r() * 0.7;
    e3.set((r() - 0.5) * 0.25, r() * 3, (r() - 0.5) * 0.25); q.setFromEuler(e3);
    pv.set(x, h / 2 - 0.2, z); sv.set(1, h, 1); m4.compose(pv, q, sv); reeds.setMatrixAt(ri, m4);
    col.set(pick(r, [0x2c3324, 0x3f3a26, 0x35402a, 0x4a4430, 0x262c1e])); reeds.setColorAt(ri, col); ri++;
  }
  scene.add(reeds);

  // lanterns
  const LAN = 720;
  const lanMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const lanterns = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), lanMat, LAN);
  const lan = [];
  while (lan.length < LAN) {
    const x = -42 + r() * 84, z = -70 + r() * 96;
    if (onPath(x, z, 3.2)) continue;
    const c = new THREE.Color(pick(r, [0xffa040, 0xffb860, 0xff9a3a, 0xffc878, 0xffd090])).multiplyScalar(0.9 + r() * 0.8);
    lan.push({ x, z, y: 0.45 + r() * 0.35, ph: r() * 6.28, rot: r() * 3, c, s: 0.7 + r() * 0.5, life: 1, gone: false });
  }
  lan.forEach((l, i) => lanterns.setColorAt(i, l.c));
  scene.add(lanterns);
  // a few lanterns sit right by the start of the path
  const startP = P(0.17);
  const dying = lan[0]; Object.assign(dying, { x: startP.x + 1.6, z: startP.z - 0.6, y: 0.55, s: 1 });

  // Elias, his own lantern, the Lamplighter
  const elias = figure({ coat: 0x3a3f4a, legs: 0x2a2a30, hair: 0x2e2016, hat: 0x4a3d30, seed: 11 });
  scene.add(elias);
  const own = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.27, 0.22), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe2b8).multiplyScalar(1.4), toneMapped: false }));
  scene.add(own);
  const ownLight = new THREE.PointLight(0xffd8a0, 3, 7, 1.5); scene.add(ownLight);

  const lampV = new Vox(900);
  lampV.slab(0.42, 0, 0.32, 0.09, 4.5, 0.09, 0x2a1d12);
  lampV.slab(0.42, 4.5, 0.32, 0.09, 0.09, 0.5, 0x3a3a3a); lampV.slab(0.42, 4.2, 0.74, 0.09, 0.38, 0.09, 0x3a3a3a);
  lampV.slab(0.36, 3.75, 0.66, 0.22, 0.06, 0.22, 0x222222);
  lampV.lightSlab(0.38, 3.45, 0.68, 0.18, 0.3, 0.18, 0xffc060, 2.4);
  const lamplighter = new THREE.Group();
  const lf = figure({ coat: 0x2a2a33, legs: 0x23232a, coatLong: true, legH: 4, bodyH: 4, hood: 0xa07c42, window: 0xffe2a0, pose: 'hold', seed: 31 });
  lamplighter.add(lf, lampV.build());
  scene.add(lamplighter); lamplighter.visible = false;
  const llLight = new THREE.PointLight(0xffc070, 3.5, 8, 1.6); llLight.position.set(0.5, 3.6, 0.8); lamplighter.add(llLight);
  const drip = particles({
    count: 24, color: 0xbfd6ff, size: 0.06, blending: THREE.AdditiveBlending,
    spawn(P2, i, first) { const w = lamplighter.localToWorld(V3(0.46, 4.15, 0.78)); P2.pos.set([w.x, w.y, w.z], i * 3); P2.vel.set([0, -0.2, 0], i * 3); P2.life[i] = 1.2 + r(); P2.age[i] = first ? r() * 2 : 0; },
    step(P2, i, dt) { P2.vel[i * 3 + 1] -= 4 * dt; return 0.8 * dripAmt; },
  });
  let dripAmt = 0; scene.add(drip);

  // the harvest skiff and two stilt-walking wardens
  const sk = new Vox(950);
  sk.slab(-2.3, -0.1, -0.8, 4.6, 0.45, 1.6, 0x2a2016); sk.slab(-2.6, 0.05, -0.55, 0.3, 0.3, 1.1, 0x2a2016);
  const cages = [];
  for (let k = 0; k < 3; k++) {
    const cx = -1.4 + k * 1.3;
    for (const [dx, dz] of [[0, 0], [0.7, 0], [0, 0.7], [0.7, 0.7]]) sk.slab(cx + dx - 0.35, 0.35, dz - 0.35, 0.06, 0.9, 0.06, 0x111214);
    sk.slab(cx - 0.35, 1.25, -0.35, 0.76, 0.06, 0.76, 0x111214);
    sk.lightSlab(cx - 0.12, 0.55, -0.12, 0.28, 0.34, 0.28, 0xffb050, 1.8);
    cages.push(cx);
  }
  const skiff = sk.build(); skiff.visible = false; scene.add(skiff);
  const skLight = new THREE.PointLight(0xffa040, 4, 9, 1.6); skLight.position.set(0, 1.2, 0); skiff.add(skLight);
  const wardens = [0, 1].map(k => {
    const g = new THREE.Group();
    const w = new Vox(960 + k);
    w.slab(-0.2, -1, 0, 0.12, 4.2, 0.12, 0x1a1612); w.slab(0.1, -1, 0, 0.12, 4.2, 0.12, 0x1a1612);
    w.slab(0.5, 3, 0.4, 0.07, 5, 0.07, 0x1a1612); w.slab(0.5, 8, 0.4, 0.07, 0.07, 0.5, 0x2a2a2a);
    g.add(w.build());
    const body = figure({ coat: 0x4a4d52, legs: 0x3a3c40, coatLong: true, hood: 0x3a3c40, seed: 970 + k, pose: 'hold' });
    body.position.y = 3.2; g.add(body); g.visible = false; scene.add(g); return g;
  });
  const flyer = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd090).multiplyScalar(3), toneMapped: false }));
  flyer.visible = false; scene.add(flyer);

  // campfire for morning
  const cf = new Vox(990);
  for (let i = 0; i < 9; i++) cf.light(-0.3 + r() * 0.5, 0.45 + r() * 0.2, -0.3 + r() * 0.5, pick(r, [0xff6a20, 0xff9a40, 0xffc060]), 0.18, 2);
  cf.slab(-0.45, 0.4, -0.05, 0.9, 0.12, 0.12, 0x2a1d12); cf.slab(-0.05, 0.4, -0.45, 0.12, 0.12, 0.9, 0x2a1d12);
  cf.slab(0.7, 0.44, 0.3, 0.12, 0.14, 0.12, 0xd8d0c0); cf.slab(0.9, 0.44, 0.1, 0.12, 0.14, 0.12, 0xd8d0c0);
  const camp = cf.build(); camp.visible = false; scene.add(camp);
  const campLight = new THREE.PointLight(0xff8a30, 0, 9, 1.6); campLight.position.set(0, 1.0, 0); camp.add(campLight);

  const mist = mistLayer({ count: 46, area: [90, 80], y: [0.2, 2.6], color: 0x9aa6b4, opacity: 0.1, seed: 81 }); mist.position.z = -20; scene.add(mist);
  const hemi = new THREE.HemisphereLight(0x7a8898, 0x1d1a14, 1.1); scene.add(hemi);
  const sea = water(320, 0x8a939c, 0.0); scene.add(sea);

  // positions along the path
  let eliasT = 0.17, eliasWalk = 0;
  const posAt = (t, off = 0) => { const p = P(t), tan = path.getTangentAt(t); return { p: V3(p.x - tan.z * off, 0.44, p.z + tan.x * off), tan }; };
  const face = (obj, tan, flip = false) => { obj.rotation.y = Math.atan2(tan.x, tan.z) + (flip ? Math.PI : 0); };
  const llState = { mode: 'hidden', t: 0.17, off: 0.75 };

  const e0 = posAt(0.17).p, e1 = posAt(0.42).p;
  const on = (t, off, y) => { const q2 = posAt(t, off).p; return [q2.x, y, q2.z]; };
  // A side-on shot of Elias and the Lamplighter, from the open side of the boardwalk.
  const llSpot = () => posAt(0.17, -1.1).p.add(V3(1.1, 0, -0.6));
  function twoShot(dist, y, slide, fov = 50) {
    const a = e0.clone(), b = llSpot(), mid = a.clone().add(b).multiplyScalar(0.5);
    const d = b.clone().sub(a).setY(0).normalize(), n = V3(-d.z, 0, d.x);
    if (n.dot(V3(0, 0, 1)) < 0) n.negate();
    const p = mid.clone().add(n.clone().multiplyScalar(dist)).add(d.clone().multiplyScalar(slide * dist));
    const p2 = mid.clone().add(n.clone().multiplyScalar(dist * 0.88)).add(d.clone().multiplyScalar(slide * dist));
    return { pos: [p.x, y, p.z], target: [mid.x, 1.5, mid.z], fov, to: { pos: [p2.x, y - 0.15, p2.z], target: [mid.x, 1.55, mid.z], dur: 16 } };
  }
  function campShot() {
    const fire = posAt(0.45, 1.6).p, el = posAt(0.43, 0).p, ll = posAt(0.455, -0.2).p.add(V3(1.6, 0, 0.6));
    const mid = fire.clone().add(el).add(ll).multiplyScalar(1 / 3);
    const tan = path.getTangentAt(0.44), n = V3(-tan.z, 0, tan.x);
    const p = mid.clone().add(n.clone().multiplyScalar(5.2)).add(tan.clone().multiplyScalar(-1.8));
    return { pos: [p.x, 2.8, p.z], target: [mid.x, 1.0, mid.z], to: { pos: [p.x * 0.97 + mid.x * 0.03, 2.6, p.z * 0.97 + mid.z * 0.03], target: [mid.x, 1.1, mid.z], dur: 16 } };
  }
  const shots = {
    wide: { pos: [9, 6.2, 26], target: [0, 0.8, 4], to: { pos: [6, 4.8, 21.5], target: [0, 0.8, 4], dur: 20 } },
    meet: twoShot(5.6, 2.6, 0.2),
    talk: twoShot(5.4, 2.4, -0.25, 46),
    walk: { pos: on(0.12, 2.5, 5.2), target: [e0.x, 1.2, e0.z - 2], to: { pos: on(0.36, 3.0, 4.6), target: [e1.x, 1.2, e1.z - 1.5], dur: 13 } },
    night: { pos: [e1.x - 2.2, 1.2, e1.z + 2.8], target: [e1.x + 4, 1.0, e1.z - 6], to: { pos: [e1.x - 2.6, 1.15, e1.z + 2.4], target: [e1.x + 2, 1.0, e1.z - 7], dur: 20 } },
    night2: { pos: [e1.x + 2.5, 2.4, e1.z + 4.5], target: [e1.x - 1, 1.6, e1.z - 6], to: { pos: [e1.x + 2.2, 2.6, e1.z + 4], target: [e1.x - 1, 3, e1.z - 6], dur: 14 } },
    morning: campShot(),
  };

  let skiffT = -1, smash = null;
  const skiffPath = new THREE.CatmullRomCurve3([V3(e1.x + 18, 0, e1.z - 9), V3(e1.x + 6, 0, e1.z - 7), V3(e1.x - 4, 0, e1.z - 8), V3(e1.x - 20, 0, e1.z - 14)]);
  const lanternBase = { v: 1 };
  const actions = {
    relight: async () => {
      llState.mode = 'arrive';
      lamplighter.visible = true;
      const from = V3(dying.x + 6, 0.44, dying.z - 9), to = posAt(0.17, -1.1).p.add(V3(1.1, 0, -0.6));
      animate(2.0, e => { dying.life = lerp(1, 0.08, e); }, ease.out);
      await animate(4.2, e => { lamplighter.position.lerpVectors(from, to, e); lamplighter.position.y = 0.44; lamplighter.lookAt(dying.x, 0.44, dying.z); }, ease.inOut);
      await wait(0.6);
      await animate(1.4, e => { dying.life = lerp(0.08, 1.6, e); }, ease.outBack);
      animate(1.2, e => { dying.life = lerp(1.6, 1, e); });
      llState.mode = 'idle';
    },
    walk: () => { llState.mode = 'walk'; return animate(13, e => { eliasT = lerp(0.17, 0.42, e); eliasWalk += 0.0; }, ease.inOut); },
    harvest: async () => {
      llState.mode = 'hidden'; lamplighter.visible = false;
      skiff.visible = true; wardens.forEach(w => (w.visible = true)); skiffT = 0;
    },
    skiffOutcome: (s) => {
      if (s.skiff === 'smash') {
        const p = skiff.localToWorld(V3(cages[1], 0.7, 0));
        flyer.visible = true; flyer.position.copy(p);
        smash = { t: 0, p };
        wardens.forEach(w => animate(0.8, e => (w.rotation.y = lerp(w.rotation.y, Math.atan2(e1.x - w.position.x, e1.z - w.position.z), e))));
      }
      return wait(1);
    },
    morning: () => {
      skiff.visible = false; wardens.forEach(w => (w.visible = false)); flyer.visible = false; skiffT = -1;
      const cp = posAt(0.45, 1.6).p; camp.position.copy(cp); camp.visible = true; campLight.intensity = 5;
      eliasT = 0.43;
      llState.mode = 'camp'; lamplighter.visible = true; const lp = posAt(0.455, -0.2).p.add(V3(1.6, 0, 0.6)); lamplighter.position.copy(lp); lamplighter.lookAt(cp.x, 0.44, cp.z);
      dripAmt = 1;
    },
  };

  let moodState = 'dusk';
  const MOODS = {
    dusk: { fog: 0x26303a, d: 0.03, hemi: 1.1, hc: 0x5a6878, lan: 1, sky: 'dusk', sea: 0x8a939c },
    night: { fog: 0x06080b, d: 0.042, hemi: 0.4, hc: 0x2a3444, lan: 1.05, sky: 'night', sea: 0x6a737c },
    morning: { fog: 0x6d7880, d: 0.034, hemi: 1.4, hc: 0x9aa6b2, lan: 0.35, sky: 'morning', sea: 0xa0a8b0 },
  };
  const curFog = new THREE.Color(0x26303a);
  function mood(name, dur = 2.5) {
    const M = MOODS[name] || MOODS.dusk; moodState = name;
    const f0 = scene.fog.color.clone(), d0 = scene.fog.density, h0 = hemi.intensity, l0 = lanternBase.v, hc0 = hemi.color.clone();
    scene.background = skyTex[M.sky];
    return animate(dur, e => {
      scene.fog.color.lerpColors(f0, new THREE.Color(M.fog), e); scene.fog.density = lerp(d0, M.d, e);
      hemi.intensity = lerp(h0, M.hemi, e); hemi.color.lerpColors(hc0, new THREE.Color(M.hc), e); lanternBase.v = lerp(l0, M.lan, e);
      mist.userData.items.forEach(s => s.material.color.copy(scene.fog.color).offsetHSL(0, 0, 0.18));
    });
  }

  const tmpC = new THREE.Color();
  return {
    scene, shots, actions, cast: {}, mood,
    post: { bloom: [0.6, 0.4, 0.72], exposure: 1.35 },
    reset() {
      eliasT = 0.17; moodState = 'dusk'; llState.mode = 'hidden'; lamplighter.visible = false; skiff.visible = false; wardens.forEach(w => (w.visible = false));
      camp.visible = false; dripAmt = 0; skiffT = -1; smash = null; flyer.visible = false; dying.life = 1;
      lan.forEach(l => { l.gone = false; l.life = l === dying ? 1 : 1; });
      scene.fog.color.set(0x26303a); scene.fog.density = 0.03; hemi.intensity = 1.1; lanternBase.v = 1; scene.background = skyTex.dusk;
    },
    restore(s, sceneId) {
      const idx = ['ch3_01', 'ch3_02', 'ch3_03', 'ch3_04', 'ch3_05', 'ch3_06', 'ch3_07'].indexOf(sceneId);
      if (idx >= 2 && idx <= 3) { lamplighter.visible = true; llState.mode = 'idle'; const to = posAt(0.17, -1.1).p.add(V3(1.1, 0, -0.6)); lamplighter.position.copy(to); }
      if (idx >= 4) eliasT = 0.42;
      if (idx >= 4 && idx <= 5) { mood('night', 0.01); skiff.visible = true; wardens.forEach(w => (w.visible = true)); skiffT = 0.3; }
      if (idx === 6) { mood('morning', 0.01); actions.morning(); }
    },
    update(t, dt) {
      // Elias
      const ep = posAt(eliasT, 0.0); elias.position.copy(ep.p);
      const walking = llState.mode === 'walk' && eliasT < 0.419;
      face(elias, ep.tan, false);
      elias.position.y += walking ? Math.abs(Math.sin(t * 6)) * 0.05 : 0;
      if (moodState === 'night') { elias.position.copy(posAt(eliasT, 1.5).p); elias.position.y = 0.2; face(elias, V3(1, 0, -0.6)); }
      if (llState.mode === 'camp') { const cp = camp.position; elias.lookAt(cp.x, elias.position.y, cp.z); }
      // own lantern trails Elias
      const want = elias.localToWorld(V3(-0.7, 1.6 + Math.sin(t * 1.7) * 0.12, -0.6));
      own.position.lerp(want, Math.min(1, dt * 1.6)); own.rotation.y = t * 0.3;
      ownLight.position.copy(own.position);
      // Lamplighter
      if (llState.mode === 'walk' || llState.mode === 'idle') {
        if (llState.mode === 'walk') { const lp = posAt(Math.min(0.425, eliasT + 0.008), -1.1).p; lamplighter.position.lerp(lp, Math.min(1, dt * 2)); face(lamplighter, posAt(eliasT).tan); }
        lamplighter.position.y = 0.44 + (walking ? Math.abs(Math.sin(t * 5)) * 0.04 : 0);
      }
      // lanterns bob
      const k = lanternBase.v;
      for (let i = 0; i < lan.length; i++) {
        const l = lan[i];
        let s = l.gone ? Math.max(0, l.s - dt * 2) : l.s; if (l.gone) l.s = s;
        const y = l.y + Math.sin(t * 0.9 + l.ph) * 0.06;
        q.setFromEuler(e3.set(Math.sin(t * 0.7 + l.ph) * 0.08, l.rot + t * 0.05, 0));
        pv.set(l.x, y, l.z); sv.setScalar(Math.max(0.0001, s)); m4.compose(pv, q, sv); lanterns.setMatrixAt(i, m4);
        tmpC.copy(l.c).multiplyScalar(k * l.life * (0.9 + 0.1 * Math.sin(t * 2.3 + l.ph))); lanterns.setColorAt(i, tmpC);
      }
      lanterns.instanceMatrix.needsUpdate = true; lanterns.instanceColor.needsUpdate = true;
      // skiff glides and lanterns vanish into it
      if (skiffT >= 0 && skiff.visible) {
        skiffT = Math.min(1, skiffT + dt / 40);
        const sp = skiffPath.getPointAt(skiffT), st = skiffPath.getTangentAt(skiffT);
        skiff.position.set(sp.x, 0.05 + Math.sin(t * 1.4) * 0.03, sp.z); skiff.rotation.y = Math.atan2(st.x, st.z) - Math.PI / 2;
        wardens.forEach((w, j) => { const o = skiffPath.getPointAt(Math.max(0, Math.min(1, skiffT + (j ? 0.03 : -0.03)))); w.position.set(o.x + (j ? 1.6 : -1.4), Math.abs(Math.sin(t * 1.2 + j)) * 0.15, o.z + (j ? -1.6 : 1.7)); if (!smash) w.rotation.y = skiff.rotation.y + Math.PI / 2; });
        for (const l of lan) if (!l.gone && l !== dying && Math.hypot(l.x - sp.x, l.z - sp.z) < 3) l.gone = true;
      }
      if (smash) {
        smash.t += dt; const k2 = smash.t;
        flyer.position.set(smash.p.x + Math.sin(k2 * 3) * 0.3 * k2, smash.p.y + k2 * k2 * 3.2, smash.p.z);
        flyer.material.color.setScalar(3 + Math.sin(k2 * 20));
        if (k2 > 4) { flyer.visible = false; smash = null; }
      }
      drip.userData.update(dt); mist.userData.update(t, dt);
      if (camp.visible) flicker(campLight, 5, t, 1, 0.25);
    },
  };
}

export const BUILDERS = { harbour: buildHarbour, bedroom: buildBedroom, stair: buildStair, vault: buildVault, strand: buildStrand, fens: buildFens };
