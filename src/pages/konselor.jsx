import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import data_konselor from "../data/data_konselor";
import "../styles/konselor.css";

// ── StarRating ────────────────────────────────────────────────────────────────
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

// ── Badge singkatan kategori ──────────────────────────────────────────────────
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

// ── Unique kategori dari data ─────────────────────────────────────────────────
const ALL_KATEGORI = [...new Set(data_konselor.map((k) => k.Kategori_Masalah))];

// ── Ketersediaan dummy (key pakai string ID sesuai data: "K-001", dst) ────────
const AVAILABILITY = {
  "K-001": ["Hari ini", "Minggu ini"],
  "K-002": ["Minggu ini", "Sesi Malam"],
  "K-003": ["Hari ini"],
  "K-004": ["Hari ini", "Sesi Malam"],
};

export default function Konselor() {
  const navigate = useNavigate();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterKat, setFilterKat] = useState([]);
  const [filterLevel, setFilterLevel] = useState("Semua Level");
  const [filterAvail, setFilterAvail] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

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

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return data_konselor.filter((k) => {
      if (filterKat.length && !filterKat.includes(k.Kategori_Masalah)) return false;

      if (filterLevel !== "Semua Level") {
        const exp = k.Pengalaman || "";
        if (filterLevel === "Junior" && !exp.includes("1") && !exp.includes("2")) return false;
        if (filterLevel === "Senior" && parseInt(exp) < 3) return false;
      }

      if (filterAvail.length) {
        const avail = AVAILABILITY[k.ID] || [];
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
  }, [filterKat, filterLevel, filterAvail, searchQuery]);

  const displayed = showAll ? filtered : filtered.slice(0, 6);

  // ── Auth nav helper ─────────────────────────────────────────────────────────
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
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  return (
    <div className="sanctuary kon-page">

      {/* ── NAVBAR ── */}
      <header className="nav-shell">
        <nav className="nav">
          <div className="nav-l">
            <span className="nav-logo" onClick={() => navigate("/")}>The Sanctuary</span>
            <ul className="nav-menu">
              <li className="nav-item" onClick={() => navigate("/")}>Beranda</li>
              <li className="nav-item is-active">Konselor</li>
              <li className="nav-item" onClick={() => goTo("/dashboard")}>Dashboard</li>
            </ul>
          </div>
          <div className="nav-r">
            <button className="nav-cta" onClick={() => goTo("/kuesioner")}>
              Mulai Refleksi Diri
            </button>
            <button className="nav-icon-btn" aria-label="Notifikasi" onClick={() => goTo("/dashboard")}>
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

      {/* ── HERO HEADER ── */}
      <section className="kon-hero">
        <div className="kon-hero-inner">
          <span className="kon-hero-pill">👥 Konselor Sebaya Aktif</span>
          <h1 className="kon-hero-h1">Daftar Konselor</h1>
          <p className="kon-hero-sub">
            Panduan pilihan untuk perjalanan ketangguhanmu. Terhubung dengan konselor
            sebaya yang memahami kehidupan kampus dari dalam.
          </p>
          {/* Search bar */}
          <div className="kon-searchbar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
              className="kon-search-icon"
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
              <button className="kon-search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="kon-body">

        {/* ── SIDEBAR FILTER ── */}
        <aside className="kon-sidebar">
          <div className="kon-sidebar-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            <span>Saring Hasil</span>
          </div>

          {/* Spesialisasi */}
          <div className="kon-filter-group">
            <p className="kon-filter-label">SPESIALISASI</p>
            {ALL_KATEGORI.map((kat) => (
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
            ))}
          </div>

          {/* Pengalaman */}
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="12"
                height="12"
                className="kon-select-arrow"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Ketersediaan */}
          <div className="kon-filter-group">
            <p className="kon-filter-label">KETERSEDIAAN</p>
            <div className="kon-avail-wrap">
              {["Hari ini", "Minggu ini", "Sesi Malam"].map((a) => (
                <button
                  key={a}
                  className={`kon-avail-btn ${filterAvail.includes(a) ? "aktif" : ""}`}
                  onClick={() => toggleAvail(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button className="kon-reset-btn" onClick={resetFilters}>
            Reset Filters
          </button>
        </aside>

        {/* ── GRID KONSELOR ── */}
        <div className="kon-grid-wrap">

          {/* Result count */}
          <div className="kon-result-info">
            <span className="kon-result-count">
              Menampilkan <strong>{displayed.length}</strong> dari{" "}
              <strong>{filtered.length}</strong> konselor
            </span>
            {(filterKat.length > 0 || filterAvail.length > 0 || searchQuery) && (
              <button className="kon-clear-all" onClick={resetFilters}>
                Hapus semua filter ✕
              </button>
            )}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="kon-empty">
              <div className="kon-empty-icon">🔍</div>
              <h3 className="kon-empty-h">Tidak ada konselor yang cocok</h3>
              <p className="kon-empty-p">Coba ubah atau hapus filter yang aktif.</p>
              <button
                className="kon-reset-btn"
                style={{ margin: "0 auto" }}
                onClick={resetFilters}
              >
                Reset Semua Filter
              </button>
            </div>
          )}

          {/* Cards */}
          <div className="kon-grid">
            {displayed.map((k, i) => {
              const avail = AVAILABILITY[k.ID] || [];
              return (
                <article
                  key={k.ID}
                  className="kon-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onMouseEnter={() => setActiveCard(k.ID)}
                  onMouseLeave={() => setActiveCard(null)}
                >
                  {/* Foto */}
                  <div className="kon-card-photo-wrap">
                    <img src={k.image} alt={k.Nama} className="kon-card-photo" />
                    <div className="kon-card-photo-overlay">
                      {/* ✅ Navigate ke halaman detail konselor */}
                      <button
                        className="kon-card-book-btn"
                        onClick={() => goTo(`/konselor/${k.ID}`)}
                      >
                        Buat Janji
                      </button>
                    </div>
                    {/* Rating badge */}
                    <div className="kon-card-rating-badge">
                      <span className="kon-card-rating-star">★</span>
                      <span>{k["Rating_(Final)"].toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="kon-card-info">
                    <div className="kon-card-top">
                      <h3 className="kon-card-name">{k.Nama}</h3>
                      <KatBadge kat={k.Kategori_Masalah} />
                    </div>
                    <p className="kon-card-kat">{k.Kategori_Masalah}</p>

                    <StarRating rating={k["Rating_(Final)"]} />

                    <div className="kon-card-meta">
                      <span className="kon-card-exp">⏱ {k.Pengalaman}</span>
                      <span className="kon-card-cases">
                        {k.Kasus_Selesai}/{k.Jumlah_Kasus} kasus
                      </span>
                    </div>

                    {/* Success rate bar */}
                    <div className="kon-card-bar-wrap">
                      <div className="kon-card-bar-track">
                        <div
                          className="kon-card-bar-fill"
                          style={{
                            width: `${Math.round(k["Success_Rate"] * 100)}%`,
                            background:
                              k["Success_Rate"] >= 0.6
                                ? "#2f7d79"
                                : k["Success_Rate"] >= 0.3
                                  ? "#79d8d1"
                                  : "#e8c4a0",
                          }}
                        />
                      </div>
                      <span className="kon-card-sr">
                        {Math.round(k["Success_Rate"] * 100)}% success
                      </span>
                    </div>

                    {/* Availability tags */}
                    {avail.length > 0 && (
                      <div className="kon-card-avail">
                        {avail.map((a) => (
                          <span key={a} className="kon-avail-tag">{a}</span>
                        ))}
                      </div>
                    )}

                    {/* ✅ Navigate ke halaman detail konselor */}
                    <button
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

          {/* Load more */}
          {!showAll && filtered.length > 6 && (
            <div className="kon-loadmore-wrap">
              <p className="kon-loadmore-info">
                Menampilkan {displayed.length} dari {filtered.length} konselor di ruang Anda.
              </p>
              <button className="kon-loadmore-btn" onClick={() => setShowAll(true)}>
                Tampilkan lebih banyak konselor
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="14"
                  height="14"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="footer" style={{ width: "92%", margin: "80px auto 50px" }}>
        <div className="footer-brand">
          <h3 className="footer-name">The Sanctuary Polimedia</h3>
          <p className="footer-desc">
            Platform konseling sebaya untuk mahasiswa Polimedia yang menyediakan
            ruang aman untuk saling mendengarkan dan mendukung di lingkungan kampus.
          </p>
          <small className="footer-copy">© 2026 TheSanctuary. Politeknik Negeri Media Kreatif.</small>
        </div>
        {[
          { heading: "Platform", links: ["Layanan", "Komunitas", "Artikel", "Panduan Konseling"] },
          { heading: "Legal", links: ["Kebijakan Privasi", "Syarat dan Ketentuan", "Bantuan"] },
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