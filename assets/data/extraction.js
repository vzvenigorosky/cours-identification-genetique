/* ============================================================
   Mini-game 2 — Extraction → Quantification → Routing.

   The next link in the casework chain after sampling (MG1): the
   student receives a sampled trace, chooses an EXTRACTION method
   (classic vs differential), reads the QUANTIFICATION result
   (autosomal ng/µL, Y/male ng/µL, degradation index — split into an
   epithelial (F) and a sperm (M) fraction when a differential
   extraction is correctly chosen), and ROUTES the extract to the
   right downstream analyses (Autosomal STR / Y-STR / mtDNA).

   Grading is deterministic: the quant values + sample kind map to a
   uniquely-correct route set (see the model in ex_extraction.html).

   Bilingual {fr,en}. Forensic parameters (thresholds, quant ranges)
   are DRAFT/tunable, pending validation (issue #12). Quant ranges are
   [min,max] in ng/µL; degrad is an index 0 (fresh) → 1 (degraded).
   ============================================================ */
window.EXTRACTION = {
  // Deterministic route-model thresholds (DRAFT — issue #12).
  thresholds: { autoMin: 0.02, degradMax: 0.85, yMin: 0.005 },

  routes: [
    { id: "auto",  label: { fr: "STR autosomiques", en: "Autosomal STR" } },
    { id: "ystr",  label: { fr: "Y-STR (lignée masculine)", en: "Y-STR (male lineage)" } },
    { id: "mtdna", label: { fr: "ADN mitochondrial (ADNmt)", en: "Mitochondrial DNA (mtDNA)" } }
  ],

  // Scenario templates. `sperm` → differential extraction is the correct call.
  // `kind:"hairshaft"` → no nuclear DNA (mtDNA only). `femaleBackground` → a
  // predominantly female sample carrying a male contributor (Y-STR indicated).
  // Quant is generated per case from the ranges; for sperm cases the F/M
  // fractions are generated from fRange / mRange / yRange.
  scenarios: [
    {
      id: "saswab", kind: "swab", sperm: true, femaleBackground: true,
      title: { fr: "Écouvillon vaginal (agression sexuelle)", en: "Vaginal swab (sexual assault)" },
      context: { fr: "Prélèvement médico-légal : cellules épithéliales de la victime + spermatozoïdes.",
                 en: "Forensic swab: victim epithelial cells + spermatozoa." },
      autoRange: [0.6, 2.2], degradRange: [0.15, 0.45],
      fRange: [0.4, 1.4], mRange: [0.3, 1.2], yRange: [0.15, 0.6],
      teach: { fr: "Sperme présent → extraction différentielle : la lyse séquentielle sépare la fraction épithéliale (victime) de la fraction spermatique (agresseur). On analyse les deux en STR autosomiques et on confirme la lignée masculine en Y-STR (fraction masculine minoritaire possible).",
               en: "Sperm present → differential extraction: sequential lysis separates the epithelial fraction (victim) from the sperm fraction (offender). Both go to autosomal STR, and Y-STR confirms the male lineage (a minor male fraction is possible)." }
    },
    {
      id: "underwear", kind: "fabric", sperm: true, femaleBackground: true,
      title: { fr: "Tache sur sous-vêtement (sperme + victime)", en: "Underwear stain (semen + victim)" },
      context: { fr: "Mélange sperme + cellules de la victime découpé sur le tissu.",
                 en: "Semen + victim-cell mixture cut from the fabric." },
      autoRange: [0.5, 1.8], degradRange: [0.2, 0.5],
      fRange: [0.3, 1.1], mRange: [0.25, 1.0], yRange: [0.12, 0.5],
      teach: { fr: "Mélange avec spermatozoïdes → extraction différentielle. STR autosomiques sur les deux fractions ; Y-STR utile pour la fraction masculine dans un fond féminin.",
               en: "Mixture with spermatozoa → differential extraction. Autosomal STR on both fractions; Y-STR helps the male fraction in a female background." }
    },
    {
      id: "cigarette", kind: "paper", sperm: false, femaleBackground: false,
      title: { fr: "Mégot de cigarette (salive)", en: "Cigarette butt (saliva)" },
      context: { fr: "Embouchure découpée. Source unique (un seul fumeur).",
                 en: "Mouth end cut out. Single source (one smoker)." },
      autoRange: [0.3, 1.2], degradRange: [0.15, 0.4], maleChance: 0.5, singleSource: true,
      teach: { fr: "Source unique : extraction classique (totale). Les STR autosomiques suffisent à établir le profil. Le Y-STR n'apporte rien sur une source unique (même masculine) : on le réserve aux mélanges à fond féminin.",
               en: "Single source: classic (total) extraction. Autosomal STR alone establishes the profile. Y-STR adds nothing on a single source (even a male one): reserve it for female-background mixtures." }
    },
    {
      id: "bloodstain", kind: "stain", sperm: false, femaleBackground: false,
      title: { fr: "Tache de sang fraîche (source unique)", en: "Fresh bloodstain (single source)" },
      context: { fr: "Sang abondant et récent sur un support non poreux.",
                 en: "Abundant, recent blood on a non-porous surface." },
      autoRange: [0.8, 3.0], degradRange: [0.05, 0.3], maleChance: 0.5, singleSource: true,
      teach: { fr: "ADN abondant et peu dégradé, source unique → extraction classique et STR autosomiques. Ni extraction différentielle (pas de sperme) ni Y-STR (pas de fond féminin).",
               en: "Abundant, lightly degraded DNA, single source → classic extraction and autosomal STR. Neither differential extraction (no sperm) nor Y-STR (no female background)." }
    },
    {
      id: "touch", kind: "touch", sperm: false, femaleBackground: false,
      title: { fr: "ADN de contact (col de vêtement)", en: "Touch DNA (garment collar)" },
      context: { fr: "Faible quantité d'ADN de contact prélevée au tape-lift.",
                 en: "Low-quantity touch DNA collected by tape-lift." },
      autoRange: [0.03, 0.09], degradRange: [0.3, 0.55], maleChance: 0.5, singleSource: true,
      teach: { fr: "Faible quantité mais exploitable : extraction classique et STR autosomiques (éventuellement en basse copie / LCN). On ne passe PAS en ADNmt tant que les STR restent viables.",
               en: "Low but usable: classic extraction and autosomal STR (possibly low-copy / LCN). Do NOT switch to mtDNA while STR is still viable." }
    },
    {
      id: "bone", kind: "bone", sperm: false, femaleBackground: false,
      title: { fr: "Reste osseux ancien (dégradé)", en: "Old skeletal remains (degraded)" },
      context: { fr: "Os ancien : ADN nucléaire très faible et très dégradé.",
                 en: "Old bone: very low and very degraded nuclear DNA." },
      autoRange: [0.0, 0.015], degradRange: [0.85, 0.97], maleChance: 0.5, singleSource: true,
      teach: { fr: "ADN nucléaire trop faible et trop dégradé : les STR autosomiques échoueront. On passe à l'ADN mitochondrial (très nombreux copies par cellule), qui ne donne qu'une lignée maternelle, pas une identification individuelle.",
               en: "Nuclear DNA too low and too degraded: autosomal STR will fail. Switch to mitochondrial DNA (many copies per cell), which yields only a maternal lineage, not an individual identification." }
    },
    {
      id: "hairshaft", kind: "hairshaft", sperm: false, femaleBackground: false,
      title: { fr: "Cheveu tombé (tige, sans bulbe)", en: "Shed hair (shaft, no root)" },
      context: { fr: "Cheveu télogène sans gaine : pas d'ADN nucléaire exploitable.",
                 en: "Telogen hair with no sheath: no usable nuclear DNA." },
      autoRange: [0.0, 0.004], degradRange: [0.4, 0.7], maleChance: 0.5, singleSource: true,
      teach: { fr: "Une tige pilaire sans bulbe ne contient quasiment pas d'ADN nucléaire : les STR sont inutiles d'emblée. Seul l'ADN mitochondrial est exploitable (lignée maternelle).",
               en: "A hair shaft without a root contains almost no nuclear DNA: STR is pointless from the outset. Only mitochondrial DNA is usable (maternal lineage)." }
    }
  ]
};
