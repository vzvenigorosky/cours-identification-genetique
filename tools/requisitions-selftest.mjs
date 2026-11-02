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
  assert(d.quality.vague === false, `${t}: clean by default`);
  assert(!('sloppy' in d.quality), `${t}: the typo axis no longer exists (#68)`);
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
  // The withheld nature is replaced by a plausible generic seal description —
  // never a flag like "Nature à déterminer" that would announce the omission.
  assert(d.scelles.every((sc) => sc.type === 'Objet placé sous scellé'), 'trace vague: nature silently unstated');
  assert(d.scelles.every((sc) => !/à déterminer|non (détaillé|précisé|spécifié|communiqué|indiqué)/i.test(sc.type)), 'no self-announcing placeholder');
  assert(d.degraded.some((x) => x.archetype === 'trace-nature-unstated'), 'trace vague recorded');
}
for (let i = 0; i < 30; i++) {
  const d = R.generate('disparu', { vague: true });
  // The withheld relationship is a blank field, not an announced "LIEN NON PRÉCISÉ".
  const missing = d.parentele.filter((p) => p.lien === '');
  assert.equal(missing.length, 1, 'disparu vague: exactly one relative relationship silently unstated');
  assert(d.parentele.every((p) => !/non précisé|non spécifié/i.test(p.lien)), 'no self-announcing lien placeholder');
  assert(d.degraded.some((x) => x.archetype === 'relationship-unstated'), 'disparu vague recorded');
}

// ---- the only quality axis is "vague"; no typo defect is ever produced ----
for (const t of TYPES) {
  for (let i = 0; i < 10; i++) {
    const d = R.generate(t, { vague: true });
    assert(d.degraded.every((x) => x.kind === 'vague'), `${t}: no non-vague degradation`);
    assert(d.quality.vague === true, `${t}: vague flag set`);
  }
}

// ---- data stays fictional: requérant/expert are from the fixed pools, no PII ----
{
  const d = R.generate('suspect', { vague: true });
  assert(typeof d.expert === 'string' && d.expert.length > 0, 'expert present');
  assert(d.etatCivil && d.etatCivil.pere === 'INCONNU INCONNU', 'filiation stays fictional placeholder');
}

// ---- corrigé support (#56): bilingual notes + a preserved dropped value ----
for (const t of TYPES) {
  const d = R.generate(t, { vague: true });
  for (const e of d.degraded) {
    assert(e.note && typeof e.note.fr === 'string' && e.note.fr.trim(), `${t}/${e.field}: French note`);
    assert(typeof e.note.en === 'string' && e.note.en.trim(), `${t}/${e.field}: English note`);
  }
  const vagueEntry = d.degraded.find((e) => e.kind === 'vague');
  assert(vagueEntry && 'was' in vagueEntry, `${t}: vague entry records the dropped value`);
}
// the dropped value is the real original (disparu: a true LIENS entry, not a blank)
for (let i = 0; i < 20; i++) {
  const d = R.generate('disparu', { vague: true });
  const v = d.degraded.find((e) => e.archetype === 'relationship-unstated');
  assert(v && v.was && v.was.trim() !== '', 'disparu: hidden lien preserved for the corrigé');
}

