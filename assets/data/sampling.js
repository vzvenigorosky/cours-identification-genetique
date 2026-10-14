/* ============================================================
   Mini-game 1 — Échantillonnage de scellés.
   Catalogue of evidence items (scellés), the instrument palette,
   the orientation-test palette, and per-item correctness tiers:
     good = recommended · ok = defensible · bad = not indicated
     (anything unlisted is neutral — allowed but unnecessary).
   Bilingual {fr,en}. DRAFT content pending maintainer validation
   (issue #12); data-driven, so corrections need no code change.
   ============================================================ */
window.SAMPLING = {
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
  tests: [
    { id: "peroxtesmo",  label: { fr: "Peroxtesmo (sang)", en: "Peroxtesmo (blood)" } },
    { id: "phosphatesmo",label: { fr: "Phosphatesmo (sperme)", en: "Phosphatesmo (semen)" } },
    { id: "amylase",     label: { fr: "Amylase / Phadebas (salive)", en: "Amylase / Phadebas (saliva)" } },
    { id: "uv",          label: { fr: "Lumière UV", en: "UV light" } },
    { id: "als",         label: { fr: "Forenscope / Crimescope (ALS)", en: "Forenscope / Crimescope (ALS)" } },
    { id: "none",        label: { fr: "Aucun test nécessaire", en: "No test needed" } }
  ],
  items: [
    { id: "knife_blood", icon: "🔪",
      title: { fr: "Tache brun-rougeâtre séchée sur un couteau", en: "Dried reddish-brown stain on a knife" },
      desc:  { fr: "Scène de coups et blessures. Tache sèche sur une lame métallique.", en: "Assault scene. A dry stain on a metal blade." },
      instruments: { good: ["swab_wet"], ok: ["scraping"], bad: ["scissors", "fta_punch"] },
      tests: { good: ["peroxtesmo"], bad: ["uv", "als"] },
      teach: { fr: "Le sang n'est pas fluorescent sous UV/ALS (il absorbe la lumière) : on utilise un test peroxydasique. Surface non découpable → écouvillon humidifié.",
               en: "Blood does not fluoresce under UV/ALS (it absorbs light): use a peroxidase test. Non-cuttable surface → moistened swab." } },

    { id: "sheet_semen", icon: "🛏️",
      title: { fr: "Tache sur un drap (affaire de viol)", en: "Stain on a bedsheet (rape case)" },
      desc:  { fr: "Literie saisie. Tache suspecte sur tissu absorbant.", en: "Seized bedding. A suspicious stain on absorbent fabric." },
      instruments: { good: ["scissors"], ok: ["swab_wet"], bad: ["fta_punch"] },
      tests: { good: ["phosphatesmo", "als"], ok: ["uv", "amylase"], bad: ["peroxtesmo"] },
      teach: { fr: "Le sperme fluoresce sous ALS/UV et donne une phosphatase acide positive. Tissu → on découpe la zone. La salive (amylase) reste plausible.",
               en: "Semen fluoresces under ALS/UV and is acid-phosphatase positive. Fabric → cut out the area. Saliva (amylase) remains plausible." } },

    { id: "cig_saliva", icon: "🚬",
      title: { fr: "Mégot de cigarette", en: "Cigarette butt" },
      desc:  { fr: "Mégot retrouvé sur les lieux. ADN de contact salivaire sur le bout.", en: "Butt found at the scene. Salivary contact DNA on the tip." },
      instruments: { good: ["scissors"], ok: ["swab_wet"], bad: ["fta_punch"] },
      tests: { good: ["amylase"], ok: ["uv"], bad: ["phosphatesmo", "peroxtesmo"] },
      teach: { fr: "Salive → amylase. On prélève le bout (découpe) ; l'écouvillon humidifié est acceptable.",
               en: "Saliva → amylase. Sample the mouth end (cut); a moistened swab is acceptable." } },

    { id: "fta_ref", icon: "🟦",
      title: { fr: "Carte FTA — sang de référence", en: "FTA card — reference blood" },
      desc:  { fr: "Prélèvement de référence d'un individu connu, déposé sur carte FTA.", en: "Reference sample from a known individual, spotted on an FTA card." },
      instruments: { good: ["fta_punch"], ok: ["scissors"], bad: ["swab_wet"] },
      tests: { good: ["none"], bad: ["peroxtesmo", "phosphatesmo", "amylase", "uv", "als"] },
      teach: { fr: "Échantillon de référence : aucun test d'orientation n'est nécessaire. On poinçonne un disque de la carte.",
               en: "Reference sample: no orientation test is needed. Punch a disc from the card." } },

    { id: "collar_touch", icon: "👕",
      title: { fr: "Col de chemise — ADN de contact", en: "Shirt collar — touch DNA" },
      desc:  { fr: "Vêtement porté. ADN de contact (cellules épithéliales) attendu sur le col.", en: "Worn garment. Touch DNA (epithelial cells) expected on the collar." },
      instruments: { good: ["tape"], ok: ["scissors", "swab_wet"] },
      tests: { good: ["none"], ok: ["als"] },
      teach: { fr: "L'ADN de contact n'a pas de test présomptif fiable. Le tape-lift récupère bien les cellules de surface.",
               en: "Touch DNA has no reliable presumptive test. A tape-lift recovers surface cells well." } },

    { id: "blood_pool", icon: "🩸",
      title: { fr: "Flaque de sang liquide frais", en: "Fresh liquid blood pool" },
      desc:  { fr: "Sang encore liquide sur un sol non absorbant.", en: "Still-liquid blood on a non-absorbent floor." },
      instruments: { good: ["swab_dry"], ok: ["pipette"], bad: ["scraping"] },
      tests: { good: ["peroxtesmo"], bad: ["uv", "als"] },
      teach: { fr: "Liquide → l'écouvillon sec suffit (ou pipette) ; le grattage ne convient pas. Sang → peroxydase, pas d'ALS.",
               en: "Liquid → a dry swab suffices (or pipette); scraping is unsuitable. Blood → peroxidase, not ALS." } },

    { id: "underwear", icon: "🩲",
      title: { fr: "Sous-vêtement — tache jaunâtre", en: "Underwear — yellowish stain" },
      desc:  { fr: "Sous-vêtement saisi. Tache compatible avec sperme ou urine.", en: "Seized underwear. Stain compatible with semen or urine." },
      instruments: { good: ["scissors"], ok: ["swab_wet"] },
      tests: { good: ["phosphatesmo", "als"], ok: ["uv", "amylase"] },
      teach: { fr: "Sperme → phosphatase acide + fluorescence ALS. On découpe la zone tachée.",
               en: "Semen → acid phosphatase + ALS fluorescence. Cut out the stained area." } },

    { id: "hair_root", icon: "🧑‍🦰",
      title: { fr: "Cheveu avec racine sur une surface", en: "Hair with root on a surface" },
      desc:  { fr: "Cheveu isolé, racine (bulbe) visible → ADN nucléaire exploitable.", en: "Isolated hair with a visible root (bulb) → usable nuclear DNA." },
      instruments: { good: ["forceps"], ok: ["tape"], bad: ["swab_dry"] },
      tests: { good: ["none"], ok: ["als"] },
      teach: { fr: "On saisit le cheveu à la pince sans l'abîmer. Pas de test présomptif ; l'ALS sert juste à le localiser.",
               en: "Pick the hair up with forceps without damaging it. No presumptive test; ALS only helps locate it." } },

    { id: "envelope", icon: "✉️",
      title: { fr: "Rabat d'enveloppe / timbre", en: "Envelope flap / stamp" },
      desc:  { fr: "Courrier anonyme. Zone gommée léchée → salive.", en: "Anonymous letter. Licked gummed area → saliva." },
      instruments: { good: ["scissors"], ok: ["swab_wet"] },
      tests: { good: ["amylase"], ok: ["uv"], bad: ["phosphatesmo"] },
      teach: { fr: "Salive sur la gomme → amylase. On découpe la zone léchée.",
               en: "Saliva on the gum → amylase. Cut out the licked area." } },

    { id: "nails", icon: "💅",
      title: { fr: "Ongles de la victime (agression)", en: "Victim's fingernails (assault)" },
      desc:  { fr: "La victime s'est débattue : matériel biologique possible sous les ongles (mélange).", en: "The victim struggled: possible biological material under the nails (mixture)." },
      instruments: { good: ["scraping"], ok: ["scissors"] },
      tests: { good: ["none"], ok: ["peroxtesmo"] },
      teach: { fr: "Grattage sous-ongual (ou coupe de l'ongle). Pas de test requis ; Peroxtesmo seulement si du sang est visible. Attendez-vous à un mélange.",
               en: "Sub-ungual scraping (or nail clipping). No test required; Peroxtesmo only if blood is visible. Expect a mixture." } }
  ]
};
