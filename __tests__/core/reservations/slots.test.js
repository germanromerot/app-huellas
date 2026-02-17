const {
  buildSlotsForDate,
  getReservedStartTimesForDate,
} = require("../../../src/core/reservations/slots.js");

test("buildSlotsForDate genera slots en dia habil", () => {
  const slots = buildSlotsForDate("2026-02-09", 30); // lunes
  expect(slots.length).toBe(18);
  expect(slots[0]).toEqual({ startMin: 540, endMin: 570 });
  expect(slots[17]).toEqual({ startMin: 1050, endMin: 1080 });
});

test("buildSlotsForDate retorna [] en domingo", () => {
  const slots = buildSlotsForDate("2026-02-08", 30); // domingo
  expect(slots).toEqual([]);
});

test("buildSlotsForDate en sabado respeta cierre 12:30", () => {
  const slots = buildSlotsForDate("2026-02-14", 60); // sabado
  expect(slots).toEqual([
    { startMin: 540, endMin: 600 },
    { startMin: 600, endMin: 660 },
    { startMin: 660, endMin: 720 },
  ]);
});

test("getReservedStartTimesForDate filtra por fecha, profesional y estado", () => {
  const reservations = [
    { proId: "vet-1", startISO: "2026-02-12T09:00", status: "active" },
    { proId: "vet-1", startISO: "2026-02-12T09:30", status: "cancelled" },
    { proId: "vet-2", startISO: "2026-02-12T10:00", status: "active" },
    { proId: "vet-1", startISO: "2026-02-13T11:00", status: "active" },
  ];

  const allPros = getReservedStartTimesForDate(reservations, "2026-02-12");
  const onlyVet1 = getReservedStartTimesForDate(reservations, "2026-02-12", "vet-1");

  expect(Array.from(allPros)).toEqual(["09:00", "10:00"]);
  expect(Array.from(onlyVet1)).toEqual(["09:00"]);
});
