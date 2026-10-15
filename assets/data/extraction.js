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
   Quantification ranges remain DRAFT/tunable. Ranges are [min,max] ng/µL; the FIRST
   site of each scellé is the rich one, the others are poorer (ranges
   are non-overlapping so the best extract is unambiguous). A case may
   put a scellé in "depleted" mode where every extract falls below the
   threshold → the correct answer is "aucun".
   ============================================================ */
window.EXTRACTION = {
  threshold: 0.005, // ng/µL autosomal = 5 pg/µL; teaching criterion for this exercise
  pDepleted: 0.25, // chance a given scellé has no usable extract (dead end)
  perCase: [2, 3], // number of scellés drawn per case

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
  ]
};
