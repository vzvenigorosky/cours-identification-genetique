/* ============================================================
   Anonymous usage counts (GoatCounter) — issue #102.

   OFF BY DEFAULT: nothing is sent until SITE_CODE below is set to the code of
   a GoatCounter site (https://CODE.goatcounter.com). Set it only after the
   data-protection check described in docs/analytics.md.

   How it works: plain GET "pixel" requests to
     https://CODE.goatcounter.com/count?p=<name>&e=true
   (the documented tracking-pixel / event format). No third-party JavaScript is
   loaded on the students' pages.

   What is sent: the page path (never the query string, so never a case seed)
   and short event names such as "full-case/okQuote". Never any student input,
   answer, seed or free text. Not sent at all: on localhost / file:, when the
   browser asks not to be tracked (Do Not Track), or when SITE_CODE is empty or
   malformed.

   Classic script (browser only). Exposes window.Analytics.
   ============================================================ */
(function (root) {
  "use strict";
  var SITE_CODE = ""; // e.g. "cours-genetique"  →  https://cours-genetique.goatcounter.com

  // A page may pre-set root.ANALYTICS_CODE (used by the self-test and the browser check).
  var code = typeof root.ANALYTICS_CODE === "string" ? root.ANALYTICS_CODE : SITE_CODE;
  var validCode = /^[a-z0-9][a-z0-9-]{0,62}$/.test(code); // a host label only: never lets a value redirect the requests

  function isLocal() {
    var loc = root.location || {};
    return loc.protocol === "file:" || /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(loc.hostname || "");
  }
  function doNotTrack() {
    var nav = root.navigator || {};
    return nav.doNotTrack === "1" || root.doNotTrack === "1" || nav.msDoNotTrack === "1";
  }
  function enabled() { return validCode && !isLocal() && !doNotTrack(); }

  function clean(name) { // short, no leading "/", limited alphabet, case kept for readability
    return String(name).replace(/[^A-Za-z0-9\-_\/.:]+/g, "-").replace(/^\/+/, "").slice(0, 80);
  }
  function send(p, extra) {
    if (!enabled() || !p) return false;
    var url = "https://" + code + ".goatcounter.com/count?p=" + encodeURIComponent(p) + (extra || "") + "&rnd=" + Math.random().toString(36).slice(2, 8);
    var img = new root.Image(1, 1);
    img.src = url;
    return true;
  }

  function event(name) {
    var n = clean(name);
    return n ? send(n, "&e=true") : false;
  }
  function pageview() {
    var path = (root.location && root.location.pathname) || "/";
    var title = (root.document && root.document.title) || "";
    return send(path, "&t=" + encodeURIComponent(title.slice(0, 120)));
  }
  var pageName = function () {
    var m = ((root.location && root.location.pathname) || "").match(/([^\/]+?)(?:\.html)?$/);
    return clean(m ? m[1] : "index");
  };

  // Click hooks that need no change in the exercise pages.
  function onClick(e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var el = t.closest("[data-track]");
    if (el) { event(el.getAttribute("data-track")); return; }
    var btn = t.closest("#newCase, #check");
    if (btn) event((btn.id === "newCase" ? "new-case/" : "check/") + pageName());
  }

  function disclose() { // footer line, only when counting is really on
    var doc = root.document, foot = doc && doc.querySelector && doc.querySelector(".site-footer");
    if (!foot) return;
    var p = doc.createElement("p");
    p.className = "muted-note";
    p.setAttribute("data-fr", "Mesure d’audience anonyme (GoatCounter) : seuls les pages consultées et les boutons d’étape sont comptés, jamais vos réponses.");
    p.setAttribute("data-en", "Anonymous audience measurement (GoatCounter): only pages viewed and step buttons are counted, never your answers.");
    foot.appendChild(p);
    if (root.I18N && root.I18N.apply) root.I18N.apply();
  }

  root.Analytics = { enabled: enabled, event: event, pageview: pageview };

  if (enabled() && root.document) {
    pageview();
    root.document.addEventListener("click", onClick);
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", disclose); else disclose();
  }
})(typeof window !== "undefined" ? window : globalThis);
