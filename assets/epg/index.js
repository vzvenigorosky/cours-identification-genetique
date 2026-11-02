/* ============================================================
   generateCase(spec) — top-level EPG case generator.
   Ties panels + genetics + simulate + render into one call and
   returns the SVG(s), the contributor genotypes and an answer key.
   Shared by the in-browser lab (epg.html) and the batch CLI.
   ============================================================ */
import { getKit, sizeOf, allelesOf } from "./panels.js";
import { makeRng, seedFrom } from "./rng.js";
import * as G from "./genetics.js";
import { simulate } from "./simulate.js";
import { renderEPG, renderStack } from "./render-svg.js";

export const CASE_TYPES = [
  "clean", "degraded", "mixture2", "mixture3",
  "parent-child", "full-siblings", "half-siblings", "avuncular", "grandparent", "unrelated"
];

const SINGLE = new Set(["clean", "degraded"]);
const MIXTURE = new Set(["mixture2", "mixture3"]);
const PAIR = new Set(["parent-child", "full-siblings", "half-siblings", "avuncular", "grandparent", "unrelated"]);

export function generateCase(spec = {}) {
  const kit = getKit(spec.kit || "globalfiler");
  const type = spec.type || "clean";
  const seed = spec.seed != null ? spec.seed : Math.floor(Math.random() * 1e9);
  const rng = makeRng(seed);
  const width = spec.width || 1000;
  const art = spec.art || {};
  const thresholds = spec.thresholds;

  const template = spec.template || (type === "degraded" ? 1600 : 3600);
  const degradation = spec.degradation != null ? spec.degradation
    : (type === "degraded" ? rng.range(2.0, 3.4) : 0);

  return build(spec, kit, type, seed, rng, { template, degradation, art, thresholds, width });
}

/* ---- case assembly ---- */
function build(spec, kit, type, seed, rng, cfg) {
  const { template, degradation, art, thresholds, width } = cfg;
  const answerKey = { kit: kit.id, type, seed };
  let samples = [];

  if (SINGLE.has(type)) {
    const p = G.randomProfile(kit, rng);
    samples = [{ label: "Trace", contributors: [{ geno: p.geno, amount: template, degradation }] }];
    answerKey.contributors = [genoTable(kit, p.geno)];
    answerKey.degradation = +degradation.toFixed(2);

  } else if (MIXTURE.has(type)) {
    const n = type === "mixture3" ? 3 : 2;
    const ratio = normalizeRatio(spec.ratio, n, rng);
    const profiles = [];
    const contribs = [];
    for (let i = 0; i < n; i++) {
      const p = G.randomProfile(kit, rng);
      profiles.push(p);
      contribs.push({ geno: p.geno, amount: template * ratio[i], degradation: spec.degradation || 0 });
    }
    samples = [{ label: "Mixture", contributors: contribs }];
    answerKey.contributors = profiles.map((p) => genoTable(kit, p.geno));
    answerKey.ratio = ratio.map((r) => +r.toFixed(2));
    answerKey.mixtureRatioLabel = ratioLabel(ratio);

  } else { // PAIR
    const rel = buildRelationship(kit, type, rng);
    const amtA = template, amtB = template;
    samples = [
      { label: "Sample A", contributors: [{ geno: rel.a.geno, amount: amtA, degradation: 0 }] },
      { label: "Sample B", contributors: [{ geno: rel.b.geno, amount: amtB, degradation: 0 }] }
    ];
    answerKey.relationship = rel.relationship;
    answerKey.note = rel.note;
    answerKey.contributors = [genoTable(kit, rel.a.geno), genoTable(kit, rel.b.geno)];
    if (kit.kind !== "ystr") answerKey.kinshipSummary = autosomalSharing(kit, rel.a.geno, rel.b.geno);
    else answerKey.haplotypeMatch = yHaplotypeMatch(kit, rel.a.geno, rel.b.geno);
  }

  // simulate + render each sample
  const renders = [];
  for (const s of samples) {
    s.sim = simulate(kit, s.contributors, { rng, art, thresholds });
    s.render = renderEPG(kit, s.sim, { sampleLabel: s.label, title: kit.label, width, showBins: spec.showBins, revealKind: spec.revealKind });
    s.observed = observedProfile(kit, s.sim);
    renders.push(s.render);
  }
  // Optional batch controls (#50): an allelic ladder (every bin), a fixed
  // positive control and a blank negative control, stacked around the sample
  // as a real GeneMapper run shows them.
  let allRenders = renders;
  if (spec.controls) {
    const th = samples[0].sim.thresholds;
    const ladderR = renderEPG(kit, ladderSim(kit, th), { sampleLabel: "Allelic ladder", title: kit.label, width });
    const posR = renderEPG(kit, positiveControlSim(kit, th, art), { sampleLabel: "Positive control", title: kit.label, width });
    const negR = renderEPG(kit, negativeControlSim(th), { sampleLabel: "Negative control", title: kit.label, width });
    allRenders = [ladderR, posR, ...renders, negR];
  }
  const svg = allRenders.length === 1 ? allRenders[0].svg : renderStack(allRenders, width);

  // Mixture realism: read the simulated trace back as an analyst would —
  // estimate the mixture proportion (Mx) from peak heights, and flag the loci
  // where a shared allele stacks into one taller peak or the minor contributor
  // has dropped out. Teaching estimate (see docs), not a validated DI model.
  if (MIXTURE.has(type)) {
    answerKey.mixtureObserved = mixtureObserved(kit, samples[0].contributors.map((c) => c.geno), samples[0].sim);
  }

  return { kit: kit.id, kitLabel: kit.label, type, seed: seedFrom(seed), samples, svg, answerKey };
}

