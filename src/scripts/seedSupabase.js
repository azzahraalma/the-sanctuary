import { supabase } from "../lib/supabase.js";
import data_konselor from "../data/data_konselor.js";
import data_booking from "../data/data_booking.js";
import { DUMMY_USERS } from "../data/users.js";
import progress_responden from "../data/progress_responden.js";
import data_target from "../data/data_target.js";
import data_responden from "../data/data_responden.js";
import analisis_statistik from "../data/analisis_statistik.js";
import { normalizeStatus, BOOKING_STATUS } from "../lib/bookingStatus.js";

function toIsoDate(value) {
  if (value == null) return null;
  if (typeof value === "number") return new Date(value).toISOString();
  return value;
}

const DEFAULT_PERTANYAAN = [
  { kategori: "kemudahan", urutan: 1, teks: "Website mudah digunakan untuk kebutuhan konseling" },
  { kategori: "kemudahan", urutan: 2, teks: "Navigasi menu terasa intuitif" },
  { kategori: "kemudahan", urutan: 3, teks: "Proses booking sesi tidak membingungkan" },
  { kategori: "kejelasan", urutan: 1, teks: "Informasi konselor ditampilkan dengan jelas" },
  { kategori: "kejelasan", urutan: 2, teks: "Status sesi dan progress mudah dipahami" },
  { kategori: "kejelasan", urutan: 3, teks: "Bahasa dan petunjuk di website jelas" },
  { kategori: "daya_tarik", urutan: 1, teks: "Tampilan website menenangkan dan nyaman" },
  { kategori: "daya_tarik", urutan: 2, teks: "Warna dan layout mendukung suasana healing" },
  { kategori: "daya_tarik", urutan: 3, teks: "Secara keseluruhan website terasa menarik" },
];

function buildBookingKonselorLookup() {
  const map = {};
  data_booking.forEach((b) => {
    if (!b.ID_Mahasiswa || b.Sesi_Konseling == null) return;
    map[`${b.ID_Mahasiswa}_${b.Sesi_Konseling}`] = b.ID_Konselor;
  });
  return map;
}

