const {
  filterReservations,
  countReservationsByType,
} = require("../../../src/core/reservations/filters.js");

const fixtures = [
  {
    id: "1",
    ownerName: "Ana",
    petName: "Milo",
    petType: "Perro",
    serviceLabel: "Consulta veterinaria",
    proName: "Dra. Lucia",
    phone: "099 111",
    email: "ana@mail.com",
    proType: "vet",
    startISO: "2026-02-10T09:00",
  },
  {
    id: "2",
    ownerName: "Bruno",
    petName: "Luna",
    petType: "Gato",
    serviceLabel: "Estetica completa",
    proName: "Valentina",
    phone: "098 222",
    email: "",
    proType: "groom",
    startISO: "2026-02-20T10:00",
  },
];

test("filterReservations filtra por servicio", () => {
  const result = filterReservations(fixtures, { service: "vet" });
  expect(result.map((x) => x.id)).toEqual(["1"]);
});

test("filterReservations filtra por fecha futura/pasada", () => {
  const now = new Date(2026, 1, 15, 12, 0, 0, 0);
  const future = filterReservations(fixtures, { dateFilter: "future", now });
  const past = filterReservations(fixtures, { dateFilter: "past", now });

  expect(future.map((x) => x.id)).toEqual(["2"]);
  expect(past.map((x) => x.id)).toEqual(["1"]);
});

test("filterReservations filtra por texto en cualquier campo", () => {
  const byOwner = filterReservations(fixtures, { query: "ana" });
  const byService = filterReservations(fixtures, { query: "estetica" });

  expect(byOwner.map((x) => x.id)).toEqual(["1"]);
  expect(byService.map((x) => x.id)).toEqual(["2"]);
});

test("countReservationsByType calcula total y subtotales", () => {
  expect(countReservationsByType(fixtures)).toEqual({
    total: 2,
    vet: 1,
    groom: 1,
  });
});
