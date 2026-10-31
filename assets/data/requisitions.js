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
  var LIENS = ["PERE BIOLOGIQUE", "MERE BIOLOGIQUE", "FRATRIE BIOLOGIQUE (SAUF VRAI JUMEAU)", "DESCENDANT BIOLOGIQUE", "ASCENDANT BIOLOGIQUE"];

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
  function genDisparu() {
    var vd = pick(VILLES);
    var np = rint(1, 3); // parentèle members
    var parents = [];
    for (var i = 0; i < np; i++) {
      var n = fullName();
      parents.push({ lien: pick(LIENS), nomNaissance: n.nom, prenom: n.prenom,
                     dateNaissance: randPastDate(20, 75), lieuNaissance: pick(VILLES)[0], pays: "FRANCE",
                     accord: Math.random() < 0.7, barcode: barcode("42", 12) });
    }
    return {
      type: "disparu",
      cadre: pick(["74-1", "80-4"]),
      juridiction: "TJ " + vd[0] + " (" + vd[1] + ")",
      infractions: "",
      requerant: requerant(vd[0]),
      disparue: etatCivil(),
      disparueBarcode: barcode("42", 12),
      parentele: parents,
      expert: expert(),
      ville: vd[0]
    };
  }

  function generate(type) {
    if (type === "condamne") return genIndividu("condamne");
    if (type === "suspect" || type === "individu") return genIndividu("suspect");
    if (type === "trace") return genTrace();
    if (type === "disparu") return genDisparu();
    return genIndividu("suspect");
  }

  return { generate: generate, today: function () { return dateStr(new Date()); } };
})();
