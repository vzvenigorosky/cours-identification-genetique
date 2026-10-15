import { getKit } from '../epg/panels.js';
import { makeRng } from '../epg/rng.js';
import { randomProfile, fullSibs } from '../epg/genetics.js';

export const text = (fr, en) => ({ fr, en });
export const policy = { maxVolume: 10, autoInput: 0.1, yInput: 0.05, autoDI: 5 };
export const methods = { auto: text('STR autosomiques', 'Autosomal STRs'), y: text('STR Y', 'Y-STRs'), mt: text('Mitogénome complet', 'Whole mitogenome'), defer: text('Différer / nouveau prélèvement', 'Defer / resample') };
export const extractionMethods = { classic: text('Extraction classique adaptée au support', 'Standard extraction suited to the substrate'), differential: text('Extraction différentielle', 'Differential extraction') };
export const conclusions = {
  single: text('Concordance autosomique avec une référence', 'Autosomal concordance with one reference'),
  mixture: text('Mélange : pas d’attribution individuelle unique', 'Mixture: no unique individual attribution'),
  lineage: text('Concordance de lignée : pas d’identification unique', 'Lineage concordance: no unique identification'),
  unassigned: text('Non attribuable aux références fournies', 'Not attributable to the supplied references'),
  noresult: text('Pas de résultat interprétable par cette approche', 'No interpretable result from this approach')
};
export const scenarios = {
  semen: {
    title: text('Trace avec spermatozoïdes', 'Sperm-containing trace'),
    brief: text('Après une agression sexuelle présumée, un prélèvement comporte des cellules épithéliales et des spermatozoïdes confirmés par microscopie. A est la plaignante ; B et C sont deux hommes de la même lignée paternelle. Objectif : comparer la composante spermatique aux références, sans conclure sur les faits.', 'Following an alleged sexual assault, a sample contains epithelial cells and sperm confirmed by microscopy. A is the complainant; B and C are two men from the same paternal lineage. Aim: compare the sperm-associated component with references, without conclusions about the events.'),
    extraction: text('La différentielle est privilégiée pour enrichir les spermatozoïdes ; la classique reste une stratégie possible, suivie ici des STR Y en excès d’ADN épithélial. Les fractions ne sont ni des fractions « femme/homme » ni nécessairement pures.', 'Differential extraction is preferred to enrich sperm; standard extraction remains possible, followed here by Y-STRs in epithelial DNA excess. Fractions are neither “female/male” fractions nor necessarily pure.'),
    allowed: ['classic', 'differential']
  },
  blood: {
    title: text('Cambriolage : sang et contact', 'Burglary: blood and touch DNA'),
    brief: text('Une tache de sang et une trace de contact sont prélevées lors d’un cambriolage. A, B et C sont trois personnes de référence sans parenté connue. Aucun spermatozoïde ni contexte de séparation spermatique. Objectif : privilégier une comparaison autosomique ; différer si la quantité disponible est insuffisante.', 'A bloodstain and touch sample are collected after a burglary. A, B and C are three reference people with no known relationship. No sperm or reason for sperm separation. Aim: prioritize autosomal comparison; defer when available input is insufficient.'),
    extraction: text('Extraction classique adaptée au support. La différentielle n’apporte pas de séparation pertinente à ces prélèvements et peut entraîner des pertes.', 'Use standard extraction suited to the substrate. Differential extraction offers no relevant separation here and may lose material.'),
    allowed: ['classic']
  },
  bone: {
    title: text('Os ancien : comparaison de lignée', 'Old bone: lineage comparison'),
    brief: text('Un fragment osseux ancien est comparé à A et B, deux références d’une même lignée maternelle, et C, une référence d’une autre lignée. Objectif : rechercher une concordance de lignée si l’analyse nucléaire est insuffisante. Le laboratoire fournit un contrôle de faisabilité mitochondrial indépendant.', 'An old bone fragment is compared with A and B, two references from the same maternal lineage, and C, a reference from another lineage. Aim: seek lineage concordance if nuclear analysis is insufficient. The laboratory supplies an independent mitochondrial feasibility assessment.'),
    extraction: text('Extraction classique adaptée à l’os, incluant le prétraitement approprié. La différentielle spermatique ne convient pas à ce support.', 'Standard extraction adapted to bone, including appropriate pretreatment. Sperm differential extraction is not appropriate for this substrate.'),
    allowed: ['classic']
  }
};
export const autoLoci = getKit('globalfiler').loci.filter(l => !l.type);
export const yLoci = getKit('yfilerplus').loci;
const round = (n, places = 4) => Number(n.toFixed(places));
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const subset = (a,b) => a.every(x => b.includes(x));

