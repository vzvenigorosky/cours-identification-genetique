import { packages, addons, tariffs, weights, makeCase, visibleScelles, linePrice, quoteTotal, grade, idealAnswer, templates } from './data/devis.js';
const $ = id => document.getElementById(id);
const L = (fr, en) => window.I18N.getLang() === 'en' ? en : fr;
const pick = o => window.I18N.pick(o);
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const eur = n => (Math.round(n * 100) / 100).toLocaleString(window.I18N.getLang() === 'en' ? 'en-GB' : 'fr-FR') + ' €';

let c, st, result;
function fresh(scelles) {
  const lines = {};
  scelles.forEach(s => { lines[s.id] = { analyse: false, pkg: '', profiles: 1, y: false, mt: false }; });
  return lines;
}
function newCase(opts) {
  c = makeCase(Math.floor(Math.random() * 1e9), opts);
  st = { asked: false, declined: false, tariff: 'normal', lines: fresh(c.scelles) };
  result = null;
  render();
}
function ask() {
  if (st.asked || result) return;
  st.asked = true;
  if (c.corrected) st.lines = fresh(c.corrected); // the client replaced the scellés
  render();
}
function decline() { if (!result) { st.declined = true; check(); } }
function check() {
  result = grade(c, st);
  render();
  $('feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function lineHtml(s) {
  const l = st.lines[s.id];
  const locked = !!result;
  const pkgOpts = `<option value="">${L('Choisir un forfait…', 'Choose a package…')}</option>` +
    Object.entries(packages).map(([k, p]) => `<option value="${k}"${l.pkg === k ? ' selected' : ''}>${esc(pick(p.label))} — ${p.price} €</option>`).join('');
  return `<div class="scelle-card${l.analyse ? ' on' : ''}" data-id="${s.id}">
    <label class="take"><input type="checkbox" data-f="analyse"${l.analyse ? ' checked' : ''}${locked ? ' disabled' : ''}> <strong>${esc(pick(s.title))}</strong></label>
    <p class="nat">${esc(pick(s.nature))}</p>
    <div class="opts${l.analyse ? '' : ' off'}">
      <label>${L('Forfait', 'Package')} <select class="input" data-f="pkg"${locked || !l.analyse ? ' disabled' : ''}>${pkgOpts}</select></label>
      <label>${L('Profils', 'Profiles')} <select class="input" data-f="profiles"${locked || !l.analyse ? ' disabled' : ''}><option value="1"${l.profiles === 1 ? ' selected' : ''}>1</option><option value="2"${l.profiles === 2 ? ' selected' : ''}>2</option></select></label>
      <label class="chk"><input type="checkbox" data-f="y"${l.y ? ' checked' : ''}${locked || !l.analyse ? ' disabled' : ''}> ${esc(pick(addons.y.label))} (+${addons.y.price} €)</label>
      <label class="chk"><input type="checkbox" data-f="mt"${l.mt ? ' checked' : ''}${locked || !l.analyse ? ' disabled' : ''}> ${esc(pick(addons.mt.label))} (+${addons.mt.price} €)</label>
      <span class="lp">${l.analyse && l.pkg ? eur(linePrice(l)) : '—'}</span>
    </div></div>`;
}

function render() {
  document.title = L('Simulateur de devis — Exercice', 'Quote simulator — Exercise');
  $('seed').textContent = `${L('Cas', 'Case')} ${c.seed}`;
  $('requisition').innerHTML = esc(pick(c.requisition));
  const showClar = st.asked;
  $('clarification').className = showClar ? 'clar show' : 'clar';
  $('clarification').innerHTML = showClar ? `<strong>${L('Réponse du requérant :', 'The requester replies:')}</strong> ${esc(pick(c.clarification))}` : '';
  $('ask').disabled = st.asked || !!result;
  $('decline').disabled = !!result;
  const scelles = visibleScelles(c, st.asked);
  $('scelles').innerHTML = scelles.map(lineHtml).join('');
  $('tariffs').innerHTML = Object.entries(tariffs).map(([k, t]) =>
    `<label class="chk"><input type="radio" name="tariff" value="${k}"${st.tariff === k ? ' checked' : ''}${result ? ' disabled' : ''}> ${esc(pick(t.label))}</label>`).join('');
  $('total').textContent = eur(quoteTotal(st.lines, st.tariff));
  $('check').disabled = !!result;
  $('grid').innerHTML = `<table class="case-table"><tbody>${Object.values(packages).map(p => `<tr><td>${esc(pick(p.label))}</td><td class="n">${p.price} €</td></tr>`).join('')}` +
    Object.values(addons).map(a => `<tr><td>${esc(pick(a.label))}</td><td class="n">+${a.price} €</td></tr>`).join('') + '</tbody></table>';
  renderFeedback();
}

const critLabel = {
  info: ['Information', 'Information'], selection: ['Choix des scellés', 'Scellé selection'], pkg: ['Forfaits', 'Packages'],
  profiles: ['Nombre de profils', 'Number of profiles'], addons: ['Y-STR / ADNmt', 'Y-STR / mtDNA'], tariff: ['Tarif', 'Tariff']
};
function renderFeedback() {
  const fb = $('feedback');
  if (!result) { fb.className = 'feedback'; fb.innerHTML = ''; return; }
  const r = result, parts = [];
  const kind = r.total >= 80 ? 'success' : r.total >= 50 ? 'warn' : 'fail';
  parts.push(`<p><strong>${L('Score', 'Score')} : ${r.total} / 100</strong></p>`);
  const w = r.warnings || [];
  if (w.includes('shouldHaveAsked')) parts.push(`<p>⚠ ${c.kind === 'normal' ? L('Vous n’avez pas demandé de précisions alors que la réquisition ne permettait pas de trancher : vos choix reposent sur des hypothèses.', 'You did not ask for details although the requisition did not allow a decision: your choices rest on assumptions.') : L('Vous auriez dû demander au requérant avant de conclure : sa réponse change la demande. La décision est correcte mais le processus ne l’est pas.', 'You should have asked the requester before concluding: the answer changes the request. The decision is right but the process is not.')}</p>`);
  if (w.includes('askedUnnecessarily')) parts.push(`<p>⚠ ${L('Vous avez demandé des précisions alors que la réquisition était déjà claire.', 'You asked for details although the requisition was already clear.')}</p>`);
  if (w.includes('declinedValidRequest')) parts.push(`<p>⚠ ${L('Cette demande était recevable : il fallait établir un devis.', 'This request was valid: a quote had to be drawn up.')}</p>`);

  if (c.kind === 'absurdVoid') {
    parts.push(`<p>${r.declineRight ? L('✔ Après confirmation du requérant, il n’y avait aucune analyse pertinente : décliner la demande est la bonne réponse.', '✔ Once the requester confirms it, no analysis makes sense: declining the request is the right answer.') : L('✘ Aucune analyse n’avait de sens ici : la demande devait être déclinée après confirmation du requérant.', '✘ No analysis made sense here: the request had to be declined once the requester confirmed it.')}</p>`);
  } else if (!st.declined && r.expected) {
    const rows = Object.keys(weights).filter(k => k === 'info' || r.criteria[k]).map(k => {
      const cr = r.criteria[k]; if (cr && cr.applicable === false) return '';
      const sc = k === 'info' ? (r.infoOk ? 1 : 0) : cr.score;
      return `<li>${sc === 1 ? '✔' : sc === 0 ? '✘' : '◐'} ${L(critLabel[k][0], critLabel[k][1])} (${weights[k]} pts) — ${Math.round(sc * 100)} %</li>`;
    }).join('');
    parts.push(`<ul style="margin:8px 0;padding-left:20px">${rows}</ul>`);
    const scelles = visibleScelles(c, st.asked);
    const lis = scelles.map(s => {
      const e = r.expected[s.id], l = st.lines[s.id];
      let t;
      if (!e.analyse) t = l.analyse ? L('✘ ne devait pas être analysé (hors demande ou non pertinent).', '✘ should not have been analysed (outside the request or irrelevant).') : L('✔ à ne pas analyser.', '✔ correctly left out.');
      else {
        const okp = l.analyse && l.pkg === e.pkg;
        t = !l.analyse ? L('✘ à analyser : ', '✘ to analyse: ') + esc(pick(packages[e.pkg].label)) :
          (okp ? '✔ ' : '✘ ') + L('forfait attendu : ', 'expected package: ') + esc(pick(packages[e.pkg].label)) +
          (e.y ? ' + Y-STR' : '') + (e.mt ? ' + ADNmt' : '') + (e.profiles.length > 1 ? L(' (1 ou 2 profils acceptés : trace)', ' (1 or 2 profiles accepted: trace)') : '');
      }
      return `<li><strong>${esc(pick(s.title))}</strong> — ${t}</li>`;
    }).join('');
    parts.push(`<ul style="margin:8px 0;padding-left:20px">${lis}</ul>`);
    parts.push(`<p>${L('Votre devis', 'Your quote')} : <strong>${eur(r.studentTotal)}</strong> — ${L('devis attendu', 'expected quote')} : <strong>${eur(r.expectedTotal)}</strong> (${esc(pick(tariffs[c.deadline].label))}).</p>`);
  }
  if (r.expected && Object.values(st.lines).some(l => l.analyse && l.pkg === 'diffBoth') && !Object.values(r.expected).some(e => e.pkg === 'diffBoth'))
    parts.push(`<p class="muted-note">${L('Le forfait différentiel « masculin + féminin » (300 €) n’était pas le bon choix ici : en pratique on facture le prélèvement de référence de la victime (70 €) et une différentielle sur la trace pour le profil masculin.', 'The differential « male + female » package (300 €) was not the right choice here: in practice you bill the victim’s reference sample (70 €) and a differential on the trace for the male profile.')}</p>`);
  if (c.kind === 'normal' && c.needsInfo) parts.push(`<p class="muted-note">${L('Information manquante dans la réquisition : ', 'Information missing from the requisition: ')}${esc(pick(c.clarification))}</p>`);
  fb.className = `feedback show ${kind}`;
  fb.innerHTML = parts.join('');
}

document.addEventListener('change', e => {
  if (result) return;
  if (e.target.name === 'tariff') { st.tariff = e.target.value; $('total').textContent = eur(quoteTotal(st.lines, st.tariff)); return; }
  const card = e.target.closest('.scelle-card'); if (!card || !e.target.dataset.f) return;
  const l = st.lines[card.dataset.id], f = e.target.dataset.f;
  if (f === 'analyse' || f === 'y' || f === 'mt') l[f] = e.target.checked;
  else if (f === 'profiles') l.profiles = Number(e.target.value);
  else l.pkg = e.target.value;
  render();
});
$('newCase').addEventListener('click', () => newCase());
$('ask').addEventListener('click', ask);
$('decline').addEventListener('click', decline);
$('check').addEventListener('click', () => {
  const missing = visibleScelles(c, st.asked).some(s => st.lines[s.id].analyse && !st.lines[s.id].pkg);
  if (missing) { $('feedback').className = 'feedback show warn'; $('feedback').textContent = L('Choisissez un forfait pour chaque scellé pris en charge.', 'Choose a package for every exhibit you take on.'); return; }
  check();
});
document.addEventListener('langchange', render);
const fromHash = new URLSearchParams(location.search).get('template');
newCase(fromHash && templates.some(t => t.id === fromHash) ? { template: fromHash } : undefined);
