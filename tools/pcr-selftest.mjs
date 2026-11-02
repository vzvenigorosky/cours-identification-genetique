import assert from 'node:assert/strict';
import { loadWindowData, checkBilingual } from './load-window-data.mjs';
const P = loadWindowData('assets/data/pcr.js', 'PCR');

const bi = checkBilingual(P);
assert.equal(bi.bad.length, 0, 'every {fr,en} leaf must have both languages');

// Thresholds must mirror the EPG core.
const { thresholds } = P;
assert.equal(thresholds.at, 150);
assert(thresholds.at < thresholds.st && thresholds.st < thresholds.saturation);

// Input normalisation: the target must be reachable for every concentration.
const i = P.input;
assert(i.bandNg[0] < i.targetNg && i.targetNg < i.bandNg[1]);
assert(i.concRange[0] * i.maxExtractVol >= i.bandNg[0] - 1e-9, 'lowest-conc extract can still reach the band at max volume');
assert(i.maxExtractVol <= i.reactionVol);
assert(P.dispMax <= P.OVER && P.OVER < thresholds.saturation);
assert(P.degClamp[0] <= P.degClamp[1] && P.cycleClamp[0] < P.cycleClamp[1]);

// Thermal protocol fields.
const ids = P.fields.map(f => f.id);
assert.equal(new Set(ids).size, ids.length, 'unique field ids');
assert(ids.includes('cycles'));
for (const f of P.fields) {
  const w = `field ${f.id}`;
  const [lo, hi] = f.band;
  assert(lo < hi, `${w}: band ordered`);
  assert(f.def >= lo && f.def <= hi, `${w}: default inside its own band (defaults must grade correct)`);
  assert(f.step > 0, `${w}: step`);
  for (const side of ['low', 'high']) {
    const e = f[side];
    assert(e && e.msg, `${w}.${side}: failure message`);
    if (e.effMul !== undefined) assert(e.effMul > 0 && e.effMul <= 1, `${w}.${side}: effMul in (0,1]`);
    if (e.degAdd !== undefined) assert(e.degAdd >= 0, `${w}.${side}: degAdd >= 0`);
  }
}
for (const k of ['low', 'high']) assert(P.inputMsg[k], `inputMsg.${k}`);

// Catastrophic kill thresholds must sit beyond the band, on the right side.
for (const f of P.fields) {
  for (const side of ['low', 'high']) {
    const e = f[side];
    if (e.kill !== undefined) {
      if (side === 'low') assert(e.kill < f.band[0], `${f.id}.low.kill below the band`);
      else assert(e.kill > f.band[1], `${f.id}.high.kill above the band`);
    }
  }
}

// ---- amount model behaviour (issue #42) ----
assert.equal(typeof P.effectiveAmount, 'function', 'effectiveAmount exported');
assert.equal(typeof P.applyHomozygous, 'function', 'applyHomozygous exported');
assert(Number.isInteger(P.homozygousLoci) && P.homozygousLoci > 0, 'homozygousLoci is a positive integer');
assert(P.cycleBase > 1.5, 'per-cycle gain steep enough for a low-cycle NULL');
assert(P.cycleClamp[0] <= 0.05, 'cycle floor low enough to reach NULL');

const defaults = {};
for (const f of P.fields) defaults[f.id] = f.def;
const withCycles = (o) => Object.assign({}, defaults, o);

const good = P.effectiveAmount(defaults, P.input.targetNg);
assert.equal(good.offenders.length, 0, 'in-band defaults raise no offender');
assert(Math.abs(good.amount - P.A_OPT) < 1e-6, 'in-band defaults give the optimal amount');
assert.equal(good.degradation, 0, 'in-band defaults: no degradation');

// 150 °C initial denaturation → cooked → below detection (NULL).
const cooked = P.effectiveAmount(withCycles({ initDenatT: 150 }), P.input.targetNg);
assert(cooked.amount < P.thresholds.at, `150 °C must be catastrophic (amount ${cooked.amount.toFixed(1)} < ${P.thresholds.at})`);
assert(cooked.offenders.length > 0, 'the catastrophic setting is reported');

// A value just out of band is only a mild penalty, not catastrophic.
const mild = P.effectiveAmount(withCycles({ initDenatT: 97 }), P.input.targetNg);
assert(mild.amount > P.thresholds.st, 'a slightly-too-hot setting stays usable');
assert(mild.amount < good.amount, 'but is still penalised vs in-band');

// Low cycle count → NULL / very dropped; the in-band low edge stays usable.
const fewCycles = P.effectiveAmount(withCycles({ cycles: 20 }), P.input.targetNg);
assert(fewCycles.amount < P.thresholds.at, `low cycles must drop below detection (amount ${fewCycles.amount.toFixed(1)})`);
const edgeCycles = P.effectiveAmount(withCycles({ cycles: 28 }), P.input.targetNg);
assert.equal(edgeCycles.offenders.length, 0, '28 cycles (in band) raises no offender');
assert(edgeCycles.amount > P.thresholds.st, '28 cycles stays usable');

// Too many cycles → over-amplification (off-scale).
const manyCycles = P.effectiveAmount(withCycles({ cycles: 34 }), P.input.targetNg);
assert(manyCycles.amount > P.OVER, 'too many cycles over-amplifies');

// Homozygote forcing: exactly n loci become single-peak, the rest untouched.
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
{
  const geno = { L1: [12, 14], L2: [9, 10], L3: [15, 16], L4: [7, 8], L5: [20, 21], AMEL: ['X', 'Y'] };
  const names = ['L1', 'L2', 'L3', 'L4', 'L5'];
  const chosen = P.applyHomozygous(geno, names, 3, mulberry32(7));
  assert.equal(chosen.length, 3, 'exactly 3 loci forced homozygous');
  for (const nm of chosen) assert.equal(geno[nm][0], geno[nm][1], `${nm} is homozygous`);
  for (const nm of names.filter((n) => !chosen.includes(n))) assert.notEqual(geno[nm][0], geno[nm][1], `${nm} left heterozygous`);
  assert.deepEqual(geno.AMEL, ['X', 'Y'], 'non-autosomal loci untouched');
}

// ---- amplification curve for the animation (issue #40) ----
assert.equal(typeof P.ampCurve, 'function', 'ampCurve exported');
{
  const curve = P.ampCurve(P.A_OPT, 29);
  assert.equal(curve.length, 30, 'one point per cycle 0..N');
  assert(Math.abs(curve[curve.length - 1].p - P.A_OPT) < 1e-6, 'endpoint equals the amount');
  assert.equal(curve[0].c, 0);
  for (let i = 1; i < curve.length; i++) assert(curve[i].p >= curve[i - 1].p - 1e-9, 'non-decreasing');
  assert(curve[0].p < curve[curve.length - 1].p, 'rises from seed to plateau');

  // catastrophic amount → flat near-zero curve (NULL)
  const dead = P.ampCurve(0, 29);
  assert(dead.every((pt) => pt.p === 0), 'amount 0 → flat zero curve');

  // fewer cycles → shorter x-axis, lower endpoint for the same amount scale
  assert.equal(P.ampCurve(50, 20).length, 21, 'cycle count sets the x-extent');

  // over-amplification endpoint sits above the saturation line
  const over = P.ampCurve(P.OVER * 1.5, 34);
  assert(over[over.length - 1].p > P.OVER, 'over-amplified endpoint exceeds the saturation line');
}

console.log(`MG3: ${P.fields.length} protocol fields, amount model (catastrophic kills, low-cycle NULL, ${P.homozygousLoci} forced homozygotes), amplification curve and ${bi.ok} bilingual strings checked.`);
