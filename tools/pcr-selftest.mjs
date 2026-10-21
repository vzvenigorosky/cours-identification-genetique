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
console.log(`MG3: ${P.fields.length} protocol fields, input model and ${bi.ok} bilingual strings checked.`);
