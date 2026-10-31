/* ============================================================
   Mini-game 2 — Quantification: which extract to amplify?

   The next link in the casework chain after sampling (MG1). A
   réquisition asks the laboratory to produce AUTOSOMAL STR profiles.
   Each scellé (sealed exhibit) has already been extracted into several
   samples, each with a quantification result (autosomal ng/µL). For
   each scellé the student must pick the single BEST extract to send to
   autosomal STR amplification — or declare that NO extract is usable
   (quantity below the usable threshold) and the réquisition can't be
   met on that scellé.

   The decision axis is QUANTITY only (ng/µL vs the usable threshold).
   Y-STR and mtDNA are deliberately out of scope here.

   Bilingual {fr,en}. The teaching threshold is 5 pg/µL (0.005 ng/µL).

   DECISION DIFFICULTY (issue #39). A real "should we amplify?" call only
   arises when the deciding extract sits NEAR the threshold. So each scellé
   is built in one of four modes:
     - rich         : a clearly usable best extract (well above threshold).
     - marginalPos  : the best extract is just AT/above the threshold — low
                      but amplifiable; the correct answer is to amplify it.
     - marginalNeg  : the best reading is just BELOW the threshold — tempting
                      (not a blank), but the correct answer is "aucun".
     - depleted     : every extract is near-blank → obvious "aucun".
   The marginal modes are the point of the exercise: the number is close
   enough to the cut-off that the student must actually apply the criterion.

   Generation lives here (not in the page) so a Node self-test can exercise
   it. buildScelle(tpl, rng, forceMode) takes an injectable rng (→ [0,1)) for
   deterministic testing; the page passes Math.random and shuffles the
   returned extracts for display. Display and grading use the SAME 3-decimal
   rounded value, so the on-screen number and the verdict always agree.

   Quantification ranges, the mode mix and the marginal bands are
   DRAFT/tunable TEACHING VALUES pending the maintainer's scientific review
   (see docs/mg2.md). Ranges are [min,max] ng/µL; the FIRST site of each
   scellé is the rich one, the others are poorer (non-overlapping so the best
   extract is unambiguous).
   ============================================================ */
