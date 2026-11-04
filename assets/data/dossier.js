/* ============================================================
   Dossier complet — exercice combiné (réquisition → devis → prélèvement →
   quantification → amplification → profils → interprétation).

   Pure ES module shared by the browser (assets/dossier-ui.js) and the Node
   self-test (tools/dossier-selftest.mjs). Bilingual {fr,en}.

   WHAT THIS EXERCISE IS. A simplified, ungraded walk through a whole case.
   The student reads a réquisition (complete or vague; the "clarification"
   button can be used on any réquisition and merely informs when the text was
   already clear), proposes a quote scellé by scellé from seven packages,
   samples each scellé with the extractions the quote allows, quantifies,
   chooses which extract feeds each analysis, then receives profiles and
   simplified haplotypes (a code plus a quality percentage). Kinship,
   consensus and random-match tools are available; there is NO conclusion
   box and NO score — a "reveal" box states what could have been concluded,
   always as a comparison of profiles, never as a statement about the case.

   ASSUMPTIONS (teaching values, pending the maintainer's scientific review —
   see docs/dossier.md): prices and package contents are the ones specified
   by the maintainer; concentrations, degradation, drop-out thresholds and the
   ancestry / phenotype model are invented teaching values; no mixtures are
   modelled (each site carries ONE source); where sperm is present or possible
   the differential extraction is automatic and only the sperm fraction is
   amplified (carry-over of the complainant's DNA is NOT simulated, see #104); the
   random-match calculation uses approximate European allele frequencies
   (assets/epg/frequencies.js) without a co-ancestry correction.

   The réquisition texts, vague/clear variants and clarifications of the
   identification, sexual-assault and flat-items cases come from the quote
   simulator (assets/data/devis.js, itself fed by requisition-shared.js);
   requisition-shared.js must be loaded first (globalThis.REQUISITION_SHARED).
   ============================================================ */
import { makeRng } from '../epg/rng.js';
import { getKit } from '../epg/panels.js';
import { alleleFrequencies } from '../epg/frequencies.js';
import * as G from '../epg/genetics.js';
import { simulate } from '../epg/simulate.js';
import { makeCase as makeDevisCase, expectedLine, text } from './devis.js';

const GF = getKit('globalfiler');
const YF = getKit('yfilerplus');
const AUTO_LOCI = GF.loci.filter(l => !l.type);          // 21 autosomal STR
const AMEL = GF.loci.find(l => l.type === 'amel');
export const N_AUTO = AUTO_LOCI.length;
export const N_Y = YF.loci.length;                        // 25 Y-STR markers
export const MT_SITES = 24, MT_AMPLICONS = 8;             // mtDNA: 24 variable sites in 8 amplicons

function shared() {
  const S = globalThis.REQUISITION_SHARED;
  if (!S) throw new Error('requisition-shared.js must be loaded first (globalThis.REQUISITION_SHARED)');
  return S;
}

/* ---------------- Packages (maintainer-specified) ---------------- */
// slots = the analyses a package pays for. base: trace | ref | orient; lineage: y | mt | null.
export const PACKAGES = {
  trace:   { price: 100, base: 'trace',  lineage: null, extractions: 2, quantifications: 2, slots: ['auto', 'auto'],
             label: text('Trace', 'Trace'),
             detail: text('deux extractions, deux quantifications, deux profils STR autosomaux', 'two extractions, two quantifications, two autosomal STR profiles') },
  ref:     { price: 50,  base: 'ref',    lineage: null, extractions: 1, quantifications: 1, slots: ['auto'],
             label: text('Référence', 'Reference'),
             detail: text('une extraction, une quantification, un profil STR autosomal', 'one extraction, one quantification, one autosomal STR profile') },
  traceY:  { price: 100, base: 'trace',  lineage: 'y', extractions: 2, quantifications: 2, slots: ['auto', 'auto', 'y'],
             label: text('Trace — autosomaux + STR-Y', 'Trace — autosomal + Y-STR'),
             detail: text('deux extractions, deux quantifications, deux profils STR autosomaux, un haplotype STR-Y', 'two extractions, two quantifications, two autosomal STR profiles, one Y-STR haplotype') },
  refY:    { price: 50,  base: 'ref',    lineage: 'y', extractions: 1, quantifications: 1, slots: ['auto', 'y'],
             label: text('Référence — autosomaux + STR-Y', 'Reference — autosomal + Y-STR'),
             detail: text('une extraction, une quantification, un profil STR autosomal, un haplotype STR-Y', 'one extraction, one quantification, one autosomal STR profile, one Y-STR haplotype') },
  traceMt: { price: 600, base: 'trace',  lineage: 'mt', extractions: 2, quantifications: 2, slots: ['auto', 'mt'],
             label: text('Trace — autosomaux + mtDNA', 'Trace — autosomal + mtDNA'),
             detail: text('deux extractions, deux quantifications, un profil STR autosomal, un haplotype mitochondrial complet', 'two extractions, two quantifications, one autosomal STR profile, one complete mitochondrial haplotype') },
  refMt:   { price: 400, base: 'ref',    lineage: 'mt', extractions: 1, quantifications: 1, slots: ['auto', 'mt'],
             label: text('Référence — autosomaux + mtDNA', 'Reference — autosomal + mtDNA'),
             detail: text('une extraction, une quantification, un profil STR autosomal, un haplotype mitochondrial complet', 'one extraction, one quantification, one autosomal STR profile, one complete mitochondrial haplotype') },
  orient:  { price: 400, base: 'orient', lineage: null, extractions: 2, quantifications: 2, slots: ['ngs'],
             label: text('Orientation', 'Orientation'),
             detail: text('deux extractions, deux quantifications, un run NGS pour les marqueurs de l’ancestralité et du phénotype', 'two extractions, two quantifications, one NGS run for ancestry and phenotype markers') }
};
export const PACKAGE_ORDER = ['trace', 'ref', 'traceY', 'refY', 'traceMt', 'refMt', 'orient'];
export const packageType = (base, lineage) => base === 'orient' ? 'orient' : base + (lineage === 'y' ? 'Y' : lineage === 'mt' ? 'Mt' : '');

export const quoteTotal = quote => Object.values(quote || {}).reduce((s, t) => s + (PACKAGES[t] ? PACKAGES[t].price : 0), 0);
export const extractionBudget = quote => Object.fromEntries(Object.entries(quote || {}).filter(([, t]) => PACKAGES[t]).map(([id, t]) => [id, PACKAGES[t].extractions]));

/* ---------------- Persons (hidden truth) ---------------- */
const rndMt = rng => Array.from({ length: MT_SITES }, () => rng.bool(0.2) ? rng.pick(['A', 'C', 'G', 'T']) : '.');
function syncDys391(p) { if (p.y) p.auto.geno.DYS391 = p.y.geno.DYS391.slice(); return p; }
export function newPerson(rng, sex) {
  sex = sex || (rng.bool() ? 'M' : 'F');
  return syncDys391({ sex, auto: G.randomProfile(GF, rng, { sex }), y: sex === 'M' ? G.randomProfile(YF, rng, { sex: 'M' }) : null, mt: rndMt(rng) });
}
// Child of father × mother: autosomes by Mendelian sampling, Y from the father (rare 1-step mutation), mtDNA from the mother.
export function childOf(rng, father, mother, sex) {
  sex = sex || (rng.bool() ? 'M' : 'F');
  return syncDys391({
    sex, auto: G.offspring(GF, father.auto, mother.auto, rng, { sex }),
    y: sex === 'M' ? G.offspring(YF, father.y, null, rng, { sex: 'M', yMutation: 0.002 }) : null,
    mt: mother.mt.slice()
  });
}

/* ---------------- Small numeric helpers ---------------- */
const logUniform = (rng, [a, b]) => Math.exp(rng.range(Math.log(a), Math.log(b)));
const round = (x, d) => { const m = 10 ** d; return Math.round(x * m) / m; };
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
function hashCode(str, prefix) { // FNV-1a, shown as a short code
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return prefix + '-' + hex.slice(0, 4) + '-' + hex.slice(4);
}

/* ---------------- Sampling sites ---------------- */
// role: 'target' (carries the DNA of interest), 'secondary' (other DNA, little informative), 'blank' (no DNA).
const site = (id, fr, en, role, source, conc, di) => ({ id, label: text(fr, en), role, source, conc, di });
const single = (fr, en, source, conc = [0.4, 3.0], di = [1.0, 1.4]) => [site('main', fr, en, 'target', source, conc, di)];
const BLANK = [0.0001, 0.003];
const objectSites = (source, targetFr, targetEn, otherFr, otherEn, conc) => [
  site('target', targetFr, targetEn, 'target', source, conc || [0.002, 0.3], [1.0, 5.0]),
  site('blank', otherFr || 'Zone non touchée (témoin)', otherEn || 'Untouched area (control)', 'blank', null, BLANK, [1.0, 1.2])
];

