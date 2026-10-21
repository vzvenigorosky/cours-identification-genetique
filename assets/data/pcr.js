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
  cycleRef: 29, cycleBase: 1.3, cycleClamp: [0.2, 6],
  degClamp: [0, 4],

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
      low:  { effMul: 0.5, degAdd: 0.8, msg: { fr: "dénaturation initiale insuffisante (ADN mal dénaturé) → rendement réduit", en: "insufficient initial denaturation (DNA poorly denatured) → reduced yield" } },
      high: { degAdd: 1.3, msg: { fr: "température trop élevée → dégradation thermique de l'ADN (perte des grands fragments)", en: "temperature too high → thermal DNA degradation (loss of large fragments)" } } },
    { id: "initDenatS", group: { fr: "Dénaturation initiale", en: "Initial denaturation" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 60, band: [30, 90], step: 5,
      low:  { effMul: 0.6, degAdd: 0.6, msg: { fr: "dénaturation initiale trop courte → rendement réduit", en: "initial denaturation too short → reduced yield" } },
      high: { degAdd: 0.8, msg: { fr: "dénaturation initiale trop longue → dégradation", en: "initial denaturation too long → degradation" } } },

    { id: "denatT", group: { fr: "Cycle — dénaturation", en: "Cycling — denaturation" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 94, band: [93, 96], step: 1,
      low:  { effMul: 0.6, degAdd: 0.7, msg: { fr: "dénaturation de cycle incomplète → rendement réduit", en: "incomplete cycle denaturation → reduced yield" } },
      high: { degAdd: 1.2, msg: { fr: "dénaturation de cycle trop chaude → dégradation", en: "cycle denaturation too hot → degradation" } } },
    { id: "denatS", group: { fr: "Cycle — dénaturation", en: "Cycling — denaturation" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 10, band: [5, 30], step: 1,
      low:  { effMul: 0.7, degAdd: 0.5, msg: { fr: "dénaturation de cycle trop brève → rendement réduit", en: "cycle denaturation too brief → reduced yield" } },
      high: { degAdd: 0.7, msg: { fr: "dénaturation de cycle trop longue → dégradation", en: "cycle denaturation too long → degradation" } } },

    { id: "annealT", group: { fr: "Cycle — hybridation", en: "Cycling — annealing" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 59, band: [57, 61], step: 1,
      low:  { effMul: 0.85, degAdd: 0.3, msg: { fr: "hybridation peu stringente → amorçage non spécifique (pics parasites) et déséquilibre", en: "low-stringency annealing → non-specific priming (artefact peaks) and imbalance" } },
      high: { effMul: 0.25, degAdd: 1.0, msg: { fr: "hybridation trop stringente → amorçage inefficace → pertes d'allèles", en: "over-stringent annealing → inefficient priming → allele drop-out" } } },
    { id: "annealS", group: { fr: "Cycle — hybridation", en: "Cycling — annealing" }, label: { fr: "Durée", en: "Time" }, unit: "s", def: 60, band: [30, 90], step: 5,
      low:  { effMul: 0.6, degAdd: 0.3, msg: { fr: "hybridation trop courte → amorçage incomplet → rendement réduit", en: "annealing too short → incomplete priming → reduced yield" } },
      high: { effMul: 0.95, msg: { fr: "hybridation trop longue → léger amorçage non spécifique", en: "annealing too long → slight non-specific priming" } } },

    { id: "extendT", group: { fr: "Cycle — élongation", en: "Cycling — extension" }, label: { fr: "Température", en: "Temperature" }, unit: "°C", def: 72, band: [70, 74], step: 1,
      low:  { effMul: 0.7, degAdd: 1.4, msg: { fr: "élongation trop froide → polymérase sous-optimale → perte des grands fragments", en: "extension too cold → sub-optimal polymerase → loss of large fragments" } },
      high: { effMul: 0.7, degAdd: 1.0, msg: { fr: "élongation trop chaude → polymérase sous-optimale", en: "extension too hot → sub-optimal polymerase" } } },
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
  ]
};
