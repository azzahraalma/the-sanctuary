import "../styles/home.css";
import data_konselor from "../data/data_konselor";
import data_booking from "../data/data_booking";
import analisis_konselor from "../data/analisis_konselor";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

// ── Hitung statistik realtime dari data dummy ────────────────────────────────
const bookingBersih = data_booking.filter((b) => b.ID_Booking !== null);
const totalKasus    = bookingBersih.length;
const kasusSelesai  = bookingBersih.filter((b) => b.Status === "Selesai").length;
const successRate   = Math.round((kasusSelesai / totalKasus) * 100);

const kategoriCount = bookingBersih.reduce((acc, b) => {
  acc[b.Kategori_Masalah] = (acc[b.Kategori_Masalah] || 0) + 1;
  return acc;
}, {});

const rataRating = (
  data_konselor.reduce((s, k) => s + k["Rating_(Final)"], 0) / data_konselor.length
).toFixed(1);

const probSukses = analisis_konselor.find(
  (a) => a.Metrik_Tim === "Probabilitas Sukses Tim"
)?.Rumus_Excel ?? 0;

// ── Helper: cek session & arahkan ke tujuan atau login ───────────────────────
// destination: path tujuan kalau sudah login (mis. "/konselor", "/dashboard")
function useAuthNav() {
  const navigate = useNavigate();

  const goTo = (destination) => {
    const user = localStorage.getItem("sanctuary_user");
    if (user) {
      navigate(destination);
    } else {
      // Simpan tujuan asal agar setelah login bisa redirect ke sana
      sessionStorage.setItem("redirect_after_login", destination);
      navigate("/login");
    }
  };

  return goTo;
}

// ── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = n <= Math.floor(rating);
        const half = !full && n === Math.ceil(rating) && rating % 1 >= 0.25;
        return (
          <svg
            key={n}
            className={`star-svg ${full ? "s-full" : half ? "s-half" : "s-empty"}`}
            viewBox="0 0 24 24"
            width="13"
            height="13"
          >
            <defs>
              {half && (
                <linearGradient id={`half-${n}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              )}
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={full ? "currentColor" : half ? `url(#half-${n})` : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        );
      })}
      <span className="rating-val">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── AnimatedCounter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const duration = 1800;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = (ease * target).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, decimals]);

  return <span ref={ref}>0{suffix}</span>;
}

