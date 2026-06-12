import { supabase } from "./supabase.js";
import { BOOKING_STATUS } from "./bookingStatus.js";

const DEFAULT_TARGETS = [
  { nama_target: "Latihan mindfulness harian", target_sesi: 4 },
  { nama_target: "Teknik grounding saat cemas", target_sesi: 4 },
  { nama_target: "Manajemen waktu akademik", target_sesi: 4 },
];

export async function ensureDefaultTargets(idMahasiswa) {
  if (!idMahasiswa) return;

  const { count } = await supabase
    .from("data_target")
    .select("*", { count: "exact", head: true })
    .eq("id_mahasiswa", idMahasiswa);

  if (count > 0) return;

  const rows = DEFAULT_TARGETS.map((t) => ({
    id_mahasiswa: idMahasiswa,
    nama_target: t.nama_target,
    target_sesi: t.target_sesi,
    sesi_terlalui: 0,
    status: BOOKING_STATUS.BERJALAN,
  }));

  const { error } = await supabase.from("data_target").insert(rows);
  if (error) console.warn("ensureDefaultTargets:", error.message);
}
