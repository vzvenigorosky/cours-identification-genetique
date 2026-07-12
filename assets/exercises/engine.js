/* ============================================================
   Shared engine for the procedurally-generated exercises.
   Domain generators (STR profiles, drop-out, mixtures, allele
   frequencies) + small UI helpers, reused across exercises.
   Depends on i18n.js (I18N).
   ============================================================ */
window.Engine = (function () {

  // Standard autosomal STR loci with plausible allele ranges.
  var LOCI = [
    { name: "D3S1358", min: 12, max: 19 },
    { name: "vWA",     min: 11, max: 21 },
    { name: "D16S539", min: 8,  max: 15 },
    { name: "CSF1PO",  min: 7,  max: 15 },
    { name: "TPOX",    min: 6,  max: 13 },
    { name: "D8S1179", min: 8,  max: 19 },
    { name: "FGA",     min: 18, max: 30 }
  ];

  function rint(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // A full diploid profile: { locusName: [a1, a2] (sorted) }
  function generateProfile(loci) {
    loci = loci || LOCI;
    var p = {};
    loci.forEach(function (l) {
      var a1 = rint(l.min, l.max), a2 = rint(l.min, l.max);
      p[l.name] = [a1, a2].sort(function (x, y) { return x - y; });
    });
    return p;
  }

  // A child profile: one allele from each parent at each locus.
  function generateOffspring(p1, p2, loci) {
    loci = loci || LOCI;
    var c = {};
    loci.forEach(function (l) {
      var a = p1[l.name][rint(0, 1)];
      var b = p2[l.name][rint(0, 1)];
      c[l.name] = [a, b].sort(function (x, y) { return x - y; });
    });
    return c;
  }

  // Simulate a degraded replicate with allele drop-out.
  // baseRisk: base drop-out probability; sizePenalty: extra risk per repeat unit.
  function degradeReplicate(profile, baseRisk, sizePenalty, loci) {
    loci = loci || LOCI;
    var rep = {};
    loci.forEach(function (l) {
      if (Math.random() < baseRisk * 0.5) { rep[l.name] = []; return; } // full locus drop-out
      var seen = [];
      profile[l.name].forEach(function (a) {
        var risk = baseRisk + a * sizePenalty;
        if (l.name === "FGA") risk += 0.10; // large locus, more fragile
        if (Math.random() > risk) seen.push(a);
      });
      rep[l.name] = uniqueSorted(seen);
    });
    return rep;
  }

  // Mixture of contributors: union of alleles, each with a drop-out chance.
  function mixReplicate(profiles, dropout, loci) {
    loci = loci || LOCI;
    var rep = {};
    loci.forEach(function (l) {
      var seen = [];
      profiles.forEach(function (p) {
        p[l.name].forEach(function (a) { if (Math.random() > dropout) seen.push(a); });
      });
      rep[l.name] = uniqueSorted(seen);
    });
    return rep;
  }

  function uniqueSorted(arr) {
    return Array.from(new Set(arr)).sort(function (a, b) { return a - b; });
  }

  // Assign a plausible frequency (0.04–0.34) to an allele, deterministic-ish per value.
  function alleleFreq() { return Math.round((0.04 + Math.random() * 0.30) * 100) / 100; }

  // ---- UI helpers ----

  // Standard feedback panel writer. kind: "success" | "warn" | "fail".
  function feedback(el, kind, htmlFr, htmlEn) {
    el._fr = htmlFr; el._en = htmlEn; el._kind = kind;
    el.className = "feedback show " + kind;
    el.innerHTML = I18N.getLang() === "en" ? htmlEn : htmlFr;
  }
  function refreshFeedback(el) {
    if (el && el._kind) el.innerHTML = I18N.getLang() === "en" ? el._en : el._fr;
  }
  function hideFeedback(el) { if (el) { el.className = "feedback"; el._kind = null; } }

  function fmtProfile(profile, loci) {
    loci = loci || LOCI;
    return loci.map(function (l) {
      return '<span style="display:inline-block;min-width:120px;padding:4px 6px;margin:2px;border-bottom:1px solid #eee">' +
             '<strong>' + l.name + '</strong><br>' + profile[l.name].join(", ") + '</span>';
    }).join(" ");
  }

  return {
    LOCI: LOCI, rint: rint, shuffle: shuffle,
    generateProfile: generateProfile, generateOffspring: generateOffspring,
    degradeReplicate: degradeReplicate, mixReplicate: mixReplicate,
    uniqueSorted: uniqueSorted, alleleFreq: alleleFreq,
    feedback: feedback, refreshFeedback: refreshFeedback, hideFeedback: hideFeedback,
    fmtProfile: fmtProfile
  };
})();
