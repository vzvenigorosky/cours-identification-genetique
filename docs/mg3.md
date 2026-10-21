# MG3 — Programmer la PCR / Program the PCR

Entry point: `ex_pcr.html`, linked from `exercices.html`. Data and model constants: `assets/data/pcr.js` (`window.PCR`, classic script). The page imports the shared EPG core (`assets/epg/`) and reuses the simulator and SVG renderer. The GlobalFiler kit is used.

## Review status

All constants and bands are DRAFT and tunable, pending the maintainer's scientific review. The comment in `pcr.js` points to issue #12 for that validation, but #12 is the MG1 sampling design; the reference looks stale and should be corrected by the maintainer or in a follow-up.

## Teaching design

Each case draws a random profile and a random extract concentration in `input.concRange` (0.10–2.5 ng/µL). The student:

1. Chooses the extract volume to load. Loaded mass is `concentration × volume`; the target is 1.0 ng (accepted band 0.5–1.25 ng) in a 25 µL reaction, with at most 15 µL of extract. Every concentration in range can reach the target within the volume limit.
2. Edits the full thermal protocol, pre-filled with the defaults: initial denaturation, cycle denaturation, annealing, extension, final extension (each a temperature and a time) and the number of cycles. Every field is editable and graded against its own band.
3. Runs the PCR and reads the resulting electropherogram.

## Model

The simulator takes an effective template amount and a degradation value:

`amount = A_OPT × (loaded ng / target ng) × cycleFactor × efficiency`, with `A_OPT = 1500`.

- `cycleFactor = 1.3^(cycles − 29)`, clamped to [0.2, 6].
- Each field outside its band multiplies `efficiency` by that direction's `effMul` (≤ 1) and adds that direction's `degAdd` to the degradation, which is clamped to [0, 4]. Degradation makes large amplicons drop out first.
- The simulator runs with artefact calling on (pull-ups labelled), spurious Y-marker calls, and frequent off-ladder alleles, so the output resembles a GeneMapper-style call table.
- The display ceiling is fixed at 7000 RFU, so over-amplified peaks read as off-scale instead of the axis rescaling.

## Grading

A run passes only when both hold:

- No set-up fault: volume within the maximum, loaded mass within the band, and every thermal field within its band.
- The electropherogram is usable: every reference allele is observed at every locus (otherwise the loci with drop-out are listed) and no peak is saturated or taller than `OVER` (7000 RFU).

On failure the feedback lists the symptoms (drop-out loci, off-scale peaks) and one cause per out-of-band field, each with a short mechanistic explanation (for example, a short final extension giving incomplete adenylation and split −A peaks). A set-up fault that happens to give a clean profile still fails, so cause and symptom are both shown.

## Scientific boundaries

Bands and effect sizes are teaching approximations, not kit validation data; real kits come with a fixed validated protocol. The cycle and input scaling is a smooth toy model, not stochastic PCR kinetics. Inhibition, primer-binding variation and instrument injection effects are not modelled. Extract concentration is taken as known, which skips the quantification step handled upstream in MG2.

## Implementation and verification

- Cases and simulator noise are unseeded (`Math.random`), so a run cannot be reproduced for debugging.
- `node tools/pcr-selftest.mjs` / `npm run pcr:test` checks the data and model constants only: FR/EN completeness, threshold ordering, reachability of the target input, every default sitting inside its own band, and effect values in range. It does not run the page's `compute()` or grading, which are inline in the HTML.
- Not automated: the simulation-to-grade path, FR/EN switching and mobile layout. Language changes re-render the givens, the protocol form and the last feedback.
