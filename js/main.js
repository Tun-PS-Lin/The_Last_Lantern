// The Last Lantern — Part One. Story flow, UI and input.
import { Stage } from './stage.js';
import { AudioEngine } from './audio.js';
import { LivingMap } from './map.js';
import { SCENES, CHAPTERS, SPEAKERS, voName, CHAPTER_VO } from './story.js';
import { wait } from './anim.js';

const $ = s => document.querySelector(s);
const SAVE_KEY = 'lastLantern.part1.v1';
const HERE = { ch0: null, ch1: 'stair', ch2: 'strand', ch3: 'fens' };
const ITEM_NAMES = { lostHour: 'The Lost Hour' };
const ACTION_AT = { ch0_06: 2, ch3_05: 1 };              // which visible line triggers the scene's action
const ACTION_SFX = { collapse: ['collapse', 0], theoName: ['name', 2.8], relight: ['relight', 4.9], harvest: ['skiff', 0], quillRise: ['rise', 0], memoryPool: ['name', 1.6], bookGlow: ['ink', 0.4], ashWrite: ['ink', 1.2] };

const DEV_NOCARD = new URLSearchParams(location.search).has('nocard');
const fresh = () => ({ idx: 0, traits: { lantern: 0, ink: 0, ash: 0 }, items: [], map: [], mapNotes: [], pendingMap: [] });
let state = fresh();
const store = {
  load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && typeof s.idx === 'number' ? s : null; } catch { return null; } },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* private mode */ } },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } },
};

const audio = new AudioEngine();
let stage = null;
const map = new LivingMap($('#map'), () => { if (map._resolve) { const r = map._resolve; map._resolve = null; r(); } });

// ── input ───────────────────────────────
let advanceFn = null, inputLock = 0, playing = false, runId = 0;
function onAdvance() {
  if (map.isOpen || performance.now() < inputLock || !advanceFn) return;
  inputLock = performance.now() + 350;
  const f = advanceFn; f();
}
function waitAdvance() { return new Promise(res => { advanceFn = () => { advanceFn = null; res(); }; }); }

window.addEventListener('pointerdown', e => {
  audio.init(); audio.resume();
  if (!$('#title').classList.contains('show') && !e.target.closest('button, #map, #choices, #menu')) onAdvance();
  if (!e.target.closest('#menu, #btn-menu')) $('#menu').classList.remove('open');
});
window.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === 'm' && $('#hud').classList.contains('show')) { toggleMap(); return; }
  if (k === 's' && $('#hud').classList.contains('show')) { toggleSound(); return; }
  if (k === 'escape') { if (map.isOpen) map.close(); $('#menu').classList.remove('open'); return; }
  if (/^[1-3]$/.test(k) && choiceKeys[k]) { choiceKeys[k](); return; }
  if ((k === ' ' || k === 'enter' || k === 'arrowright') && !$('#title').classList.contains('show')) {
    if (document.activeElement && document.activeElement.closest('#choices, #menu, #map')) return;
    e.preventDefault(); onAdvance();
  }
});
let wheelAcc = 0;
window.addEventListener('wheel', e => { if (map.isOpen || $('#title').classList.contains('show')) return; wheelAcc += e.deltaY; if (wheelAcc > 60) { wheelAcc = 0; onAdvance(); } setTimeout(() => (wheelAcc = 0), 300); }, { passive: true });
let touchY = null;
window.addEventListener('touchstart', e => (touchY = e.touches[0].clientY), { passive: true });
window.addEventListener('touchend', e => { if (touchY != null && touchY - e.changedTouches[0].clientY > 60) onAdvance(); touchY = null; }, { passive: true });

