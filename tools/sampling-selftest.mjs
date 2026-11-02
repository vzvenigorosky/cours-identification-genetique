import assert from 'node:assert/strict';
import { loadWindowData, checkBilingual } from './load-window-data.mjs';
const S = loadWindowData('assets/data/sampling.js', 'SAMPLING');

const bi = checkBilingual(S);
assert.equal(bi.bad.length, 0, 'every {fr,en} leaf must have both languages');

const ids = (arr) => arr.map(x => x.id);
for (const k of ['lights', 'tests', 'instruments', 'items']) {
  assert.equal(new Set(ids(S[k])).size, S[k].length, `${k}: unique ids`);
}
const fluids = new Set(Object.keys(S.fluorescence));
const instruments = new Set(ids(S.instruments));
const substrates = new Set(Object.keys(S.substrateTools));
assert(S.threshold > 0);

for (const t of S.tests) assert(fluids.has(t.fluid), `test ${t.id}: known fluid`);
for (const [sub, tools] of Object.entries(S.substrateTools)) {
  for (const [ins, f] of Object.entries(tools)) {
    assert(instruments.has(ins), `${sub}: unknown instrument ${ins}`);
    assert(f > 0 && f <= 1, `${sub}.${ins}: suitability in (0,1]`);
  }
}
for (const v of Object.values(S.fluorescence)) assert.equal(typeof v, 'boolean', 'fluorescence is one boolean per fluid (single forensic light)');
// Blood must never fluoresce (the teaching point of the light step).
assert(!S.fluorescence.blood);
assert(S.fluorescence.semen && S.fluorescence.saliva, 'semen and saliva fluoresce under the forensic light');

// #43: one combined forensic-light button; tape-lift removed; new tools added.
assert.equal(S.lights.length, 1, 'a single forensic-light button');
assert(!S.instruments.some((i) => i.id === 'tape'), 'tape-lift removed');
for (const id of ['cryo', 'pipette', 'dremel']) assert(S.instruments.some((i) => i.id === id), `instrument ${id} present`);
for (const id of ['bone', 'muscle', 'bloodtube', 'salivafta', 'tooth']) assert(S.items.some((it) => it.id === id), `item ${id} present`);
assert(S.acceptTool > 0 && S.acceptTool <= 1, 'acceptTool in (0,1]');
assert(S.dryStainPenalty > 0 && S.dryStainPenalty < 1, 'dryStainPenalty in (0,1)');
// Every substrate must offer at least one acceptable (>= acceptTool) tool, so a
// correct answer always exists.
for (const [sub, tools] of Object.entries(S.substrateTools)) {
  assert(Object.values(tools).some((f) => f >= S.acceptTool), `${sub}: at least one acceptable tool exists`);
}

// #47: a swab works on liquid blood and on an FTA card, at reduced (acceptable,
// sub-optimal) efficiency — and the dried-surface dry-swab penalty does not
// apply to those substrates.
assert(Array.isArray(S.dryPenaltySubstrates), 'dryPenaltySubstrates list present');
for (const sub of ['liquid', 'card']) {
  const sw = S.substrateTools[sub];
  assert(sw.swab_wet >= S.acceptTool || sw.swab_dry >= S.acceptTool, `${sub}: a swab is an acceptable option`);
  assert((sw.swab_wet || 0) < 1 && (sw.swab_dry || 0) < 1, `${sub}: swab is sub-optimal (reduced efficiency)`);
  assert(S.dryPenaltySubstrates.indexOf(sub) === -1, `${sub}: no dried-surface dry-swab penalty`);
}

const inCanvas = (z) => z.cx - z.r >= 0 && z.cx + z.r <= 400 && z.cy - z.r >= 0 && z.cy + z.r <= 260;
const overlap = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r + b.r;
for (const it of S.items) {
  const w = `item ${it.id}`;
  assert(substrates.has(it.substrate), `${w}: substrate has a tool table`);
  assert(it.gen.min >= 0 && it.gen.max >= it.gen.min, `${w}: gen range`);
  assert(it.gen.max <= it.stainSlots.length, `${w}: enough slots for max stains`);
  assert(it.stainPool.length > 0 || it.gen.max === 0, `${w}: stain pool`);
  it.stainSlots.concat(it.touchZones).forEach(z => assert(inCanvas(z), `${w}: zone inside 400x260 canvas`));
  it.stainSlots.forEach((a, i) => it.stainSlots.slice(i + 1).forEach(b => assert(!overlap(a, b), `${w}: stain slots overlap`)));
  for (const p of it.stainPool) {
    assert(fluids.has(p.fluid), `${w}: pool fluid ${p.fluid}`);
    assert(p.weight > 0 && p.degrad >= 0 && p.degrad <= 1);
    assert(['none', 'always', 'mix', 'random'].includes(p.maleMode), `${w}: maleMode`);
    if (p.fluid === 'distractor') assert.equal(p.auto, 0, `${w}: distractors carry no DNA`);
    else assert(p.auto > 0);
    if (p.fluid === 'semen') assert(['always', 'mix'].includes(p.maleMode), `${w}: semen is male`);
  }
  for (const z of it.touchZones) assert(z.auto > 0 && z.auto < S.threshold * 4, `${w}: touch DNA is low-yield`);
  // Every item must be samplable by at least one instrument.
  assert(Object.keys(S.substrateTools[it.substrate]).length > 0);
  assert(it.teach.fr && it.teach.en);
}
console.log(`MG1: ${S.items.length} items, ${S.instruments.length} instruments, ${bi.ok} bilingual strings checked.`);
