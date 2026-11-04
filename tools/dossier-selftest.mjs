import assert from 'node:assert/strict';
import { loadWindowData, checkBilingual } from './load-window-data.mjs';
globalThis.REQUISITION_SHARED = loadWindowData('assets/data/requisition-shared.js', 'REQUISITION_SHARED');
const D = await import('../assets/data/dossier.js');

// --- packages: contents and prices as specified by the maintainer ---
const P = D.PACKAGES;
assert.deepEqual(Object.fromEntries(D.PACKAGE_ORDER.map(k => [k, P[k].price])), { trace: 100, ref: 50, traceY: 100, refY: 50, traceMt: 600, refMt: 400, orient: 400 });
assert.deepEqual(D.PACKAGE_ORDER.map(k => [P[k].extractions, P[k].quantifications, P[k].slots.join('+')]), [
  [2, 2, 'auto+auto'], [1, 1, 'auto'], [2, 2, 'auto+auto+y'], [1, 1, 'auto+y'], [2, 2, 'auto+mt'], [1, 1, 'auto+mt'], [2, 2, 'ngs']]);
assert.equal(D.quoteTotal({ a: 'trace', b: 'refMt', c: 'x' }), 500);
assert.deepEqual(D.extractionBudget({ a: 'trace', b: 'ref' }), { a: 2, b: 1 });
assert.equal(checkBilingual(P).bad.length, 0);
for (const k of ['traceY', 'refY', 'traceMt', 'refMt']) assert(/autosomaux/.test(P[k].label.fr) && /autosomal/.test(P[k].label.en), k + ' name says the autosomal STR is included (#88)');
for (const k of ['trace', 'ref', 'orient']) assert(!/autosom/.test(P[k].label.fr), k + ' keeps its plain name');

// --- every template x variant x seeds: bilingual, deterministic, ideal path is warning-free ---
const ideal = c => Object.fromEntries(Object.entries(c.need).filter(([, v]) => v));
function play(c, q, pickSite = s => s.find(x => x.role === 'target').id) {
  const b = D.extractionBudget(q), sampling = {}, ex = [];
  for (const s of c.scelles) if (b[s.id]) { sampling[s.id] = Array(b[s.id]).fill(pickSite(c.sites[s.id])); sampling[s.id].forEach((site, k) => ex.push(D.doExtraction(c, s.id, site, k))); }
  const slots = D.analysisSlots(c, q), assign = {};
  for (const sl of slots) { const m = ex.filter(e => e.scelleId === sl.scelleId); assign[sl.key] = m.sort((a, b2) => b2[sl.kind === 'y' ? 'male' : 'conc'] - a[sl.kind === 'y' ? 'male' : 'conc'])[0].id; }
  const results = slots.map(sl => { const r = D.runSlot(c, sl, ex.find(e => e.id === assign[sl.key])); r.id = sl.key; return r; });
  return { sampling, ex, slots, assign, results };
}
const FORBIDDEN = /coupable|innocent|guilty|prouve|proves|certitude|certain(e)? que|est bien l[ea]|is the (father|mother|victim|perpetrator)/i;
const seen = new Set();
for (const t of D.TEMPLATES) for (const variant of ['vague', 'clear']) for (let seed = 1; seed <= 25; seed++) {
  const c = D.makeDossier(seed, { template: t, variant }), again = D.makeDossier(seed, { template: t, variant });
  assert.deepEqual(JSON.parse(JSON.stringify(c)), JSON.parse(JSON.stringify(again)), t + ' reproducible');
  assert.equal(checkBilingual({ r: c.requisition, c: c.clarification, s: c.scelles.map(s => [s.title, s.nature]), x: Object.values(c.reasons) }).bad.length, 0, t + ' bilingual');
  assert.equal(c.needsInfo, variant === 'vague', t + ' ' + variant + ' needsInfo');
  const doeKey = { 'id-parent': 'unk', 'id-uncle': 'unk', 'id-maternal-aunt': 'unk', 'misc-flat': 'body' }[t];
  if (doeKey) { // the sex of the unidentified person is stated from the start and matches the truth (#87)
    const man = c.persons[doeKey].sex === 'M';
    assert(man ? /un homme non identifié/.test(c.requisition.fr) && /unidentified man/.test(c.requisition.en) : /une femme non identifiée/.test(c.requisition.fr) && /unidentified woman/.test(c.requisition.en), t + ' states the sex');
    if (t === 'id-uncle') assert(man, 'paternal-uncle case is a man');
  } else assert(!/non identifié/.test(c.requisition.fr), t + ' has no unidentified remains');
  assert(!/garde à vue|police custody|une semaine|one week/i.test(c.requisition.fr + c.requisition.en), 'no tariff text');
  const q = ideal(c);
  assert(Object.keys(q).length > 0);
  assert.deepEqual(D.checkQuote(c, q), [], t + ' ideal quote has no warning');
  const p = play(c, q);
  assert.deepEqual(D.checkSampling(c, q, p.sampling), [], t + ' ideal sampling has no warning');
  assert.equal(D.checkAnalysis(c, q, p.ex, p.assign).filter(w => w.level === 'warn' && w.id !== 'veryLow' && w.id !== 'noMale').length, 0, t + ' ideal analysis');
  for (const r of p.results) { seen.add(r.kind); if (r.kind === 'auto') assert(r.complete >= 0 && r.complete <= 21); }
  const rv = D.buildReveal(c, { results: p.results });
  assert(rv.items.length > 0, t + ' reveal not empty');
  for (const it of rv.items) for (const para of [...it.yours, ...it.complete]) { assert(para.fr && para.en); assert(!FORBIDDEN.test(para.fr + ' ' + para.en), 'assertive wording: ' + para.fr); }
}
assert.deepEqual([...seen].sort(), ['auto', 'mt', 'ngs', 'y']);

