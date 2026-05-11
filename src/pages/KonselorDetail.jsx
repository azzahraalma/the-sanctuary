import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import data_konselor from "../data/data_konselor";
import "../styles/konselor-detail.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Data pendukung per konselor (generated dari data dummy) ───────────────────

const SPESIALISASI_MAP = {
  "Tekanan Akademik & Kesejahteraan Mahasiswa": [
    { icon: "📚", judul: "Manajemen Stres Akademik", desc: "Membantu mahasiswa mengelola tekanan tugas, ujian, dan deadline dengan strategi yang efektif dan berkelanjutan." },
    { icon: "🧘", judul: "Kesejahteraan Mental", desc: "Pendampingan untuk menjaga keseimbangan mental di tengah tuntutan perkuliahan yang tinggi." },
    { icon: "🎯", judul: "Fokus & Produktivitas", desc: "Teknik dan strategi untuk meningkatkan konsentrasi belajar dan produktivitas akademik sehari-hari." },
  ],
  "Perencanaan Karier & Kehidupan Kampus": [
    { icon: "🗺️", judul: "Perencanaan Karier", desc: "Membantu mahasiswa merancang jalur karier yang sesuai dengan minat, bakat, dan kondisi pasar kerja saat ini." },
    { icon: "🤝", judul: "Kehidupan Kampus", desc: "Pendampingan adaptasi di lingkungan kampus, membangun relasi, dan memaksimalkan pengalaman perkuliahan." },
    { icon: "💼", judul: "Persiapan Dunia Kerja", desc: "Bimbingan menyiapkan diri untuk transisi dari dunia kampus ke dunia profesional dengan percaya diri." },
  ],
  "Pengelolaan Kebiasaan & Emosi Mahasiswa": [
    { icon: "💡", judul: "Regulasi Emosi", desc: "Teknik mengelola emosi agar tidak menghambat aktivitas dan hubungan sosial di lingkungan kampus." },
    { icon: "🌱", judul: "Pembentukan Kebiasaan Baik", desc: "Membangun rutinitas positif yang mendukung pertumbuhan diri dan pencapaian tujuan jangka panjang." },
    { icon: "💬", judul: "Komunikasi Asertif", desc: "Melatih kemampuan menyampaikan pikiran dan perasaan secara sehat, jelas, dan efektif." },
  ],
  "Kelelahan Akademik & Aktivitas Kampus": [
    { icon: "🔋", judul: "Pemulihan Burnout", desc: "Strategi mengenali, mengatasi, dan pulih dari kelelahan akademik yang berkepanjangan secara bertahap." },
    { icon: "⚖️", judul: "Work-Life Balance Kampus", desc: "Menyeimbangkan aktivitas akademik, organisasi, dan kehidupan pribadi tanpa mengorbankan kesehatan." },
    { icon: "🌿", judul: "Self-Care & Resiliensi", desc: "Membangun ketahanan diri agar mampu bangkit dari tekanan dan tantangan kehidupan kampus." },
  ],
};

