import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWindowData, checkBilingual } from './load-window-data.mjs';
globalThis.REQUISITION_SHARED = loadWindowData('assets/data/requisition-shared.js', 'REQUISITION_SHARED');
globalThis.MCQ = loadWindowData('assets/data/mcq.js', 'MCQ');
const X = await import('../assets/exam/exam.js');
const R = await import('../assets/exam/render.js');
const D = await import('../assets/data/dossier.js');
const BANK = globalThis.MCQ, N = 300;

// --- the specification ---
assert.equal(X.SPEC.points, 20); assert.equal(X.SPEC.minutes, 30);
assert.equal(10 * X.SPEC.mcqEach + X.SPEC.e1.points + X.SPEC.e5.points, 20, 'points add up to 20');
assert.deepEqual(X.CHAPTERS, ['adn', 'genome', 'str', 'extraction', 'amplification', 'lecture', 'identification', 'marqueurs', 'parente', 'probabilites']);
assert.deepEqual([...new Set(BANK.map(q => q.topic))].sort(), [...X.CHAPTERS].sort(), 'the bank covers exactly the ten chapters');

// --- independent recomputation of the consensus key from the PRINTED table (different code path than exam.js) ---
function independentConsensus(cells) { // cells: printed strings of the four replicates for one locus
  const seen = {}; for (const c of cells) if (c !== '-') for (const a of c.split('/')) seen[a] = (seen[a] || 0) + 1;
  const alleles = Object.keys(seen).sort((a, b) => parseFloat(a) - parseFloat(b));
  const twice = alleles.filter(a => seen[a] >= 2), once = alleles.filter(a => seen[a] === 1);
  if (!alleles.length) return '-';
  if (twice.length === 1 && once.length === 0) return twice[0] + '/' + twice[0];
  return alleles.map(a => (seen[a] >= 2 ? a : '(' + a + ')')).join('/');
}

const kindsSeen = new Set(), templates = new Set(), variants = new Set(), mcqUsed = new Set(), unique = new Set();
for (let i = 0; i < N; i++) {
  const seed = 'self-' + i, e = X.makeExam(seed), again = X.makeExam(seed);
  assert.deepEqual(JSON.parse(JSON.stringify(e)), JSON.parse(JSON.stringify(again)), 'reproducible ' + seed);
  assert.equal(e.points, 20); assert(e.minutes <= X.SPEC.maxEstimate && e.minutes >= 15, 'time ' + e.minutes);
  // MCQ: one per chapter in course order, 4 choices, exactly one correct, key matches the bank, balanced letters, no duplicate stem
  assert.deepEqual(e.mcq.map(q => q.topic), X.CHAPTERS);
  assert.equal(new Set(e.mcq.map(q => q.q.fr)).size, 10, 'no duplicate stem');
  for (const q of e.mcq) {
    const src = BANK[q.id]; assert.equal(src.topic, q.topic); assert.equal(q.choices.length, 4);
    assert.equal(q.choices[q.correct].fr, src.answers.find(a => a.correct).text.fr, 'key points at the bank\'s correct answer');
    assert.equal(src.answers.filter(a => a.correct).length, 1);
    assert.deepEqual(q.choices.map(c => c.fr).sort(), src.answers.map(a => a.text.fr).sort(), 'the choices are the bank\'s choices, shuffled');
    assert.equal(checkBilingual({ q: q.q, c: q.choices }).bad.length, 0); mcqUsed.add(q.id);
  }
  const letters = X.LETTERS.map((_, k) => e.mcq.filter(q => q.correct === k).length);
  assert(letters.every(n => n >= 1 && n <= 4), 'balanced answer letters ' + letters);
  unique.add(e.mcq.map(q => q.id).join(','));

  // Exercise 1: consensus
  const c1 = e.exercises[0]; assert.equal(c1.type, 'consensus'); assert.equal(c1.rows.length, 4); assert.equal(c1.key.length, 6);
  assert.deepEqual(c1.loci, X.CONSENSUS_LOCI);
  c1.key.forEach((k, j) => {
    const cells = c1.rows.map(r => r.cells[j]);
    assert.equal(k.text, independentConsensus(cells), `${seed} ${k.locus}: key vs independent recomputation of ${cells.join(' | ')}`);
    for (const c of cells) assert(c === '-' || /^\d+(\.\d)?(\/\d+(\.\d)?)?$/.test(c), 'printed cell ' + c);
    assert(new Set(cells.flatMap(c => (c === '-' ? [] : c.split('/')))).size <= 2, 'at most two distinct alleles per locus'); kindsSeen.add(k.kind);
  });
  assert(c1.key.filter(k => k.kind === 'het').length >= 1 && c1.key.filter(k => k.kind === 'hom').length >= 1 && c1.key.some(k => k.kind === 'partial' || k.kind === 'uncertain'), 'a teachable table');
  assert(c1.key.filter(k => k.kind === 'none').length <= 1); assert.equal(c1.perLocus * 6 + c1.q2, c1.points);

  // Exercise 2: quote — rebuilt from its case seed, key checked against the exercise's own truth
  const q5 = e.exercises[1], c = D.makeDossier(q5.caseSeed, { template: q5.template, variant: q5.variant });
  templates.add(q5.template); variants.add(q5.variant);
  assert.equal(q5.needsInfo, c.needsInfo); assert.equal(q5.needsInfo, q5.variant === 'vague'); assert.deepEqual(q5.requisition, c.requisition);
  assert([1, 2, 3].includes(q5.lines.length) && q5.lines.length > 1, 'not a one-exhibit case'); assert(q5.template !== 'orientation');
  const need = Object.fromEntries(q5.lines.filter(l => l.need).map(l => [l.id, l.need]));
  assert.deepEqual(need, Object.fromEntries(Object.entries(c.need).filter(([, v]) => v)), 'key = the exercise truth');
  assert.deepEqual(D.checkQuote(c, need), [], 'the key itself draws no warning');
  assert.equal(q5.total, D.quoteTotal(need)); assert(q5.total > 0);
  assert.equal(q5.pointsAsk + q5.pointsPerLine * q5.lines.length, q5.points, 'points add up'); assert.equal(q5.pointsAsk + q5.pointsQuote, q5.points);
  q5.lines.forEach(l => assert.equal(l.differential, D.hasDifferential(c, l.id)));
  if (q5.needsInfo) assert(q5.clarification.fr.trim() && q5.clarification.en.trim());
}
assert.deepEqual([...kindsSeen].sort(), ['het', 'hom', 'none', 'partial', 'uncertain'].filter(k => kindsSeen.has(k)));
assert(['het', 'hom', 'partial'].every(k => kindsSeen.has(k)), 'all key kinds occur: ' + [...kindsSeen]);
assert.deepEqual([...templates].sort(), ['id-maternal-aunt', 'id-parent', 'id-uncle', 'sa-ejaculation', 'trace-suspect'], 'all quote templates occur');
assert.deepEqual([...variants].sort(), ['clear', 'vague']);
assert(unique.size > N * 0.97, 'versions differ: ' + unique.size + ' distinct MCQ sets in ' + N);
assert(mcqUsed.size >= BANK.length * 0.95, 'the exams cover the bank: ' + mcqUsed.size + '/' + BANK.length);

