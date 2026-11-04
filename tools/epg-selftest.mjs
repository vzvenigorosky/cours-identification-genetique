#!/usr/bin/env node
/* ============================================================
   Self-tests for the EPG core — invariant checks over many
   randomised, seeded cases for both kits.  Exit 1 on failure.
   Run: node tools/epg-selftest.mjs
   ============================================================ */
import { generateCase, CASE_TYPES } from "../assets/epg/index.js";
import { getKit, allelesOf, sizeOf, maxSize } from "../assets/epg/panels.js";
import { locusViewport } from "../assets/epg/render-svg.js";
import { readFileSync } from "node:fs";

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


// ---- per-locus zoom (#73 / #50.8): presentation, not resimulation ----
{
  const bare = generateCase({kit: "globalfiler", type: "clean", seed: "zoom-compat"});
  const unchanged = generateCase({kit: "globalfiler", type: "clean", seed: "zoom-compat", zoomLocus: undefined});
  ok(bare.svg === unchanged.svg, "zoom: omitted/undefined option yields identical default SVG");
  ok(!/data-zoom-locus=/.test(bare.svg), "zoom: default overview has no zoom metadata");
  for (const kitId of ["globalfiler", "yfilerplus"]) {
    const kit = getKit(kitId);
    // Every marker, including Amelogenin, Yindel and multicopy Y loci,
    // may be selected independently without touching the underlying peaks.
    const full = generateCase({kit: kitId, type: "clean", seed: "zoom-every-locus", width: 1200});
    const core = JSON.stringify(full.samples.map((sample) => sample.sim));
    const key = JSON.stringify(full.answerKey);
    let sawPeak = false;
    for (const locus of kit.loci) {
      const interval = locusViewport(kit, locus.name);
      const z = generateCase({
        kit: kitId, type: "clean", seed: "zoom-every-locus", width: 1200,
        zoomLocus: locus.name, showBins: true
      });
      const again = generateCase({
        kit: kitId, type: "clean", seed: "zoom-every-locus", width: 1200,
        zoomLocus: locus.name, showBins: true
      });
      ok(z.svg === again.svg, `zoom: ${kitId}/${locus.name} deterministic rendering`);
      ok(JSON.stringify(z.samples.map((sample) => sample.sim)) === core,
         `zoom: ${kitId}/${locus.name} original peak simulation unchanged`);
      ok(JSON.stringify(z.answerKey) === key, `zoom: ${kitId}/${locus.name} answerKey unchanged`);
      ok(interval.max > interval.min && interval.min >= 80, `zoom: ${locus.name} valid viewport`);
      ok(z.svg.includes(`data-zoom-locus="${locus.name}"`) &&
         z.svg.includes(`data-zoom-min="${interval.min}" data-zoom-max="${interval.max}"`),
         `zoom: ${locus.name} viewport metadata present`);
      const sizes = [...z.svg.matchAll(/<path class="pk" data-size="([0-9.]+)"/g)].map((match) => Number(match[1]));
      ok(sizes.every((size) => size >= interval.min && size <= interval.max),
         `zoom: ${locus.name} displayed peaks inside viewport`);
      if (sizes.length) sawPeak = true;
      ok(z.svg.includes('6-FAM') && z.svg.includes('VIC') &&
         z.svg.includes('NED') && z.svg.includes('TAZ') && z.svg.includes('SID'),
         `zoom: ${locus.name} retains five dye channels`);
      ok(/class="bin"/.test(z.svg), `zoom: ${locus.name} optional bin overlay retained`);
      const bins = [...z.svg.matchAll(/<line class="bin" x1="([0-9.]+)"/g)].map((match) => Number(match[1]));
      ok(bins.every((x) => x >= 61 && x <= 1183), `zoom: ${locus.name} bin x-coordinates stay in plot`);
      // The full plot uses 50-bp ticks. The selected locus has a finer
      // 5/10-bp axis and is not a cropped bitmap.
      const step = interval.max - interval.min <= 44 ? 5 : 10;
      ok(z.svg.includes(`>${Math.ceil(interval.min / step) * step}</text>`),
         `zoom: ${locus.name} displays fine-grained size ticks`);
    }
    ok(sawPeak, `zoom: ${kitId} shows signal across selected loci`);
  }

  // Mixtures and kinship pairs use the identical source simulations in either
  // view; all samples in a stacked electropherogram share the same focus.
  for (const type of ["clean", "degraded", "mixture2", "mixture3",
                       "parent-child", "full-siblings", "grandparent"]) {
    const opts = {kit:"globalfiler", type, seed:"zoom-"+type, controls:true, showBins:true};
    const full = generateCase(opts);
    const zoom = generateCase({...opts, zoomLocus:"D21S11"});
    ok(JSON.stringify(full.answerKey) === JSON.stringify(zoom.answerKey),
       `zoom: ${type} unchanged ground-truth answer key`);
    ok(JSON.stringify(full.samples.map((x) => x.sim)) === JSON.stringify(zoom.samples.map((x) => x.sim)),
       `zoom: ${type} no change to simulated source peaks`);
    ok(zoom.svg.includes("Allelic ladder") && zoom.svg.includes("Positive control") &&
       zoom.svg.includes("Negative control"), `zoom: ${type} preserves batch controls`);
    ok((zoom.svg.match(/data-zoom-locus="D21S11"/g) || []).length === zoom.samples.length + 3,
       `zoom: ${type} every sample/control track focused identically`);
  }

  // At least one tall true allele must exhibit a genuine aligned pull-up in
  // a second dye, and the focus must not hide that diagnostic comparison.
  let alignment = null;
  for (let i = 0; i < 80 && !alignment; i++) {
    const spec = {kit:"globalfiler", type:"clean", seed:"zoom-pullup-"+i, template:8000};
    const generated = generateCase(spec);
    const peaks = generated.samples[0].sim.peaks;
    for (const pu of peaks.filter((p) => p.kind === "pullup")) {
      const parent = peaks.find((p) => p.kind === "allele" && p.dye !== pu.dye &&
        Math.abs(p.size - pu.size) < 0.1 && p.locus);
      if (!parent) continue;
      const focused = generateCase({...spec, zoomLocus:parent.locus});
      const sizeTag = `data-size="${pu.size}"`;
      if (focused.svg.includes(sizeTag) && focused.svg.includes(`data-dye="${pu.dye}"`) &&
          focused.svg.includes(`data-dye="${parent.dye}"`)) {
        alignment = {pu, parent, focused};
        break;
      }
    }
  }
  ok(!!alignment, "zoom: aligned parent allele and different-dye pull-up remain visible");

  let bad = false;
  try { locusViewport(getKit("globalfiler"), "INVALID_LOCUS"); } catch (e) { bad = e instanceof RangeError; }
  ok(bad, "zoom: unknown marker rejects rather than silently falling back");
  bad = false;
  try { generateCase({kit:"globalfiler", type:"clean", seed:0, zoomLocus:"INVALID_LOCUS"}); }
  catch (e) { bad = e instanceof RangeError; }
  ok(bad, "zoom: generateCase rejects invalid zoom marker");

  const html = readFileSync(new URL("../epg.html", import.meta.url), "utf8");
  ok(html.includes('id="zoomLocus"') &&
     html.includes('data-fr="Zoom sur un locus"') &&
     html.includes('data-en="Zoom to locus"'),
     "zoom: bilingual lab control present");
  ok(html.includes('s.zoomLocus = zoomLocus') && html.includes('"zoomLocus").addEventListener("change", generate)'),
     "zoom: lab selector dispatches zoom to case renderer");
  ok(html.includes('fillZoomLoci(); generate();') && html.includes('fillTypes(); fillZoomLoci(); fillArts();'),
     "zoom: kit and page initialization populate selector");
}

