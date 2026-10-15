import { scenarios, methods, extractionMethods, conclusions, policy, makeCase, extract, analyze, gradeResult } from './data/casework.js';
const $ = id => document.getElementById(id);
const L = (fr,en) => window.I18N.getLang()==='en' ? en : fr;
const pick = o => window.I18N.pick(o);
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let c, strategy='', extracts=[], routes={}, results=[], answers={}, checked=false, extractionTried=false, runError=false;
const quant = n => n > 0 && n < 0.001 ? n.toExponential(2) : n.toFixed(4);
const chosen = (a,b) => a===b ? ' selected' : '';
function options(data, value) {
  return `<option value="">${L('Choisir…','Choose…')}</option>` + Object.entries(data).map(([id,label])=>`<option value="${id}"${chosen(id,value)}>${esc(pick(label))}</option>`).join('');
}
function feedback(id, message, kind='warn') {
  $(id).className = message ? `feedback show ${kind}` : 'feedback';
  $(id).textContent = message;
}
function clearResults() { results=[]; answers={}; checked=false; runError=false; }
function newCase(type = c?.type || 'semen') {
  c=makeCase(Math.floor(Math.random()*1e9),type);
  strategy=''; extracts=[]; routes={}; extractionTried=false; clearResults(); render();
}
function render() {
  document.title = L('MG2 — Du scellé à la comparaison','MG2 — From evidence to comparison');
  $('scenario').innerHTML = options(Object.fromEntries(Object.entries(scenarios).map(([k,v])=>[k,v.title])),c.type);
  $('seed').textContent = `${L('Cas','Case')} ${c.seed}`;
  $('caseTitle').textContent = pick(scenarios[c.type].title);
  $('brief').textContent = pick(scenarios[c.type].brief);
  $('extraction').innerHTML = options(extractionMethods,strategy);
  feedback('extractionFeedback', extractionTried ? (strategy ? pick(scenarios[c.type].extraction) : L('Choisissez une extraction.','Choose an extraction.')) : '', extracts.length ? 'success' : 'warn');
  $('quantPanel').classList.toggle('hidden',!extracts.length);
  $('policy').textContent = L(`Règles à valider : volume maximal ${policy.maxVolume} µL ; apport autosomique minimal ${policy.autoInput} ng et DI ≤ ${policy.autoDI} ; apport Y minimal ${policy.yInput} ng avec faisabilité favorable. Concentration × volume = quantité. Une dilution est possible pour les extraits concentrés.`, `Draft rules: maximum volume ${policy.maxVolume} µL; minimum autosomal input ${policy.autoInput} ng and DI ≤ ${policy.autoDI}; minimum Y input ${policy.yInput} ng with favorable feasibility. Concentration × volume = input. Concentrated extracts can be diluted.`);
  $('quant').innerHTML = `<table class="case-table"><thead><tr>${[L('Extrait','Extract'),'SA (ng/µL)','LA (ng/µL)','Y (ng/µL)','DI',L('Faisabilité Y','Y feasibility'),L('Faisabilité mtDNA','mtDNA feasibility')].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${extracts.map(e=>`<tr><th scope="row">${esc(pick(e.label))}</th><td>${quant(e.auto)}</td><td>${quant(e.large)}</td><td>${e.y ? quant(e.y) : L('Non détecté','Not detected')}</td><td>${e.di.toFixed(1)}</td><td>${e.yQC ? L('Favorable','Favorable') : L('Non favorable','Not favorable')}</td><td>${e.mtQC ? L('Favorable','Favorable') : L('Non évaluée','Not assessed')}</td></tr>`).join('')}</tbody></table>`;
  $('routes').innerHTML = extracts.map(e=>`<div class="route-card"><label for="route-${e.id}">${esc(pick(e.label))} — ${L('analyse prioritaire','priority analysis')}</label> <select class="input" id="route-${e.id}" data-route="${e.id}">${options(methods,routes[e.id])}</select></div>`).join('');
  feedback('runFeedback', runError ? L('Choisissez une analyse pour chaque extrait.','Choose an analysis for every extract.') : '');
  $('resultsPanel').classList.toggle('hidden',!results.length);
  $('results').innerHTML = results.map(({e,result})=>resultCard(e,result)).join('');
  renderScore();
}
function resultCard(e,r) {
  const a=answers[e.id] || {refs:null,conclusion:''};
  const g=gradeResult(r,a.refs,a.conclusion);
  const routeOK = routes[e.id]===e.preferred;
  const rows = r.rows.map(row=>`<tr><th scope="row">${esc(row.locus)}</th><td>${esc(row.value.join(', '))}</td>${c.refs.filter(ref=>ref.id!=='U').map(ref=>{
    const v=r.method==='mt' ? ref.mt : r.method==='y' && !ref.y ? '—' : ref[r.method][row.locus].join(', ');
    return `<td>${esc(v)}</td>`;
  }).join('')}</tr>`).join('');
  return `<article class="result-card"><h3>${esc(pick(e.label))} · ${esc(pick(methods[r.method]))}</h3>
    <p class="verdict ${routeOK?'ok':'ko'}">${routeOK?'✓':'↗'} ${L('Priorité du dossier :','Case priority:')} ${esc(pick(methods[e.preferred]))}. ${esc(pick(e.reason))}</p>
    <p>${esc(pick(r.reason))}</p>
    ${r.rows.length ? `<details data-detail="${e.id}"><summary>${L('Tableau trace / références A, B, C','Trace / references A, B, C table')} (${r.rows.length} ${L('lignes','rows')})</summary><div class="table-scroll" tabindex="0" role="region" aria-label="${L('Profils de','Profiles for')} ${esc(pick(e.label))}"><table class="case-table"><thead><tr><th scope="col">${L('Marqueur','Marker')}</th><th scope="col">${L('Trace','Trace')}</th><th scope="col">A</th><th scope="col">B</th><th scope="col">C</th></tr></thead><tbody>${rows}</tbody></table></div></details>` : ''}
    <fieldset><legend>${L('Références compatibles (aucune si non attribuable ou sans résultat)','Compatible references (none if unassigned or without a result)')}</legend><div class="reference-picks">${['A','B','C'].map(id=>`<label><input type="checkbox" data-ref="${e.id}" value="${id}"${a.refs?.includes(id)?' checked':''}> ${id}</label>`).join('')}<label><input type="checkbox" data-ref-none="${e.id}"${Array.isArray(a.refs)&&!a.refs.length?' checked':''}> ${L('Aucune','None')}</label></div></fieldset>
    <label for="conclusion-${e.id}">${L('Portée de la conclusion','Scope of conclusion')}</label> <select class="input" id="conclusion-${e.id}" data-conclusion="${e.id}">${options(conclusions,a.conclusion)}</select>
    ${checked ? `<p data-correction class="verdict ${g.references&&g.conclusion?'ok':'ko'}">${g.references&&g.conclusion?'✓':'✗'} ${L('Références attendues :','Expected references:')} ${r.matches.join(', ') || L('aucune','none')}. ${esc(pick(conclusions[r.conclusion]))}.</p>` : ''}</article>`;
}
function renderScore() {
  if (!checked) { feedback('feedback',''); return; }
  let score=0;
  for (const {e,result} of results) {
    const g=gradeResult(result,answers[e.id]?.refs ?? null,answers[e.id]?.conclusion);
    score+=Number(routes[e.id]===e.preferred)+Number(g.references)+Number(g.conclusion);
  }
  feedback('feedback', `${score} / ${results.length*3} — `+L('un point pour l’analyse prioritaire, un pour les références compatibles, un pour la portée de la conclusion, par extrait. Les choix non renseignés sont incorrects.', 'one point for priority analysis, one for compatible references, one for conclusion scope, per extract. Unanswered decisions are incorrect.'),score===results.length*3?'success':'warn');
}
$('scenario').addEventListener('change',e=>newCase(e.target.value || 'semen'));
$('newCase').addEventListener('click',()=>newCase());
$('extraction').addEventListener('change',e=>{ strategy=e.target.value; extracts=[]; routes={}; extractionTried=false; clearResults(); render(); });
$('extract').addEventListener('click',()=>{ extractionTried=true; extracts=extract(c,strategy); routes={}; clearResults(); render(); });
$('routes').addEventListener('change',e=>{
  if (!e.target.dataset.route) return;
  routes[e.target.dataset.route]=e.target.value; clearResults();
  // Keep the active route control focused while invalidating downstream answers.
  $('resultsPanel').classList.add('hidden'); $('results').innerHTML=''; feedback('feedback',''); feedback('runFeedback','');
});
$('run').addEventListener('click',()=>{
  if (extracts.some(e=>!routes[e.id])) { runError=true; render(); return; }
  results=extracts.map(e=>({e,result:analyze(c,e,routes[e.id])})); answers={}; checked=false; runError=false; render();
});
$('results').addEventListener('change',e=>{
  const id=e.target.dataset.ref || e.target.dataset.refNone || e.target.dataset.conclusion;
  if (!id) return;
  const a=answers[id] ||= {refs:null,conclusion:''};
  if (e.target.dataset.refNone) {
    a.refs=e.target.checked ? [] : null;
    e.target.closest('fieldset').querySelectorAll('[data-ref]').forEach(el=>{ el.checked=false; });
  } else if (e.target.dataset.ref) {
    a.refs=e.target.checked ? [...new Set([...(a.refs || []),e.target.value])] : (a.refs || []).filter(v=>v!==e.target.value);
    if (!a.refs.length) a.refs=null;
    e.target.closest('fieldset').querySelector('[data-ref-none]').checked=false;
  }
  else a.conclusion=e.target.value;
  if (checked) {
    checked=false;
    $('results').querySelectorAll('[data-correction]').forEach(el=>el.remove());
    renderScore();
  }
});
$('check').addEventListener('click',()=>{
  const opened=[...$('results').querySelectorAll('details[open]')].map(el=>el.dataset.detail);
  checked=true; render();
  opened.forEach(id=>$('results').querySelector(`details[data-detail="${id}"]`)?.setAttribute('open',''));
});
document.addEventListener('langchange',()=>{ if (c) {
  const opened=[...$('results').querySelectorAll('details[open]')].map(el=>el.dataset.detail);
  render(); opened.forEach(id=>$('results').querySelector(`details[data-detail="${id}"]`)?.setAttribute('open',''));
} });
newCase();
