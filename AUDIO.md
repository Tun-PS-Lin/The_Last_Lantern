# Audio files for The Last Lantern, Part One

Drop each file into the folder shown, with the exact file name. The page plays a file automatically as soon as it exists, and quietly falls back to the built-in sound when it does not, so you can add files one at a time.

- **Format:** MP3, 44.1 kHz, mono is fine, 128 to 192 kbps. Trim silence at the start and end (keep about 0.2 s).
- **Loudness:** keep voices at a similar level (around -16 LUFS). Music loops should loop cleanly.
- **Names:** lower case except where shown, no spaces, `.mp3`. A wrong name is simply ignored.
- **Music ducks** under voice lines automatically. Text still appears if a voice file is missing.

## Voices

| Speaker | Direction for ElevenLabs / Google AI Studio |
| --- | --- |
| `narrator` (narrator) | Narrator. Calm, low, unhurried. New England storyteller, late 40s. |
| `sutter` (Dr. Sutter) | Town doctor, 60s. Gentle, tired, kind. Slight Massachusetts accent. |
| `elias` (Elias) | Elias Hale, 17. Quiet, earnest, a little hoarse. Young man, not a boy. |
| `oril` (Oril) | Ember Warden. Ancient, dry, slow; voice like settling ash. |
| `saith` (Saith) | Ember Warden. Ancient, softer and higher than Oril; whispery. |
| `quill` (Mother Quill) | Eldest Tidewright (crab-folk). Raspy old woman, amused, clicks between words. |
| `lamplighter` (The Lamplighter) | Courteous, warm, tired baritone. Use the SAME base voice as Elias, aged ~40 years older (hidden clue). |

Hidden clue: generate the Lamplighter from the same base voice as Elias, made older, slower and deeper. Most listeners will not notice. That is the point.

## Narration and dialogue: `audio/vo/`

### Prologue: The Ninth Night

| File | Speaker | Line | Plays |
| --- | --- | --- | --- |
| `ch0_title_narrator.mp3` | narrator | Prologue. The Ninth Night. | Over the chapter title card |
| `ch0_01_01_narrator.mp3` | narrator | Rain has fallen on the harbour for three days. | always |
| `ch0_01_02_narrator.mp3` | narrator | Theo Hale has been asleep for nine. | always |
| `ch0_01_03_narrator.mp3` | narrator | Behind the one lit window on Harbor Street, a doctor is closing his bag. | always |
| `ch0_02_01_sutter.mp3` | sutter | His pulse is a sleeping boy’s pulse. Nothing more. Nothing less. | always |
| `ch0_02_02_sutter.mp3` | sutter | Keep him warm, Mrs. Hale. Talk to him. Sometimes they hear. | always |
| `ch0_02_03_narrator.mp3` | narrator | Their mother knits the same row, unpicks it, and knits it again. She hums while she works, the way she used to over their cradles. | always |
| `ch0_03_01_narrator.mp3` | narrator | Elias finds the sketchbook under Theo’s pillow. | always |
| `ch0_03_02_narrator.mp3` | narrator | Page after page of a coastline that coils in on itself like a shell, labelled in Theo’s careful capitals. | always |
| `ch0_03_03_narrator.mp3` | narrator | In the margins, someone has added notes in a neater hand. Elias does not recognise it. | always |
| `ch0_03_04_narrator.mp3` | narrator | And on every page, a tall figure holding a lantern. On the last page, it stands at the foot of Theo’s bed. | always |
| `ch0_04_01_narrator.mp3` | narrator | Nine nights ago, Elias was meant to be watching him. | always |
| `ch0_04_02_narrator.mp3` | narrator | He was finishing a survey drawing instead. The Pruett boundary, due on Monday. | always |
| `ch0_04_03_narrator.mp3` | narrator | When he looked up, Theo was asleep over his own map, pencil still in his hand. | always |
| `ch0_04_04_narrator.mp3` | narrator | He has not woken since. | always |
| `ch0_05_01_narrator.mp3` | narrator | Midnight. Their mother has gone to lie down. The lamp is low. | always |
| `ch0_05_02_narrator.mp3` | narrator | Before he lets himself sleep, Elias holds on to something. | always |
| `ch0_06_01_narrator_soldier.mp3` | narrator | The tin soldier is cold in his fist. Then warm. Then gone. | only if Elias held the tin soldier |
| `ch0_06_02_narrator_dividers.mp3` | narrator | He turns the dividers over and over, until the turning is the only thing left. | only if Elias held the dividers |
| `ch0_06_03_narrator_draught.mp3` | narrator | The draught tastes of pennies. The room tilts, gently, like a boat. | only if Elias drank the draught |
| `ch0_06_04_narrator.mp3` | narrator | The rain softens. The lamp gutters. | always |
| `ch0_06_05_narrator.mp3` | narrator | When Elias opens his eyes, the floorboards are gone. | always |
| `ch0_06_06_narrator.mp3` | narrator | A stair of black stone turns down into the dark. | always |

