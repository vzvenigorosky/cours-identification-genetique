/* ============================================================
   Peak simulation — turns contributor genotype(s) into the peaks
   an EPG would show, with full GeneMapper-style realism:
   dosage + heterozygote balance, degradation ski-slope,
   back/forward/half stutter, minus-A split peaks, drop-out,
   drop-in, pull-up (dye bleed-through), baseline noise, spikes,
   dye blobs, off-ladder, and saturation/flat-tops.
   All artifact rates are tunable knobs (opts.art).
   ============================================================ */
import { DYE_ORDER, allelesOf, sizeOf } from "./panels.js";

export const DEFAULT_THRESHOLDS = { at: 150, st: 400, saturation: 30000 };

export const DEFAULT_ART = {
  stutter: true, minusA: true, pullup: true, dropin: true,
  spike: true, blob: true, offladder: true, noise: true
};

/* degradation multiplier: larger fragments amplify less */
function degFactor(size, k) {
  return Math.exp(-k * Math.max(0, size - 90) / 160);
}

/* dose map for a contributor at a locus: allele → copy number */
function doseMap(alleles) {
  const m = new Map();
  for (const a of alleles) m.set(a, (m.get(a) || 0) + 1);
  return m;
}

export function simulate(kit, contributors, opts = {}) {
  const rng = opts.rng;
  const th = { ...DEFAULT_THRESHOLDS, ...(opts.thresholds || {}) };
  const art = { ...DEFAULT_ART, ...(opts.art || {}) };
  const SAT = th.saturation;

  // signal entries: {locus, dye, size, height, label, kind}
  const sig = [];
  const push = (e) => { if (e.height > 3) sig.push(e); };

  for (const l of kit.loci) {
    if (l.type === "amel" || l.type === "yindel") {
      // sex/indel markers: simple strong peaks, minimal artifacts
      for (const c of contributors) {
        const alleles = c.geno[l.name] || [];
        const dm = doseMap(alleles);
        for (const [a, dose] of dm) {
          const size = sizeOf(l, a);
          const h = c.amount * (l.type === "amel" ? 1.0 : 1.6) * dose *
                    degFactor(size, c.degradation) * rng.clampNormal(1, 0.08, 0.75, 1.25);
          push({ locus: l.name, dye: l.dye, size, height: h, label: String(a), kind: "allele" });
        }
      }
      continue;
    }

    const isY = l.type === "ystr" || kit.kind === "ystr";
    for (const c of contributors) {
      const alleles = c.geno[l.name] || [];
      if (!alleles.length) continue;
      const dm = doseMap(alleles);
      const sizes = alleles.map((a) => sizeOf(l, a));
      const maxAlleleSize = Math.max(...sizes);

      for (const [a, dose] of dm) {
        const size = sizeOf(l, a);
        // dosage: homozygote 2×; Y haploid drawn strong
        let base = c.amount * (isY ? 1.7 : 1) * dose;
        // heterozygote balance: the longer allele amplifies a touch less
        if (dose === 1 && dm.size > 1 && size === maxAlleleSize) base *= rng.range(0.82, 1.0);
        const h = base * degFactor(size, c.degradation) * rng.clampNormal(1, 0.10, 0.6, 1.4);
        push({ locus: l.name, dye: l.dye, size, height: h, label: fmtAllele(a), kind: "allele" });

        // stutter
        if (art.stutter) {
          const backRatio = (l.back || 0.06) * rng.range(0.7, 1.3);
          push({ locus: l.name, dye: l.dye, size: size - l.repeat, height: h * backRatio,
                 label: fmtAllele(a - 1), kind: "stutter" });
          push({ locus: l.name, dye: l.dye, size: size + l.repeat, height: h * 0.02 * rng.range(0.4, 1.6),
                 label: fmtAllele(a + 1), kind: "stutter" });
          if (l.half) push({ locus: l.name, dye: l.dye, size: size - 2, height: h * l.half * rng.range(0.6, 1.4),
                             label: "", kind: "stutter" });
        }
        // minus-A (worse at high template)
        if (art.minusA) {
          const r = Math.min(0.18, 0.02 + c.amount / 60000) * rng.range(0.5, 1.5);
          push({ locus: l.name, dye: l.dye, size: size - 1, height: h * r, label: "", kind: "minusA" });
        }
      }
    }
  }

  // ---- merge co-located signals (same dye, ~same size) ----
  const bins = new Map();
  const KIND_RANK = { allele: 6, minusA: 5, stutter: 4, pullup: 3, blob: 2, spike: 2, dropin: 3, noise: 1 };
  for (const e of sig) {
    const key = e.dye + "@" + Math.round(e.size);
    const b = bins.get(key);
    if (!b) { bins.set(key, { ...e, size: Math.round(e.size) }); continue; }
    b.height += e.height;
    if (KIND_RANK[e.kind] > KIND_RANK[b.kind]) { b.kind = e.kind; if (e.label) b.label = e.label; }
    else if (!b.label && e.label) b.label = e.label;
  }
  let peaks = [...bins.values()];

  // ---- pull-up from tall/saturated peaks into other dyes ----
  if (art.pullup) {
    const tall = peaks.filter((p) => p.height > 4000);
    for (const p of tall) {
      const ratio = p.height >= SAT ? rng.range(0.03, 0.07) : rng.range(0.015, 0.04);
      for (const dye of DYE_ORDER) {
        if (dye === p.dye) continue;
        if (rng.bool(0.4)) addPeak(peaks, { locus: "", dye, size: p.size, height: p.height * ratio,
                                            label: "", kind: "pullup" });
      }
    }
  }

  // ---- drop-in (a few sporadic low peaks) ----
  if (art.dropin && rng.bool(0.6)) {
    const n = rng.int(1, 3);
    for (let i = 0; i < n; i++) {
      const l = rng.pick(kit.loci.filter((x) => !x.type || x.type === "ystr"));
      const al = allelesOf(l); const a = rng.pick(al);
      addPeak(peaks, { locus: l.name, dye: l.dye, size: sizeOf(l, a), height: th.at * rng.range(1.0, 2.2),
                       label: fmtAllele(a), kind: "dropin" });
    }
  }

  // ---- spikes (sharp, across all dyes at one size) ----
  if (art.spike && rng.bool(0.3)) {
    const size = rng.int(110, 400);
    for (const dye of DYE_ORDER)
      addPeak(peaks, { locus: "", dye, size, height: rng.range(300, 1500), label: "", kind: "spike" });
  }

  // ---- dye blobs (broad low peaks at characteristic small sizes) ----
  if (art.blob && rng.bool(0.5)) {
    const dye = rng.pick(DYE_ORDER);
    addPeak(peaks, { locus: "", dye, size: rng.int(100, 140), height: rng.range(150, 500), label: "", kind: "blob" });
  }

  // ---- off-ladder: nudge a random called allele off its bin ----
  if (art.offladder && rng.bool(0.25)) {
    const sexMarkers = new Set(["AMEL", "Yindel"]);
    const callable = peaks.filter((p) => p.kind === "allele" && p.height > th.at && !sexMarkers.has(p.locus));
    if (callable.length) {
      const p = rng.pick(callable);
      p.size += rng.bool() ? 1 : -1;
      p.offladder = true;
    }
  }

  // ---- saturation clipping ----
  for (const p of peaks) {
    if (p.height >= SAT) { p.height = SAT; p.saturated = true; }
    p.height = Math.round(p.height);
    p.called = p.kind === "allele" && p.height >= th.at;
  }

  peaks = peaks.filter((p) => p.height > 8);
  peaks.sort((a, b) => DYE_ORDER.indexOf(a.dye) - DYE_ORDER.indexOf(b.dye) || a.size - b.size);

  const maxHeight = peaks.reduce((m, p) => Math.max(m, p.height), th.st);
  return { peaks, thresholds: th, maxHeight, noise: art.noise };
}

function addPeak(peaks, e) {
  const key = e.dye + "@" + Math.round(e.size);
  const found = peaks.find((p) => p.dye === e.dye && Math.round(p.size) === Math.round(e.size));
  if (found) { found.height += e.height; return; }
  peaks.push({ ...e, size: Math.round(e.size) });
}

function fmtAllele(a) {
  return Number.isInteger(a) ? String(a) : a.toFixed(1);
}