const TESTIMONI_MAP = {
  "K-001": [
    { nama: "Rizki Pratama", peran: "Mahasiswa Semester 6", rating: 5, teks: "Almalia sangat sabar dan penuh empati. Beliau membantu saya menemukan cara belajar yang lebih efektif saat menghadapi tekanan skripsi. Sangat recommended!" },
    { nama: "Sari Dewi", peran: "Mahasiswa Semester 4", rating: 5, teks: "Sesi bersama Almalia benar-benar mengubah cara pandang saya terhadap stres akademik. Sekarang saya lebih tenang menghadapi ujian." },
  ],
  "K-002": [
    { nama: "Budi Santoso", peran: "Fresh Graduate", rating: 4, teks: "Felicia membantu saya memetakan jalur karier yang selama ini membingungkan. Pendekatannya sangat terstruktur dan mudah dipahami." },
    { nama: "Nina Kartika", peran: "Mahasiswa Semester 7", rating: 5, teks: "Berkat Felicia, saya jadi lebih yakin dengan pilihan karier saya. Beliau memiliki wawasan luas tentang dunia kerja kreatif." },
  ],
  "K-003": [
    { nama: "Dika Ramadhan", peran: "Mahasiswa Semester 3", rating: 5, teks: "Haris benar-benar mendengarkan tanpa menghakimi. Saya bisa cerita apa saja dan beliau selalu memberikan perspektif yang menyegarkan." },
    { nama: "Putri Amalia", peran: "Mahasiswa Semester 5", rating: 5, teks: "Sesi dengan Haris membantu saya mengelola emosi saat konflik dengan teman seangkatan. Tekniknya praktis dan langsung bisa diterapkan." },
  ],
  "K-004": [
    { nama: "Fajar Nugroho", peran: "Mahasiswa Semester 8", rating: 3, teks: "Haikal membantu saya mengenali tanda-tanda burnout lebih awal. Meski masih baru, semangatnya untuk membantu sangat terasa." },
    { nama: "Anisa Putri", peran: "Mahasiswa Semester 6", rating: 4, teks: "Pendekatan Haikal cukup membantu saya menyeimbangkan kegiatan organisasi dan kuliah yang sempat bikin kewalahan." },
  ],
};

const BIO_MAP = {
  "K-001": "Almalia adalah konselor sebaya yang berfokus pada pendampingan mahasiswa dalam menghadapi tekanan akademik dan menjaga kesejahteraan mental selama perkuliahan. Dengan pengalaman 2 tahun, ia telah mendampingi puluhan mahasiswa menemukan strategi belajar yang lebih sehat dan efektif.\n\nMelalui pendekatan yang hangat dan empatik, Almalia percaya bahwa setiap mahasiswa memiliki potensi untuk bangkit dari tekanan akademik dan meraih keseimbangan antara prestasi dan kebahagiaan.",
  "K-002": "Felicia adalah konselor sebaya yang bersemangat dalam membantu mahasiswa merencanakan masa depan karier mereka. Dengan latar belakang yang kuat di bidang pengembangan diri dan kehidupan kampus, ia membantu mahasiswa menemukan arah yang jelas setelah lulus.\n\nFelicia percaya bahwa setiap mahasiswa berhak mendapatkan bimbingan karier yang personal dan relevan dengan kondisi dunia kerja saat ini.",
  "K-003": "Muhammad Haris adalah konselor sebaya dengan dedikasi tinggi dalam membantu mahasiswa mengelola emosi dan membangun kebiasaan positif. Dengan rating sempurna dari semua dimensi penilaian, Haris dikenal sebagai pendengar yang luar biasa dan memberikan solusi yang tepat sasaran.\n\nHaris percaya bahwa kemampuan mengelola emosi adalah fondasi dari semua pencapaian dalam hidup, dan ia berkomitmen membantu setiap mahasiswa membangunnya.",
  "K-004": "Haikal adalah konselor sebaya yang fokus pada isu kelelahan akademik yang semakin banyak dialami mahasiswa masa kini. Meski masih relatif baru, semangat dan dedikasinya dalam membantu teman sebaya mengatasi burnout sangat tinggi.\n\nHaikal percaya bahwa istirahat dan pemulihan adalah bagian penting dari perjalanan akademik, bukan tanda kelemahan.",
};

