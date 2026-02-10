/* ==========================================================================
  admin.js — Panel Administrador (Vet & Estética)
  - Login (credenciales en JS)
  - Sesión en localStorage
  - Lista de reservas (ordenadas por fecha y hora)
  - Eliminar 1 por 1
  - Filtro por tipo (vet / groom) y búsqueda por texto
  - Botones: cargar ejemplos (si vacío) y borrar todo
========================================================================== */
(() => {
  "use strict";

  /* -----------------------------
    Storage keys (deben coincidir con index.js)
  ----------------------------- */
  const LS_KEY = "vetestetica_reservas_v1";
  const LS_SEEDED_KEY = "vetestetica_seeded_v1";
  const LS_ADMIN_SESSION = "vetestetica_admin_session_v1";

  /* -----------------------------
    Admin credentials (deben coincidir con index.js)
  ----------------------------- */
  const ADMIN_USER = { username: "admin", password: "1234" };

  /* -----------------------------
    Datos necesarios para seed (igual que index.js)
    *En admin solo los usamos si apretás "Cargar ejemplos"
  ----------------------------- */
  const SERVICES = [
    { id: "vet_consulta", label: "Consulta veterinaria", proType: "vet", price: 500 },
    { id: "groom_full", label: "Estética completa (lavado, secado, corte, uñas)", proType: "groom", price: 1800 },
  ];

  const PROFESSIONALS = [
    { id: "vet-1", type: "vet", name: "Dra. Lucía Pereira", specialty: "Veterinaria" },
    { id: "vet-2", type: "vet", name: "Dr. Martín Suárez", specialty: "Veterinario" },
    { id: "vet-3", type: "vet", name: "Dra. Sofía Méndez", specialty: "Veterinaria" },
    { id: "groom-1", type: "groom", name: "Valentina Rocha", specialty: "Estilista" },
    { id: "groom-2", type: "groom", name: "Camila Fernández", specialty: "Estilista" },
    { id: "groom-3", type: "groom", name: "Agustina Silva", specialty: "Estilista" },
  ];

  /* -----------------------------
    DOM helpers
  ----------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* -----------------------------
    DOM refs (de admin.html)
  ----------------------------- */
  const loginSection = $("#loginSection");
  const panelSection = $("#panelSection");

  const loginForm = $("#adminLoginForm");
  const loginMsg = $("#loginMsg");

  const logoutBtn = $("#logoutBtn");
  const seedBtn = $("#seedBtn");
  const clearBtn = $("#clearBtn");

  const listEl = $("#reservationsList");
  const emptyState = $("#emptyState");

  const serviceFilter = $("#serviceFilter");
  const dateFilter = $("#dateFilter");

  const searchInput = $("#searchInput");

  const countTotal = $("#countTotal");
  const countVet = $("#countVet");
  const countGroom = $("#countGroom");

  /* -----------------------------
    Utils
  ----------------------------- */

  const pad2 = (n) => String(n).padStart(2, "0");

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseISOKey(startISO) {
    // "YYYY-MM-DDTHH:MM" -> Date
    // Safari-safe parse:
    const [datePart, timePart] = String(startISO).split("T");
    if (!datePart || !timePart) return new Date(NaN);
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  function formatNice(dateObj) {
    const d = pad2(dateObj.getDate());
    const m = pad2(dateObj.getMonth() + 1);
    const y = dateObj.getFullYear();
    const hh = pad2(dateObj.getHours());
    const mm = pad2(dateObj.getMinutes());
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }

  function loadReservations() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveReservations(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  function sortReservations(items) {
    return items
      .slice()
      .sort((a, b) => (a.startISO < b.startISO ? -1 : a.startISO > b.startISO ? 1 : 0));
  }

  function isLoggedIn() {
    try {
      const raw = localStorage.getItem(LS_ADMIN_SESSION);
      if (!raw) return false;
      const s = JSON.parse(raw);
      return !!s?.ok;
    } catch {
      return false;
    }
  }

  function setSession(ok) {
    if (ok) {
      localStorage.setItem(LS_ADMIN_SESSION, JSON.stringify({ ok: true, at: Date.now() }));
    } else {
      localStorage.removeItem(LS_ADMIN_SESSION);
    }
  }

  function showLogin() {
    if (loginSection) loginSection.classList.remove("is-hidden");
    if (panelSection) panelSection.classList.add("is-hidden");
  }

  function showPanel() {
    if (loginSection) loginSection.classList.add("is-hidden");
    if (panelSection) panelSection.classList.remove("is-hidden");
  }

  function setLoginMsg(msg) {
    if (!loginMsg) return;
    loginMsg.textContent = msg || "";
  }

  /* -----------------------------
    Seed de reservas (solo si hace falta)
  ----------------------------- */

  function ensureSeedData() {
    if (localStorage.getItem(LS_SEEDED_KEY) === "1") return;

    const today = new Date();
    const plusDays = (n) => {
      const x = new Date(today);
      x.setDate(x.getDate() + n);
      return x;
    };
    const nextBusinessDay = (offset) => {
      const d = plusDays(offset);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      return d;
    };

    const d1 = nextBusinessDay(1);
    const d2 = nextBusinessDay(2);
    const d3 = nextBusinessDay(3);

    const toISOKey = (dateObj) =>
      `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}T${pad2(
        dateObj.getHours()
      )}:${pad2(dateObj.getMinutes())}`;

    const examples = [
      {
        id: crypto.randomUUID?.() || String(Date.now()) + "-1",
        ownerName: "Ana López",
        petName: "Milo",
        petType: "Perro",
        serviceId: "groom_full",
        serviceLabel: SERVICES.find((s) => s.id === "groom_full").label,
        proType: "groom",
        proId: "groom-1",
        proName: PROFESSIONALS.find((p) => p.id === "groom-1").name,
        phone: "099 111 222",
        email: "ana@mail.com",
        startISO: toISOKey(new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 10, 0)),
        createdAt: Date.now(),
      },
      {
        id: crypto.randomUUID?.() || String(Date.now()) + "-2",
        ownerName: "Bruno Pérez",
        petName: "Luna",
        petType: "Gato",
        serviceId: "vet_consulta",
        serviceLabel: SERVICES.find((s) => s.id === "vet_consulta").label,
        proType: "vet",
        proId: "vet-2",
        proName: PROFESSIONALS.find((p) => p.id === "vet-2").name,
        phone: "098 333 444",
        email: "",
        startISO: toISOKey(new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 11, 30)),
        createdAt: Date.now(),
      },
      {
        id: crypto.randomUUID?.() || String(Date.now()) + "-3",
        ownerName: "Carla Gómez",
        petName: "Toby",
        petType: "Perro",
        serviceId: "vet_consulta",
        serviceLabel: SERVICES.find((s) => s.id === "vet_consulta").label,
        proType: "vet",
        proId: "vet-1",
        proName: PROFESSIONALS.find((p) => p.id === "vet-1").name,
        phone: "097 222 555",
        email: "carla@mail.com",
        startISO: toISOKey(new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 9, 0)),
        createdAt: Date.now(),
      },
      {
        id: crypto.randomUUID?.() || String(Date.now()) + "-4",
        ownerName: "Diego Silva",
        petName: "Nina",
        petType: "Gato",
        serviceId: "groom_full",
        serviceLabel: SERVICES.find((s) => s.id === "groom_full").label,
        proType: "groom",
        proId: "groom-2",
        proName: PROFESSIONALS.find((p) => p.id === "groom-2").name,
        phone: "096 555 666",
        email: "",
        startISO: toISOKey(new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 15, 0)),
        createdAt: Date.now(),
      },
      {
        id: crypto.randomUUID?.() || String(Date.now()) + "-5",
        ownerName: "Elena Rodríguez",
        petName: "Simba",
        petType: "Perro",
        serviceId: "groom_full",
        serviceLabel: SERVICES.find((s) => s.id === "groom_full").label,
        proType: "groom",
        proId: "groom-3",
        proName: PROFESSIONALS.find((p) => p.id === "groom-3").name,
        phone: "091 000 999",
        email: "elena@mail.com",
        startISO: toISOKey(new Date(d3.getFullYear(), d3.getMonth(), d3.getDate(), 12, 0)),
        createdAt: Date.now(),
      },
      {
        id: crypto.randomUUID?.() || String(Date.now()) + "-6",
        ownerName: "Federico Núñez",
        petName: "Kira",
        petType: "Gato",
        serviceId: "vet_consulta",
        serviceLabel: SERVICES.find((s) => s.id === "vet_consulta").label,
        proType: "vet",
        proId: "vet-3",
        proName: PROFESSIONALS.find((p) => p.id === "vet-3").name,
        phone: "095 222 111",
        email: "",
        startISO: toISOKey(new Date(d3.getFullYear(), d3.getMonth(), d3.getDate(), 16, 30)),
        createdAt: Date.now(),
      },
    ];

    saveReservations(examples);
    localStorage.setItem(LS_SEEDED_KEY, "1");
  }

  /* -----------------------------
    Render + filtros
  ----------------------------- */

 function getFilteredReservations(all) {
  const service = serviceFilter ? serviceFilter.value : "all";
  const dateF = dateFilter ? dateFilter.value : "all";
  const q = (searchInput ? searchInput.value : "").trim().toLowerCase();

  const now = new Date();

  return all.filter((r) => {
    // filtro por servicio
    const okService = service === "all" ? true : r.proType === service;

    // filtro por fecha
    const start = parseISOKey(r.startISO);
    let okDate = true;

    if (dateF === "future") okDate = start >= now;
    if (dateF === "past") okDate = start < now;

    // filtro texto
    if (!q) return okService && okDate;

    const hay =
      `${r.ownerName} ${r.petName} ${r.petType} ${r.serviceLabel} ${r.proName} ${r.phone} ${r.email}`
        .toLowerCase();

    return okService && okDate && hay.includes(q);
  });
}


  function updateCounters(all) {
    if (!countTotal || !countVet || !countGroom) return;
    const total = all.length;
    const vet = all.filter((r) => r.proType === "vet").length;
    const groom = all.filter((r) => r.proType === "groom").length;

    countTotal.textContent = String(total);
    countVet.textContent = String(vet);
    countGroom.textContent = String(groom);
  }

  function reservationItemHTML(r) {
  const start = parseISOKey(r.startISO);
  const when = isNaN(start.getTime()) ? r.startISO : formatNice(start);

  const status = r.status || "active";
  const isCancelled = status === "cancelled";

  const badgeClass = r.proType === "vet" ? "vet" : "groom";
  const badgeText = r.proType === "vet" ? "Veterinaria" : "Estética/Baño";

  const emailLine = r.email
    ? `<div class="meta-item"><span>✉️</span><strong>${escapeHtml(r.email)}</strong></div>`
    : "";

  const statusBadge = isCancelled
    ? `<span class="badge cancelled">Cancelada</span>`
    : `<span class="badge active">Activa</span>`;

  return `
    <li class="reservation ${isCancelled ? "is-cancelled" : ""}" data-id="${escapeHtml(
      r.id
    )}">
      <div class="reservation-main">
        <div class="reservation-top">
          <span class="badge ${badgeClass}">${badgeText}</span>
          ${statusBadge}
          <p class="reservation-title">
            <strong>${escapeHtml(r.ownerName)}</strong> · ${escapeHtml(r.petName)} (${escapeHtml(
    r.petType
  )})
          </p>
        </div>

        <div class="reservation-meta">
          <div class="meta-item"><span>🗓️</span><strong>${escapeHtml(when)}</strong></div>
          <div class="meta-item"><span>🧑‍⚕️</span><strong>${escapeHtml(r.proName)}</strong></div>
          <div class="meta-item"><span>🧾</span><strong>${escapeHtml(r.serviceLabel)}</strong></div>
          <div class="meta-item"><span>📞</span><strong>${escapeHtml(r.phone)}</strong></div>
          ${emailLine}
        </div>
      </div>

      <div class="reservation-actions">
        <button
          class="btn ${isCancelled ? "btn-disabled" : "btn-warning"}"
          type="button"
          data-action="cancel"
          data-id="${escapeHtml(r.id)}"
          ${isCancelled ? "disabled" : ""}
        >
          ${isCancelled ? "Cancelada" : "Cancelar"}
        </button>
      </div>
    </li>
  `;
}



  function renderList() {
    if (!listEl) return;

    const all = sortReservations(loadReservations());
    updateCounters(all);

    const filtered = getFilteredReservations(all);

    if (filtered.length === 0) {
      listEl.innerHTML = "";
      if (emptyState) emptyState.hidden = all.length !== 0; // si hay reservas pero el filtro deja 0, no mostrar "no hay reservas"
      // Si querés un mensaje distinto para "sin resultados", descomentá:
      // if (all.length !== 0 && emptyState) { emptyState.hidden = false; emptyState.textContent = "No hay resultados con esos filtros."; }
      return;
    }

    if (emptyState) emptyState.hidden = true;
    listEl.innerHTML = filtered.map(reservationItemHTML).join("");
  }

  /* -----------------------------
    Actions: eliminar / borrar todo
  ----------------------------- */

  function cancelReservationById(id) {
  const all = loadReservations();

  const next = all.map((r) => {
    // normalizar reservas viejas sin status
    if (!r.status) r.status = "active";

    if (r.id !== id) return r;

    // si ya estaba cancelada, no tocar
    if (r.status === "cancelled") return r;

    return { ...r, status: "cancelled", cancelledAt: Date.now() };
  });

  saveReservations(next);
}


  function clearAllReservations() {
    saveReservations([]);
    // no tocamos LS_SEEDED_KEY: así podés volver a cargar ejemplos con el botón
  }

  /* -----------------------------
    Login / logout
  ----------------------------- */

  function initLogin() {
    if (!loginForm) return;

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      setLoginMsg("");

      const fd = new FormData(loginForm);
      const u = String(fd.get("username") || "").trim();
      const p = String(fd.get("password") || "").trim();

      if (!u || !p) {
        setLoginMsg("Completá usuario y contraseña.");
        return;
      }

      if (u === ADMIN_USER.username && p === ADMIN_USER.password) {
        setSession(true);
        loginForm.reset();
        showPanel();
        renderList();
        return;
      }

      setLoginMsg("Usuario o contraseña incorrectos.");
    });
  }

  function initLogout() {
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", () => {
      setSession(false);
      showLogin();
      setLoginMsg("");
    });
  }

  /* -----------------------------
    Bind UI events
  ----------------------------- */

  function bindUI() {
  // Delegación de eventos para cancelar reservas
  if (listEl) {
    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action='cancel']");
      if (!btn) return;

      // Si ya está cancelada, no hacer nada
      if (btn.disabled) return;

      const id = btn.dataset.id;
      if (!id) return;

      const ok = confirm("¿Cancelar esta reserva?");
      if (!ok) return;

      cancelReservationById(id);
      renderList();
    });
  }

  // filtros
  if (serviceFilter) serviceFilter.addEventListener("change", renderList);
  if (dateFilter) dateFilter.addEventListener("change", renderList);

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderList();
    });
  }

  // seed
  if (seedBtn) {
    seedBtn.addEventListener("click", () => {
      const current = loadReservations();
      if (current.length > 0) {
        alert("Ya hay reservas cargadas. Si querés ejemplos, primero borrá todo.");
        return;
      }
      ensureSeedData();
      renderList();
    });
  }

  // clear
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const ok = confirm("¿Seguro que querés borrar TODAS las reservas?");
      if (!ok) return;
      clearAllReservations();
      renderList();
    });
  }
}


  /* -----------------------------
    Init
  ----------------------------- */

  function initYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initLogin();
    initLogout();
    bindUI();

    // si ya hay sesión, mostrar panel; si no, login
    if (isLoggedIn()) {
      showPanel();
      renderList();
    } else {
      showLogin();
    }
  });
})();
