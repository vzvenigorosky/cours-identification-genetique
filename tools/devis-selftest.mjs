import assert from 'node:assert/strict';
import { templates, makeCase, idealAnswer, grade, visibleScelles, expectedLine, analysisFor, relations,
  linePrice, quoteTotal, packages, addons, tariffs, clarityRules, weights } from '../assets/data/devis.js';

const bilingual = (o, where) => {
  assert(o && typeof o.fr === 'string' && typeof o.en === 'string', where + ': {fr,en} present');
  assert(o.en.trim() || !o.fr.trim(), where + ': EN missing');
  assert(o.fr.trim() || !o.en.trim(), where + ': FR missing');
};

// --- price grid and arithmetic (owner-defined, fictional values) ---
assert.deepEqual(Object.fromEntries(Object.entries(packages).map(([k, v]) => [k, v.price])), { ref: 70, tissue: 140, item: 200, diffMale: 200, diffBoth: 300 });
assert.equal(addons.y.price, 100); assert.equal(addons.mt.price, 600);
assert.equal(tariffs.gav.mult, 2); assert.equal(tariffs.urgence.mult, 1.5); assert.equal(tariffs.normal.mult, 1);
assert.equal(linePrice({ analyse: true, pkg: 'item', profiles: 2 }), 400, 'doubled trace = 2 x package');
assert.equal(linePrice({ analyse: true, pkg: 'tissue', profiles: 1, y: true }), 240);
assert.equal(linePrice({ analyse: true, pkg: 'ref', profiles: 1, mt: true }), 670);
assert.equal(linePrice({ analyse: false, pkg: 'item' }), 0);
assert.equal(quoteTotal({ a: { analyse: true, pkg: 'ref', profiles: 1 } }, 'gav'), 140);
assert.equal(quoteTotal({ a: { analyse: true, pkg: 'ref', profiles: 1 } }, 'urgence'), 105);

// --- kinship rule: autosomal only for parent/offspring and siblings ---
for (const r of ['self', 'parent', 'sibling']) assert.deepEqual(analysisFor(r), { feasible: true, y: false, mt: false }, r);
for (const r of ['paternalUncle', 'paternalGrandfather']) assert.deepEqual(analysisFor(r), { feasible: true, y: true, mt: false }, r);
for (const r of ['maternalAunt', 'maternalHalfSibling']) assert.deepEqual(analysisFor(r), { feasible: true, y: false, mt: true }, r);
for (const r of ['paternalHalfSister', 'adopted']) assert.equal(analysisFor(r).feasible, false, r);
assert.throws(() => analysisFor('nope'));
for (const r of Object.values(relations)) bilingual(r.label, 'relation label');

// --- clarity rules (owner-defined) ---
assert(clarityRules.identification({ relation: true }) && !clarityRules.identification({}));
assert(clarityRules.saSites({ allSamples: true }) && clarityRules.saSites({ listedSamples: true }) && !clarityRules.saSites({}));
assert(clarityRules.saEjaculation({ unknownAuthor: true }) && clarityRules.saEjaculation({ sperm: true }) && !clarityRules.saEjaculation({}));
assert(clarityRules.miscItems({ itemsLinked: true }) && !clarityRules.miscItems({}));

// --- expectedLine: package selection from material and sperm ---
const base = { relevant: true, trace: false, sperm: null };
assert.equal(expectedLine({ ...base, material: 'ref' }).pkg, 'ref');
assert.equal(expectedLine({ ...base, material: 'tissue' }).pkg, 'tissue');
assert.equal(expectedLine({ ...base, material: 'item', sperm: 'no' }).pkg, 'item');
assert.equal(expectedLine({ ...base, material: 'item', sperm: 'unknown' }).pkg, 'diffMale', 'possible sperm -> differential is legitimate');
assert.equal(expectedLine({ ...base, material: 'item', sperm: 'yes', wantsBoth: true }).pkg, 'diffBoth');
assert.equal(expectedLine({ ...base, material: 'ref', trace: true }).profiles.join(), '1,2');
assert.equal(expectedLine({ ...base, material: 'ref' }).profiles.join(), '1');
assert.equal(expectedLine({ ...base, material: 'ref', relevant: false }).analyse, false);