/* Estimate the observed mixture proportions and stacking/drop-out, using the
   known contributor genotypes to attribute each allele peak's height (a shared
   allele's height is split equally among its owners). */
function mixtureObserved(kit, genos, sim) {
  const at = sim.thresholds.at;
  const totals = genos.map(() => 0);
  const stacked = [], dropout = [];
  for (const l of kit.loci) {
    if (l.type) continue; // autosomal only
    const bySize = new Map();
    for (const p of sim.peaks) if (p.locus === l.name && p.kind === "allele") bySize.set(Math.round(p.size), p);
    const owners = new Map();
    genos.forEach((g, ci) => {
      for (const a of (g[l.name] || [])) {
        const sz = Math.round(sizeOf(l, a));
        if (!owners.has(sz)) owners.set(sz, []);
        owners.get(sz).push(ci);
      }
    });
    let anyStack = false, anyDrop = false;
    for (const [sz, who] of owners) {
      const pk = bySize.get(sz);
      const h = pk ? pk.height : 0;
      const share = h / who.length;
      who.forEach((ci) => { totals[ci] += share; });
      if (who.length > 1 && h >= at) anyStack = true;   // shared allele → stacked peak
      if (h < at) anyDrop = true;                        // this allele dropped below AT
    }
    if (anyStack) stacked.push(l.name);
    if (anyDrop) dropout.push(l.name);
  }
  const sum = totals.reduce((s, x) => s + x, 0) || 1;
  const prop = totals.map((x) => x / sum);
  const nonzero = prop.filter((x) => x > 0.0001);
  const min = nonzero.length ? Math.min(...nonzero) : 1;
  const ratioLabel = prop.map((x) => (x > 0.0001 ? Math.round(x / min) : 0)).join(":");
  return { mxProp: prop.map((x) => +x.toFixed(2)), mxRatioLabel: ratioLabel, stackedLoci: stacked, dropoutLoci: dropout };
}

function buildRelationship(kit, type, rng) {
  switch (type) {
    case "parent-child": return G.parentChild(kit, rng);
    case "full-siblings": return G.fullSibs(kit, rng);
    case "half-siblings": return G.halfSib(kit, rng);
    case "avuncular": return G.avuncular(kit, rng);
    case "grandparent": return G.grandparent(kit, rng);
    default: return G.unrelatedLookalike(kit, rng);
  }
}

/* ---- helpers ---- */
function normalizeRatio(ratio, n, rng) {
  let r = ratio;
  if (!Array.isArray(r) || r.length !== n) {
    r = n === 3 ? [rng.pick([6, 4, 3]), rng.pick([2, 3]), 1] : [rng.pick([1, 2, 3, 4]), 1];
  }
  const sum = r.reduce((s, x) => s + x, 0);
  return r.map((x) => x / sum);
}
function ratioLabel(norm) {
  const min = Math.min(...norm);
  return norm.map((x) => Math.round(x / min)).join(":");
}
function genoTable(kit, geno) {
  const out = {};
  for (const l of kit.loci) {
    const a = geno[l.name];
    if (a && a.length) out[l.name] = a.join(", ");
  }
  return out;
}
function observedProfile(kit, sim) {
  const out = {};
  for (const l of kit.loci) {
    const called = sim.peaks.filter((p) => p.locus === l.name && p.called).map((p) => p.label);
    if (called.length) out[l.name] = [...new Set(called)].sort();
  }
  return out;
}
function autosomalSharing(kit, ga, gb) {
  let shared = 0, both2 = 0, total = 0;
  const obligate = {};
  for (const l of kit.loci) {
    if (l.type) continue;
    const a = ga[l.name], b = gb[l.name];
    if (!a || !b) continue;
    total++;
    const common = a.filter((x) => b.includes(x));
    if (common.length >= 1) shared++;
    if (common.length >= 2) both2++;
    if (common.length) obligate[l.name] = [...new Set(common)].join(", ");
  }
  return { lociShared: shared, lociTotal: total, lociSharingBoth: both2, sharedAlleles: obligate };
}
function yHaplotypeMatch(kit, ga, gb) {
  let match = 0, total = 0;
  for (const l of kit.loci) {
    total++;
    if (JSON.stringify(ga[l.name]) === JSON.stringify(gb[l.name])) match++;
  }
  return { lociMatching: match, lociTotal: total, identical: match === total };
}

/* ---- batch-control tracks (#50) ---- */
function fmtA(a) { return (typeof a === "number" && !Number.isInteger(a)) ? a.toFixed(1) : String(a); }

/* Allelic ladder: every allele bin of every locus, at a uniform height — the
   reference run that defines where the bins sit. */
function ladderSim(kit, th) {
  const peaks = [];
  const h = Math.round(th.st * 2.2);
  for (const l of kit.loci) {
    for (const a of allelesOf(l)) {
      peaks.push({ locus: l.name, dye: l.dye, size: Math.round(sizeOf(l, a)), height: h, label: fmtA(a), kind: "allele", called: true });
    }
  }
  return { peaks, thresholds: th, maxHeight: Math.round(h * 1.1), noise: false };
}

/* Positive control: a FIXED known male profile (same every run), clean. */
function positiveControlSim(kit, th, art) {
  const rng = makeRng("positive-control-" + kit.id);
  const prof = G.randomProfile(kit, rng, { sex: "M" });
  const cleanArt = { ...art, dropin: false, spike: false, blob: false, offladder: false };
  return simulate(kit, [{ geno: prof.geno, amount: 3000, degradation: 0 }], { rng, art: cleanArt, thresholds: th });
}

/* Negative control: a blank — baseline only, confirming no contamination. */
function negativeControlSim(th) {
  return { peaks: [], thresholds: th, maxHeight: th.st, noise: true };
}

export { observedProfile };