/* ---------------- Ancestry / phenotype (teaching model) ---------------- */
export const ANCESTRY = [
  { id: 'EUR', label: text('Europe', 'Europe') },
  { id: 'AFR', label: text('Afrique subsaharienne', 'Sub-Saharan Africa') },
  { id: 'EAS', label: text('Asie de l’Est', 'East Asia') },
  { id: 'SAS', label: text('Asie du Sud', 'South Asia') },
  { id: 'AMR', label: text('Amérique (populations autochtones)', 'Americas (indigenous populations)') }
];
export const PHENO = {
  eyes: { label: text('Couleur des yeux', 'Eye colour'), cats: [['blue', 'bleus', 'blue'], ['inter', 'intermédiaires', 'intermediate'], ['brown', 'bruns', 'brown']] },
  hair: { label: text('Couleur des cheveux', 'Hair colour'), cats: [['blond', 'blonds', 'blond'], ['brown', 'bruns', 'brown'], ['red', 'roux', 'red'], ['black', 'noirs', 'black']] },
  skin: { label: text('Teinte de peau', 'Skin shade'), cats: [['light', 'claire', 'light'], ['inter', 'intermédiaire', 'intermediate'], ['dark', 'foncée', 'dark']] }
};
const PHENO_DIST = { // by main ancestry; order follows PHENO cats
  eyes: { EUR: [.40, .15, .45], _: [.02, .03, .95] },
  hair: { EUR: [.20, .50, .05, .25], _: [.01, .09, 0, .90] },
  skin: { EUR: [.55, .40, .05], AFR: [.01, .14, .85], EAS: [.10, .80, .10], SAS: [.02, .55, .43], AMR: [.05, .80, .15] }
};
const phenoDist = (trait, anc) => PHENO_DIST[trait][anc] || PHENO_DIST[trait]._;
function newGenome(rng) { // ancestry vector + phenotype of one simulated person
  const main = rng.weightedPick(ANCESTRY.map(a => a.id), [6, 1.2, 1, 1, 0.8]);
  const share = rng.range(0.82, 0.99);
  const other = rng.pick(ANCESTRY.map(a => a.id).filter(i => i !== main));
  const anc = Object.fromEntries(ANCESTRY.map(a => [a.id, a.id === main ? share : a.id === other ? 1 - share : 0]));
  const pheno = {};
  for (const [t, def] of Object.entries(PHENO)) pheno[t] = rng.weightedPick(def.cats.map(c => c[0]), phenoDist(t, main));
  return { main, anc, pheno };
}

/* ---------------- Case catalogue ---------------- */
export const TEMPLATES = ['id-parent', 'id-uncle', 'id-maternal-aunt', 'sa-ejaculation', 'misc-flat', 'trace-suspect', 'orientation'];
const DEVIS_BASED = new Set(['id-parent', 'id-uncle', 'id-maternal-aunt', 'sa-ejaculation', 'misc-flat']);
const FLAT_PERSONAL = new Set(['dent', 'razo', 'peig', 'casq']);

const joinT = (...p) => text(p.map(x => x.fr).join(''), p.map(x => x.en).join(''));

function needFromDevis(s, relation) {
  const e = expectedLine(s, relation);
  if (!e.analyse) return null;
  // A muscle / organ fragment is quoted as a Trace (two extractions), not as a reference sample (#86).
  return packageType(s.trace || s.material === 'tissue' ? 'trace' : 'ref', e.y ? 'y' : e.mt ? 'mt' : null);
}

function buildFromDevis(rng, templateId, variant) {
  const dc = makeDevisCase(rng.int(1, 2 ** 30), { template: templateId, variant, deadline: 'normal' });
  const persons = {}, sites = {}, reasons = {}, comparisons = [];
  const doe = templateId === 'sa-ejaculation' ? null : templateId === 'misc-flat' ? 'body' : 'unk';
  const byId = Object.fromEntries(dc.scelles.map(s => [s.id, s]));
  const need = Object.fromEntries(dc.scelles.map(s => [s.id, needFromDevis(s, dc.relation)]));

  if (templateId === 'id-parent' || templateId === 'id-uncle' || templateId === 'id-maternal-aunt') {
    const relTitle = byId.r.title.fr;
    if (templateId === 'id-parent') {
      const parentSex = /\bMme\b/.test(relTitle) ? 'F' : 'M';
      const parent = newPerson(rng, parentSex), other = newPerson(rng, parentSex === 'M' ? 'F' : 'M');
      persons.rel = parent; persons.unk = childOf(rng, parentSex === 'M' ? parent : other, parentSex === 'M' ? other : parent);
    } else if (templateId === 'id-uncle') {
      const gf = newPerson(rng, 'M'), gm = newPerson(rng, 'F');
      const uncle = childOf(rng, gf, gm, 'M'), father = childOf(rng, gf, gm, 'M'), mother = newPerson(rng, 'F');
      persons.rel = uncle; persons.unk = childOf(rng, father, mother, 'M');
    } else {
      const gm = newPerson(rng, 'F'), gf = newPerson(rng, 'M');
      const aunt = childOf(rng, gf, gm, 'F'), mother = childOf(rng, gf, gm, 'F'), father = newPerson(rng, 'M');
      persons.rel = aunt; persons.unk = childOf(rng, father, mother);
    }
    sites.u = single('Fragment prélevé sur les restes', 'Fragment taken from the remains', 'unk', [1.0, 8.0], [1.0, 1.6]);
    sites.r = single('Écouvillon buccal (prélèvement reçu)', 'Cheek swab (sample received)', 'rel');
    comparisons.push({ kind: 'kinship', relation: templateId === 'id-parent' ? 'parent' : templateId === 'id-uncle' ? 'paternalUncle' : 'maternalAunt', a: 'u', b: 'r' });
  } else if (templateId === 'sa-ejaculation') {
    const p = dc.parties;
    persons.victim = newPerson(rng, p.victimSex); persons.author = newPerson(rng, p.authorSex);
    const slip = byId.slip, stainSource = slip.sperm === 'no' ? 'victim' : 'author';
    sites.slip = [
      site('stain', 'Gousset (zone souillée)', 'Gusset (stained area)', 'target', stainSource, [0.01, 0.6], [1.0, 4.0]),
      site('band', 'Élastique de taille (ADN de contact)', 'Waistband (touch DNA)', 'secondary', 'victim', [0.003, 0.05], [1.0, 3.0]),
      site('outer', 'Face externe propre (témoin)', 'Clean outer face (control)', 'blank', null, BLANK, [1.0, 1.2])
    ];
    // Sperm present or possible: the lab runs a differential extraction automatically and amplifies the sperm fraction only (#104).
    // The student makes no choice, and the possible carry-over of the complainant's DNA is not simulated: it is only a margin reminder.
    sites.slip[0].differential = stainSource === 'author';
    sites.refv = single('Écouvillon buccal de référence (prélèvement reçu)', 'Reference cheek swab (sample received)', 'victim');
    if (!byId.refv.relevant) reasons.refv = text('Le profil de la personne plaignante n’est pas demandé.', 'The complainant’s profile is not requested.');
    comparisons.push({ kind: 'single', a: 'slip' });
    if (need.refv) comparisons.push({ kind: 'match', a: 'slip', b: 'refv' });
  } else { // misc-flat
    persons.body = newPerson(rng);
    sites.corps = single('Fragment prélevé sur le corps', 'Fragment taken from the body', 'body', [1.0, 8.0], [1.0, 1.6]);
    let v = 0;
    for (const s of dc.scelles) {
      if (s.id === 'corps') continue;
      const personal = FLAT_PERSONAL.has(s.id);
      const key = personal ? 'body' : 'visitor' + (++v);
      if (!personal) persons[key] = newPerson(rng);
      sites[s.id] = objectSites(key, 'Zone d’usage', 'Area of use', 'Autre zone de l’objet', 'Other area of the item', [0.004, 0.4]);
      if (!personal) reasons[s.id] = text('Objet trouvé dans le salon, non rattaché à la personne à identifier.', 'Item found in the living room, not linked to the person to identify.');
      else comparisons.push({ kind: 'match', a: 'corps', b: s.id });
    }
  }
  return { dc, persons, sites, need, reasons, comparisons, doe };
}

/* ----- own templates: trace vs suspect, orientation ----- */
const OBJECTS = [
  ['knife', 'Couteau (manche)', 'Knife (handle)'], ['cap', 'Casquette (bandeau intérieur)', 'Cap (inner band)'],
  ['butt', 'Mégot de cigarette', 'Cigarette butt'], ['glass', 'Verre', 'Drinking glass'], ['glove', 'Gant (intérieur)', 'Glove (inside)']
];
const sc = (id, fr, en, natureFr, natureEn) => ({ id, title: text(fr, en), nature: text(natureFr, natureEn) });