window.EXTRACTION = {
  threshold: 0.005, // ng/µL autosomal = 5 pg/µL; teaching criterion for this exercise
  perCase: [2, 3], // number of scellés drawn per case

  // Scenario mix — one mode per scellé. Weights are teaching values (tunable).
  // The two marginal modes together dominate so a near-threshold judgment call
  // appears in most cases (the point of issue #39).
  modeMix: [
    { mode: "rich", w: 0.34 },
    { mode: "marginalPos", w: 0.26 },
    { mode: "marginalNeg", w: 0.26 },
    { mode: "depleted", w: 0.14 }
  ],

  // Marginal bands in ng/µL (DRAFT/tunable). Kept a readable tick away from the
  // 0.005 threshold on each side so the displayed number is clearly above or
  // below the cut-off — never visually "exactly on the line".
  bands: {
    marginalUsable: [0.006, 0.014], // ≥ threshold but low → amplify (marginal)
    marginalBelow: [0.002, 0.004],  // < threshold, non-trivial → tempting "aucun"
    belowRest: [0.000, 0.004],      // the other extracts in a marginal-positive case
    trace: [0.000, 0.0015]          // near-blank readings
  },

  requisition: {
    fr: "Réquisition : le magistrat demande l'établissement des profils ADN <strong>autosomiques</strong> à partir des scellés ci-dessous. Les extractions ont été réalisées. Pour chaque scellé, sélectionnez l'extrait à amplifier (la meilleure quantification exploitable) — ou indiquez qu'aucun extrait n'est exploitable.",
    en: "Requisition: the magistrate requests <strong>autosomal</strong> DNA profiles from the exhibits below. Extractions are done. For each exhibit, select the extract to amplify (the best usable quantification) — or indicate that no extract is usable."
  },

  // Scellé templates. sites[0] is the rich extract; ranges are non-overlapping.
  scelles: [
    {
      id: "knife",
      title: { fr: "Scellé — Couteau", en: "Exhibit — Knife" },
      nature: { fr: "Lame métallique saisie (coups et blessures).", en: "Seized metal blade (assault)." },
      sites: [
        { label: { fr: "Écouvillon lame (sang)", en: "Blade swab (blood)" }, range: [0.30, 1.60] },
        { label: { fr: "Écouvillon manche (contact)", en: "Handle swab (touch)" }, range: [0.010, 0.045] },
        { label: { fr: "Témoin dos de lame", en: "Blade-back control" }, range: [0.000, 0.004] }
      ]
    },
    {
      id: "sheet",
      title: { fr: "Scellé — Drap", en: "Exhibit — Bedsheet" },
      nature: { fr: "Literie saisie, plusieurs taches repérées.", en: "Seized bedding, several stains located." },
      sites: [
        { label: { fr: "Tache principale", en: "Main stain" }, range: [0.40, 1.30] },
        { label: { fr: "Tache secondaire", en: "Secondary stain" }, range: [0.030, 0.250] },
        { label: { fr: "Zone propre (témoin)", en: "Clean area (control)" }, range: [0.000, 0.003] }
      ]
    },
    {
      id: "garment",
      title: { fr: "Scellé — Vêtement", en: "Exhibit — Garment" },
      nature: { fr: "Vêtement porté (ADN de contact attendu).", en: "Worn garment (touch DNA expected)." },
      sites: [
        { label: { fr: "Col", en: "Collar" }, range: [0.120, 0.500] },
        { label: { fr: "Poignet", en: "Cuff" }, range: [0.020, 0.100] },
        { label: { fr: "Devant", en: "Front" }, range: [0.000, 0.030] }
      ]
    },
    {
      id: "cig",
      title: { fr: "Scellé — Mégot", en: "Exhibit — Cigarette butt" },
      nature: { fr: "Mégot ramassé sur les lieux (salive).", en: "Butt collected at the scene (saliva)." },
      sites: [
        { label: { fr: "Filtre (embouchure)", en: "Filter (mouth end)" }, range: [0.250, 1.100] },
        { label: { fr: "Corps du mégot", en: "Body of the butt" }, range: [0.000, 0.020] }
      ]
    },
    {
      id: "swabkit",
      title: { fr: "Scellé — Écouvillons", en: "Exhibit — Swabs" },
      nature: { fr: "Deux écouvillons d'une même trace.", en: "Two swabs of the same trace." },
      sites: [
        { label: { fr: "Écouvillon 1", en: "Swab 1" }, range: [0.150, 0.900] },
        { label: { fr: "Écouvillon 2", en: "Swab 2" }, range: [0.030, 0.120] }
      ]
    },
    {
      id: "surface",
      title: { fr: "Scellé — Prélèvements de surface", en: "Exhibit — Surface samples" },
      nature: { fr: "Poignée de porte, trois prélèvements de contact.", en: "Door handle, three contact samples." },
      sites: [
        { label: { fr: "Prélèvement A", en: "Sample A" }, range: [0.080, 0.350] },
        { label: { fr: "Prélèvement B", en: "Sample B" }, range: [0.020, 0.070] },
        { label: { fr: "Prélèvement C", en: "Sample C" }, range: [0.000, 0.040] }
      ]
    }
  ],

  // ---- generation (shared by the browser and the Node self-test) ----
  _rnd: function (rng, r) { return r[0] + rng() * (r[1] - r[0]); },
  _q3: function (n) { return Math.round(n * 1000) / 1000; },

  // Weighted mode pick. rng → [0,1).
  pickMode: function (rng) {
    var total = this.modeMix.reduce(function (s, m) { return s + m.w; }, 0);
    var x = rng() * total;
    for (var i = 0; i < this.modeMix.length; i++) {
      x -= this.modeMix[i].w;
      if (x < 0) return this.modeMix[i].mode;
    }
    return this.modeMix[this.modeMix.length - 1].mode;
  },

  // Build one scellé. Returns extracts in CANONICAL order (site order); the
  // page shuffles them for display. correctId is the best usable extract's id,
  // or "none". bestLabel/bestQ describe that extract; topLabel/topQ describe the
  // single highest reading regardless of the threshold (used to explain a
  // near-miss "aucun"). mode is returned so feedback can flag a marginal call.
  buildScelle: function (tpl, rng, forceMode) {
    rng = rng || Math.random;
    var mode = forceMode || this.pickMode(rng);
    var self = this, B = this.bands, th = this.threshold;
    var vals = tpl.sites.map(function (s, i) {
      if (mode === "rich") return self._rnd(rng, s.range);
      if (mode === "marginalPos") return i === 0 ? self._rnd(rng, B.marginalUsable) : self._rnd(rng, B.belowRest);
      if (mode === "marginalNeg") return i === 0 ? self._rnd(rng, B.marginalBelow) : self._rnd(rng, [0, (B.marginalBelow[0]) * 0.7]);
      return self._rnd(rng, B.trace); // depleted
    });
    var extracts = tpl.sites.map(function (s, i) {
      return { id: tpl.id + "_" + i, label: s.label, q: Math.max(0, self._q3(vals[i])) };
    });
    var usable = extracts.filter(function (e) { return e.q >= th; });
    var best = usable.reduce(function (a, e) { return (!a || e.q > a.q) ? e : a; }, null);
    var top = extracts.reduce(function (a, e) { return (!a || e.q > a.q) ? e : a; }, null);
    return {
      id: tpl.id, title: tpl.title, nature: tpl.nature, mode: mode,
      extracts: extracts,
      correctId: best ? best.id : "none",
      bestLabel: best ? best.label : null, bestQ: best ? best.q : null,
      topLabel: top ? top.label : null, topQ: top ? top.q : null
    };
  }
};
