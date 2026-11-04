import { makeExam } from './exam/exam.js';
import { renderSheet, renderKey } from './exam/render.js';

const $ = id => document.getElementById(id);
const lang = () => window.I18N.getLang();
const L = (fr, en) => lang() === 'en' ? en : fr;
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const track = name => { if (window.Analytics) window.Analytics.event(name); };

let exams = [];
function randomSeed() { return String(Math.floor(Math.random() * 900000) + 100000); }

function build() {
  const base = ($('seed').value || '').trim() || randomSeed();
  $('seed').value = base;
  const n = Math.max(1, Math.min(26, parseInt($('n').value, 10) || 1));
  $('n').value = n;
  exams = Array.from({ length: n }, (_, i) => ({ letter: LETTERS[i], exam: makeExam(base + '-' + LETTERS[i]) }));
  try { const u = new URL(location.href); u.searchParams.set('seed', base); u.searchParams.set('n', n); history.replaceState(null, '', u); } catch (e) { /* no history */ }
  render();
}
function render() {
  if (!exams.length) return;
  const o = { title: $('title').value.trim(), teacher: $('teacher').value.trim(), rules: $('rules').value.trim() };
  const lg = lang();
  $('sheets').innerHTML = `<h2 class="group">${esc(L('Sujets', 'Papers'))}</h2>` + exams.map(x => renderSheet(x.exam, lg, { ...o, letter: x.letter })).join('');
  $('keys').innerHTML = `<h2 class="group">${esc(L('Corrigés et barèmes', 'Answer keys and marking schemes'))}</h2>` + exams.map(x => renderKey(x.exam, lg, { ...o, letter: x.letter })).join('');
  $('summary').innerHTML = `<table><thead><tr><th>${esc(L('Version', 'Version'))}</th><th>${esc(L('Graine', 'Seed'))}</th><th>${esc(L('Exercice 2', 'Exercise 2'))}</th><th>${esc(L('Durée estimée', 'Estimated time'))}</th><th>${esc(L('Points', 'Points'))}</th></tr></thead><tbody>` +
    exams.map(x => `<tr><td>${x.letter}</td><td>${esc(x.exam.seed)}</td><td>${esc(x.exam.exercises[1].template)} (${x.exam.exercises[1].needsInfo ? esc(L('vague', 'vague')) : esc(L('claire', 'clear'))})</td><td>≈ ${Math.round(x.exam.minutes)} min</td><td>${x.exam.points}</td></tr>`).join('') + '</tbody></table>';
}
function printMode(mode) {
  if (!exams.length) build();
  track('exam/print-' + mode);
  document.body.dataset.print = mode;
  const done = () => { delete document.body.dataset.print; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
}

$('gen').addEventListener('click', () => { track('exam/generate'); build(); });
$('rand').addEventListener('click', () => { $('seed').value = randomSeed(); build(); });
$('printSheets').addEventListener('click', () => printMode('sheets'));
$('printKeys').addEventListener('click', () => printMode('keys'));
['title', 'teacher', 'rules'].forEach(id => $(id).addEventListener('input', render));
document.addEventListener('langchange', render);

const qp = new URLSearchParams(location.search);
if (qp.get('seed')) $('seed').value = qp.get('seed').slice(0, 30);
if (qp.get('n')) $('n').value = qp.get('n');
build();
