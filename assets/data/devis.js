/* ============================================================
   Simulateur de devis — interpréter une réquisition (issue #32).

   The student receives a réquisition (more or less vague, written by a
   requérant who is not always competent in genetics) and a list of
   scellés, and must build a QUOTE: which scellés to take on, which
   package for each, how many profiles, whether to add Y-STR / mtDNA,
   and which tariff (normal / GAV / urgence). One click lets them ask
   the requérant for details; the réquisition is clear afterwards.

   Grading covers the decisions AND whether the student had enough
   information to take them (asking when the text was already clear, or
   not asking when it was not, both lose points).

   Everything here is a DRAFT teaching model pending maintainer review:
   prices are fictional teaching values and the scoring weights are
   proposals. Pure ES module, shared by the browser and Node tests.
   Bilingual {fr,en}.
   ============================================================ */
import { makeRng } from '../epg/rng.js';

export const text = (fr, en) => ({ fr, en });

/* Shared building blocks (names, parties, wording) come from
   assets/data/requisition-shared.js, a classic script common to the requisition
   generator and this simulator (#76). Read lazily when a case is built. */
function shared() {
  const S = globalThis.REQUISITION_SHARED;
  if (!S) throw new Error('requisition-shared.js must be loaded first (globalThis.REQUISITION_SHARED)');
  return S;
}

/* ---------- Price grid (fictional teaching values) ---------- */
export const packages = {
  ref:      { price: 70,  label: text('Prélèvement déjà réalisé reçu (écouvillon, FTA, sang…) → profil autosomique', 'Sample already taken, received (swab, FTA, blood…) → autosomal profile') },
  tissue:   { price: 140, label: text('Organe (muscle…) ou os à échantillonner → profil autosomique', 'Organ (muscle…) or bone to sample → autosomal profile') },
  item:     { price: 200, label: text('Objet à échantillonner, trace possible → profil', 'Item to sample, a trace may be present → profile') },
  diffMale: { price: 200, label: text('Extraction différentielle → profil masculin', 'Differential extraction → male profile') },
  diffBoth: { price: 300, label: text('Extraction différentielle → profils masculin et féminin', 'Differential extraction → male and female profiles') }
};
export const addons = {
  y:  { price: 100, label: text('Ajouter STR Y', 'Add Y-STR') },
  mt: { price: 600, label: text('Ajouter ADN mitochondrial', 'Add mtDNA') }
};
export const tariffs = {
  normal:  { mult: 1,   label: text('Tarif normal', 'Normal tariff') },
  gav:     { mult: 2,   label: text('Garde à vue (48 h) : prix ×2', 'Police custody (48 h): price ×2') },
  urgence: { mult: 1.5, label: text('Urgence (1 semaine) : +50 %', 'Emergency (1 week): +50 %') }
};

/* ---------- Kinship: which analysis can answer the question ---------- */
// Only parent/offspring and siblings are reachable by autosomal STR LR.
// Otherwise a shared lineage is needed: Y (paternal male line) or mtDNA
// (maternal line). `none` relations have no feasible analysis.
export const relations = {
  self:               { auto: true,  label: text('objets personnels de l’inconnu', 'unknown person’s own belongings') },
  parent:             { auto: true,  label: text('mère ou père', 'parent') },
  sibling:            { auto: true,  label: text('frère ou sœur (germain)', 'full sibling') },
  paternalUncle:      { y: true,     label: text('oncle paternel (frère du père)', 'paternal uncle (father’s brother)') },
  paternalGrandfather:{ y: true,     label: text('grand-père paternel', 'paternal grandfather') },
  maternalAunt:       { mt: true,    label: text('tante maternelle (sœur de la mère)', 'maternal aunt (mother’s sister)') },
  maternalHalfSibling:{ mt: true,    label: text('demi-frère ou demi-sœur utérin(e)', 'maternal half-sibling') },
  paternalHalfSister: { label: text('demi-sœur par le père', 'paternal half-sister') },
  adopted:            { label: text('enfant adopté', 'adopted child') }
};
export function analysisFor(rel) {
  const r = relations[rel];
  if (!r) throw new Error('Unknown relation ' + rel);
  if (r.auto) return { feasible: true, y: false, mt: false };
  if (r.y) return { feasible: true, y: true, mt: false };
  if (r.mt) return { feasible: true, y: false, mt: true };
  return { feasible: false, y: false, mt: false };
}

/* ---------- Grading weights (proposal) ---------- */
export const weights = { info: 20, selection: 25, pkg: 20, profiles: 10, addons: 15, tariff: 10 };
export const absurdWeights = { info: 30, decision: 70 };

/* ---------- Quote arithmetic ---------- */
export function linePrice(line) {
  if (!line || !line.analyse || !packages[line.pkg]) return 0;
  const n = line.profiles === 2 ? 2 : 1;
  return packages[line.pkg].price * n + (line.y ? addons.y.price : 0) + (line.mt ? addons.mt.price : 0);
}
export function quoteTotal(lines, tariff) {
  const sum = Object.values(lines || {}).reduce((s, l) => s + linePrice(l), 0);
  return sum * (tariffs[tariff]?.mult ?? 1);
}

