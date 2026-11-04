# Dossier complet simplifié / Simplified full case

Entry point: `ex_dossier.html` (linked as a prototype from `exercices.html`). Logic and data: `assets/data/dossier.js` (pure ES module shared by the browser and Node). UI: `assets/dossier-ui.js`. Tests: `tools/dossier-selftest.mjs` (`npm run dossier:test`, in PR CI).

## Review status

Prototype for the maintainer's scientific review. Package contents and prices are those specified by the maintainer. Everything else (concentrations, degradation, thresholds, mutation allowance, ancestry and phenotype model, texts) is a **teaching assumption drafted by Claude**, not a validated laboratory protocol.

## Flow (no score anywhere)

1. **Requisition**, clear or vague. « Demander des précisions » works on any requisition: if it was vague the requester's answer is shown; if it was already clear a blue information box says so (never an error). « Proposer un devis » moves on.
2. **Quote**, one proposal per scellé (or none): Trace 100 €, Référence 50 €, Trace-Y 100 €, Référence-Y 50 €, Trace-mtDNA 600 €, Référence-mtDNA 400 €, Orientation 400 € (contents as specified). « Vérifier » shows amber warnings: scellé not covered, scellé not needed (with the reason), Trace vs Référence mismatch, lineage marker missing / unnecessary / wrong lineage, Orientation mismatch. If the requisition was vague and nothing was asked, the warnings say they rely on the full information.
3. **Sampling**: the quote fixes the number of extractions per scellé; for each, choose the area (target, peripheral, or blank control). Warnings: no/unused extraction, blank area, peripheral area, target area never sampled.
4. **Quantification**: autosomal DNA (ng/µL), male DNA, degradation index, mtDNA copies.
5. **Amplification**: choose the extract of each analysis the quote paid for; the same extract may serve two profiles. Warnings: no extract, unassigned, very low concentration, a clearly better extract exists, no male DNA for a Y analysis (information: same extract used twice).
6. **Results**: autosomal profiles (columns per profile, `—` untyped, `a, *` single allele that may hide drop-out), Y / mtDNA haplotypes as **a code plus a quality percentage** (markers amplified, or share of the sequence), NGS ancestry / phenotype probabilities. Tools: kinship (LR for same person, parent–child, full siblings, second degree; haplotype comparison), consensus of replicates, random match probability. No conclusion box; « Révéler la réponse » shows what could be concluded, with the student's results and with complete profiles.

## Modelling choices and simplifications

- **One source per sampling area; no mixtures, no differential extraction.** A vaginal-swab-style mixture is out of scope; the exercise says so on the page.
- Cases: `id-parent`, `id-uncle` (Y), `id-maternal-aunt` (mtDNA), `sa-ejaculation`, `misc-flat` reuse the réquisition texts, vague/clear variants and clarifications of the quote simulator (`devis.js`, `requisition-shared.js`); their expected package comes from `expectedLine`. `trace-suspect` and `orientation` are new. The 14-swab sexual-assault template (`sa-sites`) is not reused (too many scellés for a full run). Tariffs (garde à vue, urgence) do not exist here; deadline sentences are suppressed.
- Genetic truth: persons are built with the EPG genetics module (Mendelian autosomes, Y from the father with a 0.2 % one-step mutation, mtDNA from the mother). Profiles come from the EPG peak simulator (21 GlobalFiler autosomal loci, 25 Yfiler Plus markers), called at AT 150 / ST 400 RFU; a single allele below ST is shown as `a, *`.
- mtDNA: 24 variable sites in 8 amplicons; quality = amplicons obtained. Y: quality = markers fully typed. Haplotype codes are hashes of the typed values; comparison uses the markers typed in both.
- LR: pairwise IBD formula (k0, k1, k2) per locus on loci typed in both profiles, blended with a 0.2 % mutation / error term; frequencies from `assets/epg/frequencies.js` (approximate European). Random match = product of p² / 2pq over reliably typed loci, no θ correction. Lineage haplotype frequency is deliberately **not** computed (needs a counting database).
- Reveal wording: statements compare profiles only, use a verbal LR scale, and end with a fixed sentence saying nothing is inferred about the case. The test suite rejects assertive words (guilty, proves, certainty…).

## Points for the maintainer

- Trace-Y costs the same as Trace (100 €) and Référence-Y the same as Référence (50 €), as written in the specification: is the add-on meant to be free?
- Orientation replaces the STR profile (no STR is produced); the two Orientation cases state that no STR profile is requested.
- Concentration ranges, the 5 pg/µL indicative threshold, degradation-to-drop-out mapping and the ancestry / phenotype tables need review.
- A scellé takes exactly one package; adding a second package to the same scellé is not possible.

## Verification

`node tools/dossier-selftest.mjs`: package contents and prices; every template × variant × 25 seeds (bilingual, reproducible, ideal quote / sampling / analysis warning-free, reveal non-empty and free of assertive wording); each quote, sampling and analysis warning; extraction and PCR behaviour; sibling LR against the closed form, RMP, consensus rules, haplotype comparison; lineage truth (uncle/Y, aunt/mtDNA, parent/child Mendelian); NGS output sums. Browser flow (FR/EN, 375 px, console) checked with headless Chromium; see the PR for the matrix.
