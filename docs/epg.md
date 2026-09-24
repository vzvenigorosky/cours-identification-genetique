# EPG Subsystem Map

## Module map
- `rng.js` – seedable PRNG (mulberry32) + sampling helpers
- `panels.js` – kit panels: GlobalFiler (autosomal + sex markers) and Yfiler Plus (Y-STR)
- `frequencies.js` – per-locus allele-frequency model (approximate European)
- `genetics.js` – genetic sampling: single-source profiles and relationship builders
- `simulate.js` – peak simulation with GeneMapper-style realism
- `render-svg.js` – GeneMapper-style SVG renderer
- `index.js` – top-level EPG case generator

## `generateCase(spec)` contract
Input fields: `kit`, `type`, `seed`, `template`, `degradation`, `ratio`, `art`, `width`.
Output shape: `{ samples, svg, answerKey }`.

## Case types
The `CASE_TYPES` list exported from `assets/epg/index.js`:
`clean`, `degraded`, `mixture2`, `mixture3`, `parent-child`, `full-siblings`, `half-siblings`, `avuncular`, `grandparent`, `unrelated`

## Data note
Allele bins and frequencies are **approximate / European teaching values**, isolated in `assets/epg/panels.js` and `assets/epg/frequencies.js` as swap points for lab-exact data.

## CLI usage
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
