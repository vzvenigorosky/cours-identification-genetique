# Trial-exam generator (issue #108)

Entry point: `examens.html` (linked from `exercices.html`, group « Pour l'enseignant »). Logic: `assets/exam/exam.js` (pure, seeded ES module), rendering: `assets/exam/render.js` (HTML strings), page: `assets/exam-ui.js`. Tests: `tools/exam-selftest.mjs` (`npm run exam:test`, in PR CI).

## Status

**Prototype for the teacher's review.** Statements, marking schemes, points and timings are **teaching content drafted by Claude**, not validated. The site is **public**: anyone can open the generator and the answer keys, so these are **trial exams** (practice, self-marking), **not for a graded exam**.

## What one exam is (owner decisions, #108)

30 minutes on paper, **20 points**, no negative marking, no calculator needed:

| Part | Points | Estimated time |
|---|---|---|
| 10 MCQ, **one per chapter** in course order (adn, genome, str, extraction, amplification, lecture, identification, marqueurs, parente, probabilites), drawn from the 120-question bank of `qcm.html`; answers shuffled, correct letters balanced (each letter 1–4 times) | 10 × 0.5 = 5 | 10 × 0.75 min |
| Exercise 1 — **consensus profile** | 7 (6 loci × 1 pt + 1 pt) | 6 min |
| Exercise 2 — **quote from a requisition** | 8 (2 + 6) | 8 min |
| Total | 20 | ≈ 21.5 min, leaving about 8 min for reading, writing the name and checking |

The generator checks that the estimate stays ≤ 28 min.

**Exercise 1.** One individual analysed in two experiments × two amplifications over six loci (D8S1179, D21S11, D7S820, CSF1PO, TH01, D13S317), with allele drop-out of varying severity per replicate. Rule printed on the sheet, taken from the past papers: an allele is reliable if characterised at least twice; a single allele characterised at least twice and no other allele present is a reliable homozygote (written a/a); alleles seen once are uncertain (in brackets). Each table contains a heterozygote, a homozygote and an uncertain allele, and at most one empty locus. Question b: the phenomenon (allele drop-out). Marking: 1 pt per exact locus, 0.5 pt if the alleles are right but the reliability notation is wrong.

**Exercise 2.** A requisition (clear or vague, 2–3 exhibits) from the simplified full case's generator (`id-parent`, `id-uncle`, `id-maternal-aunt`, `sa-ejaculation`, `trace-suspect`; the one-exhibit orientation case is excluded because 6 points would be a single guess). The seven packages with their fictional prices are printed. (a) 2 pts: is the requisition enough, otherwise what do you ask? (b) 6 pts, shared equally between exhibits: the proposal and price for each exhibit, then the total. When the requisition is vague, the requester's reply is printed in a dashed box "to be read only after question a", and the automatic differential-extraction notice appears there; when it is clear the notice is printed with the exhibit. Marking: all or nothing per exhibit; a total consistent with the candidate's own proposals is accepted.

## Answer keys are computed

The consensus key comes from the rule applied to the printed table; the quote key is the exercise's own truth (`makeDossier(...).need`, the same one that makes the simplified full case's warnings). The self-test recomputes the consensus key with an **independent implementation** from the printed cells, rebuilds every quote exercise from its stored case seed, checks that the key draws no warning, and has been mutation-checked (a wrong rule, a wrong total and "nothing taken on" each make it fail).

## Using it

1. Choose a base seed (or "Nouvelle graine"), the number of versions (1–26: A, B, C…), and optionally a title, the teacher's name and an extra instruction.
2. « Imprimer les sujets » then « Imprimer les corrigés »: in the print dialog choose A4, default margins, "Save as PDF". Each paper is exactly **3 A4 pages** (MCQ / exercise 1 / exercise 2) and each corrigé **1 page** (checked over 130 papers in French and English).
3. Every sheet carries its version letter and its seed (`<base>-<letter>`); the page address keeps `?seed=…&n=…`, so the same link regenerates exactly the same papers. Neighbouring versions use different MCQ and different exercises.
4. The language follows the site's FR/EN switch; black-and-white printing only (nothing relies on colour).

## Limits and next steps

- **MCQ answer keys are the bank's**: the bank has no explanations, so the corrigé shows the correct letter and answer text only.
- With many versions, MCQ repeat **across** versions (not inside one): 300 exams cover 120 / 120 questions.
- **Not yet built** (separate PRs of #108): the kinship LR-table exercise (past papers' favourite), RMP, paternity, extract choice, PCR volume, EPG reading, a "10 written questions" part (from the 105 flashcards) and the 15-minute presets.
- The phrase "no document / no calculator" is deliberately **not** printed: set it with the "extra instruction" field.
