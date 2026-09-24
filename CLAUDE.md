# CLAUDE.md

Guidance for AI agents and contributors working in this repository.

## Project

A **static, bilingual (French/English) teaching site** for a forensic-genetics
Master's course (identification génétique). It gives students revision sheets,
past exams with corrections, procedurally-generated exercises, an exam-style MCQ,
and a forensic electropherogram (EPG) simulator.

- **No build step.** The site is plain HTML/CSS/JS served as-is.
- **Deployment:** GitHub Pages, published from the repository root by
  `.github/workflows/static.yml` on every push to `main`. The live site is
  therefore whatever is on `main`.

## Conventions

- **Vanilla HTML / CSS / ES modules** — no framework, no bundler, no transpile.
- **Shared front-end** lives in `assets/`:
  - `assets/site.css` — the single design system (all pages link it).
  - `assets/i18n.js` — the bilingual runtime.
  - `assets/layout.js` — injects the shared header, nav and footer.
- **Bilingual (FR/EN):** the chosen language is stored in `localStorage` and
  applied by `i18n.js`. Static text uses either a `data-i18n="key"` lookup or
  inline `data-fr="…" data-en="…"` (and `data-fr-html`/`data-en-html` for rich
  text). Dynamic views read `I18N.getLang()` / `I18N.pick({fr,en})` and re-render
  on the `langchange` event that fires whenever the language flips. Every page
  sets `<body data-page="…">` so `layout.js` can mark the active nav item.
- **Content as data:** question banks live in `assets/data/`
  (`flashcards.js`, `mcq.js`) as `{fr,en}` objects, not hard-coded in pages.
- **EPG core:** `assets/epg/` is a set of **ES modules** shared by the browser
  (via `<script type="module">`) and by Node (the CLI in `tools/`). `package.json`
  sets `"type": "module"` so Node treats these `.js` files as ESM; it is inert for
  the static site. See `docs/epg.md` for the module map.

## Testing

- **EPG core self-tests:** `node tools/epg-selftest.mjs` (invariant checks over
  many seeded cases; exits non-zero on failure).
- **Run the site locally:** `python3 -m http.server` from the repository root,
  then open `http://localhost:8000/`.
- There is no CI test job — deployment (`static.yml`) is the only workflow.

## Branch & merge rules

- **Never do implementation work on `main`.** Always branch, then open a pull
  request.
- **Vibe** (delegated executor) never pushes to or merges `main`; its terminal
  state is an open PR, or a documented blocker. It only takes `ai:trivial` issues.
- **Claude** pushes or merges to `main` **only** when the maintainer explicitly
  says to. Approval to implement an issue, or approval of a PR, is not by itself
  approval to merge.
- A completed change ends as a **PR**, not commits left on a branch.

## AI routing

Issues are labelled with exactly one tier:

- **`ai:plan`** — an unresolved design or architecture decision. Owned by Claude.
- **`ai:thinking`** — implementation that needs real reasoning, but the
  architecture is already settled. Claude or another capable agent (e.g. Codex).
- **`ai:trivial`** — bounded execution whose decisions are already made, so it can
  be implemented from the issue text alone. Delegable to Vibe.

If an `ai:trivial` issue turns out to need a design or product decision, stop and
reclassify it as `ai:thinking` or `ai:plan` rather than deciding it during
execution.