// --- quote warnings ---
{
  const c = D.makeDossier(7, { template: 'id-uncle', variant: 'clear' }), ids = c.scelles.map(s => s.id);
  const ids_ = w => w.map(x => x.id);
  assert.deepEqual(ids_(D.checkQuote(c, {})), ['missing', 'missing'], 'nothing quoted: not enough');
  assert(ids_(D.checkQuote(c, { [ids[0]]: 'refY' })).includes('missing'));
  assert.deepEqual(ids_(D.checkQuote(c, { [ids[0]]: 'trace', [ids[1]]: 'refY' })), ['lineageMissing']);
  assert.deepEqual(ids_(D.checkQuote(c, { [ids[0]]: 'refY', [ids[1]]: 'refY' })), ['traceNeedsTwo'], 'a muscle fragment quoted as Référence is warned (#86)');
  assert.deepEqual(ids_(D.checkQuote(c, { [ids[0]]: 'traceMt', [ids[1]]: 'refY' })), ['wrongLineage']);
  assert.deepEqual(ids_(D.checkQuote(c, { [ids[0]]: 'traceY', [ids[1]]: 'traceY' })), ['refNeedsOne']);
  assert.deepEqual(c.need, { [ids[0]]: 'traceY', [ids[1]]: 'refY' }, 'muscle = Trace-Y, reference swab = Référence-Y (#86)');
  assert.deepEqual(ids_(D.checkQuote(c, { [ids[0]]: 'orient', [ids[1]]: 'refY' })), ['wrongOrient']);
  const pc = D.makeDossier(7, { template: 'id-parent', variant: 'clear' });
  assert.deepEqual(pc.need, { u: 'trace', r: 'ref' });
  assert(ids_(D.checkQuote(pc, { u: 'traceY', r: 'refY' })).every(i => i === 'lineageNotNeeded'));
  const ts = D.makeDossier(3, { template: 'trace-suspect', variant: 'clear' }), tq = ideal(ts), tid = ts.scelles[0].id;
  assert.deepEqual(D.checkQuote(ts, { ...tq, [tid]: 'ref' }).map(w => w.id), ['traceNeedsTwo']);
  assert.deepEqual(D.checkQuote(ts, { ...tq, extra: 'trace' }).length, 0, 'unknown id ignored');
  const sa = D.makeDossier(11, { template: 'sa-ejaculation', variant: 'clear' });
  const noVictim = [...Array(60).keys()].map(i => D.makeDossier(i + 1, { template: 'sa-ejaculation', variant: 'clear' })).find(x => !x.need.refv);
  assert(noVictim, 'some cases do not request the victim profile');
  assert.deepEqual(D.checkQuote(noVictim, { ...ideal(noVictim), refv: 'ref' }).map(w => w.id), ['overboard']);
  void sa;
}