function buildTraceSuspect(rng, variant) {
  const S = shared(), sex = rng.bool(0.8) ? 'M' : 'F', who = S.relative(rng, sex);
  const objs = rng.shuffle(OBJECTS).slice(0, rng.int(1, 2));
  const persons = { suspect: newPerson(rng, sex) }, sites = {}, comparisons = [], scelles = [], need = {};
  objs.forEach(([id, fr, en], i) => {
    const same = rng.bool(0.55);
    persons['t' + i] = same ? persons.suspect : newPerson(rng);
    scelles.push(sc(id, fr, en, 'Objet saisi sur les lieux ; une trace biologique y est recherchée.', 'Item seized at the scene; a biological trace is sought.'));
    sites[id] = objectSites('t' + i, 'Zone de contact', 'Contact area');
    need[id] = 'trace'; comparisons.push({ kind: 'match', a: id, b: 'ref' });
  });
  scelles.push(sc('ref', 'Écouvillon buccal de ' + who.full, 'Cheek swab of ' + (sex === 'F' ? 'Ms ' : 'Mr ') + who.first + ' ' + who.surname, 'Prélèvement de référence ' + (sex === 'F' ? 'de la mise en cause.' : 'du mis en cause.'), 'Reference sample of the person under investigation.'));
  sites.ref = single('Écouvillon buccal (prélèvement reçu)', 'Cheek swab (sample received)', 'suspect'); need.ref = 'ref';
  const base = text('Des objets ont été saisis sur les lieux d’une infraction. L’écouvillon buccal de référence ' + (sex === 'F' ? 'de la mise en cause ' : 'du mis en cause ') + who.full + ' est joint.',
    'Items were seized at the scene of an offence. The reference cheek swab of the person under investigation, ' + (sex === 'F' ? 'Ms ' : 'Mr ') + who.first + ' ' + who.surname + ', is attached.');
  const clar = text('Il faut rechercher un profil ADN sur chaque objet saisi et le comparer à celui de ' + who.full + '. Seuls des profils autosomiques sont demandés : ni lignée, ni orientation sur l’apparence.',
    'A DNA profile is to be sought on each seized item and compared with that of ' + (sex === 'F' ? 'Ms ' : 'Mr ') + who.first + ' ' + who.surname + '. Only autosomal profiles are requested: no lineage marker and no appearance inference.');
  const extra = variant === 'clear' ? text(' Merci de rechercher un profil sur chaque objet et de le comparer à celui ' + (sex === 'F' ? 'de la mise en cause' : 'du mis en cause') + '. Seuls des profils autosomiques sont demandés.',
    ' Please look for a profile on each item and compare it with that of the person under investigation. Only autosomal profiles are requested.') : text(' Merci de réaliser les analyses utiles.', ' Please carry out the useful analyses.');
  return { requisition: joinT(base, extra), clarification: clar, needsInfo: variant === 'vague', scelles, persons, sites, need, reasons: {}, comparisons };
}

function buildOrientation(rng, variant) {
  const [id, fr, en] = rng.pick([['vitre', 'Tache de sang sur un éclat de vitre', 'Bloodstain on a glass fragment'], ['mouchoir', 'Mouchoir en papier abandonné', 'Discarded paper tissue'], ['butt', 'Mégot de cigarette', 'Cigarette butt']]);
  const persons = { unk: newPerson(rng) }; persons.unk.genome = newGenome(rng);
  const scelles = [sc(id, fr, en, 'Trace relevée sur les lieux ; aucune personne identifiée à ce stade.', 'Trace collected at the scene; no person identified at this stage.')];
  const sites = { [id]: objectSites('unk', 'Zone tachée', 'Stained area', 'Support propre (témoin)', 'Clean support (control)', [0.001, 0.4]) };
  const clarification = text('Il s’agit d’une orientation d’enquête : ancestralité biogéographique et caractères physiques apparents (yeux, cheveux, peau) de la personne à l’origine de la trace. Aucun profil STR n’est demandé à ce stade.',
    'This is an investigative lead: biogeographical ancestry and visible physical traits (eyes, hair, skin) of the person who left the trace. No STR profile is requested at this stage.');
  const requisition = variant === 'clear'
    ? text('Aucun suspect n’est identifié et aucune référence n’est jointe. Merci de fournir des indications sur l’ancestralité biogéographique et les caractères physiques apparents (couleur des yeux, des cheveux et de la peau) de la personne à l’origine de la trace jointe. Aucun profil STR n’est demandé à ce stade.',
      'No suspect is identified and no reference is attached. Please provide indications on the biogeographical ancestry and visible physical traits (eye, hair and skin colour) of the person who left the attached trace. No STR profile is requested at this stage.')
    : text('Aucun suspect n’est identifié. Une trace a été relevée sur les lieux. Merci de l’analyser afin de faire avancer l’enquête.', 'No suspect is identified. A trace was collected at the scene. Please analyse it to help move the investigation forward.');
  return { requisition, clarification, needsInfo: variant === 'vague', scelles, persons, sites, need: { [id]: 'orient' }, reasons: {}, comparisons: [{ kind: 'orient', a: id }] };
}

const curl = o => o && typeof o === 'object' && 'fr' in o ? text(o.fr.replaceAll("'", '’'), o.en.replaceAll("'", '’')) : o;

// The sex of an unidentified person (John / Jane Doe) is known from the start (#87).
const doeSentence = sex => sex === 'M'
  ? text(' Les restes sont ceux d’un homme non identifié.', ' The remains are those of an unidentified man.')
  : text(' Les restes sont ceux d’une femme non identifiée.', ' The remains are those of an unidentified woman.');

export function makeDossier(seed, opts = {}) {
  const rng = makeRng(seed);
  const template = opts.template || rng.pick(TEMPLATES);
  if (!TEMPLATES.includes(template)) throw new Error('Unknown template ' + template);
  const variant = opts.variant || rng.pick(['vague', 'clear']);
  let b;
  if (DEVIS_BASED.has(template)) {
    const d = buildFromDevis(rng, template, variant);
    b = { requisition: d.dc.requisition, clarification: d.dc.clarification, needsInfo: d.dc.needsInfo, scelles: d.dc.scelles, persons: d.persons,
      sites: d.sites, need: d.need, reasons: d.reasons, comparisons: d.comparisons, relation: d.dc.relation, doe: d.doe };
  } else {
    b = template === 'trace-suspect' ? buildTraceSuspect(rng, variant) : buildOrientation(rng, variant);
  }
  const scelles = b.scelles.map((s, i) => ({ id: s.id, no: i + 1, title: curl(s.title), nature: curl(s.nature) }));
  const requisition = b.doe ? joinT(curl(b.requisition), doeSentence(b.persons[b.doe].sex)) : curl(b.requisition);
  return { seed: rng.seed, template, variant, needsInfo: !!b.needsInfo, requisition, clarification: curl(b.clarification),
    scelles, persons: b.persons, sites: b.sites, need: b.need, reasons: b.reasons, comparisons: b.comparisons, relation: b.relation || null };
}
/* Automatic differential extraction (#104): notice, site tag and margin reminder. */
export const hasDifferential = (c, scelleId) => !!(c.sites[scelleId] && c.sites[scelleId].some(x => x.differential));
export const DIFFERENTIAL_NOTICE = text(
  'Prélèvement pouvant contenir des spermatozoïdes : sur la zone concernée, l’analyse devient automatiquement une extraction différentielle et seule la fraction spermatique est amplifiée. Rien à choisir de votre côté.',
  'Sample that may contain spermatozoa: on the area concerned, the analysis automatically becomes a differential extraction and only the sperm fraction is amplified. There is nothing for you to choose.');
export const DIFFERENTIAL_SITE_TAG = text(' — extraction différentielle automatique', ' — automatic differential extraction');
export const DIFFERENTIAL_MARGIN = text(
  'Fraction spermatique (extraction différentielle automatique). Un report d’ADN de la personne plaignante est possible dans cette fraction ; ces allèles ne sont pas représentés ici. Rappel de cours : il n’y a rien à traiter.',
  'Sperm fraction (automatic differential extraction). Carry-over of the complainant’s DNA is possible in this fraction; those alleles are not shown here. Course reminder: there is nothing to deal with.');
export const scelleOf = (c, id) => c.scelles.find(s => s.id === id);
export const scelleName = (c, id) => 'n°' + scelleOf(c, id).no;

/* ============================================================
   Stage 2 — quote warnings (never red, never a grade)
   ============================================================ */
const sref = (c, id) => { const s = scelleOf(c, id); return text('« ' + s.title.fr + ' » (scellé n°' + s.no + ')', '“' + s.title.en + '” (exhibit #' + s.no + ')'); };
const W = (id, scelle, fr, en, level = 'warn') => ({ id, scelle, level, text: text(fr, en) });
const lineageName = l => l === 'y' ? text('STR-Y (lignée paternelle)', 'Y-STR (paternal line)') : text('ADN mitochondrial (lignée maternelle)', 'mtDNA (maternal line)');

