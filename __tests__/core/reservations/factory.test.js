const { createReservation } = require("../../../src/core/reservations/factory.js");

test("createReservation construye una reserva normalizada", () => {
  const reservation = createReservation(
    {
      ownerName: "Ana",
      petName: "Milo",
      petType: "Perro",
      service: { id: "vet_consulta", label: "Consulta veterinaria", proType: "vet" },
      professional: { id: "vet-1", name: "Dra. Lucia Pereira" },
      phone: "099 123 456",
      email: "ana@mail.com",
      startDate: new Date(2026, 1, 12, 9, 0, 0, 0),
    },
    {
      nowTs: 1800000000000,
      idGenerator: () => "id-fixed",
      toISOKey: () => "2026-02-12T09:00",
    }
  );

  expect(reservation).toEqual({
    id: "id-fixed",
    ownerName: "Ana",
    petName: "Milo",
    petType: "Perro",
    serviceId: "vet_consulta",
    serviceLabel: "Consulta veterinaria",
    proType: "vet",
    proId: "vet-1",
    proName: "Dra. Lucia Pereira",
    phone: "099 123 456",
    email: "ana@mail.com",
    startISO: "2026-02-12T09:00",
    createdAt: 1800000000000,
    status: "active",
  });
});

test("createReservation asigna email vacio cuando no viene dato", () => {
  const reservation = createReservation(
    {
      ownerName: "Bruno",
      petName: "Luna",
      petType: "Gato",
      service: { id: "groom_full", label: "Estetica completa", proType: "groom" },
      professional: { id: "groom-1", name: "Valentina Rocha" },
      phone: "098 111 222",
      startDate: new Date(2026, 1, 12, 10, 0, 0, 0),
    },
    {
      nowTs: 1800000000100,
      idGenerator: () => "id-fixed-2",
      toISOKey: () => "2026-02-12T10:00",
    }
  );

  expect(reservation.email).toBe("");
});
