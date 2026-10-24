// The Living Map: the coil image under a layer of paper that is erased, region by region, as Elias travels.
import { animate, ease } from './anim.js';

// Positions in the 1536 x 1024 map image.
export const REGIONS = {
  stair:     { x: 1428, y: 470, r: 165, label: 'THE WAKING STAIR',      lx: 1300, ly: 600 },
  strand:    { x: 1255, y: 235, r: 205, label: 'THE HOURGLASS STRAND',  lx: 1180, ly: 360 },
  fens:      { x: 930,  y: 135, r: 215, label: 'THE MIRELIGHT FENS',    lx: 930,  ly: 255 },
  wood:      { x: 420,  y: 130, r: 170, label: 'THE LISTENING WOOD',    lx: 420,  ly: 250 },
  amberhal:  { x: 250,  y: 260, r: 185, label: 'AMBERHAL',              lx: 250,  ly: 390 },
  isle:      { x: 380,  y: 480, r: 175, label: 'ISLE OF THE SLEEPING GIANT', lx: 380, ly: 600 },
  oumar:     { x: 545,  y: 700, r: 140, label: 'OUMAR-VEY',             lx: 545,  ly: 800 },
  plateau:   { x: 1110, y: 300, r: 150, label: 'THE HOLLOW PLATEAU',    lx: 1110, ly: 420 },
  desert:    { x: 850,  y: 480, r: 190, label: 'THE UNFINISHED DESERT', lx: 850,  ly: 610 },
  peak:      { x: 790,  y: 370, r: 115, label: '',                      lx: 790,  ly: 300 },
};
const W = 1536, H = 1024;