// --- every template, both variants, many seeds ---
const seen = new Set();
for (const t of templates) {
  for (const variant of t.variants) {
    for (let seed = 0; seed < 40; seed++) {
      const c = makeCase(seed, { template: t.id, variant });
      assert.deepEqual(c, makeCase(seed, { template: t.id, variant }), 'seed reproducibility');
      seen.add(c.template + ':' + c.variant);
      bilingual(c.requisition, t.id + ' requisition'); bilingual(c.clarification, t.id + ' clarification');
      for (const s of c.scelles.concat(c.corrected || [])) { bilingual(s.title, s.id); bilingual(s.nature, s.id); }
      assert.equal(new Set(c.scelles.map(s => s.id)).size, c.scelles.length, 'unique scellé ids');
      assert.equal(c.mustAsk, c.kind !== 'normal' ? true : c.needsInfo);
      if (c.kind === 'normal') assert.equal(c.needsInfo, variant === 'vague', `${t.id}: vague <=> needs info`);

      // ideal answer scores 100 (or full points for absurd cases)
      const ideal = idealAnswer(c);
      const g = grade(c, ideal);
      assert.equal(g.total, 100, `${t.id}/${variant}/${seed}: ideal answer must score 100, got ${g.total}`);
      assert.deepEqual(g.warnings, []);

      if (c.kind === 'normal') {
        // asking when clear / not asking when vague loses the info points but keeps the rest
        const wrongAsk = grade(c, { ...ideal, asked: !ideal.asked });
        assert(wrongAsk.total < 100 && wrongAsk.total >= 100 - Math.ceil(weights.info / (weights.info + weights.selection + weights.pkg + weights.profiles + weights.tariff) * 100), 'info mistake costs the info share and nothing else');
        assert.deepEqual(wrongAsk.warnings, [c.needsInfo ? 'shouldHaveAsked' : 'askedUnnecessarily']);
        // declining a valid request is wrong
        assert.equal(grade(c, { ...ideal, declined: true, lines: {} }).total, 0);
        // wrong tariff costs points
        const wt = grade(c, { ...ideal, tariff: c.deadline === 'normal' ? 'gav' : 'normal' });
        assert(wt.total < 100);
        // analysing everything is penalised when some scellés are irrelevant
        const every = Object.fromEntries(c.scelles.map(s => [s.id, { analyse: true, pkg: 'item', profiles: 1 }]));
        if (c.scelles.some(s => !s.relevant)) assert(grade(c, { ...ideal, lines: every }).total < 100);
        // doubled extraction on a trace is accepted, never penalised
        for (const s of c.scelles) if (ideal.lines[s.id].analyse && s.trace) {
          const dbl = { ...ideal, lines: { ...ideal.lines, [s.id]: { ...ideal.lines[s.id], profiles: 2 } } };
          assert.equal(grade(c, dbl).total, 100, `${t.id}: doubled trace must be accepted`);
        }
        // doubling a non-trace is over-ordering
        for (const s of c.scelles) if (ideal.lines[s.id].analyse && !s.trace) {
          const dbl = { ...ideal, lines: { ...ideal.lines, [s.id]: { ...ideal.lines[s.id], profiles: 2 } } };
          assert(grade(c, dbl).total < 100, `${t.id}: doubling a non-trace is penalised`);
        }
        // never ask, never analyse anything: scores low
        assert(grade(c, { asked: false, declined: false, tariff: c.deadline, lines: {} }).total < 60);
      }
    }
  }
}
assert(seen.size >= 16, 'all template variants exercised: ' + seen.size);