/* ---------- Clarity rules (owner-defined) ---------- */
// A réquisition is clear (no need to ask) when its stated facts meet the rule.
export const clarityRules = {
  identification: s => !!s.relation,
  saSites:        s => (!!s.allSamples || !!s.listedSamples) && !!s.spermWhere && !!s.victimStated,
  saEjaculation:  s => (!!s.unknownAuthor || !!s.sperm) && !!s.victimStated,
  miscItems:      s => !!s.itemsLinked,
  absurd:         () => false
};

/* ---------- Case catalogue ---------- */
const sc = (id, fr, en, natureFr, natureEn, props) => ({ id, title: text(fr, en), nature: text(natureFr, natureEn), ...props });

function deadlineText(d) {
  if (d === 'gav') return text(' L’auteur présumé est en garde à vue : résultats attendus sous 48 heures.', ' The suspect is in police custody: results are expected within 48 hours.');
  if (d === 'urgence') return text(' Résultats souhaités sous une semaine.', ' Results requested within one week.');
  return text('', '');
}
const join = (...parts) => text(parts.map(p => p.fr).join(''), parts.map(p => p.en).join(''));

/* Per-scellé truth: what the correct quote contains once all facts are known.
   props used: material ('ref'|'swab'|'tissue'|'item'), trace, sperm ('yes'|'unknown'|'no'),
   relevant, wantsBoth, relation. */
export function expectedLine(s, relation) {
  if (!s.relevant) return { analyse: false };
  let pkg;
  if (s.material === 'tissue') pkg = 'tissue';
  else if (s.sperm === 'yes' || s.sperm === 'unknown') pkg = s.wantsBoth ? 'diffBoth' : 'diffMale';
  else pkg = s.material === 'item' ? 'item' : 'ref'; // any sample already taken and received (swab, FTA, blood), reference or trace
  const a = relation ? analysisFor(relation) : { y: false, mt: false };
  return { analyse: true, pkg, profiles: s.trace ? [1, 2] : [1], y: a.y, mt: a.mt };
}

// Organ sample taken from remains. Always a named organ (never "tissu", which reads as cloth); muscle most of the time.
const organ = rng => rng.weightedPick([text('muscle', 'muscle'), text('foie', 'liver'), text('rein', 'kidney')], [6, 1, 1]);

// Names are drawn per case (shared pools), never fixed.
const nameOf = p => text(p.full, (p.sex === 'F' ? 'Ms ' : 'Mr ') + p.first + ' ' + p.surname);
const KINSHIP = {
  parent: rng => {
    const S = shared(), sex = rng.bool(0.5) ? 'F' : 'M', p = S.relative(rng, sex), n = nameOf(p), F = sex === 'F';
    return { who: n,
      stated: text(' ' + p.full + (F ? ' est la mère présumée' : ' est le père présumé') + ' de la personne disparue.', ' ' + n.en + ' is the presumed ' + (F ? 'mother' : 'father') + ' of the missing person.'),
      clarification: text(p.full + ' pense être ' + (F ? 'la mère biologique' : 'le père biologique') + ' de la personne disparue.', n.en + ' believes ' + (F ? 'she is' : 'he is') + ' the biological ' + (F ? 'mother' : 'father') + ' of the missing person.') };
  },
  paternalUncle: rng => {
    const p = shared().relative(rng, 'M'), n = nameOf(p);
    return { who: n,
      stated: text(' ' + p.full + ' est le frère du père de la personne disparue, qui était un homme.', ' ' + n.en + ' is the brother of the missing person’s father; the missing person was a man.'),
      clarification: text(p.full + ' est l’oncle paternel (frère du père) de la personne disparue, qui était un homme. Le père est décédé.', n.en + ' is the paternal uncle (father’s brother) of the missing person, who was a man. The father is deceased.') };
  },
  maternalAunt: rng => {
    const p = shared().relative(rng, 'F'), n = nameOf(p);
    return { who: n,
      stated: text(' ' + p.full + ' est la sœur de la mère de la personne disparue.', ' ' + n.en + ' is the sister of the missing person’s mother.'),
      clarification: text(p.full + ' est la tante maternelle (sœur de la mère) de la personne disparue. La mère est décédée.', n.en + ' is the maternal aunt (mother’s sister) of the missing person. The mother is deceased.') };
  }
};