export function checkQuote(c, quote) {
  const out = [];
  for (const s of c.scelles) {
    const need = c.need[s.id] || null, got = PACKAGES[quote[s.id]] ? quote[s.id] : null, r = sref(c, s.id);
    if (need && !got) { out.push(W('missing', s.id, 'Le scellé ' + r.fr + ' n’est pas couvert par votre devis alors que la demande le concerne.', 'Exhibit ' + r.en + ' is not covered by your quote although the request concerns it.')); continue; }
    if (!need && got) {
      const why = c.reasons[s.id];
      out.push(W('overboard', s.id, 'Le scellé ' + r.fr + ' figure dans votre devis alors qu’il n’est pas nécessaire à la demande.' + (why ? ' ' + why.fr : ''), 'Exhibit ' + r.en + ' is in your quote although the request does not need it.' + (why ? ' ' + why.en : '')));
      continue;
    }
    if (!need) continue;
    const n = PACKAGES[need], g = PACKAGES[got];
    if (need !== got && (n.base === 'orient' || g.base === 'orient')) {
      out.push(n.base === 'orient'
        ? W('wrongOrient', s.id, 'La demande porte sur une orientation (ancestralité, phénotype) pour le scellé ' + r.fr + ' : le forfait choisi ne produit pas ce résultat.', 'The request asks for an investigative lead (ancestry, phenotype) for exhibit ' + r.en + ': the chosen package does not produce it.')
        : W('wrongOrient', s.id, 'Le forfait « Orientation » ne produit aucun profil STR comparable : il ne répond pas à la demande pour le scellé ' + r.fr + '.', 'The “Orientation” package produces no comparable STR profile: it does not answer the request for exhibit ' + r.en + '.'));
      continue;
    }
    if (n.base !== g.base) {
      out.push(n.base === 'trace'
        ? W('traceNeedsTwo', s.id, 'Le scellé ' + r.fr + ' est à échantillonner (trace, fragment de muscle ou d’organe) : le forfait « Référence » ne prévoit qu’une extraction et un profil, ce qui ne permet pas de vérifier la reproductibilité du résultat.', 'Exhibit ' + r.en + ' has to be sampled (trace, muscle or organ fragment): the “Reference” package only provides one extraction and one profile, which does not allow the result to be checked for reproducibility.')
        : W('refNeedsOne', s.id, 'Le scellé ' + r.fr + ' est un prélèvement de référence déjà réalisé, abondant : le forfait « Trace » (deux extractions, deux profils) est plus que nécessaire.', 'Exhibit ' + r.en + ' is a reference sample already taken, abundant: the “Trace” package (two extractions, two profiles) is more than needed.'));
    }
    if (n.lineage !== g.lineage) {
      if (n.lineage && !g.lineage) out.push(W('lineageMissing', s.id, 'Pour le scellé ' + r.fr + ', la parenté en jeu ne peut pas être éclairée par les seuls STR autosomaux : un marqueur de lignée est nécessaire — ' + lineageName(n.lineage).fr + '.', 'For exhibit ' + r.en + ', the kinship at stake cannot be addressed by autosomal STRs alone: a lineage marker is needed — ' + lineageName(n.lineage).en + '.'));
      else if (!n.lineage) out.push(W('lineageNotNeeded', s.id, 'Pour le scellé ' + r.fr + ', un marqueur de lignée (' + lineageName(g.lineage).fr + ') n’est pas nécessaire : les STR autosomaux suffisent à répondre à la demande.', 'For exhibit ' + r.en + ', a lineage marker (' + lineageName(g.lineage).en + ') is not needed: autosomal STRs are enough to answer the request.'));
      else out.push(W('wrongLineage', s.id, 'Pour le scellé ' + r.fr + ', la lignée choisie (' + lineageName(g.lineage).fr + ') n’est pas celle que partagent les personnes concernées ; il faut ' + lineageName(n.lineage).fr + '.', 'For exhibit ' + r.en + ', the chosen lineage (' + lineageName(g.lineage).en + ') is not the one the persons concerned share; ' + lineageName(n.lineage).en + ' is needed.'));
    }
  }
  return out;
}

/* ============================================================
   Stage 3 — sampling and extraction
   ============================================================ */
export function checkSampling(c, quote, sampling) {
  const budget = extractionBudget(quote), out = [];
  for (const s of c.scelles) {
    const n = budget[s.id]; if (!n) continue;
    const r = sref(c, s.id), sites = c.sites[s.id], roleOf = id => sites.find(x => x.id === id).role;
    const picks = (sampling[s.id] || []).filter(Boolean);
    if (!picks.length) { out.push(W('none', s.id, 'Aucune extraction n’est prévue sur le scellé ' + r.fr + ', alors que votre devis en comprend ' + n + '.', 'No extraction is planned on exhibit ' + r.en + ' although your quote includes ' + n + '.')); continue; }
    if (picks.length < n) out.push(W('unused', s.id, 'Sur le scellé ' + r.fr + ', ' + picks.length + ' extraction(s) sur ' + n + ' prévue(s) au devis : le reste ne sera pas utilisé.', 'On exhibit ' + r.en + ', ' + picks.length + ' of the ' + n + ' extraction(s) in the quote: the rest will not be used.', 'info'));
    if (picks.some(id => roleOf(id) === 'blank')) out.push(W('blank', s.id, 'Sur le scellé ' + r.fr + ', une extraction porte sur une zone où aucun ADN n’est attendu (zone propre ou non touchée) : elle risque d’être perdue.', 'On exhibit ' + r.en + ', an extraction targets an area where no DNA is expected (clean or untouched area): it is likely to be wasted.'));
    if (picks.some(id => roleOf(id) === 'secondary')) out.push(W('secondary', s.id, 'Sur le scellé ' + r.fr + ', une extraction porte sur une zone périphérique, peu informative au regard de la demande (ADN de contact d’une autre origine possible).', 'On exhibit ' + r.en + ', an extraction targets a peripheral area that is of little use for the request (touch DNA of another origin is possible).'));
    if (sites.some(x => x.role === 'target') && sites.length > 1 && !picks.some(id => roleOf(id) === 'target')) out.push(W('noTarget', s.id, 'Aucune extraction ne vise la zone la plus pertinente du scellé ' + r.fr + '.', 'No extraction targets the most relevant area of exhibit ' + r.en + '.'));
  }
  return out;
}

export function doExtraction(c, scelleId, siteId, k) {
  const sc_ = scelleOf(c, scelleId), st = c.sites[scelleId].find(x => x.id === siteId);
  if (!st) throw new Error('Unknown site ' + siteId);
  const rng = makeRng(c.seed + ':ext:' + scelleId + ':' + siteId + ':' + k);
  const conc = round(logUniform(rng, st.source ? st.conc : BLANK), 4);
  const person = st.source ? c.persons[st.source] : null;
  const male = person && person.sex === 'M' ? round(conc * rng.range(0.85, 1.0), 4) : 0;
  return { id: sc_.no + '.' + (k + 1), scelleId, siteId, k, source: st.source, conc, male, differential: !!st.differential,
    mt: Math.round(conc * 2e5 * rng.range(0.6, 1.6)), di: round(rng.range(st.di[0], st.di[1]), 1) };
}

/* ============================================================
   Stage 5 — choosing the extract of each analysis, then running it
   ============================================================ */
export const SLOT_LABEL = {
  auto: text('Profil STR autosomal', 'Autosomal STR profile'), y: text('Haplotype STR-Y', 'Y-STR haplotype'),
  mt: text('Haplotype mitochondrial', 'Mitochondrial haplotype'), ngs: text('Run NGS (ancestralité et phénotype)', 'NGS run (ancestry and phenotype)')
};
export function analysisSlots(c, quote) {
  const out = [];
  for (const s of c.scelles) {
    const t = PACKAGES[quote[s.id]]; if (!t) continue;
    const seen = {};
    for (const kind of t.slots) {
      const index = seen[kind] = (seen[kind] || 0) + 1;
      out.push({ key: s.id + ':' + kind + ':' + index, scelleId: s.id, kind, index, of: t.slots.filter(k => k === kind).length });
    }
  }
  return out;
}
export const LOW_CONC = 0.005; // ng/µL, indicative threshold shown to the student

export function checkAnalysis(c, quote, extracts, assign) {
  const out = [], slots = analysisSlots(c, quote), noted = new Set();
  const usedBy = {};
  for (const sl of slots) {
    const r = sref(c, sl.scelleId), mine = extracts.filter(e => e.scelleId === sl.scelleId), lab = SLOT_LABEL[sl.kind];
    if (!mine.length) { if (!noted.has(sl.scelleId)) { noted.add(sl.scelleId); out.push(W('noExtract', sl.scelleId, 'Aucun extrait n’existe pour le scellé ' + r.fr + ' : les analyses prévues ne pourront pas être réalisées.', 'No extract exists for exhibit ' + r.en + ': the planned analyses cannot be carried out.')); } continue; }
    const ex = mine.find(e => e.id === assign[sl.key]);
    const tag = lab.fr + (sl.of > 1 ? ' ' + sl.index + '/' + sl.of : ''), tagEn = lab.en + (sl.of > 1 ? ' ' + sl.index + '/' + sl.of : '');
    if (!ex) { out.push(W('unassigned', sl.scelleId, 'Scellé ' + r.fr + ' — « ' + tag + ' » : aucun extrait n’est attribué, l’analyse ne sera pas réalisée.', 'Exhibit ' + r.en + ' — “' + tagEn + '”: no extract is assigned, the analysis will not be run.')); continue; }
    (usedBy[sl.scelleId + ':' + sl.kind] = usedBy[sl.scelleId + ':' + sl.kind] || []).push(ex.id);
    const field = sl.kind === 'y' ? 'male' : sl.kind === 'mt' ? 'mt' : 'conc';
    const better = mine.some(o => o.id !== ex.id && o[field] >= 3 * ex[field] && o[field] > 0);
    if (sl.kind === 'y' && ex.male < 0.0005) out.push(W('noMale', sl.scelleId, 'Scellé ' + r.fr + ' — extrait ' + ex.id + ' : aucun ADN masculin quantifié, un haplotype STR-Y est improbable.', 'Exhibit ' + r.en + ' — extract ' + ex.id + ': no male DNA quantified, a Y-STR haplotype is unlikely.'));
    else if ((sl.kind === 'auto' || sl.kind === 'ngs') && ex.conc < LOW_CONC) out.push(W('veryLow', sl.scelleId, 'Scellé ' + r.fr + ' — extrait ' + ex.id + ' : concentration très faible (' + ex.conc + ' ng/µL) ; un profil vide ou partiel est probable' + (better ? ', et un autre extrait est plus concentré.' : '.'), 'Exhibit ' + r.en + ' — extract ' + ex.id + ': very low concentration (' + ex.conc + ' ng/µL); an empty or partial result is likely' + (better ? ', and another extract is more concentrated.' : '.')));
    else if (better) out.push(W('betterExists', sl.scelleId, 'Scellé ' + r.fr + ' — « ' + tag + ' » : un autre extrait de ce scellé est nettement plus concentré que l’extrait ' + ex.id + '.', 'Exhibit ' + r.en + ' — “' + tagEn + '”: another extract of this exhibit is clearly more concentrated than extract ' + ex.id + '.'));
  }
  for (const [k, ids] of Object.entries(usedBy)) {
    const [sid, kind] = k.split(':');
    if (ids.length > 1 && new Set(ids).size === 1 && extracts.filter(e => e.scelleId === sid).length > 1 && kind === 'auto')
      out.push(W('sameExtract', sid, 'Scellé ' + sref(c, sid).fr + ' : les deux profils sont produits à partir du même extrait. Ce sont des réplicats de PCR, pas d’extractions indépendantes ; cela reste permis.', 'Exhibit ' + sref(c, sid).en + ': both profiles come from the same extract. They are PCR replicates, not independent extractions; this is allowed.', 'info'));
  }
  return out;
}

