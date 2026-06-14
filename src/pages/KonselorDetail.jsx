import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { BOOKING_STATUS } from "../lib/bookingStatus.js";
import { getRefleksiKategori } from "../lib/kuesionerStore.js";
import { ensureDefaultTargets } from "../lib/defaultTargets.js";
import {
  fetchUlasanByKonselor,
  getPendingUlasanBooking,
  submitUlasan,
  mapUlasanToDisplay,
} from "../lib/ulasanKonselor.js";
import { computeKonselorStats, syncKonselorStats } from "../lib/konselorStats.js";
import UlasanForm from "../components/UlasanForm.jsx";
import "../styles/konselor-detail.css";

function StarRating({ rating, size = 14 }) {
  return (
    <div className="kd-stars">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = n <= Math.floor(rating);
        const half = !full && n === Math.ceil(rating) && rating % 1 >= 0.25;
        return (
          <svg
            key={n}
            className={`kd-star ${full ? "s-full" : half ? "s-half" : "s-empty"}`}
            viewBox="0 0 24 24"
            width={size}
            height={size}
          >
            <defs>
              {half && (
                <linearGradient id={`dh-${n}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              )}
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={full ? "currentColor" : half ? `url(#dh-${n})` : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        );
      })}
    </div>
  );
}

const HARI  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function getCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function formatJam(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

function FooterModal({ type, onClose }) {
  if (!type) return null;

  const content = {
    privasi: {
      title: "Kebijakan Privasi",
      sections: [
        { heading: "Informasi yang Kami Kumpulkan", body: "Kami mengumpulkan informasi yang kamu berikan secara langsung, seperti nama, alamat email, dan data profil saat mendaftar. Kami juga mengumpulkan data penggunaan layanan secara anonim untuk meningkatkan pengalaman pengguna." },
        { heading: "Bagaimana Kami Menggunakan Informasimu", body: "Informasi yang kami kumpulkan digunakan untuk menyediakan layanan konseling sebaya, menghubungkan kamu dengan konselor yang tepat, serta mengirimkan notifikasi terkait jadwal dan sesi konselingmu." },
        { heading: "Kerahasiaan Sesi Konseling", body: "Semua percakapan dalam sesi konseling bersifat rahasia. Kami tidak membagikan konten sesi kepada pihak ketiga tanpa persetujuan eksplisit darimu, kecuali diwajibkan oleh hukum yang berlaku." },
        { heading: "Keamanan Data", body: "Kami menggunakan enkripsi standar industri untuk melindungi data pribadimu. Akses ke data dibatasi hanya untuk personel yang berwenang dan diperlukan untuk operasional layanan." },
        { heading: "Hubungi Kami", body: "Jika kamu memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui email: privacy@thesanctuary.id" },
      ],
    },
    syarat: {
      title: "Syarat dan Ketentuan",
      sections: [
        { heading: "Penerimaan Syarat", body: "Dengan menggunakan layanan The Sanctuary, kamu menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika kamu tidak setuju, mohon untuk tidak menggunakan layanan kami." },
        { heading: "Penggunaan Layanan", body: "The Sanctuary adalah platform konseling sebaya yang ditujukan untuk mahasiswa Polimedia. Layanan ini bukan pengganti konseling profesional atau layanan kesehatan mental klinis. Untuk kondisi darurat, segera hubungi tenaga profesional." },
        { heading: "Kewajiban Pengguna", body: "Kamu bertanggung jawab untuk menjaga kerahasiaan akun dan tidak membagikan informasi login kepada orang lain. Segala aktivitas yang terjadi melalui akunmu adalah tanggung jawabmu." },
        { heading: "Kode Etik", body: "Semua pengguna diharapkan berinteraksi dengan saling menghormati. Perilaku yang merendahkan, melecehkan, atau merugikan pengguna lain akan mengakibatkan penangguhan akun." },
        { heading: "Perubahan Layanan", body: "Kami berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja dengan pemberitahuan sebelumnya. Perubahan syarat dan ketentuan akan diberitahukan melalui email atau notifikasi aplikasi." },
      ],
    },
    bantuan: {
      title: "Pusat Bantuan",
      sections: [
        { heading: "Cara Booking Sesi", body: "Kunjungi halaman Konselor, pilih konselor yang sesuai kebutuhanmu, lalu pilih jadwal yang tersedia. Konfirmasi booking dan kamu akan mendapat notifikasi setelah konselor menyetujui sesi." },
        { heading: "Bergabung ke Sesi", body: "Saat waktu sesi tiba, tombol 'Mulai Sesi' akan muncul di dashboard. Klik tombol tersebut untuk masuk ke ruang konseling online bersama konselormu." },
        { heading: "Membatalkan Sesi", body: "Pembatalan sesi dapat dilakukan melalui halaman Riwayat Sesi minimal 1 jam sebelum waktu sesi dimulai. Pembatalan mendadak kurang dari 1 jam akan dicatat sebagai ketidakhadiran." },
        { heading: "Masalah Teknis", body: "Jika kamu mengalami masalah teknis saat menggunakan platform, coba refresh halaman atau hapus cache browser. Jika masalah berlanjut, hubungi tim support kami." },
        { heading: "Hubungi Support", body: "📧 support@thesanctuary.id\n📱 WhatsApp: 0812-3456-7890 (Senin–Jumat, 08.00–17.00 WIB)\n🏢 Gedung Polimedia, Ruang Kemahasiswaan Lt. 2" },
      ],
    },
    panduan: {
      title: "Panduan Konseling Sebaya",
      sections: [
        { heading: "Sebelum Memulai Konseling", body: "Pastikan kamu sudah menentukan topik atau permasalahan yang ingin dibahas. Siapkan koneksi internet yang stabil dan pilih tempat yang nyaman agar sesi konseling berjalan lebih efektif." },
        { heading: "Memilih Konselor", body: "Masuk ke halaman daftar konselor, lihat profil serta bidang pendampingan yang tersedia. Pilih konselor yang paling sesuai dengan kebutuhanmu, kemudian lanjutkan ke proses pemilihan jadwal." },
        { heading: "Mengajukan Permintaan Sesi", body: "Pilih waktu konseling yang tersedia lalu kirim permintaan sesi. Tunggu persetujuan dari konselor. Setelah disetujui, detail sesi akan tersedia pada menu jadwal konseling." },
        { heading: "Saat Konseling Berlangsung", body: "Gunakan fitur ruang konseling untuk memulai percakapan dengan konselor. Sampaikan cerita dan perasaanmu secara terbuka agar konselor dapat memberikan pendampingan yang tepat." },
        { heading: "Aturan Selama Sesi", body: "Jaga komunikasi yang sopan, hargai privasi, dan hindari membagikan informasi pribadi orang lain. Seluruh percakapan selama sesi bersifat rahasia dan digunakan hanya untuk kebutuhan pendampingan." },
        { heading: "Setelah Sesi Selesai", body: "Kamu dapat memberikan evaluasi atau feedback mengenai pengalaman konseling. Feedback tersebut membantu meningkatkan kualitas layanan konseling sebaya." },
      ],
    },
  };

  const c = content[type];
  if (!c) return null;

  return (
    <div className="footer-modal-overlay" onClick={onClose}>
      <div className="footer-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="footer-modal-header">
          <div className="footer-modal-title-wrap">
            <h2 className="footer-modal-title">{c.title}</h2>
          </div>
          <button className="footer-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="footer-modal-body">
          {c.sections.map((s, i) => (
            <div key={i} className="footer-modal-section">
              <h3 className="footer-modal-section-title">{s.heading}</h3>
              <p className="footer-modal-section-body">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="footer-modal-foot">
          <p className="footer-modal-foot-note">© 2026 The Sanctuary Polimedia · Tempat aman untuk saling mendengar</p>
          <button className="footer-modal-close-btn" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="kd-layout" style={{ padding: "2rem" }}>
      <div className="kd-left">
        <div className="skel-box" style={{ height: 220, borderRadius: 16, marginBottom: 24 }} />
        <div className="skel-box" style={{ height: 160, borderRadius: 16, marginBottom: 24 }} />
        <div className="skel-box" style={{ height: 200, borderRadius: 16 }} />
      </div>
      <aside className="kd-right">
        <div className="skel-box" style={{ height: 480, borderRadius: 16 }} />
      </aside>
    </div>
  );
}

// Normalise spesialisasi dari Supabase ke format display (icon, judul, desc)
function normalizeSpesialisasi(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((s) => ({
    icon:  s.icon  ?? "",
    judul: s.judul ?? s.title ?? "",
    desc:  s.desc  ?? "",
  }));
}

export default function KonselorDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ulasanSectionRef = useRef(null);

  const [konselor,  setKonselor]  = useState(null);
  const [slots,     setSlots]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [ulasanList,       setUlasanList]      = useState([]);
  const [pendingBooking,   setPendingBooking]  = useState(null);
  const [showUlasanForm,   setShowUlasanForm]  = useState(false);
  const [ulasanSubmitting, setUlasanSubmitting]= useState(false);
  const [ulasanError,      setUlasanError]     = useState("");
  const [ulasanSuccess,    setUlasanSuccess]   = useState(false);
  const [liveStats,        setLiveStats]       = useState(null);

  const [footerModal, setFooterModal] = useState(null);

  const [calMonth,     setCalMonth]     = useState(new Date().getMonth());
  const [calYear,      setCalYear]      = useState(new Date().getFullYear());
  const [selectedDay,  setSelectedDay]  = useState(new Date().getDate());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDone,  setBookingDone]  = useState(false);
  const [bookingLoad,  setBookingLoad]  = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: kData, error: kErr } = await supabase
        .from("data_konselor")
        .select("*")
        .eq("id", id)
        .single();

      if (kErr || !kData) {
        setError("Konselor tidak ditemukan.");
        setLoading(false);
        return;
      }

      setKonselor({
        ID:               kData.id,
        Nama:             kData.nama,
        Kategori_Masalah: kData.kategori_masalah,
        Pengalaman:       kData.pengalaman,
        "Rating_(Final)": kData.rating_final     ?? 0,
        "Keramahan_(30%)":kData.keramahan        ?? 0,
        "Solusi_(50%)":   kData.solusi           ?? 0,
        "Respon_(20%)":   kData.respon           ?? 0,
        Jumlah_Kasus:     kData.jumlah_kasus     ?? 0,
        Kasus_Selesai:    kData.kasus_selesai    ?? 0,
        Success_Rate:     kData.success_rate     ?? 0,
        image:            kData.image_url || kData.foto_url || "/placeholder-avatar.png",
        bio:              kData.bio              ?? "",
        spesialisasi:     kData.spesialisasi     ?? null,
      });

      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      const { data: avData } = await supabase
        .from("konselor_availability")
        .select("id, tanggal, jam_mulai, jam_selesai, status")
        .eq("konselor_id", id)
        .eq("status", "tersedia")
        .gte("tanggal", todayStr)
        .order("tanggal", { ascending: true })
        .order("jam_mulai", { ascending: true });

      const slotList = avData || [];
      setSlots(slotList);

      if (slotList.length > 0) {
        const [y, m, d] = slotList[0].tanggal.split("-").map(Number);
        setCalYear(y);
        setCalMonth(m - 1);
        setSelectedDay(d);
      }

      setLoading(false);

      const stats = await computeKonselorStats(id);
      setLiveStats(stats);
      syncKonselorStats(id).catch(() => {});
    }

    fetchData();
  }, [id]);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  })();

  useEffect(() => {
    if (!id || loading) return;

    let active = true;

    async function loadUlasanData() {
      const list = await fetchUlasanByKonselor(id);
      if (active) setUlasanList(list.map(mapUlasanToDisplay));

      if (user?.role !== "mahasiswa") return;

      let mid = user.student_id ?? null;
      if (!mid && user.email) {
        const { data: profil } = await supabase
          .from("profil_pengguna")
          .select("student_id")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
        mid = profil?.student_id ?? null;
      }
      if (!mid || !active) return;

      const pending = await getPendingUlasanBooking(id, mid);
      if (!active) return;

      if (pending) {
        setPendingBooking(pending);
        setShowUlasanForm(true);
        return;
      }

      try {
        const stored = JSON.parse(sessionStorage.getItem("sanctuary_pending_ulasan") ?? "null");
        if (stored?.konselorId === id && stored?.bookingId) {
          const { data: bk } = await supabase
            .from("booking")
            .select("id, sesi_konseling, tanggal_sesi, status")
            .eq("id", stored.bookingId)
            .maybeSingle();
          if (bk && active) {
            setPendingBooking(bk);
            setShowUlasanForm(true);
          }
        }
      } catch { /* ignore */ }
    }

    loadUlasanData();
    return () => { active = false; };
  }, [id, loading, user?.role, user?.student_id, user?.email]);

  useEffect(() => {
    if (searchParams.get("ulasan") !== "1" || !showUlasanForm) return;
    const t = setTimeout(() => {
      ulasanSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
    return () => clearTimeout(t);
  }, [searchParams, showUlasanForm]);

  async function handleSubmitUlasan({ rating, teks }) {
    if (!pendingBooking || !user) return;
    setUlasanSubmitting(true);
    setUlasanError("");

    let mid = user.student_id ?? null;
    if (!mid && user.email) {
      const { data: profil } = await supabase
        .from("profil_pengguna")
        .select("student_id")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
      mid = profil?.student_id ?? null;
    }
    if (!mid) {
      setUlasanError("Data mahasiswa tidak ditemukan. Coba login ulang.");
      setUlasanSubmitting(false);
      return;
    }

    const { data, error: err } = await submitUlasan({
      idBooking:      pendingBooking.id,
      idKonselor:     id,
      idMahasiswa:    mid,
      emailMahasiswa: user.email?.toLowerCase(),
      namaMahasiswa:  user.nama ?? user.name ?? "Mahasiswa",
      rating,
      teks,
    });

    if (err) {
      setUlasanError(
        err.message.includes("does not exist") || err.message.includes("ulasan_konselor")
          ? "Tabel ulasan belum tersedia. Jalankan supabase/ulasan_konselor.sql di Supabase."
          : err.message
      );
      setUlasanSubmitting(false);
      return;
    }

    if (data) {
      setUlasanList((prev) => [mapUlasanToDisplay(data), ...prev]);
    } else {
      const refreshed = await fetchUlasanByKonselor(id);
      setUlasanList(refreshed.map(mapUlasanToDisplay));
    }

    const stats = await syncKonselorStats(id);
    if (stats) setLiveStats(stats);

    sessionStorage.removeItem("sanctuary_pending_ulasan");
    setShowUlasanForm(false);
    setPendingBooking(null);
    setUlasanSuccess(true);
    setUlasanSubmitting(false);
    searchParams.delete("ulasan");
    setSearchParams(searchParams, { replace: true });
  }

  function handleSkipUlasan() {
    setShowUlasanForm(false);
    searchParams.delete("ulasan");
    setSearchParams(searchParams, { replace: true });
  }

  const parseDate = (tanggalStr) => {
    const [y, m, d] = tanggalStr.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  };

  const slotsHariIni = slots.filter((s) => {
    const { year, month, day } = parseDate(s.tanggal);
    return day === selectedDay && month === calMonth && year === calYear;
  });

  const hariAdaSlot = new Set(
    slots
      .filter((s) => {
        const { year, month } = parseDate(s.tanggal);
        return month === calMonth && year === calYear;
      })
      .map((s) => parseDate(s.tanggal).day)
  );

  async function handleConfirmBooking() {
    const userRaw = localStorage.getItem("sanctuary_user");
    if (!userRaw) {
      sessionStorage.setItem("redirect_after_login", `/konselor/${id}`);
      navigate("/login");
      return;
    }
    if (!selectedSlot) return;

    const user = JSON.parse(userRaw);
    setBookingLoad(true);

    let mhsId = user.student_id ?? null;
    if (!mhsId) {
      const { data: profil } = await supabase
        .from("profil_pengguna")
        .select("student_id")
        .eq("email", user.email)
        .maybeSingle();
      mhsId = profil?.student_id ?? null;
    }

    if (!mhsId) {
      alert("Gagal booking: data mahasiswa tidak lengkap. Coba login ulang.");
      setBookingLoad(false);
      return;
    }

    const slotObj  = slots.find((s) => s.id === selectedSlot);
    const tanggal  = slotObj.tanggal;

    const normalizeTime = (t) => {
      if (!t) return "00:00:00";
      const parts = t.split(":");
      if (parts.length === 2) return `${t}:00`;
      return t;
    };

    const cleanTime      = normalizeTime(slotObj.jam_mulai);
    const startTimestamp = `${tanggal}T${cleanTime}+07:00`;

    const { count } = await supabase
      .from("booking")
      .select("*", { count: "exact", head: true })
      .eq("id_mahasiswa", mhsId)
      .eq("id_konselor", id);

    const sesiKe = (count ?? 0) + 1;
    const userEmail = (user.email ?? "").toLowerCase();
    const kategoriRefleksi = userEmail ? await getRefleksiKategori(userEmail) : null;

    const bookingId = `BK-${Date.now()}`;
    const { error: bErr } = await supabase.from("booking").insert({
      id:               bookingId,
      id_konselor:      id,
      id_mahasiswa:     mhsId,
      nama_mahasiswa:   user.name || user.nama,
      kategori_masalah: kategoriRefleksi ?? konselor.Kategori_Masalah,
      tanggal_sesi:     startTimestamp,
      sesi_konseling:   sesiKe,
      status:           BOOKING_STATUS.TERJADWAL,
      kondisi_awal:     0,
      kondisi_saat_ini: 0,
    });

    if (bErr) {
      alert("Gagal booking: " + bErr.message);
      setBookingLoad(false);
      return;
    }

    await ensureDefaultTargets(mhsId);

    syncKonselorStats(id).then((stats) => {
      if (stats) setLiveStats(stats);
    }).catch(() => {});

    await supabase
      .from("konselor_availability")
      .update({ status: "booked" })
      .eq("id", selectedSlot);

    setSlots(prev => prev.filter(s => s.id !== selectedSlot));
    setBookingDone(true);
    setBookingLoad(false);
  }

  const goTo = (dest) => {
    const user = localStorage.getItem("sanctuary_user");
    if (user) navigate(dest);
    else { sessionStorage.setItem("redirect_after_login", dest); navigate("/login"); }
  };

  const userForNav = user;
  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  if (loading) return (
    <div className="sanctuary kd-page">
      <header className="nav-shell">
        <nav className="nav">
          <div className="nav-l">
            <span className="nav-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          </div>
        </nav>
      </header>
      <SkeletonDetail />
    </div>
  );

  if (error || !konselor) return (
    <div className="kd-notfound">
      <h2>{error || "Konselor tidak ditemukan"}</h2>
      <button onClick={() => navigate("/konselor")}>← Kembali</button>
    </div>
  );

  const calDays = getCalendarDays(calYear, calMonth);
  const today   = new Date();
  const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  // Spesialisasi 100% dari Supabase — diisi konselor via Edit Profil di dashboard
  const spesialisasi = normalizeSpesialisasi(konselor.spesialisasi);

  // Testimoni 100% dari Supabase (ulasan_konselor)
  const testimoni = ulasanList;

  const bio = konselor.bio || "Konselor sebaya yang berdedikasi dalam membantu mahasiswa.";

  const stats = liveStats ?? {
    rating_final:  konselor["Rating_(Final)"],
    jumlah_kasus:  konselor.Jumlah_Kasus,
    kasus_selesai: konselor.Kasus_Selesai,
    success_rate:  konselor.Success_Rate,
  };

  const ratingBar = (label, val) => (
    <div key={label} className="kd-rating-bar-row">
      <span className="kd-rating-bar-label">{label}</span>
      <div className="kd-rating-bar-track">
        <div className="kd-rating-bar-fill" style={{ width: `${(val / 5) * 100}%` }} />
      </div>
      <span className="kd-rating-bar-val">{val.toFixed(1)}</span>
    </div>
  );

  const avgTestimoniRating = testimoni.length
    ? (testimoni.reduce((s, t) => s + t.rating, 0) / testimoni.length).toFixed(1)
    : stats.rating_final.toFixed(1);

  return (
    <div className="sanctuary kd-page">

      <FooterModal type={footerModal} onClose={() => setFooterModal(null)} />

      <header className="nav-shell">
        <nav className="nav">
          <div className="nav-l">
            <span className="nav-logo" onClick={() => navigate("/")}>The<br className="nav-logo-br" />Sanctuary</span>
            <ul className="nav-menu">
              <li className="nav-item" onClick={() => navigate("/")}>Beranda</li>
              <li className="nav-item is-active" onClick={() => navigate("/konselor")}>Konselor</li>
              <li className="nav-item" onClick={() => goTo("/dashboard")}>Dashboard</li>
            </ul>
          </div>
          <div className="nav-r">
            <button className="nav-cta" onClick={() => goTo("/kuesioner")}>Mulai Refleksi Diri</button>
            <button className="nav-icon-btn" aria-label="Notifikasi" onClick={() => goTo("/notifikasi")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {userForNav ? (
              <div className="nav-user-wrap">
                <div
                  className="nav-avatar nav-avatar--active"
                  onClick={() => goTo("/dashboard")}
                  title={userForNav.name}
                >
                  <span className="nav-avatar-initial">{userForNav.name?.charAt(0).toUpperCase()}</span>
                </div>
                <button className="nav-logout-btn" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="nav-avatar" onClick={() => navigate("/login")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="kd-breadcrumb-wrap">
        <div className="kd-breadcrumb">
          <span onClick={() => navigate("/")}>Beranda</span>
          <span className="kd-bc-sep">›</span>
          <span onClick={() => navigate("/konselor")}>Konselor</span>
          <span className="kd-bc-sep">›</span>
          <span className="kd-bc-active">{konselor.Nama}</span>
        </div>
      </div>

      <div className="kd-layout">

        <div className="kd-left">

          <section className="kd-hero-card">
            <div className="kd-hero-photo-col">
              <div className="kd-hero-photo-wrap">
                <img
                  src={konselor.image}
                  alt={konselor.Nama}
                  className="kd-hero-photo"
                  onError={(e) => { e.target.src = "/placeholder-avatar.png"; }}
                />
              </div>
              <div className="kd-avail-status">
                <span className="kd-avail-dot" />
                <span>{slots.length > 0 ? "Tersedia untuk sesi" : "Tidak ada slot tersedia"}</span>
              </div>
            </div>

            <div className="kd-hero-info">
              <span className="kd-hero-kat-pill">{konselor.Kategori_Masalah}</span>
              <h1 className="kd-hero-name">{konselor.Nama}</h1>
              <p className="kd-hero-tagline">{bio.split("\n\n")[0].split(". ")[0]}.</p>

              <div className="kd-quick-stats">
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{stats.rating_final.toFixed(1)}</span>
                  <span className="kd-qs-label">Rating</span>
                  <StarRating rating={stats.rating_final} size={11} />
                </div>
                <div className="kd-qs-divider" />
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{stats.jumlah_kasus}</span>
                  <span className="kd-qs-label">Total Kasus</span>
                </div>
                <div className="kd-qs-divider" />
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{stats.kasus_selesai}</span>
                  <span className="kd-qs-label">Kasus Selesai</span>
                </div>
                <div className="kd-qs-divider" />
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{Math.round(stats.success_rate * 100)}%</span>
                  <span className="kd-qs-label">Success Rate</span>
                </div>
              </div>
            </div>
          </section>

          <section className="kd-section">
            <h2 className="kd-section-h">Tentang Saya</h2>
            {bio.split("\n\n").map((p, i) => (
              <p key={i} className="kd-bio-p">{p}</p>
            ))}
            <div className="kd-rating-breakdown">
              {ratingBar("Keramahan",        konselor["Keramahan_(30%)"])}
              {ratingBar("Kualitas Solusi",  konselor["Solusi_(50%)"])}
              {ratingBar("Kecepatan Respon", konselor["Respon_(20%)"])}
            </div>
          </section>

          <section className="kd-section">
            <h2 className="kd-section-h">Spesialisasi Keahlian</h2>
            {spesialisasi.length === 0 ? (
              <p className="kd-testi-empty">Belum ada data spesialisasi untuk konselor ini.</p>
            ) : (
              <div className="kd-spesial-grid">
                {spesialisasi.map((s, i) => (
                  <div key={i} className="kd-spesial-card">
                    <span className="kd-spesial-icon">{s.icon}</span>
                    <h4 className="kd-spesial-judul">{s.judul}</h4>
                    <p className="kd-spesial-desc">{s.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="kd-section" ref={ulasanSectionRef}>
            <h2 className="kd-section-h">Testimoni Klien</h2>

            {ulasanSuccess && (
              <div className="kd-ulasan-success">
                Terima kasih! Ulasanmu sudah terkirim dan akan membantu konselor lainnya.
              </div>
            )}

            {showUlasanForm && pendingBooking && userForNav?.role === "mahasiswa" && (
              <UlasanForm
                konselorNama={konselor.Nama}
                sesiKe={pendingBooking.sesi_konseling}
                onSubmit={handleSubmitUlasan}
                onSkip={handleSkipUlasan}
                submitting={ulasanSubmitting}
                error={ulasanError}
              />
            )}

            <div className="kd-testi-header">
              <div className="kd-testi-score">
                <span className="kd-testi-big">{avgTestimoniRating}</span>
                <div>
                  <StarRating rating={parseFloat(avgTestimoniRating)} size={16} />
                  <span className="kd-testi-count">{testimoni.length} ulasan</span>
                </div>
              </div>
              <div className="kd-testi-bars">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = testimoni.filter((t) => t.rating === star).length;
                  return (
                    <div key={star} className="kd-testi-bar-row">
                      <span className="kd-testi-bar-label">{star} ★</span>
                      <div className="kd-testi-bar-track">
                        <div
                          className="kd-testi-bar-fill"
                          style={{ width: testimoni.length ? `${(count / testimoni.length) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="kd-testi-bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="kd-testi-tags">
                <p className="kd-testi-tags-label">KATEGORI MASALAH DITANGANI</p>
                <span className="kd-testi-tag primary">{konselor.Kategori_Masalah.split(" ").slice(0, 2).join(" ")}</span>
                <span className="kd-testi-tag">Stres Kuliah</span>
                <span className="kd-testi-tag">Motivasi</span>
              </div>
            </div>

            <div className="kd-testi-grid">
              {testimoni.length === 0 && (
                <p className="kd-testi-empty">Belum ada ulasan. Jadilah yang pertama setelah sesi selesai!</p>
              )}
              {testimoni.map((t, i) => (
                <div key={t.id ?? i} className="kd-testi-card">
                  <StarRating rating={t.rating} size={13} />
                  <p className="kd-testi-text">"{t.teks}"</p>
                  <div className="kd-testi-author">
                    <div className="kd-testi-avatar">{t.nama.charAt(0)}</div>
                    <div>
                      <p className="kd-testi-name">{t.nama}</p>
                      <p className="kd-testi-peran">{t.peran}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        <aside className="kd-right">
          <div className="kd-booking-card">
            <div className="kd-booking-header">
              <h3 className="kd-booking-h">Book a Session</h3>
              <p className="kd-booking-sub">Mulai perjalananmu bersama {konselor.Nama.split(" ")[0]} hari ini</p>
            </div>

            <div className="kd-cal">
              <div className="kd-cal-nav">
                <button className="kd-cal-arrow" onClick={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                  else setCalMonth(m => m - 1);
                }}>‹</button>
                <span className="kd-cal-title">{BULAN[calMonth]} {calYear}</span>
                <button className="kd-cal-arrow" onClick={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                  else setCalMonth(m => m + 1);
                }}>›</button>
              </div>

              <div className="kd-cal-grid">
                {HARI.map((h) => (
                  <span key={h} className="kd-cal-day-label">{h}</span>
                ))}
                {calDays.map((d, i) => (
                  <button
                    key={i}
                    className={[
                      "kd-cal-day",
                      !d                        ? "kd-cal-empty"    : "",
                      d === selectedDay         ? "kd-cal-selected" : "",
                      isToday(d)                ? "kd-cal-today"    : "",
                      d && hariAdaSlot.has(d)   ? "kd-cal-has-slot" : "",
                    ].join(" ")}
                    disabled={!d}
                    onClick={() => { if (d) { setSelectedDay(d); setSelectedSlot(null); } }}
                  >
                    {d || ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="kd-slots">
              <p className="kd-slots-label">
                Slot Tersedia — {selectedDay} {BULAN[calMonth]} {calYear}
              </p>
              {slotsHariIni.length === 0 ? (
                <p className="kd-slots-empty">Tidak ada slot tersedia di hari ini.</p>
              ) : (
                <div className="kd-slots-grid">
                  {slotsHariIni.map((s) => (
                    <button
                      key={s.id}
                      className={`kd-slot-btn ${selectedSlot === s.id ? "kd-slot-selected" : ""}`}
                      onClick={() => setSelectedSlot(s.id)}
                    >
                      {formatJam(s.jam_mulai)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {bookingDone ? (
              <div className="kd-booking-success">
                <span className="kd-booking-success-icon">✅</span>
                <p>Sesi berhasil dijadwalkan!</p>
                <span>
                  {selectedDay} {BULAN[calMonth]} {calYear},{" "}
                  {slots.find(s => s.id === selectedSlot)
                    ? formatJam(slots.find(s => s.id === selectedSlot).jam_mulai)
                    : ""}
                </span>
                <button
                  className="kd-confirm-btn"
                  style={{ marginTop: 12 }}
                  onClick={() => goTo("/dashboard")}
                >
                  Lihat di Dashboard →
                </button>
              </div>
            ) : (
              <button
                className="kd-confirm-btn"
                disabled={!selectedSlot || bookingLoad}
                onClick={handleConfirmBooking}
              >
                {bookingLoad ? "Memproses..." : "Confirm Booking →"}
              </button>
            )}

            <p className="kd-booking-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Sesi berlangsung 45 menit via platform Sanctuary. Kamu bisa reschedule hingga 2 jam sebelum sesi dimulai.
            </p>
          </div>
        </aside>
      </div>

      <footer className="footer" style={{ width: "92%", margin: "80px auto 50px" }}>
        <div className="footer-brand">
          <h3 className="footer-name">The Sanctuary Polimedia</h3>
          <p className="footer-desc">
            Platform konseling sebaya untuk mahasiswa Polimedia yang menyediakan
            ruang aman untuk saling mendengarkan dan mendukung di lingkungan kampus.
          </p>
          <small className="footer-copy">© 2026 TheSanctuary. Politeknik Negeri Media Kreatif.</small>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-h">Platform</h4>
          <ul className="footer-links">
            <li onClick={() => navigate("/konselor")}>Layanan</li>
            <li onClick={() => setFooterModal("panduan")}>Panduan Konseling</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-h">Legal</h4>
          <ul className="footer-links">
            <li onClick={() => setFooterModal("privasi")}>Kebijakan Privasi</li>
            <li onClick={() => setFooterModal("syarat")}>Syarat dan Ketentuan</li>
            <li onClick={() => setFooterModal("bantuan")}>Bantuan</li>
          </ul>
        </div>
      </footer>

    </div>
  );
}