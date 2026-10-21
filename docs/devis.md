# Simulateur de devis — interpréter une réquisition / Quote simulator

Related to issue #32 (design decisions are recorded in its comments). Entry point: `ex_devis.html`, linked as a prototype from `exercices.html`. Data and grading: `assets/data/devis.js` (ES module, pure, shared by browser and Node). UI: `assets/devis-ui.js`.

## Review status

Prototype for maintainer review. Prices are **fictional teaching values** chosen by the maintainer. The scoring weights, all réquisition and clarification texts, and the case catalogue were drafted by Claude and are proposals. Nothing here is a validated laboratory or legal wording.

## Teaching goal

At the quote stage the lab must interpret what a requérant wants, often without genetics expertise. The student reads a réquisition and a list of scellés and builds a quote: which scellés to take on, which package for each, how many profiles, whether to add Y-STR or mtDNA, and which tariff. One button, « Demander des précisions au requérant », can be used once; the réquisition is then clear. The student is graded on the quote and on whether they had enough information to build it.

## Price grid (fictional)

| Package | Price |
| --- | --- |
| Sample already taken, received (swab, FTA, blood…) → autosomal profile | 70 € |
| Organ (muscle…) or bone to sample → autosomal profile | 140 € |
| Item to sample, a trace may be present → profile | 200 € |
| Differential extraction → male profile | 200 € |
| Differential extraction → male and female profiles | 300 € |
| Add Y-STR | +100 € |
| Add mtDNA | +600 € |

Tariffs: normal; garde à vue (48 h) = price × 2; urgence (one week) = price × 1.5. A special tariff is correct only when the réquisition asks for it.

Assumptions (confirmed in #32): a doubled trace costs 2 × the package; the differential packages include sampling the item; the Y-STR and mtDNA add-ons are charged once per analysed scellé and apply to every sample of the comparison; "I don't know" is an acceptable clarification that keeps a différentielle legitimate. Normalisation is not billed. GlobalFiler only.

## Rules the grading enforces

- **One profile per analysed sample.** A **trace** (something to sample where there may be no DNA) accepts one **or** two profiles (doubled extraction and quantification); doubling a non-trace is over-ordering.
- **Différentielle** only when sperm is present or could be present. The material decides the base package: organ or bone → 140 €, any sample already taken and received (reference or trace swab, FTA, blood) → 70 €, item → 200 €.
- **Victim reference.** The victim's reference sample (cheek swab, or the blood draw once the client corrects the absurd request) is always attached in sexual-assault cases. Whether her profile is wanted is a decisive fact: a clear réquisition states it either way, a vague one leaves it to the clarification, and analysing an unrequested reference is penalised like any over-ordering. The right quote is the reference sample (70 €) plus a differential for the male profile on the stain or swab. The **300 € « male and female profiles » package is a deliberate distractor**: it is never the ideal answer, and choosing it is penalised with an explanation.
- **Kinship.** Autosomal STR LR is reachable only for parent/offspring and full siblings (and for the unknown's own belongings). Otherwise Y-STR (paternal male line) or mtDNA (maternal line), whichever the lineage supports. Adding Y-STR or mtDNA when autosomal suffices, Y-STR without a shared Y lineage, or mtDNA without a shared maternal lineage is penalised. Some relationships have no feasible analysis (for example a paternal half-sister) and behave like the absurd type.
- **Clarity rules.** A réquisition is clear (no need to ask) when: an identification states the relationship; a many-site sexual-assault request analyses everything or lists the samples **and** states where ejaculation may have occurred **and** says whether the victim's profile is wanted; a sexual-assault request on an item mentions the unknown aggressor or specifies sperm **and** says whether the victim's profile is wanted; a miscellany of items explicitly links the accepted items to the unknown. Asking when clear, or not asking when vague, loses the information points. The two additions to the sexual-assault rules come from the owner's playtest: a list of samples alone does not tell the lab whether a differential is needed on each sample, nor whether to bill the victim's profile.
- **Absurd requests.** The right path is: see the absurd request, use the one info click, then either follow the client's corrected request (graded as a normal quote) or, once the client confirms there is nothing to do, **decline the whole request**. Declining without asking is the right decision but earns a warning and 70 instead of 100.

## Scoring (proposal)

Normal cases are scored out of 100 from weighted criteria: information 20, scellé selection 25, packages 20, number of profiles 10, Y-STR / mtDNA add-ons 15, tariff 10. The add-ons criterion is dropped (weights renormalised) when no add-on is expected and the student chose none. Absurd cases: information 30, decision 70 (for a correctable absurd case the 70 is the normal quote score after the correction). Declining a valid request scores 0.

## Case catalogue (10 templates, 16 variants)

| Template | Archetype | Variants | Truth |
| --- | --- | --- | --- |
| id-parent | identification | vague / clear | parent: autosomal only |
| id-uncle | identification | vague / clear | paternal uncle: Y-STR on both samples |
| id-maternal-aunt | identification | vague / clear | maternal aunt: mtDNA on both samples |
| sa-sites | sexual assault, 14 body sites | vague / clear (list or "analyse all"), victim profile wanted or not | 4 relevant sites when limited (vaginal, vulvar, neck, wrist); differential only on the genital-area samples, never on the neck or wrist; victim reference when asked |
| sa-ejaculation | sexual assault, underwear | vague / clear, victim profile wanted or not | differential if sperm is present or possible, plain item package if excluded; plus the victim reference when asked |
| misc-flat | items from a flat | vague / clear | only the items linked to the unknown |
| absurd-blood | absurd, correctable | vague | victim's blood; client corrects to underwear + vaginal swab, and the blood becomes the victim reference (70 €) |
| absurd-couch | absurd, void | vague | couch swabs unrelated to the case |
| absurd-adopted | absurd, void | vague | adopted children in a kinship request |
| absurd-half-sister | absurd, void | vague | no feasible analysis |

Deadlines (garde à vue, urgence) are added to the réquisition text at random where plausible. Cases are seeded and reproducible (`makeCase(seed, { template, variant })`); the seed is shown in the UI.

## Scientific and legal boundaries

The texts are drafts and are not validated forensic or legal wording. Model limits: autosomal STR on GlobalFiler only; no quantification-based triage; sperm presence is a case attribute, not derived from a test; prices do not model volume discounts or real laboratory tariffs.

## Verification

- `node tools/devis-selftest.mjs` / `npm run devis:test`: price arithmetic, kinship table, clarity rules, package selection, every template and variant over 40 seeds (reproducibility, FR/EN completeness, ideal answer scores 100, wrong ask/tariff/over-ordering/declining penalised, doubled trace accepted), and the absurd flows. Included in PR CI.
- Browser smoke test (headless Brave through puppeteer-core): ask flow and lock, scoring display, language switch, absurd correction replacing the scellés, decline warning, missing-package warning, no horizontal overflow at 375 px, no console errors other than the missing favicon.
