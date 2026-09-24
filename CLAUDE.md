# CLAUDE.md

## Project
Static bilingual (FR/EN) GitHub Pages teaching site for a forensic-genetics Master's course. No build step; deployed from the repo root by `.github/workflows/static.yml` on push to `main`.

## Conventions
Vanilla HTML / CSS / ES modules. Shared front-end: `assets/site.css`, `assets/i18n.js`, `assets/layout.js`. Bilingual via `localStorage` + `data-i18n` and inline `data-fr` / `data-en`, re-rendered on the `langchange` event; shared header/nav/footer are injected by `layout.js`. Content lives as data in `assets/data/` (`flashcards.js`, `mcq.js`). The EPG core in `assets/epg/` is ES modules shared by the browser and Node (`package.json` has `"type": "module"`).

## Testing
`node tools/epg-selftest.mjs` for the EPG core; serve the site locally with `python3 -m http.server`. A GitHub Actions workflow (`.github/workflows/ci.yml`) runs the self-test on every pull request.

## Branch & merge rules
Never do implementation work on `main`; always branch → PR. Vibe never pushes to or merges `main` and stops at an open PR. Claude pushes/merges to `main` only when the maintainer explicitly instructs it.

## AI routing
`ai:plan` = unresolved design/architecture (Claude-owned); `ai:thinking` = implementation needing real reasoning, architecture settled (Claude/Codex); `ai:trivial` = bounded execution, delegable to Vibe from the issue alone.

## Issue authoring
When an `ai:trivial` issue requires verbatim file or command output, paste the exact expected text into the issue rather than asking the executor to reproduce it. Executors copy literal text faithfully but can mangle re-derived output (for example, stripped newlines in a captured `--help` block).
