import { supabase } from "./supabase.js";
import { isMenungguEvaluasi, isSelesai, normalizeStatus } from "./bookingStatus.js";

const REVIEWABLE_STATUSES = ["selesai", "menunggu_evaluasi"];

export function isReviewableBooking(status) {
  const s = normalizeStatus(status);
  return isSelesai(status) || isMenungguEvaluasi(status) || REVIEWABLE_STATUSES.includes(s);
}

export async function fetchUlasanByKonselor(idKonselor) {
  const { data, error } = await supabase
    .from("ulasan_konselor")
    .select("*")
    .eq("id_konselor", idKonselor)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("fetchUlasanByKonselor:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPendingUlasanBooking(idKonselor, idMahasiswa) {
  if (!idKonselor || !idMahasiswa) return null;

  const { data: bookings, error: bErr } = await supabase
    .from("booking")
    .select("id, sesi_konseling, tanggal_sesi, status, id_konselor")
    .eq("id_konselor", idKonselor)
    .eq("id_mahasiswa", idMahasiswa);

  if (bErr || !bookings?.length) return null;

  const reviewable = bookings.filter((b) => isReviewableBooking(b.status));
  if (!reviewable.length) return null;

  const { data: existing, error: uErr } = await supabase
    .from("ulasan_konselor")
    .select("id_booking")
    .eq("id_konselor", idKonselor)
    .eq("id_mahasiswa", idMahasiswa);

  if (uErr) {
    console.warn("getPendingUlasanBooking:", uErr.message);
    return reviewable.sort((a, b) => new Date(b.tanggal_sesi) - new Date(a.tanggal_sesi))[0] ?? null;
  }

  const reviewed = new Set((existing ?? []).map((u) => u.id_booking));
  return (
    reviewable
      .filter((b) => !reviewed.has(b.id))
      .sort((a, b) => new Date(b.tanggal_sesi) - new Date(a.tanggal_sesi))[0] ?? null
  );
}

export async function submitUlasan({
  idBooking,
  idKonselor,
  idMahasiswa,
  emailMahasiswa,
  namaMahasiswa,
  rating,
  teks,
}) {
  const { data, error } = await supabase
    .from("ulasan_konselor")
    .insert({
      id_booking: idBooking,
      id_konselor: idKonselor,
      id_mahasiswa: idMahasiswa,
      email_mahasiswa: emailMahasiswa,
      nama_mahasiswa: namaMahasiswa,
      rating,
      teks: teks.trim(),
    })
    .select()
    .single();

  return { data, error };
}

export function mapUlasanToDisplay(row) {
  return {
    id: row.id,
    nama: row.nama_mahasiswa,
    peran: "Mahasiswa",
    rating: Number(row.rating) || 5,
    teks: row.teks,
    createdAt: row.created_at,
  };
}
