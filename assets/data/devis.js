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

/* ---------- Price grid (fictional teaching values) ---------- */
export const packages = {
  ref:      { price: 70,  label: text('Échantillon de référence reçu (écouvillon buccal, sang, FTA…) → profil autosomique', 'Reference sample received (cheek swab, blood, FTA…) → autosomal profile') },
  tissue:   { price: 140, label: text('Tissu ou os à échantillonner → profil autosomique', 'Tissue or bone to sample → autosomal profile') },
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
  saSites:        s => !!s.allSamples || !!s.listedSamples,
  saEjaculation:  s => !!s.unknownAuthor || !!s.sperm,
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
   props used: material ('ref'|'tissue'|'item'), trace, sperm ('yes'|'unknown'|'no'),
   relevant, wantsBoth, relation. */
export function expectedLine(s, relation) {
  if (!s.relevant) return { analyse: false };
  let pkg;
  if (s.material === 'tissue') pkg = 'tissue';
  else if (s.sperm === 'yes' || s.sperm === 'unknown') pkg = s.wantsBoth ? 'diffBoth' : 'diffMale';
  else pkg = s.material === 'item' ? 'item' : 'ref';
  const a = relation ? analysisFor(relation) : { y: false, mt: false };
  return { analyse: true, pkg, profiles: s.trace ? [1, 2] : [1], y: a.y, mt: a.mt };
}

const KINSHIP = {
  parent: {
    ref: ['Mme Durand', text('Mme Durand', 'Ms Durand')],
    stated: text(' Mme Durand est la mère présumée de la personne disparue.', ' Ms Durand is the presumed mother of the missing person.'),
    clarification: text('Mme Durand pense être la mère biologique de la personne disparue.', 'Ms Durand believes she is the biological mother of the missing person.')
  },
  paternalUncle: {
    ref: ['M. Lefèvre', text('M. Lefèvre', 'Mr Lefèvre')],
    stated: text(' M. Lefèvre est le frère du père de la personne disparue, qui était un homme.', ' Mr Lefèvre is the brother of the missing person’s father; the missing person was a man.'),
    clarification: text('M. Lefèvre est l’oncle paternel (frère du père) de la personne disparue, qui était un homme. Le père est décédé.', 'Mr Lefèvre is the paternal uncle (father’s brother) of the missing person, who was a man. The father is deceased.')
  },
  maternalAunt: {
    ref: ['Mme Petit', text('Mme Petit', 'Ms Petit')],
    stated: text(' Mme Petit est la sœur de la mère de la personne disparue.', ' Ms Petit is the sister of the missing person’s mother.'),
    clarification: text('Mme Petit est la tante maternelle (sœur de la mère) de la personne disparue. La mère est décédée.', 'Ms Petit is the maternal aunt (mother’s sister) of the missing person. The mother is deceased.')
  }
};

function buildIdentification(rng, rel, variant, deadline) {
  const k = KINSHIP[rel];
  const unknown = sc('u', 'Fragment de tissu', 'Tissue fragment', 'Prélevé sur des restes non identifiés.', 'Taken from unidentified remains.', { material: 'tissue', trace: false, sperm: null, relevant: true });
  const ref = sc('r', 'Écouvillon buccal de ' + k.ref[0], 'Cheek swab of ' + k.ref[1].en, 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: true });
  const base = text('Identifier la personne dont les restes sont décrits ci-dessous par comparaison avec le prélèvement de référence de ' + k.ref[0] + '.', 'Identify the person whose remains are described below by comparing with the reference sample of ' + k.ref[1].en + '.');
  const requisition = join(base, variant === 'clear' ? k.stated : text('', ''), deadlineText(deadline));
  return { requisition, clarification: k.clarification, scelles: [unknown, ref], relation: rel, stated: { relation: variant === 'clear' }, rule: 'identification' };
}

