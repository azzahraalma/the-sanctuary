import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useKonselor } from "../hooks/useKonselor.js";
import { supabase } from "../lib/supabase.js";
import "../styles/konselor.css";

function StarRating({ rating }) {
  return (
    <div className="kon-stars">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = n <= Math.floor(rating);
        const half = !full && n === Math.ceil(rating) && rating % 1 >= 0.25;
        return (
          <svg
            key={n}
            className={`kon-star-svg ${full ? "s-full" : half ? "s-half" : "s-empty"}`}
            viewBox="0 0 24 24"
            width="13"
            height="13"
          >
            <defs>
              {half && (
                <linearGradient id={`khalf-${n}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              )}
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={full ? "currentColor" : half ? `url(#khalf-${n})` : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        );
      })}
      <span className="kon-rating-val">{rating.toFixed(1)}</span>
    </div>
  );
}

function KatBadge({ kat }) {
  const map = {
    "Tekanan Akademik & Kesejahteraan Mahasiswa": { short: "AKD", color: "#2f7d79" },
    "Perencanaan Karier & Kehidupan Kampus": { short: "KAR", color: "#5e9ea0" },
    "Pengelolaan Kebiasaan & Emosi Mahasiswa": { short: "EMO", color: "#79a88e" },
    "Kelelahan Akademik & Aktivitas Kampus": { short: "BRN", color: "#a07c5e" },
  };
  const info = map[kat] || { short: "KON", color: "#888" };
  return (
    <span
      className="kon-kat-badge"
      style={{ background: info.color + "22", color: info.color, border: `1px solid ${info.color}44` }}
    >
      {info.short}
    </span>
  );
}

function SkeletonCard() {
  return (
    <article className="kon-card kon-card--skeleton">
      <div className="kon-card-photo-wrap skel-box" style={{ height: 180 }} />
      <div className="kon-card-info" style={{ gap: 8 }}>
        <div className="skel-box" style={{ height: 16, width: "60%", borderRadius: 4 }} />
        <div className="skel-box" style={{ height: 12, width: "85%", borderRadius: 4 }} />
        <div className="skel-box" style={{ height: 12, width: "40%", borderRadius: 4 }} />
        <div className="skel-box" style={{ height: 8, borderRadius: 4 }} />
        <div className="skel-box" style={{ height: 32, borderRadius: 6, marginTop: 8 }} />
      </div>
    </article>
  );
}

function FooterModal({ type, onClose }) {
  if (!type) return null;

  const content = {
    privasi: {
      title: "Kebijakan Privasi",
      sections: [
        {
          heading: "Informasi yang Kami Kumpulkan",
          body: "Kami mengumpulkan informasi yang kamu berikan secara langsung, seperti nama, alamat email, dan data profil saat mendaftar. Kami juga mengumpulkan data penggunaan layanan secara anonim untuk meningkatkan pengalaman pengguna.",
        },
        {
          heading: "Bagaimana Kami Menggunakan Informasimu",
          body: "Informasi yang kami kumpulkan digunakan untuk menyediakan layanan konseling sebaya, menghubungkan kamu dengan konselor yang tepat, serta mengirimkan notifikasi terkait jadwal dan sesi konselingmu.",
        },
        {
          heading: "Kerahasiaan Sesi Konseling",
          body: "Semua percakapan dalam sesi konseling bersifat rahasia. Kami tidak membagikan konten sesi kepada pihak ketiga tanpa persetujuan eksplisit darimu, kecuali diwajibkan oleh hukum yang berlaku.",
        },
        {
          heading: "Keamanan Data",
          body: "Kami menggunakan enkripsi standar industri untuk melindungi data pribadimu. Akses ke data dibatasi hanya untuk personel yang berwenang dan diperlukan untuk operasional layanan.",
        },
        {
          heading: "Hubungi Kami",
          body: "Jika kamu memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui email: privacy@thesanctuary.id",
        },
      ],
    },
    syarat: {
      title: "Syarat dan Ketentuan",
      sections: [
        {
          heading: "Penerimaan Syarat",
          body: "Dengan menggunakan layanan The Sanctuary, kamu menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika kamu tidak setuju, mohon untuk tidak menggunakan layanan kami.",
        },
        {
          heading: "Penggunaan Layanan",
          body: "The Sanctuary adalah platform konseling sebaya yang ditujukan untuk mahasiswa Polimedia. Layanan ini bukan pengganti konseling profesional atau layanan kesehatan mental klinis. Untuk kondisi darurat, segera hubungi tenaga profesional.",
        },
        {
          heading: "Kewajiban Pengguna",
          body: "Kamu bertanggung jawab untuk menjaga kerahasiaan akun dan tidak membagikan informasi login kepada orang lain. Segala aktivitas yang terjadi melalui akunmu adalah tanggung jawabmu.",
        },
        {
          heading: "Kode Etik",
          body: "Semua pengguna diharapkan berinteraksi dengan saling menghormati. Perilaku yang merendahkan, melecehkan, atau merugikan pengguna lain akan mengakibatkan penangguhan akun.",
        },
        {
          heading: "Perubahan Layanan",
          body: "Kami berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja dengan pemberitahuan sebelumnya. Perubahan syarat dan ketentuan akan diberitahukan melalui email atau notifikasi aplikasi.",
        },
      ],
    },
    bantuan: {
      title: "Pusat Bantuan",
      sections: [
        {
          heading: "Cara Booking Sesi",
          body: "Kunjungi halaman Konselor, pilih konselor yang sesuai kebutuhanmu, lalu pilih jadwal yang tersedia. Konfirmasi booking dan kamu akan mendapat notifikasi setelah konselor menyetujui sesi.",
        },
        {
          heading: "Bergabung ke Sesi",
          body: "Saat waktu sesi tiba, tombol 'Mulai Sesi' akan muncul di dashboard. Klik tombol tersebut untuk masuk ke ruang konseling online bersama konselormu.",
        },
        {
          heading: "Membatalkan Sesi",
          body: "Pembatalan sesi dapat dilakukan melalui halaman Riwayat Sesi minimal 1 jam sebelum waktu sesi dimulai. Pembatalan mendadak kurang dari 1 jam akan dicatat sebagai ketidakhadiran.",
        },
        {
          heading: "Masalah Teknis",
          body: "Jika kamu mengalami masalah teknis saat menggunakan platform, coba refresh halaman atau hapus cache browser. Jika masalah berlanjut, hubungi tim support kami.",
        },
        {
          heading: "Hubungi Support",
          body: "📧 support@thesanctuary.id\n📱 WhatsApp: 0812-3456-7890 (Senin–Jumat, 08.00–17.00 WIB)\n🏢 Gedung Polimedia, Ruang Kemahasiswaan Lt. 2",
        },
      ],
    },
    panduan: {
      title: "Panduan Konseling Sebaya",
      sections: [
        {
          heading: "Sebelum Memulai Konseling",
          body: "Pastikan kamu sudah menentukan topik atau permasalahan yang ingin dibahas. Siapkan koneksi internet yang stabil dan pilih tempat yang nyaman agar sesi konseling berjalan lebih efektif."
        },
        {
          heading: "Memilih Konselor",
          body: "Masuk ke halaman daftar konselor, lihat profil serta bidang pendampingan yang tersedia. Pilih konselor yang paling sesuai dengan kebutuhanmu, kemudian lanjutkan ke proses pemilihan jadwal."
        },
        {
          heading: "Mengajukan Permintaan Sesi",
          body: "Pilih waktu konseling yang tersedia lalu kirim permintaan sesi. Tunggu persetujuan dari konselor. Setelah disetujui, detail sesi akan tersedia pada menu jadwal konseling."
        },
        {
          heading: "Saat Konseling Berlangsung",
          body: "Gunakan fitur ruang konseling untuk memulai percakapan dengan konselor. Sampaikan cerita dan perasaanmu secara terbuka agar konselor dapat memberikan pendampingan yang tepat."
        },
        {
          heading: "Aturan Selama Sesi",
          body: "Jaga komunikasi yang sopan, hargai privasi, dan hindari membagikan informasi pribadi orang lain. Seluruh percakapan selama sesi bersifat rahasia dan digunakan hanya untuk kebutuhan pendampingan."
        },
        {
          heading: "Setelah Sesi Selesai",
          body: "Kamu dapat memberikan evaluasi atau feedback mengenai pengalaman konseling. Feedback tersebut membantu meningkatkan kualitas layanan konseling sebaya."
        }
      ]
    }
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
          <button type="button" className="footer-modal-close" onClick={onClose}>✕</button>
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
          <button type="button" className="footer-modal-close-btn" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default function Konselor() {
  const navigate = useNavigate();

  const { data: data_konselor, loading, error } = useKonselor();

  const [footerModal, setFooterModal] = useState(null);

  const ALL_KATEGORI = useMemo(
    () => [...new Set(data_konselor.map((k) => k.Kategori_Masalah))],
    [data_konselor]
  );

  const [filterKat, setFilterKat] = useState([]);
  const [filterLevel, setFilterLevel] = useState("Semua Level");
  const [filterAvail, setFilterAvail] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const toggleKat = (kat) =>
    setFilterKat((prev) =>
      prev.includes(kat) ? prev.filter((k) => k !== kat) : [...prev, kat]
    );

  const toggleAvail = (a) =>
    setFilterAvail((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const resetFilters = () => {
    setFilterKat([]);
    setFilterLevel("Semua Level");
    setFilterAvail([]);
    setSearchQuery("");
  };

  const filtered = useMemo(() => {
    return data_konselor.filter((k) => {
      if (filterKat.length && !filterKat.includes(k.Kategori_Masalah)) return false;
      if (filterLevel !== "Semua Level") {
        const exp = k.Pengalaman || "";
        if (filterLevel === "Junior" && !exp.includes("1") && !exp.includes("2")) return false;
        if (filterLevel === "Senior" && parseInt(exp) < 3) return false;
      }
      if (filterAvail.length) {
        const avail = k.availability || [];
        if (!filterAvail.some((a) => avail.includes(a))) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !k.Nama.toLowerCase().includes(q) &&
          !k.Kategori_Masalah.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [data_konselor, filterKat, filterLevel, filterAvail, searchQuery]);

  const displayed = showAll ? filtered : filtered.slice(0, 6);

  const goTo = (dest) => {
    const user = localStorage.getItem("sanctuary_user");
    if (user) navigate(dest);
    else {
      sessionStorage.setItem("redirect_after_login", dest);
      navigate("/login");
    }
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  })();

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  return (
    <div className="sanctuary kon-page">

      <FooterModal type={footerModal} onClose={() => setFooterModal(null)} />

      <header className="nav-shell">
        <nav className="nav">
          <div className="nav-l">
            <span className="nav-logo" onClick={() => navigate("/?home=1")}>
              The<br className="nav-logo-br" />Sanctuary
            </span>
            <ul className="nav-menu">
              <li className="nav-item" onClick={() => navigate("/?home=1")}>Beranda</li>
              <li className="nav-item is-active">Konselor</li>
              <li className="nav-item" onClick={() => goTo("/dashboard")}>Beranda</li>
            </ul>
          </div>
          <div className="nav-r">
            <button type="button" className="nav-cta" onClick={() => goTo("/kuesioner")}>
              Mulai Refleksi Diri
            </button>
            <button type="button" className="nav-icon-btn" aria-label="Notifikasi" onClick={() => goTo("/notifikasi")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {user ? (
              <div className="nav-user-wrap">
                <div
                  className="nav-avatar nav-avatar--active"
                  onClick={() => goTo("/dashboard")}
                  title={user.name}
                >
                  <span className="nav-avatar-initial">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <button type="button" className="nav-logout-btn" onClick={handleLogout}>
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

      <section className="kon-hero">
        <div className="kon-hero-inner">
          <span className="kon-hero-pill">Konselor Sebaya Aktif</span>
          <h1 className="kon-hero-h1">Daftar Konselor</h1>
          <p className="kon-hero-sub">
            Panduan pilihan untuk perjalanan ketangguhanmu. Terhubung dengan konselor
            sebaya yang memahami kehidupan kampus dari dalam.
          </p>
          <div className="kon-searchbar">
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              width="16" height="16" className="kon-search-icon"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau spesialisasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="kon-search-input"
            />
            {searchQuery && (
              <button type="button" className="kon-search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>
      </section>

      <div className="kon-body">

        <aside className="kon-sidebar">
          <div className="kon-sidebar-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            <span>Saring Hasil</span>
          </div>

          <div className="kon-filter-group">
            <p className="kon-filter-label">SPESIALISASI</p>
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skel-box" style={{ height: 14, borderRadius: 4, marginBottom: 8 }} />
                ))}
              </>
            ) : (
              ALL_KATEGORI.map((kat) => (
                <label key={kat} className="kon-checkbox-row">
                  <input
                    type="checkbox"
                    checked={filterKat.includes(kat)}
                    onChange={() => toggleKat(kat)}
                    className="kon-checkbox"
                  />
                  <span className="kon-checkbox-custom" />
                  <span className="kon-checkbox-text">{kat}</span>
                </label>
              ))
            )}
          </div>

          <div className="kon-filter-group">
            <p className="kon-filter-label">PENGALAMAN</p>
            <div className="kon-select-wrap">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="kon-select"
              >
                <option>Semua Level</option>
                <option>Junior</option>
                <option>Senior</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                width="12" height="12" className="kon-select-arrow">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="kon-filter-group">
            <p className="kon-filter-label">KETERSEDIAAN</p>
            <div className="kon-avail-wrap">
              {["Hari ini", "Minggu ini", "Sesi Malam"].map((a) => (
                <button
                  type="button"
                  key={a}
                  className={`kon-avail-btn ${filterAvail.includes(a) ? "aktif" : ""}`}
                  onClick={() => toggleAvail(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="kon-reset-btn" onClick={resetFilters}>Reset Filters</button>
        </aside>

        <div className="kon-grid-wrap">

          {error && (
            <div className="kon-empty">
              <div className="kon-empty-icon">⚠️</div>
              <h3 className="kon-empty-h">Gagal memuat data konselor</h3>
              <p className="kon-empty-p">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="kon-result-info">
              <span className="kon-result-count">
                Menampilkan <strong>{displayed.length}</strong> dari{" "}
                <strong>{filtered.length}</strong> konselor
              </span>
              {(filterKat.length > 0 || filterAvail.length > 0 || searchQuery) && (
                <button type="button" className="kon-clear-all" onClick={resetFilters}>
                  Hapus semua filter ✕
                </button>
              )}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="kon-empty">
              <div className="kon-empty-icon">🔍</div>
              <h3 className="kon-empty-h">Tidak ada konselor yang cocok</h3>
              <p className="kon-empty-p">Coba ubah atau hapus filter yang aktif.</p>
              <button type="button" className="kon-reset-btn" style={{ margin: "0 auto" }} onClick={resetFilters}>
                Reset Semua Filter
              </button>
            </div>
          )}

          <div className="kon-grid">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : displayed.map((k, i) => {
                  const avail = k.availability || [];
                  return (
                    <article
                      key={k.ID}
                      className="kon-card"
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="kon-card-photo-wrap">
                        <img
                          src={k.image}
                          alt={k.Nama}
                          className="kon-card-photo"
                          onError={(e) => { e.target.src = "/placeholder-avatar.png"; }}
                        />
                        <div className="kon-card-photo-overlay">
                          <button
                            type="button"
                            className="kon-card-book-btn"
                            onClick={() => goTo(`/konselor/${k.ID}`)}
                          >
                            Buat Janji
                          </button>
                        </div>
                        <div className="kon-card-rating-badge">
                          <span className="kon-card-rating-star">★</span>
                          <span>{k["Rating_(Final)"].toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="kon-card-info">
                        <div className="kon-card-top">
                          <h3 className="kon-card-name">{k.Nama}</h3>
                          <KatBadge kat={k.Kategori_Masalah} />
                        </div>
                        <p className="kon-card-kat">{k.Kategori_Masalah}</p>
                        <StarRating rating={k["Rating_(Final)"]} />
                        <div className="kon-card-meta">
                          <span className="kon-card-exp">{k.Pengalaman}</span>
                          <span className="kon-card-cases">
                            {k.Kasus_Selesai}/{k.Jumlah_Kasus} kasus
                          </span>
                        </div>
                        <div className="kon-card-bar-wrap">
                          <div className="kon-card-bar-track">
                            <div
                              className="kon-card-bar-fill"
                              style={{
                                width: `${Math.round(k.Success_Rate * 100)}%`,
                                background:
                                  k.Success_Rate >= 0.6
                                    ? "#2f7d79"
                                    : k.Success_Rate >= 0.3
                                    ? "#79d8d1"
                                    : "#e8c4a0",
                              }}
                            />
                          </div>
                          <span className="kon-card-sr">
                            {Math.round(k.Success_Rate * 100)}% success
                          </span>
                        </div>
                        {avail.length > 0 && (
                          <div className="kon-card-avail">
                            {avail.map((a) => (
                              <span key={a} className="kon-avail-tag">{a}</span>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          className="kon-card-cta"
                          onClick={() => goTo(`/konselor/${k.ID}`)}
                        >
                          View Profile →
                        </button>
                      </div>
                    </article>
                  );
                })}
          </div>

          {!loading && !showAll && filtered.length > 6 && (
            <div className="kon-loadmore-wrap">
              <p className="kon-loadmore-info">
                Menampilkan {displayed.length} dari {filtered.length} konselor di ruang Anda.
              </p>
              <button type="button" className="kon-loadmore-btn" onClick={() => setShowAll(true)}>
                Tampilkan lebih banyak konselor
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
        </div>
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