(function (global) {
  "use strict";

  const DEFAULT_SCHEDULE = {
    WEEKDAY_OPEN_MIN: 9 * 60,
    WEEKDAY_CLOSE_MIN: 18 * 60,
    SATURDAY_OPEN_MIN: 9 * 60,
    SATURDAY_CLOSE_MIN: 12 * 60 + 30,
  };

  // Devuelve apertura y cierre por dia segun la configuracion.
  function getDayBounds(day, schedule) {
    const cfg = schedule || DEFAULT_SCHEDULE;
    if (day === 0) return null;
    if (day >= 1 && day <= 5) {
      return { open: cfg.WEEKDAY_OPEN_MIN, close: cfg.WEEKDAY_CLOSE_MIN };
    }
    return { open: cfg.SATURDAY_OPEN_MIN, close: cfg.SATURDAY_CLOSE_MIN };
  }

  // Construye slots disponibles para una fecha y duracion dadas.
  function buildSlotsForDate(dateStr, slotDuration, schedule) {
    if (!dateStr) return [];
    const [y, m, d] = String(dateStr).split("-").map(Number);
    const dateObj = new Date(y, m - 1, d, 0, 0, 0, 0);
    const day = dateObj.getDay();
    const bounds = getDayBounds(day, schedule);

    if (!bounds) return [];

    const duration = Number(slotDuration) || 30;
    const slots = [];

    for (let start = bounds.open; start + duration <= bounds.close; start += duration) {
      slots.push({ startMin: start, endMin: start + duration });
    }
    return slots;
  }

  // Obtiene horas ya reservadas para una fecha y profesional opcional.
  function getReservedStartTimesForDate(reservations, dateStr, professionalId) {
    const source = Array.isArray(reservations) ? reservations : [];
    const prefix = String(dateStr || "") + "T";
    const reserved = new Set();

    source.forEach((r) => {
      if (!r || typeof r.startISO !== "string") return;
      if (!r.startISO.startsWith(prefix)) return;
      if (professionalId && r.proId !== professionalId) return;
      if ((r.status || "active") === "cancelled") return;

      const timePart = r.startISO.split("T")[1];
      if (!timePart) return;
      reserved.add(timePart.slice(0, 5));
    });

    return reserved;
  }

  const api = { buildSlotsForDate, getReservedStartTimesForDate, getDayBounds };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.reservations = root.reservations || {};
  root.reservations.slots = api;
})(typeof window !== "undefined" ? window : globalThis);
