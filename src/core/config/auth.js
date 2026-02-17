(function (global) {
  "use strict";

  const auth = {
    ADMIN_USER: { username: "admin", password: "1234" },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = auth;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.config = root.config || {};
  root.config.auth = auth;
})(typeof window !== "undefined" ? window : globalThis);