// ── MiniBar ──────────────────────────────────────────────────────────────────
function MiniBar({ label, value, max = 5 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="mini-bar">
      <div className="mini-bar-label">
        <span>{label}</span>
        <span className="mini-bar-val">{value.toFixed(1)}</span>
      </div>
      <div className="mini-bar-track">
        <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Journey steps ────────────────────────────────────────────────────────────
const steps = [
  {
    n: "01",
    title: "Tes Refleksi Diri",
    body: "Jawab beberapa pertanyaan sederhana untuk membantu memahami kondisi dan kebutuhan Anda saat ini di lingkungan perkuliahan..",
    cta: "Mulai Tes Refleksi Diri",
    dest: "/kuesioner",
  },
  {
    n: "02",
    title: "Pencocokan Konselor Sebaya",
    body: "Anda akan dihubungkan dengan beberapa konselor sebaya yang sesuai dengan kebutuhan dan situasi yang Anda hadapi..",
    cta: null,
  },
  {
    n: "03",
    title: "Sesi Konseling Sebaya",
    body: "Mulai sesi pada jadwal yang telah ditentukan untuk berdiskusi dan mencari solusi bersama konselor sebaya.",
    cta: null,
  },
];

// ── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const goTo     = useAuthNav();
  const statsRef = useRef(null);

  // Ambil info user dari session (untuk tampilan navbar)
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem("sanctuary_user");
    sessionStorage.removeItem("redirect_after_login");
    navigate("/login");
  };

  const handleScrollToStats = () => {
    statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sanctuary">

      {/* ── NAVBAR ── */}
      <header className="nav-shell">
        <nav className="nav">
          <div className="nav-l">
            <span className="nav-logo">The Sanctuary</span>
            <ul className="nav-menu">
              <li className="nav-item is-active">Beranda</li>
              {/* Konselor → butuh login → /konselor */}
              <li className="nav-item" onClick={() => goTo("/konselor")}>Konselor</li>
              {/* Dashboard → butuh login → /dashboard */}
              <li className="nav-item" onClick={() => goTo("/dashboard")}>Dashboard</li>
            </ul>
          </div>
          <div className="nav-r">
            <button className="nav-cta" onClick={() => goTo("/konselor")}>
              Temukan Konselor
            </button>

            {/* Notif → butuh login → /dashboard */}
            <button className="nav-icon-btn" aria-label="Notifikasi" onClick={() => goTo("/dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* Avatar: kalau sudah login tampil nama + tombol logout, kalau belum ke /login */}
            {user ? (
              <div className="nav-user-wrap">
                <div
                  className="nav-avatar nav-avatar--active"
                  onClick={() => goTo("/dashboard")}
                  style={{ cursor: "pointer" }}
                  aria-label="Profil"
                  title={user.name}
                >
                  <span className="nav-avatar-initial">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button className="nav-logout-btn" onClick={handleLogout} title="Keluar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                className="nav-avatar"
                onClick={() => navigate("/login")}
                style={{ cursor: "pointer" }}
                aria-label="Profil"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-h1">
            Temukan <em>Ruang Aman</em> untuk <em>bercerita</em> dengan <em>konselor sebaya</em>
          </h1>
          <p className="hero-body">
            Hadapi lika-liku kehidupan bersama pandangan terpercaya. Platform kami
            Nggak perlu hadapi semua sendiri. Di sini kamu bisa cerita dan ngobrol dengan 
            teman sebaya di kampus yang siap mendengarkan dan bantu kamu cari jalan keluar bareng-bareng.
          </p>
          <div className="hero-btns">
            {/* Mulai Perjalanan → kalau login → /dashboard, kalau belum → /login */}
            <button className="btn-primary" onClick={() => goTo("/konselor")}>
              Mulai Perjalananmu
            </button>
            <button className="btn-ghost" onClick={handleScrollToStats}>
              Bagaimana cara kami membantu?
            </button>
          </div>
        </div>

        <div className="hero-media">
          <img src="/counseling_illust.jpg" alt="Sesi konseling" className="hero-photo" />
          <div className="hero-badge">
            <span className="hero-badge-icon">🛡️</span>
            <div>
              <p className="hero-badge-title">Penasihat Terpercaya</p>
              <p className="hero-badge-sub">
                Bersama konselor sebaya dari lingkungan kampus yang berpengalaman, 
                Anda dapat berdiskusi dan menemukan solusi untuk setiap masalah
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats" ref={statsRef}>
        <h2 className="stats-h2">Ruang Aman Buat Kamu</h2>
        <p className="stats-sub">
        Platform ini dibuat untuk jadi tempat cerita antar teman sebaya di kampus Polimedia 
        dengan hangat, nyaman, dan tanpa rasa di-judge.
        </p>

        {/* Stat cards utama */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-big">
              <AnimatedCounter target={kasusSelesai} />
            </span>
            <span className="stat-micro">dari {totalKasus} total sesi</span>
            <span className="stat-label">Kasus Diselesaikan</span>
          </div>
          <div className="stat-card">
            <span className="stat-big">
              <AnimatedCounter target={successRate} suffix="%" />
            </span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-card">
            <span className="stat-big">
              <AnimatedCounter target={parseFloat(rataRating)} decimals={1} suffix="/5" />
            </span>
            <span className="stat-label">Rata-rata Rating Konselor</span>
          </div>
          <div className="stat-card">
            <span className="stat-big">
              <AnimatedCounter target={Math.round(probSukses * 100)} suffix="%" />
            </span>
            <span className="stat-label">Probabilitas Sukses Tim</span>
          </div>
        </div>

        {/* Sub-stats detail */}
        <div className="stats-detail-row">

          {/* Distribusi kategori */}
          <div className="stats-detail-card">
            <h4 className="sdc-title">Distribusi Kasus per Kategori</h4>
            <div className="kategori-bars">
              {Object.entries(kategoriCount)
                .sort((a, b) => b[1] - a[1])
                .map(([kat, jumlah]) => (
                  <div key={kat} className="kat-row">
                    <span className="kat-label">{kat}</span>
                    <div className="kat-track">
                      <div
                        className="kat-fill"
                        style={{ width: `${(jumlah / totalKasus) * 100}%` }}
                      />
                    </div>
                    <span className="kat-count">{jumlah}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Donut status */}
          <div className="stats-detail-card">
            <h4 className="sdc-title">Status Sesi Konseling</h4>
            <div className="status-donut-wrap">
              <svg viewBox="0 0 200 200" width="220" height="220" className="donut-svg">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e8e8e8" strokeWidth="22" />
                <circle
                  cx="100" cy="100" r="80" fill="none"
                  stroke="#2f7d79" strokeWidth="22"
                  strokeDasharray={`${(kasusSelesai / totalKasus) * 502} 502`}
                  strokeDashoffset="125"
                  strokeLinecap="round"
                />
                <text x="100" y="95" textAnchor="middle" fontSize="26" fontWeight="bold" fill="#2f7d79">
                  {successRate}%
                </text>
                <text x="100" y="120" textAnchor="middle" fontSize="12" fill="#888">
                  selesai
                </text>
              </svg>
              <div className="donut-legend">
                <div className="donut-item">
                  <span className="donut-dot" style={{ background: "#2f7d79" }} />
                  <span>Selesai ({kasusSelesai})</span>
                </div>
                <div className="donut-item">
                  <span className="donut-dot" style={{ background: "#e8e8e8" }} />
                  <span>Berjalan ({totalKasus - kasusSelesai})</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features">
        <div className="feat feat-light">
          <div className="feat-icon-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="feat-h3">Pendengar yang baik</h3>
          <p className="feat-p">
            Di sini kamu ketemu teman sebaya yang ngerti rasanya jadi mahasiswa yang bukan 
            sekadar denger, tapi benar-benar memahami.
          </p>
        </div>

        <div className="feat feat-dark">
          <div className="feat-shield">🛡️</div>
          <h3 className="feat-h3">Cerita Kamu Aman</h3>
          <p className="feat-p">
            Setiap percakapan bersifat pribadi dan hanya diketahui oleh Anda dan konselor sebaya 
            yang mendampingi. Pesan dilindungi dengan enkripsi end-to-end.
          </p>
        </div>

        <div className="feat feat-green">
          <div className="feat-icon-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="feat-h3">Dukungan yang Mudah Diakses</h3>
          <p className="feat-p">
            Kami menyediakan ruang bagi mahasiswa untuk mendapatkan dukungan 
            kapan pun dibutuhkan dalam lingkungan kampus yang aman dan mendukung.
          </p>
        </div>

        <div className="feat feat-light">
          <h3 className="feat-h3">Komunitas Konseling Sebaya</h3>
          <p className="feat-p">
            Mahasiswa dapat bergabung dalam kelompok diskusi yang dipandu oleh 
            konselor sebaya untuk saling berbagi pengalaman dan dukungan dalam lingkungan yang positif.
          </p>
          <div className="feat-avatars">
            {[1, 2, 3, 4].map((i) => (
              <img key={i} src={`/mentor${i}.jpg`} alt="" className="feat-av" />
            ))}
            <span className="feat-av-extra">+{totalKasus - 4}</span>
          </div>
        </div>
      </section>

      {/* ── JOURNEY ── */}
      <section className="journey">
        <div className="journey-left">
          {steps.map((s, i) => (
            <div key={s.n} className={`step ${i < steps.length - 1 ? "step-line" : ""}`}>
              <span className="step-n">{s.n}</span>
              <div className="step-content">
                <h4 className="step-h4">{s.title}</h4>
                <p className="step-p">{s.body}</p>
                {s.cta && (
                  <button className="step-cta" onClick={() => goTo(s.dest)}>
                    {s.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="journey-right">
          <h2 className="journey-h2">
            Setiap Langkah Dirancang untuk Membantu Anda
          </h2>
          <p className="journey-p">
           Kami menyederhanakan proses agar mahasiswa dapat dengan mudah mengakses dukungan 
           tanpa proses yang rumit, sehingga percakapan dapat dimulai dengan lebih nyaman 
           dan langsung.
          </p>
          <div className="journey-img-box">
            <img src="/journey.jpg" alt="" className="journey-img" />
          </div>
        </div>
      </section>

      {/* ── MENTORS ── */}
      <section className="mentors">
        <div className="mentors-hd">
          <div>
            <h2 className="mentors-h2">Konselor Sebaya Aktif</h2>
            <p className="mentors-sub">Teman-teman mahasiswa yang siap mendengarkan dan menemani kamu</p>
          </div>
          <div className="mentors-arrows">
            <button className="arrow-btn">‹</button>
            <button className="arrow-btn">›</button>
          </div>
        </div>

        <div className="mentors-grid">
          {data_konselor.slice(0, 4).map((m) => (
            <article className="mcard" key={m.ID}>
              <div className="mcard-photo-wrap">
                <img src={m.image} alt={m.Nama} className="mcard-photo" />
                <div className="mcard-hover-layer">
                  {/* Buat Janji → butuh login → /konselor */}
                  <button className="mcard-book" onClick={() => goTo("/konselor")}>
                    Buat Janji
                  </button>
                </div>
              </div>
              <div className="mcard-info">
                <h3 className="mcard-name">{m.Nama}</h3>
                <span className="mcard-cat">{m.Kategori_Masalah}</span>
                <StarRating rating={m["Rating_(Final)"]} />
                <div className="mcard-meta">
                  <span className="mcard-exp">• {m.Pengalaman} pengalaman</span>
                  <span className="mcard-cases">{m.Kasus_Selesai}/{m.Jumlah_Kasus} kasus</span>
                </div>
                <div className="mcard-rate-bar">
                  <div
                    className="mcard-rate-fill"
                    style={{
                      width: `${Math.round(m["Success_Rate"] * 100)}%`,
                      background:
                        m["Success_Rate"] >= 0.6 ? "#2f7d79"
                        : m["Success_Rate"] >= 0.3 ? "#79d8d1"
                        : "#e8c4a0",
                    }}
                  />
                </div>
                <span className="mcard-sr">
                  Success rate: {Math.round(m["Success_Rate"] * 100)}%
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta">
        <div className="cta-box">
          <h2 className="cta-h2">Mulai Langkah Anda Bersama Konselor Sebaya Sanctuary Polimedia</h2>
          <p className="cta-p">
            Mulai satu percakapan sederhana bersama konselor sebaya 
            yang siap mendengarkan dan membantu Anda.
          </p>
          <div className="cta-btns">
            {/* Buat Akun → kalau belum login ke /register, kalau udah ke /dashboard */}
            <button className="cta-btn-solid" onClick={() => user ? navigate("/dashboard") : navigate("/register")}>
              {user ? "Buka Dashboard" : "Buat Akun Gratis"}
            </button>
            {/* Hubungi Konselor → butuh login → /konselor */}
            <button className="cta-btn-ghost" onClick={() => goTo("/konselor")}>
              Hubungi Konselor
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-brand">
          <h3 className="footer-name">The Sanctuary Polimedia</h3>
          <p className="footer-desc">
            Platform konseling sebaya untuk mahasiswa Polimedia
            yang menyediakan ruang aman untuk saling mendengarkan dan mendukung di lingkungan kampus.
          </p>
          <small className="footer-copy">
            © 2026 TheSanctuary. Politeknik Negeri Media Kreatif.
          </small>
        </div>
        {[
          { heading: "Platform", links: ["Layanan", "Komunitas", "Artikel", "Panduan Konseling"] },
          { heading: "Legal",    links: ["Kebijakan Privasi", "Syarat dan Ketentuan", "Bantuan"] },
        ].map((col) => (
          <div key={col.heading} className="footer-col">
            <h4 className="footer-col-h">{col.heading}</h4>
            <ul className="footer-links">
              {col.links.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        ))}
      </footer>

    </div>
  );
}