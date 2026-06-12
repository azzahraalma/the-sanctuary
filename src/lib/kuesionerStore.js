import { supabase } from "./supabase.js";

function isLegacyUxJawaban(j) {
  return j && typeof j === "object" && ("kemudahan" in j || "kejelasan" in j || "daya_tarik" in j);
}

function isLegacyRefleksiJawaban(j) {
  if (!j || typeof j !== "object") return false;
  if (j.refleksi || j.ux) return false;
  return Object.keys(j).some((k) => /^\d+$/.test(k));
}

function buildMergedJawaban(prev, { ux, refleksi }) {
  const j = prev ?? {};
  let uxOut = ux;
  let refleksiOut = refleksi;

  if (!uxOut) {
    if (j.ux) uxOut = j.ux;
    else if (isLegacyUxJawaban(j)) {
      uxOut = { kemudahan: j.kemudahan ?? {}, kejelasan: j.kejelasan ?? {}, daya_tarik: j.daya_tarik ?? {} };
    }
  }

  if (!refleksiOut) {
    if (j.refleksi) refleksiOut = j.refleksi;
    else if (isLegacyRefleksiJawaban(j)) {
      refleksiOut = { jawaban: j, skor: 0, kategori: null };
    }
  }

  const merged = {};
  if (uxOut) merged.ux = uxOut;
  if (refleksiOut) merged.refleksi = refleksiOut;
  return merged;
}

export function extractUxJawaban(jawaban) {
  const j = jawaban ?? {};
  if (j.ux) return j.ux;
  if (isLegacyUxJawaban(j)) {
    return { kemudahan: j.kemudahan ?? {}, kejelasan: j.kejelasan ?? {}, daya_tarik: j.daya_tarik ?? {} };
  }
  return { kemudahan: {}, kejelasan: {}, daya_tarik: {} };
}

export function extractRefleksi(row) {
  if (!row) return null;
  const j = row.jawaban ?? {};
  if (j.refleksi) return j.refleksi;
  if (isLegacyRefleksiJawaban(j)) {
    return { jawaban: j, skor: row.refleksi_skor ?? row.ux_score ?? 0, kategori: row.kategori_masalah };
  }
  return null;
}

export async function loadHasilKuesioner(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from("hasil_kuesioner")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) console.error("loadHasilKuesioner:", error.message);
  return data;
}

export async function saveUxKuesioner({ email, nama, uxScore, uxAnswers }) {
  const existing = await loadHasilKuesioner(email);
  const merged = buildMergedJawaban(existing?.jawaban, { ux: uxAnswers });

  const { error } = await supabase.from("hasil_kuesioner").upsert(
    [{
      email,
      nama,
      ux_score: uxScore,
      jawaban: merged,
      refleksi_skor: existing?.refleksi_skor ?? merged.refleksi?.skor ?? null,
      kategori_masalah: merged.refleksi?.kategori ?? existing?.kategori_masalah ?? null,
    }],
    { onConflict: "email" }
  );
  if (error) return { error };

  const calcMean = (obj) => {
    const vals = Object.values(obj || {}).filter(Boolean).map(Number);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const meanK  = calcMean(uxAnswers.kemudahan);
  const meanJ  = calcMean(uxAnswers.kejelasan);
  const meanDT = calcMean(uxAnswers.daya_tarik);

  const { error: respErr } = await supabase.from("data_responden").upsert(
    [{
      email,         
      nama,
      mean_kemudahan:  meanK,
      mean_kejelasan:  meanJ,
      mean_daya_tarik: meanDT,
    }],
    { onConflict: "email" } 
  );

  return { error: respErr };
}

export async function saveRefleksiKuesioner({ email, nama, jawaban, skor, kategori }) {
  const existing = await loadHasilKuesioner(email);
  const merged = buildMergedJawaban(existing?.jawaban, {
    refleksi: { jawaban, skor, kategori },
  });

  const { error } = await supabase.from("hasil_kuesioner").upsert(
    [{
      email,
      nama,
      ux_score: existing?.ux_score ?? 0,
      refleksi_skor: skor,
      kategori_masalah: kategori,
      jawaban: merged,
    }],
    { onConflict: "email" }
  );
  return { error };
}

export async function getRefleksiKategori(email) {
  const row = await loadHasilKuesioner(email);
  const ref = extractRefleksi(row);
  return ref?.kategori ?? row?.kategori_masalah ?? null;
}
