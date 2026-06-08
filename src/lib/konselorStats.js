import { supabase } from "./supabase.js";
import { isSelesai, isMenungguEvaluasi, normalizeStatus, BOOKING_STATUS } from "./bookingStatus.js";

function isDibatalkan(status) {
  return normalizeStatus(status) === BOOKING_STATUS.DIBATALKAN;
}

/** Sesi sudah dilaksanakan (menunggu evaluasi konselor atau fully selesai). */
function isKasusSelesai(status) {
  return isSelesai(status) || isMenungguEvaluasi(status);
}

/** Hitung statistik konselor dari booking & ulasan live. */
export async function computeKonselorStats(idKonselor) {
  const [{ data: bookings, error: bErr }, { data: ulasan, error: uErr }, { data: konselor }] = await Promise.all([
    supabase.from("booking").select("status").eq("id_konselor", idKonselor),
    supabase.from("ulasan_konselor").select("rating").eq("id_konselor", idKonselor),
    supabase.from("data_konselor").select("rating_final").eq("id", idKonselor).maybeSingle(),
  ]);

  if (bErr) console.warn("computeKonselorStats booking:", bErr.message);
  if (uErr && !uErr.message.includes("does not exist")) {
    console.warn("computeKonselorStats ulasan:", uErr.message);
  }

  const all = (bookings ?? []).filter((b) => !isDibatalkan(b.status));
  const total = all.length;
  const selesai = all.filter((b) => isKasusSelesai(b.status)).length;
  const successRate = total > 0 ? selesai / total : 0;

  const ratings = (ulasan ?? []).map((u) => Number(u.rating)).filter((r) => r >= 1 && r <= 5);
  const avgUlasan = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;

  const ratingFinal = avgUlasan ?? Number(konselor?.rating_final) ?? 0;

  return {
    rating_final: ratingFinal,
    jumlah_kasus: total,
    kasus_selesai: selesai,
    success_rate: successRate,
    jumlah_ulasan: ratings.length,
  };
}

/** Sinkronkan statistik live ke tabel data_konselor agar konsisten di seluruh app. */
export async function syncKonselorStats(idKonselor) {
  if (!idKonselor) return null;

  const stats = await computeKonselorStats(idKonselor);

  const { error } = await supabase
    .from("data_konselor")
    .update({
      jumlah_kasus: stats.jumlah_kasus,
      kasus_selesai: stats.kasus_selesai,
      success_rate: stats.success_rate,
      rating_final: stats.rating_final,
    })
    .eq("id", idKonselor);

  if (error) console.warn("syncKonselorStats:", error.message);
  return stats;
}
