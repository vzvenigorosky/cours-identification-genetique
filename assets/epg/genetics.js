/* ============================================================
   Genetic sampling on the real kit panels: single-source
   profiles, and genealogically-consistent relationship builders
   (parent–child, full sibs, half-sib / avuncular / grandparent,
   unrelated look-alikes).  Autosomal IBD arises naturally from
   constructing individuals from shared parents; Y-STR haplotypes
   are inherited intact along the male line (optional 1-step
   mutation).  Mirrors the offspring/mixture patterns in
   ../exercises/engine.js but on GlobalFiler / Yfiler Plus.
   ============================================================ */
import { sampleAllele } from "./frequencies.js";

/* ---- single individual ---- */
export function randomProfile(kit, rng, opts = {}) {
  const sex = opts.sex || (rng.bool() ? "M" : "F");
  const geno = {};
  for (const l of kit.loci) {
    if (l.type === "amel") { geno[l.name] = sex === "M" ? ["X", "Y"] : ["X", "X"]; continue; }
    if (l.type === "yindel") { geno[l.name] = sex === "M" ? [rng.weightedPick([1, 2], [0.6, 0.4])] : []; continue; }
    if (l.type === "ystr" || kit.kind === "ystr") {
      if (kit.kind !== "ystr" && sex !== "M") { geno[l.name] = []; continue; } // Y marker in autosomal kit, female
      if (l.multi === 2) {
        const a = sampleAllele(l, rng), b = sampleAllele(l, rng);
        geno[l.name] = [a, b].sort((x, y) => x - y);
      } else {
        geno[l.name] = [sampleAllele(l, rng)];
      }
      continue;
    }
    // autosomal
    const a = sampleAllele(l, rng), b = sampleAllele(l, rng);
    geno[l.name] = [a, b].sort((x, y) => x - y);
  }
  return { sex, geno };
}

function pickOne(rng, arr) { return arr.length ? rng.pick(arr) : null; }

function mutateY(alleles, rng, rate) {
  if (!rate) return alleles.slice();
  return alleles.map((a) => (rng.next() < rate ? a + (rng.bool() ? 1 : -1) : a));
}

/* Child of father × mother. Autosomal: one allele from each parent.
   Y markers: sons inherit the father's Y (optional mutation). */
export function offspring(kit, father, mother, rng, opts = {}) {
  const sex = opts.sex || (rng.bool() ? "M" : "F");
  const yMut = opts.yMutation || 0;
  const geno = {};
  for (const l of kit.loci) {
    if (l.type === "amel") { geno[l.name] = sex === "M" ? ["X", "Y"] : ["X", "X"]; continue; }
    if (l.type === "yindel") { geno[l.name] = sex === "M" ? (father.geno[l.name] || []).slice() : []; continue; }
    if (l.type === "ystr" || kit.kind === "ystr") {
      geno[l.name] = sex === "M" ? mutateY(father.geno[l.name] || [], rng, yMut) : [];
      continue;
    }
    const a = pickOne(rng, father.geno[l.name]);
    const b = pickOne(rng, mother.geno[l.name]);
    geno[l.name] = [a, b].sort((x, y) => x - y);
  }
  return { sex, geno };
}

/* ---- relationship builders ----
   Each returns { a, b, relationship, note } where a and b are profiles. */

export function parentChild(kit, rng) {
  if (kit.kind === "ystr") {
    const father = randomProfile(kit, rng, { sex: "M" });
    const son = offspring(kit, father, null, rng, { sex: "M", yMutation: 0.02 });
    return { a: father, b: son, relationship: "parent-child",
             note: "father→son: identical Y haplotype (barring rare mutation)" };
  }
  const father = randomProfile(kit, rng, { sex: "M" });
  const mother = randomProfile(kit, rng, { sex: "F" });
  const child = offspring(kit, father, mother, rng);
  return { a: father, b: child, relationship: "parent-child",
           note: "one obligate shared allele per autosomal locus" };
}

