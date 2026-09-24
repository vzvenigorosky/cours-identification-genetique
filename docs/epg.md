# EPG simulator (`assets/epg/`)

A procedural generator of realistic **GlobalFiler** and **Yfiler Plus**
electropherograms (EPGs), as they come out of GeneMapper. The same ES-module core
powers the in-browser lab (`epg.html`) and the Node batch CLI
(`tools/epg-cli.mjs`).

## Module map

| Module | Responsibility |
|--------|----------------|
| `rng.js` | Seedable PRNG (mulberry32) + sampling helpers → reproducible cases. |
| `panels.js` | Kit panels: loci, dye channels, allele bins and bp sizing for GlobalFiler and Yfiler Plus. |
| `frequencies.js` | Per-locus allele-frequency model used when sampling genotypes. |
| `genetics.js` | Sampling of single-source profiles, mixtures, and kinship relationships. |
| `simulate.js` | Turns genotypes into peaks: heights, stutter, degradation, drop-out, and artifacts. |
| `render-svg.js` | Renders peaks to a GeneMapper-style multi-dye SVG (and stacks pairs). |
| `index.js` | `generateCase(spec)` orchestrator + the `CASE_TYPES` list. |

## `generateCase(spec)`

Exported from `assets/epg/index.js`. All `spec` fields are optional.

**Input (`spec`):**

| Field | Meaning |
|-------|---------|
| `kit` | `"globalfiler"` (default) or `"yfilerplus"`. |
| `type` | One of `CASE_TYPES` (default `"clean"`). |
| `seed` | String or number → reproducible output (default random). |
| `template` | Template amount in RFU (defaults by type). |
| `degradation` | Degradation strength `k`, 0–4 (defaults by type). |
| `ratio` | Mixture ratio, e.g. `[3, 1]` (mixtures only). |
| `art` | Per-artifact toggles, e.g. `{ stutter: true, pullup: false, … }`. |
| `width` | SVG width in px (default 1300). |
| `thresholds` | Optional `{ at, st, saturation }` overrides. |

**Output:**

```js
{
  kit, kitLabel, type, seed,
  samples,   // one per EPG (2 for kinship pairs); each has { label, sim, render, observed }
  svg,       // the rendered SVG string (stacked for pairs)
  answerKey  // ground truth: genotypes, mixture ratio, degradation,
             // relationship + sharing summary / Y-haplotype match
}
```

## Case types (`CASE_TYPES`)

```
clean, degraded, mixture2, mixture3,
parent-child, full-siblings, half-siblings, avuncular, grandparent, unrelated
```

## Data provenance

The allele bins and frequencies are **approximate, European-oriented teaching
values — not a lab-exact bin set.** They are isolated in `assets/epg/panels.js`
(loci, dyes, bp sizing) and `assets/epg/frequencies.js` (allele frequencies) as
deliberate swap points: replace those two files with a lab's real GeneMapper bins
and population frequency table to make the output lab-exact, without touching the
rest of the core.

## Batch CLI (`tools/epg-cli.mjs`)

```
EPG batch generator
  --kit         globalfiler | yfilerplus         (default globalfiler)
  --type        clean | degraded | mixture2 | mixture3 | parent-child | full-siblings | half-siblings | avuncular | grandparent | unrelated
  --n           number of cases                   (default 10)
  --seed        base seed (string or number)      (default 1)
  --ratio       mixture ratio e.g. 3:1            (mixtures only)
  --template    template RFU                       (optional)
  --degradation degradation k 0..4                 (optional)
  --width       SVG width px                        (default 1300)
  --out         output directory                    (default out)
  --png         also rasterise to PNG (Playwright)
```

Each run writes `NNN.svg` + `NNN.json` (genotypes + answer key) per case and a
`manifest.csv`; `--png` also rasterises each SVG via the pre-installed Playwright
/ Chromium. Seeded runs are reproducible, so exam batches can be regenerated.

Self-tests: `node tools/epg-selftest.mjs`.