function buildIdentification(rng, rel, variant, deadline) {
  const k = KINSHIP[rel](rng);
  const og = organ(rng);
  const unknown = sc('u', 'Fragment de ' + og.fr, og.en.charAt(0).toUpperCase() + og.en.slice(1) + ' fragment', 'Prélevé sur des restes non identifiés.', 'Taken from unidentified remains.', { material: 'tissue', trace: false, sperm: null, relevant: true });
  const ref = sc('r', 'Écouvillon buccal de ' + k.who.fr, 'Cheek swab of ' + k.who.en, 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: true });
  const base = text('Identifier la personne dont les restes sont décrits ci-dessous par comparaison avec le prélèvement de référence de ' + k.who.fr + '.', 'Identify the person whose remains are described below by comparing with the reference sample of ' + k.who.en + '.');
  const requisition = join(base, variant === 'clear' ? k.stated : text('', ''), deadlineText(deadline));
  return { requisition, clarification: k.clarification, scelles: [unknown, ref], relation: rel, stated: { relation: variant === 'clear' }, rule: 'identification' };
}

// Fourteen sampling sites. Which ones exist depends on the complainant's sex: the
// genital-area samples follow the alleged penetration (vaginal or anal).
// [id, fr, en, may carry sperm, relevant when the request is limited to the alleged facts]
const SITES_F = [
  ['vag', 'Écouvillon vaginal', 'Vaginal swab', true, true],
  ['vul', 'Écouvillon vulvaire', 'Vulvar swab', true, true],
  ['ana', 'Écouvillon anal', 'Anal swab', false, false],
  ['bou', 'Écouvillon buccal', 'Oral swab', false, false],
  ['cou', 'Écouvillon du cou', 'Neck swab', false, true],
  ['seg', 'Écouvillon du sein gauche', 'Left breast swab', false, false],
  ['sed', 'Écouvillon du sein droit', 'Right breast swab', false, false],
  ['cug', 'Écouvillon de la cuisse gauche', 'Left thigh swab', false, false],
  ['cud', 'Écouvillon de la cuisse droite', 'Right thigh swab', false, false],
  ['olg', 'Prélèvement sous-ongulaire gauche', 'Left fingernail scrapings', false, false],
  ['odr', 'Prélèvement sous-ongulaire droit', 'Right fingernail scrapings', false, false],
  ['poi', 'Écouvillon du poignet droit', 'Right wrist swab', false, true],
  ['pub', 'Peignage pubien', 'Pubic combing', true, false],
  ['che', 'Prélèvement de cheveux', 'Hair sample', false, false]
];
const SITES_M = [
  ['ana', 'Écouvillon anal', 'Anal swab', true, true],
  ['pen', 'Écouvillon pénien', 'Penile swab', false, false],
  ['sco', 'Écouvillon scrotal', 'Scrotal swab', false, false],
  ['bou', 'Écouvillon buccal', 'Oral swab', false, false],
  ['cou', 'Écouvillon du cou', 'Neck swab', false, true],
  ['tho', 'Écouvillon du thorax', 'Chest swab', false, false],
  ['abd', 'Écouvillon de l’abdomen', 'Abdomen swab', false, false],
  ['cug', 'Écouvillon de la cuisse gauche', 'Left thigh swab', false, false],
  ['cud', 'Écouvillon de la cuisse droite', 'Right thigh swab', false, false],
  ['olg', 'Prélèvement sous-ongulaire gauche', 'Left fingernail scrapings', false, false],
  ['odr', 'Prélèvement sous-ongulaire droit', 'Right fingernail scrapings', false, false],
  ['poi', 'Écouvillon du poignet droit', 'Right wrist swab', false, true],
  ['pub', 'Peignage pubien', 'Pubic combing', true, false],
  ['che', 'Prélèvement de cheveux', 'Hair sample', false, false]
];
const sitesFor = p => p.victimSex === 'F' ? SITES_F : SITES_M;
const genitalIds = p => p.victimSex === 'F' ? ['vag', 'vul', 'pub'] : ['ana', 'pub'];
const genitalLabel = p => p.victimSex === 'F' ? text('prélèvements vaginal, vulvaire et pubien', 'vaginal, vulvar and pubic samples') : text('prélèvements anal et pubien', 'anal and pubic samples');

// In practice a sexual-assault case often asks for the victim's own profile too: a reference
// sample (70 EUR) plus a differential (male profile) on the stain or swab. The 300 EUR
// both-profiles differential stays in the grid as a distractor and is never the ideal answer.
// The victim's reference swab is ALWAYS attached; whether it is wanted is a decisive fact the
// réquisition must state (or the requester clarify).
function victimStatement(p, wanted) {
  const v = shared().victim(p);
  return wanted
    ? text(' Établir aussi le profil ' + v.of.fr + ' à partir de son prélèvement de référence (écouvillon buccal joint).', ' Also establish the profile ' + v.of.en + ' from ' + v.poss + ' reference sample (cheek swab attached).')
    : text(' Le profil ' + v.of.fr + ' n’est pas demandé.', ' The profile ' + v.of.en + ' is not requested.');
}
function victimRef(p, relevant) {
  const v = shared().victim(p);
  return sc('refv', 'Écouvillon buccal ' + v.of.fr + ' (référence)', 'Cheek swab ' + v.of.en + ' (reference)',
    'Prélèvement de référence ' + v.of.fr + ', sans lien avec les faits eux-mêmes.', 'Reference sample ' + v.of.en + ', unrelated to the events themselves.',
    { material: 'ref', trace: false, sperm: null, relevant });
}

