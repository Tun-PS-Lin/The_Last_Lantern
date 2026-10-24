// Tiny tween runner shared by the stage and the sets.
const live = new Set();

export const ease = {
  linear: t => t,
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

// animate(seconds, (k, raw) => {...}, easing) → Promise. Returns a handle with .cancel().
export function animate(dur, fn, e = ease.inOut, tag = null) {
  let a;
  const p = new Promise(res => { a = { t: 0, dur: Math.max(0.0001, dur), fn, e, res, tag }; live.add(a); });
  p.cancel = () => { if (live.delete(a)) a.res(); };
  return p;
}

export function cancelTag(tag) { for (const a of [...live]) if (a.tag === tag) { live.delete(a); a.res(); } }

export const wait = s => animate(s, () => {}, ease.linear);

export function tick(dt) {
  for (const a of [...live]) {
    a.t += dt;
    const raw = Math.min(1, a.t / a.dur);
    a.fn(a.e(raw), raw);
    if (raw >= 1) { live.delete(a); a.res(); }
  }
}

export const lerp = (a, b, k) => a + (b - a) * k;
