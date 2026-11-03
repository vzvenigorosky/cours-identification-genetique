# MG3 — Programmer la PCR / Program the PCR

Entry point: `ex_pcr.html`, linked from `exercices.html`. Data, model constants and the amount model: `assets/data/pcr.js` (`window.PCR`, classic script). The page imports the shared EPG core (`assets/epg/`) and reuses the simulator and SVG renderer. The GlobalFiler kit is used. Later changes are tracked in #40 (amplification animation) and #42 (steeper cycle model, catastrophic settings, forced homozygotes).

## Review status

All constants and bands are DRAFT and tunable, pending the maintainer's scientific review. The comment in `pcr.js` points to issue #12 for that validation, but #12 is the MG1 sampling design; the reference looks stale and should be corrected by the maintainer or in a follow-up.

## Teaching design

Each case draws a random profile, forces a few autosomal loci to be homozygous, and draws a random extract concentration in `input.concRange` (0.10–2.5 ng/µL). The student:

1. Chooses the extract volume to load. Loaded mass is `concentration × volume`; the target is 1.0 ng (accepted band 0.5–1.25 ng) in a 25 µL reaction, with at most 15 µL of extract. Every concentration in range can reach the target within the volume limit.
2. Edits the full thermal protocol, pre-filled with the defaults: initial denaturation, cycle denaturation, annealing, extension, final extension (each a temperature and a time) and the number of cycles. Every field is editable and graded against its own band.
3. Runs the PCR, watches the per-cycle amplification curve (can be skipped; skipped automatically with reduced-motion; the previous run is shown as a grey comparison curve), then reads the resulting electropherogram.

`homozygousLoci` (4) autosomal loci are forced to a single allele per case (`PCR.applyHomozygous`), so the student must tell a true homozygote from allele drop-out rather than reading only easy heterozygotes.

## Model

The model lives in `PCR.effectiveAmount(vals, loadedNg)`, shared by the page and the self-test. It returns an effective template amount, a degradation value and the list of offending settings, which feed the simulator:

`amount = A_OPT × (loaded ng / target ng) × cycleFactor × efficiency`, with `A_OPT = 1500`.

- `cycleFactor = 1.9^(cycles − 29)`, clamped to [0.01, 8]. The steep gain and low floor mean a clearly insufficient cycle count falls below the detection threshold (NULL or heavily dropped profile) and too many cycles over-amplify.
- Each field outside its band multiplies `efficiency` by that direction's `effMul` (≤ 1) and adds that direction's `degAdd` to the degradation, which is clamped to [0, 4]. Degradation makes large amplicons drop out first.
- Fields with a `kill` value (initial and cycle denaturation temperature, annealing too hot, extension temperature) scale the penalty with distance past the band edge: severity runs from 0 at the edge to 1 at `kill`, efficiency is multiplied by `(1 − severity)` and degradation by `0.3 + 0.7 × severity`. At or beyond `kill` the amount is about 0, i.e. a NULL profile (for example a 150 °C initial denaturation). A value just outside the band is only a mild penalty.
- The simulator runs with artefact calling on (pull-ups labelled), spurious Y-marker calls, and frequent off-ladder alleles, so the output resembles a GeneMapper-style call table.
- The display ceiling is fixed at 7000 RFU, so over-amplified peaks read as off-scale instead of the axis rescaling.
- `PCR.ampCurve(amount, cycles)` builds the animation: a logistic curve normalised so its last point equals `amount`, so the curve and the electropherogram agree. It is a teaching illustration, not real kinetics.

## Grading

A run passes only when both hold:

- No set-up fault: volume within the maximum, loaded mass within the band, and every thermal field within its band.
- The electropherogram is usable: every reference allele is observed at every locus (otherwise the loci with drop-out are listed) and no peak is saturated or taller than `OVER` (7000 RFU).

On failure the feedback lists the symptoms (drop-out loci, off-scale peaks) and one cause per out-of-band field, each with a short mechanistic explanation (for example, a short final extension giving incomplete adenylation and split −A peaks). A set-up fault that happens to give a clean profile still fails, so cause and symptom are both shown.

## Scientific boundaries

Bands and effect sizes are teaching approximations, not kit validation data; real kits come with a fixed validated protocol. The cycle and input scaling is a smooth toy model, not stochastic PCR kinetics, and the `kill` values are chosen so extreme settings read as failures rather than taken from enzyme data. Inhibition, primer-binding variation and instrument injection effects are not modelled. Extract concentration is taken as known, which skips the quantification step handled upstream in MG2.

## Implementation and verification

- Cases and simulator noise are unseeded (`Math.random`), so a run cannot be reproduced for debugging.
- `node tools/pcr-selftest.mjs` / `npm run pcr:test` checks the data and the amount model: FR/EN completeness, threshold ordering, reachability of the target input, every default sitting inside its own band, effect values in range, `kill` values beyond the band, the in-band defaults giving exactly `A_OPT` with no offender, a 150 °C denaturation and 20 cycles falling below detection, 97 °C and 28 cycles staying usable, 34 cycles over-amplifying, `applyHomozygous` behaviour, and `ampCurve` shape. It does not run the page's grading (`renderEpgAndGrade`) or the simulator output.
- Not automated: the simulation-to-grade path, the animation, FR/EN switching and mobile layout. Language changes re-render the givens, the protocol form and the last feedback.