// --- rendering ---
const o = { letter: 'B', title: 'Test <b>x</b>', teacher: 'M. "X"', rules: '<script>alert(1)</script>' };
let withNotice = 0, withoutNotice = 0;
for (let i = 0; i < 120; i++) {
  const e = X.makeExam('self-' + i), snapshot = JSON.stringify(e);
  for (const lang of ['fr', 'en']) {
    const sheet = R.renderSheet(e, lang, o), key = R.renderKey(e, lang, o);
    assert.equal(JSON.stringify(e), snapshot, 'rendering does not mutate the exam');
    for (const html of [sheet, key]) { assert(!/undefined|NaN|\[object/.test(html), 'no leaked JS value'); assert(!/<script>|<b>x<\/b>/.test(html), 'user text is escaped'); }
    assert(sheet.includes('&lt;script&gt;') && sheet.includes('M. &quot;X&quot;'));
    assert(sheet.includes(e.seed) && sheet.includes('B') && key.includes(e.seed));
    // the student sheet never contains an answer
    assert(!/class="exam key"|corrig|Answer key|marking scheme|règle appliquée|rule applied|Réponse attendue|Expected answer|keyline/i.test(sheet), 'sheet leaks nothing from the key');
    assert((sheet.match(/class="box"/g) || []).length === 40, 'ten questions x four boxes');
    assert(!sheet.includes('class="answer"') || /<tr class="answer"><td class="l"><b>[^<]+<\/b><\/td>(<td><\/td>)+<\/tr>/.test(sheet), 'the consensus answer row is empty');
    // the key states the letters, the consensus and the total
    assert(key.includes(e.mcq.map((q, k) => `${k + 1}${X.LETTERS[q.correct]}`).join(' · ')));
    e.exercises[0].key.forEach(k => assert(key.includes('<b>' + k.text + '</b>')));
    assert(key.includes(e.exercises[1].total + ' €'));
    // differential notice: in the list when the case is clear, inside the requester's reply box when vague
    const q5 = e.exercises[1], hasDiff = q5.lines.some(l => l.differential), nTimes = sheet.split(tt(lang)).length - 1;
    if (lang === 'fr') hasDiff ? withNotice++ : withoutNotice++;
    assert.equal(nTimes, hasDiff ? (q5.needsInfo ? 1 : q5.lines.filter(l => l.differential).length) : 0, 'differential notice appears exactly where it should');
    if (q5.needsInfo) { const reply = sheet.slice(sheet.indexOf('class="reply"')); assert(reply.includes(q5.clarification[lang].replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')), 'the requester reply is printed in its box'); assert(sheet.indexOf('<b>a.</b>', sheet.indexOf('Exercice 2') > 0 ? sheet.indexOf(lang === 'fr' ? 'Exercice 2' : 'Exercise 2') : 0) < sheet.indexOf('class="reply"'), 'reply comes after question a'); }
    else assert(!sheet.includes('class="reply"'));
  }
}
function tt(lang) { return D.DIFFERENTIAL_NOTICE[lang].replaceAll('&', '&amp;'); }
assert(withNotice > 0 && withoutNotice > 0, 'both situations occur');

// --- wiring ---
const page = readFileSync(new URL('../examens.html', import.meta.url), 'utf8'), idx = readFileSync(new URL('../exercices.html', import.meta.url), 'utf8');
assert(page.indexOf('assets/data/mcq.js') > 0 && page.indexOf('assets/data/mcq.js') < page.indexOf('assets/exam-ui.js') && page.indexOf('requisition-shared.js') < page.indexOf('assets/exam-ui.js'), 'data scripts load before the module');
assert(/@page\s*\{\s*size:\s*A4/.test(page) && /data-print="sheets"/.test(page) && /data-print="keys"/.test(page) && /break-after:page/.test(page), 'A4 print stylesheet with two print modes');
assert(!/class="grid/.test(readFileSync(new URL('../assets/exam/render.js', import.meta.url), 'utf8')), 'does not reuse the site\'s card-grid class for tables');
assert(idx.includes('href="examens.html"'), 'linked from the exercises index');
console.log('exam self-test: OK (' + N + ' exams, ' + mcqUsed.size + '/' + BANK.length + ' MCQ used, ' + [...templates].length + ' quote templates)');