const JADWAL_SLOTS = ["08:30 AM", "09:15 AM", "11:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// ── Main Component ────────────────────────────────────────────────────────────

export default function KonselorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const konselor = data_konselor.find((k) => k.ID === id);

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedSlot, setSelectedSlot] = useState("11:30 AM");
  const [bookingDone, setBookingDone] = useState(false);

  if (!konselor) {
    return (
      <div className="kd-notfound">
        <h2>Konselor tidak ditemukan</h2>
        <button onClick={() => navigate("/konselor")}>← Kembali</button>
      </div>
    );
  }

  const calDays = getCalendarDays(calYear, calMonth);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const spesialisasi = SPESIALISASI_MAP[konselor.Kategori_Masalah] || [];
  const testimoni    = TESTIMONI_MAP[konselor.ID] || [];
  const bio          = BIO_MAP[konselor.ID] || "Konselor sebaya yang berdedikasi dalam membantu mahasiswa.";

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
    : konselor["Rating_(Final)"].toFixed(1);

  // Auth guard
  const goTo = (dest) => {
    const user = localStorage.getItem("sanctuary_user");
    if (user) navigate(dest);
    else { sessionStorage.setItem("redirect_after_login", dest); navigate("/login"); }
  };

  const user = (() => { try { return JSON.parse(localStorage.getItem("sanctuary_user")); } catch { return null; } })();
  const handleLogout = () => { localStorage.removeItem("sanctuary_user"); navigate("/login"); };

  return (
    <div className="sanctuary kd-page">

      {/* ── NAVBAR ── */}
      <header className="nav-shell">
        <nav className="nav">
          <div className="nav-l">
            <span className="nav-logo" onClick={() => navigate("/")}>The Sanctuary</span>
            <ul className="nav-menu">
              <li className="nav-item" onClick={() => navigate("/")}>Beranda</li>
              <li className="nav-item is-active" onClick={() => navigate("/konselor")}>Konselor</li>
              <li className="nav-item" onClick={() => goTo("/dashboard")}>Dashboard</li>
            </ul>
          </div>
          <div className="nav-r">
            <button className="nav-cta" onClick={() => goTo("/kuesioner")}>Mulai Refleksi Diri</button>
            <button className="nav-icon-btn" aria-label="Notifikasi" onClick={() => goTo("/dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {user ? (
              <div className="nav-user-wrap">
                <div className="nav-avatar nav-avatar--active" onClick={() => goTo("/dashboard")} title={user.name}>
                  <span className="nav-avatar-initial">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <button className="nav-logout-btn" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="nav-avatar" onClick={() => navigate("/login")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ── BREADCRUMB ── */}
      <div className="kd-breadcrumb-wrap">
        <div className="kd-breadcrumb">
          <span onClick={() => navigate("/")}>Beranda</span>
          <span className="kd-bc-sep">›</span>
          <span onClick={() => navigate("/konselor")}>Konselor</span>
          <span className="kd-bc-sep">›</span>
          <span className="kd-bc-active">{konselor.Nama}</span>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="kd-layout">

        {/* ══ LEFT COLUMN ══ */}
        <div className="kd-left">

          {/* ── HERO CARD ── */}
          <section className="kd-hero-card">
            <div className="kd-hero-photo-col">
              <div className="kd-hero-photo-wrap">
                <img src={konselor.image} alt={konselor.Nama} className="kd-hero-photo" />
              </div>
              {/* Availability dot */}
              <div className="kd-avail-status">
                <span className="kd-avail-dot" />
                <span>Tersedia untuk sesi</span>
              </div>
            </div>

            <div className="kd-hero-info">
              <span className="kd-hero-kat-pill">{konselor.Kategori_Masalah}</span>
              <h1 className="kd-hero-name">{konselor.Nama}</h1>
              <p className="kd-hero-tagline">
                {bio.split("\n\n")[0].split(". ")[0]}.
              </p>

              {/* Quick stats */}
              <div className="kd-quick-stats">
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{konselor["Rating_(Final)"].toFixed(1)}</span>
                  <span className="kd-qs-label">Rating</span>
                  <StarRating rating={konselor["Rating_(Final)"]} size={11} />
                </div>
                <div className="kd-qs-divider" />
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{konselor.Jumlah_Kasus}</span>
                  <span className="kd-qs-label">Total Kasus</span>
                </div>
                <div className="kd-qs-divider" />
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{konselor.Kasus_Selesai}</span>
                  <span className="kd-qs-label">Kasus Selesai</span>
                </div>
                <div className="kd-qs-divider" />
                <div className="kd-qs-item">
                  <span className="kd-qs-val">{Math.round(konselor["Success_Rate"] * 100)}%</span>
                  <span className="kd-qs-label">Success Rate</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── TENTANG SAYA ── */}
          <section className="kd-section">
            <h2 className="kd-section-h">Tentang Saya</h2>
            {bio.split("\n\n").map((p, i) => (
              <p key={i} className="kd-bio-p">{p}</p>
            ))}

            {/* Rating breakdown */}
            <div className="kd-rating-breakdown">
              {ratingBar("Keramahan", konselor["Keramahan_(30%)"])}
              {ratingBar("Kualitas Solusi", konselor["Solusi_(50%)"])}
              {ratingBar("Kecepatan Respon", konselor["Respon_(20%)"])}
            </div>
          </section>

          {/* ── SPESIALISASI ── */}
          <section className="kd-section">
            <h2 className="kd-section-h">Spesialisasi Keahlian</h2>
            <div className="kd-spesial-grid">
              {spesialisasi.map((s, i) => (
                <div key={i} className="kd-spesial-card">
                  <span className="kd-spesial-icon">{s.icon}</span>
                  <h4 className="kd-spesial-judul">{s.judul}</h4>
                  <p className="kd-spesial-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── TESTIMONI ── */}
          <section className="kd-section">
            <h2 className="kd-section-h">Testimoni Klien</h2>

            <div className="kd-testi-header">
              <div className="kd-testi-score">
                <span className="kd-testi-big">{avgTestimoniRating}</span>
                <div>
                  <StarRating rating={parseFloat(avgTestimoniRating)} size={16} />
                  <span className="kd-testi-count">{testimoni.length} ulasan</span>
                </div>
              </div>

              <div className="kd-testi-bars">
                {[5,4,3,2,1].map((star) => {
                  const count = testimoni.filter((t) => t.rating === star).length;
                  return (
                    <div key={star} className="kd-testi-bar-row">
                      <span className="kd-testi-bar-label">{star} ★</span>
                      <div className="kd-testi-bar-track">
                        <div className="kd-testi-bar-fill" style={{ width: testimoni.length ? `${(count / testimoni.length) * 100}%` : "0%" }} />
                      </div>
                      <span className="kd-testi-bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Kategori masalah tags */}
              <div className="kd-testi-tags">
                <p className="kd-testi-tags-label">KATEGORI MASALAH DITANGANI</p>
                <span className="kd-testi-tag primary">{konselor.Kategori_Masalah.split(" ").slice(0,2).join(" ")}</span>
                <span className="kd-testi-tag">Stres Kuliah</span>
                <span className="kd-testi-tag">Motivasi</span>
              </div>
            </div>

            <div className="kd-testi-grid">
              {testimoni.map((t, i) => (
                <div key={i} className="kd-testi-card">
                  <StarRating rating={t.rating} size={13} />
                  <p className="kd-testi-text">"{t.teks}"</p>
                  <div className="kd-testi-author">
                    <div className="kd-testi-avatar">
                      {t.nama.charAt(0)}
                    </div>
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

        {/* ══ RIGHT COLUMN — BOOKING ══ */}
        <aside className="kd-right">
          <div className="kd-booking-card">
            <div className="kd-booking-header">
              <h3 className="kd-booking-h">Book a Session</h3>
              <p className="kd-booking-sub">Mulai perjalananmu bersama {konselor.Nama.split(" ")[0]} hari ini</p>
            </div>

            {/* Calendar */}
            <div className="kd-cal">
              <div className="kd-cal-nav">
                <button
                  className="kd-cal-arrow"
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                    else setCalMonth(m => m - 1);
                  }}
                >‹</button>
                <span className="kd-cal-title">{BULAN[calMonth]} {calYear}</span>
                <button
                  className="kd-cal-arrow"
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                    else setCalMonth(m => m + 1);
                  }}
                >›</button>
              </div>

              <div className="kd-cal-grid">
                {HARI.map((h) => (
                  <span key={h} className="kd-cal-day-label">{h}</span>
                ))}
                {calDays.map((d, i) => (
                  <button
                    key={i}
                    className={`kd-cal-day ${!d ? "kd-cal-empty" : ""} ${d === selectedDay && calMonth === new Date().getMonth() ? "kd-cal-selected" : ""} ${isToday(d) ? "kd-cal-today" : ""}`}
                    disabled={!d}
                    onClick={() => d && setSelectedDay(d)}
                  >
                    {d || ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div className="kd-slots">
              <p className="kd-slots-label">Pilihan Waktu yang Tersedia</p>
              <div className="kd-slots-grid">
                {JADWAL_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    className={`kd-slot-btn ${selectedSlot === slot ? "kd-slot-selected" : ""}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm */}
            {bookingDone ? (
              <div className="kd-booking-success">
                <span className="kd-booking-success-icon">✅</span>
                <p>Sesi berhasil dijadwalkan!</p>
                <span>{selectedDay} {BULAN[calMonth]} {calYear}, {selectedSlot}</span>
              </div>
            ) : (
              <button
                className="kd-confirm-btn"
                onClick={() => {
                  const user = localStorage.getItem("sanctuary_user");
                  if (!user) { sessionStorage.setItem("redirect_after_login", `/konselor/${konselor.ID}`); navigate("/login"); return; }
                  setBookingDone(true);
                }}
              >
                Confirm Booking →
              </button>
            )}

            <p className="kd-booking-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Sesi berlangsung 45 menit via platform Sanctuary. Kamu bisa reschedule hingga 2 jam sebelum sesi dimulai.
            </p>
          </div>

          {/* Konselor lain */}
          <div className="kd-other-card">
            <p className="kd-other-label">KONSELOR LAINNYA</p>
            {data_konselor
              .filter((k) => k.ID !== konselor.ID)
              .slice(0, 3)
              .map((k) => (
                <div
                  key={k.ID}
                  className="kd-other-item"
                  onClick={() => navigate(`/konselor/${k.ID}`)}
                >
                  <img src={k.image} alt={k.Nama} className="kd-other-photo" />
                  <div className="kd-other-info">
                    <p className="kd-other-name">{k.Nama}</p>
                    <p className="kd-other-kat">{k.Kategori_Masalah.split(" ").slice(0,3).join(" ")}</p>
                    <div className="kd-other-rating">
                      <span className="kd-other-star">★</span>
                      <span>{k["Rating_(Final)"].toFixed(1)}</span>
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="kd-other-arrow">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ))}
          </div>
        </aside>

      </div>

      {/* ── FOOTER ── */}
      <footer className="footer" style={{ width: "92%", margin: "80px auto 50px" }}>
        <div className="footer-brand">
          <h3 className="footer-name">The Sanctuary Polimedia</h3>
          <p className="footer-desc">Platform konseling sebaya untuk mahasiswa Polimedia yang menyediakan ruang aman untuk saling mendengarkan.</p>
          <small className="footer-copy">© 2026 TheSanctuary. Politeknik Negeri Media Kreatif.</small>
        </div>
        {[
          { heading: "Platform", links: ["Layanan","Komunitas","Artikel","Panduan Konseling"] },
          { heading: "Legal",    links: ["Kebijakan Privasi","Syarat dan Ketentuan","Bantuan"] },
        ].map((col) => (
          <div key={col.heading} className="footer-col">
            <h4 className="footer-col-h">{col.heading}</h4>
            <ul className="footer-links">{col.links.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        ))}
      </footer>

    </div>
  );
}