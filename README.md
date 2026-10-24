# The Last Lantern — Part One

A dark voxel visual story in the browser. Part One runs from the Prologue in Wexley, 1926, through the Mirelight Fens (Chapter Three): about 15 minutes, 4 choices, 1 item, and a Living Map that fills in as you travel.

Built with plain HTML, CSS and JavaScript modules, and [three.js](https://threejs.org) 0.160 loaded from a CDN. There is no build step.

## Run it

ES modules do not load from a double-clicked file, so serve the folder:

- **GitHub Pages:** push this folder to a repository, then Settings → Pages → Deploy from branch → `main` / root. Open the URL it gives you.
- **Vercel or Netlify:** import the repository as a static site, with no framework and no build command.
- **Locally:** `npx serve .` or `python3 -m http.server`, then open the address shown.

## Controls

| Action | Input |
| --- | --- |
| Continue / reveal all text | Click, tap, Space, Enter, → , scroll down, or swipe up |
| Pick a choice | Click a card, or press 1, 2, 3 |
| Theo's sketchbook (the map) | M, or the book button |
| Sound on/off | S, or the speaker button |
| Restart chapter / start over | The ··· menu |

Progress saves in the browser, and the title screen offers **Continue**.

## Adding voices, music and sound effects

See **[AUDIO.md](AUDIO.md)** for every file name, line, and voice direction. Drop MP3s into `audio/vo/`, `audio/music/` or `audio/sfx/` and push. Anything missing falls back to the built-in generative score and sound effects.

If you change any line in `js/story.js`, regenerate the list with:

```
node tools/audio-list.mjs
```

## Project layout

| Path | What it holds |
| --- | --- |
| `index.html`, `style.css` | Page structure and all UI styling |
| `js/story.js` | The script: scenes, lines, choices, map reveals. Edit text here. |
| `js/main.js` | Story flow, text panel, choices, saving, input |
| `js/sets.js` | The six voxel dioramas and their camera shots and animations |
| `js/stage.js` | Renderer, bloom, film grain, camera moves |
| `js/voxel.js` | Voxel builder and blocky figures |
| `js/audio.js` | Generative music, sound effects, voice playback |
| `js/map.js` | The Living Map overlay |
| `assets/coil-map.jpg` | The world map used by the title screen and the sketchbook |

## Testing a single scene

Add `?scene=<id>` to the URL to jump straight to a scene, for example `?scene=ch3_05&nocard=1`. Choices can be preset with `&keepsake=dividers&purpose=see&hour=trade&skiff=chart`. Scene ids are in `js/story.js`.
