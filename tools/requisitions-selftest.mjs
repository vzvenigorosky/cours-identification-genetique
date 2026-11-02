import assert from 'node:assert/strict';
import { loadWindowData } from './load-window-data.mjs';
const R = loadWindowData('assets/data/requisitions.js', 'REQUISITIONS');

const TYPES = ['suspect', 'condamne', 'trace', 'disparu'];

// ---- clean generation: expected shape, no degradation record ----
for (const t of TYPES) {
  const d = R.generate(t);
  assert(d && d.type, `${t}: has a type`);
  assert(d.requerant && d.requerant.nom, `${t}: has a requérant`);
  assert(d.quality.vague === false && d.quality.sloppy === false, `${t}: clean by default`);
  assert.equal(d.degraded.length, 0, `${t}: no degradation when clean`);
}
assert.equal(R.generate('trace').type, 'trace');
assert.equal(R.generate('disparu').type, 'disparu');

// ---- vague: the mapped decisive fact is dropped and recorded ----
for (let i = 0; i < 20; i++) {
  const d = R.generate('suspect', { vague: true });
  assert.equal(d.infractions, '', 'individu vague: offence blanked');
  assert(d.degraded.some((x) => x.kind === 'vague' && x.archetype === 'offence-unstated'), 'individu vague recorded');
}
for (let i = 0; i < 20; i++) {
  const d = R.generate('trace', { vague: true });
  assert(d.scelles.every((sc) => sc.type === 'Nature à déterminer'), 'trace vague: nature unstated');
  assert(d.degraded.some((x) => x.archetype === 'trace-nature-unstated'), 'trace vague recorded');
}
for (let i = 0; i < 30; i++) {
  const d = R.generate('disparu', { vague: true });
  const missing = d.parentele.filter((p) => p.lien === 'LIEN NON PRÉCISÉ');
  assert.equal(missing.length, 1, 'disparu vague: exactly one relative relationship unstated');
  assert(d.degraded.some((x) => x.archetype === 'relationship-unstated'), 'disparu vague recorded');
}

// ---- sloppy: text defects applied and recorded; barcodes untouched ----
for (let i = 0; i < 20; i++) {
  const d = R.generate('trace', { sloppy: true });
  assert(d.degraded.some((x) => x.kind === 'sloppy'), 'sloppy recorded');
  assert(['OPJ', 'APJ'].includes(d.requerant.grade), 'grade abbreviated');
  assert.equal(d.requerant.service, d.requerant.service.toLowerCase(), 'service lowercased');
  assert(d.scelles.every((sc) => /^[0-9]+$/.test(String(sc.barcode))), 'barcodes stay numeric (not garbled)');
  assert(/^[0-9]+$/.test(String(d.scelles[0].barcode)));
}

// ---- both axes combine ----
{
  const d = R.generate('disparu', { vague: true, sloppy: true });
  assert(d.quality.vague && d.quality.sloppy, 'both flags set');
  assert(d.degraded.some((x) => x.kind === 'vague') && d.degraded.some((x) => x.kind === 'sloppy'), 'both degradations recorded');
}

// ---- data stays fictional: requérant/expert are from the fixed pools, no PII ----
{
  const d = R.generate('suspect', { sloppy: true });
  assert(typeof d.expert === 'string' && d.expert.length > 0, 'expert present');
  assert(d.etatCivil && d.etatCivil.pere === 'INCONNU INCONNU', 'filiation stays fictional placeholder');
}

// ---- corrigé support (#56): bilingual notes + a preserved dropped value ----
for (const t of TYPES) {
  const d = R.generate(t, { vague: true, sloppy: true });
  for (const e of d.degraded) {
    assert(e.note && typeof e.note.fr === 'string' && e.note.fr.trim(), `${t}/${e.field}: French note`);
    assert(typeof e.note.en === 'string' && e.note.en.trim(), `${t}/${e.field}: English note`);
  }
  const vagueEntry = d.degraded.find((e) => e.kind === 'vague');
  assert(vagueEntry && 'was' in vagueEntry, `${t}: vague entry records the dropped value`);
}
// the dropped value is the real original (disparu: a true LIENS entry, not the placeholder)
for (let i = 0; i < 20; i++) {
  const d = R.generate('disparu', { vague: true });
  const v = d.degraded.find((e) => e.archetype === 'relationship-unstated');
  assert(v && v.was && v.was !== 'LIEN NON PRÉCISÉ', 'disparu: hidden lien preserved');
}

console.log(`Requisitions: clean / vague / sloppy / both generation and bilingual corrigé notes for ${TYPES.length} types checked.`);