export function makeCase(seed, type = 'semen') {
  if (!scenarios[type]) throw new Error('Unknown MG2 scenario');
  const rng = makeRng(seed);
  const mitotypes = [];
  while (mitotypes.length < 4) {
    const id = `M-${rng.int(100000,999999)}`;
    if (!mitotypes.includes(id)) mitotypes.push(id);
  }
  const refs = ['A','B','C','U'].map((id,i) => ({ id,
    auto: randomProfile(getKit('globalfiler'), rng, { sex: i === 0 ? 'F' : 'M' }).geno,
    y: i === 0 ? null : randomProfile(getKit('yfilerplus'), rng, { sex: 'M' }).geno,
    mt: mitotypes[i]
  }));
  if (type === 'semen') {
    const brothers = fullSibs(getKit('globalfiler'), rng);
    refs[1].auto = brothers.a.geno; refs[2].auto = brothers.b.geno;
    refs[2].y = structuredClone(refs[1].y);
  }
  if (type === 'bone') refs[1].mt = refs[0].mt;
  return { seed, type, refs, donor: type === 'semen' ? rng.pick(['B','C']) : rng.pick(type === 'bone' ? ['A','U'] : ['B','C','U']),
    carryover: rng.bool(0.4), rich: round(rng.range(0.12,0.4)), variation: round(rng.range(0.85,1.15)) };
}
export function extract(c, method) {
  const scenario = scenarios[c.type];
  if (!scenario.allowed.includes(method)) return [];
  const e = (id,label,auto,y,di,sources,extra={}) => ({ id,label,auto:round(auto),y:round(y),di,
    large: round(round(auto)/di,8), sources, mtQC:false, yQC: y > 0, ...extra });
  if (c.type === 'semen') {
    if (method === 'classic') return [e('total',text('Extrait total', 'Total extract'),1.2*c.variation,0.012*c.variation,1.2,['A',c.donor],
      { unresolvedAuto:true, preferred:'y', reason:text('ADN Y minoritaire dans un fort excès d’ADN autosomique : STR Y prioritaires pour la composante masculine. La quantité Y ne prouve pas une origine spermatique.', 'Minor Y-bearing DNA in a large autosomal DNA excess: prioritize Y-STRs for the male component. Y quantity does not establish sperm origin.') })];
    return [
      e('ns',text('Fraction non spermatique', 'Non-sperm fraction'),0.5*c.variation,0.1*c.variation,1.1,['A',c.donor],
        { preferred:'auto', reason:text('Quantité nucléaire suffisante ; comparer le mélange sans supposer une fraction pure.', 'Sufficient nuclear input; compare the mixture without assuming a pure fraction.') }),
      e('s',text('Fraction enrichie en spermatozoïdes', 'Sperm-enriched fraction'),c.rich,c.carryover ? c.rich*0.85 : c.rich,1.3,c.carryover ? ['A',c.donor] : [c.donor],
        { preferred:'auto', reason:text('Enrichissement spermatique avec ADN nucléaire suffisant. Les STR autosomiques sont prioritaires ; une contamination croisée résiduelle est possible.', 'Sperm enrichment with sufficient nuclear DNA. Prioritize autosomal STRs; residual carryover is possible.') })
    ];
  }
  if (c.type === 'blood') return [
    e('blood',text('Tache de sang', 'Bloodstain'),c.rich,c.rich,1.2,[c.donor], { preferred:'auto', reason:text('ADN nucléaire suffisant et peu dégradé : priorité aux STR autosomiques.', 'Sufficient nuclear DNA with limited degradation: prioritize autosomal STRs.') }),
    e('touch',text('Trace de contact pauvre', 'Low-yield touch sample'),0.0008,0.0004,2.0,['U'], { preferred:'defer', mtQC:false, reason:text('À 10 µL, seulement 0,008 ng autosomique et 0,004 ng Y ; sous les seuils de ce protocole. Préserver le reliquat, envisager nouveau prélèvement / optimisation. Une faible quantité nucléaire ne suffit pas à prescrire le mtDNA.', 'At 10 µL, only 0.008 ng autosomal and 0.004 ng Y; below this protocol’s inputs. Preserve the remainder and consider resampling / optimization. Low nuclear input alone does not justify mtDNA testing.') })
  ];
  return [e('bone',text('Extrait osseux', 'Bone extract'),0.0008,0,18,[c.donor], { mtQC:true, yQC:false, preferred:'mt', reason:text('Très faible quantité nucléaire et DI élevé. Le contrôle mitochondrial indépendant est favorable : mitogénome complet pour une comparaison de lignée, pas pour identifier seul un individu.', 'Very low nuclear quantity and high DI. Independent mitochondrial feasibility is favorable: whole mitogenome for lineage comparison, not individual identification by itself.') })];
}
export function analyze(c,e,method) {
  if (!Object.hasOwn(methods,method)) throw new Error('Unknown analysis');
  const fail = reason => ({ method, status:'noresult', rows:[], matches:[], conclusion:'noresult', reason });
  if (method === 'defer') return fail(text('Analyse différée ; aucun profil produit.', 'Analysis deferred; no profile produced.'));
  if (method === 'auto' && (e.auto*policy.maxVolume < policy.autoInput || e.di>policy.autoDI || e.unresolvedAuto)) return fail(e.unresolvedAuto ?
    text('Mélange très déséquilibré : composante minoritaire non interprétable par le modèle autosomique simplifié. Ce n’est pas une exclusion des contributeurs minoritaires.', 'Highly unbalanced mixture: minor component cannot be interpreted by this simplified autosomal model. This does not exclude minor contributors.') : text('Le modèle ne produit pas de profil autosomique exploitable avec cet apport / cette dégradation. Cela ne prouve pas une absence d’ADN.', 'The model yields no usable autosomal profile at this input / degradation. This does not establish absence of DNA.'));
  if (method === 'y' && (e.y*policy.maxVolume < policy.yInput || !e.yQC)) return fail(text('Apport Y ou contrôle de faisabilité insuffisant ; pas de profil Y interprétable.', 'Insufficient Y input or feasibility assessment; no interpretable Y profile.'));
  if (method === 'mt' && !e.mtQC) return fail(text('Aucune validation de faisabilité mitochondriale pour cet extrait ; le modèle ne fournit pas de résultat.', 'No favorable mitochondrial feasibility assessment for this extract; the model supplies no result.'));
  const sources = e.sources.map(id=>c.refs.find(r=>r.id===id));
  if (method === 'mt') {
    const value = sources[0].mt;
    const matches = c.refs.filter(r=>r.id!=='U' && r.mt===value).map(r=>r.id);
    return { method,status:'profile',rows:[{locus:'mtDNA',value:[value]}],matches,conclusion:matches.length?'lineage':'unassigned',reason:text('Identifiants symboliques de séquences complètes simulées : aucun variant clinique ou réel. Une concordance peut concerner plusieurs apparentés maternels et des personnes non apparentées.', 'Symbolic IDs for simulated complete sequences: no real or clinical variants. Concordance may include multiple maternal relatives and unrelated people.') };
  }
  const loci = method==='auto' ? autoLoci : yLoci;
  const contributors = method==='y' ? sources.filter(r=>r.y) : sources;
  const mixture = contributors.length>1;
  const rows = loci.map(l=>({locus:l.name,value:(mixture ? [...new Set(contributors.flatMap(r=>r[method][l.name]))] : [...contributors[0][method][l.name]]).sort((a,b)=>a-b)}));
  const matches = c.refs.filter(r=>r.id!=='U' && (method!=='y' || r.y) && rows.every(row => {
    const ref=[...r[method][row.locus]].sort((a,b)=>a-b);
    return mixture ? subset(ref,row.value) : equal(ref,row.value);
  })).map(r=>r.id);
  return { method,status:'profile',rows,matches,conclusion:mixture?'mixture':matches.length?(method==='y'?'lineage':'single'):'unassigned',
    reason: method==='y' ? text('Les STR Y comparent des lignées paternelles. Une concordance ne distingue pas nécessairement les membres de cette lignée et ne prouve ni présence de sperme ni participation aux faits.', 'Y-STRs compare paternal lineages. A concordance cannot necessarily distinguish members of that lineage and proves neither sperm presence nor involvement in events.') : mixture ? text('Union allélique des contributeurs, sans artefacts ni drop-out dans ce modèle. Une référence compatible n’est pas un donneur démontré ; aucune déconvolution ni LR n’est calculé.', 'Contributor allele union, without artifacts or drop-out in this model. A compatible reference is not a proven donor; no deconvolution or LR is calculated.') : text('Concordance évaluée sur les 21 loci autosomiques. La compatibilité observée n’est pas une identification certaine ni une conclusion sur l’activité ; aucune statistique de poids de preuve n’est calculée.', 'Concordance evaluated over 21 autosomal loci. Observed compatibility is not certain identification or an activity conclusion; no weight-of-evidence statistic is calculated.') };
}
export function gradeResult(result, selected, conclusion) {
  if (!Array.isArray(selected)) return { references:false, conclusion:conclusion===result.conclusion };
  const a = [...new Set(selected)].sort();
  return { references: equal(a,[...result.matches].sort()), conclusion: conclusion===result.conclusion };
}
