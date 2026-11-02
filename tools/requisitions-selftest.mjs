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
      assert.equal(new Set(d.references.map(x => x.label.fr)).size, d.references.length, 'no duplicate relative identities');
      for (const ref of d.references) {
        assert(ref.relationship.path.length >= 2 && ref.relationship.candidate === d.candidate);
        const distant = ['firstCousin','secondCousin','greatAunt','thirdCousin','fourthCousin'].includes(ref.relationship.id);
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
      assert.equal(sloppies.length, flags.sloppy ? 3 : 0);
      if (flags.sloppy) {
        assert(d.narrative.fr.match(/resttes|corpss|persone/), 'French casework typo is visible');
        assert(d.narrative.en.match(/remians|bodu|persn/), 'English casework typo is visible');
        assert(d.mission.fr.includes('génetiques') && d.mission.en.includes('genetc'), 'mission typo is visible in both languages');
        assert(d.degraded.some(e => e.field === 'mission'), 'corrigé identifies actual mission typo');
      }
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
assert.match(narrativeUI, /build\("mixed", readOpts\(\)\)/, 'initial preview respects randomized quality');
assert.match(narrativeUI, /requisitions-narrative\.js/);

for (const scenario of N.SCENARIOS) {
  for (const mode of scenario === 'johnDoe' ? N.MODES : ['random']) {
    for (let seed = 0; seed < 120; seed++) {
      const clean = N.generate({scenario, referenceMode:mode, seed});
      const vague = N.generate({scenario, referenceMode:mode, seed, vague:true});
      const sloppy = N.generate({scenario, referenceMode:mode, seed, sloppy:true});
      const both = N.generate({scenario, referenceMode:mode, seed, vague:true, sloppy:true});
      assert.equal(vague.degraded.filter(e => e.kind === 'sloppy').length, 0);
      assert.equal(vague.degraded.filter(e => e.kind === 'vague').length, 1);
      assert.equal(sloppy.degraded.filter(e => e.kind === 'sloppy').length, 3);
      assert.equal(both.degraded.length, 4);
      assert.equal(clean.degraded.length, 0);
      assert.equal(clean.exhibits.length, vague.exhibits.length, 'defective wording does not discard evidence');
      assert.equal(clean.references.length, vague.references.length, 'defective wording does not discard comparisons');
      assert.deepEqual(checkBilingual(both).bad, [], 'defective variants remain bilingual');
      const defect = vague.degraded[0];
      if (defect.archetype === 'relationship-path-unstated') {
        const ref = vague.references.find(x => defect.field === 'references.'+x.id+'.claimedSource');
        assert(ref && !ref.claimedSource.fr.includes(ref.relationship.summary.fr));
        assert(ref.claimedSource.fr.includes(ref.relationship.relativePerson.birthDate), 'dates remain available');
      } else if (defect.archetype === 'comparison-attribution-unstated') {
        const ref = vague.references.find(x => defect.field === 'references.'+x.id+'.claimedSource');
        assert(ref && !ref.claimedSource.fr.includes(vague.candidate), 'claimed source is actually omitted');
      } else if (defect.archetype === 'sample-nature-unstated') {
        const e = vague.exhibits.find(x => defect.field === 'exhibits.'+x.id+'.label');
        assert(e && !e.label.fr.includes(defect.was.fr), 'sample type/site was actually omitted');
      } else if (defect.archetype === 'exhibit-origin-unstated') {
        const e = vague.exhibits.find(x => defect.field === 'exhibits.'+x.id+'.provenance');
        assert(e && !e.provenance.fr.includes(defect.was.fr), 'collection circumstances were actually omitted');
      } else if (defect.archetype === 'comparison-status-unstated') {
        assert.equal(mode, 'none');
        assert(!vague.referenceStatus.fr.includes('Aucune référence'), 'availability no longer explicit');
      } else {
        assert.fail('Unexpected vague omission archetype '+defect.archetype);
      }
    }
  }
}

console.log('Requisitions: narrative quality variants and meaningful omissions verified.');


// ---- #62: parent-child ages, shared names, explicit and coherent pedigree ----
const yearOf = date => Number(date.split('/')[2]);
const identifier = p => p.prenom + ' ' + p.nomNaissance;
let legacyRelatives = 0;
for (let i = 0; i < 3000; i++) {
  const vague = i % 2 === 0;
  const d = R.generate('disparu', { vague, sloppy: i % 7 === 0 });
  const candidate = d.disparue, candidateYear = yearOf(candidate.dateNaissance);
  const currentYear = new Date().getFullYear();
  assert(candidateYear <= currentYear - 32 && candidateYear >= currentYear - 55);
  assert.equal(d.parentele.length >= 1 && d.parentele.length <= 3, true);
  assert.match(d.disparueSource, /attribu|présenté/i);
  assert.equal(new Set(d.parentele.map(p => p.relationId)).size, d.parentele.length, 'no duplicate reported relationships');
  const individuals = [candidate.prenoms + ' ' + candidate.nomNaissance, ...d.parentele.map(identifier)];
  assert.equal(new Set(individuals).size, individuals.length, 'no duplicate person identities');
  for (const p of d.parentele) {
    legacyRelatives++;
    const relativeYear = yearOf(p.dateNaissance);
    assert(relativeYear <= currentYear - 18, 'reference donor adult');
    assert.equal(p.accord, true, 'transmitted relative sample is recorded as consented');
    if (p.relationId === 'father') {
      assert.equal(p.sexe, 'M');
      assert.equal(p.nomNaissance, candidate.nomNaissance);
      assert(candidateYear - relativeYear >= 24 && candidateYear - relativeYear <= 37);
      if (p.lien === 'LIEN NON PRÉCISÉ') assert.equal(candidate.pere, 'NON PRÉCISÉ');
      else assert.equal(identifier(p), candidate.pere);
      if (p.lien !== 'LIEN NON PRÉCISÉ') assert.match(p.lien, /^PÈRE/);
    }
    if (p.relationId === 'mother') {
      assert.equal(p.sexe, 'F');
      assert.notEqual(p.nomNaissance, candidate.nomNaissance);
      assert(candidateYear - relativeYear >= 22 && candidateYear - relativeYear <= 35);
      if (p.lien === 'LIEN NON PRÉCISÉ') assert.equal(candidate.mere, 'NON PRÉCISÉ');
      else assert.equal(identifier(p), candidate.mere);
      if (p.lien !== 'LIEN NON PRÉCISÉ') assert.match(p.lien, /^MÈRE/);
    }
    if (p.relationId === 'sibling') {
      assert.equal(p.nomNaissance, candidate.nomNaissance);
      assert(Math.abs(candidateYear - relativeYear) >= 1 && Math.abs(candidateYear - relativeYear) <= 9);
      if (p.lien !== 'LIEN NON PRÉCISÉ') assert.match(p.lien, p.sexe === 'M' ? /^FRÈRE/ : /^SŒUR/);
    }
    if (p.relationId === 'child') {
      assert.equal(p.nomNaissance, candidate.nomNaissance);
      assert(relativeYear - candidateYear >= 21 && relativeYear - candidateYear <= 37);
      if (p.lien !== 'LIEN NON PRÉCISÉ') assert.match(p.lien, p.sexe === 'M' ? /^FILS/ : /^FILLE/);
    }
  }
}
assert(legacyRelatives > 3000, 'sample numerous relatives');
// The consented reference in a deliberately vague requisition still reflects
// the same simulated person, only their stated relation is withheld.
for (let i = 0; i < 500; i++) {
  const d = R.generate('disparu', { vague: true });
  assert.equal(d.parentele.filter(p => p.lien === 'LIEN NON PRÉCISÉ').length, 1);
  const hidden = d.parentele.find(p => p.lien === 'LIEN NON PRÉCISÉ');
  assert(d.degraded[0].was && d.degraded[0].was !== 'LIEN NON PRÉCISÉ');
  if (hidden.relationId === 'father') assert.equal(d.disparue.pere, 'NON PRÉCISÉ');
  if (hidden.relationId === 'mother') assert.equal(d.disparue.mere, 'NON PRÉCISÉ');
}
const distantIds = new Set(['firstCousin','secondCousin','greatAunt','thirdCousin','fourthCousin']);
const distantDepth = {firstCousin:2,secondCousin:3,greatAunt:3,thirdCousin:4,fourthCousin:5};
const seenDistant = new Set();
let narrativeRefs = 0;
for (let seed = 0; seed < 1200; seed++) {
  for (const mode of N.MODES) {
    const d = N.generate({scenario:'johnDoe',referenceMode:mode,seed});
    const person = d.candidatePerson;
    assert(person && person.name === d.candidate);
    assert.equal(person.surname, d.family.father.surname);
    assert.notEqual(d.family.father.surname, d.family.mother.surname);
    assert(person.birthYear - d.family.father.birthYear >= 24);
    assert(person.birthYear - d.family.mother.birthYear >= 22);
    assert(d.narrative.fr.includes(person.birthDate) || mode === 'none', 'candidate DOB in request');
    assert(d.narrative.en.includes(person.birthDate) || mode === 'none');
    const named = [person.name]; // selected relatives may include these already-listed parents
    const refs = d.references.filter(ref => ref.kind === 'relative');
    for (const ref of refs) {
      narrativeRefs++;
      const rel = ref.relationship;
      const donor = rel.relativePerson;
      assert(donor && rel.candidate === person.name);
      assert.equal(yearOf(donor.birthDate), donor.birthYear);
      assert(donor.sex === 'M' || donor.sex === 'F');
      assert(ref.label.fr.includes(donor.name), 'visible sample carries donor name');
      assert(ref.claimedSource.fr.includes(donor.birthDate), 'visible comparison carries donor birth date');
      assert(ref.claimedSource.en.includes(donor.birthDate));
      assert(donor.birthYear <= 2008, 'adult donor');
      named.push(donor.name);
      if (rel.id === 'father') assert.equal(donor.name, d.family.father.name);
      if (rel.id === 'mother') assert.equal(donor.name, d.family.mother.name);
      if (rel.id === 'fullSibling') {
        assert.equal(donor.surname, person.surname);
        assert(Math.abs(donor.birthYear - person.birthYear) <= 8);
      }
      if (rel.id === 'child') {
        assert.equal(donor.surname, person.surname);
        assert(donor.birthYear - person.birthYear >= 21);
      }
      if (distantIds.has(rel.id)) {
        seenDistant.add(rel.id);
        assert(rel.commonAncestor, 'named reported shared ancestor for distant kin');
        assert(rel.commonAncestor.birthYear < person.birthYear - 18 * distantDepth[rel.id],
          'ancestral generation predates the candidate');
        if (rel.id === 'greatAunt') assert(2026 - donor.birthYear <= 95);
        else assert(Math.abs(donor.birthYear - person.birthYear) <= 11);
      }
    }
    assert.equal(new Set(named).size, named.length, 'no repeated relative names');
    assert.equal(new Set(refs.map(ref => ref.exhibitId)).size, refs.length, 'unique biological references');
  }
}
assert(narrativeRefs > 1000, 'kinship cases exercised');
assert.deepEqual([...seenDistant].sort(), [...distantIds].sort(), 'all distant relative types generated');
console.log('Issue #62: 3,000 FNAEG family cases and 7,200 narrative configurations checked for kinship coherence.');


// ---- UI / mock PDF integration: random quality must work for both document
// families; force-quality modes must remain reliable. A lightweight jsPDF
// double validates the actual page controller, not visual PDF layout. ----
{
  const source = narrativeUI.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert(source && source.includes('function build('), 'inline requisition controller found');
  const win = { REQUISITIONS: R, NARRATIVE_REQUISITIONS: N };
  let currentLang = 'fr', randomSeed = 951233;
  const i18n = { getLang: () => currentLang };
  const math = Object.create(Math);
  math.random = () => {
    randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };
  class PdfStub {
    constructor() { this.texts = []; this.pages = 1; }
    saveGraphicsState() {}
    setFont() {} setFontSize() {} setTextColor() {} setFillColor() {}
    setDrawColor() {} rect() {} line() {} setLineWidth() {} addImage() {}
    addPage() { this.pages++; }
    text(v) { this.texts.push(v); }
    splitTextToSize(v) { return [String(v)]; }
    output() { return 'blob:mock'; }
    save() {}
  }
  win.jspdf = { jsPDF: PdfStub };
  win.JsBarcode = () => {};
  win.I18N = i18n;
  const events = {}, elements = {};
  function element(id) {
    if (!elements[id]) {
      const classes = new Set(['hidden']);
      elements[id] = {
        value: id === 'rtype' ? 'mixed' : 'random', style: {}, disabled: false,
        textContent: '', innerHTML: '',
        classList: {
          add: x => classes.add(x), remove: x => classes.delete(x),
          contains: x => classes.has(x),
          toggle: x => classes.has(x) ? (classes.delete(x), false) : (classes.add(x), true)
        },
        addEventListener: (name, callback) => { events[id + ':' + name] = callback; }
      };
    }
    return elements[id];
  }
  const doc = {
    getElementById: element,
    createElement: () => ({ toDataURL: () => 'data:image/png;base64,AAAA' }),
    addEventListener: (name, callback) => { events['document:' + name] = callback; }
  };
  // This executes the actual HTML controller against deterministic DOM/PDF
  // doubles; the generator modules above are the same modules exercised in CI.
  new Function('window', 'document', 'I18N', 'Math', 'URL', source)(
    win, doc, i18n, math, { revokeObjectURL() {} }
  );
  const counts = { fnaeg: 0, narrative: 0, clean: 0, vague: 0, sloppy: 0, both: 0 };
  for (let i = 0; i < 320; i++) {
    events['gen:click']();
    const data = win.__lastReq;
    counts[data.type === 'narrative' ? 'narrative' : 'fnaeg']++;
    const q = data.quality;
    counts[q.vague && q.sloppy ? 'both' : q.vague ? 'vague' : q.sloppy ? 'sloppy' : 'clean']++;
    assert(element('corrige').classList.contains('hidden'), 'new case must hide prior answer key');
    assert(!element('corrigeBtn').disabled, 'answer key also available on clean cases');
    assert(!element('corrigeHint').textContent.includes('nette'), 'no clean-case spoilers');
  }
  for (const value of Object.values(counts)) assert(value >= 10, 'all formats/qualities appear with random default');
  for (const q of ['nette', 'vague', 'sloppy', 'both']) {
    element('rtype').value = 'narrative';
    element('nscenario').value = 'johnDoe';
    element('nreference').value = 'closeKin';
    element('rquality').value = q;
    events['gen:click']();
    assert.equal(win.__lastReq.quality.vague, q === 'vague' || q === 'both');
    assert.equal(win.__lastReq.quality.sloppy, q === 'sloppy' || q === 'both');
  }
  element('rquality').value = 'sloppy';
  events['gen:click']();
  const renderedFR = win.__lastDoc.texts.join(' ');
  assert.match(renderedFR, /resttes|corpss/, 'typo is in student PDF text, not only its metadata');
  assert.match(renderedFR, /génetiques/, 'mission typo also in PDF');
  const originalData = JSON.stringify(win.__lastData);
  currentLang = 'en';
  events['document:langchange']();
  assert.equal(JSON.stringify(win.__lastData), originalData, 'language change does not generate a new case');
  const renderedEN = win.__lastDoc.texts.join(' ');
  assert.match(renderedEN, /remians|bodu/);
  assert.match(renderedEN, /genetc/);
  // A clean answer is disclosed only after the user opens the corrigé.
  element('rquality').value = 'nette';
  events['gen:click']();
  assert(!element('corrigeHint').textContent.includes('Clean requisition'));
  events['corrigeBtn:click'].call(element('corrigeBtn'));
  assert.match(element('corrigeBody').innerHTML, /No intentional defect/);
  events['gen:click']();
  assert(element('corrige').classList.contains('hidden'), 'fresh case re-hides a previously opened corrigé');
  console.log('Requisitions UI: 320 mixed cases, four manual quality choices and bilingual PDF text smoke PASS', counts);
}
