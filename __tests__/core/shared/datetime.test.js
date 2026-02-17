const {
  pad2,
  parseDateTime,
  parseISOKey,
  toISOKey,
  formatNice,
  formatHM,
  getDateOnlyKey,
} = require("../../../src/core/shared/datetime.js");

test("pad2 agrega cero a la izquierda cuando corresponde", () => {
  expect(pad2(5)).toBe("05");
  expect(pad2(12)).toBe("12");
});

test("parseDateTime crea fecha/hora local correcta", () => {
  const d = parseDateTime("2026-02-12", "09:30");
  expect(d.getFullYear()).toBe(2026);
  expect(d.getMonth()).toBe(1);
  expect(d.getDate()).toBe(12);
  expect(d.getHours()).toBe(9);
  expect(d.getMinutes()).toBe(30);
});

test("parseISOKey parsea YYYY-MM-DDTHH:MM", () => {
  const d = parseISOKey("2026-03-01T18:05");
  expect(d.getFullYear()).toBe(2026);
  expect(d.getMonth()).toBe(2);
  expect(d.getDate()).toBe(1);
  expect(d.getHours()).toBe(18);
  expect(d.getMinutes()).toBe(5);
});

test("parseISOKey devuelve Date invalido cuando formato no coincide", () => {
  const d = parseISOKey("invalido");
  expect(Number.isNaN(d.getTime())).toBe(true);
});

test("toISOKey serializa Date en formato YYYY-MM-DDTHH:MM", () => {
  const d = new Date(2026, 1, 12, 9, 5, 0, 0);
  expect(toISOKey(d)).toBe("2026-02-12T09:05");
});

test("formatNice devuelve formato DD/MM/YYYY HH:MM", () => {
  const d = new Date(2026, 1, 12, 9, 5, 0, 0);
  expect(formatNice(d)).toBe("12/02/2026 09:05");
});

test("formatHM convierte minutos totales a HH:MM", () => {
  expect(formatHM(9 * 60)).toBe("09:00");
  expect(formatHM(17 * 60 + 30)).toBe("17:30");
});

test("getDateOnlyKey devuelve YYYY-MM-DD", () => {
  const d = new Date(2026, 9, 7, 20, 45, 0, 0);
  expect(getDateOnlyKey(d)).toBe("2026-10-07");
});
