# MG1 — Échantillonnage de scellés / Evidence sampling

Related to issues #12 (design and catalogue, awaiting maintainer validation) and #13 (implementation, closed). Entry point: `ex_sampling.html`, linked from `exercices.html`. Data: `assets/data/sampling.js` (`window.SAMPLING`, classic script). Logic and SVG drawing live inline in the page.

## Review status

The forensic parameters (yields, suitability factors, fluorescence table, the 0.05 ng/µL threshold) are teaching assumptions marked DRAFT in the data file. They are not validated laboratory values and have not been signed off by the maintainer (issue #12).

## Teaching design

Each case draws one of eight evidence objects (FTA reference card, T-shirt, bedsheet, underwear, sexual-assault swab, cigarette butt, knife, red stain on a hard surface) and generates its content at random:

- Between `gen.min` and `gen.max` stains are placed in non-overlapping `stainSlots`, each drawn by weight from the object's `stainPool` (blood, semen, saliva or a non-biological distractor).
- Worn objects also carry always-present `touchZones` (collar, armpits, handle, waistband): invisible, non-fluorescent, no presumptive test, low yield.
- On the red-stain object, a stain flagged `uncertain` is blood or paint with equal probability; only a Peroxtesmo test tells them apart.

The student may:

1. Shine a light (ALS or UV). Latent semen shows under both, saliva under ALS only, blood never fluoresces. Objects with `lightable: false` reveal nothing.
2. Arm an orientation test (Peroxtesmo, Phosphatesmo, Amylase) and click a point. The marker is positive only if the clicked spot (4-unit tolerance) holds that fluid with DNA.
3. Arm an instrument and click where to sample (12-unit tolerance), or declare that nothing is exploitable.

## Yield and grading

For a sampling click on a spot with DNA, yield is `spot.auto × suitability × r` with `r` uniform in [0.8, 1.2]. Suitability comes from `substrateTools[substrate][instrument]`; an instrument not listed is incompatible (0). Male DNA is derived from the spot's `maleMode` (`always` for semen, `mix` for sperm plus victim cells, `random`, `none`).

- Success: autosomal yield ≥ `threshold` (0.05 ng/µL). Grading is therefore outcome-based and lenient: any instrument that gets enough DNA passes, and the feedback separately comments on how good the instrument choice was (≥ 0.8 good, ≥ 0.4 acceptable, below that poor, 0 unsuitable).
- Declining is correct only when the object holds no DNA at all. Declining on an object with a stain or touch zone reveals the missed areas.
- Interpretation messages: differential extraction only when sperm is present; male DNA without sperm points to Y-STR; no male fraction means standard extraction. In the sexual-assault swab case the student is warned if no semen test was run, and on the red stain if blood was not confirmed.

## Scientific boundaries

Touch DNA is modelled as low-yield but exploitable, so a worn garment is never a "nothing to sample" case. The model has no extraction loss, no mixture ratios beyond the male fraction, and no inhibition. Stain placement is idealised; real casework would use search strategies and validated presumptive tests with known false positives. Numbers are not calibrated to any assay.

## Implementation and verification

- Case generation is unseeded (`Math.random`), so a case cannot be reproduced for debugging, unlike MG4.
- `node tools/sampling-selftest.mjs` / `npm run sampling:test` checks the data only: unique ids, complete FR/EN strings, instrument and fluid references, fluorescence rules, stain geometry inside the 400×260 canvas without overlap, distractors carrying no DNA, semen implying a male contributor. It does not exercise the page logic.
- Not automated: click handling, the yield and feedback paths, FR/EN switching and mobile layout. Language changes clear a displayed result to avoid mixed-language feedback.
