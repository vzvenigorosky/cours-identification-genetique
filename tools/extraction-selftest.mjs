import assert from 'node:assert/strict';
import { loadWindowData, checkBilingual } from './load-window-data.mjs';
const E = loadWindowData('assets/data/extraction.js', 'EXTRACTION');

// ---- bilingual content ----
const bi = checkBilingual({ requisition: E.requisition, scelles: E.scelles });
assert.equal(bi.bad.length, 0, 'every {fr,en} leaf must have both languages: ' + bi.bad.join(', '));

// ---- shape & teaching parameters ----
assert(E.threshold > 0, 'threshold > 0');
assert(Array.isArray(E.perCase) && E.perCase[0] >= 1 && E.perCase[1] >= E.perCase[0], 'perCase range');
assert(E.scelles.length >= E.perCase[1], 'enough templates to fill a case');
for (const sc of E.scelles) {
  assert(sc.sites.length >= 2, `${sc.id}: at least two sites`);
  // sites[0] must be the rich slot: its whole range sits above every other site.
  for (let i = 1; i < sc.sites.length; i++) {
    assert(sc.sites[0].range[0] > sc.sites[i].range[1], `${sc.id}: site 0 richer than site ${i} (non-overlapping)`);
  }
  for (const s of sc.sites) assert(s.range[0] >= 0 && s.range[1] >= s.range[0], `${sc.id}: valid range`);
}
assert.equal(new Set(E.scelles.map(s => s.id)).size, E.scelles.length, 'unique scellé ids');

// ---- mode mix ----
const modes = E.modeMix.map(m => m.mode);
assert.deepEqual([...modes].sort(), ['depleted', 'marginalNeg', 'marginalPos', 'rich'], 'the four modes are present');
for (const m of E.modeMix) assert(m.w > 0, `${m.mode}: positive weight`);
// The two near-threshold modes should dominate — that is the point of #39.
const wsum = E.modeMix.reduce((s, m) => s + m.w, 0);
const marg = E.modeMix.filter(m => m.mode === 'marginalPos' || m.mode === 'marginalNeg').reduce((s, m) => s + m.w, 0);
assert(marg / wsum >= 0.4, 'marginal modes make up a meaningful share of cases');

// ---- band separation from the threshold (display == grading, so bands must
//      round cleanly to one side of the inclusive cut-off) ----
const q3 = n => Math.round(n * 1000) / 1000;
assert(q3(E.bands.marginalUsable[0]) >= E.threshold, 'marginalUsable floor rounds to usable');
assert(q3(E.bands.marginalBelow[1]) < E.threshold, 'marginalBelow ceiling rounds to not-usable');
assert(q3(E.bands.trace[1]) < E.threshold, 'trace stays below threshold');
// A readable gap on each side (no value that displays "exactly on the line").
assert(E.bands.marginalUsable[0] > E.threshold, 'marginalUsable clearly above threshold');
assert(E.bands.marginalBelow[1] < E.threshold, 'marginalBelow clearly below threshold');

// ---- deterministic generator behaviour, per mode, over every template ----
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

let seen = { rich: 0, marginalPos: 0, marginalNeg: 0, depleted: 0 };
let nearThresholdDecider = 0; // a deciding reading within one display tick of the cut-off
const tick = 0.001;

for (let seed = 1; seed <= 4000; seed++) {
  const rng = mulberry32(seed);
  const tpl = E.scelles[seed % E.scelles.length];
  for (const mode of modes) {
    const sc = E.buildScelle(tpl, rng, mode);
    // Grading invariant: display value == graded value (both 3-decimal rounded),
    // and the chosen "best" is a genuine usable maximum, unique.
    for (const e of sc.extracts) assert.equal(e.q, q3(e.q), `${tpl.id}/${mode}: q is 3-decimal rounded`);
    const usable = sc.extracts.filter(e => e.q >= E.threshold);
    if (sc.correctId === 'none') {
      assert.equal(usable.length, 0, `${tpl.id}/${mode}: "none" only when nothing clears the threshold`);
    } else {
      const best = sc.extracts.find(e => e.id === sc.correctId);
      assert(best && best.q >= E.threshold, `${tpl.id}/${mode}: best clears threshold`);
      assert(usable.every(e => e.q <= best.q), `${tpl.id}/${mode}: best is the usable maximum`);
      assert.equal(best.q, sc.bestQ, `${tpl.id}/${mode}: bestQ matches`);
    }
    // top reading is the overall max, always reported
    const top = sc.extracts.reduce((a, e) => (e.q > a.q ? e : a));
    assert.equal(sc.topQ, top.q, `${tpl.id}/${mode}: topQ is the overall maximum`);

    // Per-mode semantics
    if (mode === 'rich') {
      assert.notEqual(sc.correctId, 'none', `${tpl.id}/rich: a clearly usable extract exists`);
      assert(sc.bestQ > E.bands.marginalUsable[1], `${tpl.id}/rich: best is clearly above the marginal band`);
    } else if (mode === 'marginalPos') {
      assert.notEqual(sc.correctId, 'none', `${tpl.id}/marginalPos: the marginal extract is amplifiable`);
      assert(sc.bestQ >= E.threshold && sc.bestQ <= E.bands.marginalUsable[1], `${tpl.id}/marginalPos: best is marginal, not rich`);
      // every OTHER extract must be below the threshold, so the marginal one decides
      assert.equal(usable.length, 1, `${tpl.id}/marginalPos: exactly one usable (the marginal best)`);
    } else if (mode === 'marginalNeg') {
      assert.equal(sc.correctId, 'none', `${tpl.id}/marginalNeg: correct answer is "aucun"`);
      // ...but the top reading is NOT a blank — it is tempting, near the cut-off
      assert(sc.topQ > 0 && sc.topQ < E.threshold, `${tpl.id}/marginalNeg: top reading is non-trivial yet sub-threshold`);
      assert(sc.topQ >= E.bands.marginalBelow[0] * 0.9, `${tpl.id}/marginalNeg: top reading is close to the threshold`);
    } else if (mode === 'depleted') {
      assert.equal(sc.correctId, 'none', `${tpl.id}/depleted: correct answer is "aucun"`);
      assert(sc.topQ < E.threshold, `${tpl.id}/depleted: everything sub-threshold`);
    }
  }
}

// ---- statistical coverage of the unforced mix (the page path) ----
{
  const rng = mulberry32(12345);
  for (let i = 0; i < 6000; i++) {
    const tpl = E.scelles[i % E.scelles.length];
    const sc = E.buildScelle(tpl, rng); // no forced mode → uses modeMix
    seen[sc.mode]++;
    const decider = sc.correctId === 'none' ? sc.topQ : sc.bestQ;
    if (Math.abs(decider - E.threshold) <= tick) nearThresholdDecider++;
  }
}
for (const m of modes) assert(seen[m] > 0, `mode ${m} occurs under the natural mix`);
assert(nearThresholdDecider > 0, 'a near-threshold judgment call actually appears (issue #39)');

console.log(`MG2 quant: ${E.scelles.length} templates, modes ${modes.join('/')}, ${bi.ok} bilingual strings; ` +
  `natural mix seen ${JSON.stringify(seen)}, near-threshold deciders ${nearThresholdDecider}. Borderline cases present.`);
