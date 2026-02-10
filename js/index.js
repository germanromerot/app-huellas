/* ==========================================================================
  index.js — Página de inicio (Vet & Estética)
  - Carrusel
  - Menú mobile (toggle)
  - Render profesionales + filtro
  - Formulario reserva + validaciones (horarios / duración / solapamientos)
  - Persistencia en localStorage + precarga de reservas ejemplo
  - (Opcional) deja listo un "admin login" si luego agregás el modal/botón
========================================================================== */
(() => {
  "use strict";

  /* -----------------------------
    Config / datos “mock”
  ----------------------------- */

  const LS_KEY = "vetestetica_reservas_v1";
  const LS_SEEDED_KEY = "vetestetica_seeded_v1";
  const LS_ADMIN_SESSION = "vetestetica_admin_session_v1";

  // Credenciales admin (si luego agregás el modal/login)
  const ADMIN_USER = { username: "admin", password: "1234" };

  const SERVICES = [
    {
      id: "vet_consulta",
      label: "Consulta veterinaria",
      proType: "vet",
      price: 500,
      extraNote: " (+ insumos si aplica)",
      durationMin: 30,
    },
    {
      id: "groom_full",
      label: "Estética completa (lavado, secado, corte, uñas)",
      proType: "groom",
      price: 1800,
      extraNote: "",
      durationMin: 60,
    },
  ];

  const PROFESSIONALS = [
    { id: "vet-1", type: "vet", name: "Dra. Lucía Pereira", specialty: "Veterinaria" },
    { id: "vet-2", type: "vet", name: "Dr. Martín Suárez", specialty: "Veterinario" },
    { id: "vet-3", type: "vet", name: "Dra. Sofía Méndez", specialty: "Veterinaria" },

    { id: "groom-1", type: "groom", name: "Valentina Rocha", specialty: "Estilista" },
    { id: "groom-2", type: "groom", name: "Camila Fernández", specialty: "Estilista" },
    { id: "groom-3", type: "groom", name: "Agustina Silva", specialty: "Estilista" },
  ];

  // Slides “sin imágenes reales” (uso gradientes, podés cambiar por <img> si querés)
  const SLIDES = [
    {
      title: "Estética con cariño",
      text: "Cortes, baño y uñas en un entorno seguro y tranquilo.",
      bg: "url(img/slider-1.jpg)",
      //bg: "linear-gradient(135deg, var(--p4), var(--p1))",
    },
    {
      title: "Veterinaria de confianza",
      text: "Consulta veterinaria para perros y gatos.",
      bg: "url(img/slider-2.jpg)",
      //bg: "linear-gradient(135deg, var(--p2), var(--p3))",
    },
    {
      title: "Turnos online en 1 minuto",
      text: "Elegí profesional, fecha y hora. Confirmación inmediata.",
      bg: "url(img/slider-3.jpg)",
      //bg: "linear-gradient(135deg, var(--p3), var(--p1))",
    },
  ];

  /* -----------------------------
    Helpers
  ----------------------------- */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const pad2 = (n) => String(n).padStart(2, "0");

  function parseDateTime(dateStr, timeStr) {
    // dateStr: YYYY-MM-DD, timeStr: HH:MM
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  function toISOKey(dateObj) {
    // "YYYY-MM-DDTHH:MM"
    return (
      `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}` +
      `T${pad2(dateObj.getHours())}:${pad2(dateObj.getMinutes())}`
    );
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

  function isOpenHours(dateObj) {
    // L-V 09:00–18:00, Sáb 09:00–12:30, Dom cerrado
    const day = dateObj.getDay(); // 0=Dom ... 6=Sáb
    const minutes = dateObj.getHours() * 60 + dateObj.getMinutes();

    if (day === 0) return false; // domingo
    if (day >= 1 && day <= 5) {
      // lun-vie
      const open = 9 * 60;
      const close = 18 * 60; // último turno puede empezar a las 17:30
      return minutes >= open && minutes <= close - 30;
    }
    // sábado
    const openSat = 9 * 60;
    const closeSat = 12 * 60 + 30; // último turno puede empezar a las 12:00
    return minutes >= openSat && minutes <= closeSat - 30;
  }

  function isHalfHourStep(timeStr) {
    // Permite :00 o :30
    const mm = Number(timeStr.split(":")[1] || 0);
    return mm === 0 || mm === 30;
  }

  function hasOverlap(existing, candidate) {
    // regla: no se pisa para mismo profesional
    // como todos son 30 min exactos, basta chequear mismo startISO y proId
    return existing.some((r) => r.proId === candidate.proId && r.startISO === candidate.startISO);
  }

  function ensureSeedData() {
    if (localStorage.getItem(LS_SEEDED_KEY) === "1") return;

    // Precarga con 6 reservas ejemplo (algunas vet, algunas groom)
    // Nota: uso fechas relativas a "hoy" para que siempre haya ejemplos válidos.
    const today = new Date();
    const plusDays = (n) => {
      const x = new Date(today);
      x.setDate(x.getDate() + n);
      return x;
    };

    // Buscamos próximos días hábiles para que caigan en horario
    const nextBusinessDay = (startOffset) => {
      const d = plusDays(startOffset);
      // si cae domingo -> lunes
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      return d;
    };

    const d1 = nextBusinessDay(1);
    const d2 = nextBusinessDay(2);
    const d3 = nextBusinessDay(3);

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
    Header: menú mobile
  ----------------------------- */

  function initNav() {
    const navToggle = $("#navToggle");
    const nav = $("#nav");
    if (!navToggle || !nav) return;

    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // cerrar al click en link
    $$("#nav a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    // cerrar con escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* -----------------------------
    Carrusel
  ----------------------------- */

  function initCarousel() {
    const track = $("#carouselTrack");
    const dotsWrap = $("#carouselDots");
    const btnPrev = $("#carouselPrev");
    const btnNext = $("#carouselNext");
    if (!track || !dotsWrap || !btnPrev || !btnNext) return;

    let index = 0;
    let timer = null;

    function renderSlides() {
      track.innerHTML = SLIDES.map((s) => {
        return `
          <article class="slide" style="background:${s.bg}">
            <div class="caption">
              <h3>${escapeHtml(s.title)}</h3>
              <p>${escapeHtml(s.text)}</p>
            </div>
          </article>
        `;
      }).join("");

      dotsWrap.innerHTML = SLIDES.map(
        (_, i) => `<button class="dot ${i === 0 ? "is-active" : ""}" aria-label="Ir al slide ${i + 1}" data-i="${i}" type="button"></button>`
      ).join("");
    }

    function goTo(i) {
      const total = SLIDES.length;
      index = (i + total) % total;
      track.style.transform = `translateX(${-index * 100}%)`;

      $$(".dot", dotsWrap).forEach((d, di) => {
        d.classList.toggle("is-active", di === index);
      });
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startAuto() {
      stopAuto();
      timer = window.setInterval(next, 5000);
    }
    function stopAuto() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    renderSlides();
    goTo(0);
    startAuto();

    btnNext.addEventListener("click", () => { next(); startAuto(); });
    btnPrev.addEventListener("click", () => { prev(); startAuto(); });

    dotsWrap.addEventListener("click", (e) => {
      const b = e.target.closest(".dot");
      if (!b) return;
      goTo(Number(b.dataset.i));
      startAuto();
    });

    // swipe básico móvil
    let startX = 0;
    track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; stopAuto(); }, { passive: true });
    track.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const dx = endX - startX;
      if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
      startAuto();
    }, { passive: true });

    // pausa al hover (desktop)
    track.addEventListener("mouseenter", stopAuto);
    track.addEventListener("mouseleave", startAuto);
  }

  /* -----------------------------
    Profesionales + filtros
  ----------------------------- */

  function initProfessionals() {
    const grid = $("#proGrid");
    if (!grid) return;

    function card(p) {
      const badge = p.type === "vet" ? "Veterinaria" : "Estética/Baño";
      return `
        <article class="card pro" data-type="${p.type}">
          <div class="avatar" aria-hidden="true"></div>
          <div class="meta">
            <h3>${escapeHtml(p.name)}</h3>
            <p>${escapeHtml(p.specialty)}</p>
          </div>
          <div class="hover" aria-hidden="true">
            <span>${badge}</span>
          </div>
        </article>
      `;
    }

    grid.innerHTML = PROFESSIONALS.map(card).join("");

    const chips = $$(".chip");
    chips.forEach((btn) => {
      btn.addEventListener("click", () => {
        chips.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const filter = btn.dataset.filter;
        const cards = $$(".pro", grid);

        cards.forEach((c) => {
          const type = c.dataset.type;
          const show = filter === "all" ? true : type === filter;
          c.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* -----------------------------
    Formulario reserva
  ----------------------------- */

  function initBookingForm() {
    const form = $("#bookingForm");
    if (!form) return;

    const serviceSelect = $("#serviceSelect");
    const proSelect = $("#proSelect");
    const dateInput = $("#dateInput");
    const timeInput = $("#timeInput");
    const hint = $("#formHint");
    const successModal = $("#successModal");
    const successMessage = $("#successMessage");
    const successCloseBtns = $$("#successModal [data-close]");

    // Render servicios
    serviceSelect.innerHTML =
      `<option value="">Seleccionar…</option>` +
      SERVICES.map((s) => {
        const label = `${s.label} — $${s.price}${s.extraNote}`;
        return `<option value="${s.id}" data-protype="${s.proType}">${escapeHtml(label)}</option>`;
      }).join("");

    // Set min date a hoy
    const today = new Date();
    const minDate = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    dateInput.min = minDate;

    function buildSlotsForDate(dateStr, slotDuration) {
      if (!dateStr) return [];
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d, 0, 0, 0, 0);
      const day = dateObj.getDay(); // 0=Dom ... 6=Sáb

      if (day === 0) return []; // domingo

      const open = 9 * 60;
      const close = day >= 1 && day <= 5 ? 18 * 60 : 12 * 60 + 30;
      const slots = [];

      for (let start = open; start + slotDuration <= close; start += slotDuration) {
        slots.push({ startMin: start, endMin: start + slotDuration });
      }
      return slots;
    }

    function formatHM(totalMin) {
      const hh = Math.floor(totalMin / 60);
      const mm = totalMin % 60;
      return `${pad2(hh)}:${pad2(mm)}`;
    }

    function getReservedTimesForDate(dateStr) {
      const all = loadReservations();
      const prefix = `${dateStr}T`;
      const set = new Set();

      all.forEach((r) => {
        if (typeof r.startISO !== "string") return;
        if (!r.startISO.startsWith(prefix)) return;
        const timePart = r.startISO.split("T")[1];
        if (!timePart) return;
        set.add(timePart.slice(0, 5));
      });

      return set;
    }

    function renderTimeSlots() {
      if (!timeInput) return;
      const dateStr = dateInput ? String(dateInput.value || "") : "";
      const serviceId = serviceSelect ? String(serviceSelect.value || "") : "";
      const service = SERVICES.find((s) => s.id === serviceId);
      const slotDuration = service?.durationMin || 30;
      const slots = buildSlotsForDate(dateStr, slotDuration);

      if (!dateStr) {
        timeInput.innerHTML = `<option value="">Seleccionar…</option>`;
        return;
      }

      if (slots.length === 0) {
        timeInput.innerHTML =
          `<option value="">Seleccionar…</option>` +
          `<option value="" disabled>Cerrado</option>`;
        return;
      }

      const reserved = getReservedTimesForDate(dateStr);

      const options = slots.map((s) => {
        const start = formatHM(s.startMin);
        const end = formatHM(s.endMin);
        const label = `${start}-${end}`;
        const disabled = reserved.has(start) ? " disabled" : "";
        return `<option value="${start}"${disabled}>${label}</option>`;
      });

      timeInput.innerHTML = `<option value="">Seleccionar…</option>` + options.join("");
    }

    // Al elegir servicio: filtrar profesionales
    serviceSelect.addEventListener("change", () => {
      const opt = serviceSelect.selectedOptions[0];
      if (!opt || !opt.value) {
        renderPros("all");
        renderTimeSlots();
        return;
      }

      const requiredType = opt.dataset.protype;
      if (requiredType) renderPros(requiredType);
      renderTimeSlots();
    });

    function renderPros(type) {
      const list =
        type === "all" || !type
          ? PROFESSIONALS
          : PROFESSIONALS.filter((p) => p.type === type);

      proSelect.innerHTML =
        `<option value="">Seleccionar…</option>` +
        list.map((p) => `<option value="${p.id}">${escapeHtml(p.name)} — ${escapeHtml(p.specialty)}</option>`).join("");
    }

    renderPros("all");
    renderTimeSlots();

    function setHint(msg, ok = false) {
      if (!hint) return;
      hint.textContent = msg;
      hint.style.color = ok ? "inherit" : "var(--muted)";
    }

    function hardError(msg) {
      if (!hint) return;
      hint.textContent = msg;
      hint.style.color = "#8b1e3f";
    }

    function openSuccessModal(msg) {
      if (!successModal || !successMessage) return;
      successMessage.textContent = msg;
      successModal.classList.add("is-open");
      successModal.setAttribute("aria-hidden", "false");
    }

    function closeSuccessModal() {
      if (!successModal) return;
      successModal.classList.remove("is-open");
      successModal.setAttribute("aria-hidden", "true");
    }

    successCloseBtns.forEach((btn) => btn.addEventListener("click", closeSuccessModal));
    if (successModal) {
      successModal.addEventListener("click", (e) => {
        const target = e.target;
        if (target && target.classList.contains("modal-backdrop")) {
          closeSuccessModal();
        }
      });
    }
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSuccessModal();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setHint("");

      // Valores
      const fd = new FormData(form);
      const ownerName = String(fd.get("ownerName") || "").trim();
      const petName = String(fd.get("petName") || "").trim();
      const petType = String(fd.get("petType") || "").trim();
      const serviceId = String(fd.get("service") || "").trim();
      const proId = String(fd.get("proId") || "").trim();
      const dateStr = String(fd.get("date") || "").trim();
      const timeStr = String(fd.get("time") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const email = String(fd.get("email") || "").trim();

      // Validación básica
      if (!ownerName || !petName || !petType || !serviceId || !proId || !dateStr || !timeStr || !phone) {
        hardError("Por favor completá todos los campos obligatorios (*)");
        return;
      }

      if (!["Perro", "Gato"].includes(petType)) {
        hardError("Tipo de mascota inválido. Solo Perro o Gato.");
        return;
      }

      const start = parseDateTime(dateStr, timeStr);

      // No permitir fechas pasadas
      if (start.getTime() < Date.now() - 60 * 1000) {
        hardError("Elegí una fecha y hora futura.");
        return;
      }

      // Horario de atención
      if (!isOpenHours(start)) {
        hardError("Fuera del horario de atención. Lun–Vie 09:00–18:00 · Sáb 09:00–12:30 · Dom cerrado.");
        return;
      }

      // Relación servicio / tipo profesional
      const service = SERVICES.find((s) => s.id === serviceId);
      if (!service) {
        hardError("Servicio inválido.");
        return;
      }
      // Profesional válido
      const pro = PROFESSIONALS.find((p) => p.id === proId);
      if (!pro || pro.type !== service.proType) {
        hardError("Profesional inválido.");
        return;
      }

      const newReservation = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ownerName,
        petName,
        petType,
        serviceId,
        serviceLabel: service.label,
        proType: service.proType,
        proId,
        proName: pro.name,
        phone,
        email,
        startISO: toISOKey(start),
        createdAt: Date.now(),
      };

      const existing = loadReservations();

      // solapamiento
      if (hasOverlap(existing, newReservation)) {
        hardError("Ese profesional ya tiene un turno en ese horario. Elegí otro horario o profesional.");
        return;
      }

      const updated = sortReservations([...existing, newReservation]);
      saveReservations(updated);

      // Confirmación en la web
      const summary = `${newReservation.serviceLabel} con ${newReservation.proName} — ${formatNice(start)}`;
      openSuccessModal(`${summary}`);

      form.reset();
      // reponer servicios y selects
      renderPros("all");
      serviceSelect.selectedIndex = 0;
      proSelect.innerHTML = `<option value="">Seleccionar…</option>`;
      renderTimeSlots();
    });

    // Si no hay servicio seleccionado y se elige profesional,
    // autoseleccionar un servicio compatible con ese profesional.
    proSelect.addEventListener("change", () => {
      if (!proSelect.value) return;
      if (serviceSelect.value) return;

      const selectedProId = proSelect.value;
      const pro = PROFESSIONALS.find((p) => p.id === proSelect.value);
      if (!pro) return;

      const service = SERVICES.find((s) => s.proType === pro.type);
      if (service) {
        serviceSelect.value = service.id;
        renderPros(service.proType);
        proSelect.value = selectedProId;
      }
    });

    if (dateInput) {
      dateInput.addEventListener("change", renderTimeSlots);
    }
  }

  /* -----------------------------
    (Opcional) Login modal si lo agregás
    - No rompe nada si no existe el HTML
  ----------------------------- */

  function initOptionalLogin() {
    // Si luego agregás: #loginBtn, #loginModal, #loginForm, etc.
    const loginBtn = $("#loginBtn");
    const modal = $("#loginModal");
    const loginForm = $("#loginForm");
    const closeBtns = $$(".modal [data-close]");

    if (!loginBtn || !modal || !loginForm) return;

    const open = () => modal.classList.add("is-open");
    const close = () => modal.classList.remove("is-open");

    loginBtn.addEventListener("click", open);
    closeBtns.forEach((b) => b.addEventListener("click", close));
    modal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) close();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const u = String(fd.get("username") || "").trim();
      const p = String(fd.get("password") || "").trim();

      if (u === ADMIN_USER.username && p === ADMIN_USER.password) {
        localStorage.setItem(LS_ADMIN_SESSION, JSON.stringify({ ok: true, at: Date.now() }));
        // redirigir a admin.html
        window.location.href = "admin.html";
        return;
      }
      const msg = $("#loginMsg", modal);
      if (msg) msg.textContent = "Usuario o contraseña incorrectos.";
    });
  }

  /* -----------------------------
    Utils: escape HTML
  ----------------------------- */

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* -----------------------------
    Init
  ----------------------------- */

  function initYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Seed de reservas ejemplo solo 1 vez
    try {
      ensureSeedData();
    } catch {
      // si localStorage bloqueado, no seed
    }

    initYear();
    initNav();
    initCarousel();
    initProfessionals();
    initBookingForm();

    // Si después agregás login modal, ya queda listo:
    initOptionalLogin();
  });
})();
