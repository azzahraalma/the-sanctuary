/** Status booking — selalu lowercase di DB baru; helper mendukung data legacy. */

export const BOOKING_STATUS = {
  TERJADWAL: "terjadwal",
  BERJALAN: "berjalan",
  MENUNGGU_EVALUASI: "menunggu_evaluasi",
  SELESAI: "selesai",
  DIBATALKAN: "dibatalkan",
};

const LEGACY_MAP = {
  terjadwal: BOOKING_STATUS.TERJADWAL,
  Terjadwal: BOOKING_STATUS.TERJADWAL,
  berjalan: BOOKING_STATUS.BERJALAN,
  Berjalan: BOOKING_STATUS.BERJALAN,
  aktif: BOOKING_STATUS.BERJALAN,
  Aktif: BOOKING_STATUS.BERJALAN,
  menunggu_evaluasi: BOOKING_STATUS.MENUNGGU_EVALUASI,
  selesai: BOOKING_STATUS.SELESAI,
  Selesai: BOOKING_STATUS.SELESAI,
  dibatalkan: BOOKING_STATUS.DIBATALKAN,
  Dibatalkan: BOOKING_STATUS.DIBATALKAN,
};

export function normalizeStatus(status) {
  if (!status) return "";
  return LEGACY_MAP[status] ?? String(status).toLowerCase();
}

export function isSelesai(status) {
  return normalizeStatus(status) === BOOKING_STATUS.SELESAI;
}

export function isBerjalan(status) {
  return normalizeStatus(status) === BOOKING_STATUS.BERJALAN;
}

export function isTerjadwal(status) {
  return normalizeStatus(status) === BOOKING_STATUS.TERJADWAL;
}

export function isMenungguEvaluasi(status) {
  return normalizeStatus(status) === BOOKING_STATUS.MENUNGGU_EVALUASI;
}

export function isAktif(status) {
  const s = normalizeStatus(status);
  return (
    s === BOOKING_STATUS.TERJADWAL ||
    s === BOOKING_STATUS.BERJALAN ||
    s === BOOKING_STATUS.MENUNGGU_EVALUASI
  );
}

export function statusLabel(status) {
  const s = normalizeStatus(status);
  const labels = {
    [BOOKING_STATUS.TERJADWAL]: "Terjadwal",
    [BOOKING_STATUS.BERJALAN]: "Berjalan",
    [BOOKING_STATUS.MENUNGGU_EVALUASI]: "Menunggu Evaluasi",
    [BOOKING_STATUS.SELESAI]: "Selesai",
    [BOOKING_STATUS.DIBATALKAN]: "Dibatalkan",
  };
  return labels[s] ?? status ?? "—";
}
