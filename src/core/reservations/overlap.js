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

  // Obtiene la duracion efectiva de una reserva.
  function getDurationForReservation(reservation, getDurationByServiceId, defaultDurationMin) {
    if (Number.isFinite(reservation?.durationMin) && reservation.durationMin > 0) {
      return reservation.durationMin;
    }

    if (typeof getDurationByServiceId === "function") {
      const duration = getDurationByServiceId(reservation?.serviceId);
      if (Number.isFinite(duration) && duration > 0) return duration;
    }

    return Number(defaultDurationMin) || 30;
  }

  // Verifica si una reserva candidata se superpone con existentes.
  function hasOverlap(existing, candidate, getDurationByServiceId, defaultDurationMin) {
    if (!candidate || !candidate.proId || !candidate.startISO) return false;
    if ((candidate.status || "active") === "cancelled") return false;

    const list = Array.isArray(existing) ? existing : [];
    const cStart = parseISOKey(candidate.startISO);
    if (Number.isNaN(cStart.getTime())) return false;

    const cDuration = getDurationForReservation(
      candidate,
      getDurationByServiceId,
      defaultDurationMin
    );
    const cStartTs = cStart.getTime();
    const cEndTs = cStartTs + cDuration * 60 * 1000;

    return list.some((reservation) => {
      if (!reservation || reservation.proId !== candidate.proId) return false;
      if ((reservation.status || "active") === "cancelled") return false;

      const start = parseISOKey(reservation.startISO);
      if (Number.isNaN(start.getTime())) return false;

      const duration = getDurationForReservation(
        reservation,
        getDurationByServiceId,
        defaultDurationMin
      );
      const startTs = start.getTime();
      const endTs = startTs + duration * 60 * 1000;

      return startTs < cEndTs && cStartTs < endTs;
    });
  }

  const api = { hasOverlap, getDurationForReservation };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.reservations = root.reservations || {};
  root.reservations.overlap = api;
})(typeof window !== "undefined" ? window : globalThis);
