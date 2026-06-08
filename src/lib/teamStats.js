import { supabase } from "./supabase.js";

/** Agregat tim dari data_konselor — menggantikan analisis_konselor.js di runtime. */
export async function fetchTeamStats() {
  const { data, error } = await supabase
    .from("data_konselor")
    .select("rating_final, jumlah_kasus, kasus_selesai, success_rate");

  if (error || !data?.length) {
    return { ratingTim: 0, kasusTim: 0, probSukses: 0, konselorCount: 0, avgKasusSelesai: 0 };
  }

  const konselorCount = data.length;
  const ratingTim = data.reduce((s, k) => s + (Number(k.rating_final) || 0), 0) / konselorCount;
  const kasusTim = data.reduce((s, k) => s + (Number(k.kasus_selesai) || 0), 0);
  const probSukses = data.reduce((s, k) => s + (Number(k.success_rate) || 0), 0) / konselorCount;
  const avgKasusSelesai = kasusTim / konselorCount;

  return { ratingTim, kasusTim, probSukses, konselorCount, avgKasusSelesai };
}
