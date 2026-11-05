/* ============================================================
   Trial-exam renderer (issue #108): pure functions returning HTML strings.
   renderSheet(): what the student receives (never contains an answer).
   renderKey():   the corrigé and marking scheme, printed separately.
   Bilingual FR/EN; black-and-white friendly (no colour carries meaning).
   ============================================================ */
import { LETTERS, SPEC, packageTable, PACKAGES, DIFFERENTIAL_NOTICE } from './exam.js';

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const pt = (lang, x) => { const s = String(Math.round(x * 100) / 100); return (lang === 'fr' ? s.replace('.', ',') : s) + (lang === 'fr' ? ' pt' : ' pt') + (x > 1 ? 's' : ''); };
const tt = (lang, o) => (o && typeof o === 'object' ? o[lang] : o);
const lines = n => '<div class="lines">' + '<i></i>'.repeat(n) + '</div>';

const L = {
  title: { fr: 'Examen blanc — Identification génétique', en: 'Trial exam — Genetic identification' },
  course: { fr: 'Master Éthique — Parcours Médecine légale et criminalistique', en: 'Master in Ethics — Forensic Medicine & Criminalistics track' },
  duration: { fr: 'Durée : 30 minutes', en: 'Duration: 30 minutes' },
  version: { fr: 'Version', en: 'Version' },
  name: { fr: 'Nom, prénom :', en: 'Name:' }, date: { fr: 'Date :', en: 'Date:' }, mark: { fr: 'Note : …… / 20', en: 'Mark: …… / 20' },
  rules: { fr: 'Une seule réponse correcte par question de QCM : cochez une case. Pas de point négatif. Les points sont indiqués entre parenthèses.', en: 'One correct answer per MCQ: tick one box. No negative marking. Points are shown in brackets.' },
  p1: { fr: 'Partie 1 — Questions de cours (QCM)', en: 'Part 1 — Course questions (MCQ)' },
  ex1: { fr: 'Exercice 1 — Profil consensus', en: 'Exercise 1 — Consensus profile' },
  ex2: { fr: 'Exercice 2 — Devis à partir d’une réquisition', en: 'Exercise 2 — Quote from a requisition' },
  correction: { fr: 'Corrigé et barème', en: 'Answer key and marking scheme' },
  seed: { fr: 'Graine', en: 'Seed' }
};
const l = (lang, k) => L[k][lang];

/* ---------------- student sheet ---------------- */
function header(exam, lang, o) {
  return `<header class="exam-head">
    <div class="eh-top"><strong>${esc(o.title || l(lang, 'title'))}</strong><span>${l(lang, 'version')} ${esc(o.letter)}</span></div>
    <div class="eh-sub">${esc(l(lang, 'course'))}${o.teacher ? ' — ' + esc(o.teacher) : ''} · ${l(lang, 'duration')} · /${SPEC.points}</div>
    <div class="eh-id"><span>${l(lang, 'name')} ………………………………………………………</span><span>${l(lang, 'date')} ……………………</span><span class="mark">${l(lang, 'mark')}</span></div>
    <p class="eh-rules">${esc(l(lang, 'rules'))}${o.rules ? ' ' + esc(o.rules) : ''}</p>
  </header>`;
}

function mcqBlock(exam, lang) {
  return `<section class="part"><h2>${l(lang, 'p1')} <span class="pts">(${pt(lang, exam.mcqPoints)} — ${exam.mcq.length} × ${pt(lang, SPEC.mcqEach)})</span></h2>
    <ol class="mcq">${exam.mcq.map(q => `<li><div class="stem">${esc(tt(lang, q.q))}</div><ul class="opts">${q.choices.map((c, k) => `<li><span class="box"></span> <b>${LETTERS[k]}.</b> ${esc(tt(lang, c))}</li>`).join('')}</ul></li>`).join('')}</ol></section>`;
}

