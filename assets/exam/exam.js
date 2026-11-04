/* ============================================================
   Trial-exam generator (issue #108) — pure, seeded ES module.

   One exam = 10 MCQ (one per chapter) + 2 exercises built from what the
   site already generates: a CONSENSUS PROFILE table and a QUOTE from a
   requisition. 30 minutes on paper, 20 points, no negative marking.

   Every answer key is COMPUTED (consensus rule, the exercise's own
   `makeDossier` truth), never typed. The corrigé is returned with the
   exam, but the renderer prints it separately.

   The site is public: these are TRIAL exams, not for graded exams.
   Marking schemes are teaching content pending the owner's review.

   Reads window.MCQ (assets/data/mcq.js) and REQUISITION_SHARED
   (assets/data/requisition-shared.js) from globalThis, like dossier.js.
   ============================================================ */
import { makeRng } from '../epg/rng.js';
import { getKit } from '../epg/panels.js';
import * as G from '../epg/genetics.js';
import { makeDossier, PACKAGES, PACKAGE_ORDER, quoteTotal, hasDifferential, DIFFERENTIAL_NOTICE } from '../data/dossier.js';

export const SPEC = { minutes: 30, points: 20, maxEstimate: 28, mcqEach: 0.5, mcqMinutes: 0.75, e1: { points: 7, minutes: 6 }, e5: { points: 8, minutes: 8 } };
export const CHAPTERS = ['adn', 'genome', 'str', 'extraction', 'amplification', 'lecture', 'identification', 'marqueurs', 'parente', 'probabilites']; // course order
export const LETTERS = ['A', 'B', 'C', 'D'];

/* ---------------- Part 1: MCQ, one per chapter ---------------- */
function mcq(rng) {
  const bank = globalThis.MCQ;
  if (!bank) throw new Error('assets/data/mcq.js must be loaded first (globalThis.MCQ)');
  const picked = CHAPTERS.map(topic => { const pool = bank.map((q, i) => ({ q, i })).filter(x => x.q.topic === topic); const { q, i } = rng.pick(pool); return { topic, id: i, q }; });
  // Shuffle the answers; retry until the correct letters are balanced (each letter used 1 to 4 times in 10 questions).
  for (let attempt = 0; ; attempt++) {
    const items = picked.map(p => { const order = rng.shuffle(p.q.answers.map((a, k) => k)); return { topic: p.topic, id: p.id, q: p.q.q, choices: order.map(k => p.q.answers[k].text), correct: order.findIndex(k => p.q.answers[k].correct) }; });
    const count = LETTERS.map((_, k) => items.filter(x => x.correct === k).length);
    if ((count.every(n => n >= 1 && n <= 4)) || attempt > 200) return items;
  }
}

/* ---------------- Exercise 1: consensus profile ---------------- */
export const CONSENSUS_LOCI = ['D8S1179', 'D21S11', 'D7S820', 'CSF1PO', 'TH01', 'D13S317'];
const fmtA = a => (Number.isInteger(a) ? String(a) : a.toFixed(1));
const KIT = getKit('globalfiler');

// The rule printed on the sheet: an allele is reliable when characterised at least twice; a single allele characterised at
// least twice and no other allele present is a reliable homozygote; alleles seen once are uncertain (in parentheses).
export function consensusRule(counts) { // counts: Map allele -> times seen
  const rel = [...counts].filter(([, n]) => n >= 2).map(([a]) => a).sort((a, b) => a - b);
  const unc = [...counts].filter(([, n]) => n === 1).map(([a]) => a).sort((a, b) => a - b);
  if (!rel.length && !unc.length) return { text: '-', kind: 'none' };
  if (rel.length === 1 && !unc.length) return { text: fmtA(rel[0]) + '/' + fmtA(rel[0]), kind: 'hom' };
  if (rel.length === 2 && !unc.length) return { text: rel.map(fmtA).join('/'), kind: 'het' };
  const all = [...rel.map(a => [a, true]), ...unc.map(a => [a, false])].sort((x, y) => x[0] - y[0]);
  return { text: all.map(([a, r]) => (r ? fmtA(a) : '(' + fmtA(a) + ')')).join('/'), kind: rel.length ? 'partial' : 'uncertain' };
}

