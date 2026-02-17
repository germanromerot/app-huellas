(function (global) {
  "use strict";

  // Genera un id unico para una reserva.
  function defaultIdGenerator() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }

  // Convierte una fecha a clave ISO local reutilizando modulo compartido si existe.
  function defaultToISOKey(dateObj) {
    const sharedToISO = global.VetCore?.shared?.datetime?.toISOKey;
    if (typeof sharedToISO === "function") return sharedToISO(dateObj);

    // Formatea partes numericas a dos digitos.
    const pad2 = (n) => String(n).padStart(2, "0");
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

  // Crea un objeto de reserva normalizado a partir de datos de entrada.
  function createReservation(input, options) {
    const cfg = options || {};
    const nowTs = Number.isFinite(cfg.nowTs) ? cfg.nowTs : Date.now();
    const idGenerator = typeof cfg.idGenerator === "function" ? cfg.idGenerator : defaultIdGenerator;
    const toISOKey = typeof cfg.toISOKey === "function" ? cfg.toISOKey : defaultToISOKey;

    return {
      id: idGenerator(),
      ownerName: input.ownerName,
      petName: input.petName,
      petType: input.petType,
      serviceId: input.service.id,
      serviceLabel: input.service.label,
      proType: input.service.proType,
      proId: input.professional.id,
      proName: input.professional.name,
      phone: input.phone,
      email: input.email || "",
      startISO: toISOKey(input.startDate),
      createdAt: nowTs,
      status: "active",
    };
  }

  const api = { createReservation };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.reservations = root.reservations || {};
  root.reservations.factory = api;
})(typeof window !== "undefined" ? window : globalThis);
