/* ============================================================
   Mini-game 1 (v2) — Interactive sampling of sealed evidence.
   The student investigates a scellé (visual cues + orientation
   tests revealing latent stains per zone), then chooses a zone
   and an instrument to sample. Success = DNA recovered, reported
   as autosomal + male(Y) ng/µL + a degradation index.

   Bilingual {fr,en}. Forensic parameters (tool factors, zone
   richness, thresholds) are DRAFT/tunable, pending validation
   (issue #12). Data-driven: corrections need no code change.
   ============================================================ */
window.SAMPLING = {
  threshold: 0.05, // ng/µL autosomal considered "usable DNA recovered"

  instruments: [
    { id: "swab_dry",  label: { fr: "Écouvillon sec", en: "Dry swab" } },
    { id: "swab_wet",  label: { fr: "Écouvillon humidifié", en: "Moistened swab" } },
    { id: "scissors",  label: { fr: "Ciseaux (découpe)", en: "Scissors (cut-out)" } },
    { id: "scalpel",   label: { fr: "Scalpel", en: "Scalpel" } },
    { id: "fta_punch", label: { fr: "Puncher FTA", en: "FTA puncher" } },
    { id: "scraping",  label: { fr: "Grattage", en: "Scraping" } },
    { id: "tape",      label: { fr: "Tape-lift (ruban)", en: "Tape-lift" } },
    { id: "forceps",   label: { fr: "Pince / forceps", en: "Forceps" } },
    { id: "pipette",   label: { fr: "Pipette", en: "Pipette" } }
  ],

  // Orientation tests. mode "als" = whole-item reveal of fluorescent latent
  // stains; mode "chem" = applied to a selected zone, positive for `fluid`.
  tests: [
    { id: "als",         mode: "als",  label: { fr: "Forenscope / Crimescope (ALS)", en: "Forenscope / Crimescope (ALS)" } },
    { id: "uv",          mode: "als",  label: { fr: "Lumière UV", en: "UV light" } },
    { id: "peroxtesmo",  mode: "chem", fluid: "blood",  label: { fr: "Peroxtesmo (sang)", en: "Peroxtesmo (blood)" } },
    { id: "phosphatesmo",mode: "chem", fluid: "semen",  label: { fr: "Phosphatesmo (sperme)", en: "Phosphatesmo (semen)" } },
    { id: "amylase",     mode: "chem", fluid: "saliva", label: { fr: "Amylase / Phadebas (salive)", en: "Amylase / Phadebas (saliva)" } }
  ],

  // Fluids that fluoresce under ALS/UV (so an ALS pass reveals latent ones).
  fluorescent: { semen: true, saliva: true, urine: true, blood: false, touch: false, none: false },

  // Instrument suitability per substrate (0–1). Any instrument NOT listed for a
  // substrate is incompatible (factor 0) — e.g. scissors can't cut a metal blade.
  substrateTools: {
    fabric: { scissors: 1.0, tape: 0.8, swab_wet: 0.6, scalpel: 0.5, swab_dry: 0.3 },
    metal:  { swab_wet: 1.0, scraping: 0.7, swab_dry: 0.6, scalpel: 0.4 },
    card:   { fta_punch: 1.0, scissors: 0.7, scalpel: 0.6 },
    paper:  { scissors: 1.0, swab_wet: 0.6, scalpel: 0.5 },
    hair:   { forceps: 1.0, tape: 0.5 },
    liquid: { swab_dry: 1.0, pipette: 1.0, swab_wet: 0.8 },
    nail:   { scraping: 1.0, scissors: 0.6, scalpel: 0.5 }
  },

  // Each zone: fluid, auto/male richness (ng/µL if sampled ideally), degrad
  // index (0 fresh → 1 degraded), visible (shown without a test), x/y/w/h in %
  // of the schematic inner box.
  items: [
    { id: "knife", icon: "🔪", substrate: "metal",
      title: { fr: "Couteau", en: "Knife" },
      context: { fr: "Coups et blessures. Lame métallique saisie.", en: "Assault. A seized metal blade." },
      zones: [
        { id: "blade", label: { fr: "Tache sur la lame", en: "Stain on the blade" }, fluid: "blood", auto: 2.0, male: 1.8, degrad: 0.4, visible: true, x: 8, y: 30, w: 34, h: 24 },
        { id: "handle", label: { fr: "Manche", en: "Handle" }, fluid: "touch", auto: 0.08, male: 0.06, degrad: 0.5, visible: false, x: 60, y: 34, w: 32, h: 20 },
        { id: "flat", label: { fr: "Plat de la lame (propre)", en: "Flat of the blade (clean)" }, fluid: "none", auto: 0, male: 0, degrad: 0, visible: false, x: 8, y: 6, w: 50, h: 18 }
      ],
      teach: { fr: "Le sang est visible et non fluorescent : inutile de passer l'ALS, un test peroxydasique confirme. On ne peut pas découper du métal → écouvillon humidifié.",
               en: "Blood is visible and non-fluorescent: no need for ALS, a peroxidase test confirms. You can't cut metal → moistened swab." } },

    { id: "sheet", icon: "🛏️", substrate: "fabric",
      title: { fr: "Drap (affaire de viol)", en: "Bedsheet (rape case)" },
      context: { fr: "Literie saisie. Tache invisible à l'œil nu.", en: "Seized bedding. A stain invisible to the naked eye." },
      zones: [
        { id: "stain", label: { fr: "Zone latente", en: "Latent area" }, fluid: "semen", auto: 3.0, male: 2.8, degrad: 0.3, visible: false, x: 30, y: 24, w: 34, h: 28 },
        { id: "clean", label: { fr: "Tissu propre", en: "Clean fabric" }, fluid: "none", auto: 0, male: 0, degrad: 0, visible: false, x: 70, y: 10, w: 24, h: 20 }
      ],
      teach: { fr: "Le sperme n'est pas visible mais fluoresce : l'ALS localise la tache, le Phosphatesmo confirme. On découpe la zone. ADN masculin élevé (sperme).",
               en: "Semen is invisible but fluoresces: ALS locates it, Phosphatesmo confirms. Cut out the area. High male DNA (sperm)." } },

    { id: "underwear", icon: "🩲", substrate: "fabric",
      title: { fr: "Sous-vêtement (agression)", en: "Underwear (assault)" },
      context: { fr: "Tache compatible avec un mélange sperme + cellules de la victime.", en: "Stain compatible with a semen + victim-cell mixture." },
      zones: [
        { id: "stain", label: { fr: "Tache", en: "Stain" }, fluid: "semen", auto: 2.6, male: 1.4, degrad: 0.4, visible: false, x: 32, y: 26, w: 32, h: 26 },
        { id: "clean", label: { fr: "Tissu propre", en: "Clean fabric" }, fluid: "none", auto: 0, male: 0, degrad: 0, visible: false, x: 8, y: 10, w: 22, h: 18 }
      ],
      teach: { fr: "Mélange : ADN autosomal (victime + agresseur) et une fraction masculine nette → une extraction différentielle sera utile à l'étape suivante.",
               en: "Mixture: autosomal DNA (victim + offender) and a clear male fraction → a differential extraction will help at the next step." } },

    { id: "cig", icon: "🚬", substrate: "paper",
      title: { fr: "Mégot de cigarette", en: "Cigarette butt" },
      context: { fr: "ADN salivaire de contact sur le bout.", en: "Salivary contact DNA on the tip." },
      zones: [
        { id: "tip", label: { fr: "Bout (embouchure)", en: "Mouth end" }, fluid: "saliva", auto: 0.9, male: 0.8, degrad: 0.4, visible: true, x: 8, y: 26, w: 26, h: 24 },
        { id: "body", label: { fr: "Corps du mégot", en: "Body of the butt" }, fluid: "none", auto: 0, male: 0, degrad: 0, visible: false, x: 40, y: 28, w: 52, h: 18 }
      ],
      teach: { fr: "Salive → amylase. On découpe le bout. L'embouchure est identifiable, l'ALS est optionnel.",
               en: "Saliva → amylase. Cut the mouth end. The tip is identifiable; ALS is optional." } },

    { id: "collar", icon: "👕", substrate: "fabric",
      title: { fr: "Col de chemise (ADN de contact)", en: "Shirt collar (touch DNA)" },
      context: { fr: "Vêtement porté. Pas de tache visible.", en: "Worn garment. No visible stain." },
      zones: [
        { id: "collar", label: { fr: "Col", en: "Collar" }, fluid: "touch", auto: 0.12, male: 0.1, degrad: 0.5, visible: false, x: 30, y: 10, w: 40, h: 16 },
        { id: "front", label: { fr: "Devant", en: "Front" }, fluid: "none", auto: 0, male: 0, degrad: 0, visible: false, x: 24, y: 34, w: 52, h: 22 }
      ],
      teach: { fr: "L'ADN de contact est invisible et ne répond à aucun test présomptif ni à l'ALS : on raisonne sur le contexte (zone portée au cou) et on fait un tape-lift.",
               en: "Touch DNA is invisible and responds to no presumptive test nor ALS: reason from context (worn at the neck) and tape-lift it." } },

    { id: "fta", icon: "🟦", substrate: "card",
      title: { fr: "Carte FTA — référence", en: "FTA card — reference" },
      context: { fr: "Prélèvement de référence (sang) d'un individu connu.", en: "Reference blood sample from a known individual." },
      zones: [
        { id: "spot", label: { fr: "Spot de sang", en: "Blood spot" }, fluid: "blood", auto: 5.0, male: 0, degrad: 0.1, visible: true, x: 34, y: 20, w: 30, h: 30 }
      ],
      teach: { fr: "Échantillon de référence : aucun test d'orientation n'est nécessaire, on poinçonne un disque. (Donneuse féminine : pas d'ADN masculin.)",
               en: "Reference sample: no orientation test is needed, just punch a disc. (Female donor: no male DNA.)" } },

    { id: "envelope", icon: "✉️", substrate: "paper",
      title: { fr: "Rabat d'enveloppe", en: "Envelope flap" },
      context: { fr: "Courrier anonyme. Zone gommée léchée.", en: "Anonymous letter. Licked gummed area." },
      zones: [
        { id: "flap", label: { fr: "Rabat gommé", en: "Gummed flap" }, fluid: "saliva", auto: 0.7, male: 0.6, degrad: 0.3, visible: false, x: 20, y: 10, w: 60, h: 18 },
        { id: "body", label: { fr: "Corps de l'enveloppe", en: "Envelope body" }, fluid: "none", auto: 0, male: 0, degrad: 0, visible: false, x: 20, y: 34, w: 60, h: 22 }
      ],
      teach: { fr: "Salive sur la gomme : l'ALS peut la révéler, l'amylase confirme. On découpe le rabat.",
               en: "Saliva on the gum: ALS can reveal it, amylase confirms. Cut out the flap." } },

    { id: "pool", icon: "🩸", substrate: "liquid",
      title: { fr: "Flaque de sang liquide", en: "Liquid blood pool" },
      context: { fr: "Sang encore liquide sur sol non absorbant.", en: "Still-liquid blood on a non-absorbent floor." },
      zones: [
        { id: "pool", label: { fr: "Flaque", en: "Pool" }, fluid: "blood", auto: 4.0, male: 3.6, degrad: 0.1, visible: true, x: 26, y: 20, w: 44, h: 28 }
      ],
      teach: { fr: "Liquide et abondant → écouvillon sec (ou pipette). Le grattage ne convient pas. Sang → peroxydase, pas d'ALS.",
               en: "Liquid and abundant → dry swab (or pipette). Scraping is unsuitable. Blood → peroxidase, not ALS." } }
  ]
};
