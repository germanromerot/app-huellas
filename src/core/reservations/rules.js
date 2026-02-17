(function (global) {
  "use strict";

  const DEFAULT_SCHEDULE = {
    WEEKDAY_OPEN_MIN: 9 * 60,
    WEEKDAY_CLOSE_MIN: 18 * 60,
    SATURDAY_OPEN_MIN: 9 * 60,
    SATURDAY_CLOSE_MIN: 12 * 60 + 30,
  };

  const DEFAULT_PET_TYPES = ["Perro", "Gato"];
  const DEFAULT_SLOT_MIN = 30;

  // Valida si un turno cae dentro del horario de atencion.
  function isOpenHours(dateObj, durationMin, schedule) {
    const slotMin = Number(durationMin) || DEFAULT_SLOT_MIN;
    const cfg = schedule || DEFAULT_SCHEDULE;
    const day = dateObj.getDay();
    const startMin = dateObj.getHours() * 60 + dateObj.getMinutes();
    const endMin = startMin + slotMin;

    if (day === 0) return false;
    if (day >= 1 && day <= 5) {
      return startMin >= cfg.WEEKDAY_OPEN_MIN && endMin <= cfg.WEEKDAY_CLOSE_MIN;
    }
    return startMin >= cfg.SATURDAY_OPEN_MIN && endMin <= cfg.SATURDAY_CLOSE_MIN;
  }

  // Valida que la hora este en una marca de 00 o 30 minutos.
  function isHalfHourStep(timeStr) {
    const mm = Number(String(timeStr).split(":")[1] || 0);
    return mm === 0 || mm === 30;
  }

  // Valida si el tipo de mascota esta permitido.
  function isPetTypeAllowed(petType, petTypes) {
    const allowed = petTypes || DEFAULT_PET_TYPES;
    return allowed.includes(String(petType || "").trim());
  }

  // Verifica que los campos obligatorios de una reserva esten completos.
  function hasRequiredBookingFields(fields) {
    const required = [
      "ownerName",
      "petName",
      "petType",
      "serviceId",
      "proId",
      "dateStr",
      "timeStr",
      "phone",
    ];
    return required.every((key) => String(fields[key] || "").trim().length > 0);
  }

  // Verifica si la fecha es futura respecto al momento actual.
  function isFutureDate(dateObj, nowTs) {
    const now = Number.isFinite(nowTs) ? nowTs : Date.now();
    return dateObj.getTime() >= now - 60 * 1000;
  }

  // Verifica que el profesional sea compatible con el servicio.
  function doesProfessionalMatchService(professional, service) {
    if (!professional || !service) return false;
    return professional.type === service.proType;
  }

  const api = {
    isOpenHours,
    isHalfHourStep,
    isPetTypeAllowed,
    hasRequiredBookingFields,
    isFutureDate,
    doesProfessionalMatchService,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.reservations = root.reservations || {};
  root.reservations.rules = api;
})(typeof window !== "undefined" ? window : globalThis);