// What the complainant says about ejaculation, and where sperm can then be (the genital area only).
function ejaculationClause(p, status) {
  const S = shared(), g = genitalLabel(p), sent = S.ejaculation(p, status, 'genital');
  if (status === 'no') return text(' ' + sent.fr, ' ' + sent.en);
  const where = status === 'yes'
    ? text(' L’éjaculation ne peut pas concerner le cou, le poignet ni les autres sites ; seule la zone génitale (' + g.fr + ') est concernée.', ' The ejaculation cannot concern the neck, the wrist or the other sites; only the genital area (' + g.en + ') is concerned.')
    : text(' Une éjaculation ne pourrait pas concerner le cou, le poignet ni les autres sites ; seule la zone génitale (' + g.fr + ') est possible.', ' An ejaculation could not concern the neck, the wrist or the other sites; only the genital area (' + g.en + ') is possible.');
  return join(text(' ' + sent.fr, ' ' + sent.en), where);
}

function buildSaSites(rng, variant, deadline, o = {}) {
  const S = shared(), p = o.parties || S.drawParties(rng), v = S.victim(p), a = S.author(p), pen = S.penetration(p);
  // clear variants: 'list' (names the samples) or 'all' (analyse everything)
  const sub = variant === 'clear' ? rng.pick(['list', 'all']) : 'vague';
  const all = sub === 'all';
  const wantRef = o.victimRef ?? rng.bool(0.5);
  const status = o.ejaculation || rng.weightedPick(['yes', 'unknown', 'no'], [4, 4, 2]);
  const sites = sitesFor(p), first = genitalIds(p)[0];
  const scelles = sites.map(([id, fr, en, sperm, limited]) => sc(id, fr, en, 'Prélèvement sur ' + v.noun.fr + ' lors de l’examen médical.', 'Taken from ' + v.noun.en + ' during the medical examination.', {
    material: 'swab', trace: true, sperm: !sperm ? 'no' : status === 'no' ? 'no' : status === 'yes' && id === first ? 'yes' : 'unknown', relevant: all || limited
  }));
  // The oral swab belongs to the facts of the case; it is not the reference swab.
  const oral = scelles.find(x => x.id === 'bou');
  oral.nature = text('Écouvillon de la cavité buccale prélevé lors de l’examen médical au titre des faits (distinct de l’écouvillon de référence).', 'Oral cavity swab taken during the medical examination as part of the events (distinct from the reference swab).');
  scelles.push(victimRef(p, wantRef));
  const listFr = sites.filter(s => s[4]).map(s => s[1].toLowerCase()).join(', ');
  const listEn = sites.filter(s => s[4]).map(s => s[2].toLowerCase()).join(', ');
  const factsFr = v.Subj.fr + ' décrit ' + pen.act.fr + ', des baisers dans le cou et une contention du poignet droit.';
  const factsEn = v.Subj.en + ' describe' + v.s + ' ' + pen.act.en + ', kissing of the neck and restraint of the right wrist.';
  const base = text('Agression sexuelle. ' + S.cap(v.noun.fr) + ' a été ' + v.sampled + ' à quatorze endroits lors de l’examen médical ; les prélèvements sont joints, ainsi que l’écouvillon buccal de référence ' + v.of.fr + '. L’objectif est de retrouver le profil ' + a.of.fr + '.',
    'Sexual assault. ' + S.cap(v.noun.en) + ' was sampled at fourteen sites during the medical examination; the samples are attached, together with ' + v.poss + ' reference cheek swab. The aim is to find the alleged assailant’s profile.');
  let extra = text('', '');
  if (sub === 'all') extra = text(' Analyser l’ensemble des prélèvements et restituer tous les profils qui peuvent être obtenus.', ' Analyse all the samples and return every profile that can be obtained.');
  if (sub === 'list') extra = text(' Merci d’analyser les prélèvements suivants : ' + listFr + '.', ' Please analyse the following samples: ' + listEn + '.');
  // A clear réquisition also states the alleged facts, whether ejaculation is reported (and where
  // sperm can then be), and whether the victim's profile is wanted.
  if (variant === 'clear') extra = join(extra, text(' ' + factsFr, ' ' + factsEn), ejaculationClause(p, status), victimStatement(p, wantRef));
  const clarification = join(
    text(factsFr + ' Seuls les prélèvements suivants sont à analyser : ' + listFr + '.', factsEn + ' Only the following samples are to be analysed: ' + listEn + '.'),
    ejaculationClause(p, status), victimStatement(p, wantRef));
  return { requisition: join(base, extra, deadlineText(deadline)), clarification, scelles, relation: null, parties: p, ejaculation: status,
    stated: { allSamples: sub === 'all', listedSamples: sub === 'list', spermWhere: variant === 'clear', victimStated: variant === 'clear' }, rule: 'saSites' };
}