export class LivingMap {
  constructor(root, onClose) {
    this.root = root; this.onClose = onClose;
    this.canvas = root.querySelector('canvas'); this.ctx = this.canvas.getContext('2d');
    this.canvas.width = W; this.canvas.height = H;
    this.img = new Image(); this.img.src = 'assets/coil-map.jpg';
    this.img.onload = () => { this.makePaper(); this.draw(); };
    this.revealed = {}; this.notes = []; this.route = 0; this.here = null;
    root.querySelector('.map-close').addEventListener('click', () => this.close());
    root.addEventListener('click', e => { if (e.target === root) this.close(); });
    this.isOpen = false;
  }
  makePaper() {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#d9cdb0'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${90 + Math.random() * 60},${70 + Math.random() * 40},${40},${Math.random() * 0.05})`; x.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 3, 1 + Math.random() * 2); }
    // faint pencil hint of a coil
    x.strokeStyle = 'rgba(60,48,32,0.18)'; x.lineWidth = 3; x.setLineDash([2, 9]); x.beginPath();
    for (let a = 0; a <= Math.PI * 4; a += 0.05) { const rr = 70 + (a / (Math.PI * 4)) * 430; const px = 790 + Math.cos(a) * rr * 1.35, py = 400 + Math.sin(a) * rr * 0.9; a ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    this.paper = c;
  }
  setState(state) {
    this.revealed = {}; (state.map || []).forEach(k => (this.revealed[k] = 1));
    this.notes = state.mapNotes || []; this.route = state.skiff === 'chart' && (state.map || []).includes('fens') ? 1 : 0;
    this.here = state.here || null; this.draw();
  }
  draw() {
    if (!this.img.complete || !this.paper) return;
    const key = JSON.stringify([this.revealed, this.notes.map(n => n.k), this.route]);
    if (key !== this._key) { this._key = key; this.compose(); }
    const x = this.ctx;
    x.drawImage(this.composite, 0, 0);
    // you are here
    if (this.here && REGIONS[this.here]) {
      const R = REGIONS[this.here], t = performance.now() / 1000;
      x.save(); x.strokeStyle = `rgba(160,40,20,${0.6 + 0.3 * Math.sin(t * 3)})`; x.lineWidth = 5;
      x.beginPath(); x.arc(R.x, R.y, 22 + 4 * Math.sin(t * 3), 0, Math.PI * 2); x.stroke(); x.restore();
    }
  }
  compose() {
    if (!this.composite) { this.composite = document.createElement('canvas'); this.composite.width = W; this.composite.height = H; this.fog = document.createElement('canvas'); this.fog.width = W; this.fog.height = H; }
    const x = this.composite.getContext('2d');
    x.clearRect(0, 0, W, H);
    x.drawImage(this.img, 0, 0, W, H);
    // paper over everything not yet visited
    const fog = this.fog, f = fog.getContext('2d');
    f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, W, H);
    f.drawImage(this.paper, 0, 0);
    f.globalCompositeOperation = 'destination-out';
    for (const [k, amt] of Object.entries(this.revealed)) {
      const R = REGIONS[k]; if (!R || amt <= 0) continue;
      const rad = R.r * (0.2 + 0.8 * amt);
      const g = f.createRadialGradient(R.x, R.y, rad * 0.35, R.x, R.y, rad);
      g.addColorStop(0, `rgba(0,0,0,${Math.min(1, amt * 1.4)})`); g.addColorStop(0.75, `rgba(0,0,0,${0.85 * amt})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = g; f.beginPath();
      // ragged ink edge
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.12) { const n = 1 + 0.08 * Math.sin(a * 5 + R.x) + 0.05 * Math.sin(a * 11 + R.y); const px = R.x + Math.cos(a) * rad * n, py = R.y + Math.sin(a) * rad * n; a ? f.lineTo(px, py) : f.moveTo(px, py); }
      f.fill();
    }
    x.drawImage(fog, 0, 0);
    // labels in Theo's capitals
    x.textAlign = 'center';
    for (const [k, amt] of Object.entries(this.revealed)) {
      const R = REGIONS[k]; if (!R || !R.label || amt < 0.6) continue;
      x.save(); x.globalAlpha = (amt - 0.6) / 0.4; x.translate(R.lx, R.ly); x.rotate(-0.03 + (R.x % 7) * 0.008);
      x.font = '40px "Patrick Hand SC", "Comic Sans MS", cursive';
      x.lineWidth = 7; x.strokeStyle = 'rgba(230,218,190,0.85)'; x.strokeText(R.label, 0, 0);
      x.fillStyle = '#2b2116'; x.fillText(R.label, 0, 0); x.restore();
    }
    // the skiff's route, if charted
    if (this.route > 0) {
      x.save(); x.strokeStyle = 'rgba(40,30,20,0.85)'; x.lineWidth = 5; x.setLineDash([4, 14]); x.lineCap = 'round';
      x.beginPath(); x.moveTo(930, 170); x.bezierCurveTo(820, 230, 700, 200, 560, 300); x.stroke();
      x.setLineDash([]); x.beginPath(); x.moveTo(560, 300); x.lineTo(590, 300); x.moveTo(560, 300); x.lineTo(575, 274); x.stroke(); x.restore();
    }
    // margin notes in the neat hand
    this.notes.forEach((n, i) => {
      const R = REGIONS[n.region]; if (!R) return;
      x.save(); x.font = '34px "Homemade Apple", cursive'; x.fillStyle = 'rgba(26,22,40,0.92)'; x.textAlign = 'right';
      x.translate(R.x + 60, R.y + R.r + 30 + i * 40); x.rotate(-0.05);
      const w = x.measureText(n.text).width, k = n.k == null ? 1 : n.k;
      x.beginPath(); x.rect(-w - 10, -50, (w + 20) * k, 80); x.clip();
      x.lineWidth = 6; x.strokeStyle = 'rgba(230,218,190,0.7)'; x.strokeText(n.text, 0, 0); x.fillText(n.text, 0, 0); x.restore();
    });
  }
  open() {
    this.isOpen = true; this.root.classList.add('open');
    const tick = () => { if (!this.isOpen) return; this.draw(); requestAnimationFrame(tick); }; tick();
  }
  close() { if (!this.isOpen) return; this.isOpen = false; this.root.classList.remove('open'); this.onClose && this.onClose(); }
  async revealAnim(region, note) {
    this.revealed[region] = 0;
    await animate(2.6, e => { this.revealed[region] = e; }, ease.inOut);
    if (note) { const n = { ...note, k: 0 }; this.notes.push(n); await animate(2.2, e => (n.k = e), ease.inOut); }
  }
  async routeAnim() { await animate(2, e => (this.route = e)); }
}
