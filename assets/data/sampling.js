/* ============================================================
   Mini-game 1 (v3) — Interactive sampling of real evidence objects.

   The student is shown a *modelled object* (SVG), not an abstract
   grid of labelled zones. Biological traces live as "spots" placed
   on the object in a 400×260 object-coordinate space. The student:
     1. (optionally) shines a light (ALS/UV) — reveals latent
        FLUORESCENT spots across the whole object;
     2. arms an orientation TEST and clicks a point — gets a
        colour-coded ＋ / － (red = blood, blue = sperm, yellow =
        saliva);
     3. arms an INSTRUMENT and clicks a point to SAMPLE — the
        footprint (dashed circle = swab, disc = punch, cut = scalpel,
        cut-out = scissors) must land on a DNA-bearing spot.
   Success = usable DNA recovered, reported as autosomal + male(Y)
   ng/µL + a degradation index, with differential-vs-feminine-only
   interpretation.

   Bilingual {fr,en}. Forensic parameters (tool factors, spot
   richness, thresholds, fractions) are DRAFT/tunable, pending
   validation (issue #12). Data-driven: corrections need no code
   change. Coordinates are in the 400×260 object canvas.

   Spot fields:
     fluid       "blood" | "semen" | "saliva" | "touch" | "none"
     cx,cy,r     centre + hit/draw radius (object coords)
     auto        autosomal ng/µL if sampled ideally
     degrad      degradation index 0 (fresh) → 1 (degraded)
     visible     drawn (coloured) without any test/light
     fluorescent revealed by ALS/UV when latent
     maleMode    "none"  → male = 0 (single feminine-type source)
                 "always"→ male ≈ auto (semen / male contributor)
                 "mix"   → male = a clear fraction of auto (mixture)
                 "random"→ donor sex drawn per case (male 0 or ≈auto)
     uncertain   (red stain) identity drawn per case: real blood or
                 a non-biological red (no DNA) — only a test tells.
   ============================================================ */
