(function (global) {
  "use strict";

  // Parsea una clave ISO local (YYYY-MM-DDTHH:mm) a Date.
  function localParseISOKey(startISO) {
    const [datePart, timePart] = String(startISO).split("T");
    if (!datePart || !timePart) return new Date(NaN);
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  // Parsea fecha ISO usando modulo compartido si esta disponible.
  function parseISOKey(startISO) {
    const sharedDate = global.VetCore?.shared?.datetime?.parseISOKey;
    if (typeof sharedDate === "function") return sharedDate(startISO);
    return localParseISOKey(startISO);
  }

  // Filtra reservas por tipo, fecha y texto de busqueda.
  function filterReservations(reservations, criteria) {
    const items = Array.isArray(reservations) ? reservations : [];
    const opts = criteria || {};
    const service = opts.service || "all";
    const dateFilter = String(opts.dateFilter || "").trim();
    const query = String(opts.query || "").trim().toLowerCase();
    const now = opts.now instanceof Date ? opts.now : new Date();

    return items.filter((r) => {
      const okService = service === "all" ? true : r.proType === service;
      const start = parseISOKey(r.startISO);
      const startDateKey = Number.isNaN(start.getTime())
        ? ""
        : `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
            start.getDate()
          ).padStart(2, "0")}`;

      let okDate = true;
      if (dateFilter === "future") okDate = start >= now;
      else if (dateFilter === "past") okDate = start < now;
      else if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) okDate = startDateKey === dateFilter;

      if (!query) return okService && okDate;

      const haystack = (
        String(r.ownerName || "") +
        " " +
        String(r.petName || "") +
        " " +
        String(r.petType || "") +
        " " +
        String(r.serviceLabel || "") +
        " " +
        String(r.proName || "") +
        " " +
        String(r.phone || "") +
        " " +
        String(r.email || "")
      ).toLowerCase();

      return okService && okDate && haystack.includes(query);
    });
  }

  // Cuenta reservas totales y por tipo de profesional.
  function countReservationsByType(reservations) {
    const items = Array.isArray(reservations) ? reservations : [];
    return {
      total: items.length,
      vet: items.filter((r) => r.proType === "vet").length,
      groom: items.filter((r) => r.proType === "groom").length,
    };
  }

  const api = { filterReservations, countReservationsByType };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.reservations = root.reservations || {};
  root.reservations.filters = api;
})(typeof window !== "undefined" ? window : globalThis);
