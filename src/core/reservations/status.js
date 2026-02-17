(function (global) {
  "use strict";

  // Normaliza el estado de una reserva cuando falta el campo status.
  function normalizeStatus(reservation) {
    if (!reservation || typeof reservation !== "object") return reservation;
    return { ...reservation, status: reservation.status || "active" };
  }

  // Indica si una reserva esta cancelada.
  function isCancelled(reservation) {
    return (reservation?.status || "active") === "cancelled";
  }

  // Marca una reserva como cancelada segun su id.
  function cancelReservationById(reservations, id, nowTs) {
    const list = Array.isArray(reservations) ? reservations : [];
    const now = Number.isFinite(nowTs) ? nowTs : Date.now();

    return list.map((reservation) => {
      const normalized = normalizeStatus(reservation);
      if (!normalized || normalized.id !== id) return normalized;
      if (isCancelled(normalized)) return normalized;

      return {
        ...normalized,
        status: "cancelled",
        cancelledAt: now,
      };
    });
  }

  const api = { normalizeStatus, isCancelled, cancelReservationById };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.reservations = root.reservations || {};
  root.reservations.status = api;
})(typeof window !== "undefined" ? window : globalThis);