window.SAMPLING = {
  threshold: 0.05, // ng/µL autosomal considered "usable DNA recovered"

  // Fluids that fluoresce under ALS/UV (so a light pass reveals latent ones).
  fluorescent: { semen: true, saliva: true, blood: false, touch: false, none: false, paint: false },

  // Colour coding requested by the maintainer (test ＋ markers & stains).
  colors: { blood: "#d64545", semen: "#2f6fb0", saliva: "#d6a516", paint: "#d64545", touch: "#9aa4ad", none: "#9aa4ad" },

  // Lights (whole-object reveal of latent fluorescent spots).
  lights: [
    { id: "als", label: { fr: "Forenscope / Crimescope (ALS)", en: "Forenscope / Crimescope (ALS)" } },
    { id: "uv",  label: { fr: "Lumière UV", en: "UV light" } }
  ],

  // Orientation tests: arm, then click a point. Positive only where the
  // matching fluid actually is.
  tests: [
    { id: "peroxtesmo",   fluid: "blood",  label: { fr: "Peroxtesmo (sang)", en: "Peroxtesmo (blood)" } },
    { id: "phosphatesmo", fluid: "semen",  label: { fr: "Phosphatesmo (sperme)", en: "Phosphatesmo (semen)" } },
    { id: "amylase",      fluid: "saliva", label: { fr: "Amylase / Phadebas (salive)", en: "Amylase / Phadebas (saliva)" } }
  ],

  // Instruments: arm, then click a point to sample. `footprint` drives the
  // drawn mark; suitability per substrate is in substrateTools.
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

  // ---- The modelled objects. `draw` selects an SVG draw routine in the page.
  items: [
    { id: "fta", draw: "fta", substrate: "card",
      title: { fr: "Carte FTA — référence", en: "FTA card — reference" },
      context: { fr: "Prélèvement de référence d'un individu connu, sur carte FTA.",
                 en: "Reference sample from a known individual, on an FTA card." },
      spots: [
        { fluid: "blood", cx: 200, cy: 132, r: 46, auto: 5.0, degrad: 0.1, visible: true, fluorescent: false, maleMode: "random", refSample: true }
      ],
      teach: { fr: "Échantillon de référence : aucun test d'orientation n'est nécessaire, on poinçonne simplement un disque dans le spot. Selon le donneur, on obtient une fraction féminine seule ou de l'ADN masculin — mais jamais un mélange.",
               en: "Reference sample: no orientation test is needed — just punch a disc in the spot. Depending on the donor you get a feminine-only fraction or male DNA, but never a mixture." } },

    { id: "shirt", draw: "shirt", substrate: "fabric",
      title: { fr: "T-shirt (agression)", en: "T-shirt (assault)" },
      context: { fr: "Vêtement saisi. Une tache peut être invisible à l'œil nu.",
                 en: "Seized garment. A stain may be invisible to the naked eye." },
      spots: [
        { fluid: "semen", cx: 205, cy: 150, r: 34, auto: 3.0, degrad: 0.3, visible: false, fluorescent: true, maleMode: "always" },
        { fluid: "touch", cx: 205, cy: 74, r: 22, auto: 0.11, degrad: 0.5, visible: false, fluorescent: false, maleMode: "random" }
      ],
      teach: { fr: "Le sperme ne se voit pas mais fluoresce : l'ALS le localise, le Phosphatesmo confirme, on découpe la zone aux ciseaux. Fraction masculine nette → extraction différentielle. Le col porte de l'ADN de contact invisible (aucun test, aucune fluorescence) : on y pense par le contexte.",
               en: "Semen is invisible but fluoresces: ALS locates it, Phosphatesmo confirms, cut the area out with scissors. Clear male fraction → differential extraction. The collar carries invisible touch DNA (no test, no fluorescence): reason it from context." } },

    { id: "sheet", draw: "sheet", substrate: "fabric",
      title: { fr: "Drap (affaire de viol)", en: "Bedsheet (rape case)" },
      context: { fr: "Literie saisie. Recherche de taches biologiques.",
                 en: "Seized bedding. Searching for biological stains." },
      spots: [
        { fluid: "semen", cx: 185, cy: 140, r: 36, auto: 3.2, degrad: 0.3, visible: false, fluorescent: true, maleMode: "always" }
      ],
      teach: { fr: "Tache latente de sperme : sans lumière on ne voit rien. L'ALS la révèle, le Phosphatesmo confirme, on découpe. ADN masculin élevé → extraction différentielle.",
               en: "Latent semen stain: nothing shows without light. ALS reveals it, Phosphatesmo confirms, then cut it out. High male DNA → differential extraction." } },

    { id: "underwear", draw: "underwear", substrate: "fabric",
      title: { fr: "Sous-vêtement (agression)", en: "Underwear (assault)" },
      context: { fr: "Tache compatible avec un mélange sperme + cellules de la victime.",
                 en: "Stain compatible with a semen + victim-cell mixture." },
      spots: [
        { fluid: "semen", cx: 200, cy: 150, r: 32, auto: 2.6, degrad: 0.4, visible: false, fluorescent: true, maleMode: "mix" }
      ],
      teach: { fr: "Mélange : ADN autosomal (victime + agresseur) et une fraction masculine nette → l'extraction différentielle sépare les deux contributeurs à l'étape suivante.",
               en: "Mixture: autosomal DNA (victim + offender) and a clear male fraction → differential extraction separates the two contributors at the next step." } },

    { id: "saswab", draw: "swab", substrate: "swab", sa: true,
      title: { fr: "Écouvillon (prélèvement médico-légal)", en: "Swab (forensic medical kit)" },
      context: { fr: "Écouvillon déjà réalisé par le médecin dans un contexte d'agression sexuelle.",
                 en: "Swab already taken by the physician in a sexual-assault context." },
      spots: [
        { fluid: "semen", cx: 95, cy: 130, r: 26, auto: 2.4, degrad: 0.4, visible: false, fluorescent: true, maleMode: "always" }
      ],
      teach: { fr: "Contexte d'AS : il FAUT rechercher la présence de spermatozoïdes (Phosphatesmo / microscopie) avant l'extraction — sinon on passe à côté de la fraction masculine. On sous-échantillonne l'écouvillon, puis extraction différentielle.",
               en: "SA context: you MUST test for spermatozoa (Phosphatesmo / microscopy) before extraction — otherwise you miss the male fraction. Sub-sample the swab, then differential extraction." } },

    { id: "cig", draw: "cig", substrate: "paper",
      title: { fr: "Mégot de cigarette", en: "Cigarette butt" },
      context: { fr: "ADN salivaire de contact sur l'embouchure.", en: "Salivary contact DNA on the mouth end." },
      spots: [
        { fluid: "saliva", cx: 110, cy: 130, r: 22, auto: 1.0, degrad: 0.4, visible: false, fluorescent: true, maleMode: "random" }
      ],
      teach: { fr: "Salive sur le filtre : l'amylase confirme, l'ALS peut aider. On découpe l'embouchure aux ciseaux. Selon le fumeur, fraction féminine seule ou ADN masculin.",
               en: "Saliva on the filter: amylase confirms, ALS can help. Cut the mouth end with scissors. Depending on the smoker, feminine-only or male DNA." } },

    { id: "knife", draw: "knife", substrate: "metal",
      title: { fr: "Couteau", en: "Knife" },
      context: { fr: "Coups et blessures. Lame métallique saisie.", en: "Assault. A seized metal blade." },
      spots: [
        { fluid: "blood", cx: 262, cy: 128, r: 20, auto: 2.2, degrad: 0.4, visible: true, fluorescent: false, maleMode: "random" },
        { fluid: "touch", cx: 118, cy: 130, r: 26, auto: 0.09, degrad: 0.5, visible: false, fluorescent: false, maleMode: "random" }
      ],
      teach: { fr: "Le sang de la lame est visible et non fluorescent (l'ALS est inutile, le Peroxtesmo confirme). On ne découpe pas le métal → écouvillon humidifié. Le manche porte de l'ADN de contact invisible que rien ne révèle : on le prélève en raisonnant par le contexte.",
               en: "Blood on the blade is visible and non-fluorescent (ALS is useless, Peroxtesmo confirms). You can't cut metal → moistened swab. The handle carries invisible touch DNA that nothing reveals: sample it by reasoning from context." } },

    { id: "redstain", draw: "redstain", substrate: "hard",
      title: { fr: "Tache rouge sur surface dure", en: "Red stain on a hard surface" },
      context: { fr: "Trace rouge sur support non poreux. Sang ? Peinture ? Rouille ?",
                 en: "Red mark on a non-porous surface. Blood? Paint? Rust?" },
      spots: [
        { fluid: "blood", cx: 200, cy: 130, r: 40, auto: 3.0, degrad: 0.2, visible: true, fluorescent: false, maleMode: "random", uncertain: true }
      ],
      teach: { fr: "Une tache rouge n'est pas forcément du sang : on peut l'écouvillonner, mais sans test d'orientation (Peroxtesmo) on ne sait pas si on a prélevé du matériel biologique. Toujours confirmer avant de conclure.",
               en: "A red stain is not necessarily blood: you can swab it, but without an orientation test (Peroxtesmo) you don't know whether you sampled any biological material. Always confirm before concluding." } }
  ]
};
