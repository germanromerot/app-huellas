(() => {
  "use strict";

  const core = window.VetCore || {};
  const auth = core.config?.auth;
  const datetime = core.shared?.datetime;
  const text = core.shared?.text;
  const sort = core.shared?.sort;
  const filters = core.reservations?.filters;
  const status = core.reservations?.status;
  const reservationsStore = core.storage?.reservationsStore;
  const sessionStore = core.storage?.sessionStore;
  const seedReservations = core.seed?.seedReservations;

  const modulesReady =
    auth &&
    datetime &&
    text &&
    sort &&
    filters &&
    status &&
    reservationsStore &&
    sessionStore &&
    seedReservations;

  if (!modulesReady) {
    console.error("Faltan módulos VetCore.");
    return;
  }

  const ADMIN_USER = auth.ADMIN_USER;

  // Selecciona el primer elemento que coincide con el selector.
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

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

  // Muestra la seccion de login y oculta el panel.
  function showLogin() {
    if (loginSection) loginSection.classList.remove("is-hidden");
    if (panelSection) panelSection.classList.add("is-hidden");
    if (logoutBtn) logoutBtn.classList.add("is-hidden");
  }

  // Muestra el panel admin y oculta el login.
  function showPanel() {
    if (loginSection) loginSection.classList.add("is-hidden");
    if (panelSection) panelSection.classList.remove("is-hidden");
    if (logoutBtn) logoutBtn.classList.remove("is-hidden");
  }

  // Actualiza el mensaje visible en el login admin.
  function setLoginMsg(message) {
    if (!loginMsg) return;
    loginMsg.textContent = message || "";
  }

  // Calcula y muestra contadores por tipo de reserva.
  function updateCounters(allReservations) {
    if (!countTotal || !countVet || !countGroom) return;
    const counters = filters.countReservationsByType(allReservations);
    countTotal.textContent = String(counters.total);
    countVet.textContent = String(counters.vet);
    countGroom.textContent = String(counters.groom);
  }

  // Genera el HTML de una reserva para la lista del panel.
  function reservationItemHTML(reservation) {
    const parsedDate = datetime.parseISOKey(reservation.startISO);
    const when = Number.isNaN(parsedDate.getTime())
      ? reservation.startISO
      : datetime.formatNice(parsedDate);

    const normalized = status.normalizeStatus(reservation);
    const cancelled = status.isCancelled(normalized);
    const badgeClass = reservation.proType === "vet" ? "vet" : "groom";
    const badgeText = reservation.proType === "vet" ? "Veterinaria" : "Estetica/Bano";

    const emailLine = reservation.email
      ? `<div class="meta-item"><span>Email:</span><strong>${text.escapeHtml(
          reservation.email
        )}</strong></div>`
      : "";

    const statusBadge = cancelled
      ? `<span class="badge cancelled">Cancelada</span>`
      : `<span class="badge active">Activa</span>`;

    return `
      <li class="reservation ${cancelled ? "is-cancelled" : ""}" data-id="${text.escapeHtml(
      reservation.id
    )}">
        <div class="reservation-main">
          <div class="reservation-top">
            <span class="badge ${badgeClass}">${badgeText}</span>
            ${statusBadge}
            <p class="reservation-title">
              <strong>${text.escapeHtml(reservation.ownerName)}</strong> -
              ${text.escapeHtml(reservation.petName)} (${text.escapeHtml(reservation.petType)})
            </p>
          </div>

          <div class="reservation-meta">
            <div class="meta-item"><span>Fecha:</span><strong>${text.escapeHtml(when)}</strong></div>
            <div class="meta-item"><span>Profesional:</span><strong>${text.escapeHtml(
              reservation.proName
            )}</strong></div>
            <div class="meta-item"><span>Servicio:</span><strong>${text.escapeHtml(
              reservation.serviceLabel
            )}</strong></div>
            <div class="meta-item"><span>Telefono:</span><strong>${text.escapeHtml(
              reservation.phone
            )}</strong></div>
            ${emailLine}
          </div>
        </div>

        <div class="reservation-actions">
          <button
            class="btn ${cancelled ? "btn-disabled" : "btn-warning"}"
            type="button"
            data-action="cancel"
            data-id="${text.escapeHtml(reservation.id)}"
            ${cancelled ? "disabled" : ""}
          >
            ${cancelled ? "Cancelada" : "Cancelar"}
          </button>
        </div>
      </li>
    `;
  }

  // Obtiene los criterios de filtrado desde la interfaz.
  function getFilterCriteria() {
    return {
      service: serviceFilter ? serviceFilter.value : "all",
      dateFilter: dateFilter ? dateFilter.value : "all",
      query: searchInput ? searchInput.value : "",
      now: new Date(),
    };
  }

  // Renderiza la lista filtrada de reservas.
  function renderList() {
    if (!listEl) return;

    const allReservations = sort.sortReservationsByStartISO(reservationsStore.loadReservations());
    updateCounters(allReservations);

    const filtered = filters.filterReservations(allReservations, getFilterCriteria());
    if (filtered.length === 0) {
      listEl.innerHTML = "";
      if (emptyState) emptyState.hidden = allReservations.length !== 0;
      return;
    }

    if (emptyState) emptyState.hidden = true;
    listEl.innerHTML = filtered.map(reservationItemHTML).join("");
  }

  // Borra todas las reservas almacenadas.
  function clearAllReservations() {
    reservationsStore.clearReservations();
  }

  // Inicializa el formulario de login admin.
  function initLogin() {
    if (!loginForm) return;

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      setLoginMsg("");

      const fd = new FormData(loginForm);
      const username = String(fd.get("username") || "").trim();
      const password = String(fd.get("password") || "").trim();

      if (!username || !password) {
        setLoginMsg("Completa usuario y contrasena.");
        return;
      }

      if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
        sessionStore.setSession(true);
        loginForm.reset();
        showPanel();
        renderList();
        return;
      }

      setLoginMsg("Usuario o contraseña incorrectos.");
    });
  }

  // Inicializa el cierre de sesion del admin.
  function initLogout() {
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", () => {
      sessionStore.setSession(false);
      showLogin();
      setLoginMsg("");
    });
  }

  // Conecta eventos de filtros, acciones y botones del panel.
  function bindUI() {
    if (listEl) {
      listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action='cancel']");
        if (!btn || btn.disabled) return;
        const id = btn.dataset.id;
        if (!id) return;

        const ok = confirm("Cancelar esta reserva?");
        if (!ok) return;

        const updated = status.cancelReservationById(reservationsStore.loadReservations(), id);
        reservationsStore.saveReservations(updated);
        renderList();
      });
    }

    if (serviceFilter) serviceFilter.addEventListener("change", renderList);
    if (dateFilter) dateFilter.addEventListener("change", renderList);
    if (searchInput) searchInput.addEventListener("input", renderList);

    if (seedBtn) {
      seedBtn.addEventListener("click", () => {
        const current = reservationsStore.loadReservations();
        if (current.length > 0) {
          alert("Ya hay reservas cargadas. Si quieres ejemplos, primero borra todo.");
          return;
        }
        seedReservations.ensureSeedData({ force: true });
        renderList();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const ok = confirm("Seguro que quieres borrar TODAS las reservas?");
        if (!ok) return;
        clearAllReservations();
        renderList();
      });
    }
  }

  // Actualiza el anio visible en el footer.
  function initYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initLogin();
    initLogout();
    bindUI();

    if (sessionStore.isLoggedIn()) {
      showPanel();
      renderList();
    } else {
      showLogin();
    }
  });
})();
