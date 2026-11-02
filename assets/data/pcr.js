/* ============================================================
   Mini-game 3 — PCR set-up → EPG consequence.

   After choosing & quantifying the extract (MG2), the student sets up
   the amplification: compute the VOLUME of extract to load (target
   input), and set the full THERMAL PROTOCOL (shown pre-filled with the
   standard defaults, every field editable and graded). "Lancer la PCR"
   renders the electropherogram the set-up would produce, using the
   existing EPG simulator. A correct set-up → clean complete profile;
   too little template → drop-out; too much → off-scale / pull-up; a bad
   thermal protocol → reduced efficiency or large-allele drop-out.

   The simulator models the EPG through an effective template `amount`
   (+ degradation + artefacts), so each field maps to those:
     amount = A_OPT × inputFactor × cycleFactor × efficiency
   with per-field penalties below.

   Bilingual {fr,en}. All constants/bands are DRAFT/tunable, pending
   validation (issue #12).
   ============================================================ */
window.PCR = {
  // thresholds mirrored from the EPG core for grading/rendering
  thresholds: { at: 150, st: 400, saturation: 30000 },

  // input normalisation
  input: {
    targetNg: 1.0, bandNg: [0.5, 1.25],
    reactionVol: 25, maxExtractVol: 15,
    concRange: [0.10, 2.5] // per-case extract concentration (ng/µL); 1 ng always reachable ≤15 µL
  },

  // effective-amount mapping (DRAFT)
  A_OPT: 1500,     // het-peak height at target input, 29 cycles, in-band protocol
  OVER: 7000,      // a called peak taller than this = over-amplified (fail)
  dispMax: 7000,   // FIXED electropherogram y-ceiling: peaks above it go off-scale
  // Per-cycle gain is steep (≈1.9×/cycle) with a very low floor, so too few
  // cycles fall below detection → NULL / very dropped profile (issue #42).
  cycleRef: 29, cycleBase: 1.9, cycleClamp: [0.01, 8],
  degClamp: [0, 4],
  // Autosomal loci forced homozygous per case, so single-peak loci must be read
  // (true homozygote vs allele drop-out) instead of every locus being an easy
  // heterozygote (issue #42). DRAFT/tunable.
  homozygousLoci: 4,

  // GeneMapper-style realism knobs passed to the simulator (DRAFT, issue #12):
  // call artefacts above threshold (pull-ups labelled PU, imbalanced minor
  // peaks kept), inject spurious Y-marker calls, and make off-ladder common.
  sim: { callArtifacts: true, yNoise: true, yNoiseRate: 0.45, olRate: 0.3, olMax: 1 },

  // messages for the input decision
  inputMsg: {
    low:  { fr: "Sous-dosage : trop peu d'ADN dans la réaction → signal faible et pertes d'allèles (drop-out).",
            en: "Under-loading: too little DNA in the reaction → weak signal and allele drop-out." },
    high: { fr: "Surdosage : trop d'ADN → pics hors échelle, pull-up (percolation entre canaux) et pics dédoublés.",
            en: "Over-loading: too much DNA → off-scale peaks, pull-up (bleed-through) and split peaks." },
    volTooMuch: { fr: "Volume d'extrait supérieur au volume maximal admissible dans la réaction.",
                  en: "Extract volume exceeds the maximum that fits in the reaction." }
  },

  // Thermal protocol. Each field: default + valid band + per-direction effect & message.
  // effect: { effMul?, degAdd? } feeds amount/degradation; msg explains the failure mode.
  fields: [
    { id: "initDenatT", group: { fr: "Dénaturation initiale", en: "Initial denaturation" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 95, band: [94, 96], step: 1,
      low:  { effMul: 0.5, degAdd: 0.8, kill: 80, msg: { fr: "dénaturation initiale insuffisante (ADN mal dénaturé) → rendement réduit", en: "insufficient initial denaturation (DNA poorly denatured) → reduced yield" } },
      high: { degAdd: 1.3, kill: 100, msg: { fr: "température trop élevée → dégradation thermique de l'ADN (perte des grands fragments)", en: "temperature too high → thermal DNA degradation (loss of large fragments)" } } },
    { id: "initDenatS", group: { fr: "Dénaturation initiale", en: "Initial denaturation" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 60, band: [30, 90], step: 5,
      low:  { effMul: 0.6, degAdd: 0.6, msg: { fr: "dénaturation initiale trop courte → rendement réduit", en: "initial denaturation too short → reduced yield" } },
      high: { degAdd: 0.8, msg: { fr: "dénaturation initiale trop longue → dégradation", en: "initial denaturation too long → degradation" } } },

    { id: "denatT", group: { fr: "Cycle — dénaturation", en: "Cycling — denaturation" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 94, band: [93, 96], step: 1,
      low:  { effMul: 0.6, degAdd: 0.7, kill: 80, msg: { fr: "dénaturation de cycle incomplète → rendement réduit", en: "incomplete cycle denaturation → reduced yield" } },
      high: { degAdd: 1.2, kill: 100, msg: { fr: "dénaturation de cycle trop chaude → dégradation", en: "cycle denaturation too hot → degradation" } } },
    { id: "denatS", group: { fr: "Cycle — dénaturation", en: "Cycling — denaturation" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 10, band: [5, 30], step: 1,
      low:  { effMul: 0.7, degAdd: 0.5, msg: { fr: "dénaturation de cycle trop brève → rendement réduit", en: "cycle denaturation too brief → reduced yield" } },
      high: { degAdd: 0.7, msg: { fr: "dénaturation de cycle trop longue → dégradation", en: "cycle denaturation too long → degradation" } } },

    { id: "annealT", group: { fr: "Cycle — hybridation", en: "Cycling — annealing" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 59, band: [57, 61], step: 1,
      low:  { effMul: 0.85, degAdd: 0.3, msg: { fr: "hybridation peu stringente → amorçage non spécifique (pics parasites) et déséquilibre", en: "low-stringency annealing → non-specific priming (artefact peaks) and imbalance" } },
      high: { effMul: 0.25, degAdd: 1.0, kill: 70, msg: { fr: "hybridation trop stringente → amorçage inefficace → pertes d'allèles", en: "over-stringent annealing → inefficient priming → allele drop-out" } } },
    { id: "annealS", group: { fr: "Cycle — hybridation", en: "Cycling — annealing" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 60, band: [30, 90], step: 5,
      low:  { effMul: 0.6, degAdd: 0.3, msg: { fr: "hybridation trop courte → amorçage incomplet → rendement réduit", en: "annealing too short → incomplete priming → reduced yield" } },
      high: { effMul: 0.95, msg: { fr: "hybridation trop longue → léger amorçage non spécifique", en: "annealing too long → slight non-specific priming" } } },

    { id: "extendT", group: { fr: "Cycle — élongation", en: "Cycling — extension" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 72, band: [70, 74], step: 1,
      low:  { effMul: 0.7, degAdd: 1.4, kill: 50, msg: { fr: "élongation trop froide → polymérase sous-optimale → perte des grands fragments", en: "extension too cold → sub-optimal polymerase → loss of large fragments" } },
      high: { effMul: 0.7, degAdd: 1.0, kill: 95, msg: { fr: "élongation trop chaude → polymérase dénaturée → perte de rendement", en: "extension too hot → polymerase denatured → loss of yield" } } },
    { id: "extendS", group: { fr: "Cycle — élongation", en: "Cycling — extension" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 30, band: [20, 90], step: 5,
      low:  { degAdd: 1.7, msg: { fr: "élongation trop courte → extension incomplète des grands fragments (drop-out des grands loci)", en: "extension too short → incomplete extension of large fragments (large-locus drop-out)" } },
      high: { effMul: 0.97, msg: { fr: "élongation trop longue (sans gros risque mais inutile)", en: "extension too long (little risk but unnecessary)" } } },

    { id: "finalT", group: { fr: "Élongation finale", en: "Final extension" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 60, band: [59, 72], step: 1,
      low:  { degAdd: 0.3, msg: { fr: "élongation finale trop froide → adénylation terminale incomplète (pics dédoublés −A)", en: "final extension too cold → incomplete terminal adenylation (split −A peaks)" } },
      high: { degAdd: 0.4, msg: { fr: "élongation finale trop chaude", en: "final extension too hot" } } },
    { id: "finalS", group: { fr: "Élongation finale", en: "Final extension" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 600, band: [300, 900], step: 30,
      low:  { degAdd: 0.3, msg: { fr: "élongation finale trop courte → adénylation incomplète (pics dédoublés −A)", en: "final extension too short → incomplete adenylation (split −A peaks)" } },
      high: { msg: { fr: "élongation finale trop longue (sans conséquence majeure)", en: "final extension too long (no major consequence)" } } },

    { id: "cycles", group: { fr: "Nombre de cycles", en: "Number of cycles" }, label: { fr: "Cycles", en: "Cycles" }, unit: "", def: 29, band: [28, 30], step: 1,
      low:  { msg: { fr: "pas assez de cycles → signal faible et pertes d'allèles", en: "too few cycles → weak signal and allele drop-out" } },
      high: { msg: { fr: "trop de cycles → sur-amplification : pics hors échelle, pull-up et pics dédoublés", en: "too many cycles → over-amplification: off-scale peaks, pull-up and split peaks" } } }
  ],

  // ---- amount model (shared by the page and the Node self-test) ----
  _clamp: function (x, lo, hi) { return Math.max(lo, Math.min(hi, x)); },

  // Effective template amount the EPG is rendered from, for the given thermal
  // values and the DNA loaded (ng). Each out-of-band field penalises efficiency
  // and/or adds degradation; the penalty SCALES with how far past the band edge
  // the value is, and a field carrying a `kill` value drives efficiency to ~0
  // at/after that value — a catastrophic setting (e.g. 150 °C denaturation) then
  // yields amount ≈ 0, i.e. a NULL profile (issue #42). Returns the amount, the
  // degradation, the list of {fr,en} offenders, and the cycle factor.
  effectiveAmount: function (vals, loadedNg) {
    var P = this, offenders = [], eff = 1, deg = 0;

    if (loadedNg < P.input.bandNg[0]) offenders.push(P.inputMsg.low);
    else if (loadedNg > P.input.bandNg[1]) offenders.push(P.inputMsg.high);

    P.fields.forEach(function (f) {
      var v = vals[f.id];
      if (!isFinite(v)) { offenders.push({ fr: "valeur manquante (" + f.group.fr + ")", en: "missing value (" + f.group.en + ")" }); return; }
      var dir = v < f.band[0] ? "low" : (v > f.band[1] ? "high" : null);
      if (!dir) return;
      var e = f[dir], edge = dir === "low" ? f.band[0] : f.band[1];
      if (e.kill != null) {
        var span = Math.abs(e.kill - edge) || 1;
        var sev = P._clamp(Math.abs(v - edge) / span, 0, 1); // 0 at the band edge → 1 at/after kill
        eff *= (e.effMul != null ? e.effMul : 1) * (1 - sev);
        deg += (e.degAdd || 0) * (0.3 + 0.7 * sev);
      } else {
        if (e.effMul != null) eff *= e.effMul;
        if (e.degAdd != null) deg += e.degAdd;
      }
      offenders.push({ fr: f.group.fr + " : " + e.msg.fr, en: f.group.en + ": " + e.msg.en });
    });

    var cycles = vals.cycles;
    var cycleFactor = isFinite(cycles)
      ? P._clamp(Math.pow(P.cycleBase, cycles - P.cycleRef), P.cycleClamp[0], P.cycleClamp[1])
      : 0; // a missing cycle count already raised an offender above
    var inputFactor = loadedNg / P.input.targetNg;
    var amount = Math.max(0, P.A_OPT * inputFactor * cycleFactor * eff);
    return { amount: amount, degradation: P._clamp(deg, P.degClamp[0], P.degClamp[1]), offenders: offenders, cycleFactor: cycleFactor, eff: eff };
  },

  // Force up to n autosomal loci to be homozygous (a single-peak locus), so the
  // student must distinguish a true homozygote from allele drop-out instead of
  // reading only easy heterozygotes (issue #42). Mutates geno; returns the names
  // of the loci changed. rnd → [0,1).
  applyHomozygous: function (geno, autosomalNames, n, rnd) {
    rnd = rnd || Math.random;
    var names = autosomalNames.filter(function (nm) { return geno[nm] && geno[nm].length === 2; });
    for (var i = names.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = names[i]; names[i] = names[j]; names[j] = t; }
    var chosen = names.slice(0, Math.max(0, Math.min(n, names.length)));
    chosen.forEach(function (nm) { geno[nm] = [geno[nm][0], geno[nm][0]]; });
    return chosen;
  },

  // Per-cycle amplification trajectory for the animation (issue #40). A logistic
  // (exponential rise → plateau) in cycle space, normalised so the value at the
  // final cycle equals `amount` (the same effective amount the EPG is rendered
  // from). So the curve and the electropherogram always agree, and grading is
  // unchanged (it still uses `amount`). Reagent-limited plateau sits a few cycles
  // before cycleRef: too few cycles end on the exponential part (cut off, low →
  // NULL), too many sit flat on the plateau (over-amplified). A catastrophic
  // protocol makes amount ≈ 0, so the whole curve is flat near zero.
  // Returns [{ c, p }] for c = 0 … N. DRAFT teaching model, not real kinetics.
  ampCurve: function (amount, cycles) {
    amount = Math.max(0, amount || 0);
    var N = Math.max(1, Math.round(isFinite(cycles) ? cycles : this.cycleRef));
    var k = 0.5, c50 = this.cycleRef - 3;           // steepness; plateau knee
    var LN = 1 / (1 + Math.exp(-k * (N - c50)));     // normaliser so p(N) = amount
    var pts = [];
    for (var c = 0; c <= N; c++) {
      var L = 1 / (1 + Math.exp(-k * (c - c50)));
      pts.push({ c: c, p: amount * (L / LN) });
    }
    return pts;
  }
};
