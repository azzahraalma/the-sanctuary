const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : "https://ovsmatuebwkreexlybul.supabase.co/functions/v1"; 


async function sendPushToKonselor({ konselorEmail, title, body, url = "/konselor-dashboard" }) {
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: konselorEmail, title, body, url }),
    });
    const data = await res.json();
    console.log("Push konselor:", data);
    return data;
  } catch (err) {
    console.error("sendPushToKonselor error:", err);
  }
}


async function sendEmailToKonselor(payload) {
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-konselor-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("Email konselor:", data);
    return data;
  } catch (err) {
    console.error("sendEmailToKonselor error:", err);
  }
}


/**
 *
 * @param {object} opts
 * @param {string} opts.konselorEmail  - email login konselor
 * @param {string} opts.konselorNama   - nama konselor
 * @param {string} opts.mahasiswaNama  - nama mahasiswa yang booking
 * @param {string} opts.tanggalSesi    - "YYYY-MM-DD"
 * @param {string} opts.jamSesi        - "HH:mm"
 * @param {string} [opts.kategori]     - kategori masalah
 * @param {number} [opts.sesiKe]       - sesi ke-berapa
 * @param {string} [opts.bookingId]    - ID booking
 */
export async function notifBookingBaru({
  konselorEmail,
  konselorNama,
  mahasiswaNama,
  tanggalSesi,
  jamSesi,
  kategori,
  sesiKe,
  bookingId,
}) {
  if (!konselorEmail) return;

  await Promise.allSettled([
    sendPushToKonselor({
      konselorEmail,
      title: "📅 Booking Baru Masuk!",
      body:  `${mahasiswaNama} baru saja booking sesi konseling denganmu pada ${jamSesi} WIB.`,
      url:   "/konselor-dashboard",
    }),
    sendEmailToKonselor({
      tipe:          "booking_baru",
      konselorEmail,
      konselorNama,
      mahasiswaNama,
      tanggalSesi,
      jamSesi,
      kategori,
      sesiKe,
      bookingId,
    }),
  ]);
}

/**
 * Panggil ini ~15 menit sebelum sesi dimulai.
 * Bisa dipanggil dari Supabase pg_cron atau scheduler lain.
 *
 * @param {object} opts - sama dengan notifBookingBaru
 */
export async function notifPengingatSesi({
  konselorEmail,
  konselorNama,
  mahasiswaNama,
  tanggalSesi,
  jamSesi,
  kategori,
}) {
  if (!konselorEmail) return;

  await Promise.allSettled([
    sendPushToKonselor({
      konselorEmail,
      title: "⏰ Sesi Dimulai 15 Menit Lagi",
      body:  `Sesimu dengan ${mahasiswaNama} dimulai pukul ${jamSesi} WIB. Bersiap ya!`,
      url:   "/konselor-dashboard",
    }),
    sendEmailToKonselor({
      tipe:          "pengingat_sesi",
      konselorEmail,
      konselorNama,
      mahasiswaNama,
      tanggalSesi,
      jamSesi,
      kategori,
    }),
  ]);
}