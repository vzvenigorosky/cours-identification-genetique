import { getKit, allelesOf, sizeOf } from '../epg/panels.js';
import { makeRng } from '../epg/rng.js';
import { simulate } from '../epg/simulate.js';

// Focused teaching panel; retain the shared kit's approximate fragment bins.
export const kit = { ...getKit('globalfiler'), label: 'GlobalFiler — MG4',
  loci: getKit('globalfiler').loci.filter(l => ['D3S1358', 'D21S11', 'FGA'].includes(l.name)) };
export const actions = {
  keep: { fr: 'Conserver : allèle', en: 'Keep: allele' },
  review: { fr: 'Conserver et vérifier OL', en: 'Retain and review OL' },
  stutter: { fr: 'Écarter : stutter', en: 'Exclude: stutter' },
  pullup: { fr: 'Écarter : pull-up', en: 'Exclude: pull-up' }
};
export function expected(p) {
  return p.kind === 'allele' ? (p.offladder ? 'review' : 'keep') : p.kind;
}
export function binLabel(p) {
  for (const l of kit.loci.filter(l => l.dye === p.dye)) {
    for (const a of allelesOf(l)) if (Math.abs(sizeOf(l, a) - p.size) <= 0.5) return `${l.name}: ${a}`;
  }
  return 'OL';
}
export function parentOf(sim, p) {
  return sim.peaks.find(q => q.kind === 'allele' && q.dye !== p.dye && q.size === p.size && q.height > 4000);
}
export function makeCase(seed) {
  const rng = makeRng(seed);
  // Reject ambiguous overlaps and orphan echoes after the simulator's OL nudge.
  // Keep core simulation unchanged; every graded peak has an unambiguous origin.
  for (let attempt = 0; attempt < 1000; attempt++) {
    const geno = {}, contributors = [];
    for (const [i, l] of kit.loci.entries()) {
      const al = allelesOf(l).filter(Number.isInteger);
      const a = rng.pick(al.slice(0, -3));
      const b = rng.pick(al.filter(b => b >= a + 3));
      geno[l.name] = [a, b];
      for (const [j, allele] of [a, b].entries()) contributors.push({
        geno: { [l.name]: [allele] }, amount: i === 0 && j === 1 ? 2200 : rng.range(6500, 8500), degradation: 0.1
      });
    }
    const original = kit.loci.flatMap(l => geno[l.name].map(a => ({ dye: l.dye, size: sizeOf(l, a), repeat: l.repeat })));
    if (original.some(p => original.some(q => p !== q && p.dye !== q.dye &&
      [q.size, q.size - q.repeat, q.size + q.repeat].includes(p.size)))) continue;
    // Disjoint allele components represent differential amplification of ONE source.
    const sim = simulate(kit, contributors, { rng, callArtifacts: true, olRate: 1, olMax: 1,
      art: { stutter: true, pullup: true, noise: true, minusA: false, dropin: false, spike: false, blob: false, offladder: true } });
    const candidates = sim.peaks.filter(p => p.height >= sim.thresholds.at);
    const truePeaks = sim.peaks.filter(p => p.kind === 'allele');
    if (truePeaks.length !== 6 || !truePeaks.some(p => p.offladder)) continue;
    if (sim.peaks.some(p => p.kind === 'pullup' && !parentOf(sim, p))) continue;
    // No same-dye near overlaps, or true allele / stutter co-located with an echo.
    if (sim.peaks.some((p, i) => sim.peaks.some((q, j) => j > i && p.dye === q.dye && Math.abs(p.size - q.size) < 2))) continue;
    if (truePeaks.some(p => truePeaks.some(q => q !== p && q.size === p.size))) continue;
    if (sim.peaks.some(p => p.kind === 'stutter' && parentOf(sim, p))) continue;
    if (!candidates.some(p => p.kind === 'pullup') || !candidates.some(p => p.kind === 'stutter')) continue;
    return { seed, geno, sim, candidates: candidates.map((p, i) => ({ ...p, id: `P${i + 1}` })) };
  }
  throw new Error('Could not generate an unambiguous MG4 case');
}
export function grade(c, answers) {
  const rows = c.candidates.map(p => ({ p, answer: answers[p.id] || '', expected: expected(p), correct: answers[p.id] === expected(p) }));
  return { rows, correct: rows.filter(r => r.correct).length, total: rows.length };
}
export function explanation(c, p, lang) {
  const en = lang === 'en';
  if (p.kind === 'pullup') {
    const q = parentOf(c.sim, p);
    return en ? `Spectral bleed-through: same ${p.size} bp as the taller ${q.dye} allele (${q.height} RFU); echo/parent = ${(100*p.height/q.height).toFixed(1)}%. Exclude this echo, retain the parent. Alignment alone is not proof in real casework; an allele can overlap a pull-up.`
      : `Débordement spectral : même taille (${p.size} pb) que l’allèle plus haut en ${q.dye} (${q.height} RFU) ; écho/parent = ${(100*p.height/q.height).toFixed(1)} %. Écarter cet écho, conserver le parent. En pratique, l’alignement seul ne suffit pas : un allèle peut coïncider avec un pull-up.`;
  }
  if (p.kind === 'stutter') {
    const l = kit.loci.find(l => l.name === p.locus);
    const q = c.sim.peaks.find(q => q.kind === 'allele' && q.locus === p.locus && Math.abs(sizeOf(l, Number(q.label)) - p.size) === l.repeat);
    const evidence = q ? `${l.repeat} ${en ? "bp from parent bin" : "pb depuis le bin du parent"}; ${(100*p.height/q.height).toFixed(1)}%` : '';
    return en ? `PCR stutter (${p.locus}; ${evidence}). Exclude this simulated repeat-offset product. A real allele may share a stutter position: use validated locus-specific criteria, never a universal height cutoff.`
      : `Stutter de PCR (${p.locus} ; ${evidence}). Écarter ce produit simulé décalé d’un motif. Un vrai allèle peut occuper une position de stutter : appliquer les critères validés du locus, jamais un seuil de hauteur universel.`;
  }
  if (p.offladder) return en ? `True generated allele at ${p.locus}, shifted outside its bin. OL is a binning flag, not proof of an artifact. Retain for review; check sizing, ladder and replicates before assigning an allele number. The generator reference (${p.label}) is not a validated OL designation.`
    : `Vrai allèle généré à ${p.locus}, décalé hors de son bin. OL est un indicateur de binning, pas une preuve d’artefact. Conserver pour vérification : taille, ladder et réplicats avant de nommer l’allèle. La référence du générateur (${p.label}) n’est pas une désignation OL validée.`;
  const peers = c.sim.peaks.filter(q => q.kind === 'allele' && q.locus === p.locus);
  const ratio = Math.min(...peers.map(q => q.height))/Math.max(...peers.map(q => q.height));
  return en ? `True allele ${p.label} at ${p.locus}. Retain. Heterozygote balance = ${(ratio*100).toFixed(0)}% in this simulation; imbalance does not make the smaller allele an artifact. Ground truth confirms its origin.`
    : `Vrai allèle ${p.label} à ${p.locus}. Conserver. Balance hétérozygote = ${(ratio*100).toFixed(0)} % dans cette simulation ; le déséquilibre ne transforme pas le petit allèle en artefact. La vérité du générateur confirme son origine.`;
}