/* ---- simulated analyses ---- */
const ART_OFF = { stutter: true, minusA: true, pullup: false, dropin: false, spike: false, blob: false, offladder: false, noise: false };
const TH = { at: 150, st: 400 };
const degK = di => clamp((di - 1) * 0.5, 0, 3.5);
const pcrNg = conc => Math.min(1, conc * 10); // up to 10 µL of extract, capped at 1 ng

function peaksOf(kit, geno, amount, di, rng) {
  const contributors = geno ? [{ geno, amount, degradation: degK(di) }] : [];
  return simulate(kit, contributors, { rng, art: ART_OFF, thresholds: TH }).peaks;
}
export function genotypeOf(e) {
  if (!e) return null;
  if (e.alleles.length >= 2) return [e.alleles[0], e.alleles[1]];
  if (e.alleles.length === 1 && e.reliable) return [e.alleles[0], e.alleles[0]];
  return null;
}
function autoFromPeaks(peaks) {
  const loci = {};
  for (const l of AUTO_LOCI) {
    const pk = peaks.filter(p => p.locus === l.name && p.called && p.kind === 'allele');
    const alleles = [...new Set(pk.map(p => parseFloat(p.label)))].sort((a, b) => a - b);
    const top = pk.reduce((m, p) => Math.max(m, p.height), 0);
    loci[l.name] = { alleles, reliable: alleles.length >= 2 || (alleles.length === 1 && top >= TH.st) };
  }
  const sexAlleles = peaks.filter(p => p.locus === AMEL.name && p.called).map(p => p.label);
  return { loci, sex: sexAlleles.includes('Y') ? 'XY' : sexAlleles.includes('X') ? 'XX' : null };
}
const countComplete = loci => AUTO_LOCI.filter(l => genotypeOf(loci[l.name])).length;
const autoResult = (base, loci, sex) => ({ kind: 'auto', ...base, loci, sex, total: N_AUTO, complete: countComplete(loci), pct: Math.round(100 * countComplete(loci) / N_AUTO) });

export function truthAuto(person) { // the complete, error-free profile of a simulated person
  const loci = {};
  for (const l of AUTO_LOCI) { const g = person.auto.geno[l.name]; loci[l.name] = { alleles: [...new Set(g)].sort((a, b) => a - b), reliable: true }; }
  return autoResult({ truth: true }, loci, person.sex === 'M' ? 'XY' : 'XX');
}
const yValues = person => Object.fromEntries(YF.loci.map(l => [l.name, [...new Set(person.y.geno[l.name])].sort((a, b) => a - b).join('/')]));
export function truthY(person) { return person.y ? { kind: 'y', truth: true, quality: 100, complete: N_Y, total: N_Y, values: yValues(person), code: hashCode(Object.entries(yValues(person)).map(([k, v]) => k + '=' + v).join('|'), 'Y') } : null; }
const mtValues = (person, covered) => Object.fromEntries(covered.map(i => ['s' + i, person.mt[i]]));
export function truthMt(person) {
  const all = [...Array(MT_SITES).keys()], v = mtValues(person, all);
  return { kind: 'mt', truth: true, quality: 100, complete: MT_AMPLICONS, total: MT_AMPLICONS, values: v, code: hashCode(Object.entries(v).map(([k, x]) => k + '=' + x).join('|'), 'MT') };
}

const dist = (trait, vec) => { // ancestry-weighted phenotype prior
  let acc = null;
  for (const [a, w] of Object.entries(vec)) { if (!w) continue; const d = phenoDist(trait, a); acc = acc ? acc.map((x, i) => x + w * d[i]) : d.map(x => w * x); }
  return acc;
};
export function ngsOf(genome, q, rng) {
  const ancestry = ANCESTRY.map(a => ({ id: a.id, v: Math.max(0, genome.anc[a.id] + (1 - q) * rng.range(-0.12, 0.12)) }));
  const sum = ancestry.reduce((s, x) => s + x.v, 0) || 1;
  const anc = ancestry.map(x => ({ id: x.id, pct: Math.round(1000 * x.v / sum) / 10 }));
  const pheno = {};
  for (const [t, def] of Object.entries(PHENO)) {
    const prior = dist(t, genome.anc), truth = def.cats.map(cat => cat[0] === genome.pheno[t] ? 1 : 0);
    const p = prior.map((x, i) => q * (0.7 * truth[i] + 0.3 * x) + (1 - q) * x);
    const tot = p.reduce((s, x) => s + x, 0);
    pheno[t] = def.cats.map((cat, i) => ({ id: cat[0], pct: Math.round(1000 * p[i] / tot) / 10 }));
  }
  return { ancestry: anc, pheno };
}

export function runSlot(c, slot, extract) {
  const person = extract.source ? c.persons[extract.source] : null;
  const rng = makeRng(c.seed + ':run:' + slot.key + ':' + extract.id);
  const base = { scelleId: slot.scelleId, slotKey: slot.key, extractId: extract.id, differential: !!extract.differential };
  if (slot.kind === 'auto') {
    const o = autoFromPeaks(peaksOf(GF, person && person.auto.geno, 7000 * pcrNg(extract.conc), extract.di, rng));
    return autoResult(base, o.loci, o.sex);
  }
  if (slot.kind === 'y') {
    const peaks = peaksOf(YF, person && person.y && person.y.geno, 7000 * pcrNg(extract.male), extract.di, rng);
    const values = {};
    for (const l of YF.loci) {
      const want = person && person.y ? [...new Set(person.y.geno[l.name])].sort((a, b) => a - b) : null;
      const got = [...new Set(peaks.filter(p => p.locus === l.name && p.called && p.kind === 'allele').map(p => parseFloat(p.label)))].sort((a, b) => a - b);
      if (want && want.length && want.join('/') === got.join('/')) values[l.name] = got.join('/');
    }
    const complete = Object.keys(values).length;
    return { kind: 'y', ...base, values, complete, total: N_Y, quality: Math.round(100 * complete / N_Y),
      code: complete ? hashCode(Object.entries(values).map(([k, v]) => k + '=' + v).join('|'), 'Y') : null };
  }
  if (slot.kind === 'mt') {
    const p = clamp((1 - Math.exp(-(extract.mt * 5) / 2000)) * Math.exp(-0.08 * (extract.di - 1)), 0, 1) * (person ? 1 : 0);
    const per = MT_SITES / MT_AMPLICONS, covered = [];
    let ok = 0;
    for (let a = 0; a < MT_AMPLICONS; a++) if (rng.next() < p) { ok++; for (let i = 0; i < per; i++) covered.push(a * per + i); }
    const values = person ? mtValues(person, covered) : {};
    return { kind: 'mt', ...base, values, complete: ok, total: MT_AMPLICONS, quality: Math.round(100 * ok / MT_AMPLICONS),
      code: ok ? hashCode(Object.entries(values).map(([k, v]) => k + '=' + v).join('|'), 'MT') : null };
  }
  // NGS (ancestry and phenotype)
  const ng = pcrNg(extract.conc);
  const q = person && person.genome ? clamp((1 - Math.exp(-ng / 0.04)) * Math.exp(-0.1 * (extract.di - 1)) + rng.range(-0.05, 0.05), 0, 1) : 0;
  const quality = Math.round(q * 100);
  if (quality < 40 || !person || !person.genome) return { kind: 'ngs', ...base, quality, interpretable: false };
  return { kind: 'ngs', ...base, quality, interpretable: true, ...ngsOf(person.genome, q, rng) };
}

/* ============================================================
   Stage 6 — interpretation tools
   ============================================================ */
