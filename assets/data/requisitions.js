/* ============================================================
   Générateur de réquisitions FNAEG — données fictives.

   Produit des jeux de données aléatoires et PLAUSIBLES pour quatre
   formulaires de réquisition d'analyse génétique :
     - individu        : personne identifiée (suspect / condamné)
     - trace           : trace(s) / personne décédée non identifiée
     - disparu         : personne disparue et parentèle

   TOUTES les valeurs sont fictives (noms, services, numéros de
   scellés, juridictions). Les documents générés portent la mention
   « document fictif — exercice pédagogique » et n'ont aucune valeur
   légale. Aucune donnée ne désigne une personne ou un service réels.

   La mise en page PDF est assurée par requisitions.html (jsPDF).
   ============================================================ */
window.REQUISITIONS = (function () {
  function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function pad(n, w) { return String(n).padStart(w, "0"); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // Fictional but plausible pools --------------------------------------------
  var NOMS = ["MARTIN", "BERNARD", "DUBOIS", "PETIT", "DURAND", "LEROY", "MOREAU", "SIMON", "LAURENT", "GARNIER",
              "FAURE", "ROUSSEAU", "BLANC", "GUERIN", "MULLER", "HENRY", "ROUX", "VINCENT", "FOURNIER", "MOREL"];
  var PRENOMS_M = ["JEAN", "PIERRE", "MICHEL", "ANDRE", "PHILIPPE", "LUC", "PAUL", "MARC", "ALAIN", "DAVID", "NICOLAS", "THOMAS"];
  var PRENOMS_F = ["MARIE", "NATHALIE", "ISABELLE", "SYLVIE", "CATHERINE", "ANNE", "JULIE", "CLAIRE", "SOPHIE", "CAMILLE", "LEA", "CHLOE"];
  var VILLES = [["LYON", "069"], ["MARSEILLE", "013"], ["LILLE", "059"], ["BORDEAUX", "033"], ["TOULOUSE", "031"],
                ["NANTES", "044"], ["STRASBOURG", "067"], ["RENNES", "035"], ["MONTPELLIER", "034"], ["DIJON", "021"],
                ["GRENOBLE", "038"], ["ANGERS", "049"], ["NIMES", "030"], ["BREST", "029"], ["LE MANS", "072"]];
  var DEPTS = { "069": "RHONE", "013": "BOUCHES-DU-RHONE", "059": "NORD", "033": "GIRONDE", "031": "HAUTE-GARONNE",
                "044": "LOIRE-ATLANTIQUE", "067": "BAS-RHIN", "035": "ILLE-ET-VILAINE", "034": "HERAULT", "021": "COTE-D'OR",
                "038": "ISERE", "049": "MAINE-ET-LOIRE", "030": "GARD", "029": "FINISTERE", "072": "SARTHE" };
  // Fictional unit names (not real services).
  var SERVICES = ["BR FICTIVE DE %V", "UNITE PEDAGOGIQUE %V", "SR DEMO %V", "GROUPE D'INSTRUCTION %V", "ANTENNE FICTIVE %V"];
  var GRADES = ["OFFICIER DE POLICE JUDICIAIRE", "AGENT DE POLICE JUDICIAIRE"];
  // 706-55 CPP offence references (public legal article numbers).
  var INFRACTIONS = ["311-4", "311-8", "222-13", "222-11", "222-10", "221-1", "227-25", "322-6", "312-1", "224-1"];
  var EXPERTS = ["KEYSER CHRISTINE", "LEGRAND MARTIN", "ADAM SOPHIE", "RENARD JULIEN", "NOEL CAROLINE", "ROBIN PASCAL"];
  var SCELLE_LABELS = ["UN/PTS", "DEUX/PTS", "A/SRPJ", "B/SRPJ", "ECOUV-01", "ECOUV-02", "PV-1", "TRACE-A", "TRACE-B"];
  var TRACE_TYPES = ["Trace biologique sur objet", "Prélèvement sur cadavre", "Écouvillonnage de surface", "Mégot de cigarette", "Tache de sang séché", "Vêtement taché"];

  function sex() { return Math.random() < 0.5 ? "M" : "F"; }
  function prenom(s) { return s === "M" ? pick(PRENOMS_M) : pick(PRENOMS_F); }
  function fullName() { var s = sex(); return { nom: pick(NOMS), prenom: prenom(s), sexe: s }; }
  function service(v) { return pick(SERVICES).replace("%V", v); }
  function procedure() { return rint(50, 3999) + "/2026"; }
  function dateStr(d) { return pad(d.getDate(), 2) + "/" + pad(d.getMonth() + 1, 2) + "/" + d.getFullYear(); }
  function randPastDate(minY, maxY) {
    var now = new Date();
    var y = rint(now.getFullYear() - maxY, now.getFullYear() - minY);
    return dateStr(new Date(y, rint(0, 11), rint(1, 28)));
  }
  function infractions() { return shuffle(INFRACTIONS).slice(0, rint(1, 3)).join(", "); }
  function expert() { return pick(EXPERTS); }
  function barcode(prefix, len) { // 12-digit, given numeric prefix
    var s = String(prefix);
    while (s.length < (len || 12)) s += rint(0, 9);
    return s.slice(0, len || 12);
  }
  function requerant(v) {
    var n = fullName();
    return { nom: n.nom, prenom: n.prenom, grade: pick(GRADES), procedure: procedure(), service: service(v) };
  }
  function etatCivil() {
    var n = fullName();
    var vd = pick(VILLES);
    return {
      nomNaissance: n.nom, prenoms: n.prenom, sexe: n.sexe,
      dateNaissance: randPastDate(18, 70),
      lieuNaissance: vd[0], departement: DEPTS[vd[1]] || "", pays: "FRANCE",
      pere: "INCONNU INCONNU", mere: "INCONNU INCONNU"
    };
  }

  // ---- generators per form -------------------------------------------------
  function genIndividu(kind) { // kind: "suspect" | "condamne"
    var vd = pick(VILLES);
    var isCondamne = kind === "condamne";
    return {
      type: "individu", kind: kind,
      juridiction: "TJ " + vd[0] + " (" + vd[1] + ")",
      cadre: isCondamne ? "condamne" : pick(["suspect2", "suspect3"]),
      dateCondamnation: isCondamne ? randPastDate(0, 3) : "",
      parquet: isCondamne ? "Parquet de " + vd[0] : "",
      infractions: infractions(),
      dateFaits: randPastDate(0, 2),
      requerant: requerant(vd[0]),
      etatCivil: etatCivil(),
      prelevement: barcode(isCondamne ? "41" : pick(["05", "06", "07"]), 12),
      expert: expert(),
      ville: vd[0]
    };
  }
  function genTrace() {
    var vd = pick(VILLES);
    var n = rint(1, 4);
    var usedLabels = shuffle(SCELLE_LABELS).slice(0, n);
    var scelles = [];
    for (var i = 0; i < n; i++) scelles.push({ num: usedLabels[i], type: pick(TRACE_TYPES), barcode: barcode("40", 12) });
    return {
      type: "trace",
      cadre: shuffle(["60", "77-1", "74", "74-1", "80-4", "151"]).slice(0, rint(1, 2)),
      autorite: Math.random() < 0.5 ? { kind: "procureur", ville: "TJ " + vd[0] + " (" + vd[1] + ")" }
                                    : { kind: "juge", ville: "CA " + vd[0] + " (" + vd[1] + ")", date: randPastDate(0, 1) },
      alinea: pick(["1", "4"]),
      infractions: infractions(),
      requerant: requerant(vd[0]),
      scelles: scelles,
      expert: expert(),
      ville: vd[0]
    };
  }
  // Build a small, internally consistent reported pedigree rather than drawing
  // each relative's name, age and relationship independently. All ages are
  // plausible for a biological relationship, but the relationships are still
  // *reported*, not genetically established.
  function datedPerson(nom, sexe, birthYear, used) {
    var names = sexe === "M" ? PRENOMS_M : PRENOMS_F;
    var available = names.filter(function (p) { return !used.has(p + " " + nom); });
    // Our small example pedigrees cannot exhaust these name pools.
    if (!available.length) throw new Error("No distinct names available for the generated pedigree");
    var chosen = pick(available);
    used.add(chosen + " " + nom);
    return { nomNaissance: nom, prenom: chosen, sexe: sexe,
             dateNaissance: dateStr(new Date(birthYear, rint(0, 11), rint(1, 28))),
             lieuNaissance: pick(VILLES)[0], pays: "FRANCE" };
  }
  function differentSurname(avoid) {
    var name;
    do { name = pick(NOMS); } while (name === avoid);
    return name;
  }
  function genDisparu() {
    var vd = pick(VILLES), currentYear = new Date().getFullYear();
    // All candidates are adults; parents remain in a realistic living age range.
    var age = rint(32, 55), candidateYear = currentYear - age;
    var fatherSurname = pick(NOMS), motherSurname = differentSurname(fatherSurname);
    var used = new Set();
    var father = datedPerson(fatherSurname, "M", candidateYear - rint(24, 37), used);
    var mother = datedPerson(motherSurname, "F", candidateYear - rint(22, 35), used);
    var candidate = datedPerson(fatherSurname, sex(), candidateYear, used);
    candidate.lieuNaissance = vd[0];
    candidate.departement = DEPTS[vd[1]] || "";
    candidate.pere = father.prenom + " " + father.nomNaissance;
    candidate.mere = mother.prenom + " " + mother.nomNaissance;
    var siblingOffset = pick([-9, -7, -5, -3, -1, 1, 3, 5, 7, 9]);
    var sibling = datedPerson(fatherSurname, sex(), candidateYear + siblingOffset, used);
    // A reported biological child is included only if old enough to supply an
    // adult reference sample without an impossible age-at-parenthood.
    var choices = [
      { relationId: "father", lien: "PÈRE BIOLOGIQUE PRÉSUMÉ", person: father },
      { relationId: "mother", lien: "MÈRE BIOLOGIQUE PRÉSUMÉE", person: mother },
      { relationId: "sibling", lien: sibling.sexe === "M" ? "FRÈRE GERMAIN PRÉSUMÉ" : "SŒUR GERMAINE PRÉSUMÉE", person: sibling }
    ];
    if (age >= 39) {
      var childYear = candidateYear + rint(21, age - 18);
      var child = datedPerson(fatherSurname, sex(), childYear, used);
      choices.push({ relationId: "child",
        lien: child.sexe === "M" ? "FILS BIOLOGIQUE PRÉSUMÉ" : "FILLE BIOLOGIQUE PRÉSUMÉE", person: child });
    }
    // No duplicate parents/relations, and every named individual is unique.
    var selected = shuffle(choices).slice(0, rint(1, Math.min(3, choices.length)));
    var parents = selected.map(function (entry) {
      var p = entry.person;
      return { relationId: entry.relationId, lien: entry.lien,
               nomNaissance: p.nomNaissance, prenom: p.prenom, sexe: p.sexe,
               dateNaissance: p.dateNaissance, lieuNaissance: p.lieuNaissance,
               pays: p.pays, accord: true, barcode: barcode("42", 12) };
    });
    return {
      type: "disparu",
      cadre: pick(["74-1", "80-4"]),
      juridiction: "TJ " + vd[0] + " (" + vd[1] + ")",
      infractions: "",
      requerant: requerant(vd[0]),
      disparue: candidate,
      // A claimed personal effect, not a biological sample taken from a missing person.
      disparueSource: pick(["Brosse à dents attribuée à la personne disparue",
                           "Rasoir présenté comme ayant appartenu à la personne disparue",
                           "Peigne attribué à la personne disparue"]),
      disparueBarcode: barcode("42", 12),
      parentele: parents,
      expert: expert(),
      ville: vd[0]
    };
  }

  // ---- quality degradation (issue #49) ------------------------------------
  // A réquisition can be generated "vague" (a decisive fact is left unstated,
  // mapped to the devis-simulator archetypes, #32) and/or "mal rédigée" (text
  // defects). What was degraded is recorded in data.degraded so a future
  // exercise can grade against it. All values stay fictional; the watermark and
  // footer live in the render layer and are untouched. DRAFT teaching content.
  function stripAccents(str) { str = String(str); return str.normalize ? str.normalize("NFD").replace(/[̀-ͯ]/g, "") : str; }
  function swapTypo(str) {
    str = String(str); if (str.length < 4) return str;
    var i = 1 + Math.floor(Math.random() * (str.length - 2));
    return str.slice(0, i) + str.charAt(i + 1) + str.charAt(i) + str.slice(i + 2);
  }
  function abbrevGrade(g) { g = String(g); if (/OFFICIER/.test(g)) return "OPJ"; if (/AGENT/.test(g)) return "APJ"; return g; }

  // Drop one decisive fact, chosen by type (mirrors the devis clarity archetypes).
  // Each entry carries a bilingual `note` and the hidden `was` value, so the
  // generator's corrigé (#56) can explain and reveal what was dropped.
  function vaguify(data) {
    var log = [];
    if (data.type === "trace") {
      var wasTypes = data.scelles.map(function (sc) { return sc.type; }).join(", ");
      data.scelles.forEach(function (sc) { sc.type = "Nature à déterminer"; });
      log.push({ field: "scelles[].type", kind: "vague", archetype: "trace-nature-unstated", was: wasTypes,
                 note: { fr: "La nature des traces n'est pas précisée — demander au requérant quels prélèvements analyser.",
                         en: "The nature of the traces is not stated — ask the requester which samples to analyse." } });
    } else if (data.type === "disparu") {
      if (data.parentele && data.parentele.length) {
        var idx = Math.floor(Math.random() * data.parentele.length);
        var wasLien = data.parentele[idx].lien;
        data.parentele[idx].lien = "LIEN NON PRÉCISÉ";
        // Do not disclose the hidden parent relationship through the
        // missing person's filiation in the same PDF.
        if (data.parentele[idx].relationId === "father") data.disparue.pere = "NON PRÉCISÉ";
        if (data.parentele[idx].relationId === "mother") data.disparue.mere = "NON PRÉCISÉ";
        log.push({ field: "parentele[" + idx + "].lien", kind: "vague", archetype: "relationship-unstated", was: wasLien,
                   note: { fr: "Le lien de parenté d'un membre n'est pas indiqué — il détermine l'analyse (autosomique / Y-STR / mtADN).",
                           en: "A relative's kinship link is not stated — it determines the analysis (autosomal / Y-STR / mtDNA)." } });
      }
    } else { // individu
      var wasInf = data.infractions;
      data.infractions = "";
      log.push({ field: "infractions", kind: "vague", archetype: "offence-unstated", was: wasInf,
                 note: { fr: "L'infraction 706-55 n'est pas précisée.", en: "The 706-55 offence is not stated." } });
    }
    return log;
  }

  // Inject realistic wording defects into free-text fields (not the barcodes).
  function sloppify(data) {
    var log = [];
    var r = data.requerant;
    if (r) {
      r.grade = abbrevGrade(r.grade);
      log.push({ field: "requerant.grade", kind: "sloppy", note: { fr: "Grade abrégé (OPJ/APJ).", en: "Grade abbreviated (OPJ/APJ)." } });
      r.service = stripAccents(r.service).toLowerCase();
      log.push({ field: "requerant.service", kind: "sloppy", note: { fr: "Casse et accents négligés.", en: "Case and accents neglected." } });
    }
    if (data.expert) {
      data.expert = swapTypo(data.expert);
      log.push({ field: "expert", kind: "sloppy", note: { fr: "Coquille (lettres inversées).", en: "Typo (transposed letters)." } });
    }
    if (data.scelles) {
      data.scelles.forEach(function (sc) { if (sc.type) sc.type = stripAccents(sc.type).toLowerCase(); });
      log.push({ field: "scelles[].type", kind: "sloppy", note: { fr: "Casse et accents négligés.", en: "Case and accents neglected." } });
    }
    return log;
  }

  function generate(type, opts) {
    opts = opts || {};
    var data;
    if (type === "condamne") data = genIndividu("condamne");
    else if (type === "trace") data = genTrace();
    else if (type === "disparu") data = genDisparu();
    else data = genIndividu("suspect");
    var degraded = [];
    if (opts.vague) degraded = degraded.concat(vaguify(data));
    if (opts.sloppy) degraded = degraded.concat(sloppify(data));
    data.quality = { vague: !!opts.vague, sloppy: !!opts.sloppy };
    data.degraded = degraded;
    return data;
  }

  return { generate: generate, today: function () { return dateStr(new Date()); } };
})();
