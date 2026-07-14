/* ============================================================
   Shared header / nav / footer injection.
   Each page sets <body data-page="home|fiches|questions|exercices|qcm|annales">
   and includes i18n.js then layout.js.
   Placeholders (optional): <div id="site-header"></div> ... <div id="site-footer"></div>
   If absent, header is prepended and footer appended to <body>.
   ============================================================ */
(function () {
  var NAV = [
    { page: "home",       href: "index.html",      key: "nav.home" },
    { page: "fiches",     href: "fiches.html",     key: "nav.fiches" },
    { page: "questions",  href: "questions.html",  key: "nav.questions" },
    { page: "exercices",  href: "exercices.html",  key: "nav.exercices" },
    { page: "qcm",        href: "qcm.html",         key: "nav.qcm" },
    { page: "epg",        href: "epg.html",         key: "nav.epg" },
    { page: "annales",    href: "annales.html",    key: "nav.annales" }
  ];

  var current = document.body.getAttribute("data-page") || "";
  var prefix = document.body.getAttribute("data-prefix") || ""; // e.g. "../" for nested pages

  function headerHTML() {
    var links = NAV.map(function (n) {
      var active = n.page === current ? " active" : "";
      return '<a class="' + "" + active + '" href="' + prefix + n.href +
             '" data-i18n="' + n.key + '"></a>';
    }).join("");

    return '' +
      '<header class="site-header"><div class="site-header__inner">' +
        '<a class="brand" href="' + prefix + 'index.html">' +
          '<span class="dot">🧬</span><span data-i18n="brand"></span>' +
        '</a>' +
        '<nav class="site-nav">' + links + '</nav>' +
        '<div class="lang-toggle" role="group" aria-label="' + I18N.t("lang.aria") + '">' +
          '<button type="button" data-lang="fr">FR</button>' +
          '<button type="button" data-lang="en">EN</button>' +
        '</div>' +
      '</div></header>';
  }

  function footerHTML() {
    return '' +
      '<footer class="site-footer">' +
        '<p data-i18n="footer.line"></p>' +
        '<p><span data-i18n="footer.contact"></span> : ' +
          '<a href="mailto:zvenigorosky@unistra.fr">zvenigorosky@unistra.fr</a></p>' +
      '</footer>';
  }

  // Inject header
  var headSlot = document.getElementById("site-header");
  if (headSlot) headSlot.outerHTML = headerHTML();
  else document.body.insertAdjacentHTML("afterbegin", headerHTML());

  // Inject footer
  var footSlot = document.getElementById("site-footer");
  if (footSlot) footSlot.outerHTML = footerHTML();
  else document.body.insertAdjacentHTML("beforeend", footerHTML());

  // Wire language toggle
  document.querySelectorAll(".lang-toggle button").forEach(function (b) {
    b.addEventListener("click", function () { I18N.setLang(b.dataset.lang); });
  });

  // Apply translations to freshly injected chrome
  I18N.apply();
})();
