const { hasOverlap } = require("../../../src/core/reservations/overlap.js");

function getDurationByServiceId(serviceId) {
  const map = {
    vet_consulta: 30,
    groom_full: 60,
  };
  return map[serviceId] || 30;
}

test("hasOverlap detecta solapamiento exacto del mismo profesional", () => {
  const existing = [{ proId: "vet-1", serviceId: "vet_consulta", startISO: "2026-02-12T09:00" }];
  const candidate = { proId: "vet-1", serviceId: "vet_consulta", startISO: "2026-02-12T09:00" };

  expect(hasOverlap(existing, candidate, getDurationByServiceId)).toBe(true);
});

test("hasOverlap detecta solapamiento por duracion", () => {
  const existing = [{ proId: "groom-1", serviceId: "groom_full", startISO: "2026-02-12T09:00" }]; // 60 min
  const candidate = { proId: "groom-1", serviceId: "vet_consulta", startISO: "2026-02-12T09:30" }; // 30 min

  expect(hasOverlap(existing, candidate, getDurationByServiceId)).toBe(true);
});

test("hasOverlap no marca choque con profesional distinto", () => {
  const existing = [{ proId: "vet-2", serviceId: "vet_consulta", startISO: "2026-02-12T09:00" }];
  const candidate = { proId: "vet-1", serviceId: "vet_consulta", startISO: "2026-02-12T09:00" };

  expect(hasOverlap(existing, candidate, getDurationByServiceId)).toBe(false);
});

test("hasOverlap ignora reservas canceladas", () => {
  const existing = [
    {
      proId: "vet-1",
      serviceId: "vet_consulta",
      startISO: "2026-02-12T09:00",
      status: "cancelled",
    },
  ];
  const candidate = { proId: "vet-1", serviceId: "vet_consulta", startISO: "2026-02-12T09:00" };

  expect(hasOverlap(existing, candidate, getDurationByServiceId)).toBe(false);
});

test("hasOverlap devuelve false si el candidato ya esta cancelado", () => {
  const existing = [{ proId: "vet-1", serviceId: "vet_consulta", startISO: "2026-02-12T09:00" }];
  const candidate = {
    proId: "vet-1",
    serviceId: "vet_consulta",
    startISO: "2026-02-12T09:00",
    status: "cancelled",
  };

  expect(hasOverlap(existing, candidate, getDurationByServiceId)).toBe(false);
});
