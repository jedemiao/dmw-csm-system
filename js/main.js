/* Shared site chrome behavior: theme toggle, header clock. */
(function () {
  "use strict";

  var THEME_KEY = "dmw-csm-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) toggle.setAttribute("aria-pressed", String(theme === "dark"));
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (err) { /* storage unavailable */ }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(stored || (prefersDark ? "dark" : "light"));

    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* storage unavailable */ }
    });
  }

  function initClock() {
    var el = document.querySelector("[data-live-clock]");
    if (!el) return;
    var formatter = new Intl.DateTimeFormat("en-PH", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Asia/Manila"
    });
    function tick() {
      el.textContent = formatter.format(new Date()) + " GMT+8";
    }
    tick();
    window.setInterval(tick, 1000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initClock();
  });
})();