### Chapter One: Seventy Steps Down

| File | Speaker | Line | Plays |
| --- | --- | --- | --- |
| `ch1_title_narrator.mp3` | narrator | Chapter One. Seventy Steps Down. | Over the chapter title card |
| `ch1_01_01_narrator.mp3` | narrator | The steps are cold, and worn hollow in the middle, as if by a great many feet. | always |
| `ch1_01_02_narrator.mp3` | narrator | Each one is carved with a name. Ada Whitcombe. Samuel Orne. Lucy Brandt. | always |
| `ch1_02_01_narrator.mp3` | narrator | On the fortieth step, the letters are fresh. The stone dust has not settled. | always |
| `ch1_02_02_narrator.mp3` | narrator | THEO HALE. | always |
| `ch1_03_01_narrator.mp3` | narrator | At the bottom, a cavern. One coal burns in a basin of black iron, and it does not burn down. | always |
| `ch1_03_02_narrator.mp3` | narrator | Two old men sit beside it. Their beards are smoke, curling slowly up into the dark. | always |
| `ch1_03_03_oril.mp3` | oril | Another one. | always |
| `ch1_03_04_saith.mp3` | saith | Another Hale. | always |
| `ch1_04_01_saith.mp3` | saith | Why have you come? | always |
| `ch1_05_01_elias_home.mp3` | elias | To bring him home. | only if he answered "To bring him home" |
| `ch1_05_02_elias_see.mp3` | elias | To see what he saw. | only if he answered "To see what he saw" |
| `ch1_05_03_elias_call.mp3` | elias | Because I was called. | only if he answered "Because I was called" |
| `ch1_05_04_narrator.mp3` | narrator | Saith writes the answer in the ash with one long finger. It does not blow away. | always |
| `ch1_05_05_oril.mp3` | oril | Seventy steps down. Seventy-one coming up. | always |
| `ch1_05_06_oril.mp3` | oril | Do not sit on the last one. | always |
| `ch1_05_07_narrator.mp3` | narrator | Elias does not ask who sits there. | always |
| `ch1_06_01_narrator.mp3` | narrator | The sketchbook grows warm against his chest. | always |
| `ch1_06_02_narrator.mp3` | narrator | Ink crawls across the first page. A stair, drawn by no hand. Then the ink stops. | always |
| `ch1_06_03_narrator.mp3` | narrator | In the margin, in the neat hand, new words appear. | always |
| `ch1_06_04_narrator.mp3` | narrator | Begin at the shore. | always |

### Chapter Two: The Tide That Only Leaves