function buildSaEjaculation(rng, variant, deadline, o = {}) {
  const S = shared(), p = o.parties || S.drawParties(rng), v = S.victim(p), a = S.author(p), pen = S.penetration(p);
  const wantRef = o.victimRef ?? rng.bool(0.5);
  const slip = sc('slip', 'Slip ' + v.of.fr, 'Underwear ' + v.of.en, 'Vêtement saisi après l’agression.', 'Garment seized after the assault.', { material: 'item', trace: true, sperm: 'unknown', relevant: true });
  const truthNo = variant === 'vague' && rng.bool(0.4); // ejaculation excluded in the clarification (vague cases only)
  let stated = {}, extra = text('', '');
  if (variant === 'clear') {
    if (rng.bool(0.5)) { stated = { unknownAuthor: true }; extra = text(' ' + S.cap(v.noun.fr) + ' ne connaît pas ' + a.noun.fr + '.', ' ' + S.cap(v.noun.en) + ' does not know the alleged assailant.'); }
    else { stated = { sperm: true }; extra = text(' Des spermatozoïdes ont été retrouvés à l’examen microscopique du slip.', ' Spermatozoa were found on microscopic examination of the underwear.'); }
    stated.victimStated = true;
    extra = join(extra, victimStatement(p, wantRef));
    slip.sperm = stated.sperm ? 'yes' : 'unknown';
  } else {
    slip.sperm = truthNo ? 'no' : 'unknown';
  }
  const base = text('Agression sexuelle. ' + v.Subj.fr + ' décrit ' + pen.act.fr + '. Merci de rechercher le profil ADN ' + a.of.fr + ' sur le slip ' + v.of.fr + ' ; l’écouvillon buccal de référence ' + v.of.fr + ' est joint.',
    'Sexual assault. ' + v.Subj.en + ' describe' + v.s + ' ' + pen.act.en + '. Please look for the alleged assailant’s DNA profile on the underwear ' + v.of.en + '; the reference cheek swab ' + v.of.en + ' is attached.');
  const clarification = join(truthNo
    ? text('Selon ' + v.noun.fr + ', ' + a.noun.fr + ' a utilisé un préservatif : il n’y a pas eu d’éjaculation sur le slip.', 'According to ' + v.noun.en + ', the alleged assailant used a condom: there was no ejaculation on the underwear.')
    : S.ejaculation(p, 'unknown'), victimStatement(p, wantRef));
  return { requisition: join(base, extra, deadlineText(deadline)), clarification, scelles: [slip, victimRef(p, wantRef)], relation: null, parties: p, stated, rule: 'saEjaculation' };
}

const FLAT_ITEMS = [
  ['dent', 'Brosse à dents', 'Toothbrush', true],
  ['razo', 'Rasoir électrique', 'Electric razor', true],
  ['peig', 'Peigne', 'Comb', true],
  ['casq', 'Casquette', 'Cap', true],
  ['mug', 'Mug', 'Mug', false],
  ['meg', 'Mégot de cigarette (cendrier du salon)', 'Cigarette butt (living-room ashtray)', false],
  ['gan', 'Paire de gants', 'Pair of gloves', false]
];
function buildMiscItems(rng, variant, deadline) {
  const og = organ(rng);
  const body = sc('corps', 'Fragment de ' + og.fr + ' (corps non identifié)', og.en.charAt(0).toUpperCase() + og.en.slice(1) + ' fragment (unidentified body)', 'Prélevé sur le corps à identifier.', 'Taken from the body to be identified.', { material: 'tissue', trace: false, sperm: null, relevant: true });
  const items = rng.shuffle(FLAT_ITEMS).map(([id, fr, en, linked]) => sc(id, fr, en, 'Objet saisi au domicile présumé de la personne.', 'Item seized at the person’s presumed home.', { material: 'item', trace: true, sperm: 'no', relevant: linked }));
  const linked = FLAT_ITEMS.filter(i => i[3]);
  const lf = linked.map(i => i[1].toLowerCase()).join(', '), le = linked.map(i => i[2].toLowerCase()).join(', ');
  const base = text('Identifier le corps décrit ci-dessous. Divers objets saisis au domicile de la personne présumée sont joints.', 'Identify the body described below. Various items seized at the presumed person’s home are attached.');
  const extra = variant === 'clear' ? text(' Les objets suivants sont ses effets personnels : ' + lf + '. Les autres ont été trouvés dans le salon.', ' The following are the person’s personal belongings: ' + le + '. The others were found in the living room.') : text('', '');
  const clarification = text('Les objets personnels de la personne sont : ' + lf + '. Les autres (mug, mégot, gants) ont été trouvés dans le salon et peuvent appartenir à des visiteurs.', 'The person’s personal belongings are: ' + le + '. The others (mug, cigarette butt, gloves) were found in the living room and may belong to visitors.');
  return { requisition: join(base, extra, deadlineText(deadline)), clarification, scelles: [body, ...items], relation: 'self', stated: { itemsLinked: variant === 'clear' }, rule: 'miscItems' };
}

