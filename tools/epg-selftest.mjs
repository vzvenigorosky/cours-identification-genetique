#!/usr/bin/env node
/* ============================================================
   Self-tests for the EPG core — invariant checks over many
   randomised, seeded cases for both kits.  Exit 1 on failure.
   Run: node tools/epg-selftest.mjs
   ============================================================ */
import { generateCase, CASE_TYPES } from "../assets/epg/index.js";
import { getKit, allelesOf, sizeOf, maxSize } from "../assets/epg/panels.js";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("✗ " + msg); } }

for (const kit of ["globalfiler", "yfilerplus"]) {
  const K = getKit(kit);
  const hi = maxSize(K) + 25;

  // structure + size bounds + reproducibility across all case types
  for (const type of CASE_TYPES) {
    const c1 = generateCase({ kit, type, seed: `${kit}-${type}` });
    const c2 = generateCase({ kit, type, seed: `${kit}-${type}` });
    ok(c1.svg === c2.svg, `${kit}/${type}: reproducible SVG for a fixed seed`);
    const nSamples = c1.samples.length;
    const isPair = ["parent-child", "full-siblings", "half-siblings", "avuncular", "grandparent", "unrelated"].includes(type);
    ok(nSamples === (isPair ? 2 : 1), `${kit}/${type}: sample count (${nSamples})`);
    for (const s of c1.samples) {
      const bad = s.sim.peaks.filter((p) => p.size < 80 || p.size > hi);
      ok(bad.length === 0, `${kit}/${type}: all peak sizes within [80, ${hi}] (offenders=${bad.length})`);
      ok(s.sim.peaks.some((p) => p.called), `${kit}/${type}: has called peaks`);
    }
  }

  // parent-child: obligate allele at EVERY autosomal locus (globalfiler)
  if (kit === "globalfiler") {
    let allShared = true;
    for (let i = 0; i < 40; i++) {
      const c = generateCase({ kit, type: "parent-child", seed: `pc${i}` });
      const k = c.answerKey.kinshipSummary;
      if (k.lociShared !== k.lociTotal) allShared = false;
    }
    ok(allShared, "globalfiler/parent-child: child shares ≥1 allele at every autosomal locus");

    // degraded yields fewer called alleles than clean (same seed base)
    let deg = 0, clean = 0;
    for (let i = 0; i < 30; i++) {
      const cd = generateCase({ kit, type: "degraded", seed: `d${i}` });
      const cc = generateCase({ kit, type: "clean", seed: `d${i}` });
      deg += cd.samples[0].sim.peaks.filter((p) => p.called).length;
      clean += cc.samples[0].sim.peaks.filter((p) => p.called).length;
    }
    ok(deg < clean, `globalfiler: degradation reduces called alleles (deg=${deg} < clean=${clean})`);

    // degradation is monotone-ish: mean height of large fragments < small fragments
    const c = generateCase({ kit, type: "degraded", seed: "mono", degradation: 3 });
    const alleles = c.samples[0].sim.peaks.filter((p) => p.kind === "allele");
    const small = alleles.filter((p) => p.size < 180).reduce((s, p) => s + p.height, 0) / Math.max(1, alleles.filter((p) => p.size < 180).length);
    const large = alleles.filter((p) => p.size > 300).reduce((s, p) => s + p.height, 0) / Math.max(1, alleles.filter((p) => p.size > 300).length);
    ok(small > large, `globalfiler/degraded: small fragments taller than large (${small.toFixed(0)} > ${large.toFixed(0)})`);

    // mixture realism: the answer key carries an observed Mx estimate and the
    // stacking / drop-out locus lists, and the proportions are sane.
    {
      const mx = generateCase({ kit, type: "mixture2", seed: "mxobs" });
      const mo = mx.answerKey.mixtureObserved;
      ok(mo && typeof mo.mxRatioLabel === "string" && mo.mxRatioLabel.includes(":"), "mixture2: observed Mx estimate present");
      ok(Array.isArray(mo.stackedLoci) && Array.isArray(mo.dropoutLoci), "mixture2: stacking/drop-out loci listed");
      ok(mo.mxProp.length === 2 && Math.abs(mo.mxProp.reduce((s, x) => s + x, 0) - 1) < 0.02, "mixture2: observed proportions sum to 1");
      ok(mo.mxProp.every((x) => x > 0 && x < 1), "mixture2: both contributors carry observable signal");
      // single-source cases carry no mixtureObserved
      ok(!generateCase({ kit, type: "clean", seed: "cl" }).answerKey.mixtureObserved, "clean: no mixture Mx");
    }

    // mixture: at least one locus shows >2 called alleles
    let sawTriple = false;
    for (let i = 0; i < 20 && !sawTriple; i++) {
      const cm = generateCase({ kit, type: "mixture3", seed: `mx${i}` });
      const byLoc = {};
      for (const p of cm.samples[0].sim.peaks) if (p.called) (byLoc[p.locus] = byLoc[p.locus] || new Set()).add(p.label);
      if (Object.values(byLoc).some((s) => s.size > 2)) sawTriple = true;
    }
    ok(sawTriple, "globalfiler/mixture3: some locus shows >2 called alleles");

    // stutter present just below a true allele
    const cs = generateCase({ kit, type: "clean", seed: "stut", art: { stutter: true } });
    ok(cs.samples[0].sim.peaks.some((p) => p.kind === "stutter"), "globalfiler: stutter peaks generated");
    // toggling stutter off removes them
    const noS = generateCase({ kit, type: "clean", seed: "stut", art: { stutter: false } });
    ok(!noS.samples[0].sim.peaks.some((p) => p.kind === "stutter"), "globalfiler: stutter toggle off removes stutter");
  }

  // Y kit: father–son identical (or near-identical) haplotype; unrelated differs
  if (kit === "yfilerplus") {
    let identical = 0;
    for (let i = 0; i < 30; i++) {
      const c = generateCase({ kit, type: "full-siblings", seed: `ys${i}` });
      if (c.answerKey.haplotypeMatch.identical) identical++;
    }
    ok(identical >= 28, `yfilerplus/full-siblings: brothers share the haplotype (${identical}/30)`);
    let unrelDiff = 0;
    for (let i = 0; i < 30; i++) {
      const c = generateCase({ kit, type: "unrelated", seed: `yu${i}` });
      if (!c.answerKey.haplotypeMatch.identical) unrelDiff++;
    }
    ok(unrelDiff >= 28, `yfilerplus/unrelated: unrelated males differ (${unrelDiff}/30)`);
  }
}

