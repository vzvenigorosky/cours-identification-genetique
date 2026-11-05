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
  assert(['m1', 'm2'].includes(e.level), e.pdf + ': level');
  assert(e.fr && e.fr.trim() && e.en && e.en.trim(), e.pdf + ': both labels');
  assert(!/["<>&]/.test(e.fr + e.en), e.pdf + ': labels are safe inside an HTML attribute');
  assert(e.fr.startsWith(e.level.toUpperCase()) && e.en.startsWith(e.level.toUpperCase()), e.pdf + ': label starts with the level');
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
// the filename pattern: Annale_<level>[_UE<n>]_<year or etendu>.pdf, matching the label
for (const e of EXAMS) {
  const mm = e.pdf.match(/^Annale_(M[12])(?:_UE(\d))?_(\d{4}|etendu)\.pdf$/);
  assert(mm, e.pdf + ' follows the naming pattern');
  assert.equal(mm[1].toLowerCase(), e.level, e.pdf + ': level matches the file');
  if (mm[2]) assert(e.fr.includes('UE' + mm[2]), e.pdf + ': UE matches the label');
  if (/^\d{4}$/.test(mm[3])) assert(e.fr.includes(mm[3]), e.pdf + ': year matches the label'); else assert(/étendu/.test(e.fr) && /extended/.test(e.en), e.pdf + ': extended papers are labelled as such in both languages');
}
console.log('annales self-test: OK (' + EXAMS.length + ' papers, ' + audios.size + ' audio files)');
