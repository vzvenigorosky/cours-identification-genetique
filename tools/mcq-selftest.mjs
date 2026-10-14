// No dependencies: validate the data contract and exercise the actual inline quiz script.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('assets/data/mcq.js', root), 'utf8'), context);
const bank = context.window.MCQ;
const topics = ['adn', 'genome', 'str', 'extraction', 'amplification', 'lecture',
  'identification', 'marqueurs', 'parente', 'probabilites'];
assert.ok(bank.length >= 120, 'Keep the expanded bank available');
const stems = { fr: new Set(), en: new Set() };
function bilingual(value) {
  for (const lang of ['fr', 'en']) {
    assert.equal(typeof value[lang], 'string');
    assert.ok(value[lang].trim().length > 0, `Missing ${lang} translation`);
  }
}
for (const q of bank) {
  assert.ok(topics.includes(q.topic), `Unknown topic: ${q.topic}`);
  assert.equal(q.level, ['parente', 'probabilites'].includes(q.topic) ? 'm2' : 'm12');
  bilingual(q.q);
  assert.equal(q.answers.length, 4);
  assert.equal(q.answers.filter(a => a.correct === true).length, 1);
  for (const a of q.answers) {
    bilingual(a.text);
    assert.equal(typeof a.correct, 'boolean');
  }
  for (const lang of ['fr', 'en']) {
    const stem = q.q[lang].trim().toLowerCase();
    assert.ok(!stems[lang].has(stem), `Duplicate ${lang} stem: ${stem}`);
    stems[lang].add(stem);
    assert.equal(new Set(q.answers.map(a => a.text[lang].trim().toLowerCase())).size, 4,
      `Duplicate choices: ${q.q[lang]}`);
  }
}
for (const topic of topics) {
  assert.ok(bank.filter(q => q.topic === topic).length >= 11, `Insufficient coverage: ${topic}`);
}

// Independent checks of worked examples: catch answer-key/arithmetic mistakes.
function key(stemPart) {
  const matches = bank.filter(q => q.q.en.includes(stemPart));
  assert.equal(matches.length, 1, `Expected one question containing ${stemPart}`);
  return matches[0].answers.find(a => a.correct).text.en;
}
assert.equal(key('complementary strand of 5′-AGTC'), '5′-GACT-3′');
assert.ok(Math.abs(Number(key('pa = 0.10 and pb = 0.20')) - 2 * 0.1 * 0.2) < 1e-12);
assert.ok(Math.abs(Number(key('pa = 0.20.')) - 0.2 ** 2) < 1e-12);
assert.ok(Math.abs(Number(key('frequencies 0.02 and 0.05')) - 0.02 * 0.05) < 1e-12);
assert.equal(key('obligate paternal allele'), '14');
assert.equal(key('prior odds H1:H2 of 1:9'), '10:1');
assert.equal(key('IBD coefficients (k0, k1, k2) for full siblings'), '(1/4, 1/2, 1/4)');
assert.equal(key('IBD coefficients (k0, k1, k2) describe parent-child'), '(0, 1, 0)');