// --- archetype-specific truths ---
for (let seed = 0; seed < 30; seed++) {
  const uncle = makeCase(seed, { template: 'id-uncle', variant: 'vague' });
  const L = idealAnswer(uncle).lines;
  assert(L.u.y && !L.u.mt && L.r.y && !L.r.mt, 'paternal uncle needs Y-STR on both samples, no mtDNA');
  assert.equal(L.u.pkg, 'tissue'); assert.equal(L.r.pkg, 'ref');
  const aunt = idealAnswer(makeCase(seed, { template: 'id-maternal-aunt', variant: 'vague' })).lines;
  assert(aunt.u.mt && !aunt.u.y);
  const par = idealAnswer(makeCase(seed, { template: 'id-parent', variant: 'vague' })).lines;
  assert(!par.u.y && !par.u.mt, 'parent/offspring: autosomal only');
  // adding mtDNA when autosomal suffices is penalised
  const pc = makeCase(seed, { template: 'id-parent', variant: 'clear' });
  const pi = idealAnswer(pc);
  assert(grade(pc, { ...pi, lines: { ...pi.lines, u: { ...pi.lines.u, mt: true } } }).total < 100);
  // wrong lineage: mtDNA on a paternal-uncle case, or Y on an aunt case
  const uc = makeCase(seed, { template: 'id-uncle', variant: 'clear' }), ui = idealAnswer(uc);
  assert(grade(uc, { ...ui, lines: { u: { ...ui.lines.u, y: false, mt: true }, r: { ...ui.lines.r, y: false, mt: true } } }).total < 100);
  const ac = makeCase(seed, { template: 'id-maternal-aunt', variant: 'clear' }), ai = idealAnswer(ac);
  assert(grade(ac, { ...ai, lines: { u: { ...ai.lines.u, mt: false, y: true }, r: { ...ai.lines.r, mt: false, y: true } } }).total < 100);
  // sexual assault sites: vague truth = 4 relevant samples, 'all' = 14
  const vs = makeCase(seed, { template: 'sa-sites', variant: 'vague' });
  const rel = vs.scelles.filter(s => s.relevant);
  assert.deepEqual(rel.map(s => s.id).sort(), ['cou', 'poi', 'vag', 'vul']);
  const li = idealAnswer(vs).lines;
  assert.equal(li.vag.pkg, 'diffMale'); assert.equal(li.cou.pkg, 'ref');
  // misc flat: only linked items are accepted
  const mf = makeCase(seed, { template: 'misc-flat', variant: 'clear' });
  const ids = Object.entries(idealAnswer(mf).lines).filter(([, l]) => l.analyse).map(([id]) => id).sort();
  assert.deepEqual(ids, ['casq', 'corps', 'dent', 'peig', 'razo']);
  assert.equal(Object.values(idealAnswer(mf).lines).find(l => l.pkg === 'item').y, false, 'self belongings: autosomal only');
  // underwear: with possible sperm differential; with no ejaculation, plain item package
  const ue = makeCase(seed, { template: 'sa-ejaculation', variant: 'vague' });
  assert.equal(idealAnswer(ue).lines.slip.pkg, ue.scelles[0].sperm === 'no' ? 'item' : 'diffMale');
}

// --- absurd flow ---
for (let seed = 0; seed < 20; seed++) {
  for (const id of ['absurd-couch', 'absurd-adopted', 'absurd-half-sister']) {
    const c = makeCase(seed, { template: id });
    assert.equal(c.kind, 'absurdVoid'); assert(c.mustAsk);
    const asked = grade(c, { asked: true, declined: true, tariff: 'normal', lines: {} });
    assert.equal(asked.total, 100); assert.deepEqual(asked.warnings, []);
    const hasty = grade(c, { asked: false, declined: true, tariff: 'normal', lines: {} });
    assert.equal(hasty.total, 70, 'decision right, information step missed'); assert.deepEqual(hasty.warnings, ['shouldHaveAsked']);
    assert.equal(hasty.declineRight, true);
    // analysing after confirmation is wrong
    const quoted = grade(c, { asked: true, declined: false, tariff: 'normal', lines: { [c.scelles[0].id]: { analyse: true, pkg: 'ref', profiles: 1 } } });
    assert.equal(quoted.total, 30);
    assert.equal(grade(c, { asked: false, declined: false, tariff: 'normal', lines: {} }).total, 0);
  }
  const f = makeCase(seed, { template: 'absurd-blood' });
  assert.equal(f.kind, 'absurdFix');
  assert.deepEqual(visibleScelles(f, false).map(s => s.id), ['sang']);
  assert.deepEqual(visibleScelles(f, true).map(s => s.id), ['slip', 'vag'], 'client corrects the request');
  const ideal = idealAnswer(f);
  assert.equal(ideal.asked, true); assert.equal(grade(f, ideal).total, 100);
  assert.equal(grade(f, { ...ideal, declined: true, lines: {} }).total, 30, 'declining a corrected (valid) request is wrong');
  assert.equal(grade(f, { asked: false, declined: true, tariff: 'normal', lines: {} }).total, 0);
}

for (const s of ['ref', 'tissue', 'item', 'diffMale', 'diffBoth']) bilingual(packages[s].label, s);
console.log(`Devis: ${templates.length} templates, ${seen.size} variants, price grid, kinship, clarity and absurd-flow grading passed.`);