const MU = 0.002; // per-locus allowance for typing error, used ONLY by the same-person identity LR; kinship levels have none (#97)
const freqFn = l => { const m = alleleFrequencies(l); return a => m.get(a) || 0.01; };
const pGeno = (g, p) => g[0] === g[1] ? p(g[0]) ** 2 : 2 * p(g[0]) * p(g[1]);
const otherAllele = (g, z) => g[0] === z ? g[1] : g[0];
function ibd1(ga, gb, p) {
  let s = 0;
  for (const z of new Set(ga.filter(a => gb.includes(a)))) s += p(z) * p(otherAllele(ga, z)) * p(otherAllele(gb, z));
  return s;
}
const sameG = (a, b) => a[0] === b[0] && a[1] === b[1];
// P(G1,G2 | relationship with IBD probabilities k = [k0,k1,k2]); `mu` blends in an optional error term.
function pairProb(ga, gb, p, k, mu = 0) {
  const unrel = pGeno(ga, p) * pGeno(gb, p);
  const v = k[0] * unrel + (k[1] ? k[1] * ibd1(ga, gb, p) : 0) + (k[2] && sameG(ga, gb) ? k[2] * pGeno(ga, p) : 0);
  return { rel: (1 - mu) * v + mu * unrel, unrel };
}
// Kinship levels (#95): PO parent–offspring, FS full siblings, HS/AV/GC half-siblings / avuncular / grandparent–grandchild
// (the three share the same IBD probabilities, so these markers cannot tell them apart). No mutation allowance:
// a locus without a shared allele excludes PO (LR = 0, posterior = 0).
export const KIN_LEVELS = {
  PO:     { code: 'PO',       k: [0, 1, 0],         label: text('Parent – enfant', 'Parent – offspring') },
  FS:     { code: 'FS',       k: [0.25, 0.5, 0.25], label: text('Germains (frères / sœurs)', 'Full siblings') },
  HSAVGC: { code: 'HS/AV/GC', k: [0.5, 0.5, 0],     label: text('Demi-germains / oncle-tante – neveu-nièce / grand-parent – petit-enfant', 'Half-siblings / avuncular / grandparent – grandchild') }
};
export const KIN_PRIOR = 0.5; // each level is tested alone against "unrelated" with 50 % / 50 % priors (#99)
const SAME = { k: [0, 0, 1], mu: MU };

// Posterior probability of each level taken ALONE against "unrelated" (two hypotheses, prior `prior` for the level):
// P = prior·LR / (prior·LR + (1 − prior)); with equal 50 % priors this is LR / (1 + LR). The three values are
// independent comparisons and do not add up to 1.
export function posteriors(hyp, prior = KIN_PRIOR) {
  const post = lr => (prior * lr) / (prior * lr + (1 - prior));
  return { PO: post(hyp.PO.lr), FS: post(hyp.FS.lr), HSAVGC: post(hyp.HSAVGC.lr) };
}
// Arbitrary teaching threshold for a posterior probability (owner convention, #100) — not a legal or laboratory standard.
export const POSTERIOR_THRESHOLD = 0.9999999; // 99.99999 %
export const THRESHOLD_LABEL = { fr: '99,99999 %', en: '99.99999%' };
export const reachesThreshold = p => p >= POSTERIOR_THRESHOLD - 1e-12;
// LR needed to reach a posterior probability against "unrelated" for a given prior (50 %: LR = P / (1 − P) ≈ 10^7).
export const lrForPosterior = (post = POSTERIOR_THRESHOLD, prior = KIN_PRIOR) => (post / (1 - post)) * ((1 - prior) / prior);
export function fmtPct(p, lang = 'en') {
  const dec = x => lang === 'fr' ? x.replace('.', ',') : x;
  if (p === 0) return '0 %';
  if (p < 0.0005) return '< ' + dec('0.1') + ' %';
  if (reachesThreshold(p)) return '≥ ' + THRESHOLD_LABEL[lang === 'fr' ? 'fr' : 'en'].replace('%', '').trim() + ' %'; // keeps "just under" distinguishable
  if (p >= 0.99) return dec((p * 100).toFixed(5)) + ' %';
  return dec((Math.round(p * 1000) / 10).toFixed(1)) + ' %';
}

export function compareProfiles(pa, pb) {
  const res = { lociCompared: 0, identical: 0, compatible: 0, discordant: 0, untyped: 0, noShared: 0, perLocus: {}, hyp: {} };
  const defs = { ...KIN_LEVELS, same: SAME }, logs = Object.fromEntries(Object.keys(defs).map(h => [h, 0]));
  for (const l of AUTO_LOCI) {
    const ea = pa.loci[l.name], eb = pb.loci[l.name], ga = genotypeOf(ea), gb = genotypeOf(eb);
    let status;
    if (ga && gb) {
      status = sameG(ga, gb) ? 'identical' : 'discordant';
      res.lociCompared++;
      if (!ga.some(a => gb.includes(a))) res.noShared++;
      const p = freqFn(l);
      for (const [h, def] of Object.entries(defs)) { const { rel, unrel } = pairProb(ga, gb, p, def.k, def.mu || 0); logs[h] += Math.log10(rel / unrel); }
    } else if (!ea.alleles.length || !eb.alleles.length) status = 'untyped';
    else { // at least one partial locus: compatible when the alleles seen are included in the other profile
      const A = ea.alleles, B = eb.alleles;
      status = A.every(a => B.includes(a)) || B.every(a => A.includes(a)) ? 'compatible' : 'discordant';
    }
    res.perLocus[l.name] = status; res[status]++;
  }
  for (const h of Object.keys(defs)) res.hyp[h] = { log10: logs[h], lr: 10 ** logs[h] };
  res.hyp.PO.excluded = res.noShared > 0;
  res.post = posteriors(res.hyp);
  return res;
}

export function randomMatch(profile) {
  let log = 0, n = 0;
  for (const l of AUTO_LOCI) { const g = genotypeOf(profile.loci[l.name]); if (!g) continue; log += Math.log10(pGeno(g, freqFn(l))); n++; }
  return { loci: n, log10: log, rmp: 10 ** log, oneIn: n ? Math.round(10 ** -log) : null };
}

/* Consensus: built BY THE STUDENT (#92), never computed automatically.
   calls = { locus: [allele1, allele2] } with '' / null for "not chosen":
   two alleles = genotype (the same allele twice = homozygote), a single allele
   = partial locus (the second allele may have dropped out), none = not typed. */
export function profileFromCalls(base, calls, sex = null) {
  const loci = {};
  for (const l of AUTO_LOCI) {
    const picked = ((calls && calls[l.name]) || []).filter(a => a !== '' && a != null && !Number.isNaN(a)).map(Number);
    if (picked.length >= 2) loci[l.name] = { alleles: [...new Set(picked.slice(0, 2))].sort((a, b) => a - b), reliable: true };
    else loci[l.name] = { alleles: picked.slice(0, 1), reliable: false };
  }
  return autoResult(base, loci, sex);
}
// Alleles actually seen in the replicates at a locus: the only ones the student can call.
export function observedAlleles(replicates, locus) {
  return [...new Set(replicates.flatMap(r => r.loci[locus].alleles))].sort((a, b) => a - b);
}
// Ungraded hints on a student's consensus (shown in amber, never a score).
export function checkConsensus(calls, replicates) {
  const out = [];
  if (replicates.length < 2) return out;
  for (const l of AUTO_LOCI) {
    const seenIn = a => replicates.filter(r => r.loci[l.name].alleles.includes(a)).length;
    const seen = observedAlleles(replicates, l.name);
    const picked = ((calls && calls[l.name]) || []).filter(a => a !== '' && a != null).map(Number);
    const kept = [...new Set(picked)];
    const add = (id, fr, en) => out.push({ id, locus: l.name, text: text(l.name + ' : ' + fr, l.name + ': ' + en) });
    if (!kept.length) { if (seen.length) add('empty', 'locus laissé vide alors que des allèles ont été observés.', 'locus left empty although alleles were observed.'); continue; }
    for (const a of kept) if (seenIn(a) === 1) add('single', 'l’allèle ' + a + ' n’apparaît que dans un seul réplicat : il n’est pas reproduit.', 'allele ' + a + ' appears in only one replicate: it is not reproduced.');
    for (const a of seen) if (seenIn(a) >= 2 && !kept.includes(a)) add('omitted', 'l’allèle ' + a + ' est reproduit dans plusieurs réplicats mais n’est pas retenu.', 'allele ' + a + ' is reproduced in several replicates but is not kept.');
    if (picked.length >= 2 && picked[0] === picked[1]) { // homozygote call
      if (seen.length > 1) add('homConflict', 'homozygote proposé alors que d’autres allèles ont été observés dans les réplicats.', 'homozygote called although other alleles were observed in the replicates.');
      else if (!replicates.some(r => r.loci[l.name].alleles.length === 1 && r.loci[l.name].reliable)) add('homWeak', 'homozygote proposé alors qu’aucun réplicat ne montre un pic haut (au-dessus du seuil stochastique) : une perte d’allèle n’est pas exclue.', 'homozygote called although no replicate shows a tall peak (above the stochastic threshold): allele drop-out is not excluded.');
    }
  }
  return out;
}

