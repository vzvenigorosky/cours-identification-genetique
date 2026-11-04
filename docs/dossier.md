# Dossier complet simplifié / Simplified full case

Entry point: `ex_dossier.html` (linked as a prototype from `exercices.html`). Logic and data: `assets/data/dossier.js` (pure ES module shared by the browser and Node). UI: `assets/dossier-ui.js`. Tests: `tools/dossier-selftest.mjs` (`npm run dossier:test`, in PR CI).

## Review status

Prototype for the maintainer's scientific review. Package contents and prices are those specified by the maintainer. Everything else (concentrations, degradation, thresholds, mutation allowance, ancestry and phenotype model, texts) is a **teaching assumption drafted by Claude**, not a validated laboratory protocol.

## Flow (no score anywhere)

1. **Requisition**, clear or vague. « Demander des précisions » works on any requisition: if it was vague the requester's answer is shown; if it was already clear a blue information box says so (never an error). « Proposer un devis » moves on.
2. **Quote**, one proposal per scellé (or none): Trace 100 €, Référence 50 €, « Trace — autosomaux + STR-Y » 100 €, « Référence — autosomaux + STR-Y » 50 €, « Trace — autosomaux + mtDNA » 600 €, « Référence — autosomaux + mtDNA » 400 €, Orientation 400 € (contents as specified). The Y and mtDNA names say that the autosomal STR profile(s) are included (#88). A muscle / organ fragment is quoted as a **Trace** (two extractions), not as a Référence, which is for a reference sample already taken such as a cheek swab (#86). « Vérifier » shows amber warnings: scellé not covered, scellé not needed (with the reason), Trace vs Référence mismatch, lineage marker missing / unnecessary / wrong lineage, Orientation mismatch. If the requisition was vague and nothing was asked, the warnings say they rely on the full information.
3. **Sampling**: the quote fixes the number of extractions per scellé; for each, choose the area (target, peripheral, or blank control). Warnings: no/unused extraction, blank area, peripheral area, target area never sampled.
4. **Quantification**: autosomal DNA (ng/µL), male DNA, degradation index, mtDNA copies.
5. **Amplification**: choose the extract of each analysis the quote paid for; the same extract may serve two profiles. Warnings: no extract, unassigned, very low concentration, a clearly better extract exists, no male DNA for a Y analysis (information: same extract used twice).
6. **Results**: autosomal profiles (columns per profile, `—` untyped, `a, *` single allele that may hide drop-out), Y / mtDNA haplotypes as **a code plus a quality percentage** (markers amplified, or share of the sequence), NGS ancestry / phenotype probabilities. Tools: kinship (LR for same person, parent–child, full siblings, second degree; haplotype comparison), consensus of replicates **built by the student** (tick replicates, add a column, then choose allele 1 / allele 2 at each locus among the alleles observed; no automatic consensus, #92), random match probability. No conclusion box; « Révéler la réponse » shows what could be concluded, with the student's results and with complete profiles.

## Consensus (student-built, #92)

The consensus tool no longer computes anything. The student ticks two or more replicate profiles and adds a **consensus column** (starts empty, 0/21 loci typed). In each cell, two drop-downs offer only the alleles actually observed in the chosen replicates: two alleles = genotype (the same twice = homozygote), one allele = partial (`a, *`), none = not typed. « Vérifier mon consensus » gives amber, ungraded hints. The column then feeds the kinship and frequency tools and the reveal like any other profile.

## Modelling choices and simplifications

- The requisition of every case with unidentified remains states their sex (« les restes sont ceux d’un homme / d’une femme non identifié(e) »), matching the simulated person (#87).
- **One source per sampling area; no mixtures, no differential extraction.** A vaginal-swab-style mixture is out of scope; the exercise says so on the page.
- Cases: `id-parent`, `id-uncle` (Y), `id-maternal-aunt` (mtDNA), `sa-ejaculation`, `misc-flat` reuse the réquisition texts, vague/clear variants and clarifications of the quote simulator (`devis.js`, `requisition-shared.js`); their expected package comes from `expectedLine`. `trace-suspect` and `orientation` are new. The 14-swab sexual-assault template (`sa-sites`) is not reused (too many scellés for a full run). Tariffs (garde à vue, urgence) do not exist here; deadline sentences are suppressed.
- Genetic truth: persons are built with the EPG genetics module (Mendelian autosomes, Y from the father with a 0.2 % one-step mutation, mtDNA from the mother). Profiles come from the EPG peak simulator (21 GlobalFiler autosomal loci, 25 Yfiler Plus markers), called at AT 150 / ST 400 RFU; a single allele below ST is shown as `a, *`.
- mtDNA: 24 variable sites in 8 amplicons; quality = amplicons obtained. Y: quality = markers fully typed. Haplotype codes are hashes of the typed values; comparison uses the markers typed in both.
- **Kinship levels (#95 #96 #97):** PO (parent–offspring), FS (full siblings) and HS/AV/GC (half-siblings / avuncular / grandparent–grandchild; same IBD probabilities, so indistinguishable with these markers). Per locus, pairwise IBD formula (k0, k1, k2) on loci typed in both profiles; frequencies from `assets/epg/frequencies.js` (approximate European). **No mutation allowance for the levels: one locus with no shared allele makes the PO LR and the PO posterior exactly 0.** Two non-PO relatives (uncle/nephew, aunt/nephew) show such exclusions in practice (100 % of complete profiles over 300 seeds; ~98–99 % of noisy simulated runs, the rest typed too few discriminating loci); true parent–offspring pairs showed none in 1,500 simulated comparisons. For each level the tool shows the **LR against unrelated and the posterior probability**: posterior_i = prior_i × LR_i / Σ prior × LR over PO, FS, HS/AV/GC and unrelated (LR 1). **Priors are equal (25 % each) — a teaching assumption to confirm.** A pair of identical profiles (replicates) is flagged: kinship levels do not apply to one person. The "same person" identity LR (used by the profile-match comparison) keeps a 0.2 % typing-error allowance. Random match = product of p² / 2pq over reliably typed loci, no θ correction. Lineage haplotype frequency is deliberately **not** computed (needs a counting database).
- Reveal wording: statements compare profiles only, use a verbal LR scale, and end with a fixed sentence saying nothing is inferred about the case. The test suite rejects assertive words (guilty, proves, certainty…).

## Owner decisions

- **Y-STR is intentionally free.** Trace-Y costs the same as Trace (100 €) and Référence-Y the same as Référence (50 €). Confirmed by the owner (2026-11-04); not a typo, not to be "fixed".

## Points still open for the maintainer

- Orientation replaces the STR profile (no STR is produced); the two Orientation cases state that no STR profile is requested.
- Concentration ranges, the 5 pg/µL indicative threshold, degradation-to-drop-out mapping and the ancestry / phenotype tables need review.
- A scellé takes exactly one package; adding a second package to the same scellé is not possible.

## Verification

`node tools/dossier-selftest.mjs`: package contents and prices; every template × variant × 25 seeds (bilingual, reproducible, ideal quote / sampling / analysis warning-free, reveal non-empty and free of assertive wording); each quote, sampling and analysis warning; extraction and PCR behaviour; sibling LR against the closed form, RMP, building a profile from the student's consensus calls and each ungraded consensus hint (allele seen once, reproduced allele left out, unsupported homozygote, empty locus), haplotype comparison; lineage truth (uncle/Y, aunt/mtDNA, parent/child Mendelian); NGS output sums. Browser flow (FR/EN, 375 px, console) checked with headless Chromium; see the PR for the matrix.
