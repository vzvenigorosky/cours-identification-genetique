/* ============================================================
   Per-locus allele-frequency model (approximate European).
   Rather than hard-code hundreds of published values, each locus
   gets a realistic modal allele + spread; a discrete Gaussian over
   its allele list yields plausible frequencies (common alleles
   favoured, microvariants rare).  Documented as approximate and
   trivially replaceable with the lab's real frequency tables.
   ============================================================ */
import { allelesOf } from "./panels.js";

/* Realistic modal allele + spread per locus (European-ish). */
const MODES = {
  // GlobalFiler autosomal
  D3S1358: { mode: 15, sd: 1.5 }, vWA: { mode: 17, sd: 1.7 },
  D16S539: { mode: 11, sd: 1.5 }, CSF1PO: { mode: 11, sd: 1.3 },
  TPOX: { mode: 8, sd: 1.1 }, D8S1179: { mode: 13, sd: 1.7 },
  D21S11: { mode: 30, sd: 1.9 }, D18S51: { mode: 15, sd: 2.4 },
  D2S441: { mode: 11, sd: 1.5 }, D19S433: { mode: 14, sd: 1.6 },
  TH01: { mode: 8, sd: 1.6 }, FGA: { mode: 22, sd: 2.4 },
  D22S1045: { mode: 15, sd: 1.6 }, D5S818: { mode: 11, sd: 1.5 },
  D13S317: { mode: 11, sd: 1.6 }, D7S820: { mode: 10, sd: 1.4 },
  SE33: { mode: 21, sd: 3.2 }, D10S1248: { mode: 14, sd: 1.6 },
  D1S1656: { mode: 15, sd: 2.0 }, D12S391: { mode: 20, sd: 2.1 },
  D2S1338: { mode: 20, sd: 2.6 },
  // Y markers (GlobalFiler + Yfiler Plus)
  DYS391: { mode: 11, sd: 0.9 }, DYS576: { mode: 18, sd: 1.2 },
  DYS389I: { mode: 13, sd: 0.8 }, DYS635: { mode: 23, sd: 1.2 },
  DYS389II: { mode: 30, sd: 1.2 }, DYS627: { mode: 21, sd: 1.4 },
  DYS460: { mode: 11, sd: 0.9 }, DYS458: { mode: 17, sd: 1.3 },
  DYS19: { mode: 15, sd: 1.0 }, YGATAH4: { mode: 12, sd: 0.8 },
  DYS448: { mode: 19, sd: 1.0 }, DYS456: { mode: 15, sd: 1.1 },
  DYS390: { mode: 24, sd: 1.1 }, DYS438: { mode: 11, sd: 1.0 },
  DYS392: { mode: 13, sd: 1.2 }, DYS518: { mode: 40, sd: 1.4 },
  DYS570: { mode: 18, sd: 1.6 }, DYS437: { mode: 15, sd: 0.9 },
  DYS385: { mode: 14, sd: 2.2 }, DYS449: { mode: 30, sd: 1.6 },
  DYS393: { mode: 13, sd: 1.0 }, DYS439: { mode: 12, sd: 1.0 },
  DYS481: { mode: 24, sd: 1.8 }, DYF387S1: { mode: 37, sd: 1.6 },
  DYS533: { mode: 12, sd: 1.0 }
};

function paramsFor(locus) {
  return MODES[locus.name] || {
    mode: (locus.min + locus.max) / 2,
    sd: Math.max(1, (locus.max - locus.min) / 4)
  };
}

export function alleleFrequencies(locus) {
  if (locus._freq) return locus._freq;
  const alleles = allelesOf(locus);
  const { mode, sd } = paramsFor(locus);
  const w = alleles.map((a) => {
    const isMicro = Math.floor(a) !== a;
    const g = Math.exp(-0.5 * Math.pow((a - mode) / sd, 2));
    return (isMicro ? 0.12 : 1) * g + 1e-4;
  });
  const total = w.reduce((s, x) => s + x, 0);
  const map = new Map();
  alleles.forEach((a, i) => map.set(a, w[i] / total));
  locus._freq = map;
  return map;
}

export function sampleAllele(locus, rng) {
  const map = alleleFrequencies(locus);
  const alleles = [...map.keys()];
  const weights = [...map.values()];
  return rng.weightedPick(alleles, weights);
}

/* Population frequency of a single allele (for RMP-style answer keys). */
export function freqOf(locus, allele) {
  const map = alleleFrequencies(locus);
  return map.get(allele) != null ? map.get(allele) : 0.01;
}