export function compareHaplotypes(h1, h2) {
  if (!h1 || !h2 || h1.kind !== h2.kind) return null;
  const keys = Object.keys(h1.values).filter(k => k in h2.values);
  const diff = keys.filter(k => h1.values[k] !== h2.values[k]);
  return { compared: keys.length, differences: diff.length, differing: diff, total: h1.kind === 'y' ? N_Y : MT_SITES, identical: keys.length > 0 && !diff.length };
}

export function lrWord(lr) {
  const v = lr >= 1 ? lr : 1 / lr, fav = lr >= 1;
  const w = v < 10 ? ['un soutien très faible', 'very weak support'] : v < 100 ? ['un soutien modéré', 'moderate support'] : v < 1000 ? ['un soutien assez fort', 'fairly strong support']
    : v < 1e6 ? ['un soutien fort', 'strong support'] : ['un soutien extrêmement fort', 'extremely strong support'];
  return { fav, text: text(w[0], w[1]) };
}
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function fmtSci(x, lang = 'en') {
  if (!isFinite(x)) return '∞';
  if (x === 0) return '0';
  const dec = s => lang === 'fr' ? s.replace('.', ',') : s;
  if (x >= 1e4 || x < 0.01) { const [m, e] = x.toExponential(1).split('e'); return dec(m) + ' × 10' + String(parseInt(e, 10)).split('').map(ch => SUP[ch]).join(''); }
  return dec(x >= 100 ? String(Math.round(x)) : String(Math.round(x * 100) / 100));
}

/* ============================================================
   "Reveal answer" — what the results allowed one to conclude.
   Every statement compares PROFILES; none says anything about the case itself.
   ============================================================ */
const T = (fr, en) => text(fr, en);
const nm = (c, id) => text('scellé n°' + scelleOf(c, id).no, 'exhibit #' + scelleOf(c, id).no);
const NOTE_PROFILES = T('Cette conclusion porte uniquement sur la comparaison de ces profils ; elle ne dit rien des circonstances du dossier ni de la provenance des échantillons.', 'This statement concerns only the comparison of these profiles; it says nothing about the circumstances of the case or the origin of the samples.');

// "PO: LR …, probability …" for the three kinship levels and the unrelated reference, in one language.
function levelsLine(r, lang) {
  const f = x => fmtSci(x, lang), pc = x => fmtPct(x, lang);
  const parts = Object.entries(KIN_LEVELS).map(([k, d]) => d.code + ' : LR ' + f(r.hyp[k].lr) + ', ' + pc(r.post[k]));
  return lang === 'fr' ? parts.join(' ; ') : parts.join('; ').replaceAll(' : LR', ': LR');
}
const thresholdText = r => {
  const hit = Object.entries(KIN_LEVELS).filter(([k]) => reachesThreshold(r.post[k])).map(([, d]) => d.code);
  return T('Seuil arbitraire de cet exercice : probabilité a posteriori ≥ ' + THRESHOLD_LABEL.fr + ' (LR ≈ 10⁷ avec des a priori de 50 %). ' + (hit.length ? 'Seuil atteint par : ' + hit.join(', ') + '.' : 'Aucun niveau n’atteint ce seuil.'),
    'Arbitrary threshold of this exercise: posterior probability ≥ ' + THRESHOLD_LABEL.en + ' (LR ≈ 10⁷ with 50% priors). ' + (hit.length ? 'Threshold reached by: ' + hit.join(', ') + '.' : 'No level reaches this threshold.'));
};
const levelsTexts = r => [
  T('Niveaux de parenté (LR et probabilité a posteriori, chaque niveau étant comparé séparément à « non apparentés » avec des probabilités a priori de 50 % / 50 %) — ' + levelsLine(r, 'fr') + '.',
    'Kinship levels (LR and posterior probability, each level being compared separately with “unrelated” with prior probabilities of 50% / 50%) — ' + levelsLine(r, 'en') + '.'),
  thresholdText(r)
];

function describeKinship(c, cmp, get) {
  const A = get(cmp.a, 'auto'), B = get(cmp.b, 'auto'), na = nm(c, cmp.a), nb = nm(c, cmp.b), out = [];
  if (cmp.relation === 'parent') {
    if (!A || !B) return [T('Les deux profils autosomiques (' + na.fr + ' et ' + nb.fr + ') ne sont pas tous disponibles : aucune comparaison PO n’est possible.', 'The two autosomal profiles (' + na.en + ' and ' + nb.en + ') are not both available: no PO comparison is possible.')];
    const r = compareProfiles(A, B), lr = r.hyp.PO.lr, w = lrWord(lr);
    out.push(T('Profils autosomiques du ' + na.fr + ' et du ' + nb.fr + ' : ' + r.lociCompared + ' loci comparables, dont ' + r.noShared + ' sans allèle commun.',
      'Autosomal profiles of ' + na.en + ' and ' + nb.en + ': ' + r.lociCompared + ' comparable loci, ' + r.noShared + ' of them with no shared allele.'));
    out.push(...levelsTexts(r));
    if (r.lociCompared < 8) out.push(T('Le nombre de loci comparables est faible : la valeur de cette comparaison est limitée.', 'The number of comparable loci is low: the value of this comparison is limited.'));
    else if (r.noShared >= 1) out.push(T('Au moins un locus sans allèle commun : exclusion allélique de PO (LR = 0, probabilité a posteriori 0 %).', 'At least one locus with no shared allele: allelic exclusion of PO (LR = 0, posterior probability 0%).'));
    else if (w.fav) out.push(T('Aucune exclusion allélique : les profils sont compatibles avec PO ; ils apportent ' + w.text.fr + ' à PO plutôt qu’à l’hypothèse de deux personnes non apparentées.', 'No allelic exclusion: the profiles are compatible with PO; they provide ' + w.text.en + ' for PO rather than for two unrelated people.'));
    else out.push(T('Les profils favorisent plutôt l’hypothèse de deux personnes non apparentées.', 'The profiles rather favour the hypothesis of two unrelated people.'));
    out.push(NOTE_PROFILES);
    return out;
  }
  const lin = cmp.relation === 'paternalUncle' ? 'y' : 'mt';
  const H1 = get(cmp.a, lin), H2 = get(cmp.b, lin);
  if (A && B) {
    const r = compareProfiles(A, B);
    out.push(T('Profils autosomiques seuls (' + r.lociCompared + ' loci comparables, ' + r.noShared + ' sans allèle commun).', 'Autosomal profiles alone (' + r.lociCompared + ' comparable loci, ' + r.noShared + ' with no shared allele).'));
    out.push(...levelsTexts(r));
    if (r.noShared >= 1) out.push(T('Au moins un locus sans allèle commun : PO est exclu (LR = 0).', 'At least one locus with no shared allele: PO is excluded (LR = 0).'));
    out.push(T('HS, AV et GC ont les mêmes probabilités de partage d’allèles : ces marqueurs ne les distinguent pas, et seul un marqueur de lignée peut compléter la comparaison.', 'HS, AV and GC have the same allele-sharing probabilities: these markers cannot tell them apart, and only a lineage marker can complete the comparison.'));
  }
  const hc = compareHaplotypes(H1, H2);
  if (!hc) { out.push(T('Les haplotypes ' + (lin === 'y' ? 'STR-Y' : 'mitochondriaux') + ' ne sont pas disponibles pour les deux scellés (' + na.fr + ' et ' + nb.fr + ') : la comparaison de lignée n’est pas possible.', (lin === 'y' ? 'Y-STR' : 'Mitochondrial') + ' haplotypes are not available for both exhibits (' + na.en + ' and ' + nb.en + '): the lineage comparison is not possible.')); return out; }
  const what = lin === 'y' ? T('marqueurs STR-Y', 'Y-STR markers') : T('sites variables mitochondriaux', 'mitochondrial variable sites'), line = lin === 'y' ? T('lignée paternelle', 'paternal line') : T('lignée maternelle', 'maternal line');
  out.push(T('Haplotypes (' + na.fr + ' et ' + nb.fr + ') : ' + hc.compared + ' ' + what.fr + ' comparés, ' + hc.differences + ' différence(s).', 'Haplotypes (' + na.en + ' and ' + nb.en + '): ' + hc.compared + ' ' + what.en + ' compared, ' + hc.differences + ' difference(s).'));
  const maxD = lin === 'y' ? 2 : 1;
  if (hc.compared < (lin === 'y' ? 10 : 8)) out.push(T('Le nombre de marqueurs comparés est trop faible pour conclure.', 'The number of markers compared is too low to conclude.'));
  else if (hc.differences === 0) out.push(T('Les haplotypes sont identiques sur les marqueurs comparés : compatibles avec une même ' + line.fr + '. Un haplotype de lignée est partagé par tous les individus d’une même lignée et ne les distingue pas ; sa fréquence se détermine par comptage dans une base de données, ce que cet exercice ne propose pas.', 'The haplotypes are identical on the markers compared: compatible with the same ' + line.en + '. A lineage haplotype is shared by all individuals of a lineage and does not distinguish them; its frequency is determined by counting in a database, which this exercise does not offer.'));
  else if (hc.differences <= maxD) out.push(T('Quelques différences : elles peuvent s’expliquer par des mutations ou, pour l’ADN mitochondrial, par une hétéroplasmie. L’appartenance à une même ' + line.fr + ' n’est pas exclue, mais le soutien est moindre.', 'A few differences: they may be explained by mutations or, for mtDNA, by heteroplasmy. Membership of the same ' + line.en + ' is not excluded, but the support is weaker.'));
  else out.push(T('Les haplotypes diffèrent trop pour être compatibles avec une même ' + line.fr + ' (hors mutations multiples).', 'The haplotypes differ too much to be compatible with the same ' + line.en + ' (barring multiple mutations).'));
  out.push(NOTE_PROFILES);
  return out;
}

