(function (global) {
  "use strict";

  // Escapa caracteres HTML para prevenir inyección de html.
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const api = { escapeHtml };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.shared = root.shared || {};
  root.shared.text = api;
})(typeof window !== "undefined" ? window : globalThis);
