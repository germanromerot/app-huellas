const { sortReservationsByStartISO } = require("../../../src/core/shared/sort.js");

test("sortReservationsByStartISO ordena por startISO ascendente sin mutar original", () => {
  const items = [
    { id: "2", startISO: "2026-02-12T11:00" },
    { id: "1", startISO: "2026-02-12T09:30" },
    { id: "3", startISO: "2026-02-12T10:00" },
  ];

  const sorted = sortReservationsByStartISO(items);

  expect(sorted.map((x) => x.id)).toEqual(["1", "3", "2"]);
  expect(items.map((x) => x.id)).toEqual(["2", "1", "3"]);
});
