const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("dmw-csm-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", stored || (prefersDark ? "dark" : "light"));
  } catch (err) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