| File | Speaker | Line | Plays |
| --- | --- | --- | --- |
| `ch2_title_narrator.mp3` | narrator | Chapter Two. The Tide That Only Leaves. | Over the chapter title card |
| `ch2_01_01_narrator.mp3` | narrator | A beach under a sky that is stuck at four in the morning. | always |
| `ch2_01_02_narrator.mp3` | narrator | The sand crunches like glass. It is glass, ground fine from a million hourglasses. | always |
| `ch2_01_03_narrator.mp3` | narrator | Pocket watches scuttle sideways at the waterline, ticking. | always |
| `ch2_02_01_narrator.mp3` | narrator | The tide is going out. It only ever goes out. | always |
| `ch2_02_02_narrator.mp3` | narrator | Every pool it leaves behind holds a moment someone forgot. | always |
| `ch2_02_03_narrator.mp3` | narrator | In one, Elias sees himself at the kitchen table, teaching Theo to draw a compass rose. | always |
| `ch2_02_04_narrator.mp3` | narrator | Theo is six. His tongue is between his teeth. | always |
| `ch2_03_01_narrator.mp3` | narrator | One pool is empty, scraped clean down to the rock. | always |
| `ch2_03_02_narrator.mp3` | narrator | Long hook marks score the stone. Beside them lies a single burnt match. | always |
| `ch2_03_03_narrator.mp3` | narrator | Theo’s last waking hour has been taken. | always |
| `ch2_04_01_narrator.mp3` | narrator | Something clicks across the sand behind him. | always |
| `ch2_04_02_quill.mp3` | quill | His hour was taken whole, little surveyor. Whole, on a hook. | always |
| `ch2_04_03_quill.mp3` | quill | We kept a splinter. Splinters cost. | always |
| `ch2_04_04_quill.mp3` | quill | One memory of him. Any one. We will know which. | always |
| `ch2_05_01_narrator_trade.mp3` | narrator | Quill reaches into the compass-rose pool and draws out the light. The water goes grey. | only if he traded a memory |
| `ch2_05_02_narrator_trade.mp3` | narrator | Elias tries to remember what was in it, and cannot. | only if he traded a memory |
| `ch2_05_03_narrator_trade.mp3` | narrator | In his palm lies a splinter of glass. It is warm, and it ticks once. | only if he traded a memory |
| `ch2_05_04_quill_refuse.mp3` | quill | Then keep him whole. | only if he refused the trade |
| `ch2_05_05_narrator_refuse.mp3` | narrator | She bows, every joint folding at once, and sinks back into the sand. | only if he refused the trade |
| `ch2_06_01_narrator.mp3` | narrator | Footprints lead away from the water. They walk backwards. | always |
| `ch2_06_02_narrator.mp3` | narrator | Elias follows them up the beach and into the mist. | always |

### Chapter Three: A Light for Every Sleeper

| File | Speaker | Line | Plays |
| --- | --- | --- | --- |
| `ch3_title_narrator.mp3` | narrator | Chapter Three. A Light for Every Sleeper. | Over the chapter title card |
| `ch3_01_01_narrator.mp3` | narrator | Black water. Reeds. And lanterns. Thousands of paper lanterns, floating knee-high, as far as the mist allows. | always |
| `ch3_01_02_narrator.mp3` | narrator | One for every sleeper in the waking world. | always |
| `ch3_01_03_narrator.mp3` | narrator | One small lantern drifts after Elias like a dog that has decided to follow him home. It is his own. | always |
| `ch3_02_01_narrator.mp3` | narrator | Beside him, a lantern gutters and shrinks to a bead. | always |
| `ch3_02_02_narrator.mp3` | narrator | A tall figure steps out of the mist, hooded in brass, a single window glowing where a face should be. | always |
| `ch3_02_03_narrator.mp3` | narrator | He lifts the dying lantern on his hook and relights it with great tenderness. | always |
| `ch3_02_04_lamplighter.mp3` | lamplighter | Mind the water. Lights go out so easily here. | always |
| `ch3_03_01_lamplighter.mp3` | lamplighter | You are looking for the boy. | always |
| `ch3_03_02_lamplighter.mp3` | lamplighter | Theo, isn’t it? | always |
| `ch3_03_03_narrator.mp3` | narrator | Elias has not said his name. | always |
| `ch3_03_04_lamplighter.mp3` | lamplighter | The city lies west, past the wood. I will walk with you, if you like. | always |
| `ch3_04_01_narrator.mp3` | narrator | They walk for hours, or for none at all. | always |
| `ch3_04_02_narrator.mp3` | narrator | The Lamplighter hums as he walks. A tune Elias half-knows, and cannot place. | always |
| `ch3_04_03_narrator.mp3` | narrator | He asks about Elias’s work, and listens closely while Elias explains how a boundary is surveyed. | always |
| `ch3_05_01_narrator.mp3` | narrator | Night comes down. The Lamplighter is gone. | always |
| `ch3_05_02_narrator.mp3` | narrator | A flat skiff glides out of the reeds without a sound. | always |
| `ch3_05_03_narrator.mp3` | narrator | Fen-wardens on stilts lift lanterns from the water with long hooks and lock them into cages. | always |
| `ch3_05_04_narrator.mp3` | narrator | Some of the lights are very small. | always |
| `ch3_06_01_narrator_smash.mp3` | narrator | The cage splits. A stranger’s lantern rises out of his hands, high and fast, and is gone into the dark. | only if he smashed the cage |
| `ch3_06_02_narrator_smash.mp3` | narrator | Somewhere, someone wakes. | only if he smashed the cage |
| `ch3_06_03_narrator_smash.mp3` | narrator | The wardens turn their hooks toward the sound. Elias runs. | only if he smashed the cage |
| `ch3_06_04_narrator_chart.mp3` | narrator | Elias keeps low in the reeds, counting strokes and bearings under his breath. | only if he followed the skiff |
| `ch3_06_05_narrator_chart.mp3` | narrator | The skiff turns west, toward the sea. On the sketchbook’s page, a dotted line follows it. | only if he followed the skiff |
| `ch3_07_01_narrator.mp3` | narrator | Morning. The Lamplighter is waiting beside a small fire, with two cups of tea. | always |
| `ch3_07_02_narrator.mp3` | narrator | He says nothing about the night. | always |
| `ch3_07_03_narrator.mp3` | narrator | But the hook on his pole is wet. | always |
| `ch3_07_04_lamplighter.mp3` | lamplighter | Drink. The wood is long, and it listens. | always |