function consensus(rng) {
  const names = ['TOR', 'KAL', 'BEX', 'MIR', 'LYN', 'SAR', 'DOM', 'NIK'];
  const person = rng.pick(names) + '-' + rng.int(1, 9);
  const labels = ['E1-A1', 'E1-A2', 'E2-A1', 'E2-A2'];
  for (let attempt = 0; attempt < 500; attempt++) {
    const prof = G.randomProfile(KIT, rng, { sex: rng.bool() ? 'M' : 'F' }).geno;
    const quality = rng.shuffle([0.05, 0.25, 0.5, 0.7]); // chance that an allele drops out, per replicate
    const rows = labels.map((label, r) => ({ label, loci: CONSENSUS_LOCI.map(l => {
      if (rng.bool(quality[r] * 0.35)) return []; // whole locus failed
      return [...new Set(prof[l])].filter(() => !rng.bool(quality[r]));
    }) }));
    const key = CONSENSUS_LOCI.map((l, j) => { const c = new Map(); rows.forEach(r => r.loci[j].forEach(a => c.set(a, (c.get(a) || 0) + 1))); return { locus: l, ...consensusRule(c), counts: [...c].sort((x, y) => x[0] - y[0]) }; });
    const kinds = k => key.filter(x => x.kind === k).length;
    // a teachable table: reliable heterozygote(s), a reliable homozygote, an uncertain allele, at most one locus without result
    if (kinds('het') >= 1 && kinds('hom') >= 1 && key.filter(x => x.kind === 'partial' || x.kind === 'uncertain').length >= 1 && kinds('none') <= 1 && kinds('het') + kinds('hom') >= 3)
      return { type: 'consensus', person, loci: CONSENSUS_LOCI, rows: rows.map(r => ({ label: r.label, cells: r.loci.map(a => (a.length ? a.slice().sort((x, y) => x - y).map(fmtA).join('/') : '-')) })), key,
        points: SPEC.e1.points, minutes: SPEC.e1.minutes, perLocus: 1, q2: 1 };
  }
  throw new Error('could not build a consensus exercise');
}

/* ---------------- Exercise 2: quote from a requisition ---------------- */
// A one-exhibit case (orientation) would make the 6 points a single guess, so it is not used here.
const QUOTE_TEMPLATES = ['id-parent', 'id-uncle', 'id-maternal-aunt', 'sa-ejaculation', 'trace-suspect'];
function quote(rng) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const template = rng.pick(QUOTE_TEMPLATES), variant = rng.pick(['vague', 'clear']);
    const caseSeed = rng.int(1, 2 ** 30), c = makeDossier(caseSeed, { template, variant });
    if (![1, 2, 3].includes(c.scelles.length)) continue; // 6 points must divide evenly between the exhibits
    const lines = c.scelles.map(s => ({ no: s.no, id: s.id, title: s.title, nature: s.nature, need: c.need[s.id] || null, reason: c.reasons[s.id] || null, differential: hasDifferential(c, s.id) }));
    const total = quoteTotal(Object.fromEntries(lines.filter(l => l.need).map(l => [l.id, l.need])));
    return { type: 'quote', caseSeed, template, variant, needsInfo: c.needsInfo, requisition: c.requisition, clarification: c.clarification, lines, total,
      points: SPEC.e5.points, minutes: SPEC.e5.minutes, pointsAsk: 2, pointsQuote: 6, pointsPerLine: 6 / c.scelles.length };
  }
  throw new Error('could not build a quote exercise');
}

/* ---------------- The exam ---------------- */
export function makeExam(seed) {
  const id = String(seed);
  const items = mcq(makeRng(id + ':mcq'));
  const e1 = consensus(makeRng(id + ':e1')), e5 = quote(makeRng(id + ':e5'));
  const mcqPoints = items.length * SPEC.mcqEach;
  const points = mcqPoints + e1.points + e5.points;
  const minutes = items.length * SPEC.mcqMinutes + e1.minutes + e5.minutes;
  return { seed: id, mcq: items, mcqPoints, exercises: [e1, e5], points, minutes };
}
export const packageTable = () => PACKAGE_ORDER.map(k => ({ id: k, label: PACKAGES[k].label, detail: PACKAGES[k].detail, price: PACKAGES[k].price }));
export { PACKAGES, DIFFERENTIAL_NOTICE };
