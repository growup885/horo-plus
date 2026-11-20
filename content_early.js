// Runs at document_start, before the page paints: turn the "Печенька+" style on
// (see cookie-plus.css) if the user selected it on the Achievements page, so the
// original subject pictures never flash. The choice lives in localStorage.
(() => {
  try {
    if (localStorage.getItem('hp-style') === 'cookie-plus') {
      document.documentElement.setAttribute('data-hp-style', 'cookie-plus');
    }
  } catch (e) {
    // localStorage can be unavailable (blocked site data); the style is then simply off
  }
})();
