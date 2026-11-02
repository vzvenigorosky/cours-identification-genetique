/* ============================================================
   Mini-game 1 (v4) — Interactive sampling of real evidence objects,
   now GENERATIVE: each case composes 0–N stains (incl. non-biological
   distractors) on the object, plus intrinsic touch zones (worn areas),
   so the student learns to locate traces, characterise them, and decide
   where — or whether — to sample.

   The student:
     1. (optionally) shines a light — ALS reveals semen + saliva,
        UV reveals semen only; blood never fluoresces; some objects
        (cigarette, swab, knife, FTA, hard surface) reveal nothing.
     2. arms an orientation TEST and clicks a point → colour-coded
        ＋ / － (red = blood, blue = sperm, yellow = saliva).
     3. arms an INSTRUMENT and clicks a point to SAMPLE, OR declares
        "nothing exploitable" when there is genuinely nothing to recover.

   Interpretation (forensically corrected):
     - Differential extraction is recommended ONLY when spermatozoa are
       present (semen).
     - Male DNA without sperm (male's blood/saliva/touch) → suggest a
       Y-STR analysis, not a differential extraction.
     - A worn garment with no stain still carries touch DNA on the collar
       / armpit / waistband — sample there, don't decline.

   Bilingual {fr,en}. Forensic parameters are DRAFT/tunable, pending
   validation (issue #12). Coordinates are in the 400×260 object canvas.

   ---- Data shapes ----
   stainPool entry: { fluid, auto, degrad, visible, maleMode, weight,
                      uncertain? }
     fluid     "blood" | "semen" | "saliva" | "distractor"
     auto      autosomal ng/µL if sampled ideally (distractor = 0)
     visible   drawn (coloured) without test/light (blood, distractor)
     maleMode  "none" | "always"(semen) | "mix"(mixture) | "random"
     uncertain red-stain case: per case it is real blood OR a non-bio red
   stainSlots: non-overlapping candidate positions { cx, cy, r }
   touchZones: always-present worn areas { cx, cy, r, auto, maleMode } —
               invisible, non-fluorescent, no presumptive test (touch DNA)
   gen:        { min, max, lightable, reference? }
   ============================================================ */
