# ThermoStat — 5-minute keynote

Motion uses GSAP (stored locally in `assets/vendor/gsap`) for word-by-word headline reveals, heat-line draws and count-ups. If GSAP is missing, the deck falls back to CSS transitions.

Open `index.html` in Chrome, or run `python3 -m http.server` in this folder and visit http://localhost:8000. It works offline with no build step.

| Key | Action |
|---|---|
| → · Space · PageDown · click | Next (including builds on slides 5, 15, 16) |
| ← · PageUp | Back |
| Home / End | First / last slide |
| number + Enter | Jump to that slide |
| F | Fullscreen |
| S | Presenter view in a second window (now / next / notes / 5:00 timer) |
| O | Overview grid (arrows + Enter, or click a slide) |
| B or . | Blank screen |

A link like `index.html#/7` opens slide 7 directly. Add `?motion=off` for instant cuts (the deck also follows the system's reduced-motion setting).

**PDF backup:** in Chrome choose Print → Save as PDF, with margins set to None and Background graphics on. You get one slide per page with the speaker notes underneath.

**Team slide:** edit the `TEAM` block at the top of `assets/js/deck.js`. Put photos in `assets/img/team/`.

**Speaker notes** are the `<aside class="notes">` blocks in `index.html`. Image and data credits are in `CREDITS.md`.
