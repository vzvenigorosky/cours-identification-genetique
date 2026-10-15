# MG2 — Du scellé à la comparaison (review prototype)

Related to tracking issue #14. Entry point: `ex_casework.html`, linked as a prototype from the exercise hub. Existing `ex_extraction.html` quantification-only exercise is preserved. No changes to MG1, MG3, MG4 or the EPG core.

## Review status

This is a concrete, playable design for maintainer scientific review, not a validated laboratory protocol. Do not treat the numeric teaching gates as empirical assay specifications. The draft PR deliberately keeps the new workflow out of production pending review.

Review decisions:

1. Accept / adjust the fictional protocol: maximum input volume **10 µL**, autosomal minimum **0.1 ng**, autosomal DI ceiling **5**, Y minimum **0.05 ng** with a separate favorable feasibility flag. Concentration times maximum volume determines available input, not concentration alone. High concentrations can be diluted; no mandatory input-volume exercise duplicates MG3.
2. Accept the priority-analysis rubric. Alternative useful methods can produce results while losing the priority point for the specific stated objective. There is no general claim that an alternative technique is invalid. Standard vs differential extraction is accepted in the sperm case; differential is preferred. Other substrates require standard extraction adapted to their preparation.
3. Accept the three case families and interpretation scope. mtDNA currently uses symbolic full-sequence IDs, explicitly labelled as fictitious, rather than pretending a handful of variants constitute a whole mitogenome. A later real-variant comparison exercise would need a curated sequence dataset and nomenclature.

## Case families

| Case | Extraction and quantification | Priority | Interpretation |
| --- | --- | --- | --- |
| Sperm confirmed by microscopy | Differential: non-sperm and sperm-enriched fractions, with residual mixtures possible. Standard: strongly imbalanced total extract. Autosomal SA/LA, Y and autosomal DI shown for each. | Autosomal STRs for differential fractions; Y-STRs for the minority male component in total extract. | Full mixtures are compatible-reference screens, not proven contributor assignments. B and C share a paternal Y lineage but have different autosomal profiles. Standard-extract autosomal minor component remains uninterpreted in this model. |
| Burglary, blood and low-yield contact | Standard extraction; one adequate extract and one below this protocol's nuclear input gates. | Autosomal STRs / defer and consider resampling. | Single-reference concordance or a donor absent from the reference set. Low nuclear quantity alone never establishes mitochondrial feasibility. |
| Old bone | Bone-adapted standard extraction; low nuclear quantity, high autosomal DI, independent favorable mitochondrial feasibility. | Whole mitogenome. | Shared maternal lineage A/B, or no matching reference. Matching a lineage is not unique individual identification. |

The reference panel contains A/B/C only; an unknown donor U may generate evidence but is never selectable. Profiles reuse `assets/epg/genetics.js` and all 21 autosomal loci / all 25 Yfiler Plus locus entries. The Y panel includes multicopy markers, retained in single-source tables. Table IDs for mtDNA stand for entire fictitious sequences; no real sequence claims or clinical variants are generated.

## Quantification assumptions

SA/LA are short/long autosomal targets; **DI = SA / LA**. Values are rounded for display after calculation. Y concentration is a calibrated estimate, not a literal chromosome-mass fraction, proof of sperm or proof of a specific contributor. Only autosomal DI is available in this mock assay: **no invented Y-specific DI** (a deliberate correction to the umbrella's generic wording). Favorable Y / mtDNA feasibility are separate case assumptions, not derived from that DI. Internal controls are assumed not to indicate inhibition.

This model does not simulate extraction losses, consumption budgets, stochastic PCR, real-life qPCR limits of quantification, degradation-dependent dropout or artifact cleaning. Adequate table-producing samples have idealized complete data. The highly imbalanced total extract is outside the simple autosomal model: no reference is excluded from an unreported minor profile. In real casework validated workflows can recover information beyond these teaching gates.

## Grading and state

- Unsupported extraction: explain why and let the student revise before producing fictitious fractions.
- Require an analysis selection for every extract. Run the selected method, including an explicit no-result response for unsupported conditions; never substitute the preferred result silently.
- Each extract has three points: priority analysis, exact compatible-reference set, and conclusion scope. No result and unassigned references require an explicit **None** selection; untouched fields do not score.
- Single autosomal profile: compare complete genotypes. Mixture: compare reference alleles with the complete observed allele union; this is a compatibility screen, not deconvolution or proof of donor identity. Y / mtDNA: compare whole haplotypes or sequence IDs, retaining all matching references.
- No LR, certainty of identification, body-fluid inference or activity attribution.
- Extraction changes invalidate quantification, routing, results and answers; route changes invalidate results and answers; editing interpretation clears stale grading. Language changes preserve the case, choices, results and open comparison tables. New case resets everything.

## Validation

`npm run casework:test` runs 450 reproducible cases, both extraction paths and all four analysis actions, including known/unknown sources, residual mixtures, lineage ambiguity, quantity/DI boundary checks and no-result grading. Included in PR CI alongside EPG, quiz and MG4 checks. Browser checks cover staged validation, FR/EN, correct/wrong/blank answers, changing upstream choices, unsupported extraction, lineage interpretation, mobile overflow and console errors.

## Scientific sources

- [NIJ, Forensic DNA for Officers of the Court](https://nij.ojp.gov/sites/g/files/xyckuh171/files/media/document/Forensic_DNA_for_Officers_of_the_Court_20121205.pdf), differential extraction section, pp. 51–52: fractions may retain mixtures; sperm/non-sperm terminology avoids conflating cell type with sex.
- [Quantifiler HP / Trio user guide](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/4485354.pdf): short and long autosomal targets, Y target and autosomal degradation index. This does not validate our teaching gates or establish a Y-specific DI.
- [SWGDAM publications](https://www.swgdam.org/publications): autosomal STR interpretation (2021), Y-STR interpretation (2022), mitochondrial interpretation (2024). Interpretation requires validation and recognition of lineage limits; the prototype's numeric gates are not taken from these guidelines.