window.SAMPLING = {
  threshold: 0.05, // ng/µL autosomal considered "usable DNA recovered"

  // Tool stringency (DRAFT/tunable, #43). An instrument whose suitability is
  // below `acceptTool` is the WRONG tool for that substrate and fails the
  // sampling, even if a little DNA is recovered. `dryStainPenalty` is the yield
  // multiplier for using a DRY swab on a dried deposit (a moistened swab should
  // be used to rehydrate and lift the cells) — it applies only on the dried
  // SURFACES in `dryPenaltySubstrates` (#47: on liquid blood a dry swab is fine,
  // and FTA is swabbed as a reduced-efficiency alternative to punching).
  acceptTool: 0.5,
  dryStainPenalty: 0.15,
  dryPenaltySubstrates: ["fabric", "metal", "hard", "paper"],

  // Which fluids fluoresce under the (single) forensic light. The ALS/UV
  // distinction is intentionally hidden (#43): semen and saliva fluoresce,
  // blood never does (it absorbs and appears dark).
  fluorescence: {
    semen:      true,
    saliva:     true,
    urine:      true,
    blood:      false,
    touch:      false,
    tissue:     false,
    distractor: false,
    paint:      false,
    none:       false
  },

  // Colour coding (test ＋ markers & stains). Distractor = neutral brown.
  colors: { blood: "#d64545", semen: "#2f6fb0", saliva: "#d6a516", paint: "#d64545", tissue: "#b5544f", distractor: "#b08968", touch: "#9aa4ad", none: "#9aa4ad" },

  // One combined forensic-light button (Crimescope/Forenscope + UV merged, #43).
  lights: [
    { id: "light", label: { fr: "Lumière forensique (Crimescope / UV)", en: "Forensic light (Crimescope / UV)" } }
  ],

  tests: [
    { id: "peroxtesmo",   fluid: "blood",  label: { fr: "Peroxtesmo (sang)", en: "Peroxtesmo (blood)" } },
    { id: "phosphatesmo", fluid: "semen",  label: { fr: "Phosphatesmo (sperme)", en: "Phosphatesmo (semen)" } },
    { id: "amylase",      fluid: "saliva", label: { fr: "Amylase / Phadebas (salive)", en: "Amylase / Phadebas (saliva)" } }
  ],

  instruments: [
    { id: "swab_dry",  footprint: "swab", label: { fr: "Écouvillon sec", en: "Dry swab" } },
    { id: "swab_wet",  footprint: "swab", label: { fr: "Écouvillon humidifié", en: "Moistened swab" } },
    { id: "scissors",  footprint: "cut",  label: { fr: "Ciseaux (découpe)", en: "Scissors (cut-out)" } },
    { id: "scalpel",   footprint: "scalpel", label: { fr: "Scalpel", en: "Scalpel" } },
    { id: "fta_punch", footprint: "disc", label: { fr: "Poinçon FTA", en: "FTA puncher" } },
    { id: "pipette",   footprint: "pipette", label: { fr: "Pipetage", en: "Pipetting" } },
    { id: "dremel",    footprint: "bore", label: { fr: "Fraisage (Dremel)", en: "Drilling (Dremel)" } },
    { id: "cryo",      footprint: "grind", label: { fr: "Cryobroyage", en: "Cryogenic grinding" } }
  ],

  // Instrument suitability per substrate (0–1). Any instrument NOT listed is
  // incompatible (factor 0) — e.g. scissors can't cut a metal blade. A dry swab
  // is below `acceptTool` wherever a dried deposit should be lifted wet (#43).
  substrateTools: {
    card:   { fta_punch: 1.0, scissors: 0.7, scalpel: 0.6, swab_wet: 0.55, swab_dry: 0.55 },
    fabric: { scissors: 1.0, swab_wet: 0.6, scalpel: 0.5, swab_dry: 0.3 },
    metal:  { swab_wet: 1.0, scalpel: 0.4, swab_dry: 0.3 },
    paper:  { scissors: 1.0, swab_wet: 0.6, scalpel: 0.5 },
    swab:   { scissors: 1.0, scalpel: 0.7, swab_wet: 0.4 },
    hard:   { swab_wet: 1.0, scalpel: 0.3, swab_dry: 0.35 },
    bone:   { dremel: 1.0, cryo: 1.0, scalpel: 0.2 },
    tooth:  { dremel: 1.0, cryo: 0.9 },
    tissue: { scalpel: 1.0, swab_wet: 0.5, swab_dry: 0.5 },
    liquid: { pipette: 1.0, swab_wet: 0.6, swab_dry: 0.6 }
  },

  items: [
    { id: "fta", draw: "fta", substrate: "card",
      title: { fr: "Carte FTA — référence", en: "FTA card — reference" },
      context: { fr: "Prélèvement de référence d'un individu connu, sur carte FTA.",
                 en: "Reference sample from a known individual, on an FTA card." },
      gen: { min: 1, max: 1, lightable: false, reference: true },
      stainSlots: [ { cx: 200, cy: 132, r: 46 } ],
      stainPool: [ { fluid: "blood", auto: 5.0, degrad: 0.1, visible: true, maleMode: "random", weight: 1, refSample: true, single: true } ],
      touchZones: [],
      teach: { fr: "Échantillon de référence : aucun test d'orientation n'est nécessaire, on poinçonne un disque dans le spot. Source unique → extraction classique, jamais différentielle.",
               en: "Reference sample: no orientation test is needed — punch a disc in the spot. Single source → standard extraction, never differential." } },

    { id: "shirt", draw: "shirt", substrate: "fabric",
      title: { fr: "T-shirt (scène d'agression)", en: "T-shirt (assault scene)" },
      context: { fr: "Vêtement saisi. Taches éventuelles invisibles à l'œil nu ; de toute façon il a été porté.",
                 en: "Seized garment. Any stains may be invisible; it was worn in any case." },
      gen: { min: 0, max: 2, lightable: true },
      stainSlots: [ { cx: 170, cy: 162, r: 26 }, { cx: 238, cy: 165, r: 26 }, { cx: 205, cy: 205, r: 24 } ],
      stainPool: [
        { fluid: "semen",      auto: 3.0, degrad: 0.3, visible: false, maleMode: "always", weight: 3 },
        { fluid: "blood",      auto: 2.2, degrad: 0.35, visible: true, maleMode: "random", weight: 2 },
        { fluid: "saliva",     auto: 1.2, degrad: 0.3, visible: false, maleMode: "random", weight: 2 },
        { fluid: "distractor", auto: 0,   degrad: 0,   visible: true,  maleMode: "none",   weight: 2 }
      ],
      touchZones: [
        { cx: 205, cy: 74, r: 18, auto: 0.12, maleMode: "random" }, // collar
        { cx: 148, cy: 140, r: 15, auto: 0.09, maleMode: "random" }, // left armpit
        { cx: 262, cy: 140, r: 15, auto: 0.09, maleMode: "random" }  // right armpit
      ],
      teach: { fr: "Même sans tache, un vêtement porté offre de l'ADN de contact au col et aux aisselles : on y prélève à l'écouvillon humidifié (ou par découpe), pas sur le devant. Sous lumière forensique, le sperme et la salive fluorescent, le sang ne fluoresce pas. Une tache brune peut être non biologique : un test l'écarte.",
               en: "Even with no stain, a worn garment yields touch DNA at the collar and armpits: sample there with a moistened swab (or cut-out), not the front. Under forensic light, semen and saliva fluoresce, blood doesn't. A brown stain may be non-biological: a test rules it out." } },

    { id: "sheet", draw: "sheet", substrate: "fabric",
      title: { fr: "Drap (affaire de viol)", en: "Bedsheet (rape case)" },
      context: { fr: "Literie saisie. Recherche de taches biologiques sur une grande surface.",
                 en: "Seized bedding. Searching for biological stains over a large surface." },
      gen: { min: 1, max: 3, lightable: true },
      stainSlots: [ { cx: 110, cy: 110, r: 30 }, { cx: 205, cy: 140, r: 32 }, { cx: 292, cy: 112, r: 26 }, { cx: 160, cy: 190, r: 26 } ],
      stainPool: [
        { fluid: "semen",      auto: 3.2, degrad: 0.3, visible: false, maleMode: "always", weight: 3 },
        { fluid: "blood",      auto: 2.4, degrad: 0.35, visible: true, maleMode: "random", weight: 2 },
        { fluid: "saliva",     auto: 1.1, degrad: 0.3, visible: false, maleMode: "random", weight: 2 },
        { fluid: "distractor", auto: 0,   degrad: 0,   visible: true,  maleMode: "none",   weight: 2 }
      ],
      touchZones: [],
      teach: { fr: "Grande surface : les taches de sperme/salive sont invisibles → la lumière forensique les localise avant tout test. Le sang se voit mais ne fluoresce pas. On caractérise chaque tache puis on découpe celles qui portent de l'ADN.",
               en: "Large surface: semen/saliva stains are invisible → the forensic light locates them before any test. Blood is visible but doesn't fluoresce. Characterise each stain, then cut out the DNA-bearing ones." } },

    { id: "underwear", draw: "underwear", substrate: "fabric",
      title: { fr: "Sous-vêtement (agression)", en: "Underwear (assault)" },
      context: { fr: "Tache compatible avec un mélange sperme + cellules de la victime.",
                 en: "Stain compatible with a semen + victim-cell mixture." },
      gen: { min: 1, max: 2, lightable: true },
      stainSlots: [ { cx: 200, cy: 150, r: 30 }, { cx: 152, cy: 122, r: 20 }, { cx: 248, cy: 122, r: 20 } ],
      stainPool: [
        { fluid: "semen",      auto: 2.6, degrad: 0.4, visible: false, maleMode: "mix",  weight: 3 },
        { fluid: "blood",      auto: 1.8, degrad: 0.4, visible: true,  maleMode: "random", weight: 1 },
        { fluid: "distractor", auto: 0,   degrad: 0,   visible: true,  maleMode: "none",   weight: 1 }
      ],
      touchZones: [ { cx: 200, cy: 92, r: 22, auto: 0.10, maleMode: "random" } ], // waistband
      teach: { fr: "Un mélange sperme + cellules de la victime se sépare par extraction différentielle. La ceinture porte de l'ADN de contact du porteur.",
               en: "A semen + victim-cell mixture is separated by differential extraction. The waistband carries the wearer's touch DNA." } },

    { id: "saswab", draw: "swab", substrate: "swab", sa: true,
      title: { fr: "Écouvillon (prélèvement médico-légal)", en: "Swab (forensic medical kit)" },
      context: { fr: "Écouvillon déjà réalisé par le médecin dans un contexte d'agression sexuelle.",
                 en: "Swab already taken by the physician in a sexual-assault context." },
      gen: { min: 1, max: 1, lightable: false },
      stainSlots: [ { cx: 95, cy: 130, r: 26 } ],
      stainPool: [ { fluid: "semen", auto: 2.4, degrad: 0.4, visible: false, maleMode: "always", weight: 1 } ],
      touchZones: [],
      teach: { fr: "Contexte d'AS : il FAUT rechercher les spermatozoïdes (Phosphatesmo / microscopie) avant l'extraction, sinon on manque la fraction masculine. On sous-échantillonne l'écouvillon, puis extraction différentielle.",
               en: "SA context: you MUST test for spermatozoa (Phosphatesmo / microscopy) before extraction, otherwise you miss the male fraction. Sub-sample the swab, then differential extraction." } },

    { id: "cig", draw: "cig", substrate: "paper",
      title: { fr: "Mégot de cigarette", en: "Cigarette butt" },
      context: { fr: "ADN salivaire de contact sur l'embouchure (le filtre).", en: "Salivary contact DNA on the mouth end (the filter)." },
      gen: { min: 1, max: 1, lightable: false },
      stainSlots: [ { cx: 110, cy: 130, r: 22 } ],
      stainPool: [ { fluid: "saliva", auto: 1.0, degrad: 0.4, visible: false, maleMode: "random", weight: 1 } ],
      touchZones: [],
      teach: { fr: "On ne voit rien sous lumière : une cigarette se fume d'un seul côté, on reconnaît l'embouchure et on la découpe. L'amylase confirme la salive. Selon le fumeur, fraction féminine seule ou ADN masculin → au besoin une analyse Y-STR, jamais une extraction différentielle (pas de sperme).",
               en: "Nothing shows under light: a cigarette is smoked from one end — recognise the mouth end and cut it. Amylase confirms saliva. Depending on the smoker, feminine-only or male DNA → a Y-STR analysis if needed, never a differential extraction (no sperm)." } },

    { id: "knife", draw: "knife", substrate: "metal",
      title: { fr: "Couteau", en: "Knife" },
      context: { fr: "Coups et blessures. Lame métallique saisie.", en: "Assault. A seized metal blade." },
      gen: { min: 0, max: 1, lightable: false },
      stainSlots: [ { cx: 262, cy: 128, r: 20 } ],
      stainPool: [ { fluid: "blood", auto: 2.2, degrad: 0.4, visible: true, maleMode: "random", weight: 1 } ],
      touchZones: [ { cx: 118, cy: 130, r: 24, auto: 0.09, maleMode: "random" } ], // handle
      teach: { fr: "Le sang de la lame est visible et non fluorescent (la lumière est inutile, Peroxtesmo confirme). On ne découpe pas le métal → écouvillon humidifié. Le manche porte de l'ADN de contact invisible : on le prélève par le contexte. Du sang d'un homme → au besoin Y-STR, pas d'extraction différentielle.",
               en: "Blade blood is visible and non-fluorescent (the light is useless here, Peroxtesmo confirms). You can't cut metal → moistened swab. The handle carries invisible touch DNA: sample it from context. A man's blood → Y-STR if needed, not a differential extraction." } },

    { id: "redstain", draw: "redstain", substrate: "hard",
      title: { fr: "Tache rouge sur surface dure", en: "Red stain on a hard surface" },
      context: { fr: "Trace rouge sur support non poreux. Sang ? Peinture ? Rouille ?",
                 en: "Red mark on a non-porous surface. Blood? Paint? Rust?" },
      gen: { min: 1, max: 1, lightable: false },
      stainSlots: [ { cx: 200, cy: 130, r: 40 } ],
      stainPool: [ { fluid: "blood", auto: 3.0, degrad: 0.2, visible: true, maleMode: "random", weight: 1, uncertain: true } ],
      touchZones: [],
      teach: { fr: "Une tache rouge n'est pas forcément du sang : un test d'orientation (Peroxtesmo) tranche. Si elle est négative (peinture, rouille), il n'y a rien à extraire : on le déclare au lieu de prélever inutilement.",
               en: "A red stain isn't necessarily blood: an orientation test (Peroxtesmo) decides. If it's negative (paint, rust), there is nothing to extract: declare it rather than sampling for nothing." } },

    { id: "bone", draw: "bone", substrate: "bone",
      title: { fr: "Os (reste humain)", en: "Bone (human remains)" },
      context: { fr: "Fragment osseux d'un corps non identifié. ADN souvent dégradé.",
                 en: "Bone fragment from an unidentified body. DNA often degraded." },
      gen: { min: 1, max: 1, lightable: false },
      stainSlots: [ { cx: 200, cy: 130, r: 44 } ],
      stainPool: [ { fluid: "tissue", auto: 1.2, degrad: 0.55, visible: false, maleMode: "random", weight: 1, single: true } ],
      touchZones: [],
      teach: { fr: "Un os ne se prélève pas à l'écouvillon : on fraise (Dremel) pour obtenir de la poudre osseuse, ou on cryobroie un fragment nettoyé. ADN souvent dégradé, source unique → extraction classique.",
               en: "A bone is not swabbed: drill it (Dremel) for bone powder, or cryo-grind a cleaned fragment. Often-degraded DNA, single source → standard extraction." } },

    { id: "muscle", draw: "muscle", substrate: "tissue",
      title: { fr: "Tissu musculaire", en: "Muscle tissue" },
      context: { fr: "Prélèvement cadavérique de tissu mou pour identification.",
                 en: "Cadaveric soft-tissue sample for identification." },
      gen: { min: 1, max: 1, lightable: false },
      stainSlots: [ { cx: 200, cy: 128, r: 44 } ],
      stainPool: [ { fluid: "tissue", auto: 2.2, degrad: 0.4, visible: false, maleMode: "random", weight: 1, single: true } ],
      touchZones: [],
      teach: { fr: "On excise un fragment de tissu au scalpel, puis digestion (pas aux ciseaux, qui écrasent le tissu). Un écouvillon est possible mais donne un très faible rendement. Source unique identifiée → extraction classique, ni différentielle ni Y-STR.",
               en: "Excise a tissue fragment with a scalpel, then digest (not with scissors, which crush the tissue). A swab is possible but gives a very low yield. Single identified source → standard extraction, neither differential nor Y-STR." } },

    { id: "bloodtube", draw: "bloodtube", substrate: "liquid",
      title: { fr: "Tube de sang (référence)", en: "Blood tube (reference)" },
      context: { fr: "Prélèvement sanguin de référence d'un individu connu, sur tube.",
                 en: "Reference blood draw from a known individual, in a tube." },
      gen: { min: 1, max: 1, lightable: false, reference: true },
      stainSlots: [ { cx: 200, cy: 165, r: 24 } ],
      stainPool: [ { fluid: "blood", auto: 5.0, degrad: 0.1, visible: false, maleMode: "random", weight: 1, single: true, refSample: true } ],
      touchZones: [],
      teach: { fr: "Sang liquide en tube : on pipette un aliquot — ni écouvillon ni découpe. Échantillon de référence, source unique → extraction classique.",
               en: "Liquid blood in a tube: pipette an aliquot — no swab, no cut-out. Reference sample, single source → standard extraction." } },

    { id: "salivafta", draw: "fta", substrate: "card",
      title: { fr: "Salive sur carte FTA (référence)", en: "Saliva on FTA card (reference)" },
      context: { fr: "Prélèvement salivaire de référence déposé sur carte FTA.",
                 en: "Reference saliva sample deposited on an FTA card." },
      gen: { min: 1, max: 1, lightable: false, reference: true },
      stainSlots: [ { cx: 200, cy: 132, r: 46 } ],
      stainPool: [ { fluid: "saliva", auto: 4.0, degrad: 0.1, visible: false, maleMode: "random", weight: 1, single: true, refSample: true } ],
      touchZones: [],
      teach: { fr: "Référence sur carte FTA : on poinçonne un disque, aucun test d'orientation nécessaire. Source unique → extraction classique.",
               en: "FTA-card reference: punch a disc, no orientation test needed. Single source → standard extraction." } },

    { id: "tooth", draw: "tooth", substrate: "tooth",
      title: { fr: "Dent", en: "Tooth" },
      context: { fr: "Dent prélevée sur un corps non identifié. ADN protégé mais parfois dégradé.",
                 en: "Tooth taken from an unidentified body. Protected but sometimes degraded DNA." },
      gen: { min: 1, max: 1, lightable: false },
      stainSlots: [ { cx: 200, cy: 125, r: 42 } ],
      stainPool: [ { fluid: "tissue", auto: 1.0, degrad: 0.55, visible: false, maleMode: "random", weight: 1, single: true } ],
      touchZones: [],
      teach: { fr: "Comme l'os, une dent est un tissu minéralisé : on fraise (Dremel) ou on cryobroie la racine après section. Source unique → extraction classique.",
               en: "Like bone, a tooth is mineralised tissue: drill it (Dremel) or cryo-grind the sectioned root. Single source → standard extraction." } }
  ]
};
