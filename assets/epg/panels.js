/* ============================================================
   Kit panels: GlobalFiler (autosomal + sex markers) and
   Yfiler Plus (Y-STR).  For each locus: dye channel, repeat
   length, common allele range (+ microvariants), and stutter
   ratios.  Fragment sizes (bp) are packed per dye into
   non-overlapping, left-to-right windows to mimic the real
   GeneMapper layout.

   NOTE: allele ranges and sizes are realistic but APPROXIMATE
   (teaching values), documented as such and easy to replace
   with the lab's exact bin set later.
   ============================================================ */

export const DYES = {
  FAM: { key: "FAM", label: "6-FAM", color: "#1565c0" }, // blue
  VIC: { key: "VIC", label: "VIC",   color: "#2e7d32" }, // green
  NED: { key: "NED", label: "NED",   color: "#9a8100" }, // yellow → dark goldenrod (readable)
  TAZ: { key: "TAZ", label: "TAZ",   color: "#c62828" }, // red
  SID: { key: "SID", label: "SID",   color: "#6a1b9a" }, // purple
  LIZ: { key: "LIZ", label: "LIZ",   color: "#e65100" }  // orange (size standard)
};
export const DYE_ORDER = ["FAM", "VIC", "NED", "TAZ", "SID"];

/* ---- GlobalFiler: 21 autosomal STR + AMEL + DYS391 + Y-indel ---- */
const GF_LOCI = [
  // Blue (6-FAM)
  { name: "D3S1358", dye: "FAM", repeat: 4, min: 12, max: 19, back: 0.09 },
  { name: "vWA",     dye: "FAM", repeat: 4, min: 14, max: 21, back: 0.10 },
  { name: "D16S539", dye: "FAM", repeat: 4, min: 8,  max: 15, back: 0.08 },
  { name: "CSF1PO",  dye: "FAM", repeat: 4, min: 7,  max: 15, back: 0.07 },
  { name: "TPOX",    dye: "FAM", repeat: 4, min: 6,  max: 13, back: 0.05 },
  // Green (VIC)
  { name: "D8S1179", dye: "VIC", repeat: 4, min: 8,  max: 16, back: 0.08 },
  { name: "D21S11",  dye: "VIC", repeat: 4, min: 27, max: 35, micros: [28.2, 29.2, 30.2, 31.2, 32.2, 33.2], back: 0.11 },
  { name: "D18S51",  dye: "VIC", repeat: 4, min: 10, max: 22, micros: [13.2, 14.2], back: 0.10 },
  { name: "D2S441",  dye: "VIC", repeat: 4, min: 9,  max: 15, micros: [10.3, 11.3], back: 0.06 },
  { name: "D19S433", dye: "VIC", repeat: 4, min: 11, max: 17, micros: [13.2, 14.2, 15.2], back: 0.08 },
  // Yellow (NED)
  { name: "TH01",    dye: "NED", repeat: 4, min: 5,  max: 10, micros: [9.3], back: 0.03 },
  { name: "FGA",     dye: "NED", repeat: 4, min: 18, max: 30, micros: [21.2, 22.2, 23.2], back: 0.11 },
  { name: "D22S1045",dye: "NED", repeat: 3, min: 11, max: 18, back: 0.09, half: 0.09 },
  { name: "D5S818",  dye: "NED", repeat: 4, min: 7,  max: 15, back: 0.06 },
  { name: "D13S317", dye: "NED", repeat: 4, min: 8,  max: 14, back: 0.06 },
  { name: "D7S820",  dye: "NED", repeat: 4, min: 7,  max: 13, back: 0.06 },
  { name: "SE33",    dye: "NED", repeat: 4, min: 15, max: 30, micros: [16.2, 19.2, 20.2, 25.2, 26.2, 27.2], back: 0.13, half: 0.06 },
  // Red (TAZ)
  { name: "D10S1248",dye: "TAZ", repeat: 4, min: 12, max: 18, back: 0.09 },
  { name: "D1S1656", dye: "TAZ", repeat: 4, min: 11, max: 18, micros: [15.3, 16.3, 17.3], back: 0.10 },
  { name: "D12S391", dye: "TAZ", repeat: 4, min: 17, max: 24, micros: [18.3, 19.3, 20.3], back: 0.12 },
  { name: "D2S1338", dye: "TAZ", repeat: 4, min: 16, max: 26, back: 0.11 },
  // Purple (SID) — sex/lineage markers
  { name: "AMEL",    dye: "SID", type: "amel" },
  { name: "DYS391",  dye: "SID", repeat: 4, min: 9,  max: 13, type: "ystr", back: 0.06 },
  { name: "Yindel",  dye: "SID", type: "yindel" }
];

