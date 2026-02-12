const {
  pad2,
  parseDateTime,
  toISOKey,
  formatNice,
  sortReservations,
  isOpenHours,
  isHalfHourStep,
  hasOverlap,
  escapeHtml,
} = require("../src/core/logica.js");

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

test("toISOKey serializa Date en formato YYYY-MM-DDTHH:MM", () => {
  const d = new Date(2026, 1, 12, 9, 5, 0, 0);
  expect(toISOKey(d)).toBe("2026-02-12T09:05");
});

test("formatNice devuelve formato DD/MM/YYYY HH:MM", () => {
  const d = new Date(2026, 1, 12, 9, 5, 0, 0);
  expect(formatNice(d)).toBe("12/02/2026 09:05");
});

test("sortReservations ordena por startISO ascendente sin mutar original", () => {
  const items = [
    { id: "2", startISO: "2026-02-12T11:00" },
    { id: "1", startISO: "2026-02-12T09:30" },
    { id: "3", startISO: "2026-02-12T10:00" },
  ];
  const sorted = sortReservations(items);

  expect(sorted.map((x) => x.id)).toEqual(["1", "3", "2"]);
  expect(items.map((x) => x.id)).toEqual(["2", "1", "3"]);
});

test("isOpenHours valida horario de apertura", () => {
  const mondayOpen = new Date(2026, 1, 9, 9, 0, 0, 0);
  const mondayClosed = new Date(2026, 1, 9, 18, 0, 0, 0);
  const sundayClosed = new Date(2026, 1, 8, 10, 0, 0, 0);

  expect(isOpenHours(mondayOpen)).toBe(true);
  expect(isOpenHours(mondayClosed)).toBe(false);
  expect(isOpenHours(sundayClosed)).toBe(false);
});

test("isHalfHourStep acepta solo minutos 00 o 30", () => {
  expect(isHalfHourStep("09:00")).toBe(true);
  expect(isHalfHourStep("09:30")).toBe(true);
  expect(isHalfHourStep("09:15")).toBe(false);
});

test("hasOverlap detecta choque por profesional y horario", () => {
  const existing = [
    { proId: "vet-1", startISO: "2026-02-12T09:00" },
    { proId: "vet-2", startISO: "2026-02-12T09:00" },
  ];
  const overlap = { proId: "vet-1", startISO: "2026-02-12T09:00" };
  const noOverlap = { proId: "vet-1", startISO: "2026-02-12T09:30" };

  expect(hasOverlap(existing, overlap)).toBe(true);
  expect(hasOverlap(existing, noOverlap)).toBe(false);
});

test("escapeHtml escapa caracteres especiales HTML", () => {
  const input = `<div class="x">Tom & Jerry's</div>`;
  const output = escapeHtml(input);
  expect(output).toBe("&lt;div class=&quot;x&quot;&gt;Tom &amp; Jerry&#039;s&lt;/div&gt;");
});