// --- sampling warnings ---
{
  const c = D.makeDossier(5, { template: 'sa-ejaculation', variant: 'clear' }), q = ideal(c);
  const mk = arr => ({ slip: arr, refv: ['main'] });
  assert.deepEqual(D.checkSampling(c, q, mk(['stain', 'stain'])).map(w => w.id).filter(i => i !== 'unused'), []);
  assert(D.checkSampling(c, q, mk(['stain', 'outer'])).some(w => w.id === 'blank'));
  assert(D.checkSampling(c, q, mk(['stain', 'band'])).some(w => w.id === 'secondary'));
  assert(D.checkSampling(c, q, mk(['band', 'band'])).some(w => w.id === 'noTarget'));
  const un = D.checkSampling(c, q, mk(['stain']));
  assert(un.some(w => w.id === 'unused' && w.level === 'info'));
  assert(D.checkSampling(c, q, mk([])).some(w => w.id === 'none'));
}

// --- extraction, quantification and analyses ---
{
  const c = D.makeDossier(9, { template: 'sa-ejaculation', variant: 'clear' });
  const a = D.doExtraction(c, 'slip', 'stain', 0), b = D.doExtraction(c, 'slip', 'stain', 1);
  assert.deepEqual(a, D.doExtraction(c, 'slip', 'stain', 0), 'extraction reproducible');
  assert.notEqual(a.conc, b.conc, 'replicate extractions differ');
  assert(D.doExtraction(c, 'slip', 'outer', 0).conc <= 0.003, 'blank area has no DNA');
  const blank = D.runSlot(c, { key: 'k', scelleId: 'slip', kind: 'auto' }, D.doExtraction(c, 'slip', 'outer', 0));
  assert.equal(blank.complete, 0);
  assert.equal(c.persons.victim.sex === 'F' ? D.doExtraction(c, 'refv', 'main', 0).male : 0, 0, 'female source: no male DNA');
  // low template is worse than high template, on average
  const mean = conc => { let s = 0; for (let i = 0; i < 40; i++) s += D.runSlot(c, { key: 'k' + i, scelleId: 'refv', kind: 'auto' }, { id: 'x' + i, source: 'victim', conc, male: 0, mt: 1, di: 2 }).complete; return s / 40; };
  assert(mean(0.002) < 15 && mean(1.0) > 17);
  // two analyses of one extract are independent replicates
  const e = { id: 'z', source: 'victim', conc: 0.002, male: 0, mt: 1, di: 3 };
  const r1 = D.runSlot(c, { key: 'a:auto:1', scelleId: 'refv', kind: 'auto' }, e), r2 = D.runSlot(c, { key: 'a:auto:2', scelleId: 'refv', kind: 'auto' }, e);
  assert.notDeepEqual(r1.loci, r2.loci);
  // analysis warnings
  const q = { slip: 'trace', refv: 'ref' }, ex = [a, b, D.doExtraction(c, 'refv', 'main', 0)], slots = D.analysisSlots(c, q);
  assert.deepEqual(slots.map(s => s.key), ['slip:auto:1', 'slip:auto:2', 'refv:auto:1']);
  const none = D.checkAnalysis(c, q, ex, {}).map(w => w.id);
  assert.deepEqual(none, ['unassigned', 'unassigned', 'unassigned']);
  assert(D.checkAnalysis(c, q, [], {}).some(w => w.id === 'noExtract'));
  const low = { ...a, id: 'L', conc: 0.001 }, hi = { ...a, id: 'H', conc: 0.5 };
  assert(D.checkAnalysis(c, { slip: 'trace' }, [low, hi], { 'slip:auto:1': 'L', 'slip:auto:2': 'H' }).some(w => w.id === 'veryLow'));
  assert(D.checkAnalysis(c, { slip: 'trace' }, [{ ...a, id: 'M', conc: 0.01 }, hi], { 'slip:auto:1': 'M', 'slip:auto:2': 'H' }).some(w => w.id === 'betterExists'));
  assert(D.checkAnalysis(c, { slip: 'trace' }, [hi, { ...hi, id: 'H2' }], { 'slip:auto:1': 'H', 'slip:auto:2': 'H' }).some(w => w.id === 'sameExtract'));
}