console.log(`Requisitions: clean / vague generation and bilingual corrigé notes for ${TYPES.length} types checked.`);


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
    assert(!('sloppy' in d.quality), 'narrative quality no longer carries a typo axis');
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
    for (const flags of [{}, {vague:true}]) {
      const d = N.generate({scenario, referenceMode:mode, seed:14, ...flags});
      const vagues = d.degraded.filter(e => e.kind === 'vague');
      assert.equal(vagues.length, flags.vague ? 1 : 0);
      assert.equal(d.degraded.length, flags.vague ? 1 : 0, 'the only degradation axis is "vague"');
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
// #69: the free-form document reads as a letter, not a sectioned FNAEG form.
assert.match(narrativeUI, /Je vous fais parvenir, sous scellés,/, 'scellés are woven into prose');
assert.match(narrativeUI, /Je vous prie d'agréer, Madame, Monsieur/, 'polite closing formula');
assert.doesNotMatch(narrativeUI, /value="sloppy"|value="both"/, 'the typo quality options are gone (#68)');

for (const scenario of N.SCENARIOS) {
  for (const mode of scenario === 'johnDoe' ? N.MODES : ['random']) {
    for (let seed = 0; seed < 120; seed++) {
      const clean = N.generate({scenario, referenceMode:mode, seed});
      const vague = N.generate({scenario, referenceMode:mode, seed, vague:true});
      assert.equal(vague.degraded.filter(e => e.kind === 'vague').length, 1);
      assert.equal(clean.degraded.length, 0);
      assert.equal(clean.exhibits.length, vague.exhibits.length, 'defective wording does not discard evidence');
      assert.equal(clean.references.length, vague.references.length, 'defective wording does not discard comparisons');
      assert.deepEqual(checkBilingual(vague).bad, [], 'defective variants remain bilingual');
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
        // Silent omission: the replacement names the exhibit generically and must
        // NOT announce the gap (no "contenu non détaillé" / "contents not described").
        assert(!/non détaillé|non précisé|non spécifié|contents not described|not (described|specified|stated)/i.test(e.label.fr + ' ' + e.label.en), 'no self-announcing label');
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


// ---- #62 / #67: parent-child ages, shared names, explicit + patrilineal pedigree ----
const yearOf = date => Number(date.split('/')[2]);
const identifier = p => p.prenom + ' ' + p.nomNaissance;
let legacyRelatives = 0, femaleCandidateChildren = 0;
for (let i = 0; i < 3000; i++) {
  const vague = i % 2 === 0;
  const d = R.generate('disparu', { vague });
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
      // Patrilineal: the candidate always carries the father's birth surname.
      assert.equal(p.nomNaissance, candidate.nomNaissance);
      assert(candidateYear - relativeYear >= 24 && candidateYear - relativeYear <= 37);
      // A withheld relationship is a blank field (not an announced placeholder).
      if (p.lien === '') assert.equal(candidate.pere, '');
      else assert.equal(identifier(p), candidate.pere);
      if (p.lien) assert.match(p.lien, /^PÈRE/);
    }
    if (p.relationId === 'mother') {
      assert.equal(p.sexe, 'F');
      // A mother married into the family keeps a maiden surname.
      assert.notEqual(p.nomNaissance, candidate.nomNaissance);
      assert(candidateYear - relativeYear >= 22 && candidateYear - relativeYear <= 35);
      if (p.lien === '') assert.equal(candidate.mere, '');
      else assert.equal(identifier(p), candidate.mere);
      if (p.lien) assert.match(p.lien, /^MÈRE/);
    }
    if (p.relationId === 'sibling') {
      // Full siblings share the father's surname.
      assert.equal(p.nomNaissance, candidate.nomNaissance);
      assert(Math.abs(candidateYear - relativeYear) >= 1 && Math.abs(candidateYear - relativeYear) <= 9);
      if (p.lien) assert.match(p.lien, p.sexe === 'M' ? /^FRÈRE/ : /^SŒUR/);
    }
    if (p.relationId === 'child') {
      // #67 patrilineal: the child carries the candidate's surname only when the
      // candidate is male; a female candidate's child takes its father's name.
      if (candidate.sexe === 'M') assert.equal(p.nomNaissance, candidate.nomNaissance);
      else { assert.notEqual(p.nomNaissance, candidate.nomNaissance); femaleCandidateChildren++; }
      assert(relativeYear - candidateYear >= 21 && relativeYear - candidateYear <= 37);
      if (p.lien) assert.match(p.lien, p.sexe === 'M' ? /^FILS/ : /^FILLE/);
    }
  }
}
assert(legacyRelatives > 3000, 'sample numerous relatives');
assert(femaleCandidateChildren > 0, 'female-candidate children exercised the patrilineal naming branch');
// The consented reference in a deliberately vague requisition still reflects
// the same simulated person, only their stated relation is withheld — silently.
for (let i = 0; i < 500; i++) {
  const d = R.generate('disparu', { vague: true });
  assert.equal(d.parentele.filter(p => p.lien === '').length, 1);
  const hidden = d.parentele.find(p => p.lien === '');
  assert(d.degraded[0].was && d.degraded[0].was.trim() !== '');
  // The filiation that would reveal the hidden parent is blanked, not flagged.
  if (hidden.relationId === 'father') assert.equal(d.disparue.pere, '');
  if (hidden.relationId === 'mother') assert.equal(d.disparue.mere, '');
}
const distantIds = new Set(['firstCousin','secondCousin','greatAunt','thirdCousin','fourthCousin']);
const distantDepth = {firstCousin:2,secondCousin:3,greatAunt:3,thirdCousin:4,fourthCousin:5};
const seenDistant = new Set();
// #67 gender-agreeing relationship descriptions.
const expectDescFR = {
  father: 'père biologique présumé', mother: 'mère biologique présumée',
  fullSibling: { M: 'frère germain présumé', F: 'sœur germaine présumée' },
  child: { M: 'fils biologique présumé', F: 'fille biologique présumée' }
};
let narrativeRefs = 0, femaleRelatives = 0, maleRelatives = 0, femaleNarrativeChildren = 0;
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
    if (mode !== 'none') {
      // The candidate's birth clause gender-agrees in French.
      const cb = person.sex === 'F' ? 'née le ' : 'né le ';
      assert(d.narrative.fr.includes('(' + cb + person.birthDate), 'candidate birth clause gender-agrees');
    }
    const named = [person.name]; // selected relatives may include these already-listed parents
    const refs = d.references.filter(ref => ref.kind === 'relative');
    for (const ref of refs) {
      narrativeRefs++;
      const rel = ref.relationship;
      const donor = rel.relativePerson;
      assert(donor && rel.candidate === person.name);
      assert.equal(yearOf(donor.birthDate), donor.birthYear);
      assert(donor.sex === 'M' || donor.sex === 'F');
      if (donor.sex === 'F') femaleRelatives++; else maleRelatives++;
      // Title and birth verb agree with the donor's sex.
      const title = donor.sex === 'M' ? 'M. ' : 'Mme ';
      assert(ref.label.fr.includes(title + donor.name), 'visible sample carries titled donor name');
      const bornFR = donor.sex === 'F' ? 'née le ' : 'né le ';
      assert(ref.claimedSource.fr.includes(bornFR + donor.birthDate), 'comparison birth verb gender-agrees');
      assert(ref.claimedSource.en.includes(donor.birthDate));
      assert(donor.birthYear <= 2008, 'adult donor');
      // Relationship description gender-agrees.
      const expect = expectDescFR[rel.id];
      if (typeof expect === 'string') assert.equal(rel.summary.fr, expect, 'kinship description');
      else if (expect) assert.equal(rel.summary.fr, expect[donor.sex], 'gender-agreeing kinship description');
      else if (rel.id === 'firstCousin' || rel.id === 'secondCousin')
        assert.match(rel.summary.fr, donor.sex === 'F' ? /^cousine/ : /^cousin /, 'cousin(e) agrees');
      named.push(donor.name);
      if (rel.id === 'father') assert.equal(donor.name, d.family.father.name);
      if (rel.id === 'mother') assert.equal(donor.name, d.family.mother.name);
      if (rel.id === 'fullSibling') {
        assert.equal(donor.surname, person.surname);
        assert(Math.abs(donor.birthYear - person.birthYear) <= 8);
      }
      if (rel.id === 'child') {
        // #67 patrilineal: a female candidate's child takes a different surname.
        if (person.sex === 'M') assert.equal(donor.surname, person.surname);
        else { assert.notEqual(donor.surname, person.surname); femaleNarrativeChildren++; }
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
assert(femaleRelatives > 0 && maleRelatives > 0, 'both sexes of relative exercised the descriptions');
assert(femaleNarrativeChildren > 0, 'female-candidate narrative children exercised');
assert.deepEqual([...seenDistant].sort(), [...distantIds].sort(), 'all distant relative types generated');
console.log('Issue #62/#67: 3,000 FNAEG family cases and 7,200 narrative configurations checked for patrilineal, gender-agreeing kinship coherence.');


// ---- UI / mock PDF integration: random quality must work for both document
// families; forced quality must remain reliable; the narrative must render as a
// polite letter. A lightweight jsPDF double validates the actual page
// controller, not visual PDF layout. ----
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
  const counts = { fnaeg: 0, narrative: 0, clean: 0, vague: 0 };
  for (let i = 0; i < 320; i++) {
    events['gen:click']();
    const data = win.__lastReq;
    counts[data.type === 'narrative' ? 'narrative' : 'fnaeg']++;
    const q = data.quality;
    counts[q.vague ? 'vague' : 'clean']++;
    assert(!('sloppy' in q), 'no typo axis reaches the controller');
    assert(element('corrige').classList.contains('hidden'), 'new case must hide prior answer key');
    assert(!element('corrigeBtn').disabled, 'answer key also available on clean cases');
    assert(!element('corrigeHint').textContent.includes('nette'), 'no clean-case spoilers');
  }
  for (const value of Object.values(counts)) assert(value >= 10, 'all formats/qualities appear with random default');
  for (const q of ['nette', 'vague']) {
    element('rtype').value = 'narrative';
    element('nscenario').value = 'johnDoe';
    element('nreference').value = 'closeKin';
    element('rquality').value = q;
    events['gen:click']();
    assert.equal(win.__lastReq.quality.vague, q === 'vague');
    assert(!('sloppy' in win.__lastReq.quality));
  }
  // The free-form narrative renders as a letter: polite formulations, woven
  // scellés and the fictional watermark, in both languages. (#69)
  element('rtype').value = 'narrative';
  element('nscenario').value = 'johnDoe';
  element('nreference').value = 'closeKin';
  element('rquality').value = 'nette';
  events['gen:click']();
  assert.equal(win.__lastData.type, 'narrative');
  const renderedFR = win.__lastDoc.texts.join(' \n ');
  assert.match(renderedFR, /DOCUMENT FICTIF/, 'watermark present on the fictional letter');
  assert.match(renderedFR, /Madame, Monsieur,/, 'letter salutation');
  assert.match(renderedFR, /Je vous fais parvenir, sous scellés, .*\bS1\b/, 'scellés woven into prose with their codes');
  assert.match(renderedFR, /Je vous prie d'agréer, Madame, Monsieur/, 'polite closing');
  assert.doesNotMatch(renderedFR, /SCELLÉ\(S\)|REQUÉRANT|CADRE JURIDIQUE/, 'no FNAEG section bars in the free-form letter');
  const originalData = JSON.stringify(win.__lastData);
  currentLang = 'en';
  events['document:langchange']();
  assert.equal(JSON.stringify(win.__lastData), originalData, 'language change does not generate a new case');
  const renderedEN = win.__lastDoc.texts.join(' \n ');
  assert.match(renderedEN, /FICTIONAL DOCUMENT/);
  assert.match(renderedEN, /Dear Sir or Madam,/);
  assert.match(renderedEN, /I am sending you, under seal,/);
  assert.match(renderedEN, /Yours faithfully,/);
  // A clean answer is disclosed only after the user opens the corrigé.
  element('rquality').value = 'nette';
  events['gen:click']();
  assert(!element('corrigeHint').textContent.includes('Clean requisition'));
  events['corrigeBtn:click'].call(element('corrigeBtn'));
  assert.match(element('corrigeBody').innerHTML, /No intentional defect/);
  events['gen:click']();
  assert(element('corrige').classList.contains('hidden'), 'fresh case re-hides a previously opened corrigé');
  console.log('Requisitions UI: 320 mixed cases, forced quality choices and a bilingual letter-format PDF smoke PASS', counts);
}