/* ---- Yfiler Plus: Y-STR haplotype (multi-copy loci flagged) ---- */
const YF_LOCI = [
  { name: "DYS576",  dye: "FAM", repeat: 4, min: 15, max: 20, back: 0.10 },
  { name: "DYS389I", dye: "FAM", repeat: 4, min: 12, max: 15, back: 0.06 },
  { name: "DYS635",  dye: "FAM", repeat: 4, min: 20, max: 26, back: 0.09 },
  { name: "DYS389II",dye: "FAM", repeat: 4, min: 28, max: 34, back: 0.10 },
  { name: "DYS627",  dye: "FAM", repeat: 4, min: 18, max: 25, back: 0.10 },
  { name: "DYS460",  dye: "VIC", repeat: 4, min: 8,  max: 13, back: 0.06 },
  { name: "DYS458",  dye: "VIC", repeat: 4, min: 14, max: 20, back: 0.09 },
  { name: "DYS19",   dye: "VIC", repeat: 4, min: 12, max: 18, back: 0.08 },
  { name: "YGATAH4", dye: "VIC", repeat: 4, min: 10, max: 14, back: 0.06 },
  { name: "DYS448",  dye: "VIC", repeat: 6, min: 17, max: 22, back: 0.05 },
  { name: "DYS391",  dye: "NED", repeat: 4, min: 9,  max: 13, back: 0.06 },
  { name: "DYS456",  dye: "NED", repeat: 4, min: 13, max: 18, back: 0.08 },
  { name: "DYS390",  dye: "NED", repeat: 4, min: 21, max: 26, back: 0.09 },
  { name: "DYS438",  dye: "NED", repeat: 5, min: 9,  max: 13, back: 0.04 },
  { name: "DYS392",  dye: "NED", repeat: 3, min: 10, max: 16, back: 0.06 },
  { name: "DYS518",  dye: "TAZ", repeat: 4, min: 36, max: 44, back: 0.11 },
  { name: "DYS570",  dye: "TAZ", repeat: 4, min: 15, max: 23, back: 0.11 },
  { name: "DYS437",  dye: "TAZ", repeat: 4, min: 13, max: 17, back: 0.07 },
  { name: "DYS385",  dye: "TAZ", repeat: 4, min: 9,  max: 21, back: 0.09, multi: 2 }, // DYS385a/b
  { name: "DYS449",  dye: "SID", repeat: 4, min: 27, max: 35, back: 0.12 },
  { name: "DYS393",  dye: "SID", repeat: 4, min: 11, max: 16, back: 0.06 },
  { name: "DYS439",  dye: "SID", repeat: 4, min: 10, max: 14, back: 0.07 },
  { name: "DYS481",  dye: "SID", repeat: 3, min: 20, max: 30, back: 0.09 },
  { name: "DYF387S1",dye: "SID", repeat: 4, min: 33, max: 42, back: 0.10, multi: 2 }, // DYF387S1a/b
  { name: "DYS533",  dye: "SID", repeat: 4, min: 9,  max: 14, back: 0.06 }
];

/* Fractional bases encoded in a microvariant designation (e.g. 9.3 → 3 bp). */
export function fractionalBases(allele) {
  const frac = Math.round((allele - Math.floor(allele)) * 10);
  return frac; // .1→1, .2→2, .3→3
}

/* Expand the full ordered allele list for a locus (integers + microvariants). */
export function allelesOf(locus) {
  if (locus.type === "amel") return ["X", "Y"];
  if (locus.type === "yindel") return [1, 2];
  const out = [];
  for (let a = locus.min; a <= locus.max; a++) out.push(a);
  if (locus.micros) for (const m of locus.micros) out.push(m);
  out.sort((x, y) => x - y);
  return out;
}

/* Fragment size (bp) of an allele at a locus. */
export function sizeOf(locus, allele) {
  if (locus.type === "amel") return allele === "Y" ? locus._sizeY : locus._sizeX;
  if (locus.type === "yindel") return locus._base + (allele === 2 ? 6 : 0);
  return locus._base + (Math.floor(allele) - locus.min) * locus.repeat + fractionalBases(allele);
}

/* Pack loci of each dye into increasing, non-overlapping size windows. */
function packSizes(loci) {
  const START = 95, GAP = 16;
  const cursor = {};
  for (const l of loci) {
    const dye = l.dye;
    if (cursor[dye] == null) cursor[dye] = START;
    if (l.type === "amel") {
      l._sizeX = cursor[dye]; l._sizeY = cursor[dye] + 6;
      cursor[dye] = l._sizeY + GAP + 8;
      continue;
    }
    if (l.type === "yindel") {
      l._base = cursor[dye];
      cursor[dye] = l._base + 6 + GAP + 8;
      continue;
    }
    l._base = cursor[dye];
    const span = (l.max - l.min) * l.repeat + 3; // +3 covers .x microvariants
    cursor[dye] = l._base + span + GAP;
  }
  return loci;
}

export const KITS = {
  globalfiler: {
    id: "globalfiler",
    label: "GlobalFiler",
    kind: "autosomal",
    loci: packSizes(GF_LOCI.map((l) => ({ ...l })))
  },
  yfilerplus: {
    id: "yfilerplus",
    label: "Yfiler Plus",
    kind: "ystr",
    loci: packSizes(YF_LOCI.map((l) => ({ ...l })))
  }
};

export function getKit(id) {
  return KITS[id] || KITS.globalfiler;
}

/* Max fragment size across a kit — for x-axis scaling. */
export function maxSize(kit) {
  let m = 0;
  for (const l of kit.loci) {
    for (const a of allelesOf(l)) m = Math.max(m, sizeOf(l, a));
  }
  return m;
}