export async function seedAll() {
  const konselorRows = data_konselor.map((k) => ({
    id: k.ID,
    nama: k.Nama,
    kategori_masalah: k.Kategori_Masalah,
    pengalaman: k.Pengalaman,
    rating_final: k["Rating_(Final)"],
    keramahan: k["Keramahan_(30%)"],
    solusi: k["Solusi_(50%)"],
    respon: k["Respon_(20%)"],
    jumlah_kasus: k.Jumlah_Kasus,
    kasus_selesai: k.Kasus_Selesai,
    success_rate: k["Success_Rate"],
    image_url: k.image,
  }));

  const { error: e1 } = await supabase.from("data_konselor").upsert(konselorRows);
  if (e1) console.error("Konselor:", e1.message);
  else console.log("Konselor selesai!");

  const bookingRows = data_booking
    .filter((b) => b.ID_Booking !== null)
    .map((b) => ({
      id: b.ID_Booking,
      id_konselor: b.ID_Konselor,
      id_mahasiswa: b.ID_Mahasiswa,
      nama_mahasiswa: b.Nama_Mahasiswa,
      kategori_masalah: b.Kategori_Masalah,
      tanggal_sesi: toIsoDate(b.Tanggal_Sesi),
      sesi_konseling: b.Sesi_Konseling,
      status: normalizeStatus(b.Status),
      kondisi_awal: b.Kondisi_Awal,
      kondisi_saat_ini: b.Kondisi_Saat_Ini,
    }));

  const { error: e2 } = await supabase.from("booking").upsert(bookingRows);
  if (e2) console.error("Booking:", e2.message);
  else console.log("Booking selesai!");

  const userRows = DUMMY_USERS.map((u) => ({
    email: u.email,
    nama: u.name ?? u.nama,
    role: u.role === "user" ? "mahasiswa" : u.role,
    konselor_id: u.konselorId ?? null,
  }));

  const { error: e3 } = await supabase.from("profil_pengguna").upsert(userRows, { onConflict: "email" });
  if (e3) console.error("Profil akun demo:", e3.message);
  else console.log("Profil akun demo selesai!");

  const studentProfiles = data_responden.map((r) => ({
    email: `${String(r.ID_Mahasiswa).toLowerCase()}@sanctuary.student`,
    nama: r.Nama,
    role: "mahasiswa",
    student_id: r.ID_Mahasiswa,
    nim: r.NIM != null ? String(r.NIM) : null,
  }));

  const { error: e3b } = await supabase.from("profil_pengguna").upsert(studentProfiles, { onConflict: "email" });
  if (e3b) console.error("Profil mahasiswa:", e3b.message);
  else console.log("Profil mahasiswa selesai!");

  const bookingLookup = buildBookingKonselorLookup();
  const progressRows = progress_responden.map((p) => ({
    id_mahasiswa: p.ID_Mahasiswa,
    id_konselor: bookingLookup[`${p.ID_Mahasiswa}_${p.Sesi_Konseling}`] ?? null,
    sesi_konseling: p.Sesi_Konseling,
    tanggal: toIsoDate(p.Tanggal),
    kondisi_terkini: p.Kondisi_Terkini,
    kategori_masalah: p.Kategori_Masalah,
    status: normalizeStatus(p.Status),
    suasana_hati: p.Suasana_Hati,
    mindfulness: p.Mindfulness,
    manajemen_stres: p.Manajemen_Stres,
    ketahanan_diri: p.Ketahanan_Diri,
    hubungan_sosial: p.Hubungan_Sosial,
    keseimbangan_hidup: p.Keseimbangan_Hidup,
    skor_kesejahteraan: p.Skor_Kesejahteraan,
    skor_keterbukaan: p.Skor_Keterbukaan,
    skor_kemajuan: p.Skor_Kemajuan,
    skor_konsistensi: p.Skor_Konsistensi,
    sesi_tercapai: p.Sesi_Tercapai,
  }));

  const { error: e4 } = await supabase.from("progress_konseling").upsert(progressRows);
  if (e4) console.error("Progress:", e4.message);
  else console.log("Progress konseling selesai!");

  const targetRows = data_target.map((t) => ({
    id_mahasiswa: t.ID_Mahasiswa,
    nama_target: t.Nama_Target,
    target_sesi: t.Target_Sesi,
    sesi_terlalui: t.Sesi_Terlalui,
    status: normalizeStatus(t.Status),
    catatan_untuk_user: t.Catatan_Untuk_User,
  }));

  const { error: e5 } = await supabase.from("data_target").upsert(targetRows);
  if (e5) console.error("Data target:", e5.message);
  else console.log("Data target selesai!");

  const respondenRows = data_responden.map((r) => ({
    id_mahasiswa: r.ID_Mahasiswa,
    nama: r.Nama,
    nim: r.NIM,
    angkatan: r.Angkatan,
    k1: r.K1, k2: r.K2, k3: r.K3,
    j1: r.J1, j2: r.J2, j3: r.J3,
    dt1: r.DT1, dt2: r.DT2, dt3: r.DT3,
    mean_total_kemudahan: r["Mean_Total_Kemudahan_(K)"],
    mean_total_kejelasan: r["Mean_Total_Kejelasan_(J)"],
    mean_total_daya_tarik: r["Mean_Total_Daya_Tarik_(DT)"],
    pembulatan_k: r["Pembulatan_(K)"],
    pembulatan_j: r["Pembulatan_(J)"],
    pembulatan_dt: r["Pembulatan_(DT)"],
    keterangan: r.Keterangan,
  }));

  const { error: e6 } = await supabase.from("data_responden").upsert(respondenRows);
  if (e6) console.error("Data responden:", e6.message);
  else console.log("Data responden selesai!");

  const statsRows = analisis_statistik.map((s) => ({
    metrik_statistik: s.Metrik_Statistik?.trim(),
    kemudahan: s.Kemudahan,
    kejelasan: s.Kejelasan,
    daya_tarik: s.Daya_Tarik,
    deskripsi_untuk_front_end: s["Deskripsi_Untuk_Front-End"],
  }));

  const { error: e7 } = await supabase.from("analisis_statistik").upsert(statsRows);
  if (e7) console.error("Analisis statistik:", e7.message);
  else console.log("Analisis statistik selesai!");

  const { error: e8 } = await supabase.from("pertanyaan_kuesioner").upsert(DEFAULT_PERTANYAAN);
  if (e8) console.error("Pertanyaan kuesioner:", e8.message);
  else console.log("Pertanyaan kuesioner selesai!");

  const today = new Date();
  const slotRows = [];
  data_konselor.forEach((k) => {
    for (let d = 1; d <= 14; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      if (date.getDay() === 0) continue;
      const tanggal = date.toISOString().split("T")[0];
      slotRows.push({
        konselor_id: k.ID,
        tanggal,
        jam_mulai: "10:00",
        jam_selesai: "11:00",
        status: "tersedia",
      });
      slotRows.push({
        konselor_id: k.ID,
        tanggal,
        jam_mulai: "14:00",
        jam_selesai: "15:00",
        status: "tersedia",
      });
    }
  });

  const { error: e9 } = await supabase.from("konselor_availability").insert(slotRows);
  if (e9) console.error("Konselor availability:", e9.message);
  else console.log("Konselor availability selesai!");

  console.log("Seed selesai. Status booking dinormalisasi ke:", BOOKING_STATUS);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  seedAll().catch(console.error);
}