// --- statistics ---
{
  const kit = (await import('../assets/epg/panels.js')).getKit('globalfiler');
  const L1 = kit.loci.find(l => l.name === 'TH01');
  const mkProf = g => ({ loci: Object.fromEntries(kit.loci.filter(l => !l.type).map(l => [l.name, l.name === 'TH01' ? { alleles: g, reliable: true } : { alleles: [], reliable: false }])), sex: null });
  // sibling LR for AB/AB equals (1 + pA + pB + 2 pA pB) / (8 pA pB) (up to the mutation allowance)
  const m = (await import('../assets/epg/frequencies.js')).alleleFrequencies(L1), pA = m.get(8), pB = m.get(9.3);
  const r = D.compareProfiles(mkProf([8, 9.3]), mkProf([8, 9.3]));
  const expected = (1 + pA + pB + 2 * pA * pB) / (8 * pA * pB), mu = 0.002;
  assert(Math.abs(r.hyp.FS.lr - expected) / expected < 1e-9, 'FS LR matches the closed form (no mutation allowance)');
  assert(Math.abs(r.hyp.same.lr - ((1 - mu) / (2 * pA * pB) + mu)) / r.hyp.same.lr < 1e-9, 'identity LR = 1/P(genotype)');
  assert.equal(r.identical, 1); assert.equal(r.lociCompared, 1);
  assert.equal(D.compareProfiles(mkProf([5, 5]), mkProf([8, 8])).noShared, 1);
  { // an allelic exclusion makes PO exactly zero (#97); the other levels stay possible
    const x = D.compareProfiles(mkProf([5, 5]), mkProf([8, 8]));
    assert.equal(x.hyp.PO.lr, 0); assert.equal(x.post.PO, 0); assert.equal(x.hyp.PO.excluded, true);
    assert(x.hyp.FS.lr > 0 && x.hyp.HSAVGC.lr > 0 && x.post.unrelated > 0);
    assert.deepEqual(Object.keys(D.KIN_LEVELS), ['PO', 'FS', 'HSAVGC'], 'kinship levels (#95)');
    assert.deepEqual(Object.values(D.KIN_LEVELS).map(l => l.code), ['PO', 'FS', 'HS/AV/GC']);
    assert(!('same' in D.KIN_LEVELS), 'no same-person row among the kinship levels');
    const ok = D.compareProfiles(mkProf([8, 9.3]), mkProf([8, 9.3]));
    assert.equal(ok.hyp.PO.excluded, false); assert(ok.hyp.PO.lr > 0);
  }
  // posterior probabilities (#96): equal priors, sum to 1, = LR share
  {
    const hyp = { PO: { lr: 3 }, FS: { lr: 1 }, HSAVGC: { lr: 0.5 } }, post = D.posteriors(hyp);
    assert(Math.abs(Object.values(post).reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert(Math.abs(post.PO - 3 / 5.5) < 1e-12 && Math.abs(post.unrelated - 1 / 5.5) < 1e-12);
    assert.deepEqual(D.KIN_PRIORS, { PO: 0.25, FS: 0.25, HSAVGC: 0.25, unrelated: 0.25 });
    assert(Math.abs(D.posteriors({ PO: { lr: 3 }, FS: { lr: 1 }, HSAVGC: { lr: 0.5 } }, { PO: 0.1, FS: 0.1, HSAVGC: 0.1, unrelated: 0.7 }).unrelated - 0.7 / (0.7 + 0.3 + 0.1 + 0.05)) < 1e-12, 'other priors change the posteriors');
    assert.equal(D.posteriors({ PO: { lr: 0 }, FS: { lr: 2 }, HSAVGC: { lr: 2 } }).PO, 0);
    assert.equal(D.fmtPct(0, 'fr'), '0 %'); assert.equal(D.fmtPct(0.4567, 'fr'), '45,7 %'); assert.equal(D.fmtPct(0.4567, 'en'), '45.7 %'); assert.equal(D.fmtPct(0.0001, 'en'), '< 0.1 %');
  }
  assert.equal(D.compareProfiles(mkProf([8, 9.3]), { loci: { ...mkProf([8]).loci, TH01: { alleles: [8], reliable: false } } }).compatible, 1, 'partial locus is compatible with drop-out');
  // random match: p^2 and 2pq
  assert(Math.abs(D.randomMatch(mkProf([8, 8])).rmp - pA * pA) < 1e-12);
  assert(Math.abs(D.randomMatch(mkProf([8, 9.3])).rmp - 2 * pA * pB) < 1e-12);
  // consensus: built by the student from calls, never automatic (#92)
  assert.equal(D.consensusOf, undefined, 'no automatic consensus is exported');
  const A = mkProf([8, 9.3]), B = mkProf([8]); B.loci.TH01.reliable = false;
  assert.deepEqual(D.observedAlleles([A, B], 'TH01'), [8, 9.3]);
  assert.deepEqual(D.observedAlleles([A, B], 'vWA'), []);
  const empty = D.profileFromCalls({ derived: 'consensus' }, {});
  assert.equal(empty.complete, 0); assert.equal(empty.pct, 0);
  const built = D.profileFromCalls({ derived: 'consensus', id: 'C1' }, { TH01: [8, 9.3] });
  assert.deepEqual(built.loci.TH01, { alleles: [8, 9.3], reliable: true }); assert.equal(built.complete, 1); assert.equal(built.id, 'C1');
  assert.deepEqual(D.profileFromCalls({}, { TH01: [8, 8] }).loci.TH01, { alleles: [8], reliable: true }, 'same allele twice = homozygote');
  assert.deepEqual(D.profileFromCalls({}, { TH01: [8, ''] }).loci.TH01, { alleles: [8], reliable: false }, 'one allele = partial');
  assert.deepEqual(D.profileFromCalls({}, { TH01: ['', 9.3] }).loci.TH01, { alleles: [9.3], reliable: false });
  assert.equal(D.profileFromCalls({}, { TH01: ['', ''] }).complete, 0);
  assert.equal(D.compareProfiles(built, A).identical, 1, 'a student-built column is used like any profile');
  // hints (amber, ungraded)
  const hint = (calls, reps) => D.checkConsensus({ TH01: calls }, reps).filter(h => h.locus === 'TH01').map(h => h.id);
  assert.deepEqual(hint([8, 9.3], [A, A]), [], 'reproduced heterozygote: no hint');
  assert.deepEqual(hint([8, 9.3], [A, B]), ['single'], 'allele 9.3 seen once');
  assert.deepEqual(hint([8, ''], [A, A]), ['omitted'], 'reproduced allele left out');
  assert.deepEqual(hint(['', ''], [A, A]), ['empty']);
  const H = mkProf([8]); H.loci.TH01.reliable = true;
  assert.deepEqual(hint([8, 8], [H, H]), [], 'tall reproduced single peak: homozygote supported');
  assert.deepEqual(hint([8, 8], [B, B]), ['homWeak'], 'low single peak: drop-out not excluded');
  assert.deepEqual(hint([8, 8], [A, A]), ['omitted', 'homConflict'], 'other alleles seen: reproduced allele left out and not a homozygote');
  assert.deepEqual(D.checkConsensus({}, [A]), [], 'a single replicate gives no hints');
  assert(D.checkConsensus({ TH01: [8, 9.3] }, [A, A]).every(h => h.locus !== 'TH01'));
  assert(D.checkConsensus({ TH01: [8, 9.3] }, [A, A]).every(h => h.text.fr && h.text.en));
  // haplotypes
  assert.deepEqual(D.compareHaplotypes({ kind: 'y', values: { a: '1', b: '2' } }, { kind: 'y', values: { a: '1', b: '3', c: '4' } }), { compared: 2, differences: 1, differing: ['b'], total: 25, identical: false });
  assert.equal(D.compareHaplotypes({ kind: 'y', values: {} }, { kind: 'mt', values: {} }), null);
  assert(D.lrWord(5000).fav && !D.lrWord(0.001).fav);
}

// --- lineage truth: the right marker really discriminates ---
{
  let yMatch = 0, mtMatch = 0, yOther = 0, n = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const u = D.makeDossier(seed, { template: 'id-uncle', variant: 'clear' }), a = D.makeDossier(seed, { template: 'id-maternal-aunt', variant: 'clear' });
    const yh = (c, id) => D.truthY(c.persons[id]), mt = (c, id) => D.truthMt(c.persons[id]);
    if (D.compareHaplotypes(yh(u, 'unk'), yh(u, 'rel')).differences <= 2) yMatch++;
    if (D.compareHaplotypes(mt(a, 'unk'), mt(a, 'rel')).differences === 0) mtMatch++;
    const other = D.makeDossier(seed + 1000, { template: 'id-uncle', variant: 'clear' });
    if (D.compareHaplotypes(yh(u, 'unk'), yh(other, 'rel')).differences > 2) yOther++;
    n++;
  }
  assert.equal(yMatch, n, 'uncle and nephew share the Y haplotype (up to rare mutations)');
  assert.equal(mtMatch, n, 'maternal aunt and nephew share the mtDNA haplotype');
  assert(yOther >= n - 2, 'unrelated men differ at the Y haplotype');
  // autosomal parent-child: Mendelian consistency
  for (let seed = 1; seed <= 30; seed++) {
    const c = D.makeDossier(seed, { template: 'id-parent', variant: 'clear' });
    assert.equal(D.compareProfiles(D.truthAuto(c.persons.unk), D.truthAuto(c.persons.rel)).noShared, 0, 'parent and child share an allele at every locus');
  }
}

// --- kinship cases: exclusions where the pair is not PO, none where it is (#97) ---
{
  for (let seed = 1; seed <= 60; seed++) {
    const par = D.makeDossier(seed, { template: 'id-parent', variant: 'clear' }), rp = D.compareProfiles(D.truthAuto(par.persons.unk), D.truthAuto(par.persons.rel));
    assert.equal(rp.noShared, 0); assert(rp.hyp.PO.lr > 1); assert(rp.post.PO > rp.post.FS && rp.post.PO > rp.post.HSAVGC && rp.post.PO > rp.post.unrelated);
    for (const t of ['id-uncle', 'id-maternal-aunt']) {
      const u = D.makeDossier(seed, { template: t, variant: 'clear' }), r = D.compareProfiles(D.truthAuto(u.persons.unk), D.truthAuto(u.persons.rel));
      assert(r.noShared >= 1, t + ' shows allelic exclusions'); assert.equal(r.hyp.PO.lr, 0); assert.equal(r.post.PO, 0);
      const txt = D.buildReveal(u, { results: [] }).items[0].complete.map(p => p.fr + ' ' + p.en).join(' ');
      assert(/PO/.test(txt) && /FS/.test(txt) && /HS\/AV\/GC/.test(txt) && /a posteriori/.test(txt) && /posterior/.test(txt), 'reveal lists the three levels with LR and posterior');
      assert(/PO est exclu|PO is excluded/.test(txt));
    }
  }
  const pr = D.buildReveal(D.makeDossier(3, { template: 'id-parent', variant: 'clear' }), { results: [] }).items[0].complete.map(p => p.fr).join(' ');
  assert(/PO : LR/.test(pr) && /FS : LR/.test(pr) && /HS\/AV\/GC : LR/.test(pr) && /non apparentés : /.test(pr) && /Aucune exclusion allélique/.test(pr));
}

// --- trace-suspect / identity: truth agrees with the reveal ---
{
  let same = 0, diff = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const c = D.makeDossier(seed, { template: 'trace-suspect', variant: 'clear' });
    const r = D.buildReveal(c, { results: [] });
    for (const cmp of c.comparisons) { const tr = c.sites[cmp.a].find(s => s.role === 'target').source; (c.persons[tr] === c.persons.suspect ? same++ : diff++); }
    assert(r.items.every(i => i.yours[0].fr.includes('disponible')), 'with no result the reveal says what is missing');
    for (const it of r.items) assert(/identiques|diffèrent|ne correspondent/.test(it.complete.map(p => p.fr).join(' ')));
  }
  assert(same > 20 && diff > 10, 'both outcomes occur');
}

// --- NGS ---
{
  const c = D.makeDossier(4, { template: 'orientation', variant: 'clear' });
  const ok = D.runSlot(c, { key: 'o', scelleId: c.scelles[0].id, kind: 'ngs' }, { id: 'x', source: 'unk', conc: 0.5, male: 0, mt: 1, di: 1 });
  assert(ok.interpretable); assert(Math.abs(ok.ancestry.reduce((s, x) => s + x.pct, 0) - 100) < 0.5);
  for (const t of Object.keys(D.PHENO)) assert(Math.abs(ok.pheno[t].reduce((s, x) => s + x.pct, 0) - 100) < 0.5);
  assert(!D.runSlot(c, { key: 'o', scelleId: c.scelles[0].id, kind: 'ngs' }, { id: 'x', source: null, conc: 0.0005, male: 0, mt: 1, di: 1 }).interpretable);
}
console.log('dossier self-test: OK');