const SITES = [
  ['vag', 'Écouvillon vaginal', 'Vaginal swab', true, true],
  ['vul', 'Écouvillon vulvaire', 'Vulvar swab', true, true],
  ['ana', 'Écouvillon anal', 'Anal swab', true, false],
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

// In practice a sexual-assault case often asks for the victim's own profile too: a reference
// sample (70 EUR) plus a differential (male profile) on the stain or swab. The 300 EUR
// both-profiles differential stays in the grid as a distractor and is never the ideal answer.
const VICTIM_REF_TEXT = text(' Établir aussi le profil de la victime à partir de son prélèvement de référence (écouvillon buccal joint).', ' Also establish the victim’s profile from her reference sample (cheek swab attached).');
const victimRef = () => sc('refv', 'Écouvillon buccal de la victime (référence)', 'Victim’s cheek swab (reference)', 'Prélèvement de référence de la victime.', 'Victim’s reference sample.', { material: 'ref', trace: false, sperm: null, relevant: true });

function buildSaSites(rng, variant, deadline, o = {}) {
  // clear variants: 'list' (names the samples) or 'all' (analyse everything)
  const sub = variant === 'clear' ? rng.pick(['list', 'all']) : 'vague';
  const all = sub === 'all';
  const wantRef = o.victimRef ?? rng.bool(0.5);
  const scelles = SITES.map(([id, fr, en, sperm, limited]) => sc(id, fr, en, 'Prélèvement de la victime lors de l’examen médical.', 'Taken from the victim during the medical examination.', {
    material: 'ref', trace: true, sperm: sperm ? 'unknown' : 'no', relevant: all || limited
  }));
  const listFr = SITES.filter(s => s[4]).map(s => s[1].toLowerCase()).join(', ');
  const listEn = SITES.filter(s => s[4]).map(s => s[2].toLowerCase()).join(', ');
  const base = text('Agression sexuelle. La victime a été prélevée à quatorze endroits lors de l’examen médical ; les prélèvements sont joints.', 'Sexual assault. The victim was sampled at fourteen sites during the medical examination; the samples are attached.');
  let extra = text('', '');
  if (sub === 'all') extra = text(' Analyser l’ensemble des prélèvements et restituer tous les profils qui peuvent être obtenus.', ' Analyse all the samples and return every profile that can be obtained.');
  if (sub === 'list') extra = text(' Merci d’analyser les prélèvements suivants : ' + listFr + '.', ' Please analyse the following samples: ' + listEn + '.');
  if (wantRef) { extra = join(extra, VICTIM_REF_TEXT); scelles.push(victimRef()); }
  const clarification = text('Les faits décrits sont une pénétration vaginale, des baisers dans le cou et une contention du poignet droit. Seuls les prélèvements vaginal, vulvaire, du cou et du poignet sont à analyser. Il n’est pas certain qu’il y ait eu éjaculation.', 'The alleged facts are vaginal penetration, kissing of the neck and restraint of the right wrist. Only the vaginal, vulvar, neck and wrist samples are to be analysed. It is not certain that ejaculation occurred.');
  return { requisition: join(base, extra, deadlineText(deadline)), clarification, scelles, relation: null, stated: { allSamples: sub === 'all', listedSamples: sub === 'list' }, rule: 'saSites' };
}

function buildSaEjaculation(rng, variant, deadline, o = {}) {
  const wantRef = o.victimRef ?? rng.bool(0.5);
  const slip = sc('slip', 'Slip de la victime', 'Victim’s underwear', 'Vêtement saisi après l’agression.', 'Garment seized after the assault.', { material: 'item', trace: true, sperm: 'unknown', relevant: true });
  const truthNo = variant === 'vague' && rng.bool(0.4); // ejaculation excluded in the clarification (vague cases only)
  let stated = {}, extra = text('', '');
  if (variant === 'clear') {
    if (rng.bool(0.5)) { stated = { unknownAuthor: true }; extra = text(' La victime ne connaît pas son agresseur.', ' The victim does not know her attacker.'); }
    else { stated = { sperm: true }; extra = text(' Des spermatozoïdes ont été retrouvés à l’examen microscopique du slip.', ' Spermatozoa were found on microscopic examination of the underwear.'); }
    slip.sperm = stated.sperm ? 'yes' : 'unknown';
  } else {
    slip.sperm = truthNo ? 'no' : 'unknown';
  }
  const scellesE = [slip];
  const base = text('Agression sexuelle. Merci de rechercher le profil ADN de l’auteur sur le slip de la victime.', 'Sexual assault. Please look for the attacker’s DNA profile on the victim’s underwear.');
  if (wantRef) { extra = join(extra, VICTIM_REF_TEXT); scellesE.push(victimRef()); }
  const clarification = truthNo
    ? text('Selon la victime, l’agresseur a utilisé un préservatif : il n’y a pas eu d’éjaculation sur le slip.', 'According to the victim, the attacker used a condom: there was no ejaculation on the underwear.')
    : text('La victime ne sait pas s’il y a eu éjaculation.', 'The victim does not know whether ejaculation occurred.');
  return { requisition: join(base, extra, deadlineText(deadline)), clarification, scelles: scellesE, relation: null, stated, rule: 'saEjaculation' };
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
  const body = sc('corps', 'Fragment de tissu (corps non identifié)', 'Tissue fragment (unidentified body)', 'Prélevé sur le corps à identifier.', 'Taken from the body to be identified.', { material: 'tissue', trace: false, sperm: null, relevant: true });
  const items = rng.shuffle(FLAT_ITEMS).map(([id, fr, en, linked]) => sc(id, fr, en, 'Objet saisi au domicile présumé de la personne.', 'Item seized at the person’s presumed home.', { material: 'item', trace: true, sperm: 'no', relevant: linked }));
  const linked = FLAT_ITEMS.filter(i => i[3]);
  const lf = linked.map(i => i[1].toLowerCase()).join(', '), le = linked.map(i => i[2].toLowerCase()).join(', ');
  const base = text('Identifier le corps décrit ci-dessous. Divers objets saisis au domicile de la personne présumée sont joints.', 'Identify the body described below. Various items seized at the presumed person’s home are attached.');
  const extra = variant === 'clear' ? text(' Les objets suivants sont ses effets personnels : ' + lf + '. Les autres ont été trouvés dans le salon.', ' The following are the person’s personal belongings: ' + le + '. The others were found in the living room.') : text('', '');
  const clarification = text('Les objets personnels de la personne sont : ' + lf + '. Les autres (mug, mégot, gants) ont été trouvés dans le salon et peuvent appartenir à des visiteurs.', 'The person’s personal belongings are: ' + le + '. The others (mug, cigarette butt, gloves) were found in the living room and may belong to visitors.');
  return { requisition: join(base, extra, deadlineText(deadline)), clarification, scelles: [body, ...items], relation: 'self', stated: { itemsLinked: variant === 'clear' }, rule: 'miscItems' };
}

/* Absurd cases: the first requisition makes no sense. After the info click the client either corrects it (absurdFix) or confirms there is nothing to do (absurdVoid). */
function buildAbsurdBlood() {
  const blood = sc('sang', 'Prise de sang de la victime', 'Victim’s blood draw', 'Sang prélevé à l’hôpital.', 'Blood drawn at the hospital.', { material: 'ref', trace: false, sperm: null, relevant: false });
  const slip = sc('slip', 'Slip de la victime', 'Victim’s underwear', 'Vêtement saisi après l’agression.', 'Garment seized after the assault.', { material: 'item', trace: true, sperm: 'unknown', relevant: true });
  const vag = sc('vag', 'Écouvillon vaginal', 'Vaginal swab', 'Prélèvement de la victime lors de l’examen médical.', 'Taken from the victim during the medical examination.', { material: 'ref', trace: true, sperm: 'unknown', relevant: true });
  return {
    kind: 'absurdFix', rule: 'absurd',
    requisition: text('Agression sexuelle. Merci d’analyser la prise de sang de la victime afin d’identifier l’auteur.', 'Sexual assault. Please analyse the victim’s blood draw in order to identify the attacker.'),
    clarification: text('Pardon, la prise de sang ne sert qu’à établir le profil de référence de la victime. Il fallait analyser le slip et l’écouvillon vaginal. Nous ne savons pas s’il y a eu éjaculation.', 'Sorry, the blood draw is only meant as the victim’s reference profile. We meant the underwear and the vaginal swab to be analysed. We do not know whether ejaculation occurred.'),
    scelles: [blood], corrected: [slip, vag, { ...blood, relevant: true }], relation: null, stated: {}
  };
}
function buildAbsurdCouch() {
  const couch = sc('can', 'Écouvillons du canapé du salon', 'Living-room couch swabs', 'Prélèvements réalisés sur un canapé.', 'Swabs taken from a couch.', { material: 'ref', trace: true, sperm: 'unknown', relevant: false });
  return {
    kind: 'absurdVoid', rule: 'absurd',
    requisition: text('Agression sexuelle. Merci d’analyser les écouvillons prélevés sur le canapé du salon afin de retrouver l’ADN de l’auteur.', 'Sexual assault. Please analyse the swabs taken from the living-room couch to find the attacker’s DNA.'),
    clarification: text('Après vérification, les faits se sont déroulés dans un véhicule. Le canapé n’a aucun lien avec l’affaire. Désolé, il n’y a rien à analyser.', 'On checking, the events took place in a vehicle. The couch has no connection to the case. Sorry, there is nothing to analyse.'),
    scelles: [couch], relation: null, stated: {}
  };
}
function buildAbsurdAdopted() {
  const m = sc('m', 'Écouvillon buccal de M. Martin', 'Cheek swab of Mr Martin', 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  const e1 = sc('e1', 'Écouvillon buccal de l’enfant 1', 'Cheek swab of child 1', 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  const e2 = sc('e2', 'Écouvillon buccal de l’enfant 2', 'Cheek swab of child 2', 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  return {
    kind: 'absurdVoid', rule: 'absurd',
    requisition: text('Établir le lien de filiation biologique entre M. Martin et ses deux enfants.', 'Establish the biological parentage between Mr Martin and his two children.'),
    clarification: text('Les deux enfants ont été adoptés : il n’existe aucun lien biologique à établir. Désolé, la demande n’a pas de sens.', 'Both children were adopted: there is no biological link to establish. Sorry, the request makes no sense.'),
    scelles: [m, e1, e2], relation: 'adopted', stated: {}
  };
}
function buildAbsurdHalfSister() {
  const u = sc('u', 'Fragment de tissu', 'Tissue fragment', 'Prélevé sur les restes d’une femme non identifiée.', 'Taken from the remains of an unidentified woman.', { material: 'tissue', trace: false, sperm: null, relevant: false });
  const r = sc('r', 'Écouvillon buccal de M. Roux', 'Cheek swab of Mr Roux', 'Prélèvement de référence.', 'Reference sample.', { material: 'ref', trace: false, sperm: null, relevant: false });
  return {
    kind: 'absurdVoid', rule: 'absurd',
    requisition: text('Identifier la femme dont les restes sont décrits ci-dessous par comparaison avec le prélèvement de référence de M. Roux.', 'Identify the woman whose remains are described below by comparing with the reference sample of Mr Roux.'),
    clarification: text('M. Roux et la défunte ont le même père mais pas la même mère. Désolé, nous n’avons pas d’autre parent à proposer.', 'Mr Roux and the deceased share the same father but not the same mother. Sorry, we have no other relative to propose.'),
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
  { id: 'absurd-blood', archetype: 'absurd', kind: 'absurdFix', variants: ['vague'], deadlines: ['normal'], build: () => buildAbsurdBlood() },
  { id: 'absurd-couch', archetype: 'absurd', kind: 'absurdVoid', variants: ['vague'], deadlines: ['normal'], build: () => buildAbsurdCouch() },
  { id: 'absurd-adopted', archetype: 'absurd', kind: 'absurdVoid', variants: ['vague'], deadlines: ['normal'], build: () => buildAbsurdAdopted() },
  { id: 'absurd-half-sister', archetype: 'absurd', kind: 'absurdVoid', variants: ['vague'], deadlines: ['normal'], build: () => buildAbsurdHalfSister() }
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
  const needsInfo = !clarityRules[b.rule](b.stated);
  return {
    seed: rng.seed, template: t.id, archetype: t.archetype, kind, variant: kind === 'normal' ? variant : 'vague',
    deadline, needsInfo, mustAsk: kind !== 'normal' ? true : needsInfo,
    requisition: b.kind ? joinDeadline(b.requisition, deadline) : b.requisition,
    clarification: b.clarification, scelles: b.scelles, corrected: b.corrected || null,
    relation: b.relation, stated: b.stated
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
