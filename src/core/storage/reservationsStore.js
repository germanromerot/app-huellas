(function (global) {
  "use strict";

  const DEFAULT_KEY = "vetestetica_reservas_v1";

  // Resuelve el storage a usar, priorizando uno inyectado.
  function resolveStorage(customStorage) {
    if (customStorage) return customStorage;
    if (typeof localStorage !== "undefined") return localStorage;
    return null;
  }

  // Resuelve la clave de almacenamiento para reservas.
  function resolveKey(customKey) {
    if (customKey) return customKey;
    return global.VetCore?.config?.constants?.LS_KEYS?.RESERVATIONS || DEFAULT_KEY;
  }

  // Carga reservas desde storage con manejo seguro de errores.
  function loadReservations(customStorage, customKey) {
    const storage = resolveStorage(customStorage);
    const key = resolveKey(customKey);
    if (!storage) return [];

    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_err) {
      return [];
    }
  }

  // Guarda reservas en storage serializadas como JSON.
  function saveReservations(items, customStorage, customKey) {
    const storage = resolveStorage(customStorage);
    const key = resolveKey(customKey);
    if (!storage) return;
    storage.setItem(key, JSON.stringify(items));
  }

  // Limpia todas las reservas guardando una lista vacia.
  function clearReservations(customStorage, customKey) {
    saveReservations([], customStorage, customKey);
  }

  const api = {
    loadReservations,
    saveReservations,
    clearReservations,
    resolveStorage,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.storage = root.storage || {};
  root.storage.reservationsStore = api;
})(typeof window !== "undefined" ? window : globalThis);
