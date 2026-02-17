(function (global) {
  "use strict";

  const constants = {
    LS_KEYS: {
      RESERVATIONS: "vetestetica_reservas_v1",
      SEEDED: "vetestetica_seeded_v1",
      ADMIN_SESSION: "vetestetica_admin_session_v1",
    },
    SCHEDULE: {
      WEEKDAY_OPEN_MIN: 9 * 60,
      WEEKDAY_CLOSE_MIN: 18 * 60,
      SATURDAY_OPEN_MIN: 9 * 60,
      SATURDAY_CLOSE_MIN: 12 * 60 + 30,
    },
    PET_TYPES: ["Perro", "Gato"],
    DEFAULT_SLOT_MIN: 30,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = constants;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.config = root.config || {};
  root.config.constants = constants;
})(typeof window !== "undefined" ? window : globalThis);