export function fullSibs(kit, rng) {
  if (kit.kind === "ystr") {
    const father = randomProfile(kit, rng, { sex: "M" });
    const s1 = offspring(kit, father, null, rng, { sex: "M" });
    const s2 = offspring(kit, father, null, rng, { sex: "M" });
    return { a: s1, b: s2, relationship: "full-siblings",
             note: "brothers share the paternal Y haplotype" };
  }
  const father = randomProfile(kit, rng, { sex: "M" });
  const mother = randomProfile(kit, rng, { sex: "F" });
  const s1 = offspring(kit, father, mother, rng);
  const s2 = offspring(kit, father, mother, rng);
  return { a: s1, b: s2, relationship: "full-siblings",
           note: "autosomal IBD sharing 0/1/2 at ¼ / ½ / ¼ per locus" };
}

/* Half-sibs, avuncular and grandparent all share the same coefficient of
   relationship (¼) — indistinguishable by these markers. */
export function halfSib(kit, rng) {
  if (kit.kind === "ystr") return sameLineageY(kit, rng, "half-siblings");
  const shared = randomProfile(kit, rng, { sex: "M" });
  const m1 = randomProfile(kit, rng, { sex: "F" });
  const m2 = randomProfile(kit, rng, { sex: "F" });
  return { a: offspring(kit, shared, m1, rng), b: offspring(kit, shared, m2, rng),
           relationship: "half-siblings",
           note: "one shared parent — same degree as avuncular / grandparent" };
}

export function avuncular(kit, rng) {
  if (kit.kind === "ystr") return sameLineageY(kit, rng, "avuncular");
  const g1 = randomProfile(kit, rng, { sex: "M" });
  const g2 = randomProfile(kit, rng, { sex: "F" });
  const uncle = offspring(kit, g1, g2, rng, { sex: "M" });
  const parent = offspring(kit, g1, g2, rng);
  const nephew = offspring(kit, parent.sex === "M" ? parent : randomProfile(kit, rng, { sex: "M" }),
                                parent.sex === "F" ? parent : randomProfile(kit, rng, { sex: "F" }), rng);
  return { a: uncle, b: nephew, relationship: "avuncular",
           note: "uncle/aunt–nephew/niece — same degree as half-sib / grandparent" };
}

export function grandparent(kit, rng) {
  if (kit.kind === "ystr") return sameLineageY(kit, rng, "grandparent");
  const g1 = randomProfile(kit, rng, { sex: "M" });
  const g2 = randomProfile(kit, rng, { sex: "F" });
  const parent = offspring(kit, g1, g2, rng);
  const other = randomProfile(kit, rng, { sex: parent.sex === "M" ? "F" : "M" });
  const father = parent.sex === "M" ? parent : other;
  const mother = parent.sex === "F" ? parent : other;
  const grandchild = offspring(kit, father, mother, rng);
  return { a: g1, b: grandchild, relationship: "grandparent",
           note: "grandparent–grandchild — same degree as half-sib / avuncular" };
}

function sameLineageY(kit, rng, rel) {
  const father = randomProfile(kit, rng, { sex: "M" });
  const a = offspring(kit, father, null, rng, { sex: "M" });
  const b = offspring(kit, father, null, rng, { sex: "M" });
  return { a, b, relationship: rel,
           note: "same paternal line — Y-STR cannot distinguish these degrees" };
}

/* Two unrelated profiles, biased to share several alleles (a hard distractor). */
export function unrelatedLookalike(kit, rng) {
  const a = randomProfile(kit, rng, { sex: "M" });
  const b = randomProfile(kit, rng, { sex: "M" });
  if (kit.kind !== "ystr") {
    for (const l of kit.loci) {
      if (l.type || !a.geno[l.name].length) continue;
      if (rng.bool(0.55)) {
        b.geno[l.name] = [rng.pick(a.geno[l.name]), rng.pick(b.geno[l.name])].sort((x, y) => x - y);
      }
    }
  }
  return { a, b, relationship: "unrelated",
           note: "unrelated individuals that coincidentally share several alleles" };
}
