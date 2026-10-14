# Quiz question bank

`assets/data/mcq.js` contains 120 bilingual single-answer questions, with four
choices each. There are 96 M1/M2 (`m12`) questions and 24 M2-only (`m2`) questions.
The ten topics follow the course sections in `assets/data/flashcards.js`.
`qcm.html` draws M1 quizzes from `m12`, and M2 quizzes from both levels; it
shuffles both questions and answers. No UI or sampling-simulator changes are needed.

The expansion adds eight questions per topic (80 total). It combines concepts,
laboratory scenarios, electropherogram interpretation, and short calculations.
Distractors target errors such as confusing allele frequency with peak height,
dropout with stutter, compatibility with identification, and likelihood ratios
with posterior probabilities. Inherited questions were also revised to avoid
overstating mixture detection, inheritance, or exclusion and to state statistical
assumptions explicitly.

## Scientific review references

- Molecular structure and replication: [NCBI Bookshelf, The Structure and Function
  of DNA](https://www.ncbi.nlm.nih.gov/books/NBK26821/) and
  [DNA Replication Mechanisms](https://www.ncbi.nlm.nih.gov/books/NBK26850/).
- STR allele nomenclature and repeat variation: [NIST STRBase background on
  STRs](https://strbase-archive.nist.gov/intro.htm).
- Laboratory controls, interpretation, stutter, dropout and lineage-marker
  limitations: SWGDAM interpretation guidelines for
  [autosomal STRs (2021 revision)](https://www.swgdam.org/_files/ugd/4344b0_3f94c9a6286048c3924c58e2c230e74e.pdf),
  [Y-STRs (2022)](https://www.swgdam.org/_files/ugd/4344b0_bc90bcfef52c43559aa28618ef87c424.pdf), and
  [mitochondrial DNA (2024)](https://www.swgdam.org/_files/ugd/4344b0_9784320e1188491fbdd0dbf040ca69ae.pdf).
  Questions deliberately avoid universal RFU cutoffs or stutter
  percentages: those depend on the assay and laboratory validation.
- Mixture ambiguity and limits on conclusions about deposition:
  [NIST DNA Mixtures explainer](https://www.nist.gov/feature-stories/dna-mixtures-forensic-science-explainer)
  and [DNA Mixture Interpretation: A Scientific Foundation Review (2024)](https://www.nist.gov/publications/dna-mixture-interpretation-nist-scientific-foundation-review).
- Kinship hypotheses, likelihood ratios and mutation considerations:
  [ISFG recommendations on biostatistics in paternity testing (2007)](https://pubmed.ncbi.nlm.nih.gov/19083766/).

Worked examples specify Hardy-Weinberg equilibrium or locus independence where
needed. Classical IBD questions assume no inbreeding; the kinship exclusion
example explicitly assumes a model without mutation or typing error. A source
match is not a conclusion about the activity causing deposition or guilt.

## Validation

Run `npm run mcq:test` (or `node tools/mcq-selftest.mjs`). It checks translations,
unique stems and choices, exactly one Boolean answer key, topic/level coverage,
and selected arithmetic and inheritance examples. It also executes the actual
inline quiz script against a minimal DOM fixture in both languages, at both
levels and four quiz lengths, including a custom count of seven. It checks filtering, randomisation, grading,
incomplete submission, language switching, correction, and restarting.
This is a logic smoke test, not a visual browser-layout test or a substitute for
scientific review by the course instructor.
