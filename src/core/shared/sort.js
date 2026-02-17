(function (global) {
  "use strict";

  // Ordena reservas por fecha/hora de inicio (startISO) ascendente.
  function sortReservationsByStartISO(items) {
    return items
      .slice()
      .sort((a, b) => (a.startISO < b.startISO ? -1 : a.startISO > b.startISO ? 1 : 0));
  }

  const api = { sortReservationsByStartISO };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.shared = root.shared || {};
  root.shared.sort = api;
})(typeof window !== "undefined" ? window : globalThis);
