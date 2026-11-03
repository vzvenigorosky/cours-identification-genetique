/* ============================================================
   Shared building blocks of the requisition generator
   (requisitions-narrative.js) and the quote simulator (devis.js), issue #76.

   Classic script (no import/export) so that the browser and the Node
   self-tests can load it before either consumer; the quote simulator is an
   ES module and reads it from `globalThis.REQUISITION_SHARED` when a case is
   built.

   Content:
   - name pools,
   - the PARTIES of a sexual-assault case (sex of the complainant and of the
     alleged assailant, wording style) and the bilingual phrases that depend
     on them,
   - the ejaculation statements, examination delay and swab descriptions
     that every clear sexual-assault request must state.

   Everything is a DRAFT teaching assumption pending the maintainer's review.
   Teaching frequencies (complainant a woman, alleged assailant a man) are
   deliberately realistic, not balanced.
   ============================================================ */
(function (root) {
  "use strict";
  const t = (fr, en) => ({ fr, en });
  const frac = r => (typeof r.float === "function" ? r.float() : r.next());

  const SURNAMES = ["MARTIN","MOREL","LEGRAND","DUPUIS","GARNIER","ROUX","PERRIN","LEFÈVRE","DURAND","PETIT","BLANC","FOURNIER"];
  const MALE_NAMES = ["Paul","Louis","Thomas","Nicolas","Pierre","Jean","Hugo","Marc","Luc","David","Émile","Alexandre","Simon","Julien","Arthur","Gabriel"];
  const FEMALE_NAMES = ["Marie","Claire","Sophie","Louise","Jeanne","Anne","Julie","Alice","Léa","Emma","Élise","Camille","Lucie","Chloé","Sarah","Agathe"];

  // Teaching frequencies (DRAFT): the complainant is usually a woman, the alleged
  // assailant usually a man. `gendered` wording and `neutral` wording each appear
  // in half of the cases (owner decision, #76).
  const P_VICTIM_FEMALE = 0.85, P_AUTHOR_MALE = 0.90, P_GENDERED = 0.5;

  function drawParties(rng) {
    return {
      style: frac(rng) < P_GENDERED ? "gendered" : "neutral",
      victimSex: frac(rng) < P_VICTIM_FEMALE ? "F" : "M",
      authorSex: frac(rng) < P_AUTHOR_MALE ? "M" : "F"
    };
  }

  // Phrases that depend on the complainant. EN verbs: add `s` after the subject
  // for "she/he", nothing for "they".
  function victim(p) {
    const g = p.style === "gendered", F = p.victimSex === "F";
    return {
      noun: g ? t(F ? "la plaignante" : "le plaignant", "the complainant") : t("la personne plaignante", "the complainant"),
      of:   g ? t(F ? "de la plaignante" : "du plaignant", "of the complainant") : t("de la personne plaignante", "of the complainant"),
      a:    g ? t(F ? "Une plaignante" : "Un plaignant", "A complainant") : t("Une personne", "A person"),
      Subj: g ? t(F ? "Elle" : "Il", F ? "She" : "He") : t("La personne plaignante", "They"),
      subj: g ? t(F ? "elle" : "il", F ? "she" : "he") : t("la personne plaignante", "they"),
      poss: g ? (F ? "her" : "his") : "their",
      obj: g ? (F ? "her" : "him") : "them",
      s: g ? "s" : "",
      sampled: g ? (F ? "prélevée" : "prélevé") : "prélevée"
    };
  }
  // The alleged assailant (unknown author). French uses the legally careful
  // "auteur présumé"; the feminine form only in gendered wording.
  function author(p) {
    const g = p.style === "gendered", F = p.authorSex === "F";
    return {
      noun: g && F ? t("l'autrice présumée", "the alleged assailant") : t("l'auteur présumé", "the alleged assailant"),
      of:   g && F ? t("de l'autrice présumée", "of the alleged assailant") : t("de l'auteur présumé", "of the alleged assailant")
    };
  }
  // A known person under investigation (reference swab).
  function suspect(p) {
    const g = p.style === "gendered", F = p.authorSex === "F";
    return {
      noun: g ? t(F ? "la mise en cause" : "le mis en cause", "the person under investigation") : t("la personne mise en cause", "the person under investigation"),
      of:   g ? t(F ? "de la mise en cause" : "du mis en cause", "of the person under investigation") : t("de la personne mise en cause", "of the person under investigation")
    };
  }

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // What the complainant reports about ejaculation. `site`: intravaginal,
  // garment, mouth, seat, genital (the genital area, quote simulator).
  function siteText(p, site) {
    const v = victim(p);
    switch (site) {
      case "intravaginal": return t("dans le vagin", "inside the vagina");
      case "intraanal": return t("dans l'anus", "inside the anus");
      case "garment": return t("sur le vêtement porté", "on the garment worn");
      case "mouth": return t("dans sa bouche", "in " + v.poss + " mouth");
      case "seat": return t("sur le siège", "on the seat");
      case "genital": return t("dans la zone génitale", "in the genital area");
      default: throw new Error("Unknown ejaculation site " + site);
    }
  }
  function ejaculation(p, status, site) {
    const v = victim(p);
    if (status === "no") return t(v.Subj.fr + " déclare qu'il n'y a pas eu d'éjaculation.", v.Subj.en + " state" + v.s + " that there was no ejaculation.");
    if (status === "unknown") return t(v.Subj.fr + " ne peut pas dire s'il y a eu une éjaculation.", v.Subj.en + " cannot say whether ejaculation occurred.");
    const x = siteText(p, site);
    return t(v.Subj.fr + " déclare qu'il y a eu une éjaculation " + x.fr + ".", v.Subj.en + " state" + v.s + " that ejaculation occurred " + x.en + ".");
  }
  // Penetration alleged in the cases where one is reported: the act, the swab
  // that follows from it and the ejaculation site depend on the complainant's sex.
  function penetration(p) {
    return p.victimSex === "F"
      ? { act: t("une pénétration vaginale", "vaginal penetration"), swab: t("écouvillon vaginal", "vaginal swab"), site: "intravaginal" }
      : { act: t("une pénétration anale", "anal penetration"), swab: t("écouvillon anal", "anal swab"), site: "intraanal" };
  }
  function examDelay(hours) {
    return t("L'examen médico-légal a eu lieu environ " + hours + " h après les faits allégués.",
             "The forensic medical examination took place about " + hours + " h after the alleged events.");
  }
  // The two cheek swabs a sexual-assault case can hold must never be confused.
  function referenceSwab(p, who) { // who: "complainant" | "suspect"
    const w = who === "suspect" ? suspect(p) : victim(p);
    return {
      label: t("écouvillon buccal de référence " + w.of.fr, "reference cheek swab " + w.of.en),
      provenance: t("prélevé pour comparaison ; échantillon de référence sans lien avec les faits eux-mêmes", "taken for comparison; reference sample unrelated to the events themselves"),
      claimedSource: t("référence " + w.of.fr, "reference sample " + w.of.en)
    };
  }
  function oralEvidenceSwab(p) {
    const v = victim(p), a = author(p);
    return t("écouvillon buccal " + v.of.fr + ", prélevé à la recherche de traces " + a.of.fr,
             "oral swab " + v.of.en + ", taken to look for traces of the alleged assailant");
  }

  function relative(rng, sex) {
    const pool = sex === "F" ? FEMALE_NAMES : MALE_NAMES;
    const surname = rng.pick(SURNAMES);
    const first = rng.pick(pool);
    const title = sex === "F" ? "Mme" : "M.";
    return { sex, first, surname, title, full: title + " " + first + " " + surname };
  }

  root.REQUISITION_SHARED = {
    SURNAMES, MALE_NAMES, FEMALE_NAMES, P_VICTIM_FEMALE, P_AUTHOR_MALE, P_GENDERED,
    drawParties, victim, author, suspect, siteText, penetration, ejaculation, examDelay, referenceSwab, oralEvidenceSwab, relative, cap
  };
})(typeof window !== "undefined" ? window : globalThis);