/* Absurd cases: the first requisition makes no sense. After the info click the client either corrects it (absurdFix) or confirms there is nothing to do (absurdVoid). */
function buildAbsurdBlood(rng) {
  const S = shared(), p = S.drawParties(rng), v = S.victim(p), a = S.author(p), pen = S.penetration(p);
  const pid = p.victimSex === 'F' ? 'vag' : 'ana';
  const blood = sc('sang', 'Prise de sang ' + v.of.fr, 'Blood draw ' + v.of.en, 'Sang prélevé à l’hôpital.', 'Blood drawn at the hospital.', { material: 'ref', trace: false, sperm: null, relevant: false });
  const slip = sc('slip', 'Slip ' + v.of.fr, 'Underwear ' + v.of.en, 'Vêtement saisi après l’agression.', 'Garment seized after the assault.', { material: 'item', trace: true, sperm: 'unknown', relevant: true });
  const swab = sc(pid, S.cap(pen.swab.fr), S.cap(pen.swab.en), 'Prélèvement sur ' + v.noun.fr + ' lors de l’examen médical.', 'Taken from ' + v.noun.en + ' during the medical examination.', { material: 'ref', trace: true, sperm: 'unknown', relevant: true });
  return {
    kind: 'absurdFix', rule: 'absurd', parties: p,
    requisition: text('Agression sexuelle. Merci d’analyser la prise de sang ' + v.of.fr + ' afin d’identifier ' + a.noun.fr + '.', 'Sexual assault. Please analyse the blood draw ' + v.of.en + ' in order to identify the alleged assailant.'),
    clarification: text('Pardon, la prise de sang ne sert qu’à établir le profil de référence ' + v.of.fr + '. Il fallait analyser le slip et l’' + pen.swab.fr + '. Nous ne savons pas s’il y a eu éjaculation.', 'Sorry, the blood draw is only meant as the reference profile ' + v.of.en + '. We meant the underwear and the ' + pen.swab.en + ' to be analysed. We do not know whether ejaculation occurred.'),
    scelles: [blood], corrected: [slip, swab, { ...blood, relevant: true }], relation: null, stated: {}
  };
}
function buildAbsurdCouch(rng) {
  const S = shared(), p = S.drawParties(rng), v = S.victim(p), a = S.author(p);
  const couch = sc('can', 'Écouvillons du canapé du salon', 'Living-room couch swabs', 'Prélèvements réalisés sur un canapé.', 'Swabs taken from a couch.', { material: 'ref', trace: true, sperm: 'unknown', relevant: false });
  return {
    kind: 'absurdVoid', rule: 'absurd', parties: p,
    requisition: text('Agression sexuelle. Merci d’analyser les écouvillons prélevés sur le canapé du salon afin de retrouver l’ADN ' + a.of.fr + '.', 'Sexual assault. Please analyse the swabs taken from the living-room couch to find the alleged assailant’s DNA.'),
    clarification: text('Selon ' + v.noun.fr + ', ' + a.noun.fr + ' s’est assis sur ce canapé. Nous n’avons aucun prélèvement de référence ' + a.of.fr + '.', 'According to ' + v.noun.en + ', the alleged assailant sat on that couch. We have no reference sample for the alleged assailant.'),
    scelles: [couch], relation: null, stated: {}
  };
}
function buildAbsurdAdopted(rng) {
  const S = shared(), p = S.relative(rng, 'M'), n = nameOf(p);
  const m = sc('m', 'Écouvillon buccal de ' + n.fr, 'Cheek swab of ' + n.en, 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  const e1 = sc('e1', 'Écouvillon buccal de l’enfant 1', 'Cheek swab of child 1', 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  const e2 = sc('e2', 'Écouvillon buccal de l’enfant 2', 'Cheek swab of child 2', 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  return {
    kind: 'absurdVoid', rule: 'absurd',
    requisition: text('Établir le lien de filiation biologique entre ' + n.fr + ' et ses deux enfants.', 'Establish the biological parentage between ' + n.en + ' and his two children.'),
    clarification: text('Les deux enfants ont été adoptés : il n’existe aucun lien biologique à établir. Désolé, la demande n’a pas de sens.', 'Both children were adopted: there is no biological link to establish. Sorry, the request makes no sense.'),
    scelles: [m, e1, e2], relation: 'adopted', stated: {}
  };
}
function buildAbsurdHalfSister(rng) {
  const S = shared(), p = S.relative(rng, 'M'), n = nameOf(p);
  const u = sc('u', 'Fragment de muscle', 'Muscle fragment', 'Prélevé sur les restes d’une femme non identifiée.', 'Taken from the remains of an unidentified woman.', { material: 'tissue', trace: false, sperm: null, relevant: false });
  const r = sc('r', 'Écouvillon buccal de ' + n.fr, 'Cheek swab of ' + n.en, 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  return {
    kind: 'absurdVoid', rule: 'absurd',
    requisition: text('Identifier la femme dont les restes sont décrits ci-dessous par comparaison avec le prélèvement de référence de ' + n.fr + '.', 'Identify the woman whose remains are described below by comparing with the reference sample of ' + n.en + '.'),
    clarification: text(n.fr + ' et la défunte ont le même père mais pas la même mère. Désolé, nous n’avons pas d’autre parent à proposer.', n.en + ' and the deceased share the same father but not the same mother. Sorry, we have no other relative to propose.'),
    scelles: [u, r], relation: 'paternalHalfSister', stated: {}
  };
}

export const templates = [
  { id: 'id-parent', archetype: 'identification', kind: 'normal', variants: ['vague', 'clear'], deadlines: ['normal', 'urgence'], build: (rng, v, d) => buildIdentification(rng, 'parent', v, d) },
  { id: 'id-uncle', archetype: 'identification', kind: 'normal', variants: ['vague', 'clear'], deadlines: ['normal', 'urgence'], build: (rng, v, d) => buildIdentification(rng, 'paternalUncle', v, d) },
  { id: 'id-maternal-aunt', archetype: 'identification', kind: 'normal', variants: ['vague', 'clear'], deadlines: ['normal', 'urgence'], build: (rng, v, d) => buildIdentification(rng, 'maternalAunt', v, d) },
  { id: 'sa-sites', archetype: 'sa-sites', kind: 'normal', variants: ['vague', 'clear'], deadlines: ['normal', 'urgence', 'gav'], build: (rng, v, d, o) => buildSaSites(rng, v, d, o) },
  { id: 'sa-ejaculation', archetype: 'sa-ejaculation', kind: 'normal', variants: ['vague', 'clear'], deadlines: ['normal', 'urgence', 'gav'], build: (rng, v, d, o) => buildSaEjaculation(rng, v, d, o) },
  { id: 'misc-flat', archetype: 'misc-items', kind: 'normal', variants: ['vague', 'clear'], deadlines: ['normal', 'urgence'], build: (rng, v, d) => buildMiscItems(rng, v, d) },
  { id: 'absurd-blood', archetype: 'absurd', kind: 'absurdFix', variants: ['vague'], deadlines: ['normal'], build: (rng) => buildAbsurdBlood(rng) },
  { id: 'absurd-couch', archetype: 'absurd', kind: 'absurdVoid', variants: ['vague'], deadlines: ['normal'], build: (rng) => buildAbsurdCouch(rng) },
  { id: 'absurd-adopted', archetype: 'absurd', kind: 'absurdVoid', variants: ['vague'], deadlines: ['normal'], build: (rng) => buildAbsurdAdopted(rng) },
  { id: 'absurd-half-sister', archetype: 'absurd', kind: 'absurdVoid', variants: ['vague'], deadlines: ['normal'], build: (rng) => buildAbsurdHalfSister(rng) }
];

/* ---------- Case generation (seeded, reproducible) ---------- */
export function makeCase(seed, opts = {}) {
  const rng = makeRng(seed);
  const t = opts.template ? templates.find(x => x.id === opts.template) : rng.pick(templates);
  if (!t) throw new Error('Unknown template ' + opts.template);
  const variant = opts.variant && t.variants.includes(opts.variant) ? opts.variant : rng.pick(t.variants);
  const deadline = opts.deadline && t.deadlines.includes(opts.deadline) ? opts.deadline : rng.weightedPick(t.deadlines, t.deadlines.map(d => d === 'normal' ? 3 : 1));
  const b = t.build(rng, variant, deadline, opts);
  const kind = b.kind || 'normal';
  // Shared sentences use straight apostrophes; this module uses typographic ones.
  const curl = o => o && typeof o === 'object' && 'fr' in o ? text(o.fr.replaceAll("'", '’'), o.en.replaceAll("'", '’')) : o;
  const curlSc = x => ({ ...x, title: curl(x.title), nature: curl(x.nature) });
  b.requisition = curl(b.requisition); b.clarification = curl(b.clarification);
  b.scelles = b.scelles.map(curlSc); if (b.corrected) b.corrected = b.corrected.map(curlSc);
  const needsInfo = !clarityRules[b.rule](b.stated);
  return {
    seed: rng.seed, template: t.id, archetype: t.archetype, kind, variant: kind === 'normal' ? variant : 'vague',
    deadline, needsInfo, mustAsk: kind !== 'normal' ? true : needsInfo,
    requisition: b.kind ? joinDeadline(b.requisition, deadline) : b.requisition,
    clarification: b.clarification, scelles: b.scelles, corrected: b.corrected || null,
    relation: b.relation, stated: b.stated, parties: b.parties || null, ejaculation: b.ejaculation || null
  };
}
function joinDeadline(req, deadline) { return join(req, deadlineText(deadline)); }

/* Scellés shown to the student at this stage. */
export function visibleScelles(c, asked) {
  return asked && c.corrected ? c.corrected : c.scelles;
}

/* The expected quote (ideal answer), computed from the full truth. */
export function idealAnswer(c) {
  const asked = c.mustAsk;
  if (c.kind === 'absurdVoid') return { asked, declined: true, tariff: c.deadline, lines: {} };
  const lines = {};
  for (const s of visibleScelles(c, asked)) {
    const e = expectedLine(s, c.relation);
    lines[s.id] = e.analyse ? { analyse: true, pkg: e.pkg, profiles: 1, y: e.y, mt: e.mt } : { analyse: false };
  }
  return { asked, declined: false, tariff: c.deadline, lines };
}

/* ---------- Grading ---------- */
// state: { asked, declined, tariff, lines: { [scelleId]: { analyse, pkg, profiles, y, mt } } }
export function grade(c, state) {
  const asked = !!state.asked;
  const notes = [];
  const warnings = [];
  const infoOk = asked === c.mustAsk;

  if (c.kind !== 'normal') {
    const w = absurdWeights;
    const info = infoOk ? w.info : 0;
    if (!asked) warnings.push('shouldHaveAsked');
    if (state.declined) {
      const right = c.kind === 'absurdVoid';
      return { kind: c.kind, total: info + (right ? w.decision : 0), info, decision: right ? w.decision : 0, warnings, infoOk, criteria: {}, expectedTotal: 0, studentTotal: 0, declineRight: right };
    }
    if (c.kind === 'absurdVoid') {
      return { kind: c.kind, total: info, info, decision: 0, warnings, infoOk, criteria: {}, expectedTotal: 0, studentTotal: quoteTotal(state.lines, state.tariff), declineRight: false };
    }
    if (!asked) return { kind: c.kind, total: 0, info: 0, decision: 0, warnings, infoOk: false, criteria: {}, expectedTotal: 0, studentTotal: quoteTotal(state.lines, state.tariff), declineRight: false };
    const g = gradeQuote(c, state);
    const decision = Math.round(g.quotePart * w.decision);
    return { ...g, kind: c.kind, info, decision, total: info + decision, warnings, infoOk };
  }

  if (state.declined) {
    return { kind: c.kind, total: 0, info: 0, decision: 0, warnings: ['declinedValidRequest'], infoOk, criteria: {}, expectedTotal: 0, studentTotal: 0, declineRight: false };
  }
  const g = gradeQuote(c, state);
  const criteria = { ...g.criteria, info: { score: infoOk ? 1 : 0 } };
  const keys = Object.keys(weights).filter(k => criteria[k].applicable !== false);
  const wsum = keys.reduce((s, k) => s + weights[k], 0);
  const total = Math.round(keys.reduce((s, k) => s + weights[k] * criteria[k].score, 0) / wsum * 100);
  return { ...g, criteria, kind: c.kind, total, info: infoOk ? weights.info : 0, warnings: infoOk ? [] : [asked ? 'askedUnnecessarily' : 'shouldHaveAsked'], infoOk };
}

function gradeQuote(c, state) {
  const asked = !!state.asked;
  const scelles = visibleScelles(c, asked);
  const exp = {};
  for (const s of scelles) exp[s.id] = expectedLine(s, c.relation);
  const lines = state.lines || {};
  const get = id => lines[id] || { analyse: false };

  let selOk = 0;
  for (const s of scelles) if (!!get(s.id).analyse === exp[s.id].analyse) selOk++;
  const expectedIds = scelles.filter(s => exp[s.id].analyse).map(s => s.id);
  const pkgOk = expectedIds.filter(id => get(id).analyse && get(id).pkg === exp[id].pkg).length;
  const profOk = expectedIds.filter(id => get(id).analyse && exp[id].profiles.includes(get(id).profiles === 2 ? 2 : 1)).length;
  const addOk = expectedIds.filter(id => get(id).analyse && !!get(id).y === exp[id].y && !!get(id).mt === exp[id].mt).length;
  const expectedAddons = expectedIds.some(id => exp[id].y || exp[id].mt);
  const studentAddons = Object.values(lines).some(l => l.analyse && (l.y || l.mt));
  const n = Math.max(1, expectedIds.length);
  const criteria = {
    selection: { score: selOk / Math.max(1, scelles.length) },
    pkg: { score: pkgOk / n },
    profiles: { score: profOk / n },
    addons: { score: addOk / n, applicable: expectedAddons || studentAddons },
    tariff: { score: state.tariff === c.deadline ? 1 : 0 }
  };
  const expectedLines = {};
  for (const id of expectedIds) expectedLines[id] = { analyse: true, pkg: exp[id].pkg, profiles: 1, y: exp[id].y, mt: exp[id].mt };
  const quotePart = (criteria.selection.score * weights.selection + criteria.pkg.score * weights.pkg + criteria.profiles.score * weights.profiles +
    (criteria.addons.applicable ? criteria.addons.score * weights.addons : 0) + criteria.tariff.score * weights.tariff) /
    (weights.selection + weights.pkg + weights.profiles + (criteria.addons.applicable ? weights.addons : 0) + weights.tariff);
  return { criteria, quotePart, expected: exp, expectedLines, expectedTotal: quoteTotal(expectedLines, c.deadline), studentTotal: quoteTotal(lines, state.tariff), declineRight: false };
}