function describeMatch(c, cmp, get) {
  const A = get(cmp.a, 'auto'), B = get(cmp.b, 'auto'), na = nm(c, cmp.a), nb = nm(c, cmp.b);
  if (!A || !B) return [T('Les profils autosomiques du ' + na.fr + ' et du ' + nb.fr + ' ne sont pas tous deux disponibles : aucune comparaison n’est possible.', 'The autosomal profiles of ' + na.en + ' and ' + nb.en + ' are not both available: no comparison is possible.')];
  const r = compareProfiles(A, B), out = [];
  out.push(T('Comparaison des profils autosomiques du ' + na.fr + ' et du ' + nb.fr + ' : ' + r.lociCompared + ' loci comparables, ' + r.identical + ' identiques, ' + r.discordant + ' discordants (' + r.compatible + ' compatibles avec une perte d’allèle, ' + r.untyped + ' non typés).',
    'Comparison of the autosomal profiles of ' + na.en + ' and ' + nb.en + ': ' + r.lociCompared + ' comparable loci, ' + r.identical + ' identical, ' + r.discordant + ' discordant (' + r.compatible + ' compatible with allele drop-out, ' + r.untyped + ' untyped).'));
  if (r.lociCompared < 8) out.push(T('Le nombre de loci comparables est faible : la valeur de cette comparaison est limitée.', 'The number of comparable loci is low: the value of this comparison is limited.'));
  else if (r.discordant >= 3) out.push(T('Les deux profils diffèrent à plusieurs loci : ils ne correspondent pas.', 'The two profiles differ at several loci: they do not match.'));
  else if (r.discordant > 0) out.push(T('Un ou deux loci sont discordants : l’écart peut venir d’un artefact (perte d’allèle, erreur de typage) ou d’une réelle différence ; le résultat n’est pas concluant sans répétition.', 'One or two loci are discordant: the gap may come from an artefact (drop-out, typing error) or a real difference; the result is not conclusive without repetition.'));
  else {
    const m = randomMatch(A);
    out.push(T('Les deux profils sont identiques sur tous les loci comparables. Rapport de vraisemblance (même source contre source non apparentée) ≈ ' + fmtSci(r.hyp.same.lr, 'fr') + ' ; fréquence du profil ≈ 1 sur ' + fmtSci(m.oneIn, 'fr') + ' (calculée sur ' + m.loci + ' loci, fréquences approchées).',
      'The two profiles are identical at every comparable locus. Likelihood ratio (same source versus unrelated source) ≈ ' + fmtSci(r.hyp.same.lr, 'en') + '; profile frequency ≈ 1 in ' + fmtSci(m.oneIn, 'en') + ' (computed on ' + m.loci + ' loci, approximate frequencies).'));
    out.push(T('Deux explications restent possibles pour cette concordance : une même source, ou deux personnes non apparentées partageant ce profil par hasard.', 'Two explanations remain possible for this agreement: one source, or two unrelated people who share this profile by chance.'));
  }
  out.push(NOTE_PROFILES);
  return out;
}

function describeSingle(c, cmp, get) {
  const A = get(cmp.a, 'auto'), na = nm(c, cmp.a);
  if (!A) return [T('Aucun profil autosomique n’est disponible pour le ' + na.fr + '.', 'No autosomal profile is available for ' + na.en + '.')];
  const m = randomMatch(A), diff = hasDifferential(c, cmp.a) ? [T('Profil de la fraction spermatique (extraction différentielle automatique). Un report d’ADN de la personne plaignante est possible dans cette fraction ; ces allèles ne sont pas représentés ici (rappel de cours).', 'Profile of the sperm fraction (automatic differential extraction). Carry-over of the complainant’s DNA is possible in this fraction; those alleles are not shown here (course reminder).')] : [];
  if (m.loci < 8) return [T('Profil du ' + na.fr + ' : seulement ' + m.loci + ' loci typés ; trop partiel pour une comparaison fiable.', 'Profile of ' + na.en + ': only ' + m.loci + ' loci typed; too partial for a reliable comparison.')].concat(diff);
  return [T('Profil du ' + na.fr + ' : ' + m.loci + ' loci typés ; fréquence du profil ≈ 1 sur ' + fmtSci(m.oneIn, 'fr') + ' (fréquences approchées). Ce profil peut être comparé ultérieurement à un profil de référence.', 'Profile of ' + na.en + ': ' + m.loci + ' loci typed; profile frequency ≈ 1 in ' + fmtSci(m.oneIn, 'en') + ' (approximate frequencies). This profile can later be compared with a reference profile.'), ...diff, NOTE_PROFILES];
}

function describeOrient(c, cmp, get) {
  const R = get(cmp.a, 'ngs'), na = nm(c, cmp.a);
  if (!R) return [T('Aucun résultat NGS n’est disponible pour le ' + na.fr + '.', 'No NGS result is available for ' + na.en + '.')];
  if (!R.interpretable) return [T('Le run NGS du ' + na.fr + ' n’est pas interprétable (' + R.quality + ' % des marqueurs).', 'The NGS run of ' + na.en + ' is not interpretable (' + R.quality + '% of markers).')];
  const topA = R.ancestry.slice().sort((x, y) => y.pct - x.pct)[0], aLabel = ANCESTRY.find(a => a.id === topA.id).label;
  const tr = t => { const top = R.pheno[t].slice().sort((x, y) => y.pct - x.pct)[0], cat = PHENO[t].cats.find(x => x[0] === top.id); return { fr: PHENO[t].label.fr.toLowerCase() + ' ' + cat[1] + ' (' + top.pct + ' %)', en: PHENO[t].label.en.toLowerCase() + ': ' + cat[2] + ' (' + top.pct + '%)' }; };
  return [
    T('Marqueurs d’ancestralité du ' + na.fr + ' (' + R.quality + ' % des marqueurs) : la composante majoritaire correspond à « ' + aLabel.fr + ' » (' + topA.pct + ' %).', 'Ancestry markers of ' + na.en + ' (' + R.quality + '% of markers): the main component corresponds to “' + aLabel.en + '” (' + topA.pct + '%).'),
    T('Prédictions les plus probables : ' + ['eyes', 'hair', 'skin'].map(t => tr(t).fr).join(' ; ') + '.', 'Most probable predictions: ' + ['eyes', 'hair', 'skin'].map(t => tr(t).en).join('; ') + '.'),
    T('Ce sont des estimations probabilistes issues des marqueurs analysés : elles orientent une recherche mais ne désignent aucune personne.', 'These are probabilistic estimates from the markers analysed: they orient a search but designate no one.')
  ];
}

// ctx: { results: [...] } — the student's results (including their consensus profiles). Returns the reveal items.
export function buildReveal(c, ctx) {
  const results = ctx.results || [];
  const bestOf = (sid, kind) => {
    const mine = results.filter(r => r.scelleId === sid && r.kind === kind);
    if (!mine.length) return null;
    const score = r => kind === 'auto' ? r.complete * 10 + (r.derived ? 1 : 0) : kind === 'ngs' ? (r.interpretable ? 100 : 0) + r.quality : r.complete;
    const best = mine.slice().sort((a, b) => score(b) - score(a))[0];
    return kind === 'ngs' || best.complete ? best : null;
  };
  const truthGet = (sid, kind) => {
    const st = c.sites[sid].find(x => x.role === 'target'), p = st && st.source ? c.persons[st.source] : null;
    if (!p) return null;
    return kind === 'auto' ? truthAuto(p) : kind === 'y' ? truthY(p) : kind === 'mt' ? truthMt(p) : { kind: 'ngs', quality: 100, interpretable: true, ...ngsOf(p.genome, 1, makeRng('reveal')) };
  };
  const describe = (cmp, get) => cmp.kind === 'kinship' ? describeKinship(c, cmp, get) : cmp.kind === 'orient' ? describeOrient(c, cmp, get) : cmp.kind === 'single' ? describeSingle(c, cmp, get) : describeMatch(c, cmp, get);
  const items = c.comparisons.map(cmp => {
    const ids = cmp.b ? [cmp.a, cmp.b] : [cmp.a];
    return { header: T(ids.map(i => 'scellé n°' + scelleOf(c, i).no + ' (' + scelleOf(c, i).title.fr + ')').join(' ↔ '), ids.map(i => 'exhibit #' + scelleOf(c, i).no + ' (' + scelleOf(c, i).title.en + ')').join(' ↔ ')),
      yours: describe(cmp, bestOf), complete: describe(cmp, truthGet) };
  });
  return { items, closing: T('Ces conclusions comparent des profils entre eux. Elles ne présument ni des circonstances du dossier ni de l’origine des prélèvements, et ne répondent pas à la question « qui a fait quoi ».', 'These statements compare profiles with one another. They make no assumption about the circumstances of the case or the origin of the samples, and do not answer the question “who did what”.') };
}
