// Generates AUDIO.md from js/story.js so file names always match the code.
// Usage: node tools/audio-list.mjs
import { writeFileSync } from 'node:fs';
import { SCENES, CHAPTERS, SPEAKERS, voName, CHAPTER_VO } from '../js/story.js';

const VARIANT_NOTE = {
  soldier: 'only if Elias held the tin soldier', dividers: 'only if Elias held the dividers', draught: 'only if Elias drank the draught',
  home: 'only if he answered "To bring him home"', see: 'only if he answered "To see what he saw"', call: 'only if he answered "Because I was called"',
  trade: 'only if he traded a memory', refuse: 'only if he refused the trade', smash: 'only if he smashed the cage', chart: 'only if he followed the skiff',
};

const MUSIC = [
  ['title', 'Title screen', 'Slow D-minor drone, wind, sparse music-box notes. Loops.'],
  ['wexley', 'Prologue, scenes 1 to 3 and 5', 'Heavy rain on windows, soft A-minor pad, a few lonely piano notes.'],
  ['memory', 'Prologue, scene 4 (the flashback)', 'Warmer, muffled, slightly warped, like an old memory. Music box.'],
  ['descent', 'Prologue, scene 6 (the floor falls away)', 'Deep falling drone and rumble.'],
  ['stair', 'Chapter 1, the stair', 'Cave drone, slow heartbeat, water drips.'],
  ['vault', 'Chapter 1, the Ember Vault', 'Low drone, faint choir, crackling coal.'],
  ['strand', 'Chapter 2, beach (calm)', 'Waves going out, glassy high notes, many clocks ticking out of time.'],
  ['strandDark', 'Chapter 2, empty pool and Mother Quill', 'Same beach, uneasy: low dissonant drone, slower ticking.'],
  ['fens', 'Chapter 3, arrival', 'Marsh water, insects, frogs, warm F-major pad. Lanterns everywhere.'],
  ['fensLamp', 'Chapter 3, with the Lamplighter', 'Like "fens" but softer and more intimate, D-minor.'],
  ['fensNight', 'Chapter 3, the harvest at night', 'Dark, tense, near silent. Distant creaks.'],
  ['fensMorning', 'Chapter 3, morning by the fire', 'Pale, quiet, a little hopeful. Small fire crackle.'],
  ['end', 'End of Part One screen', 'Calm D-minor pad with music box.'],
];
const SFX = [
  ['thunder', 'Distant thunder roll (harbour, opening)'], ['page', 'Sketchbook page turn'], ['steps', 'Four slow footsteps on stone'],
  ['ember', 'Coal fire flaring up, whoomph'], ['collapse', 'Floorboards breaking and falling away into a void, long rumble'],
  ['name', 'Glassy shimmer (Theo’s name appears, memory pool glows)'], ['waves', 'A single wave drawing back'],
  ['clicks', 'Crab-like clicking across sand (Mother Quill)'], ['rise', 'Sand hissing as something rises out of it'],
  ['water', 'Gentle marsh water'], ['relight', 'A lantern catching fire again, soft whump and shimmer'], ['skiff', 'Oars and creaking wood, slow'],
  ['smash', 'Small cage breaking: glass and metal'], ['ink', 'Pen scratching on paper'], ['item', 'Small bell chord when you gain an item'],
  ['chapter', 'Deep boom under a chapter title'], ['map', 'Soft paper rustle when the sketchbook changes'],
  ['select', 'Choice confirmed, gentle chime'], ['hover', 'Very soft tick when hovering a choice'], ['advance', 'Soft paper whoosh between scenes'],
];

const out = [];
const p = s => out.push(s);
p('# Audio files for The Last Lantern, Part One');
p('');
p('Drop each file into the folder shown, with the exact file name. The page plays a file automatically as soon as it exists, and quietly falls back to the built-in sound when it does not, so you can add files one at a time.');
p('');
p('- **Format:** MP3, 44.1 kHz, mono is fine, 128 to 192 kbps. Trim silence at the start and end (keep about 0.2 s).');
p('- **Loudness:** keep voices at a similar level (around -16 LUFS). Music loops should loop cleanly.');
p('- **Names:** lower case except where shown, no spaces, `.mp3`. A wrong name is simply ignored.');
p('- **Music ducks** under voice lines automatically. Text still appears if a voice file is missing.');
p('');
p('## Voices');
p('');
p('| Speaker | Direction for ElevenLabs / Google AI Studio |');
p('| --- | --- |');
for (const [k, s] of Object.entries(SPEAKERS)) p(`| \`${k}\` ${s.name ? '(' + s.name + ')' : '(narrator)'} | ${s.cast} |`);
p('');
p('Hidden clue: generate the Lamplighter from the same base voice as Elias, made older, slower and deeper. Most listeners will not notice. That is the point.');
p('');
p('## Narration and dialogue: `audio/vo/`');
p('');
let total = 0;
for (const [ch, c] of Object.entries(CHAPTERS)) {
  p(`### ${c.label}: ${c.title}`);
  p('');
  p('| File | Speaker | Line | Plays |');
  p('| --- | --- | --- | --- |');
  p(`| \`${CHAPTER_VO(ch)}.mp3\` | narrator | ${c.label}. ${c.title}. | Over the chapter title card |`); total++;
  for (const sc of SCENES.filter(s => s.chapter === ch)) {
    sc.lines.forEach((l, i) => {
      const note = l.v ? VARIANT_NOTE[l.v] || 'variant' : 'always';
      p(`| \`${voName(sc, i, l)}.mp3\` | ${l.who} | ${l.text.replace(/\|/g, '/')} | ${note} |`); total++;
    });
  }
  p('');
}
p(`Total: ${total} voice files. Lines marked "only if" play on one branch, so a single playthrough uses fewer.`);
p('');
p('The two humming moments (their mother in the Prologue, the Lamplighter in Chapter 3) are played by the score as an original lullaby melody, so they need no recording.');
p('');
p('## Optional: replace the generated music, `audio/music/`');
p('');
p('Each file should loop seamlessly (60 to 120 seconds is plenty). Missing files use the built-in generative score.');
p('');
p('| File | Where it plays | Mood |');
p('| --- | --- | --- |');
for (const [f, w, m] of MUSIC) p(`| \`${f}.mp3\` | ${w} | ${m} |`);
p('');
p('## Optional: replace the generated sound effects, `audio/sfx/`');
p('');
p('| File | Sound |');
p('| --- | --- |');
for (const [f, d] of SFX) p(`| \`${f}.mp3\` | ${d} |`);
p('');
writeFileSync(new URL('../AUDIO.md', import.meta.url), out.join('\n'));
console.log('AUDIO.md written:', total, 'voice files');