class Element {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.listeners = {};
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(n => this.classes.add(n)),
      remove: (...names) => names.forEach(n => this.classes.delete(n)),
      contains: n => this.classes.has(n),
      toggle: (n, on) => (on ?? !this.classes.has(n)) ? this.classes.add(n) : this.classes.delete(n)
    };
  }
  set className(value) { this.classes = new Set(value.split(/\s+/)); }
  get className() { return [...this.classes].join(' '); }
  set innerHTML(value) { this.html = value; this.children = []; }
  get innerHTML() { return this.html ?? ''; }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(event, listener) { (this.listeners[event] ??= []).push(listener); }
  fire(event) { for (const fn of this.listeners[event] ?? []) fn(); }
}
const html = fs.readFileSync(new URL('qcm.html', root), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const originalBank = JSON.stringify(bank);
let totalScenarios = 0;
for (const level of ['m1', 'm2']) {
  for (const count of [10, 15, 20]) {
    for (const language of ['fr', 'en']) {
      const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)]
        .map(m => [m[1], new Element()]));
      const doc = new Element();
      doc.getElementById = id => { assert.ok(elements[id], id); return elements[id]; };
      doc.createElement = tag => new Element(tag);
      doc.createTextNode = text => ({ textContent: text });
      elements.level.value = level;
      elements.count.value = String(count);
      elements.quiz.classList.add('hidden');
      let lang = language;
      let allowSubmit = false;
      let confirmations = 0;
      let seed = 12345 + totalScenarios;
      const math = Object.create(Math);
      math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
      const runtime = {
        MCQ: bank, document: doc, Math: math,
        I18N: { getLang: () => lang, pick: text => text[lang] },
        window: { scrollTo() {}, confirm() { confirmations++; return allowSubmit; } }
      };
      vm.runInNewContext(script, runtime);
      const pool = bank.filter(q => level === 'm2' || q.level === 'm12');
      assert.ok(elements.poolInfo.textContent.endsWith(String(pool.length)));
      elements.start.fire('click');
      assert.equal(elements.questions.children.length, count);
      assert.ok(elements.setup.classList.contains('hidden'));
      const selected = elements.questions.children.map(el => {
        const stem = el.children[0].textContent.replace(/^\d+\. /, '');
        const q = bank.find(q => q.q[lang] === stem);
        assert.ok(pool.includes(q), 'Question must belong to the selected level');
        return q;
      });
      assert.equal(new Set(selected).size, count, 'No repeated question in a quiz');
      assert.ok(elements.questions.children.some((el, i) =>
        el.children.slice(1).some((opt, j) => opt.children[1].textContent.trim() !== selected[i].answers[j].text[lang])),
      'Answer order must be shuffled');
      elements.submit.fire('click');
      assert.equal(confirmations, 1);
      assert.ok(!elements.questions.children[0].children[1].children[0].disabled,
        'Cancelling an incomplete submission must leave the quiz editable');
      // Choose correct, wrong and unanswered items to verify grading after a language switch.
      const picks = selected.map((q, i) => {
        if (i === count - 1) return null;
        const correct = i % 2 === 0;
        const text = q.answers.find(a => a.correct === correct).text[lang];
        const option = elements.questions.children[i].children.slice(1)
          .findIndex(opt => opt.children[1].textContent.trim() === text);
        elements.questions.children[i].children[option + 1].children[0].fire('change');
        return option;
      });
      assert.ok(elements.progress.textContent.startsWith(`${count - 1} / ${count}`));
      lang = lang === 'fr' ? 'en' : 'fr';
      doc.fire('langchange');
      elements.questions.children.forEach((el, i) => {
        assert.equal(el.children[0].textContent, `${i + 1}. ${selected[i].q[lang]}`);
        el.children.slice(1).forEach((opt, j) => assert.equal(opt.children[0].checked, picks[i] === j));
      });
      allowSubmit = true;
      elements.submit2.fire('click');
      const correctCount = picks.filter((p, i) => p !== null && i % 2 === 0).length;
      assert.ok(elements.result.innerHTML.includes(`${correctCount} / ${count} (${Math.round(correctCount / count * 100)}%)`));
      elements.questions.children.forEach((el, i) => {
        const options = el.children.slice(1);
        assert.equal(options.filter(o => o.classList.contains('correct')).length, 1);
        assert.equal(options.filter(o => o.classList.contains('incorrect')).length,
          picks[i] !== null && i % 2 === 1 ? 1 : 0);
        assert.ok(options.every(o => o.children[0].disabled));
      });
      elements.restart2.fire('click');
      assert.ok(elements.quiz.classList.contains('hidden'));
      assert.ok(!elements.setup.classList.contains('hidden'));
      elements.start.fire('click');
      assert.ok(elements.progress.textContent.startsWith(`0 / ${count}`));
      assert.equal(JSON.stringify(bank), originalBank, 'Quiz must not mutate the question bank');
      totalScenarios++;
    }
  }
}
console.log(`MCQ self-test passed: ${bank.length} bilingual questions; ${totalScenarios} quiz scenarios.`);
