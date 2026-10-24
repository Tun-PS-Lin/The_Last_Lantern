// The Last Lantern — Part One script (Prologue to Chapter 3).
// Every line becomes one optional voice file: audio/vo/<scene>_<nn>_<speaker>[_<variant>].mp3
// Run `node tools/audio-list.mjs` to regenerate AUDIO.md from this file.

export const SPEAKERS = {
  narrator:    { name: null,                 cast: 'Narrator. Calm, low, unhurried. New England storyteller, late 40s.' },
  sutter:      { name: 'Dr. Sutter',         cast: 'Town doctor, 60s. Gentle, tired, kind. Slight Massachusetts accent.' },
  elias:       { name: 'Elias',              cast: 'Elias Hale, 17. Quiet, earnest, a little hoarse. Young man, not a boy.' },
  oril:        { name: 'Oril',               cast: 'Ember Warden. Ancient, dry, slow; voice like settling ash.' },
  saith:       { name: 'Saith',              cast: 'Ember Warden. Ancient, softer and higher than Oril; whispery.' },
  quill:       { name: 'Mother Quill',       cast: 'Eldest Tidewright (crab-folk). Raspy old woman, amused, clicks between words.' },
  lamplighter: { name: 'The Lamplighter',    cast: 'Courteous, warm, tired baritone. Use the SAME base voice as Elias, aged ~40 years older (hidden clue).' },
};

export const CHAPTERS = {
  ch0: { label: 'Prologue',  title: 'The Ninth Night',          place: 'Wexley, Massachusetts · November 1926' },
  ch1: { label: 'Chapter One',   title: 'Seventy Steps Down',       place: 'The Waking Stair' },
  ch2: { label: 'Chapter Two',   title: 'The Tide That Only Leaves', place: 'The Hourglass Strand' },
  ch3: { label: 'Chapter Three', title: 'A Light for Every Sleeper', place: 'The Mirelight Fens' },
};

// Line helpers. `if` filters by state; `v` tags a variant in the file name.
const N = (text, extra = {}) => ({ who: 'narrator', text, ...extra });
const S = (who, text, extra = {}) => ({ who, text, ...extra });

