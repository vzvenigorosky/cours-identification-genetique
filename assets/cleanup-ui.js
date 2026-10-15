import { kit, actions, makeCase, grade, binLabel, explanation } from './data/cleanup.js';
import { renderEPG } from './epg/render-svg.js';
const $ = id => document.getElementById(id);
const L = (fr, en) => window.I18N.getLang() === 'en' ? en : fr;
let c, answers = {}, checked = false;
function renderEPGView() {
  $('epgWrap').innerHTML = renderEPG(kit, c.sim, { width: 1100, dispMax: Number($('scale').value),
    neutralArtifacts: true, sampleLabel: `MG4 • ${c.seed}` }).svg;
}
function renderSelection() {
  const retained = c.candidates.filter(p => ['keep', 'review'].includes(answers[p.id]));
  const pending = c.candidates.filter(p => !answers[p.id]).length;
  $('selection').textContent = L('Vos appels conservés : ', 'Your retained calls: ') +
    (retained.map(p => `${p.id} (${p.dye}, ${p.size} ${L('pb', 'bp')}, ${binLabel(p)}${answers[p.id] === 'review' ? L(' — à vérifier', ' — review') : ''})`).join('; ') || L('aucun', 'none')) +
    ` · ${pending} ` + L('décision(s) en attente.', 'decision(s) pending.');
}
function render() {
  document.title = L('Nettoyage de profil — MG4', 'Profile cleanup — MG4');
  $('caseLabel').textContent = L('Cas ', 'Case ') + c.seed;
  renderEPGView();
  renderSelection();
  $('head').innerHTML = '<tr>' + [L('Pic', 'Peak'), L('Canal · taille (pb) · RFU', 'Channel · size (bp) · RFU'), L('Appel logiciel', 'Software call'), L('Décision', 'Decision'), ...(checked ? [L('Correction détaillée', 'Detailed correction')] : [])].map(s => `<th scope="col">${s}</th>`).join('') + '</tr>';
  const result = grade(c, answers);
  $('rows').innerHTML = result.rows.map(r => `<tr><th scope="row">${r.p.id}</th><td>${r.p.dye} · ${r.p.size} · ${r.p.height}</td><td>${binLabel(r.p)}</td><td><select data-id="${r.p.id}" aria-label="${L('Décision pour', 'Decision for')} ${r.p.id}"><option value="">${L('Choisir…', 'Choose…')}</option>${Object.entries(actions).map(([k,v]) => `<option value="${k}" ${answers[r.p.id] === k ? 'selected' : ''}>${window.I18N.pick(v)}</option>`).join('')}</select></td>${checked ? `<td class="correction"><strong class="${r.correct ? 'correct' : 'incorrect'}">${r.correct ? '✓' : '✗'} ${window.I18N.pick(actions[r.expected])}</strong><br>${explanation(c, r.p, window.I18N.getLang())}</td>` : ''}</tr>`).join('');
  $('summary').className = checked ? 'feedback show ' + (result.correct === result.total ? 'success' : 'warn') : 'feedback';
  $('summary').textContent = checked ? `${result.correct} / ${result.total} — ` + L('décisions correctes. Les choix manquants sont comptés comme incorrects. Vous pouvez modifier et vérifier à nouveau.', 'correct decisions. Unanswered rows count as incorrect. You can revise and check again.') : '';
  $('profile').innerHTML = checked ? `<h3>${L('Profil de référence du générateur', 'Generator reference profile')}</h3><ul>${kit.loci.map(l => `<li>${l.name}: ${c.geno[l.name].join(', ')}</li>`).join('')}</ul><p>${L('L’allèle OL reste à vérifier avant attribution d’un numéro. Ce corrigé révèle son origine simulée ; il ne remplace pas la validation analytique.', 'The OL allele requires review before assigning a number. This key reveals its simulated origin; it does not replace analytical validation.')}</p>` : '';
}
function newCase() {
  c = makeCase(Math.floor(Math.random()*1e9)); answers = {}; checked = false; render();
}
$('rows').addEventListener('change', e => {
  if (!e.target.matches('select[data-id]')) return;
  answers[e.target.dataset.id] = e.target.value;
  renderSelection();
  // Clear stale grading while preserving the active keyboard control.
  if (checked) {
    const id = e.target.dataset.id;
    checked = false; render();
    $('rows').querySelector(`select[data-id="${id}"]`).focus();
  }
});
$('check').addEventListener('click', () => { checked = true; render(); });
$('reset').addEventListener('click', () => { answers = {}; checked = false; render(); });
$('newCase').addEventListener('click', newCase);
$('scale').addEventListener('change', renderEPGView);
document.addEventListener('langchange', () => { if (c) render(); });
newCase();
