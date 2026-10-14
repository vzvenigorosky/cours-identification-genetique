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

  // Which fluids fluoresce, PER LIGHT. ALS (Crimescope/Forenscope) is more
  // sensitive than UV: it reveals saliva as well as semen. Blood never
  // fluoresces (it absorbs and appears dark).
  fluorescence: {
    semen:      { als: true,  uv: true  },
    saliva:     { als: true,  uv: false },
    urine:      { als: true,  uv: true  },
    blood:      { als: false, uv: false },
    touch:      { als: false, uv: false },
    distractor: { als: false, uv: false },
    paint:      { als: false, uv: false },
    none:       { als: false, uv: false }
  },

  // Colour coding (test ＋ markers & stains). Distractor = neutral brown.
  colors: { blood: "#d64545", semen: "#2f6fb0", saliva: "#d6a516", paint: "#d64545", distractor: "#b08968", touch: "#9aa4ad", none: "#9aa4ad" },

  lights: [
    { id: "als", label: { fr: "Forenscope / Crimescope (ALS)", en: "Forenscope / Crimescope (ALS)" } },
    { id: "uv",  label: { fr: "Lumière UV", en: "UV light" } }
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
    { id: "fta_punch", footprint: "disc", label: { fr: "Puncher FTA", en: "FTA puncher" } },
    { id: "tape",      footprint: "tape", label: { fr: "Tape-lift (ruban)", en: "Tape-lift" } }
  ],

  // Instrument suitability per substrate (0–1). Any instrument NOT listed is
  // incompatible (factor 0) — e.g. scissors can't cut a metal blade.
  substrateTools: {
    card:   { fta_punch: 1.0, scissors: 0.7, scalpel: 0.6 },
    fabric: { scissors: 1.0, tape: 0.8, swab_wet: 0.6, scalpel: 0.5, swab_dry: 0.3 },
    metal:  { swab_wet: 1.0, swab_dry: 0.6, scalpel: 0.4 },
    paper:  { scissors: 1.0, swab_wet: 0.6, scalpel: 0.5 },
    swab:   { scissors: 1.0, scalpel: 0.7, swab_wet: 0.4 },
    hard:   { swab_wet: 1.0, swab_dry: 0.8, scalpel: 0.3 }
  },

  items: [
    { id: "fta", draw: "fta", substrate: "card",
      title: { fr: "Carte FTA — référence", en: "FTA card — reference" },
      context: { fr: "Prélèvement de référence d'un individu connu, sur carte FTA.",
                 en: "Reference sample from a known individual, on an FTA card." },
      gen: { min: 1, max: 1, lightable: false, reference: true },
      stainSlots: [ { cx: 200, cy: 132, r: 46 } ],
      stainPool: [ { fluid: "blood", auto: 5.0, degrad: 0.1, visible: true, maleMode: "random", weight: 1, refSample: true } ],
      touchZones: [],
      teach: { fr: "Échantillon de référence : aucun test d'orientation n'est nécessaire, on poinçonne un disque dans le spot. Selon le donneur, fraction féminine seule ou ADN masculin — jamais un mélange, donc jamais d'extraction différentielle.",
               en: "Reference sample: no orientation test is needed — punch a disc in the spot. Depending on the donor, feminine-only or male DNA — never a mixture, hence never a differential extraction." } },

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
      teach: { fr: "Même sans tache, un vêtement porté offre de l'ADN de contact au col et aux aisselles : on y prélève par le tape-lift ou l'écouvillon, pas sur le devant. Le sperme fluoresce (ALS/UV), la salive sous ALS seulement, le sang ne fluoresce pas. Une tache brune peut être non biologique : un test l'écarte.",
               en: "Even with no stain, a worn garment yields touch DNA at the collar and armpits: tape-lift / swab there, not the front. Semen fluoresces (ALS/UV), saliva under ALS only, blood doesn't. A brown stain may be non-biological: a test rules it out." } },

    { id: "sheet", draw: "sheet", substrate: "fabric",
      title: { fr: "Drap (affaire de viol)", en: "Bedsheet (rape case)" },
      context: { fr: "Literie saisie. Recherche de taches biologiques sur une grande surface.",
                 en: "Seized bedding. Searching for biological stains over a large surface." },
      gen: { min: 1, max: 3, lightable: true },
      stainSlots: [ { cx: 110, cy: 110, r: 30 }, { cx: 205, cy: 140, r: 32 }, { cx: 292, cy: 112, r: 26 }, { cx: 170, cy: 182, r: 26 } ],
      stainPool: [
        { fluid: "semen",      auto: 3.2, degrad: 0.3, visible: false, maleMode: "always", weight: 3 },
        { fluid: "blood",      auto: 2.4, degrad: 0.35, visible: true, maleMode: "random", weight: 2 },
        { fluid: "saliva",     auto: 1.1, degrad: 0.3, visible: false, maleMode: "random", weight: 2 },
        { fluid: "distractor", auto: 0,   degrad: 0,   visible: true,  maleMode: "none",   weight: 2 }
      ],
      touchZones: [],
      teach: { fr: "Grande surface : les taches de sperme/salive sont invisibles → l'ALS les localise avant tout test. Le sang se voit mais ne fluoresce pas. On caractérise chaque tache puis on découpe celles qui portent de l'ADN.",
               en: "Large surface: semen/saliva stains are invisible → ALS locates them before any test. Blood is visible but doesn't fluoresce. Characterise each stain, then cut out the DNA-bearing ones." } },

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
      teach: { fr: "Le sang de la lame est visible et non fluorescent (ALS inutile, Peroxtesmo confirme). On ne découpe pas le métal → écouvillon humidifié. Le manche porte de l'ADN de contact invisible : on le prélève par le contexte. Du sang d'un homme → au besoin Y-STR, pas d'extraction différentielle.",
               en: "Blade blood is visible and non-fluorescent (ALS useless, Peroxtesmo confirms). You can't cut metal → moistened swab. The handle carries invisible touch DNA: sample it from context. A man's blood → Y-STR if needed, not a differential extraction." } },

    { id: "redstain", draw: "redstain", substrate: "hard",
      title: { fr: "Tache rouge sur surface dure", en: "Red stain on a hard surface" },
      context: { fr: "Trace rouge sur support non poreux. Sang ? Peinture ? Rouille ?",
                 en: "Red mark on a non-porous surface. Blood? Paint? Rust?" },
      gen: { min: 1, max: 1, lightable: false },
      stainSlots: [ { cx: 200, cy: 130, r: 40 } ],
      stainPool: [ { fluid: "blood", auto: 3.0, degrad: 0.2, visible: true, maleMode: "random", weight: 1, uncertain: true } ],
      touchZones: [],
      teach: { fr: "Une tache rouge n'est pas forcément du sang : un test d'orientation (Peroxtesmo) tranche. Si elle est négative (peinture, rouille), il n'y a rien à extraire : on le déclare au lieu de prélever inutilement.",
               en: "A red stain isn't necessarily blood: an orientation test (Peroxtesmo) decides. If it's negative (paint, rust), there is nothing to extract: declare it rather than sampling for nothing." } }
  ]
};