// ── small UI helpers ────────────────────
const fade = (on, ms = 1000) => { const f = $('#fade'); f.style.transitionDuration = ms + 'ms'; f.classList.toggle('on', on); return wait(ms / 1000); };
let toastTimer;
function toast(html, ms = 3600) { const t = $('#toast'); t.innerHTML = html; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function setHud(ch) { const c = CHAPTERS[ch]; $('#hud .hud-label').textContent = c.label; $('#hud .hud-title').textContent = c.title; }
function dots(sc) {
  const list = SCENES.filter(s => s.chapter === sc.chapter); const i = list.indexOf(sc);
  $('#dots').innerHTML = list.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('');
}
const readTime = text => Math.min(6, Math.max(1.7, text.split(/\s+/).length / 3.3 + 0.9));

// ── chapter card ────────────────────────
async function chapterCard(ch, during) {
  const c = CHAPTERS[ch], card = $('#card');
  card.querySelector('.card-label').textContent = c.label; card.querySelector('.card-title').textContent = c.title; card.querySelector('.card-place').textContent = c.place;
  await fade(true, 900);
  card.classList.add('show'); audio.sfx('chapter');
  const vo = audio.voice(CHAPTER_VO(ch));
  const built = during ? during() : Promise.resolve();
  const minHold = wait(3.4);
  let skipped = false; const skip = waitAdvance().then(() => (skipped = true));
  await Promise.race([Promise.all([minHold, vo.then(v => (v ? v.done : null)), built]), skip.then(() => built)]);
  advanceFn = null;
  if (skipped) audio.stopVoice();
  card.classList.remove('show');
  await wait(1.1);
}

// ── scene playback ──────────────────────
async function play(i, { resume = false } = {}) {
  const my = ++runId; playing = true;
  const sc = SCENES[i]; state.idx = i; state.here = HERE[sc.chapter]; store.save();
  const prev = SCENES[i - 1];
  const newChapter = resume || !prev || prev.chapter !== sc.chapter;
  hidePanel(); hideChoices();
  const setChange = resume || !stage.set || stage.setName !== sc.set;
  const setup = async () => {
    if (setChange) {
      const s = stage.use(sc.set);
      if (s.reset) s.reset();
      if (resume && s.restore) s.restore(state, sc.id);
      stage.shot(sc.shot, { cut: true }); stage.markShot(sc.shot);
      await wait(0.05);
    } else {
      stage.shot(sc.shot, { dur: 3.4 });
    }
    if (stage.set.setCast && sc.cast) stage.set.setCast(sc.cast);
    applyMood(sc);
  };
  if (newChapter && DEV_NOCARD) {
    setHud(sc.chapter); await setup(); audio.setBed(sc.music);
  } else if (newChapter) {
    setHud(sc.chapter);
    await chapterCard(sc.chapter, setup);
    audio.setBed(sc.music);
  } else if (setChange) {
    await fade(true, 800); await setup(); audio.setBed(sc.music);
  } else {
    await setup(); audio.setBed(sc.music);
  }
  if (my !== runId) return;
  $('#hud').classList.add('show');
  await fade(false, setChange || newChapter ? 1400 : 0);
  if (my !== runId) return;
  (sc.enterSfx || []).forEach(n => audio.sfx(n));
  if ((sc.enterSfx || []).includes('thunder') && stage.set.actions.flash) setTimeout(() => stage.set.actions.flash(), 500);
  if (sc.id === 'ch0_02' && stage.set.actions.flash) setTimeout(() => stage.set.actions.flash(), 6000);
  dots(sc);
  // prepare the next set while this scene plays
  const next = SCENES[i + 1];
  if (next && next.set !== sc.set) setTimeout(() => { try { stage.prewarm(next.set); } catch (e) { console.warn(e); } }, 2500);
  await showLines(sc, my);
  if (my !== runId) return;
  if (sc.mapReveal) await mapReveal(sc);
  if (sc.choice) { await choose(sc); }
  else { showHint(true); await waitAdvance(); showHint(false); audio.sfx('advance'); }
  if (my !== runId) return;
  playing = false;
  if (i + 1 < SCENES.length) play(i + 1); else ending();
}

let curMood = null;
function applyMood(sc) {
  const m = sc.mood || null;
  if (stage.set.mood) stage.set.mood(m === 'memory' ? 'memory' : m || (sc.set === 'fens' ? 'dusk' : null));
  stage.setSepia(m === 'memory', 1.6);
  curMood = m;
}

function lineEl(l) {
  const p = document.createElement('p');
  p.className = 'line' + (l.who !== 'narrator' ? ' say' : '') + (l.hand ? ' hand' : '') + (l.loud ? ' loud' : '');
  const who = SPEAKERS[l.who] && SPEAKERS[l.who].name;
  p.innerHTML = (who ? `<span class="who">${who}</span>` : '') + `<span class="txt"></span>`;
  p.querySelector('.txt').textContent = l.text;
  return p;
}
function hidePanel() { $('#panel').classList.remove('show'); }
function showHint(on) {
  const h = $('#hint'); h.classList.toggle('show', on);
  if (state.idx > 3) h.classList.add('quiet');
}

async function showLines(sc, my) {
  const box = $('#lines'); box.innerHTML = '';
  const visible = sc.lines.map((l, k) => ({ l, k })).filter(({ l }) => !l.if || l.if(state));
  $('#panel').classList.add('show');
  let skipping = false;
  const actAt = ACTION_AT[sc.id] || 0;
  const fireAction = () => {
    if (!sc.action || !stage.set.actions[sc.action]) return;
    stage.set.actions[sc.action](state);
    const fx = ACTION_SFX[sc.action];
    if (fx) setTimeout(() => audio.sfx(fx[0]), fx[1] * 1000);
    if (sc.action === 'skiffOutcome' && state.skiff === 'smash') audio.sfx('smash');
  };
  // queue Voice files for this scene in parallel
  visible.forEach(({ l, k }) => audio.hasVoice(voName(sc, k, l)));
  for (let n = 0; n < visible.length; n++) {
    if (my !== runId) return;
    const { l, k } = visible[n];
    [...box.children].forEach(c => c.classList.add('old'));
    const el = lineEl(l); box.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    if (n === actAt) fireAction();
    if (l.hum) audio.lullaby(l.hum === 'lamplighter' ? 'hum' : 'box', 0.4);
    if (skipping) { el.classList.add('in'); continue; }
    const vo = audio.voice(voName(sc, k, l));
    const timer = vo.then(v => (v ? v.done.then(() => wait(0.35)) : wait(readTime(l.text))));
    const skip = waitAdvance().then(() => 'skip');
    const r = await Promise.race([timer, skip]);
    advanceFn = null;
    if (r === 'skip') { skipping = true; audio.stopVoice(); }
  }
  if (visible.length <= actAt) fireAction();
  [...box.children].forEach((c, n) => { c.classList.add('in'); if (n < box.children.length - 1) c.classList.add('old'); });
  await wait(0.4);
}

// ── choices ─────────────────────────────
let choiceKeys = {};
function hideChoices() { const c = $('#choices'); c.classList.remove('show'); c.innerHTML = ''; choiceKeys = {}; $('#panel').classList.remove('under-choices'); }
function choose(sc) {
  return new Promise(res => {
    const wrap = $('#choices'); wrap.innerHTML = ''; wrap.classList.add('show'); $('#panel').classList.add('under-choices');
    const opts = sc.choice.options;
    const pick = (o, btn) => {
      if (wrap.dataset.done) return; wrap.dataset.done = '1';
      audio.sfx('select'); btn.classList.add('picked');
      [...wrap.children].forEach(b => b !== btn && b.classList.add('gone'));
      state[sc.choice.key] = o.id; state.traits[o.trait] = (state.traits[o.trait] || 0) + 1;
      if (o.item && !state.items.includes(o.item)) { state.items.push(o.item); setTimeout(() => { audio.sfx('item'); toast(`You carry <b>${ITEM_NAMES[o.item]}</b>`); }, 900); }
      store.save();
      setTimeout(() => { wrap.classList.remove('show'); btn.classList.add('gone'); }, 1100);
      setTimeout(() => { delete wrap.dataset.done; hideChoices(); res(); }, 1800);
    };
    opts.forEach((o, n) => {
      const b = document.createElement('button'); b.className = 'choice';
      b.innerHTML = `<span class="num">${['I', 'II', 'III'][n]}</span><span class="lab"></span>${o.sub ? '<span class="sub"></span>' : ''}`;
      b.querySelector('.lab').textContent = o.label; if (o.sub) b.querySelector('.sub').textContent = o.sub;
      b.addEventListener('click', () => pick(o, b));
      b.addEventListener('pointerenter', () => audio.sfx('hover'));
      wrap.appendChild(b); choiceKeys[String(n + 1)] = () => pick(o, b);
      setTimeout(() => b.classList.add('in'), 150 + n * 160);
    });
  });
}

// ── the living map ──────────────────────
async function mapReveal(sc) {
  if (!state.map.includes(sc.mapReveal)) {
    state.map.push(sc.mapReveal); state.pendingMap.push(sc.mapReveal);
    if (sc.mapNote) state.mapNotes.push({ ...sc.mapNote, pending: true });
    store.save();
  }
  if (sc.id === 'ch1_06') {                       // the first time: open the book for them
    await wait(0.6); await openMap(); return;
  }
  $('#btn-map').classList.add('new'); audio.sfx('map');
  toast('The sketchbook has changed <b>M</b>');
}
function openMap() {
  return new Promise(res => {
    const pending = state.pendingMap.slice(); const notes = state.mapNotes.filter(n => n.pending);
    map.setState({ ...state, map: state.map.filter(k => !pending.includes(k)), mapNotes: state.mapNotes.filter(n => !n.pending), skiff: pending.includes('fens') ? null : state.skiff });
    map._resolve = res; map.open(); audio.sfx('page');
    $('#btn-map').classList.remove('new');
    (async () => {
      await wait(0.8);
      for (const k of pending) {
        audio.sfx('ink');
        await map.revealAnim(k, notes.find(n => n.region === k));
        if (k === 'fens' && state.skiff === 'chart') { audio.sfx('ink'); await map.routeAnim(); }
      }
      state.pendingMap = []; state.mapNotes.forEach(n => delete n.pending); store.save();
    })();
  });
}
function toggleMap() { if (map.isOpen) map.close(); else { audio.init(); openMap(); } }
function toggleSound() { audio.init(); audio.setMuted(!audio.muted); $('#btn-sound').classList.toggle('muted', audio.muted); try { localStorage.setItem('lastLantern.muted', audio.muted ? '1' : '0'); } catch { /* */ } }
$('#btn-map').addEventListener('click', toggleMap);
$('#btn-sound').addEventListener('click', toggleSound);
$('#btn-menu').addEventListener('click', () => $('#menu').classList.toggle('open'));
$('#menu').addEventListener('click', e => {
  const act = e.target.dataset.act; if (!act) return; $('#menu').classList.remove('open');
  audio.stopVoice();
  if (act === 'restart') { state = fresh(); store.save(); runId++; play(0, { resume: true }); }
  if (act === 'chapter') {
    const ch = SCENES[state.idx].chapter; const first = SCENES.findIndex(s => s.chapter === ch);
    runId++; play(first, { resume: true });
  }
  if (act === 'title') { runId++; showTitle(); }
});

// ── ending ──────────────────────────────
async function ending() {
  hidePanel(); await fade(true, 1600);
  $('#hud').classList.remove('show'); audio.setBed('end'); state.done = true; store.save();
  $('#end').classList.add('show');
}
$('#btn-end-map').addEventListener('click', () => openMap());
$('#btn-end-restart').addEventListener('click', async () => { $('#end').classList.remove('show'); state = fresh(); store.save(); await wait(0.6); play(0, { resume: true }); });

// ── title ───────────────────────────────
function showTitle() {
  hidePanel(); hideChoices(); $('#hud').classList.remove('show'); $('#end').classList.remove('show');
  $('#title').classList.add('show'); fade(true, 600);
  const saved = store.load();
  $('#btn-continue').hidden = !(saved && saved.idx > 0 && !saved.done);
  if (audio.ready) audio.setBed('title');
}
async function start(resume) {
  audio.init(); audio.resume();
  const saved = store.load();
  state = resume && saved ? Object.assign(fresh(), saved) : fresh();
  if (!resume) store.save();
  $('#title').classList.remove('show');
  await wait(0.9);
  play(state.idx, { resume: true });
}
$('#btn-begin').addEventListener('click', () => start(false));
$('#btn-continue').addEventListener('click', () => start(true));
document.addEventListener('pointerdown', () => { audio.init(); audio.resume(); if ($('#title').classList.contains('show') && !audio.bedName) audio.setBed('title'); });

async function boot() {
  try { if (localStorage.getItem('lastLantern.muted') === '1') { audio.muted = true; $('#btn-sound').classList.add('muted'); } } catch { /* */ }
  try { await Promise.race([document.fonts.ready, wait(3)]); } catch { /* */ }
  try {
    stage = new Stage($('#gl'));
  } catch (e) {
    $('#title-note').textContent = 'This story needs WebGL, which this browser has turned off.'; console.error(e); return;
  }
  // build the first two sets behind the title
  await wait(0.05); stage.prewarm('harbour');
  await wait(0.05); stage.prewarm('bedroom');
  const saved = store.load();
  $('#btn-continue').hidden = !(saved && saved.idx > 0 && !saved.done);
  $('#btn-begin').disabled = false; $('#title-note').textContent = 'Click anywhere for sound.';
  // dev helper: ?scene=ch2_04 jumps straight to a scene
  const q = new URLSearchParams(location.search).get('scene');
  if (q) { const i = SCENES.findIndex(s => s.id === q); if (i >= 0) { const s = new URLSearchParams(location.search); state = fresh(); ['keepsake', 'purpose', 'hour', 'skiff'].forEach(k => { if (s.get(k)) state[k] = s.get(k); }); state.idx = i; $('#title').classList.remove('show'); play(i, { resume: true }); } }
}
window.__ll = { get state() { return state; }, get stage() { return stage; }, play, audio, map, SCENES };
boot();
