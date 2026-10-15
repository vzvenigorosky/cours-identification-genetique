# MG4 — Nettoyage de profil / Profile cleanup

Entry point: `ex_cleanup.html`, linked from `exercices.html`. Static ES modules, no build or dependencies. UI uses the shared layout and I18N language event.

## Teaching design

A focused GlobalFiler subset (D3S1358, D21S11, FGA) uses the existing approximate bins and shared simulator. One source has six distinct alleles; disjoint per-allele simulator components vary amplification strength and guarantee a low heterozygote partner at D3S1358. These components do not represent separate biological contributors. Every case contains baseline noise, stutter, detectable cross-channel pull-up and one simulated OL allele. Noise remains below the teaching analytical threshold (150 RFU); only detected peaks are graded.

Students classify each detected peak as retain, retain/review OL, exclude stutter or exclude pull-up. The retained-call list updates with their decisions. Checking reveals an itemized key, evidence, score and generator reference genotype; unanswered rows are incorrect. Editing clears stale grading; reset clears choices, and new case clears both. Switching FR/EN preserves case, choices, scale and checked state. Two display ceilings make smaller peaks inspectable; display clipping is distinguished from instrument saturation. Raw signal is always preserved.

## Scientific boundaries

Pull-up is spectral bleed-through at the parent's fragment size in a different dye; retain the parent allele. A tall allele alone is not classified as pull-up. Cross-channel alignment supports suspicion but does not establish origin in real casework, especially where genuine alleles overlap echoes. This exercise rejects these overlaps and orphan echoes caused by the simulator's later OL nudge. It does not modify the shared simulator or imply that all overload-related interpretation can be repaired by deleting calls.

Stutter is a repeat-offset PCR product, distinct from instrumental pull-up. Feedback reports its nominal parent-bin offset (an OL nudge can shift the displayed parent by 1 bp) and height ratio. Genuine alleles can occupy stutter positions in practice; no universal ratio cutoff is taught. An imbalanced allele remains an allele. OL is a sizing/binning flag: retain the candidate for review, not automatic deletion or a validated repeat-number assignment. The generator reference reveals simulated identity, not a validated OL designation. No mixtures, drop-in, minus-A, blobs or spikes are graded here.

Scientific reference: [SWGDAM autosomal STR interpretation guidelines, revision July 2021](https://www.swgdam.org/_files/ugd/4344b0_3f94c9a6286048c3924c58e2c230e74e.pdf), sections 1.5 (allele designation), 1.6 (non-allelic peaks) and 1.8 (heterozygote peak-height ratios). Lab-specific empirical validation, controls, ladders and reanalysis remain necessary for real data. Teaching thresholds and bins are not lab validation criteria.

## Implementation and verification

- `assets/data/cleanup.js`: seeded generation, bounded rejection of ambiguous cases, grading and bilingual explanations. `makeCase(seed)` reproduces a case for debugging; seed appears in the UI.
- `assets/cleanup-ui.js`: interpretation controls and feedback.
- `renderEPG(..., { neutralArtifacts: true })`: opt-in uniform peak opacity so artifact identity is not leaked by the renderer. Existing callers retain default rendering.
- `node tools/cleanup-selftest.mjs` / `npm run cleanup:test`: 250 seeded cases, reproducibility, all expected classes, OL identity, imbalance, echo-parent alignment, grading and renderer isolation. Included in PR CI alongside existing EPG and quiz self-tests.
- Browser checks: FR/EN, zero score for unanswered rows, full score using corrections, language preservation, scale change, revision clearing feedback, reset/new case, mobile horizontal scrolling, and no warning/error console entries.
