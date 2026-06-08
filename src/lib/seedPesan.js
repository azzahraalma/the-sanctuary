import { supabase } from "./supabase.js";
import { isAktif, isSelesai } from "./bookingStatus.js";

export async function seedPesan(email, firstName, bookings, konselorData) {
  const { data: existing } = await supabase
    .from("pesan")
    .select("tipe")
    .eq("id_penerima", email);

  const tipeYangAda = new Set((existing ?? []).map((p) => p.tipe));
  const toInsert = [];

  if (!tipeYangAda.has("welcome")) {
    toInsert.push({
      id_penerima: email,
      id_pengirim: "sanctuary-team",
      nama_pengirim: "The Sanctuary Team",
      foto_pengirim: null,
      teks: `Halo ${firstName}! Senang kamu bergabung di Sanctuary. Gimana kabarmu hari ini? Kami selalu ada buat mendengarkan`,
      dibaca: false,
      tipe: "welcome",
    });
  }

  for (const k of konselorData ?? []) {
    const bksForKonselor = bookings
      .filter((b) => b.id_konselor === k.id)
      .sort((a, b) => new Date(b.tanggal_sesi) - new Date(a.tanggal_sesi));
    const bk = bksForKonselor[0];
    if (!bk) continue;

    if (isSelesai(bk.status)) {
      const tipe = `pasca_sesi_${bk.id ?? k.id}`;
      if (!tipeYangAda.has(tipe)) {
        toInsert.push({
          id_penerima: email,
          id_pengirim: k.id,
          nama_pengirim: k.nama,
          foto_pengirim: k.foto_url ?? null,
          teks: `Sesi ${bk.sesi_konseling} kita udah selesai ya ${firstName}! Gimana perasaanmu sekarang? Semangat terus, kamu udah berani cerita`,
          dibaca: false,
          tipe,
        });
      }
    } else if (isAktif(bk.status)) {
      const tipe = `pengingat_sesi_${bk.id ?? k.id}`;
      if (!tipeYangAda.has(tipe)) {
        const tglSesi = new Date(bk.tanggal_sesi).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long",
        });
        toInsert.push({
          id_penerima: email,
          id_pengirim: k.id,
          nama_pengirim: k.nama,
          foto_pengirim: k.foto_url ?? null,
          teks: `Hai ${firstName}! Jangan lupa sesi kita ${tglSesi} ya Siapkan dirimu, aku siap mendengarkan`,
          dibaca: false,
          tipe,
        });
      }
    }
  }

  if (!tipeYangAda.has("motivasi")) {
    toInsert.push({
      id_penerima: email,
      id_pengirim: "sanctuary-team",
      nama_pengirim: "The Sanctuary Team",
      foto_pengirim: null,
      teks: "Makasih udah jadi bagian dari Sanctuary, Semoga hari-harimu terasa lebih ringan.",
      dibaca: false,
      tipe: "motivasi",
    });
  }

  if (toInsert.length > 0) {
    await supabase.from("pesan").insert(toInsert);
  }
}
