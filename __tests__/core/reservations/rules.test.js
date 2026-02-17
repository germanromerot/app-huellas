const {
  isOpenHours,
  isHalfHourStep,
  isPetTypeAllowed,
  hasRequiredBookingFields,
  isFutureDate,
  doesProfessionalMatchService,
} = require("../../../src/core/reservations/rules.js");

test("isOpenHours valida horario en semana y sabado", () => {
  const weekdayOpen = new Date(2026, 1, 9, 9, 0, 0, 0);
  const weekdayCloseBoundaryFail = new Date(2026, 1, 9, 17, 30, 0, 0);
  const saturdayOpen = new Date(2026, 1, 14, 11, 30, 0, 0);
  const sundayClosed = new Date(2026, 1, 8, 10, 0, 0, 0);

  expect(isOpenHours(weekdayOpen, 30)).toBe(true);
  expect(isOpenHours(weekdayCloseBoundaryFail, 60)).toBe(false);
  expect(isOpenHours(saturdayOpen, 60)).toBe(true);
  expect(isOpenHours(sundayClosed, 30)).toBe(false);
});

test("isHalfHourStep acepta solo minutos 00 o 30", () => {
  expect(isHalfHourStep("09:00")).toBe(true);
  expect(isHalfHourStep("09:30")).toBe(true);
  expect(isHalfHourStep("09:15")).toBe(false);
});

test("isPetTypeAllowed valida tipos permitidos", () => {
  expect(isPetTypeAllowed("Perro")).toBe(true);
  expect(isPetTypeAllowed("Gato")).toBe(true);
  expect(isPetTypeAllowed("Conejo")).toBe(false);
});

test("hasRequiredBookingFields valida campos obligatorios", () => {
  const ok = {
    ownerName: "Ana",
    petName: "Milo",
    petType: "Perro",
    serviceId: "vet_consulta",
    proId: "vet-1",
    dateStr: "2026-02-12",
    timeStr: "09:00",
    phone: "099 123 456",
  };

  const bad = { ...ok, phone: " " };

  expect(hasRequiredBookingFields(ok)).toBe(true);
  expect(hasRequiredBookingFields(bad)).toBe(false);
});

test("isFutureDate compara contra now inyectado", () => {
  const nowTs = new Date(2026, 1, 10, 10, 0, 0, 0).getTime();
  const future = new Date(2026, 1, 10, 10, 30, 0, 0);
  const past = new Date(2026, 1, 10, 9, 0, 0, 0);

  expect(isFutureDate(future, nowTs)).toBe(true);
  expect(isFutureDate(past, nowTs)).toBe(false);
});

test("doesProfessionalMatchService valida compatibilidad profesional/servicio", () => {
  const proVet = { id: "vet-1", type: "vet" };
  const proGroom = { id: "groom-1", type: "groom" };
  const svcVet = { id: "vet_consulta", proType: "vet" };

  expect(doesProfessionalMatchService(proVet, svcVet)).toBe(true);
  expect(doesProfessionalMatchService(proGroom, svcVet)).toBe(false);
});
