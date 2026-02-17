(function (global) {
  "use strict";

  const DEFAULT_KEY = "vetestetica_admin_session_v1";

  // Resuelve el storage a usar, priorizando uno inyectado.
  function resolveStorage(customStorage) {
    if (customStorage) return customStorage;
    if (typeof localStorage !== "undefined") return localStorage;
    return null;
  }

  // Resuelve la clave de almacenamiento para sesion admin.
  function resolveKey(customKey) {
    if (customKey) return customKey;
    return global.VetCore?.config?.constants?.LS_KEYS?.ADMIN_SESSION || DEFAULT_KEY;
  }

  // Indica si existe una sesion admin valida.
  function isLoggedIn(customStorage, customKey) {
    const storage = resolveStorage(customStorage);
    const key = resolveKey(customKey);
    if (!storage) return false;

    try {
      const raw = storage.getItem(key);
      if (!raw) return false;
      const session = JSON.parse(raw);
      return !!session?.ok;
    } catch (_err) {
      return false;
    }
  }

  // Crea o elimina la sesion admin segun el valor recibido.
  function setSession(ok, customStorage, customKey) {
    const storage = resolveStorage(customStorage);
    const key = resolveKey(customKey);
    if (!storage) return;

    if (ok) {
      storage.setItem(key, JSON.stringify({ ok: true, at: Date.now() }));
    } else {
      storage.removeItem(key);
    }
  }

  const api = { isLoggedIn, setSession, resolveStorage };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.storage = root.storage || {};
  root.storage.sessionStore = api;
})(typeof window !== "undefined" ? window : globalThis);
