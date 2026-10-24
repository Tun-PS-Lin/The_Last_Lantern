// Renderer, post-processing, camera direction and set switching.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BUILDERS } from './sets.js';
import { animate, ease, tick, lerp, cancelTag } from './anim.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vignette: { value: 1.0 }, grain: { value: 0.05 }, sepia: { value: 0 }, fade: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vignette, grain, sepia, fade; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5; float v = smoothstep(0.85, 0.2, length(d * vec2(1.15, 1.0)));
      c.rgb *= mix(1.0, v, vignette);
      float g = hash(vUv * vec2(1931.0, 977.0) + fract(time * 7.13)) - 0.5;
      c.rgb += g * grain;
      vec3 sp = vec3(dot(c.rgb, vec3(0.393,0.769,0.189)), dot(c.rgb, vec3(0.349,0.686,0.168)), dot(c.rgb, vec3(0.272,0.534,0.131)));
      c.rgb = mix(c.rgb, sp * vec3(1.02, 0.95, 0.82), sepia);
      c.rgb *= 1.0 - fade;
      gl_FragColor = c;
    }`,
};

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    const pr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: pr < 1.5, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(new THREE.Scene(), this.camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.6, 0.55);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.renderPass); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass()); this.composer.addPass(this.grade);
    this.sets = {}; this.set = null; this.setName = null;
    this.cam = { pos: new THREE.Vector3(0, 5, 10), target: new THREE.Vector3(), fov: 50 };
    this.drift = null;      // slow push after a shot settles
    this.mouse = new THREE.Vector2(); this.mouseS = new THREE.Vector2();
    this.clock = new THREE.Clock(); this.t = 0;
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', e => this.mouse.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5));
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h); this.bloom.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  get(name) {
    if (!this.sets[name]) this.sets[name] = BUILDERS[name]();
    return this.sets[name];
  }
  prewarm(name) {
    const s = this.get(name);
    this.renderer.compile(s.scene, this.camera);
  }
  // Show a set immediately (caller handles the fade).
  use(name) {
    const s = this.get(name);
    if (this.set && this.set !== s && this.set.reset) this.set.reset();
    this.set = s; this.setName = name;
    this.renderPass.scene = s.scene;
    const [st, rad, th] = s.post.bloom;
    this.bloom.strength = st; this.bloom.radius = rad; this.bloom.threshold = th;
    this.renderer.toneMappingExposure = s.post.exposure;
    return s;
  }
  // Resolve a shot into world pos/target (handles cylindrical shots).
  static resolve(shot) {
    if (shot.cyl) {
      const c = shot.cyl;
      return { pos: new THREE.Vector3(Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r), target: new THREE.Vector3(Math.cos(c.ta) * c.tr, c.ty, Math.sin(c.ta) * c.tr), fov: shot.fov || 50 };
    }
    return { pos: new THREE.Vector3(...shot.pos), target: new THREE.Vector3(...shot.target), fov: shot.fov || 50 };
  }
  shot(name, { cut = false, dur = 3.2 } = {}) {
    const shot = this.set.shots[name]; if (!shot) return Promise.resolve();
    cancelTag('cam'); this.drift = null;
    const end = Stage.resolve(shot);
    const startDrift = () => {
      if (shot.to) {
        const to = Stage.resolve({ ...shot.to, fov: shot.to.fov || shot.fov, cyl: shot.to.cyl });
        const p0 = this.cam.pos.clone(), t0 = this.cam.target.clone();
        animate(shot.to.dur, e => { this.cam.pos.lerpVectors(p0, to.pos, e); this.cam.target.lerpVectors(t0, to.target, e); }, ease.sine, 'cam');
      }
    };
    if (cut) { this.cam.pos.copy(end.pos); this.cam.target.copy(end.target); this.cam.fov = end.fov; startDrift(); return Promise.resolve(); }
    const p0 = this.cam.pos.clone(), t0 = this.cam.target.clone(), f0 = this.cam.fov;
    const prev = this._lastShot; this._lastShot = shot;
    if (shot.cyl && prev && prev.cyl) {
      const a = prev.cyl, b = shot.cyl;
      return animate(dur, e => {
        const r = lerp(a.r, b.r, e), an = lerp(a.a, b.a, e), y = lerp(a.y, b.y, e);
        const tr = lerp(a.tr, b.tr, e), ta = lerp(a.ta, b.ta, e), ty = lerp(a.ty, b.ty, e);
        this.cam.pos.set(Math.cos(an) * r, y, Math.sin(an) * r); this.cam.target.set(Math.cos(ta) * tr, ty, Math.sin(ta) * tr);
        this.cam.fov = lerp(f0, end.fov, e);
      }, ease.inOut, 'cam').then(startDrift);
    }
    return animate(dur, e => { this.cam.pos.lerpVectors(p0, end.pos, e); this.cam.target.lerpVectors(t0, end.target, e); this.cam.fov = lerp(f0, end.fov, e); }, ease.inOut, 'cam').then(startDrift);
  }
  markShot(name) { this._lastShot = this.set.shots[name]; }
  setSepia(on, dur = 1.5) { const u = this.grade.uniforms.sepia, s0 = u.value; return animate(dur, e => (u.value = lerp(s0, on ? 0.75 : 0, e))); }
  loop() {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, this.clock.getDelta()); this.t += dt;
    tick(dt);
    this.mouseS.lerp(this.mouse, Math.min(1, dt * 2));
    const t = this.t, c = this.camera;
    c.position.copy(this.cam.pos);
    c.position.x += Math.sin(t * 0.21) * 0.08 + this.mouseS.x * 0.35;
    c.position.y += Math.sin(t * 0.17 + 1) * 0.06 - this.mouseS.y * 0.2;
    c.lookAt(this.cam.target);
    if (Math.abs(c.fov - this.cam.fov) > 0.01) { c.fov = this.cam.fov; c.updateProjectionMatrix(); }
    if (this.set) this.set.update(t, dt, c);
    this.grade.uniforms.time.value = t;
    if (!this.paused) this.composer.render(dt);
  }
}
