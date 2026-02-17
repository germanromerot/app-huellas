(function (global) {
  "use strict";

  // Agrega cero a la izquierda en números de un dígito.
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // Convierte fecha y hora separadas en un objeto Date.
  function parseDateTime(dateStr, timeStr) {
    const [y, m, d] = String(dateStr).split("-").map(Number);
    const [hh, mm] = String(timeStr).split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  // Convierte una clave ISO local (YYYY-MM-DDTHH:mm) en Date.
  function parseISOKey(startISO) {
    const [datePart, timePart] = String(startISO).split("T");
    if (!datePart || !timePart) return new Date(NaN);

    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  // Convierte un Date en clave ISO local (YYYY-MM-DDTHH:mm).
  function toISOKey(dateObj) {
    return (
      dateObj.getFullYear() +
      "-" +
      pad2(dateObj.getMonth() + 1) +
      "-" +
      pad2(dateObj.getDate()) +
      "T" +
      pad2(dateObj.getHours()) +
      ":" +
      pad2(dateObj.getMinutes())
    );
  }

  // Formatea un Date como DD/MM/YYYY HH:mm.
  function formatNice(dateObj) {
    const d = pad2(dateObj.getDate());
    const m = pad2(dateObj.getMonth() + 1);
    const y = dateObj.getFullYear();
    const hh = pad2(dateObj.getHours());
    const mm = pad2(dateObj.getMinutes());
    return d + "/" + m + "/" + y + " " + hh + ":" + mm;
  }

  // Convierte minutos totales al formato HH:mm.
  function formatHM(totalMin) {
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    return pad2(hh) + ":" + pad2(mm);
  }

  // Obtiene solo la parte de fecha en formato YYYY-MM-DD.
  function getDateOnlyKey(dateObj) {
    return (
      dateObj.getFullYear() +
      "-" +
      pad2(dateObj.getMonth() + 1) +
      "-" +
      pad2(dateObj.getDate())
    );
  }

  const api = {
    pad2,
    parseDateTime,
    parseISOKey,
    toISOKey,
    formatNice,
    formatHM,
    getDateOnlyKey,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.shared = root.shared || {};
  root.shared.datetime = api;
})(typeof window !== "undefined" ? window : globalThis);