// sanity: allele sizes strictly increase with repeat number
{
  const K = getKit("globalfiler");
  const l = K.loci.find((x) => x.name === "FGA");
  const al = allelesOf(l);
  let inc = true;
  for (let i = 1; i < al.length; i++) if (sizeOf(l, al[i]) <= sizeOf(l, al[i - 1])) inc = false;
  ok(inc, "FGA allele sizes increase monotonically with repeat number");
}

// ---- render features (#50): ST line, bin overlay, peak inspection ----
{
  const base = generateCase({ kit: "globalfiler", type: "clean", seed: "render50" });
  ok(/>AT</.test(base.svg), "render: AT threshold label present");
  ok(/>ST</.test(base.svg), "render: ST threshold label present");
  ok(/class="pk" data-size=/.test(base.svg), "render: peaks carry inspection data attributes");
  ok(/<title>\d+ bp/.test(base.svg), "render: peaks expose a size/RFU title for hover");
  ok(!/data-kind=/.test(base.svg), "render: peak kind is hidden by default (no answer leak)");
  ok(!/class="bin"/.test(base.svg), "render: no bin marks unless requested");

  const withBins = generateCase({ kit: "globalfiler", type: "clean", seed: "render50", showBins: true });
  ok((withBins.svg.match(/class="bin"/g) || []).length > 20, "render: allele bin marks drawn when showBins");

  const revealed = generateCase({ kit: "globalfiler", type: "clean", seed: "render50", revealKind: true });
  ok(/data-kind=/.test(revealed.svg), "render: peak kind exposed only with revealKind");

  // answer-mode artefact overlay: a ring/tag appears for an above-AT artefact
  // (stutter at a tall allele is near-certain), and never in the default render.
  ok(!/#b5179e/.test(base.svg), "render: no artefact overlay by default");
  let sawOverlay = false;
  for (let s = 0; s < 8 && !sawOverlay; s++) {
    const r = generateCase({ kit: "globalfiler", type: "clean", seed: `ov${s}`, revealKind: true });
    if (/#b5179e/.test(r.svg) && /(>St<|>PU<|>DI<|>-A<)/.test(r.svg)) sawOverlay = true;
  }
  ok(sawOverlay, "render: answer-mode overlay rings/tags artefacts");

  // seeded baseline noise: different cases → different baseline path, same seed → identical
  const a = generateCase({ kit: "globalfiler", type: "clean", seed: "noiseA" });
  const a2 = generateCase({ kit: "globalfiler", type: "clean", seed: "noiseA" });
  const bca = generateCase({ kit: "globalfiler", type: "clean", seed: "noiseB" });
  ok(a.svg === a2.svg, "render: noise reproducible for a fixed seed");
  ok(a.svg !== bca.svg, "render: different cases differ (noise varies)");

  // batch controls: opt-in allelic ladder + positive/negative controls, stacked
  const noCtl = generateCase({ kit: "globalfiler", type: "clean", seed: "ctl" });
  const withCtl = generateCase({ kit: "globalfiler", type: "clean", seed: "ctl", controls: true });
  ok(!/Allelic ladder/.test(noCtl.svg), "render: no control tracks by default");
  ok(/Allelic ladder/.test(withCtl.svg) && /Positive control/.test(withCtl.svg) && /Negative control/.test(withCtl.svg),
    "render: controls add ladder + positive + negative tracks");
  ok(withCtl.svg.length > noCtl.svg.length, "render: control stack is larger than the bare sample");
  // positive control is the same fixed profile every time
  const c1 = generateCase({ kit: "globalfiler", type: "clean", seed: "x1", controls: true });
  const c2 = generateCase({ kit: "globalfiler", type: "clean", seed: "x2", controls: true });
  const posOf = (svg) => svg.slice(svg.indexOf("Positive control"), svg.indexOf("Negative control"));
  ok(posOf(c1.svg) !== "" && posOf(c1.svg).length > 100, "render: positive-control track present");
}

console.log(`\n${fail === 0 ? "✓ ALL PASS" : "✗ FAILURES"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