Total: 94 voice files. Lines marked "only if" play on one branch, so a single playthrough uses fewer.

The two humming moments (their mother in the Prologue, the Lamplighter in Chapter 3) are played by the score as an original lullaby melody, so they need no recording.

## Optional: replace the generated music, `audio/music/`

Each file should loop seamlessly (60 to 120 seconds is plenty). Missing files use the built-in generative score.

| File | Where it plays | Mood |
| --- | --- | --- |
| `title.mp3` | Title screen | Slow D-minor drone, wind, sparse music-box notes. Loops. |
| `wexley.mp3` | Prologue, scenes 1 to 3 and 5 | Heavy rain on windows, soft A-minor pad, a few lonely piano notes. |
| `memory.mp3` | Prologue, scene 4 (the flashback) | Warmer, muffled, slightly warped, like an old memory. Music box. |
| `descent.mp3` | Prologue, scene 6 (the floor falls away) | Deep falling drone and rumble. |
| `stair.mp3` | Chapter 1, the stair | Cave drone, slow heartbeat, water drips. |
| `vault.mp3` | Chapter 1, the Ember Vault | Low drone, faint choir, crackling coal. |
| `strand.mp3` | Chapter 2, beach (calm) | Waves going out, glassy high notes, many clocks ticking out of time. |
| `strandDark.mp3` | Chapter 2, empty pool and Mother Quill | Same beach, uneasy: low dissonant drone, slower ticking. |
| `fens.mp3` | Chapter 3, arrival | Marsh water, insects, frogs, warm F-major pad. Lanterns everywhere. |
| `fensLamp.mp3` | Chapter 3, with the Lamplighter | Like "fens" but softer and more intimate, D-minor. |
| `fensNight.mp3` | Chapter 3, the harvest at night | Dark, tense, near silent. Distant creaks. |
| `fensMorning.mp3` | Chapter 3, morning by the fire | Pale, quiet, a little hopeful. Small fire crackle. |
| `end.mp3` | End of Part One screen | Calm D-minor pad with music box. |

## Optional: replace the generated sound effects, `audio/sfx/`

| File | Sound |
| --- | --- |
| `thunder.mp3` | Distant thunder roll (harbour, opening) |
| `page.mp3` | Sketchbook page turn |
| `steps.mp3` | Four slow footsteps on stone |
| `ember.mp3` | Coal fire flaring up, whoomph |
| `collapse.mp3` | Floorboards breaking and falling away into a void, long rumble |
| `name.mp3` | Glassy shimmer (Theo’s name appears, memory pool glows) |
| `waves.mp3` | A single wave drawing back |
| `clicks.mp3` | Crab-like clicking across sand (Mother Quill) |
| `rise.mp3` | Sand hissing as something rises out of it |
| `water.mp3` | Gentle marsh water |
| `relight.mp3` | A lantern catching fire again, soft whump and shimmer |
| `skiff.mp3` | Oars and creaking wood, slow |
| `smash.mp3` | Small cage breaking: glass and metal |
| `ink.mp3` | Pen scratching on paper |
| `item.mp3` | Small bell chord when you gain an item |
| `chapter.mp3` | Deep boom under a chapter title |
| `map.mp3` | Soft paper rustle when the sketchbook changes |
| `select.mp3` | Choice confirmed, gentle chime |
| `hover.mp3` | Very soft tick when hovering a choice |
| `advance.mp3` | Soft paper whoosh between scenes |
