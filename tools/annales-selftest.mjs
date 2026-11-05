import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'annales.html', 'utf8');
const m = html.match(/var EXAMS = (\[[\s\S]*?\n    \]);/);
assert(m, 'the EXAMS list is found in annales.html');
const EXAMS = vm.runInNewContext(m[1]);

assert(EXAMS.length >= 11, 'the page lists ' + EXAMS.length + ' papers');
const pdfs = new Set(), audios = new Set(), labels = new Set();
for (const e of EXAMS) {
  assert(!('level' in e), e.pdf + ': no M1 / M2 level any more (one list)');
  assert(e.fr && e.fr.trim() && e.en && e.en.trim(), e.pdf + ': both labels');
  assert(!/["<>&]/.test(e.fr + e.en), e.pdf + ': labels are safe inside an HTML attribute');
  assert(!/\bM[12]\b/.test(e.fr + ' ' + e.en), e.pdf + ': the label does not mention M1 / M2');
  assert(!labels.has(e.fr), 'duplicate label ' + e.fr); labels.add(e.fr);
  assert(!pdfs.has(e.pdf), 'duplicate paper ' + e.pdf); pdfs.add(e.pdf);
  assert(existsSync(root + e.pdf), e.pdf + ' exists');
  const head = readFileSync(root + e.pdf).subarray(0, 5).toString('latin1');
  assert.equal(head, '%PDF-', e.pdf + ' is a real PDF');
  assert(statSync(root + e.pdf).size > 20000 && statSync(root + e.pdf).size < 2e6, e.pdf + ' has a plausible size');
  for (const a of e.audios) { assert(a.fr && a.en, 'audio labels'); assert(existsSync(root + a.src) && statSync(root + a.src).size > 1000, a.src + ' exists'); assert(!audios.has(a.src), 'duplicate audio ' + a.src); audios.add(a.src); }
}
// nothing in the repo root is left unlisted
for (const f of readdirSync(root)) {
  if (/^Annale_.*\.pdf$/.test(f)) assert(pdfs.has(f), f + ' is in the repo but not listed on the page');
  if (/^Annale_.*\.mp3$/.test(f)) assert(audios.has(f), f + ' is in the repo but not listed on the page');
}
// One list, no Master headings, nothing about M1 / M2 in the visible page
assert(!/<h2[^>]*>\s*Master/.test(html) && !/id="list-m[12]"/.test(html) && /id="list"/.test(html), 'a single list');
assert(!/\bM[12]\b/.test(html.replace(/Annale_M[12]_[A-Za-z0-9_]+\.(pdf|mp3)/g, '')), 'no M1 / M2 left in the visible page (only in file names)');

// Labels: "<year> — <UE or course> — <15|30> min", or "<year> — <UE> — sujet étendu / extended paper — 30 min"; every paper is dated, newest first
const YEARLY = /^(\d{4}) — (UE\d|Identification génétique|Genetic identification) — (15|30) min$/;
const EXT_FR = /^(\d{4}) — (UE\d) — sujet étendu — 30 min$/, EXT_EN = /^(\d{4}) — (UE\d) — extended paper — 30 min$/;
let lastYear = Infinity; const years = [];
for (const e of EXAMS) {
  const mm = e.pdf.match(/^Annale_(M[12])(?:_UE(\d))?_(\d{4})(_etendu)?\.pdf$/);
  assert(mm, e.pdf + ' follows the file naming pattern (the historical level stays in the file name only)');
  const ext = !!mm[4], f = e.fr.match(ext ? EXT_FR : YEARLY), n = e.en.match(ext ? EXT_EN : YEARLY);
  assert(f && n, e.pdf + ': label format: ' + e.fr + ' / ' + e.en);
  assert.equal(f[1], mm[3], e.pdf + ': year matches the file'); assert.equal(n[1], mm[3]);
  if (mm[2]) { assert.equal(f[2], 'UE' + mm[2], e.pdf + ': UE matches the file'); assert.equal(n[2], 'UE' + mm[2]); }
  if (ext) assert(mm[2], e.pdf + ': an extended paper names its UE');
  assert(Number(f[1]) <= lastYear, e.pdf + ': newest first'); lastYear = Number(f[1]); years.push(f[1]);
}
assert(!EXAMS.some(e => /etendu\.pdf$/.test(e.pdf) && !/_\d{4}_etendu\.pdf$/.test(e.pdf)), 'no undated extended paper');
assert.equal(years.length, EXAMS.length); assert.equal(years[0], '2025'); assert.equal(years.at(-1), '2021');
assert.deepEqual(Array.from(EXAMS.slice(0, 3), e => e.fr), ['2025 — UE2 — 30 min', '2025 — UE7 — sujet étendu — 30 min', '2025 — UE8 — sujet étendu — 30 min'], 'the 2025 papers come first, by UE');
console.log('annales self-test: OK (' + EXAMS.length + ' papers, ' + audios.size + ' audio files)');
