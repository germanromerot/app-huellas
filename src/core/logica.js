"use strict";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseDateTime(dateStr, timeStr) {
  const partsDate = String(dateStr).split("-").map(Number);
  const partsTime = String(timeStr).split(":").map(Number);
  const y = partsDate[0];
  const m = partsDate[1];
  const d = partsDate[2];
  const hh = partsTime[0];
  const mm = partsTime[1];
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function toISOKey(dateObj) {
  return (
    dateObj.getFullYear() +
    "-" +
    pad2(dateObj.getMonth() + 1) +
    "-" +
    pad2(dateObj.getDate()) +
    "T" +
    pad2(dateObj.getHours()) +
    ":" +
    pad2(dateObj.getMinutes())
  );
}

function formatNice(dateObj) {
  const d = pad2(dateObj.getDate());
  const m = pad2(dateObj.getMonth() + 1);
  const y = dateObj.getFullYear();
  const hh = pad2(dateObj.getHours());
  const mm = pad2(dateObj.getMinutes());
  return d + "/" + m + "/" + y + " " + hh + ":" + mm;
}

function sortReservations(items) {
  return items
    .slice()
    .sort((a, b) => (a.startISO < b.startISO ? -1 : a.startISO > b.startISO ? 1 : 0));
}

function isOpenHours(dateObj) {
  const day = dateObj.getDay();
  const minutes = dateObj.getHours() * 60 + dateObj.getMinutes();

  if (day === 0) return false;
  if (day >= 1 && day <= 5) {
    const open = 9 * 60;
    const close = 18 * 60;
    return minutes >= open && minutes <= close - 30;
  }

  const openSat = 9 * 60;
  const closeSat = 12 * 60 + 30;
  return minutes >= openSat && minutes <= closeSat - 30;
}

function isHalfHourStep(timeStr) {
  const mm = Number(String(timeStr).split(":")[1] || 0);
  return mm === 0 || mm === 30;
}

function hasOverlap(existing, candidate) {
  return existing.some((r) => r.proId === candidate.proId && r.startISO === candidate.startISO);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const exported = {
  pad2,
  parseDateTime,
  toISOKey,
  formatNice,
  sortReservations,
  isOpenHours,
  isHalfHourStep,
  hasOverlap,
  escapeHtml,
};

if (typeof module !== "undefined") {
  module.exports = exported;
}
