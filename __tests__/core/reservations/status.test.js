const {
  normalizeStatus,
  isCancelled,
  cancelReservationById,
} = require("../../../src/core/reservations/status.js");

test("normalizeStatus asigna active cuando falta status", () => {
  const reservation = { id: "1", ownerName: "Ana" };
  expect(normalizeStatus(reservation)).toEqual({
    id: "1",
    ownerName: "Ana",
    status: "active",
  });
});

test("isCancelled devuelve true solo para status cancelled", () => {
  expect(isCancelled({ status: "cancelled" })).toBe(true);
  expect(isCancelled({ status: "active" })).toBe(false);
  expect(isCancelled({})).toBe(false);
});

test("cancelReservationById cancela solo el id indicado", () => {
  const reservations = [
    { id: "1", status: "active" },
    { id: "2", status: "active" },
  ];

  const result = cancelReservationById(reservations, "2", 1800000000000);

  expect(result).toEqual([
    { id: "1", status: "active" },
    { id: "2", status: "cancelled", cancelledAt: 1800000000000 },
  ]);
});

test("cancelReservationById no altera reservas ya canceladas", () => {
  const reservations = [{ id: "1", status: "cancelled", cancelledAt: 1000 }];
  const result = cancelReservationById(reservations, "1", 2000);

  expect(result).toEqual([{ id: "1", status: "cancelled", cancelledAt: 1000 }]);
});
