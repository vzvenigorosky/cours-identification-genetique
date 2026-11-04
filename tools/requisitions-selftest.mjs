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

// ---- #81: FNAEG forms are never vague, even if a caller asks for it ----
for (const t of TYPES) {
  for (let i = 0; i < 20; i++) {
    const d = R.generate(t, { vague: true });
    assert.equal(d.quality.vague, false, `${t}: FNAEG form never vague`);
    assert.equal(d.degraded.length, 0, `${t}: no degradation record`);
    if (t === 'suspect' || t === 'condamne') assert(d.infractions, `${t}: offence always stated`);
    if (t === 'trace') assert(d.scelles.every((sc) => sc.type !== 'Objet placé sous scellé'), 'trace: nature always stated');
    if (t === 'disparu') assert(d.parentele.every((p) => p.lien), 'disparu: every kinship link stated');
  }
}
assert.equal(R.generate('trace').type, 'trace');

console.log(`Requisitions: clean FNAEG generation (never vague) for ${TYPES.length} types checked.`);


// ---- #61: bilingual, seeded narrative requisitions, independently of FNAEG forms ----
const N = loadWindowData('assets/data/requisitions-narrative.js', 'NARRATIVE_REQUISITIONS', { preload: ['assets/data/requisition-shared.js'] });
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
assert.match(narrativeUI, /function renderNarrative\(/);
// Full random: no format / case / comparison / quality selectors any more.
assert.doesNotMatch(narrativeUI, /id="(rtype|nscenario|nreference|rquality)"/, 'selectors removed: every draw is fully random');
assert.doesNotMatch(narrativeUI, /corrigé|answer key/i, 'no answer-key wording');
assert.match(narrativeUI, /Montrer les informations manquantes/);
assert.match(narrativeUI, /Show missing information/);
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
      } else if (defect.archetype === 'ejaculation-unstated') {
        assert.equal(scenario, 'sexualAssault');
        assert(!/éjacul/i.test(vague.narrative.fr) && !/ejaculat/i.test(vague.narrative.en), 'ejaculation sentence silently absent');
        assert(/éjacul/i.test(clean.narrative.fr) && /ejaculat/i.test(clean.narrative.en), 'clean version states it');
        assert(!/non précis|not stated|omitted/i.test(vague.narrative.fr + vague.narrative.en), 'no self-announcing gap');
      } else if (defect.archetype === 'swab-source-unstated') {
        assert.equal(scenario, 'sexualAssault');
        const sw = vague.exhibits.find(x => defect.field === 'exhibits.' + x.id + '.label');
        assert(sw && sw.label.fr === 'écouvillon buccal' && sw.label.en === 'cheek swab', 'swab named generically');
        assert(!/plaignant|mis en cause|mise en cause|complainant|under investigation/.test(sw.label.fr + sw.provenance.fr + sw.label.en + sw.provenance.en), 'donor and purpose withheld');
        assert(!/plaignant|mis en cause|mise en cause|complainant|under investigation/.test(vague.referenceStatus.fr + vague.referenceStatus.en) || !vague.references.some(x => x.exhibitId === sw.id), 'reference status does not name the donor of the hidden swab');
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
  const d = R.generate('disparu');
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
// ---- #81: randomly drawn kinship cases only use close relatives ----
for (let seed = 1; seed <= 600; seed++) {
  const d = N.generate({ scenario: 'johnDoe', referenceMode: 'random', seed });
  assert.notEqual(d.referenceMode, 'distantKin', 'random draw never picks distantKin');
  for (const ref of d.references || []) {
    assert(!/firstCousin|secondCousin|greatAunt|thirdCousin|fourthCousin/.test(String(ref.relation || ref.id || '')), 'no distant relative in random draw');
  }
}
// ---- #81: second-degree relatives always state their side (paternal / maternal) ----
{
  const seen = new Set();
  const sideRe = /paternel|paternelle|maternel|maternelle/;
  const enSideRe = /paternal|maternal/;
  for (let seed = 1; seed <= 1500; seed++) {
    const d = N.generate({ scenario: 'johnDoe', referenceMode: 'closeKin', seed });
    for (const ref of d.references) {
      const rel = ref.relationship, donor = rel.relativePerson;
      if (!/^(paternal|maternal)/.test(rel.id)) continue;
      seen.add(rel.id.replace(/^(paternal|maternal)/, '$1 '));
      assert(sideRe.test(rel.summary.fr) && enSideRe.test(rel.summary.en), 'side stated in both languages: ' + rel.id);
      assert(sideRe.test(ref.claimedSource.fr) && enSideRe.test(ref.claimedSource.en), 'side appears in the request text');
      assert(donor.birthYear <= 2008, 'adult donor');
      const f = rel.summary.fr;
      if (/Grandfather|Uncle|Brother/.test(rel.id)) { assert.equal(donor.sex, 'M'); assert(/^(grand-père|oncle|demi-frère)/.test(f)); }
      else { assert.equal(donor.sex, 'F'); assert(/^(grand-mère|tante|demi-sœur)/.test(f)); }
      const paternal = rel.id.startsWith('paternal');
      if (/Uncle|Aunt|Grandfather/.test(rel.id) && paternal) assert.equal(donor.surname, d.candidatePerson.surname, 'paternal-line male keeps the surname');
      if (/Uncle|Aunt|Grandfather/.test(rel.id) && !paternal) assert.equal(donor.surname, d.family.mother.surname, 'maternal-line keeps the maternal surname');
      if (/HalfBrother|HalfSister/.test(rel.id)) {
        assert(Math.abs(donor.birthYear - d.candidatePerson.birthYear) >= 2);
        if (paternal) assert.equal(donor.surname, d.candidatePerson.surname);
        else assert.notEqual(donor.surname, d.candidatePerson.surname);
      }
      // A vague variant drops the whole relationship, side included.
      const v = N.generate({ scenario: 'johnDoe', referenceMode: 'closeKin', seed, vague: true });
      assert(v.degraded.length === 1);
    }
  }
  assert(seen.size >= 12, 'every side/kind combination was exercised, got ' + seen.size);
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


// ---- clear free-form requests (owner feedback): sexual-assault cases state the
// act, whether ejaculation is reported (and where), the examination delay, and
// for every seal its nature/site and link to the facts. ----
{
  const seen = { ejaculation: new Set(), vagueKinds: new Set(), statuses: new Set() };
  for (let seed = 0; seed < 600; seed++) {
    const d = N.generate({ scenario: 'sexualAssault', seed });
    assert.match(d.narrative.fr, /éjacul/i, 'clean FR narrative states ejaculation (or its absence)');
    assert.match(d.narrative.en, /ejaculat/i, 'clean EN narrative states ejaculation (or its absence)');
    assert.match(d.narrative.fr, /environ \d+ h après les faits/, 'examination delay stated');
    assert.match(d.narrative.en, /about \d+ h after the alleged events/);
    assert.match(d.question.fr, /^Question posée :/);
    assert.match(d.question.en, /^Question put to you:/);
    seen.statuses.add(d.facts.stated.ejaculation.status);
    for (const e of d.exhibits) {
      assert(e.provenance.fr.length > 15 && e.provenance.en.length > 15, 'every seal states how/where it was collected');
      if (e.kind === 'evidence') assert(!/^(un|une) /.test(e.label.fr), 'evidence seal names its nature/site');
      if (/buccal|oral/.test(e.label.fr)) {
        // A cheek swab is never anonymous: either a reference of a named party, or
        // the complainant's evidentiary swab with its purpose.
        assert(/de référence (de la plaignante|du plaignant|de la personne plaignante|du mis en cause|de la mise en cause|de la personne mise en cause)|(de la plaignante|du plaignant|de la personne plaignante), prélevé à la recherche/.test(e.label.fr), 'cheek swab states whose it is and why: ' + e.label.fr);
      }
    }
    for (const ref of d.references) {
      assert(/référence (de la plaignante|du plaignant|de la personne plaignante|du mis en cause|de la mise en cause|de la personne mise en cause)/.test(ref.claimedSource.fr));
      const e = d.exhibits.find(x => x.id === ref.exhibitId);
      assert(/sans lien avec les faits/.test(e.provenance.fr) && /unrelated to the events/.test(e.provenance.en), 'reference swab is explicitly unrelated to the facts');
    }
    const v = N.generate({ scenario: 'sexualAssault', seed, vague: true });
    seen.vagueKinds.add(v.degraded[0].archetype);
    // Silent omission must not leak through other text.
    if (v.degraded[0].archetype === 'ejaculation-unstated') {
      assert(!/éjacul/i.test(JSON.stringify(v.exhibits) + v.question.fr + v.referenceStatus.fr), 'no leak of the removed ejaculation fact');
    }
  }
  assert.deepEqual([...seen.vagueKinds].sort(), ['ejaculation-unstated', 'sample-nature-unstated', 'swab-source-unstated']);
  assert(seen.statuses.has('yes') && seen.statuses.has('no') && seen.statuses.has('unknown'), 'all ejaculation statuses generated');
  // John Doe: the question and the origin of personal items are stated.
  for (let seed = 0; seed < 200; seed++) {
    const d = N.generate({ scenario: 'johnDoe', seed });
    assert.match(d.question.fr, /^Question posée :/);
    for (const x of d.references.filter(r => r.kind === 'personalItem')) assert(/dernier domicile connu/.test(x.provenance.fr), 'personal item origin stated');
  }
  console.log('Requisitions: free-form sexual-assault and unidentified-person requests state the decisive facts.');
}

// ---- #76: complainant/assailant sexes and wording style (shared with the quote simulator) ----
{
  const n = 1500, c = { F: 0, M: 0, authorM: 0, gendered: 0, neutral: 0 };
  for (let seed = 0; seed < n; seed++) {
    const d = N.generate({ scenario: 'sexualAssault', seed });
    const p = d.parties;
    c[p.victimSex]++; if (p.authorSex === 'M') c.authorM++; c[p.style]++;
    const text = d.narrative.fr + ' ' + d.exhibits.map(e => e.label.fr + ' ' + e.provenance.fr).join(' ');
    const en = d.narrative.en;
    if (p.style === 'neutral') {
      assert(!/\b(Elle|Il) /.test(d.narrative.fr), 'neutral wording avoids gendered pronouns (FR)');
      assert(!/\b(She|He) |\bher\b|\bhis\b/.test(en), 'neutral wording avoids gendered pronouns (EN)');
      assert(/\bThey\b|\btheir\b/.test(en) || !/describe|state/.test(en), 'neutral EN uses they');
    } else {
      assert(p.victimSex === 'F' ? /\bElle\b/.test(d.narrative.fr) && /\bShe\b/.test(en) : /\bIl\b/.test(d.narrative.fr) && /\bHe\b/.test(en), 'gendered wording matches the complainant');
      assert(/plaignant/.test(text) || /une? plaignant/i.test(d.narrative.fr), 'gendered noun used');
    }
  }
  assert(c.F / n > 0.78 && c.F / n < 0.92, 'complainant is a woman in about 85% of cases: ' + c.F / n);
  assert(c.M > 0, 'male complainants are generated');
  assert(c.authorM / n > 0.85 && c.authorM / n < 0.95, 'alleged assailant is a man in about 90% of cases: ' + c.authorM / n);
  assert(c.gendered > 500 && c.neutral > 500, 'both wording styles appear');
  console.log('Requisitions: shared party model (sexes and gendered/neutral wording) checked.');
}

// ---- audit fixes: elision, named common ancestor, impossible dates ----
{
  let distant = 0;
  for (let seed = 0; seed < 600; seed++) {
    for (const mode of ['closeKin', 'distantKin', 'mixed']) {
      const d = N.generate({ scenario: 'johnDoe', referenceMode: mode, seed });
      for (const ref of d.references.filter(r => r.kind === 'relative')) {
        const first = d.candidate.split(' ')[0];
        const vowel = /^[AEIOUÉÈÊÎÔÛ]/i.test(first);
        assert(vowel ? ref.claimedSource.fr.includes(" d'" + d.candidate) : ref.claimedSource.fr.includes(' de ' + d.candidate), 'elision: ' + ref.claimedSource.fr);
        if (ref.relationship.commonAncestor) {
          distant++;
          assert(ref.claimedSource.fr.includes(ref.relationship.commonAncestor.name) && /ancêtre commun allégué/.test(ref.claimedSource.fr), 'distant kin names the common ancestor (lineage is decisive)');
          assert(ref.claimedSource.en.includes(ref.relationship.commonAncestor.name) && /common ancestor/.test(ref.claimedSource.en));
        }
      }
    }
  }
  assert(distant > 500, 'common ancestors exercised');
  // the vague variant that drops the relationship also drops the ancestor
  for (let seed = 0; seed < 300; seed++) {
    const v = N.generate({ scenario: 'johnDoe', referenceMode: 'distantKin', seed, vague: true });
    if (v.degraded[0].archetype === 'relationship-path-unstated') {
      const ref = v.references.find(x => v.degraded[0].field === 'references.' + x.id + '.claimedSource');
      assert(!/ancêtre commun/.test(ref.claimedSource.fr) && !/common ancestor/.test(ref.claimedSource.en), 'lineage withheld silently');
    }
  }
  // FNAEG dates: never in the future, offence before conviction
  const today = new Date(); today.setHours(23, 59, 59);
  const dmy = x => { const [dd, mm, yy] = x.split('/').map(Number); return new Date(yy, mm - 1, dd); };
  for (let i = 0; i < 1500; i++) {
    for (const type of ['suspect', 'condamne', 'trace']) {
      const d = R.generate(type);
      if (d.dateFaits) assert(dmy(d.dateFaits) <= today, type + ': offence date in the future ' + d.dateFaits);
      if (d.dateCondamnation) {
        assert(dmy(d.dateCondamnation) <= today, 'conviction date in the future');
        assert(dmy(d.dateFaits) < dmy(d.dateCondamnation), 'the offence must precede the conviction: ' + d.dateFaits + ' / ' + d.dateCondamnation);
      }
      if (d.autorite && d.autorite.date) assert(dmy(d.autorite.date) <= today, 'instruction date in the future');
    }
  }
  console.log('Requisitions: audit fixes (elision, named common ancestor, coherent FNAEG dates) verified.');
}

// ---- issue #80 owner decisions: one article, authority follows it, seal types follow it, dated letters ----
{
  const JUGE = ['80-4', '151'];
  const bodyTypes = new Set(['Prélèvement sur cadavre', 'Vêtement taché', 'Écouvillonnage de surface']);
  const missingTypes = new Set(['Trace biologique sur objet', 'Écouvillonnage de surface', 'Tache de sang séché', 'Vêtement taché']);
  const seenArticles = new Set(), seenTypes = new Set();
  for (let i = 0; i < 4000; i++) {
    const d = R.generate('trace');
    assert.equal(d.cadre.length, 1, 'exactly one legal-basis article per trace form');
    const a = d.cadre[0];
    seenArticles.add(a);
    assert.equal(d.autorite.kind, JUGE.includes(a) ? 'juge' : 'procureur', 'authority follows article ' + a);
    if (d.autorite.kind === 'juge') assert(d.autorite.date, 'the judge’s instruction is dated');
    for (const sc of d.scelles) {
      seenTypes.add(sc.type);
      if (a === '74') assert(bodyTypes.has(sc.type), 'art. 74 draws body-related seals: ' + sc.type);
      if (a === '74-1' || a === '80-4') assert(missingTypes.has(sc.type) && !/cadavre|Mégot/.test(sc.type), 'disappearance articles draw missing-person traces: ' + sc.type);
    }
  }
  assert.deepEqual([...seenArticles].sort(), ['151', '60', '74', '74-1', '77-1', '80-4'], 'all six articles occur');
  assert(seenTypes.has('Mégot de cigarette') && seenTypes.has('Prélèvement sur cadavre'), 'free articles still draw every type');
  // dated free-form letters
  const dateRe = /\b\d{2}\/\d{2}\/20(2[2-5])\b/;
  for (let seed = 0; seed < 400; seed++) {
    const j = N.generate({ scenario: 'johnDoe', seed }), a = N.generate({ scenario: 'sexualAssault', seed });
    assert(j.narrative.fr.includes('La découverte date du ' + j.eventDate) && j.narrative.en.includes('The discovery dates from ' + j.eventDate), 'discovery date stated');
    assert(a.narrative.fr.includes('Les faits allégués seraient survenus le ' + a.eventDate) && a.narrative.en.includes('occurred on ' + a.eventDate), 'date of the alleged events stated');
    assert(dateRe.test(j.eventDate) && dateRe.test(a.eventDate));
    for (const v of [N.generate({ scenario: 'johnDoe', seed, vague: true }), N.generate({ scenario: 'sexualAssault', seed, vague: true })]) {
      assert(v.narrative.fr.includes(v.eventDate), 'a vague request still states the date');
    }
  }
  console.log('Requisitions: trace-form legal coherence and dated letters (#80 decisions) verified.');
}

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
  const counts = { fnaeg: 0, narrative: 0, clean: 0, vague: 0, assault: 0, johnDoe: 0 };
  for (let i = 0; i < 320; i++) {
    events['gen:click']();
    const data = win.__lastReq;
    counts[data.type === 'narrative' ? 'narrative' : 'fnaeg']++;
    if (data.scenario === 'sexualAssault') counts.assault++;
    if (data.scenario === 'johnDoe') counts.johnDoe++;
    const q = data.quality;
    counts[q.vague ? 'vague' : 'clean']++;
    assert(!('sloppy' in q), 'no typo axis reaches the controller');
    assert(element('missing').classList.contains('hidden'), 'new case must hide the previous missing-information panel');
    // The button is the signal: visible exactly when something is missing.
    assert.equal(element('missingBtn').style.display, q.vague ? '' : 'none', 'missing-information button iff the case is vague');
    if (q.vague) {
      events['missingBtn:click'].call(element('missingBtn'));
      assert(!element('missing').classList.contains('hidden'), 'panel opens');
      assert.match(element('missingBody').innerHTML, /<li>/, 'missing items listed');
      events['missingBtn:click'].call(element('missingBtn'));
      assert(element('missing').classList.contains('hidden'), 'panel closes again');
    }
  }
  for (const [k, value] of Object.entries(counts)) assert(value >= 10, `${k} appears with the fully random draw`);
  // The free-form narrative renders as a letter: polite formulations, woven
  // scellés, the explicit question and the fictional watermark, in both languages. (#69)
  let guard = 0;
  while ((events['gen:click'](), win.__lastData.type !== 'narrative') && ++guard < 100);
  assert.equal(win.__lastData.type, 'narrative');
  const renderedFR = win.__lastDoc.texts.join(' \n ');
  assert.match(renderedFR, /DOCUMENT FICTIF/, 'watermark present on the fictional letter');
  assert.match(renderedFR, /Madame, Monsieur,/, 'letter salutation');
  assert.match(renderedFR, /Je vous fais parvenir, sous scellés, .*\bS1\b/, 'scellés woven into prose with their codes');
  assert.match(renderedFR, /Question posée :/, 'the question put to the laboratory is stated');
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
  assert.match(renderedEN, /Question put to you:/);
  assert.match(renderedEN, /Yours faithfully,/);
  currentLang = 'fr';
  events['gen:click']();
  assert(element('missing').classList.contains('hidden'), 'fresh case re-hides an opened panel');
  // ---- #80 point 4: every case reproducible from one case number, also from the page link ----
{
  for (const type of ['suspect', 'condamne', 'trace', 'disparu']) {
    for (let seed = 0; seed < 150; seed++) {
      const a = R.generate(type, { seed }), b = R.generate(type, { seed });
      assert.deepEqual(a, b, type + ': same seed, same form');
      assert.equal(a.seed, seed);
    }
    assert.notDeepEqual(R.generate(type, { seed: 1 }), R.generate(type, { seed: 2 }), type + ': different seeds differ');
    assert(Number.isInteger(R.generate(type).seed), 'an unseeded form still reports the seed it used');
  }
  assert.throws(() => R.generate('trace', { seed: -1 }));
  assert.throws(() => R.generate('trace', { seed: 4294967296 }));
  assert.throws(() => R.generate('trace', { seed: 1.5 }));

  const source = narrativeUI.match(/<script>([\s\S]*?)<\/script>/)[1];
  class Pdf { constructor() { this.texts = []; } saveGraphicsState() {} setFont() {} setFontSize() {} setTextColor() {} setFillColor() {} setDrawColor() {}
    rect() {} line() {} setLineWidth() {} addImage() {} addPage() {} text(v) { this.texts.push(v); } splitTextToSize(v) { return [String(v)]; } output() { return 'blob:mock'; } save() {} }
  function run(search) {
    const w = { REQUISITIONS: R, NARRATIVE_REQUISITIONS: N, location: { search, origin: 'http://x', pathname: '/requisitions.html' },
      history: { replaceState(a, b, url) { w.__url = url; } }, jspdf: { jsPDF: Pdf }, JsBarcode: () => {}, I18N: { getLang: () => 'fr' } };
    const els = {};
    const el = id => els[id] ||= { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
      classList: { add() {}, remove() {}, contains: () => true, toggle: () => true }, addEventListener() {} };
    const d = { getElementById: el, createElement: () => ({ toDataURL: () => 'data:image/png;base64,AAAA' }), addEventListener() {} };
    new Function('window', 'document', 'I18N', 'Math', 'URL', source)(w, d, w.I18N, Math, { revokeObjectURL() {} });
    return { w, els };
  }
  const kinds = new Set();
  for (let seed = 0; seed < 120; seed++) {
    const a = run('?seed=' + seed), b = run('?seed=' + seed);
    assert.equal(JSON.stringify(a.w.__lastData), JSON.stringify(b.w.__lastData), 'the same link reproduces the same case');
    assert.deepEqual(a.w.__lastDoc.texts, b.w.__lastDoc.texts, 'and the same PDF text');
    assert.equal(a.w.__lastData.seed, seed);
    assert.equal(a.w.__url, '?seed=' + seed, 'the case number is kept in the address bar');
    assert(a.els.caseNo.textContent.includes(String(seed)), 'the case number is shown');
    kinds.add(a.w.__lastData.type + ':' + a.w.__lastData.quality.vague);
  }
  assert(kinds.has('narrative:true') && kinds.has('narrative:false') && [...kinds].some(k => !k.startsWith('narrative')), 'seeds reach every kind of case: ' + [...kinds]);
  for (const bad of ['', '?seed=abc', '?seed=4294967296', '?seed=-3', '?other=1']) {
    const r = run(bad);
    assert(Number.isInteger(r.w.__lastData.seed), 'invalid or missing seed falls back to a random case: ' + bad);
  }
}
console.log('Requisitions UI: 320 fully random cases, missing-information button and a bilingual letter-format PDF smoke PASS', counts);
}