function consensusBlock(e, lang) {
  const rule = lang === 'fr'
    ? 'Un même individu (' + e.person + ') a été analysé dans deux expériences (E1, E2), chacune en deux amplifications (A1, A2). « - » signifie qu’aucun allèle n’a été caractérisé. On considère que l’amplification est fiable à un locus si un allèle a été caractérisé au moins deux fois (pour un homozygote : si un seul allèle a été caractérisé au moins deux fois et qu’aucun autre allèle n’est présent). Notez entre parenthèses les allèles incertains et un homozygote sous la forme a/a.'
    : 'One individual (' + e.person + ') was analysed in two experiments (E1, E2), each in two amplifications (A1, A2). “-” means that no allele was characterised. Amplification is considered reliable at a locus if an allele was characterised at least twice (for a homozygote: if a single allele was characterised at least twice and no other allele is present). Write uncertain alleles in brackets and a homozygote as a/a.';
  const head = `<tr><th>${lang === 'fr' ? 'Expérience' : 'Experiment'}</th>${e.loci.map(x => `<th>${esc(x)}</th>`).join('')}</tr>`;
  return `<section class="part"><h2>${l(lang, 'ex1')} <span class="pts">(${pt(lang, e.points)})</span></h2>
    <p>${esc(rule)}</p>
    <table class="tbl"><thead>${head}</thead><tbody>${e.rows.map(r => `<tr><td class="l">${esc(e.person)} · ${esc(r.label)}</td>${r.cells.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}
      <tr class="answer"><td class="l"><b>${lang === 'fr' ? 'Profil consensus' : 'Consensus profile'}</b></td>${e.loci.map(() => '<td></td>').join('')}</tr></tbody></table>
    <p><b>a.</b> ${lang === 'fr' ? 'Établissez le profil consensus dans la dernière ligne du tableau.' : 'Establish the consensus profile in the last row of the table.'} <span class="pts">(${pt(lang, e.perLocus * e.loci.length)} — ${lang === 'fr' ? '1 pt par locus' : '1 pt per locus'})</span></p>
    <p><b>b.</b> ${lang === 'fr' ? 'Quel phénomène peut expliquer qu’un allèle ne soit observé qu’une seule fois sur les quatre amplifications ?' : 'Which phenomenon can explain why an allele is observed only once in the four amplifications?'} <span class="pts">(${pt(lang, e.q2)})</span></p>${lines(3)}</section>`;
}

function packageGrid(lang) {
  return `<table class="tbl pkg"><thead><tr><th class="l">${lang === 'fr' ? 'Proposition' : 'Proposal'}</th><th class="l">${lang === 'fr' ? 'Contenu' : 'Content'}</th></tr></thead><tbody>${packageTable().map(p => `<tr><td class="l"><b>${esc(tt(lang, p.label))}</b></td><td class="l">${esc(tt(lang, p.detail))}</td></tr>`).join('')}</tbody></table>`;
}

function quoteBlock(e, lang) {
  const clear = !e.needsInfo, notice = esc(tt(lang, DIFFERENTIAL_NOTICE));
  const scelles = `<table class="tbl"><thead><tr><th>n°</th><th class="l">${lang === 'fr' ? 'Scellé' : 'Exhibit'}</th><th class="l">${lang === 'fr' ? 'Nature' : 'Nature'}</th></tr></thead><tbody>${e.lines.map(x => `<tr><td>${x.no}</td><td class="l">${esc(tt(lang, x.title))}</td><td class="l">${esc(tt(lang, x.nature))}${clear && x.differential ? `<div class="note">${notice}</div>` : ''}</td></tr>`).join('')}</tbody></table>`;
  // A vague requisition: the requester's answer is simply part of question b (no instruction on the order of reading).
  const reply = !clear ? `<p class="replytext">${lang === 'fr' ? 'Le requérant vous répond' : 'The requester replies'} : « ${esc(tt(lang, e.clarification))} »${e.lines.some(x => x.differential) ? `<span class="note"> ${notice}</span>` : ''}</p>` : '';
  const quoteTable = `<table class="tbl answer-q"><thead><tr><th>n°</th><th class="l">${lang === 'fr' ? 'Proposition retenue (ou « non pris en charge »)' : 'Chosen proposal (or “not taken on”)'}</th></tr></thead><tbody>${e.lines.map(x => `<tr><td>${x.no}</td><td class="tall"></td></tr>`).join('')}</tbody></table>`;
  return `<section class="part"><h2>${l(lang, 'ex2')} <span class="pts">(${pt(lang, e.points)})</span></h2>
    <div class="req">${esc(tt(lang, e.requisition))}</div>${scelles}
    <p class="small">${lang === 'fr' ? 'Contenu des propositions (grille pédagogique fictive). Chaque scellé reçoit au plus une proposition.' : 'Content of the proposals (fictional teaching grid). Each exhibit gets at most one proposal.'}</p>${packageGrid(lang)}
    <p><b>a.</b> ${lang === 'fr' ? 'Cette réquisition suffit-elle pour établir le devis ? Sinon, quelle information demanderiez-vous au requérant ?' : 'Is this requisition enough to draw up the quote? If not, what information would you ask the requester for?'} <span class="pts">(${pt(lang, e.pointsAsk)})</span></p>${lines(3)}
    <p><b>b.</b> ${lang === 'fr' ? 'Établissez le devis : pour chaque scellé, indiquez la proposition retenue.' : 'Draw up the quote: for each exhibit, give the proposal chosen.'} <span class="pts">(${pt(lang, e.pointsQuote)})</span></p>${reply}${quoteTable}</section>`;
}

export function renderSheet(exam, lang, o = {}) {
  return `<article class="exam" data-seed="${esc(exam.seed)}">
    <div class="page">${header(exam, lang, o)}${mcqBlock(exam, lang)}</div>
    <div class="page">${consensusBlock(exam.exercises[0], lang)}</div>
    <div class="page">${quoteBlock(exam.exercises[1], lang)}</div>
    <footer class="exam-foot">${l(lang, 'version')} ${esc(o.letter)} · ${l(lang, 'seed')} ${esc(exam.seed)}</footer></article>`;
}

/* ---------------- corrigé ---------------- */
function keyConsensus(e, lang) {
  const why = k => {
    const c = k.counts.map(([a, n]) => `${a}×${n}`).join(', ') || '—';
    const how = { hom: lang === 'fr' ? 'un seul allèle, caractérisé ≥ 2 fois, aucun autre : homozygote fiable' : 'one allele, characterised ≥ 2 times, no other: reliable homozygote', het: lang === 'fr' ? 'deux allèles caractérisés ≥ 2 fois' : 'two alleles characterised ≥ 2 times',
      partial: lang === 'fr' ? 'un allèle fiable, un allèle vu une seule fois (entre parenthèses)' : 'one reliable allele, one seen only once (in brackets)', uncertain: lang === 'fr' ? 'aucun allèle caractérisé deux fois : tout est incertain' : 'no allele characterised twice: everything is uncertain', none: lang === 'fr' ? 'aucun résultat' : 'no result' }[k.kind];
    return `${esc(c)} — ${how}`;
  };
  return `<h3>${l(lang, 'ex1')} (${pt(lang, e.points)})</h3>
    <table class="tbl"><thead><tr><th class="l">${lang === 'fr' ? 'Locus' : 'Locus'}</th><th>${lang === 'fr' ? 'Profil attendu' : 'Expected'}</th><th class="l">${lang === 'fr' ? 'Alléles × occurrences — règle appliquée' : 'Alleles × occurrences — rule applied'}</th></tr></thead><tbody>${e.key.map(k => `<tr><td class="l">${esc(k.locus)}</td><td><b>${esc(k.text)}</b></td><td class="l">${why(k)}</td></tr>`).join('')}</tbody></table>
    <p><b>a.</b> ${lang === 'fr' ? '1 pt par locus exact ; 0,5 pt si les allèles sont justes mais que la fiabilité est mal notée (parenthèses ou homozygote a/a).' : '1 pt per exact locus; 0.5 pt if the alleles are right but reliability is mis-noted (brackets or homozygote a/a).'} <b>b.</b> ${lang === 'fr' ? '1 pt : perte d’allèle (drop-out), effet stochastique à faible quantité d’ADN ; un allèle vu une fois reste incertain tant qu’il n’est pas reproduit.' : '1 pt: allele drop-out, a stochastic effect at low DNA quantity; an allele seen once stays uncertain until it is reproduced.'}</p>
    <p class="small">${lang === 'fr' ? 'La règle donne « homozygote » quand un seul allèle est reproduit : seules des amplifications supplémentaires pourraient écarter un second allèle perdu.' : 'The rule gives “homozygote” when a single allele is reproduced: only further amplifications could rule out a lost second allele.'}</p>`;
}
function keyQuote(e, lang) {
  const rows = e.lines.map(x => {
    const ans = x.need ? `<b>${esc(tt(lang, PACKAGES[x.need].label))}</b><div class="small">${esc(tt(lang, PACKAGES[x.need].detail))}</div>` : `<b>${lang === 'fr' ? 'Non pris en charge' : 'Not taken on'}</b><div class="small">${esc(x.reason ? tt(lang, x.reason) : (lang === 'fr' ? 'Hors de la demande.' : 'Outside the request.'))}</div>`;
    return `<tr><td>${x.no}</td><td class="l">${esc(tt(lang, x.title))}</td><td class="l">${ans}</td><td>${pt(lang, e.pointsPerLine)}</td></tr>`;
  }).join('');
  const a = e.needsInfo
    ? (lang === 'fr' ? `<b>Non</b> : une information décisive manque. Réponse du requérant attendue : « ${esc(tt(lang, e.clarification))} » — 1 pt pour reconnaître qu’il faut demander, 1 pt pour la bonne information.` : `<b>No</b>: a decisive piece of information is missing. Expected reply: “${esc(tt(lang, e.clarification))}” — 1 pt for recognising that a question is needed, 1 pt for the right information.`)
    : (lang === 'fr' ? `<b>Oui</b> : la réquisition est claire, le devis peut être établi sans question. 1 pt pour la conclusion, 1 pt pour la justification (les faits décisifs sont énoncés). Poser une question n’est pas une faute, mais n’est pas nécessaire.` : `<b>Yes</b>: the requisition is clear and the quote can be drawn up without a question. 1 pt for the conclusion, 1 pt for the justification (the decisive facts are stated). Asking is not a mistake but is not needed.`);
  return `<h3>${l(lang, 'ex2')} (${pt(lang, e.points)})</h3>
    <p><b>a.</b> (${pt(lang, e.pointsAsk)}) ${a}</p>
    <table class="tbl"><thead><tr><th>n°</th><th class="l">${lang === 'fr' ? 'Scellé' : 'Exhibit'}</th><th class="l">${lang === 'fr' ? 'Réponse attendue' : 'Expected answer'}</th><th>${lang === 'fr' ? 'Points' : 'Points'}</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="small"><b>b.</b> ${lang === 'fr' ? 'Points par scellé : tout ou rien sur la proposition retenue.' : 'Points per exhibit: all or nothing on the proposal chosen.'}</p>`;
}

export function renderKey(exam, lang, o = {}) {
  const grid = exam.mcq.map((q, i) => `<tr><td>${i + 1}</td><td><b>${LETTERS[q.correct]}</b></td><td class="l">${esc(tt(lang, q.choices[q.correct]))}</td></tr>`).join('');
  return `<article class="exam key" data-seed="${esc(exam.seed)}"><div class="page">
    <header class="exam-head"><div class="eh-top"><strong>${l(lang, 'correction')}</strong><span>${l(lang, 'version')} ${esc(o.letter)}</span></div>
    <div class="eh-sub">${esc(o.title || l(lang, 'title'))} · ${l(lang, 'seed')} ${esc(exam.seed)} · /${SPEC.points} · ≈ ${Math.round(exam.minutes)} min</div></header>
    <h3>${l(lang, 'p1')} (${pt(lang, exam.mcqPoints)} — ${pt(lang, SPEC.mcqEach)} ${lang === 'fr' ? 'par bonne réponse, 0 sinon' : 'per correct answer, 0 otherwise'})</h3>
    <p class="keyline">${exam.mcq.map((q, i) => `${i + 1}${LETTERS[q.correct]}`).join(' · ')}</p>
    <table class="tbl"><thead><tr><th>n°</th><th>${lang === 'fr' ? 'Rép.' : 'Ans.'}</th><th class="l">${lang === 'fr' ? 'Réponse correcte' : 'Correct answer'}</th></tr></thead><tbody>${grid}</tbody></table>
    ${keyConsensus(exam.exercises[0], lang)}${keyQuote(exam.exercises[1], lang)}</div></article>`;
}
