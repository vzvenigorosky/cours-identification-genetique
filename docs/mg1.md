# MG1 — Échantillonnage de scellés / Evidence sampling

Related to issues #12 (design and catalogue, awaiting maintainer validation) and #13 (implementation, closed); later changes are tracked in #43 (single forensic light, tool stringency), #47 (dry-swab penalty scope), #51 (muscle) and #57 (shoe). Entry point: `ex_sampling.html`, linked from `exercices.html`. Data: `assets/data/sampling.js` (`window.SAMPLING`, classic script). Logic and SVG drawing live inline in the page.

## Review status

The forensic parameters (yields, suitability factors, the dry-swab penalty, the fluorescence table, the 0.05 ng/µL threshold) are teaching assumptions marked DRAFT in the data file. They are not validated laboratory values and have not been signed off by the maintainer (issue #12).

## Teaching design

Each case draws one of fourteen evidence objects, chosen uniformly, and generates its content at random:

- Reference samples (single source): FTA card with blood, FTA card with saliva, blood tube.
- Worn or stained items: T-shirt, bedsheet, underwear, shoe, knife, red stain on a hard surface, cigarette butt, sexual-assault swab.
- Human remains: bone, muscle tissue, tooth.

Generation rules:

- Between `gen.min` and `gen.max` stains are placed in non-overlapping `stainSlots`, each drawn by weight from the object's `stainPool` (blood, semen, saliva, tissue or a non-biological distractor).
- Four objects (shirt, underwear, knife, shoe) also carry always-present `touchZones` (collar and armpits, waistband, handle, insole): invisible, non-fluorescent, no presumptive test, low yield.
- On the red-stain object, a stain flagged `uncertain` is blood or paint with equal probability; only a Peroxtesmo test tells them apart.
- Entries flagged `single` (references, bone, muscle, tooth) are single-source samples, which changes the extraction advice (see below).

The student may:

1. Use the forensic light. There is one combined button (Crimescope/UV; the ALS/UV distinction was removed in #43). Latent semen and saliva fluoresce, blood and other fluids never do. Only the three large fabric items (shirt, sheet, underwear) have `lightable: true`; on every other object the light reveals nothing and the student must reason from shape and context.
2. Arm an orientation test (Peroxtesmo, Phosphatesmo, Amylase) and click a point. The marker is positive only if the clicked spot (4-unit tolerance) holds that fluid with DNA.
3. Arm an instrument and click where to sample (12-unit tolerance), or declare that nothing is exploitable. Instruments: dry swab, moistened swab, scissors, scalpel, FTA puncher, pipette, Dremel drill, cryo-grinder.

## Yield and grading

For a sampling click on a spot with DNA, yield is `spot.auto × suitability × dryPenalty × r` with `r` uniform in [0.8, 1.2].

- Suitability comes from `substrateTools[substrate][instrument]`; an instrument not listed is incompatible (0). Substrates: card, fabric, metal, paper, swab, hard, bone, tooth, tissue, liquid, shoe.
- `dryPenalty` is `dryStainPenalty` (0.15) when a dry swab is used on a deposit with DNA and the substrate is in `dryPenaltySubstrates` (fabric, metal, hard, paper, shoe); otherwise 1. It does not apply to liquid blood or an FTA card (#47).
- Male DNA is derived from the spot's `maleMode` (`always` for semen, `mix` for sperm plus victim cells, `random`, `none`), scaled by the same factors.

A sampling succeeds only if both conditions hold:

- autosomal yield ≥ `threshold` (0.05 ng/µL), and
- the tool is acceptable: suitability ≥ `acceptTool` (0.5) and not a dry swab on a dried deposit (#43).

So grading is not purely outcome-based: the wrong instrument fails even if some DNA gets through (for example a moistened swab on a swab-type substrate at 0.4, or a dry swab on fabric). The feedback gives the reason: incompatible instrument (0), dry swab on a dried deposit, wrong instrument (below 0.5), acceptable but sub-optimal (0.5 to below 0.8), or good (≥ 0.8). Landing on a clean area, a distractor or paint also gives no DNA and fails.

- Declining is correct only when the object holds no DNA at all. Declining on an object with a stain or touch zone reveals the missed areas.
- Interpretation messages (shown only on success): single-source samples (`single`) get standard extraction; differential extraction only when sperm is present; male DNA without sperm points to Y-STR; no male fraction means standard extraction. In the sexual-assault swab case the student is warned if no semen test was run, and on the red stain if blood was not confirmed.

## Scientific boundaries

Touch DNA is modelled as low-yield but exploitable, so a worn garment is never a "nothing to sample" case. The model has no extraction loss, no mixture ratios beyond the male fraction, and no inhibition. Stain placement is idealised; real casework would use search strategies and validated presumptive tests with known false positives. The tool table and the dry-swab penalty are simplified teaching rules, not a validated sampling protocol. Numbers are not calibrated to any assay.

## Implementation and verification

- Case generation is unseeded (`Math.random`), so a case cannot be reproduced for debugging, unlike MG4.
- `node tools/sampling-selftest.mjs` / `npm run sampling:test` checks the data only: unique ids, complete FR/EN strings, instrument and fluid references, fluorescence rules (blood never, semen and saliva yes), a single light button, tape-lift removed, `acceptTool` and `dryStainPenalty` ranges, an acceptable tool existing for every substrate, the swab rules for liquid and card (#47), muscle and shoe tool rules (#51, #57), stain geometry inside the 400×260 canvas, distractors carrying no DNA, and semen implying a male contributor. It does not exercise the page logic (`sampleAt`, `decline`).
- Not automated: click handling, the yield and feedback paths, FR/EN switching and mobile layout. Language changes clear a displayed result to avoid mixed-language feedback.
