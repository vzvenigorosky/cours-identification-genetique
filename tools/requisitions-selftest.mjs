import assert from 'node:assert/strict';
import { loadWindowData, checkBilingual } from './load-window-data.mjs';
import { readFileSync } from 'node:fs';
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

 
// ---- #61: bilingual, seeded narrative requisitions, independently of FNAEG forms ----
const N = loadWindowData('assets/data/requisitions-narrative.js', 'NARRATIVE_REQUISITIONS');
assert.deepEqual(Array.from(N.SCENARIOS), ['johnDoe', 'sexualAssault']);
assert.equal(N.MODES.length, 6);
for (const mode of N.MODES) {
  for (let seed = 0; seed < 80; seed++) {
    const options = { scenario: 'johnDoe', referenceMode: mode, seed };
    const d = N.generate(options);
    assert.equal(d.scenario, 'johnDoe');
    assert.equal(d.referenceMode, mode);
    assert.equal(d.caseId.length > 0, true);
    assert.equal(d.exhibits[0].kind, 'unknownRemains');
    assert.equal(JSON.stringify(d), JSON.stringify(N.generate(options)), 'same seed => same case');
    assert.equal(new Set(d.exhibits.map(x => x.id)).size, d.exhibits.length, 'unique seals');
    assert(d.references.every(x => d.exhibits.some(e => e.id === x.exhibitId)), 'reference links to submitted physical exhibit');
    assert.equal(d.degraded.length, 0);
    assert.equal(d.quality.vague, false);
    const bilingual = checkBilingual(d);
    assert.deepEqual(bilingual.bad, [], 'all bilingual data complete');
    if (mode === 'none') {
      assert.equal(d.references.length, 0);
      assert.match(d.referenceStatus.fr, /Aucune référence/);
    } else if (mode === 'singleItem') {
      assert.equal(d.references.length, 1);
      assert.equal(d.references[0].kind, 'personalItem');
    } else if (mode === 'multipleItems') {
      assert(d.references.length >= 2 && d.references.every(x => x.kind === 'personalItem'));
    } else if (mode === 'closeKin' || mode === 'distantKin') {
      assert(d.references.length >= 1 && d.references.every(x => x.kind === 'relative'));
      for (const ref of d.references) {
        assert(ref.relationship.path.length >= 2 && ref.relationship.candidate === d.candidate);
        const distant = ['firstCousin','secondCousin','greatAunt'].includes(ref.relationship.id);
        assert.equal(distant, mode === 'distantKin');
      }
    } else if (mode === 'mixed') {
      assert(d.references.some(x => x.kind === 'personalItem'));
      assert(d.references.some(x => x.kind === 'relative'));
    }
    assert(!/FNAEG|SCPPB|Y-STR|mtDNA|autosomal STR/.test(d.mission.en), 'narrative does not prescribe an analysis');
  }
}
for (let seed = 0; seed < 180; seed++) {
  const d = N.generate({ scenario: 'sexualAssault', seed });
  assert.equal(d.scenario, 'sexualAssault');
  assert.equal(d.referenceMode, null);
  assert(d.exhibits.length >= 2);
  assert(d.exhibits.every(e => typeof e.label.fr === 'string' && typeof e.label.en === 'string'));
  assert(d.references.every(r => r.kind === 'knownReference'));
  assert(d.references.every(r => d.exhibits.some(e => e.id === r.exhibitId)));
  assert.equal(JSON.stringify(d), JSON.stringify(N.generate({ scenario: 'sexualAssault', seed, referenceMode: 'distantKin' })), 'irrelevant reference mode ignored');
  assert.deepEqual(checkBilingual(d).bad, []);
}
for (const scenario of N.SCENARIOS) {
  const modes = scenario === 'johnDoe' ? N.MODES : ['random'];
  for (const mode of modes) {
    for (const flags of [{vague:true}, {sloppy:true}, {vague:true,sloppy:true}]) {
      const d = N.generate({scenario, referenceMode:mode, seed:14, ...flags});
      const vagues = d.degraded.filter(e => e.kind === 'vague');
      const sloppies = d.degraded.filter(e => e.kind === 'sloppy');
      assert.equal(vagues.length, flags.vague ? 1 : 0);
      assert.equal(sloppies.length, flags.sloppy ? 1 : 0);
      assert(d.degraded.every(e => e.note.fr && e.note.en), 'corrigé bilingual');
      assert(vagues.every(e => e.was && e.field && e.archetype), 'withheld decisive fact preserved');
      assert(d.exhibits.every(e => /^S[0-9]+$/.test(e.id)));
      assert.deepEqual(checkBilingual(d).bad, [], 'quality changes preserve bilingual data');
    }
  }
}
assert.throws(() => N.generate({scenario:'unrecognized'}));
assert.throws(() => N.generate({scenario:'johnDoe',referenceMode:'thirdCousin'}));
assert.throws(() => N.generate({seed:-1}));
const narrativeUI = readFileSync(new URL('../requisitions.html', import.meta.url), 'utf8');
assert.match(narrativeUI, /value="mixed"/);
assert.match(narrativeUI, /value="fnaegRandom"/);
assert.match(narrativeUI, /value="narrative"/);
assert.match(narrativeUI, /Math\.random\(\) < 0\.5/, 'mixed format must choose both families');
assert.match(narrativeUI, /function renderNarrative\(/);
assert.match(narrativeUI, /build\("mixed", \{\}\)/, 'mixed default preview');
assert.match(narrativeUI, /requisitions-narrative\.js/);
console.log('Requisitions: #61 narrative modes, seeds, bilingual cases, quality axes and mixed UI checked.');
