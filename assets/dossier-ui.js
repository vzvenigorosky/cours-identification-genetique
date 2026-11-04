import { PACKAGES, PACKAGE_ORDER, TEMPLATES, makeDossier, checkQuote, quoteTotal, extractionBudget, checkSampling, doExtraction, analysisSlots,
  SLOT_LABEL, checkAnalysis, runSlot, compareProfiles, profileFromCalls, observedAlleles, checkConsensus, randomMatch, compareHaplotypes, KIN_LEVELS, fmtPct, THRESHOLD_LABEL, reachesThreshold, lrWord, fmtSci, buildReveal,
  ANCESTRY, PHENO, LOW_CONC, N_AUTO, hasDifferential, DIFFERENTIAL_NOTICE, DIFFERENTIAL_SITE_TAG, DIFFERENTIAL_MARGIN } from './data/dossier.js';

const $ = id => document.getElementById(id);
// Anonymous step counts (assets/analytics.js; a no-op unless a GoatCounter code is configured). Event names only: never answers or seeds.
const track = name => { if (window.Analytics) window.Analytics.event(name); };
const lang = () => window.I18N.getLang();
const L = (fr, en) => lang() === 'en' ? en : fr;
const pick = o => window.I18N.pick(o);
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const eur = n => n.toLocaleString(lang() === 'en' ? 'en-GB' : 'fr-FR') + ' €';
const num = (x, d = 4) => x.toLocaleString(lang() === 'en' ? 'en-GB' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const sci = x => fmtSci(x, lang());
const fmtA = a => Number.isInteger(a) ? String(a) : a.toFixed(1);
const sName = id => `${L('Scellé n°', 'Exhibit #')}${c.scelles.find(s => s.id === id).no}`;

let c, st;
const STEPS = [['Réquisition', 'Requisition'], ['Devis', 'Quote'], ['Prélèvements', 'Sampling'], ['Quantification', 'Quantification'], ['Amplification', 'Amplification'], ['Résultats', 'Results']];

function fresh() {
  return { asked: false, askedClear: false, stage: 1,
    quote: {}, quoteLocked: false, checks: {},
    sampling: {}, samplingLocked: false, extracts: [], quantified: false,
    assign: {}, ampLocked: false, results: [],
    tool: 'kin', kinA: '', kinB: '', rmpSel: '', consSel: {}, consCheck: {}, kinOut: null, rmpOut: null, consLog: [], revealed: false, notice: null };
}
function newCase(opts) {
  c = makeDossier(Math.floor(Math.random() * 1e9), opts);
  st = fresh();
  track('full-case/case/' + c.template + '/' + c.variant);
  render();
}

/* ---------- derived ---------- */
const budget = () => extractionBudget(st.quote);
const slots = () => analysisSlots(c, st.quote);
const warnLists = {
  2: () => checkQuote(c, st.quote),
  3: () => checkSampling(c, st.quote, st.sampling),
  5: () => checkAnalysis(c, st.quote, st.extracts, st.assign)
};
const hasAny = o => Object.values(o).some(Boolean);

/* ---------- warnings box (amber, never red) ---------- */
function warnBox(n) {
  if (!st.checks[n]) return '';
  const list = warnLists[n]();
  const warns = list.filter(w => w.level === 'warn'), infos = list.filter(w => w.level === 'info');
  let h = '';
  if (n === 2 && warns.length && c.needsInfo && !st.asked)
    h += `<div class="feedback show info" role="status">${L('La réquisition était incomplète et vous n’avez pas demandé de précisions : ces remarques s’appuient sur les informations complètes du dossier.', 'The requisition was incomplete and you did not ask for details: these remarks rely on the full information of the case.')}</div>`;
  if (warns.length) h += `<div class="feedback show warn" role="status"><strong>${L('À vérifier', 'To check')}</strong><ul>${warns.map(w => `<li>${esc(pick(w.text))}</li>`).join('')}</ul></div>`;
  if (infos.length) h += `<div class="feedback show info" role="status"><ul>${infos.map(w => `<li>${esc(pick(w.text))}</li>`).join('')}</ul></div>`;
  if (!list.length) h += `<div class="feedback show info" role="status">${L('Aucun avertissement.', 'No warning.')}</div>`;
  return h;
}

/* ---------- stage 1: requisition ---------- */
function renderReq() {
  let reply = '';
  if (st.asked) reply = `<div class="feedback show info" role="status"><strong>${L('Réponse du requérant :', 'The requester replies:')}</strong> ${esc(pick(c.clarification))}</div>`;
  else if (st.askedClear) reply = `<div class="feedback show info" role="status">${L('La réquisition est déjà claire : le requérant n’a pas de précision supplémentaire à apporter. Ce n’est pas une erreur de l’avoir demandé.', 'The requisition is already clear: the requester has nothing more to add. Asking was not a mistake.')}</div>`;
  $('s1').innerHTML = `<h2>${L('1 · Réquisition', '1 · Requisition')}</h2>
    <div class="req">${esc(pick(c.requisition))}</div>${reply}
    <div class="controls mt"><button class="btn btn-ghost" data-act="ask">${L('Demander des précisions au requérant', 'Ask the requester for details')}</button>
      <button class="btn btn-primary" data-act="toQuote"${st.stage >= 2 ? ' disabled' : ''}>${L('Proposer un devis', 'Propose a quote')}</button></div>`;
}

// Automatic differential extraction (#104): an information box, never a choice.
const diffNotice = id => hasDifferential(c, id) ? `<div class="feedback show info" role="note" style="margin-top:8px">${esc(pick(DIFFERENTIAL_NOTICE))}</div>` : '';

/* ---------- stage 2: quote ---------- */
function renderQuote() {
  const locked = st.quoteLocked;
  const cards = c.scelles.map(s => {
    const t = st.quote[s.id] || '';
    return `<div class="sc${t ? ' on' : ''}" data-id="${s.id}"><strong>${L('Scellé n°', 'Exhibit #')}${s.no}</strong> — ${esc(pick(s.title))}
      <p class="muted-note">${esc(pick(s.nature))}</p>${diffNotice(s.id)}
      <label>${L('Proposition', 'Proposal')}
        <select class="input" data-f="quote"${locked ? ' disabled' : ''}><option value="">${L('— non pris en charge —', '— not taken on —')}</option>${PACKAGE_ORDER.map(k => `<option value="${k}"${t === k ? ' selected' : ''}>${esc(pick(PACKAGES[k].label))} — ${PACKAGES[k].price} €</option>`).join('')}</select></label>
      ${t ? `<p class="muted-note">${esc(pick(PACKAGES[t].detail))}</p>` : ''}</div>`;
  }).join('');
  const grid = `<table class="data"><thead><tr><th class="l">${L('Proposition', 'Proposal')}</th><th class="l">${L('Contenu', 'Content')}</th><th>${L('Prix', 'Price')}</th></tr></thead><tbody>` +
    PACKAGE_ORDER.map(k => `<tr><td class="l"><strong>${esc(pick(PACKAGES[k].label))}</strong></td><td class="l">${esc(pick(PACKAGES[k].detail))}</td><td>${PACKAGES[k].price} €</td></tr>`).join('') + '</tbody></table>';
  const empty = st.checks.quoteEmpty ? `<div class="feedback show warn" role="status">${L('Votre devis est vide : choisissez au moins une proposition.', 'Your quote is empty: choose at least one proposal.')}</div>` : '';
  $('s2').innerHTML = `<h2>${L('2 · Devis', '2 · Quote')}</h2>
    <p class="muted-note">${L('Pour chaque scellé, choisissez la proposition qui répond à la demande — ou ne le prenez pas en charge.', 'For each exhibit, choose the proposal that answers the request — or do not take it on.')}</p>
    ${cards}
    <div class="totalbar"><span>${L('Total du devis', 'Quote total')}</span><strong>${eur(quoteTotal(st.quote))}</strong></div>
    <details class="mt"><summary>${L('Propositions et prix', 'Proposals and prices')}</summary><div class="table-scroll">${grid}</div></details>
    ${locked ? `<p class="muted-note mt">${L('Devis validé.', 'Quote validated.')}</p>` : `<div class="controls mt">
      <button class="btn btn-ghost" data-act="chkQuote">${L('Vérifier le devis', 'Check the quote')}</button>
      <button class="btn btn-primary" data-act="okQuote">${L('Valider le devis', 'Validate the quote')}</button></div>`}
    <div aria-live="polite">${empty}${locked ? '' : warnBox(2)}</div>`;
}

/* ---------- stage 3: sampling ---------- */
function renderSampling() {
  const b = budget(), locked = st.samplingLocked;
  const cards = c.scelles.map(s => {
    const n = b[s.id], head = `<strong>${L('Scellé n°', 'Exhibit #')}${s.no}</strong> — ${esc(pick(s.title))}`;
    if (!n) return `<div class="sc">${head}<p class="muted-note">${L('Non pris en charge dans le devis : aucun prélèvement.', 'Not taken on in the quote: no sampling.')}</p></div>`;
    const rows = Array.from({ length: n }, (_, k) => {
      const cur = (st.sampling[s.id] || [])[k] || '';
      return `<div class="row"><span>${L('Extraction', 'Extraction')} ${k + 1}/${n}</span>
        <select class="input" data-f="site" data-k="${k}"${locked ? ' disabled' : ''}><option value="">${L('— ne pas réaliser —', '— do not perform —')}</option>${c.sites[s.id].map(x => `<option value="${x.id}"${cur === x.id ? ' selected' : ''}>${esc(pick(x.label))}${x.differential ? esc(pick(DIFFERENTIAL_SITE_TAG)) : ''}</option>`).join('')}</select></div>`;
    }).join('');
    return `<div class="sc on" data-id="${s.id}">${head}<p class="muted-note">${esc(pick(s.nature))} ${L('Extractions prévues au devis :', 'Extractions planned in the quote:')} <strong>${n}</strong></p>${diffNotice(s.id)}${rows}</div>`;
  }).join('');
  const done = locked ? extractTable(false) : '';
  $('s3').innerHTML = `<h2>${L('3 · Prélèvements et extractions', '3 · Sampling and extraction')}</h2>
    <p class="muted-note">${L('Pour chaque extraction prévue au devis, choisissez la zone du scellé où prélever.', 'For each extraction planned in the quote, choose the area of the exhibit to sample.')}</p>
    ${cards}
    ${locked ? done : `<div class="controls mt"><button class="btn btn-ghost" data-act="chkSamp">${L('Vérifier les prélèvements', 'Check the sampling')}</button>
      <button class="btn btn-primary" data-act="okSamp">${L('Réaliser les extractions', 'Run the extractions')}</button></div>`}
    <div aria-live="polite">${st.checks.sampEmpty ? `<div class="feedback show warn" role="status">${L('Aucune extraction choisie : sélectionnez au moins une zone.', 'No extraction chosen: select at least one area.')}</div>` : ''}${locked ? '' : warnBox(3)}</div>`;
}
function extractTable(withQuant) {
  const mt = hasAny(Object.fromEntries(Object.entries(st.quote).map(([k, t]) => [k, PACKAGES[t] && PACKAGES[t].lineage === 'mt'])));
  const head = `<tr><th class="l">${L('Extrait', 'Extract')}</th><th class="l">${L('Scellé', 'Exhibit')}</th><th class="l">${L('Zone prélevée', 'Area sampled')}</th>` +
    (withQuant ? `<th>${L('ADN autosomique (ng/µL)', 'Autosomal DNA (ng/µL)')}</th><th>${L('ADN masculin (ng/µL)', 'Male DNA (ng/µL)')}</th><th>${L('Indice de dégradation', 'Degradation index')}</th>` + (mt ? `<th>${L('ADNmt (copies/µL)', 'mtDNA (copies/µL)')}</th>` : '') : '') + '</tr>';
  const body = st.extracts.map(e => {
    const s = c.scelles.find(x => x.id === e.scelleId), site = c.sites[e.scelleId].find(x => x.id === e.siteId);
    return `<tr><td class="l mono"><strong>${e.id}</strong></td><td class="l">${esc(sName(e.scelleId))} — ${esc(pick(s.title))}</td><td class="l">${esc(pick(site.label))}</td>` +
      (withQuant ? `<td class="mono${e.conc < LOW_CONC ? ' part' : ''}">${num(e.conc)}</td><td class="mono">${num(e.male)}</td><td class="mono">${num(e.di, 1)}</td>` + (mt ? `<td class="mono">${e.mt.toLocaleString(lang() === 'en' ? 'en-GB' : 'fr-FR')}</td>` : '') : '') + '</tr>';
  }).join('');
  return `<div class="table-scroll mt"><table class="data"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

/* ---------- stage 4: quantification ---------- */
function renderQuant() {
  $('s4').innerHTML = `<h2>${L('4 · Quantification', '4 · Quantification')}</h2>
    ${st.quantified ? `${extractTable(true)}<p class="muted-note">${L('Les valeurs en orange sont sous ' + LOW_CONC.toString().replace('.', ',') + ' ng/µL (seuil indicatif d’un profil exploitable).', 'Orange values are below ' + LOW_CONC + ' ng/µL (indicative threshold for a usable profile).')}</p>`
      : `${extractTable(false)}<div class="controls mt"><button class="btn btn-primary" data-act="quant">${L('Quantification', 'Quantification')}</button></div>`}`;
}

/* ---------- stage 5: amplification ---------- */
function renderAmp() {
  const locked = st.ampLocked, rows = slots().map(sl => {
    const mine = st.extracts.filter(e => e.scelleId === sl.scelleId), cur = st.assign[sl.key] || '';
    const lab = pick(SLOT_LABEL[sl.kind]) + (sl.of > 1 ? ` ${sl.index}/${sl.of}` : '');
    const opt = e => `<option value="${e.id}"${cur === e.id ? ' selected' : ''}>${L('Extrait', 'Extract')} ${e.id} — ${num(sl.kind === 'y' ? e.male : sl.kind === 'mt' ? 0 : e.conc)} ${sl.kind === 'mt' ? '(' + e.mt.toLocaleString(lang() === 'en' ? 'en-GB' : 'fr-FR') + ' copies/µL)' : 'ng/µL'}</option>`;
    return `<div class="row"><span><strong>${esc(sName(sl.scelleId))}</strong> — ${esc(lab)}</span>
      <select class="input" data-f="assign" data-slot="${sl.key}"${locked || !mine.length ? ' disabled' : ''}><option value="">${mine.length ? L('— choisir un extrait —', '— choose an extract —') : L('— aucun extrait —', '— no extract —')}</option>${mine.map(opt).join('')}</select></div>`;
  }).join('');
  $('s5').innerHTML = `<h2>${L('5 · Amplification et analyse des fragments', '5 · Amplification and fragment analysis')}</h2>
    <p class="muted-note">${L('Pour chaque analyse prévue au devis, choisissez l’extrait à y engager. Un même extrait peut servir deux fois.', 'For each analysis planned in the quote, choose the extract to use. The same extract may be used twice.')}</p>
    ${rows || `<p class="muted-note">${L('Aucune analyse prévue.', 'No analysis planned.')}</p>`}
    ${locked ? `<p class="muted-note mt">${L('Analyses réalisées.', 'Analyses performed.')}</p>` : `<div class="controls mt"><button class="btn btn-ghost" data-act="chkAmp">${L('Vérifier les choix', 'Check the choices')}</button>
      <button class="btn btn-primary" data-act="runAmp">${L('Lancer l’amplification et l’analyse', 'Run amplification and analysis')}</button></div>`}
    <div aria-live="polite">${locked ? '' : warnBox(5)}</div>`;
}

/* ---------- stage 6: results and tools ---------- */
const autos = () => st.results.filter(r => r.kind === 'auto');
const habs = () => st.results.filter(r => r.kind === 'y' || r.kind === 'mt');
const resLabel = r => {
  if (r.derived) return `${r.id} — ${L('consensus construit à partir de', 'consensus built from')} ${r.sources.join(', ')}`;
  const lab = pick(SLOT_LABEL[r.kind]) + (r.slotOf > 1 ? ` ${r.slotIndex}/${r.slotOf}` : '');
  return `${r.id} — ${sName(r.scelleId)} · ${lab} (${L('extrait', 'extract')} ${r.extractId})`;
};
function cellOf(e) {
  if (!e || !e.alleles.length) return ['—', 'none'];
  if (e.alleles.length >= 2) return [e.alleles.map(fmtA).join(', '), ''];
  return e.reliable ? [`${fmtA(e.alleles[0])}, ${fmtA(e.alleles[0])}`, ''] : [`${fmtA(e.alleles[0])}, *`, 'part'];
}
const repsOf = p => p.sources.map(id => byId(id)).filter(Boolean);
function consCell(p, locus) {
  const opts = observedAlleles(repsOf(p), locus), cur = p.calls[locus] || [];
  const sel = i => `<select class="input cc" data-f="ccall" data-id="${p.id}" data-locus="${locus}" data-i="${i}" aria-label="${locus} ${L('allèle', 'allele')} ${i + 1}"><option value="">—</option>${opts.map(a => `<option value="${a}"${String(cur[i]) === String(a) ? ' selected' : ''}>${fmtA(a)}</option>`).join('')}</select>`;
  return `<div class="cc2">${sel(0)}${sel(1)}</div>`;
}
function profileTable() {
  const ps = autos();
  if (!ps.length) return '';
  const loci = Object.keys(ps[0].loci);
  const head = `<tr><th class="l">Locus</th>${ps.map(p => `<th title="${esc(resLabel(p))}">${p.id}${p.differential ? ' †' : ''}</th>`).join('')}</tr>`;
  const rows = loci.map(l => `<tr><td class="l"><strong>${l}</strong></td>${ps.map(p => {
    if (p.derived) return `<td class="mono">${consCell(p, l)}</td>`;
    const [t, k] = cellOf(p.loci[l]); return `<td class="mono ${k}">${t}</td>`;
  }).join('')}</tr>`).join('');
  const foot = `<tr><td class="l"><strong>AMEL</strong></td>${ps.map(p => `<td class="mono">${p.sex || '—'}</td>`).join('')}</tr>` +
    `<tr><td class="l"><strong>${L('Loci typés', 'Loci typed')}</strong></td>${ps.map(p => `<td>${p.complete}/${N_AUTO} (${p.pct} %)</td>`).join('')}</tr>`;
  return `<h3>${L('Profils STR autosomaux', 'Autosomal STR profiles')}</h3>
    <div class="table-scroll"><table class="data"><thead>${head}</thead><tbody>${rows}${foot}</tbody></table></div>
    <ul class="muted-note" style="margin:6px 0">${ps.map(p => `<li><strong>${p.id}</strong> = ${esc(resLabel(p))}</li>`).join('')}</ul>
    ${ps.some(p => p.differential) ? `<div class="feedback show warn" role="note"><strong>†</strong> ${esc(pick(DIFFERENTIAL_MARGIN))}</div>` : ''}
    <p class="muted-note">${L('— : locus non typé. « a, * » : un seul allèle observé, le second a pu ne pas s’amplifier (perte d’allèle).', '—: locus not typed. “a, *”: a single allele seen, the second may have failed to amplify (drop-out).')}${ps.some(p => p.derived) ? ' ' + L('Colonne consensus : choisissez l’allèle 1 et l’allèle 2 de chaque locus (deux fois le même = homozygote ; un seul = partiel).', 'Consensus column: choose allele 1 and allele 2 at each locus (the same twice = homozygote; a single one = partial).') : ''}</p>`;
}
function hapTable() {
  const hs = habs();
  if (!hs.length) return '';
  const rows = hs.map(h => {
    const y = h.kind === 'y';
    const comment = !h.code ? L('Aucun haplotype exploitable.', 'No usable haplotype.')
      : y ? L('Ce code représente l’haplotype STR-Y obtenu (marqueurs amplifiés seulement).', 'This code represents the Y-STR haplotype obtained (amplified markers only).')
          : L('Ce code représente l’haplotype mitochondrial obtenu (régions séquencées seulement).', 'This code represents the mitochondrial haplotype obtained (sequenced regions only).');
    return `<tr><td class="l mono"><strong>${h.id}</strong></td><td class="l">${esc(sName(h.scelleId))}</td><td class="l">${y ? 'STR-Y' : 'mtDNA'}</td><td class="mono">${h.code || '—'}</td>
      <td class="l"><span class="bar"><i style="width:${h.quality}%"></i></span>${h.quality} % <span class="muted-note">${y ? L('des marqueurs amplifiés', 'of markers amplified') : L('de la séquence', 'of the sequence')}</span></td><td class="l">${comment}</td></tr>`;
  }).join('');
  return `<h3>${L('Haplotypes (codes simplifiés)', 'Haplotypes (simplified codes)')}</h3><div class="table-scroll"><table class="data"><thead><tr><th class="l">ID</th><th class="l">${L('Scellé', 'Exhibit')}</th><th class="l">${L('Type', 'Type')}</th><th>${L('Code', 'Code')}</th><th class="l">${L('Qualité', 'Quality')}</th><th class="l">${L('Commentaire', 'Comment')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function ngsBlock() {
  return st.results.filter(r => r.kind === 'ngs').map(r => {
    if (!r.interpretable) return `<h3>${L('Orientation (NGS)', 'Orientation (NGS)')} — ${esc(sName(r.scelleId))}</h3><div class="feedback show info">${L('Run non interprétable : ' + r.quality + ' % des marqueurs seulement.', 'Run not interpretable: only ' + r.quality + '% of markers.')}</div>`;
    const bars = (arr, labelOf) => arr.map(x => `<div class="pbar"><span class="n">${esc(labelOf(x))}</span><span class="bar"><i style="width:${x.pct}%"></i></span><span class="v">${num(x.pct, 1)} %</span></div>`).join('');
    return `<h3>${L('Orientation (NGS)', 'Orientation (NGS)')} — ${esc(sName(r.scelleId))}</h3>
      <p class="muted-note">${L('Marqueurs couverts :', 'Markers covered:')} ${r.quality} %</p>
      <h4>${L('Ancestralité biogéographique (proportions estimées)', 'Biogeographical ancestry (estimated proportions)')}</h4>${bars(r.ancestry, x => pick(ANCESTRY.find(a => a.id === x.id).label))}
      ${Object.entries(PHENO).map(([t, def]) => `<h4>${pick(def.label)} (${L('probabilités', 'probabilities')})</h4>${bars(r.pheno[t], x => { const k = def.cats.find(q => q[0] === x.id); return lang() === 'en' ? k[2] : k[1]; })}`).join('')}
      <p class="muted-note">${L('Estimations probabilistes (valeurs pédagogiques) : elles orientent une recherche, elles ne désignent aucune personne.', 'Probabilistic estimates (teaching values): they orient a search and designate no one.')}</p>`;
  }).join('');
}

function itemOptions(kinds, sel) {
  const all = st.results.filter(r => kinds.includes(r.kind));
  return `<option value="">${L('— choisir —', '— choose —')}</option>` + all.map(r => `<option value="${r.id}"${sel === r.id ? ' selected' : ''}>${esc(resLabel(r))}${r.code ? ' · ' + r.code : ''}</option>`).join('');
}
const byId = id => st.results.find(r => r.id === id);

function kinOutHtml() {
  const o = st.kinOut; if (!o) return '';
  const A = byId(o.a), B = byId(o.b);
  if (!A || !B) return '';
  if (A.kind === 'auto' && B.kind === 'auto') {
    const r = compareProfiles(A, B);
    if (!r.lociCompared) return `<h4>${A.id} ↔ ${B.id}</h4><div class="feedback show info">${L('Aucun locus typé de façon fiable dans les deux profils : la comparaison n’est pas possible.', 'No locus reliably typed in both profiles: the comparison is not possible.')}</div>`;
    const pc = x => fmtPct(x, lang());
    const same = r.lociCompared >= 8 && r.discordant === 0 && r.identical === r.lociCompared
      ? `<div class="feedback show info">${L('Les deux profils sont identiques à tous les loci comparés : il s’agit de réplicats ou d’une même source. Les niveaux de parenté ne s’appliquent pas à deux profils d’une même personne (FS, qui inclut ce cas limite, ressort alors artificiellement).', 'The two profiles are identical at every locus compared: they are replicates or the same source. Kinship levels do not apply to two profiles of one person (FS, which includes this limiting case, then comes out artificially).')}</div>` : '';
    const rows = Object.entries(KIN_LEVELS).map(([h, d]) => {
      const lr = r.hyp[h].lr, w = lrWord(lr), excl = lr === 0;
      return `<tr><td class="l"><strong>${d.code}</strong> — ${esc(pick(d.label))}</td><td class="mono">${sci(lr)}</td><td class="mono"><strong>${pc(r.post[h])}</strong>${reachesThreshold(r.post[h]) ? ' ✓' : ''}</td><td class="l">${excl ? L('exclu (au moins un locus sans allèle commun)', 'excluded (at least one locus with no shared allele)') : esc(pick(w.text)) + ' ' + (w.fav ? L('pour ce niveau', 'for this level') : L('pour « non apparentés »', 'for “unrelated”'))}</td></tr>`;
    }).join('');
    const chips = Object.entries(r.perLocus).map(([l, s]) => `<span class="pill" style="margin:2px">${l}: ${{ identical: L('identique', 'identical'), discordant: L('discordant', 'discordant'), compatible: L('compatible', 'compatible'), untyped: L('non typé', 'untyped') }[s]}</span>`).join('');
    return `<h4>${A.id} ↔ ${B.id}</h4>${same}
      <p>${L('Loci comparables', 'Comparable loci')} : <strong>${r.lociCompared}</strong> · ${L('identiques', 'identical')} : ${r.identical} · ${L('discordants', 'discordant')} : ${r.discordant} · ${L('compatibles (perte d’allèle)', 'compatible (drop-out)')} : ${r.compatible} · ${L('non typés', 'untyped')} : ${r.untyped} · ${L('sans allèle commun', 'with no shared allele')} : <strong>${r.noShared}</strong>${r.noShared ? ' → ' + L('PO exclu', 'PO excluded') : ''}</p>
      <div class="feedback show info" role="note"><strong>${L('Seuil arbitraire :', 'Arbitrary threshold:')}</strong> ${L('dans cet exercice, une hypothèse est considérée comme établie à partir d’une probabilité a posteriori de', 'in this exercise, a hypothesis is treated as established from a posterior probability of')} <strong>${THRESHOLD_LABEL[lang()]}</strong> ${L('(soit un LR d’environ 10⁷ avec des a priori de 50 %). Ce seuil est une convention pédagogique, pas une norme légale ni de laboratoire.', '(an LR of about 10⁷ with 50% priors). This threshold is a teaching convention, not a legal or laboratory standard.')}</div>
      <div class="table-scroll"><table class="data"><thead><tr><th class="l">${L('Niveau de parenté', 'Kinship level')}</th><th>LR</th><th>${L('Probabilité a posteriori (contre non apparentés)', 'Posterior probability (against unrelated)')}</th><th class="l">${L('Lecture', 'Reading')}</th></tr></thead><tbody>${rows}</tbody></table></div>
      <details><summary>${L('Détail par locus', 'Per-locus detail')}</summary>${chips}</details>
      <p class="muted-note"><strong>PO</strong> = ${L('parent – enfant', 'parent – offspring')} · <strong>FS</strong> = ${L('germains', 'full siblings')} · <strong>HS/AV/GC</strong> = ${L('demi-germains, oncle/tante – neveu/nièce, grand-parent – petit-enfant (mêmes probabilités de partage d’allèles : non distinguables par ces marqueurs)', 'half-siblings, avuncular, grandparent – grandchild (same allele-sharing probabilities: not distinguishable with these markers)')}.</p>
      <p class="muted-note">${L('LR calculés sur les loci typés dans les deux profils, avec des fréquences européennes approchées et sans tolérance de mutation : un locus sans allèle commun exclut PO (LR = 0). Chaque niveau est comparé séparément à « non apparentés », avec des probabilités a priori de 50 % / 50 % : probabilité a posteriori = LR / (1 + LR). Les trois probabilités sont des comparaisons indépendantes et ne s’additionnent pas ; d’autres a priori les changeraient. Elles décrivent la comparaison de ces hypothèses pour ces profils, pas la situation réelle.', 'LRs computed on the loci typed in both profiles, with approximate European frequencies and no mutation allowance: a locus with no shared allele excludes PO (LR = 0). Each level is compared separately with “unrelated”, with prior probabilities of 50% / 50%: posterior probability = LR / (1 + LR). The three probabilities are independent comparisons and do not add up; other priors would change them. They describe the comparison of these hypotheses for these profiles, not the real situation.')}</p>`;
  }
  if (A.kind === B.kind && (A.kind === 'y' || A.kind === 'mt')) {
    const h = compareHaplotypes(A, B);
    return `<h4>${A.id} ↔ ${B.id}</h4><p>${L('Marqueurs comparables', 'Comparable markers')} : <strong>${h.compared}</strong> / ${h.total} · ${L('différences', 'differences')} : <strong>${h.differences}</strong></p>
      <p class="muted-note">${L('Un haplotype de lignée est partagé par les individus d’une même lignée : une concordance ne distingue pas ces individus entre eux.', 'A lineage haplotype is shared by the individuals of a lineage: a concordance does not distinguish them from one another.')}</p>`;
  }
  return `<div class="feedback show warn">${L('Comparez deux profils autosomaux, deux haplotypes STR-Y ou deux haplotypes mitochondriaux.', 'Compare two autosomal profiles, two Y-STR haplotypes or two mitochondrial haplotypes.')}</div>`;
}
function rmpOutHtml() {
  const o = st.rmpOut; if (!o) return '';
  const R = byId(o); if (!R) return '';
  if (R.kind !== 'auto') return `<div class="feedback show info">${L('La fréquence d’un haplotype de lignée ou d’un résultat d’orientation ne se calcule pas en multipliant des fréquences alléliques : elle se détermine par comptage dans une base de données de référence, que cet exercice ne propose pas.', 'The frequency of a lineage haplotype or of an investigative-lead result is not computed by multiplying allele frequencies: it is determined by counting in a reference database, which this exercise does not offer.')}</div>`;
  const m = randomMatch(R);
  if (!m.loci) return `<div class="feedback show info">${L('Aucun locus typé de façon fiable dans ce profil.', 'No locus reliably typed in this profile.')}</div>`;
  return `<h4>${R.id}</h4><p>${L('Loci utilisés', 'Loci used')} : <strong>${m.loci}</strong> / ${N_AUTO} ${L('(les loci partiels ou non typés sont ignorés)', '(partial or untyped loci are ignored)')}</p>
    <p>${L('Probabilité de correspondance fortuite', 'Random match probability')} : <strong class="mono">${sci(m.rmp)}</strong> — ${L('environ 1 personne sur', 'about 1 person in')} <strong class="mono">${sci(m.oneIn)}</strong>.</p>
    <p class="muted-note">${L('Produit des fréquences génotypiques (p² ou 2pq) avec des fréquences européennes approchées, sans correction de co-ancestralité. C’est la probabilité qu’une personne non apparentée prise au hasard présente ce profil, pas la probabilité qu’une personne donnée en soit la source.', 'Product of genotype frequencies (p² or 2pq) with approximate European frequencies, without co-ancestry correction. It is the chance that an unrelated random person has this profile, not the probability that a given person is its source.')}</p>`;
}
function consOutHtml() {
  const cols = autos().filter(p => p.derived);
  const log = st.consLog.map(e => e.warn.length ? `<div class="feedback show warn" role="status"><strong>${e.id}</strong><ul>${e.warn.map(k => `<li>${k === 'mixed' ? L('Ces profils ne proviennent pas du même scellé : un consensus suppose des réplicats d’une même source.', 'These profiles do not come from the same exhibit: a consensus assumes replicates of one source.') : L('Ces profils diffèrent à plusieurs loci : ce ne sont probablement pas des réplicats d’une même source.', 'These profiles differ at several loci: they are probably not replicates of one source.')}</li>`).join('')}</ul></div>` : '').join('');
  const checks = cols.map(p => {
    if (!st.consCheck[p.id]) return `<div class="controls mt"><span><strong>${p.id}</strong> — ${p.complete}/${N_AUTO}</span><button class="btn btn-ghost" data-act="consCheck" data-id="${p.id}">${L('Vérifier mon consensus', 'Check my consensus')} ${p.id}</button></div>`;
    const hints = checkConsensus(p.calls, repsOf(p));
    return `<div class="controls mt"><span><strong>${p.id}</strong> — ${p.complete}/${N_AUTO}</span><button class="btn btn-ghost" data-act="consCheck" data-id="${p.id}">${L('Vérifier mon consensus', 'Check my consensus')} ${p.id}</button></div>` +
      (hints.length ? `<div class="feedback show warn" role="status"><ul>${hints.map(h => `<li>${esc(pick(h.text))}</li>`).join('')}</ul></div>` : `<div class="feedback show info" role="status">${L('Aucun avertissement.', 'No warning.')}</div>`);
  }).join('');
  return log + checks;
}

function renderResults() {
  const tabs = [['kin', L('Parenté', 'Kinship')], ['cons', L('Consensus', 'Consensus')], ['rmp', L('Fréquence du profil', 'Profile frequency')]];
  const tabsHtml = `<div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button class="btn btn-ghost${st.tool === k ? ' on' : ''}" data-act="tool" data-tool="${k}" role="tab" aria-selected="${st.tool === k}">${t}</button>`).join('')}</div>`;
  let tool = '';
  if (st.tool === 'kin') {
    tool = `<div class="pair"><label>${L('Profil ou haplotype A', 'Profile or haplotype A')}<select class="input" data-f="kinA">${itemOptions(['auto', 'y', 'mt'], st.kinA)}</select></label>
      <label>${L('Profil ou haplotype B', 'Profile or haplotype B')}<select class="input" data-f="kinB">${itemOptions(['auto', 'y', 'mt'], st.kinB)}</select></label></div>
      <div class="controls mt"><button class="btn btn-primary" data-act="kin">${L('Comparer', 'Compare')}</button></div>${kinOutHtml()}`;
  } else if (st.tool === 'cons') {
    const ps = autos().filter(p => !p.derived);
    tool = `<p class="muted-note">${L('Cochez au moins deux profils autosomaux (idéalement des réplicats du même scellé), puis ajoutez une colonne consensus : c’est à vous de choisir, locus par locus, les allèles à retenir dans le tableau ci-dessus.', 'Tick at least two autosomal profiles (ideally replicates of the same exhibit), then add a consensus column: it is up to you to choose, locus by locus, which alleles to keep in the table above.')}</p>` +
      (ps.length ? ps.map(p => `<label class="chk"><input type="checkbox" data-f="cons" data-id="${p.id}"${st.consSel[p.id] ? ' checked' : ''}> ${esc(resLabel(p))} — ${p.complete}/${N_AUTO}</label>`).join('') : `<p class="muted-note">${L('Aucun profil autosomal.', 'No autosomal profile.')}</p>`) +
      `<div class="controls mt"><button class="btn btn-primary" data-act="cons"${ps.length < 2 ? ' disabled' : ''}>${L('Ajouter une colonne consensus', 'Add a consensus column')}</button></div>` + consOutHtml();
  } else {
    tool = `<label>${L('Profil ou haplotype', 'Profile or haplotype')}<select class="input" data-f="rmp">${itemOptions(['auto', 'y', 'mt'], st.rmpSel)}</select></label>
      <div class="controls mt"><button class="btn btn-primary" data-act="rmp">${L('Calculer', 'Compute')}</button></div>${rmpOutHtml()}`;
  }
  let rev = '';
  if (st.revealed) {
    const r = buildReveal(c, { results: st.results });
    rev = `<div class="feedback show info reveal" role="status"><strong>${L('Ce que l’on pouvait conclure', 'What could be concluded')}</strong>` +
      r.items.map(it => `<h3>${esc(pick(it.header))}</h3><h4>${L('Avec vos résultats', 'With your results')}</h4>${it.yours.map(p => `<p>${esc(pick(p))}</p>`).join('')}<h4>${L('Avec des profils complets (référence de la simulation)', 'With complete profiles (simulation reference)')}</h4>${it.complete.map(p => `<p>${esc(pick(p))}</p>`).join('')}`).join('') +
      `<p class="mt"><em>${esc(pick(r.closing))}</em></p></div>`;
  }
  $('s6').innerHTML = `<h2>${L('6 · Résultats et interprétation', '6 · Results and interpretation')}</h2>
    ${profileTable()}${hapTable()}${ngsBlock()}
    <h3>${L('Outils', 'Tools')}</h3>${tabsHtml}<div class="tool">${tool}</div>
    <div class="controls mt"><button class="btn btn-ghost" data-act="reveal"${st.revealed ? ' disabled' : ''}>${L('Révéler la réponse', 'Reveal the answer')}</button></div>${rev}`;
}

/* ---------- page ---------- */
function render() {
  document.title = L('Dossier complet simplifié — Exercice', 'Simplified full case — Exercise');
  $('seed').textContent = `${L('Cas', 'Case')} ${c.seed}`;
  $('steps').innerHTML = STEPS.map(([fr, en], i) => `<li class="${i + 1 < st.stage ? 'done' : i + 1 === st.stage ? 'now' : ''}">${L(fr, en)}</li>`).join('');
  for (let i = 1; i <= 6; i++) $('s' + i).classList.toggle('hidden', i > st.stage);
  renderReq(); renderQuote();
  if (st.stage >= 3) renderSampling();
  if (st.stage >= 4) renderQuant();
  if (st.stage >= 5) renderAmp();
  if (st.stage >= 6) renderResults();
}
function go(stage) {
  st.stage = Math.max(st.stage, stage);
  render();
  $('s' + stage).scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/* ---------- actions ---------- */
const actions = {
  toQuote() { go(2); },
  ask() { if (c.needsInfo) st.asked = true; else st.askedClear = true; render(); },
  chkQuote() { st.checks[2] = true; st.checks.quoteEmpty = false; render(); },
  okQuote() {
    if (!quoteTotal(st.quote)) { st.checks.quoteEmpty = true; render(); return; }
    st.checks.quoteEmpty = false; st.quoteLocked = true; go(3);
  },
  chkSamp() { st.checks[3] = true; st.checks.sampEmpty = false; render(); },
  okSamp() {
    const out = [];
    for (const s of c.scelles) (st.sampling[s.id] || []).forEach((site, k) => { if (site && k < (budget()[s.id] || 0)) out.push(doExtraction(c, s.id, site, k)); });
    if (!out.length) { st.checks.sampEmpty = true; render(); return; }
    st.checks.sampEmpty = false; st.extracts = out; st.samplingLocked = true; go(4);
  },
  quant() { st.quantified = true; go(5); },
  chkAmp() { st.checks[5] = true; render(); },
  runAmp() {
    const counters = { auto: 0, y: 0, mt: 0, ngs: 0 }, prefix = { auto: 'P', y: 'H', mt: 'H', ngs: 'N' };
    st.results = [];
    for (const sl of slots()) {
      const ex = st.extracts.find(e => e.id === st.assign[sl.key] && e.scelleId === sl.scelleId);
      if (!ex) continue;
      const r = runSlot(c, sl, ex);
      r.id = prefix[sl.kind] + (++counters[sl.kind === 'mt' ? 'y' : sl.kind]); r.slotIndex = sl.index; r.slotOf = sl.of;
      st.results.push(r);
    }
    st.ampLocked = true; go(6);
  },
  tool(el) { st.tool = el.dataset.tool; render(); },
  kin() { st.kinOut = st.kinA && st.kinB ? { a: st.kinA, b: st.kinB } : null; render(); },
  rmp() { st.rmpOut = st.rmpSel || null; render(); },
  cons() {
    const picked = autos().filter(p => !p.derived && st.consSel[p.id]);
    if (picked.length < 2) return;
    const id = 'C' + (st.consLog.length + 1), warn = [];
    if (new Set(picked.map(p => p.scelleId)).size > 1) warn.push('mixed');
    for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) if (compareProfiles(picked[i], picked[j]).discordant >= 3 && !warn.includes('discordant')) warn.push('discordant');
    const ids = [...new Set(picked.map(p => p.scelleId))];
    const col = profileFromCalls({ derived: 'consensus', id, scelleId: ids.length === 1 ? ids[0] : null, sources: picked.map(p => p.id), calls: {}, differential: picked.every(p => p.differential) }, {}, picked.map(p => p.sex).find(Boolean) || null);
    st.results.push(col);
    st.consLog.push({ id, from: col.sources, warn });
    st.consSel = {};
    render();
  },
  consCheck(el) { st.consCheck[el.dataset.id] = true; render(); },
  reveal() { st.revealed = true; render(); }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const fn = actions[b.dataset.act];
  if (fn) { track('full-case/' + (b.dataset.act === 'tool' ? 'tool-' + b.dataset.tool : b.dataset.act)); fn(b); }
});
document.addEventListener('change', e => {
  const f = e.target.dataset && e.target.dataset.f; if (!f) return;
  const v = e.target.value;
  if (f === 'quote') { if (st.quoteLocked) return; const id = e.target.closest('.sc').dataset.id; if (v) st.quote[id] = v; else delete st.quote[id]; st.checks.quoteEmpty = false; }
  else if (f === 'site') { if (st.samplingLocked) return; const id = e.target.closest('.sc').dataset.id; const arr = st.sampling[id] = st.sampling[id] || []; arr[Number(e.target.dataset.k)] = v; st.checks.sampEmpty = false; }
  else if (f === 'assign') { if (st.ampLocked) return; st.assign[e.target.dataset.slot] = v; }
  else if (f === 'kinA') st.kinA = v;
  else if (f === 'kinB') st.kinB = v;
  else if (f === 'rmp') st.rmpSel = v;
  else if (f === 'cons') { st.consSel[e.target.dataset.id] = e.target.checked; return; }
  else if (f === 'ccall') {
    const idx = st.results.findIndex(r => r.id === e.target.dataset.id), col = st.results[idx];
    const calls = { ...col.calls }, cell = (calls[e.target.dataset.locus] || ['', '']).slice();
    cell[Number(e.target.dataset.i)] = v === '' ? '' : Number(v);
    calls[e.target.dataset.locus] = cell;
    st.results[idx] = profileFromCalls({ derived: 'consensus', id: col.id, scelleId: col.scelleId, sources: col.sources, calls, differential: col.differential }, calls, col.sex);
  }
  render();
});
$('newCase').addEventListener('click', () => newCase());
document.addEventListener('langchange', () => { if (c) render(); });

const qp = new URLSearchParams(location.search);
const tpl = qp.get('template'), variant = qp.get('variant');
newCase({ ...(TEMPLATES.includes(tpl) ? { template: tpl } : {}), ...(variant === 'clear' || variant === 'vague' ? { variant } : {}) });
