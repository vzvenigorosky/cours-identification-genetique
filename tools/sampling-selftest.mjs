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
for (const f of Object.values(S.fluorescence)) {
  assert.equal(typeof f.als, 'boolean'); assert.equal(typeof f.uv, 'boolean');
}
// Blood must never fluoresce (the teaching point of the light step).
assert(!S.fluorescence.blood.als && !S.fluorescence.blood.uv);
assert(S.fluorescence.semen.uv && S.fluorescence.semen.als);
assert(S.fluorescence.saliva.als && !S.fluorescence.saliva.uv, 'ALS is more sensitive than UV');

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
