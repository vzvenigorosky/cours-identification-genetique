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
Input fields: `kit`, `type`, `seed`, `template`, `degradation`, `ratio`, `art`, `width`. Optional presentation fields: `zoomLocus`, `showBins`, `revealKind`, `controls`.

Output shape: `{ samples, svg, answerKey }`.

## Per-locus zoom (issue #73)

`generateCase({ kit: "globalfiler", type: "clean", seed: "demo", zoomLocus: "D21S11" })` magnifies the fragment-size axis around the selected locus's allele bins, with at least two repeat units of flanking context for neighbouring stutter and minus-A. **It does not resimulate or alter genotypes, peaks or the answer key**: only the rendered SVG, its local RFU scale and bin/size-axis labels change. All five dye channels retain one common base-pair axis so aligned pull-up peaks in different dyes remain comparable. An invalid locus for the kit raises `RangeError`.

The EPG lab (`epg.html`) provides a bilingual `Vue globale / Full electropherogram` selector and one option per kit locus. Changing the selection reuses the same seed, case type and settings; allelic ladder and controls, when requested, are displayed with the same zoom. Omitting `zoomLocus` preserves the ordinary full-view display. The per-locus interval, kit bins and stochastic threshold remain approximate teaching values, not validated sizing or analytical thresholds.

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
