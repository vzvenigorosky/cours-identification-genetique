Claude repository instructions

Read and follow AGENTS.md before any repository investigation, planning, editing, testing, or GitHub action. It is the canonical policy for all models and tools.

This file adds no exceptions. In particular: never work or push directly on main; never merge without the repository owner’s explicit instruction for that specific merge; prefer comprehensive verification; open a PR and stop for implementation tasks.

Claude will frequently be asked to act as an independent reviewer of issues, architectural plans, tests, and PRs authored by other agents (including less capable or less reliable ones). Apply section 9 of AGENTS.md: verify claims against the repository and actual test evidence, identify incorrect routing or architectural assumptions, and provide actionable review findings. Do not approve merely because an agent reports success. Reviewing or recommending a merge never authorizes merging.

For GitHub actions, follow the model-and-initiation disclosure requirements in section 14 of AGENTS.md. Identify the actual model when exposed; distinguish owner-requested actions from actions initiated under delegated authority. An agent-executed merge is permitted only on an explicit owner instruction for that PR and must be labeled owner-requested. Do not attribute the owner’s direct GitHub actions to an AI.

## Project

Static bilingual (FR/EN) GitHub Pages teaching site for a forensic-genetics Master's course. No build step; deployed from the repo root by `.github/workflows/static.yml` on push to `main`, so a merge to `main` is a production deploy.

## Conventions

Vanilla HTML / CSS / ES modules. Shared front-end: `assets/site.css`, `assets/i18n.js`, `assets/layout.js`. Bilingual via `localStorage` + `data-i18n` and inline `data-fr` / `data-en`, re-rendered on the `langchange` event; shared header/nav/footer are injected by `layout.js`. Content lives as data in `assets/data/` (`flashcards.js`, `mcq.js`, and the exercise data files). The EPG core in `assets/epg/` is ES modules shared by the browser and Node (`package.json` has `"type": "module"`).

## Testing

Self-tests live in `tools/` and are exposed as `npm run <name>:test` (`epg`, `mcq`, `cleanup`, `casework`, and any added since). `.github/workflows/ci.yml` runs them on every pull request. Serve the site locally with `python3 -m http.server`. Browser-level checks (FR/EN, mobile overflow, console errors) are not automated; report them as NOT RUN unless actually performed.

## AI routing

`ai:plan` = unresolved design/architecture (Claude-owned); `ai:thinking` = implementation needing real reasoning, architecture settled (Claude/Codex); `ai:trivial` = bounded execution, delegable to Vibe from the issue alone. These tiers describe task requirements, not model permissions (AGENTS.md section 3).

## Issue authoring

When an `ai:trivial` issue requires verbatim file or command output, paste the exact expected text into the issue rather than asking the executor to reproduce it. Executors copy literal text faithfully but can mangle re-derived output (for example, stripped newlines in a captured `--help` block).

## Content boundaries

Forensic parameters, thresholds, and rubrics in the exercises are teaching assumptions pending the maintainer's scientific review (see `docs/mg2.md`). Do not present them as validated laboratory protocols, and do not change them without the owner's decision.
