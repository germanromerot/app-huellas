(() => {
  "use strict";

  const core = window.VetCore || {};
  const constants = core.config?.constants;
  const catalog = core.config?.catalog;
  const auth = core.config?.auth;
  const datetime = core.shared?.datetime;
  const text = core.shared?.text;
  const sort = core.shared?.sort;
  const rules = core.reservations?.rules;
  const slots = core.reservations?.slots;
  const overlap = core.reservations?.overlap;
  const factory = core.reservations?.factory;
  const reservationsStore = core.storage?.reservationsStore;
  const sessionStore = core.storage?.sessionStore;
  const seedReservations = core.seed?.seedReservations;

  const modulesReady =
    constants &&
    catalog &&
    auth &&
    datetime &&
    text &&
    sort &&
    rules &&
    slots &&
    overlap &&
    factory &&
    reservationsStore &&
    sessionStore &&
    seedReservations;

  if (!modulesReady) {
    console.error("VetCore modules are missing. Check script order in index.html.");
    return;
  }

  const SERVICES = catalog.SERVICES;
  const PROFESSIONALS = catalog.PROFESSIONALS;
  const ADMIN_USER = auth.ADMIN_USER;

  const SLIDES = [
    { title: "Bano", text: "Bano para nuestro cliente Amadeo.", bg: "url(img/slider-4.jpg)" },
    { title: "Veterinaria", text: "Sedacion para nuestro cliente Toby.", bg: "url(img/slider-5.jpg)" },
    { title: "Consulta", text: "Consulta para nuestro cliente Rocky.", bg: "url(img/slider-6.jpg)" },
    { title: "Bano", text: "Bano para nuestro cliente Pepe.", bg: "url(img/slider-7.jpg)" },
    { title: "Consulta", text: "Consulta para nuestro cliente Ambar.", bg: "url(img/slider-8.jpg)" },
    { title: "Consulta", text: "Consulta para nuestro cliente Nina.", bg: "url(img/slider-9.jpg)" },
    { title: "Bano", text: "Bano para nuestro cliente Cleopatra.", bg: "url(img/slider-10.jpg)" },
    { title: "Corte de unas", text: "Corte de unas para nuestro cliente Pipe.", bg: "url(img/slider-11.jpg)" },
    { title: "Veterinaria", text: "Sedacion para nuestro cliente Tito.", bg: "url(img/slider-12.jpg)" },
  ];

  // Selecciona el primer elemento que coincide con el selector.
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  // Selecciona todos los elementos que coinciden y los devuelve como array.
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Obtiene la duracion de un servicio o usa el valor por defecto.
  function getServiceDurationById(serviceId) {
    return catalog.SERVICES_BY_ID?.[serviceId]?.durationMin || constants.DEFAULT_SLOT_MIN;
  }

  // Inicializa el menu mobile y su comportamiento de cierre.
  function initNav() {
    const navToggle = $("#navToggle");
    const nav = $("#nav");
    if (!navToggle || !nav) return;

    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    $$("#nav a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  }

  // Inicializa el carrusel principal con navegacion y autoplay.
  function initCarousel() {
    const track = $("#carouselTrack");
    const dotsWrap = $("#carouselDots");
    const btnPrev = $("#carouselPrev");
    const btnNext = $("#carouselNext");
    if (!track || !dotsWrap || !btnPrev || !btnNext) return;

    let index = 0;
    let timer = null;

    // Renderiza slides y dots segun la configuracion.
    function renderSlides() {
      track.innerHTML = SLIDES.map(
        (slide) => `
          <article class="slide" style="background:${slide.bg}">
            <div class="caption">
              <h3>${text.escapeHtml(slide.title)}</h3>
              <p>${text.escapeHtml(slide.text)}</p>
            </div>
          </article>
        `
      ).join("");

      dotsWrap.innerHTML = SLIDES.map(
        (_, i) =>
          `<button class="dot ${i === 0 ? "is-active" : ""}" aria-label="Ir al slide ${
            i + 1
          }" data-i="${i}" type="button"></button>`
      ).join("");
    }

    // Mueve el carrusel a un indice valido y actualiza el estado visual.
    function goTo(i) {
      const total = SLIDES.length;
      index = (i + total) % total;
      track.style.transform = `translateX(${-index * 100}%)`;

      $$(".dot", dotsWrap).forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    // Avanza al siguiente slide.
    function next() {
      goTo(index + 1);
    }

    // Retrocede al slide anterior.
    function prev() {
      goTo(index - 1);
    }

    // Inicia el autoplay del carrusel.
    function startAuto() {
      stopAuto();
      timer = window.setInterval(next, 5000);
    }

    // Detiene el autoplay del carrusel.
    function stopAuto() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    renderSlides();
    goTo(0);
    startAuto();

    btnNext.addEventListener("click", () => {
      next();
      startAuto();
    });
    btnPrev.addEventListener("click", () => {
      prev();
      startAuto();
    });

    dotsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".dot");
      if (!btn) return;
      goTo(Number(btn.dataset.i));
      startAuto();
    });

    let startX = 0;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        stopAuto();
      },
      { passive: true }
    );
    track.addEventListener(
      "touchend",
      (e) => {
        const endX = e.changedTouches[0].clientX;
        const dx = endX - startX;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        startAuto();
      },
      { passive: true }
    );

    track.addEventListener("mouseenter", stopAuto);
    track.addEventListener("mouseleave", startAuto);
  }

  // Renderiza profesionales y aplica filtro por tipo.
  function initProfessionals() {
    const grid = $("#proGrid");
    if (!grid) return;

    // Genera el HTML de una tarjeta de profesional.
    function card(professional) {
      const badge = professional.type === "vet" ? "Veterinaria" : "Estetica/Bano";
      return `
        <article class="card pro" data-type="${professional.type}">
          <div class="avatar" aria-hidden="true"></div>
          <div class="meta">
            <h3>${text.escapeHtml(professional.name)}</h3>
            <p>${text.escapeHtml(professional.specialty)}</p>
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
        chips.forEach((chip) => chip.classList.remove("is-active"));
        btn.classList.add("is-active");

        const filter = btn.dataset.filter;
        $$(".pro", grid).forEach((cardEl) => {
          const show = filter === "all" ? true : cardEl.dataset.type === filter;
          cardEl.style.display = show ? "" : "none";
        });
      });
    });
  }

  // Inicializa el formulario de reservas y sus validaciones.
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

    if (!serviceSelect || !proSelect || !dateInput || !timeInput) return;

    // Muestra un mensaje de ayuda neutral en el formulario.
    function setHint(msg) {
      if (!hint) return;
      hint.textContent = msg || "";
      hint.style.color = "var(--muted)";
    }

    // Muestra un error visible en el formulario.
    function hardError(msg) {
      if (!hint) return;
      hint.textContent = msg;
      hint.style.color = "#8b1e3f";
    }

    // Abre el modal de exito con un mensaje de resumen.
    function openSuccessModal(msg) {
      if (!successModal || !successMessage) return;
      successMessage.textContent = msg;
      successModal.classList.add("is-open");
      successModal.setAttribute("aria-hidden", "false");
    }

    // Cierra el modal de exito.
    function closeSuccessModal() {
      if (!successModal) return;
      successModal.classList.remove("is-open");
      successModal.setAttribute("aria-hidden", "true");
    }

    // Renderiza profesionales compatibles con el tipo de servicio.
    function renderPros(type) {
      const list =
        type === "all" || !type
          ? PROFESSIONALS
          : PROFESSIONALS.filter((professional) => professional.type === type);

      proSelect.innerHTML =
        `<option value="">Seleccionar...</option>` +
        list
          .map(
            (professional) =>
              `<option value="${professional.id}">${text.escapeHtml(
                professional.name
              )} - ${text.escapeHtml(professional.specialty)}</option>`
          )
          .join("");
    }

    // Renderiza horarios disponibles segun fecha, servicio y profesional.
    function renderTimeSlots() {
      const dateStr = String(dateInput.value || "");
      const serviceId = String(serviceSelect.value || "");
      const selectedProId = String(proSelect.value || "");
      const service = catalog.SERVICES_BY_ID?.[serviceId];
      const slotDuration = service?.durationMin || constants.DEFAULT_SLOT_MIN;
      const slotsForDate = slots.buildSlotsForDate(dateStr, slotDuration, constants.SCHEDULE);

      if (!dateStr) {
        timeInput.innerHTML = `<option value="">Seleccionar...</option>`;
        return;
      }

      if (slotsForDate.length === 0) {
        timeInput.innerHTML =
          `<option value="">Seleccionar...</option>` + `<option value="" disabled>Cerrado</option>`;
        return;
      }

      const existing = reservationsStore.loadReservations();
      const options = slotsForDate.map((slot) => {
        const start = datetime.formatHM(slot.startMin);
        const end = datetime.formatHM(slot.endMin);
        const label = `${start}-${end}`;

        if (!selectedProId) {
          return `<option value="${start}">${label}</option>`;
        }

        const candidate = {
          proId: selectedProId,
          serviceId,
          startISO: `${dateStr}T${start}`,
          durationMin: slotDuration,
          status: "active",
        };

        const disabled = overlap.hasOverlap(
          existing,
          candidate,
          getServiceDurationById,
          constants.DEFAULT_SLOT_MIN
        );
        return `<option value="${start}"${disabled ? " disabled" : ""}>${label}</option>`;
      });

      timeInput.innerHTML = `<option value="">Seleccionar...</option>` + options.join("");
    }

    serviceSelect.innerHTML =
      `<option value="">Seleccionar...</option>` +
      SERVICES.map((service) => {
        const label = `${service.label} - $${service.price}${service.extraNote || ""}`;
        return `<option value="${service.id}" data-protype="${service.proType}">${text.escapeHtml(
          label
        )}</option>`;
      }).join("");

    const today = new Date();
    dateInput.min = `${today.getFullYear()}-${datetime.pad2(today.getMonth() + 1)}-${datetime.pad2(
      today.getDate()
    )}`;

    successCloseBtns.forEach((btn) => btn.addEventListener("click", closeSuccessModal));
    if (successModal) {
      successModal.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("modal-backdrop")) closeSuccessModal();
      });
    }
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSuccessModal();
    });

    serviceSelect.addEventListener("change", () => {
      const selectedService = catalog.SERVICES_BY_ID?.[serviceSelect.value];
      renderPros(selectedService?.proType || "all");
      renderTimeSlots();
    });

    proSelect.addEventListener("change", () => {
      if (proSelect.value && !serviceSelect.value) {
        const professional = catalog.PROFESSIONALS_BY_ID?.[proSelect.value];
        const compatibleService = SERVICES.find((service) => service.proType === professional?.type);
        if (compatibleService) {
          serviceSelect.value = compatibleService.id;
          renderPros(compatibleService.proType);
          proSelect.value = professional.id;
        }
      }
      renderTimeSlots();
    });

    dateInput.addEventListener("change", renderTimeSlots);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setHint("");

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

      if (
        !rules.hasRequiredBookingFields({
          ownerName,
          petName,
          petType,
          serviceId,
          proId,
          dateStr,
          timeStr,
          phone,
        })
      ) {
        hardError("Por favor completa todos los campos obligatorios (*).");
        return;
      }

      if (!rules.isPetTypeAllowed(petType, constants.PET_TYPES)) {
        hardError("Tipo de mascota invalido. Solo Perro o Gato.");
        return;
      }

      const service = catalog.SERVICES_BY_ID?.[serviceId];
      if (!service) {
        hardError("Servicio invalido.");
        return;
      }

      const professional = catalog.PROFESSIONALS_BY_ID?.[proId];
      if (!rules.doesProfessionalMatchService(professional, service)) {
        hardError("Profesional invalido para el servicio seleccionado.");
        return;
      }

      const start = datetime.parseDateTime(dateStr, timeStr);
      if (!rules.isFutureDate(start)) {
        hardError("Elegi una fecha y hora futura.");
        return;
      }

      if (!rules.isOpenHours(start, service.durationMin, constants.SCHEDULE)) {
        hardError(
          "Fuera del horario de atencion. Lun-Vie 09:00-18:00 | Sab 09:00-12:30 | Dom cerrado."
        );
        return;
      }

      const newReservation = factory.createReservation(
        {
          ownerName,
          petName,
          petType,
          service,
          professional,
          phone,
          email,
          startDate: start,
        },
        { toISOKey: datetime.toISOKey }
      );
      newReservation.durationMin = service.durationMin;

      const existing = reservationsStore.loadReservations();
      if (
        overlap.hasOverlap(
          existing,
          newReservation,
          getServiceDurationById,
          constants.DEFAULT_SLOT_MIN
        )
      ) {
        hardError("Ese profesional ya tiene un turno en ese horario. Elige otro.");
        return;
      }

      const updated = sort.sortReservationsByStartISO([...existing, newReservation]);
      reservationsStore.saveReservations(updated);

      const summary =
        newReservation.serviceLabel +
        " con " +
        newReservation.proName +
        " - " +
        datetime.formatNice(start);
      openSuccessModal(summary);

      form.reset();
      renderPros("all");
      renderTimeSlots();
    });

    renderPros("all");
    renderTimeSlots();
  }

  // Inicializa el login opcional para acceder al panel admin.
  function initOptionalLogin() {
    const loginBtn = $("#loginBtn");
    const modal = $("#loginModal");
    const loginForm = $("#loginForm");
    const closeBtns = $$(".modal [data-close]");

    if (!loginBtn || !modal || !loginForm) return;

    // Abre el modal de login.
    const open = () => modal.classList.add("is-open");
    // Cierra el modal de login.
    const close = () => modal.classList.remove("is-open");

    loginBtn.addEventListener("click", open);
    closeBtns.forEach((btn) => btn.addEventListener("click", close));
    modal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) close();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(loginForm);
      const username = String(fd.get("username") || "").trim();
      const password = String(fd.get("password") || "").trim();

      if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
        sessionStore.setSession(true);
        window.location.href = "admin.html";
        return;
      }

      const msg = $("#loginMsg", modal);
      if (msg) msg.textContent = "Usuario o contrasena incorrectos.";
    });
  }

  // Actualiza el anio visible en el footer.
  function initYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      seedReservations.ensureSeedData();
    } catch (_err) {
      // Ignore localStorage failures in restricted environments.
    }

    initYear();
    initNav();
    initCarousel();
    initProfessionals();
    initBookingForm();
    initOptionalLogin();
  });
})();