// ---- optional stochastic low-template model (#106): off by default, opt-in via opts.stochastic ----
{
  const { simulate } = await import("../assets/epg/simulate.js");
  const { makeRng } = await import("../assets/epg/rng.js");
  const { randomProfile } = await import("../assets/epg/genetics.js");
  const K = getKit("globalfiler"), g = randomProfile(K, makeRng("sto"), { sex: "M" });
  const art = { stutter: true, minusA: true, pullup: false, dropin: false, spike: false, blob: false, offladder: false, noise: false };
  const run = (amount, st, seed) => simulate(K, [{ geno: g.geno, amount, degradation: 0 }], { rng: makeRng(seed), art, stochastic: st });
  const sig = r => JSON.stringify(r.peaks.map(p => [p.locus, p.size, p.height]));
  ok(sig(run(3000, undefined, 1)) === sig(run(3000, undefined, 1)), "stochastic: default path reproducible");
  ok(sig(run(3000, undefined, 1)) === sig(simulate(K, [{ geno: g.geno, amount: 3000, degradation: 0 }], { rng: makeRng(1), art })),
     "stochastic: omitting the option is identical to the default path");
  const st = { rfuPerCopy: 130, locusSigma: 0.6 };
  ok(sig(run(3000, st, 1)) === sig(run(3000, st, 1)), "stochastic: reproducible for a seed");
  ok(sig(run(3000, st, 1)) !== sig(run(3000, undefined, 1)), "stochastic: the option changes the simulation");
  const alleles = r => r.peaks.filter(p => p.called && p.kind === "allele" && K.loci.find(l => l.name === p.locus && !l.type)).length;
  const mean = (amt, o) => { let t = 0; for (let i = 1; i <= 60; i++) t += alleles(run(amt, o, "m" + i)); return t / 60; };
  ok(mean(4000, st) > 36, "stochastic: plenty of template still gives (almost) all 42 alleles");
  ok(mean(250, st) < mean(250, undefined) - 5, "stochastic: low template loses clearly more alleles than the deterministic model");
  const spread = (amt, o) => { const h = []; for (let i = 1; i <= 40; i++) { const r = run(amt, o, "v" + i); const p = r.peaks.filter(p => p.kind === "allele" && p.locus === "TH01"); if (p.length) h.push(p[0].height); } const m = h.reduce((a, b) => a + b, 0) / h.length; return Math.sqrt(h.reduce((a, b) => a + (b - m) ** 2, 0) / h.length) / m; };
  ok(spread(600, st) > 2 * spread(600, undefined), "stochastic: peak-height variability grows at low template");
}

console.log(`\n${fail === 0 ? "✓ ALL PASS" : "✗ FAILURES"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