export const SCENES = [
  // ───────────────────────── PROLOGUE ─────────────────────────
  { id: 'ch0_01', chapter: 'ch0', set: 'harbour', shot: 'wide', music: 'wexley', enterSfx: ['thunder'],
    lines: [
      N('Rain has fallen on the harbour for three days.'),
      N('Theo Hale has been asleep for nine.'),
      N('Behind the one lit window on Harbor Street, a doctor is closing his bag.'),
    ] },
  { id: 'ch0_02', chapter: 'ch0', set: 'bedroom', shot: 'room', music: 'wexley', cast: ['theo', 'mother', 'doctor', 'elias'],
    lines: [
      S('sutter', 'His pulse is a sleeping boy’s pulse. Nothing more. Nothing less.'),
      S('sutter', 'Keep him warm, Mrs. Hale. Talk to him. Sometimes they hear.'),
      N('Their mother knits the same row, unpicks it, and knits it again. She hums while she works, the way she used to over their cradles.', { hum: true }),
    ] },
  { id: 'ch0_03', chapter: 'ch0', set: 'bedroom', shot: 'desk', music: 'wexley', cast: ['theo', 'mother', 'elias'], enterSfx: ['page'],
    lines: [
      N('Elias finds the sketchbook under Theo’s pillow.'),
      N('Page after page of a coastline that coils in on itself like a shell, labelled in Theo’s careful capitals.'),
      N('In the margins, someone has added notes in a neater hand. Elias does not recognise it.'),
      N('And on every page, a tall figure holding a lantern. On the last page, it stands at the foot of Theo’s bed.'),
    ] },
  { id: 'ch0_04', chapter: 'ch0', set: 'bedroom', shot: 'memory', music: 'memory', cast: ['theoDesk', 'eliasDesk'], mood: 'memory',
    lines: [
      N('Nine nights ago, Elias was meant to be watching him.'),
      N('He was finishing a survey drawing instead. The Pruett boundary, due on Monday.'),
      N('When he looked up, Theo was asleep over his own map, pencil still in his hand.'),
      N('He has not woken since.'),
    ] },
  { id: 'ch0_05', chapter: 'ch0', set: 'bedroom', shot: 'chair', music: 'wexley', cast: ['theo', 'eliasChair'],
    lines: [
      N('Midnight. Their mother has gone to lie down. The lamp is low.'),
      N('Before he lets himself sleep, Elias holds on to something.'),
    ],
    choice: {
      key: 'keepsake',
      options: [
        { id: 'soldier',  label: 'Theo’s tin soldier', sub: 'Missing its rifle. Theo sleeps with it every night.', trait: 'lantern' },
        { id: 'dividers', label: 'My brass dividers',        sub: 'Every map begins with a measurement.',                trait: 'ink' },
        { id: 'draught',  label: 'The doctor’s sleeping draught', sub: 'Three drops to sleep. He takes six.',   trait: 'ash' },
      ],
    } },
  { id: 'ch0_06', chapter: 'ch0', set: 'bedroom', shot: 'fall', music: 'descent', cast: ['theo', 'eliasChair'], action: 'collapse',
    lines: [
      N('The tin soldier is cold in his fist. Then warm. Then gone.', { if: s => s.keepsake === 'soldier', v: 'soldier' }),
      N('He turns the dividers over and over, until the turning is the only thing left.', { if: s => s.keepsake === 'dividers', v: 'dividers' }),
      N('The draught tastes of pennies. The room tilts, gently, like a boat.', { if: s => s.keepsake === 'draught', v: 'draught' }),
      N('The rain softens. The lamp gutters.'),
      N('When Elias opens his eyes, the floorboards are gone.'),
      N('A stair of black stone turns down into the dark.'),
    ] },

  // ───────────────────────── CHAPTER ONE ─────────────────────────
  { id: 'ch1_01', chapter: 'ch1', set: 'stair', shot: 'top', music: 'stair', enterSfx: ['steps'],
    lines: [
      N('The steps are cold, and worn hollow in the middle, as if by a great many feet.'),
      N('Each one is carved with a name. Ada Whitcombe. Samuel Orne. Lucy Brandt.'),
    ] },
  { id: 'ch1_02', chapter: 'ch1', set: 'stair', shot: 'fortieth', music: 'stair', action: 'theoName',
    lines: [
      N('On the fortieth step, the letters are fresh. The stone dust has not settled.'),
      N('THEO HALE.', { loud: true }),
    ] },
  { id: 'ch1_03', chapter: 'ch1', set: 'vault', shot: 'arrive', music: 'vault', enterSfx: ['ember'],
    lines: [
      N('At the bottom, a cavern. One coal burns in a basin of black iron, and it does not burn down.'),
      N('Two old men sit beside it. Their beards are smoke, curling slowly up into the dark.'),
      S('oril', 'Another one.'),
      S('saith', 'Another Hale.'),
    ] },
  { id: 'ch1_04', chapter: 'ch1', set: 'vault', shot: 'wardens', music: 'vault',
    lines: [
      S('saith', 'Why have you come?'),
    ],
    choice: {
      key: 'purpose',
      options: [
        { id: 'home', label: '“To bring him home.”',   sub: null, trait: 'lantern', say: 'To bring him home.' },
        { id: 'see',  label: '“To see what he saw.”',  sub: null, trait: 'ink',     say: 'To see what he saw.' },
        { id: 'call', label: '“Because I was called.”', sub: null, trait: 'ash',     say: 'Because I was called.' },
      ],
    } },
  { id: 'ch1_05', chapter: 'ch1', set: 'vault', shot: 'ember', music: 'vault', action: 'ashWrite',
    lines: [
      S('elias', 'To bring him home.', { if: s => s.purpose === 'home', v: 'home' }),
      S('elias', 'To see what he saw.', { if: s => s.purpose === 'see', v: 'see' }),
      S('elias', 'Because I was called.', { if: s => s.purpose === 'call', v: 'call' }),
      N('Saith writes the answer in the ash with one long finger. It does not blow away.'),
      S('oril', 'Seventy steps down. Seventy-one coming up.'),
      S('oril', 'Do not sit on the last one.'),
      N('Elias does not ask who sits there.'),
    ] },
  { id: 'ch1_06', chapter: 'ch1', set: 'vault', shot: 'book', music: 'vault', action: 'bookGlow',
    mapReveal: 'stair', mapNote: { region: 'stair', text: 'Begin at the shore.' },
    lines: [
      N('The sketchbook grows warm against his chest.'),
      N('Ink crawls across the first page. A stair, drawn by no hand. Then the ink stops.'),
      N('In the margin, in the neat hand, new words appear.'),
      N('Begin at the shore.', { hand: true }),
    ] },

  // ───────────────────────── CHAPTER TWO ─────────────────────────
  { id: 'ch2_01', chapter: 'ch2', set: 'strand', shot: 'wide', music: 'strand', enterSfx: ['waves'],
    lines: [
      N('A beach under a sky that is stuck at four in the morning.'),
      N('The sand crunches like glass. It is glass, ground fine from a million hourglasses.'),
      N('Pocket watches scuttle sideways at the waterline, ticking.'),
    ] },
  { id: 'ch2_02', chapter: 'ch2', set: 'strand', shot: 'pools', music: 'strand', action: 'memoryPool',
    lines: [
      N('The tide is going out. It only ever goes out.'),
      N('Every pool it leaves behind holds a moment someone forgot.'),
      N('In one, Elias sees himself at the kitchen table, teaching Theo to draw a compass rose.'),
      N('Theo is six. His tongue is between his teeth.'),
    ] },
  { id: 'ch2_03', chapter: 'ch2', set: 'strand', shot: 'empty', music: 'strandDark',
    lines: [
      N('One pool is empty, scraped clean down to the rock.'),
      N('Long hook marks score the stone. Beside them lies a single burnt match.'),
      N('Theo’s last waking hour has been taken.'),
    ] },
  { id: 'ch2_04', chapter: 'ch2', set: 'strand', shot: 'quill', music: 'strandDark', action: 'quillRise', enterSfx: ['clicks'],
    lines: [
      N('Something clicks across the sand behind him.'),
      S('quill', 'His hour was taken whole, little surveyor. Whole, on a hook.'),
      S('quill', 'We kept a splinter. Splinters cost.'),
      S('quill', 'One memory of him. Any one. We will know which.'),
    ],
    choice: {
      key: 'hour',
      options: [
        { id: 'trade',  label: 'Trade a memory for the splinter', sub: 'Mother Quill chooses which.', trait: 'ash', item: 'lostHour' },
        { id: 'refuse', label: 'Keep him whole',                   sub: 'Walk away with nothing.',     trait: 'lantern' },
      ],
    } },
  { id: 'ch2_05', chapter: 'ch2', set: 'strand', shot: 'quillClose', music: 'strandDark', action: 'hourOutcome',
    lines: [
      N('Quill reaches into the compass-rose pool and draws out the light. The water goes grey.', { if: s => s.hour === 'trade', v: 'trade' }),
      N('Elias tries to remember what was in it, and cannot.', { if: s => s.hour === 'trade', v: 'trade' }),
      N('In his palm lies a splinter of glass. It is warm, and it ticks once.', { if: s => s.hour === 'trade', v: 'trade' }),
      S('quill', 'Then keep him whole.', { if: s => s.hour === 'refuse', v: 'refuse' }),
      N('She bows, every joint folding at once, and sinks back into the sand.', { if: s => s.hour === 'refuse', v: 'refuse' }),
    ] },
  { id: 'ch2_06', chapter: 'ch2', set: 'strand', shot: 'inland', music: 'strand', action: 'footprints',
    mapReveal: 'strand',
    lines: [
      N('Footprints lead away from the water. They walk backwards.'),
      N('Elias follows them up the beach and into the mist.'),
    ] },

  // ───────────────────────── CHAPTER THREE ─────────────────────────
  { id: 'ch3_01', chapter: 'ch3', set: 'fens', shot: 'wide', music: 'fens', enterSfx: ['water'],
    lines: [
      N('Black water. Reeds. And lanterns. Thousands of paper lanterns, floating knee-high, as far as the mist allows.'),
      N('One for every sleeper in the waking world.'),
      N('One small lantern drifts after Elias like a dog that has decided to follow him home. It is his own.'),
    ] },
  { id: 'ch3_02', chapter: 'ch3', set: 'fens', shot: 'meet', music: 'fensLamp', action: 'relight',
    lines: [
      N('Beside him, a lantern gutters and shrinks to a bead.'),
      N('A tall figure steps out of the mist, hooded in brass, a single window glowing where a face should be.'),
      N('He lifts the dying lantern on his hook and relights it with great tenderness.'),
      S('lamplighter', 'Mind the water. Lights go out so easily here.'),
    ] },
  { id: 'ch3_03', chapter: 'ch3', set: 'fens', shot: 'talk', music: 'fensLamp',
    lines: [
      S('lamplighter', 'You are looking for the boy.'),
      S('lamplighter', 'Theo, isn’t it?'),
      N('Elias has not said his name.'),
      S('lamplighter', 'The city lies west, past the wood. I will walk with you, if you like.'),
    ] },
  { id: 'ch3_04', chapter: 'ch3', set: 'fens', shot: 'walk', music: 'fensLamp', action: 'walk',
    lines: [
      N('They walk for hours, or for none at all.'),
      N('The Lamplighter hums as he walks. A tune Elias half-knows, and cannot place.', { hum: 'lamplighter' }),
      N('He asks about Elias’s work, and listens closely while Elias explains how a boundary is surveyed.'),
    ] },
  { id: 'ch3_05', chapter: 'ch3', set: 'fens', shot: 'night', music: 'fensNight', action: 'harvest', mood: 'night',
    lines: [
      N('Night comes down. The Lamplighter is gone.'),
      N('A flat skiff glides out of the reeds without a sound.'),
      N('Fen-wardens on stilts lift lanterns from the water with long hooks and lock them into cages.'),
      N('Some of the lights are very small.'),
    ],
    choice: {
      key: 'skiff',
      options: [
        { id: 'smash', label: 'Smash a cage', sub: 'Free one light. The wardens will hear.', trait: 'lantern' },
        { id: 'chart', label: 'Follow the skiff', sub: 'Stay low. Chart where it goes.',     trait: 'ink' },
      ],
    } },
  { id: 'ch3_06', chapter: 'ch3', set: 'fens', shot: 'night2', music: 'fensNight', action: 'skiffOutcome', mood: 'night',
    lines: [
      N('The cage splits. A stranger’s lantern rises out of his hands, high and fast, and is gone into the dark.', { if: s => s.skiff === 'smash', v: 'smash' }),
      N('Somewhere, someone wakes.', { if: s => s.skiff === 'smash', v: 'smash' }),
      N('The wardens turn their hooks toward the sound. Elias runs.', { if: s => s.skiff === 'smash', v: 'smash' }),
      N('Elias keeps low in the reeds, counting strokes and bearings under his breath.', { if: s => s.skiff === 'chart', v: 'chart' }),
      N('The skiff turns west, toward the sea. On the sketchbook’s page, a dotted line follows it.', { if: s => s.skiff === 'chart', v: 'chart' }),
    ] },
  { id: 'ch3_07', chapter: 'ch3', set: 'fens', shot: 'morning', music: 'fensMorning', mood: 'morning', action: 'morning',
    mapReveal: 'fens',
    lines: [
      N('Morning. The Lamplighter is waiting beside a small fire, with two cups of tea.'),
      N('He says nothing about the night.'),
      N('But the hook on his pole is wet.'),
      S('lamplighter', 'Drink. The wood is long, and it listens.'),
    ] },
];

// Chapter title cards also take an optional narrator file: audio/vo/<chapter>_title_narrator.mp3
export const CHAPTER_VO = (ch) => `${ch}_title_narrator`;

export function speakerSlug(who) { return who; }

// Stable file name for every line, whether or not it plays in this run.
export function voName(scene, index, line) {
  const n = String(index + 1).padStart(2, '0');
  return `${scene.id}_${n}_${speakerSlug(line.who)}${line.v ? '_' + line.v : ''}`;
}
