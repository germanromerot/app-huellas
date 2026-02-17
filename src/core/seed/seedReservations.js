(function (global) {
  "use strict";

  // Resuelve el storage a usar, priorizando uno inyectado.
  function resolveStorage(customStorage) {
    if (customStorage) return customStorage;
    if (typeof localStorage !== "undefined") return localStorage;
    return null;
  }

  // Genera un id unico para datos de ejemplo.
  function defaultIdGenerator() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }

  // Resuelve dependencias y valores por defecto para el seeding.
  function resolveDependencies(options) {
    const root = global.VetCore || {};
    const constants = root.config?.constants || {};
    const catalog = root.config?.catalog || {};
    const datetime = root.shared?.datetime || {};
    const store = root.storage?.reservationsStore || {};

    return {
      storage: resolveStorage(options?.storage),
      services: options?.services || catalog.SERVICES || [],
      professionals: options?.professionals || catalog.PROFESSIONALS || [],
      toISOKey:
        options?.toISOKey ||
        datetime.toISOKey ||
        ((d) => d.toISOString().slice(0, 16)),
      loadReservations: options?.loadReservations || store.loadReservations,
      saveReservations: options?.saveReservations || store.saveReservations,
      reservationsKey:
        options?.reservationsKey || constants.LS_KEYS?.RESERVATIONS || "vetestetica_reservas_v1",
      seededKey:
        options?.seededKey || constants.LS_KEYS?.SEEDED || "vetestetica_seeded_v1",
      idGenerator: options?.idGenerator || defaultIdGenerator,
      now: options?.now instanceof Date ? options.now : new Date(),
    };
  }

  // Calcula el siguiente dia habil aplicando un desplazamiento en dias.
  function nextBusinessDay(baseDate, offsetDays) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offsetDays);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
  }

  // Busca un servicio por id.
  function findService(services, id) {
    return services.find((s) => s.id === id);
  }

  // Busca un profesional por id.
  function findProfessional(professionals, id) {
    return professionals.find((p) => p.id === id);
  }

  // Construye un conjunto de reservas de ejemplo.
  function buildExamples(deps) {
    const d1 = nextBusinessDay(deps.now, 1);
    const d2 = nextBusinessDay(deps.now, 2);
    const d3 = nextBusinessDay(deps.now, 3);

    const svcVet = findService(deps.services, "vet_consulta");
    const svcGroom = findService(deps.services, "groom_full");

    const proVet1 = findProfessional(deps.professionals, "vet-1");
    const proVet2 = findProfessional(deps.professionals, "vet-2");
    const proVet3 = findProfessional(deps.professionals, "vet-3");
    const proGroom1 = findProfessional(deps.professionals, "groom-1");
    const proGroom2 = findProfessional(deps.professionals, "groom-2");
    const proGroom3 = findProfessional(deps.professionals, "groom-3");

    const nowTs = Date.now();

    return [
      {
        id: deps.idGenerator(),
        ownerName: "Ana Lopez",
        petName: "Milo",
        petType: "Perro",
        serviceId: svcGroom?.id || "groom_full",
        serviceLabel: svcGroom?.label || "Estetica completa",
        proType: "groom",
        proId: proGroom1?.id || "groom-1",
        proName: proGroom1?.name || "Valentina Rocha",
        phone: "099 111 222",
        email: "ana@mail.com",
        status: "active",
        startISO: deps.toISOKey(new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 10, 0)),
        createdAt: nowTs,
      },
      {
        id: deps.idGenerator(),
        ownerName: "Bruno Perez",
        petName: "Luna",
        petType: "Gato",
        serviceId: svcVet?.id || "vet_consulta",
        serviceLabel: svcVet?.label || "Consulta veterinaria",
        proType: "vet",
        proId: proVet2?.id || "vet-2",
        proName: proVet2?.name || "Dr. Martin Suarez",
        phone: "098 333 444",
        email: "",
        status: "active",
        startISO: deps.toISOKey(new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 11, 30)),
        createdAt: nowTs,
      },
      {
        id: deps.idGenerator(),
        ownerName: "Carla Gomez",
        petName: "Toby",
        petType: "Perro",
        serviceId: svcVet?.id || "vet_consulta",
        serviceLabel: svcVet?.label || "Consulta veterinaria",
        proType: "vet",
        proId: proVet1?.id || "vet-1",
        proName: proVet1?.name || "Dra. Lucia Pereira",
        phone: "097 222 555",
        email: "carla@mail.com",
        status: "active",
        startISO: deps.toISOKey(new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 9, 0)),
        createdAt: nowTs,
      },
      {
        id: deps.idGenerator(),
        ownerName: "Diego Silva",
        petName: "Nina",
        petType: "Gato",
        serviceId: svcGroom?.id || "groom_full",
        serviceLabel: svcGroom?.label || "Estetica completa",
        proType: "groom",
        proId: proGroom2?.id || "groom-2",
        proName: proGroom2?.name || "Camila Fernandez",
        phone: "096 555 666",
        email: "",
        status: "active",
        startISO: deps.toISOKey(new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 15, 0)),
        createdAt: nowTs,
      },
      {
        id: deps.idGenerator(),
        ownerName: "Elena Rodriguez",
        petName: "Simba",
        petType: "Perro",
        serviceId: svcGroom?.id || "groom_full",
        serviceLabel: svcGroom?.label || "Estetica completa",
        proType: "groom",
        proId: proGroom3?.id || "groom-3",
        proName: proGroom3?.name || "Agustina Silva",
        phone: "091 000 999",
        email: "elena@mail.com",
        status: "active",
        startISO: deps.toISOKey(new Date(d3.getFullYear(), d3.getMonth(), d3.getDate(), 12, 0)),
        createdAt: nowTs,
      },
      {
        id: deps.idGenerator(),
        ownerName: "Federico Nunez",
        petName: "Kira",
        petType: "Gato",
        serviceId: svcVet?.id || "vet_consulta",
        serviceLabel: svcVet?.label || "Consulta veterinaria",
        proType: "vet",
        proId: proVet3?.id || "vet-3",
        proName: proVet3?.name || "Dra. Sofia Mendez",
        phone: "095 222 111",
        email: "",
        status: "active",
        startISO: deps.toISOKey(new Date(d3.getFullYear(), d3.getMonth(), d3.getDate(), 16, 30)),
        createdAt: nowTs,
      },
    ];
  }

  // Carga datos semilla si aun no existen o si se fuerza la accion.
  function ensureSeedData(options) {
    const deps = resolveDependencies(options);
    if (!deps.storage || typeof deps.saveReservations !== "function") return false;

    const alreadySeeded = deps.storage.getItem(deps.seededKey) === "1";
    if (alreadySeeded && !options?.force) return false;

    const examples = buildExamples(deps);
    if (examples.length === 0) return false;

    deps.saveReservations(examples, deps.storage, deps.reservationsKey);
    deps.storage.setItem(deps.seededKey, "1");
    return true;
  }

  const api = { ensureSeedData, buildExamples };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  const root = global.VetCore || (global.VetCore = {});
  root.seed = root.seed || {};
  root.seed.seedReservations = api;
})(typeof window !== "undefined" ? window : globalThis);
