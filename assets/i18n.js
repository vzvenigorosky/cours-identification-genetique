/* ============================================================
   i18n runtime — persistent FR/EN toggle (localStorage)
   Usage:
     - static text: <span data-i18n="nav.home"></span>
     - inline one-off: <span data-fr="Bonjour" data-en="Hello"></span>
     - rich inline:  <p data-fr-html="…" data-en-html="…"></p>
     - dynamic JS:   I18N.pick({fr:"…", en:"…"})  /  I18N.getLang()
     - re-render on change: document.addEventListener('langchange', fn)
   ============================================================ */
window.I18N = (function () {
  const KEY = "gmi_lang";

  const STRINGS = {
    fr: {
      "brand": "Identification génétique",
      "nav.home": "Accueil",
      "nav.fiches": "Fiches",
      "nav.questions": "Questions de cours",
      "nav.exercices": "Exercices",
      "nav.qcm": "QCM examen",
      "nav.annales": "Annales",
      "footer.line": "Master Éthique — Parcours Médecine légale et criminalistique",
      "footer.contact": "Contact",
      "common.back": "← Retour à l'accueil",
      "common.newcase": "Nouveau cas",
      "common.check": "Valider",
      "common.reveal": "Montrer la réponse",
      "common.hide": "Cacher la réponse",
      "lang.aria": "Changer de langue"
    },
    en: {
      "brand": "Genetic identification",
      "nav.home": "Home",
      "nav.fiches": "Revision sheets",
      "nav.questions": "Course questions",
      "nav.exercices": "Exercises",
      "nav.qcm": "Exam quiz",
      "nav.annales": "Past exams",
      "footer.line": "Master in Ethics — Forensic Medicine & Criminalistics track",
      "footer.contact": "Contact",
      "common.back": "← Back to home",
      "common.newcase": "New case",
      "common.check": "Check",
      "common.reveal": "Show answer",
      "common.hide": "Hide answer",
      "lang.aria": "Switch language"
    }
  };

  function getLang() {
    const l = localStorage.getItem(KEY);
    return l === "en" || l === "fr" ? l : "fr";
  }

  function setLang(l) {
    if (l !== "en" && l !== "fr") return;
    localStorage.setItem(KEY, l);
    apply();
  }

  function t(key) {
    const l = getLang();
    if (STRINGS[l] && STRINGS[l][key] != null) return STRINGS[l][key];
    if (STRINGS.fr[key] != null) return STRINGS.fr[key];
    return key;
  }

  /* Return the current-language value of a {fr, en} object. */
  function pick(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    const l = getLang();
    return obj[l] != null ? obj[l] : (obj.fr != null ? obj.fr : "");
  }

  function apply() {
    const l = getLang();
    document.documentElement.lang = l;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-fr]").forEach((el) => {
      const v = el.getAttribute("data-" + l);
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-fr-html]").forEach((el) => {
      const v = el.getAttribute("data-" + l + "-html");
      if (v != null) el.innerHTML = v;
    });

    document.querySelectorAll(".lang-toggle button").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === l);
    });

    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }

  return { getLang, setLang, t, pick, apply, STRINGS };
})();
