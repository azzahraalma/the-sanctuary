import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import progress_responden from "../data/progress_responden";
import data_booking from "../data/data_booking";
import data_konselor from "../data/data_konselor";
import data_target from "../data/data_target";
import "../styles/statistik.css";

const EMAIL_TO_MID = {
  "pras@sanctuary.com": "M-001",
  "demo@sanctuary.com": "M-002",
};

// ── Mini bar chart (CSS only) ─────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.val), 1);
  const COLORS = ["#c8e8e0","#a0d8d0","#79d8d1","#2f7d79","#1a5e5a","#0f3e3c","#08282a","#071e1c"];
  return (
    <div className="sk-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="sk-bar-col">
          <div className="sk-bar-wrap">
            <div
              className="sk-bar"
              style={{ height: `${(d.val / max) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="sk-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut ─────────────────────────────────────────────────────────
function Donut({ pct, size = 100, stroke = 11, color = "#79d8d1", sub }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="sk-donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s ease" }}
        />
      </svg>
      <div className="sk-donut-center">
        <span className="sk-donut-val">{pct}%</span>
        {sub && <span className="sk-donut-sub">{sub}</span>}
      </div>
    </div>
  );
}

// ── Donut untuk Skor Sesi (teks gelap, di luar banner) ────────────
function DonutLight({ pct, size = 76, stroke = 9, color = "#2f7d79", sub }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="sk-donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(47,125,121,0.10)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s ease" }}
        />
      </svg>
      <div className="sk-donut-center">
        <span className="sk-donut-val" style={{ color, fontSize: 14 }}>{pct}%</span>
        {sub && <span className="sk-donut-sub" style={{ color: "#888" }}>{sub}</span>}
      </div>
    </div>
  );
}

export default function Statistik() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  }, []);

  const mid = EMAIL_TO_MID[user?.email?.toLowerCase()] ?? null;

  // ── Filter semua data berdasarkan MID ────────────────────────
  const myProgress = useMemo(() =>
    progress_responden.filter(p => p.ID_Mahasiswa === mid && p.Sesi_Konseling),
  [mid]);

  const myBookings = useMemo(() =>
    data_booking.filter(b => b.ID_Mahasiswa === mid && b.ID_Booking),
  [mid]);

  const myTargets = useMemo(() =>
    data_target.filter(t => t.ID_Mahasiswa === mid && t.Nama_Target),
  [mid]);

  // Sesi progress terakhir (sesi paling akhir)
  const latest = myProgress[myProgress.length - 1] ?? null;

  // ── Stat cards ────────────────────────────────────────────────
  // Total sesi dari data_booking
  const totalSesi = myBookings.length;

  // Tanggal sesi terakhir dari booking terakhir
  const lastBooking = myBookings[myBookings.length - 1] ?? null;
  const lastTanggal = lastBooking
    ? new Date(lastBooking.Tanggal_Sesi)
        .toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  // Skor kesejahteraan dari progress sesi terakhir
  const skorKesejahteraan = latest?.Skor_Kesejahteraan?.toFixed(1) ?? "-";

  // Target: hitung selesai vs total dari data_target
  const targetSelesai = myTargets.filter(t => t.Status === "Selesai").length;
  const targetTotal   = myTargets.length;

  // Delta skor kesejahteraan: bandingkan sesi pertama vs terakhir
  const skorAwal   = myProgress[0]?.Skor_Kesejahteraan ?? 0;
  const skorAkhir  = latest?.Skor_Kesejahteraan ?? 0;
  const deltaKesej = (skorAkhir - skorAwal).toFixed(1);

  // Delta total sesi (tampilkan jumlah sesi)
  const deltaSesi = `+${totalSesi}`;

  // ── Tren suasana hati (bar chart dari progress_responden) ─────
  const MOOD_VAL = { "Sangat Baik": 4, "Baik": 3, "Netral": 2, "Stres": 1 };
  const trendBars = myProgress.map(p => ({
    label: `S${p.Sesi_Konseling}`,
    val:   MOOD_VAL[p.Suasana_Hati] ?? 2,
  }));

  // ── Target perkembangan dari data_target ──────────────────────
  // Deduplikasi berdasarkan nama target + status untuk tampil unik
  const seenTargets = new Set();
  const targetRows = myTargets
    .filter(t => {
      const key = `${t.Nama_Target}_${t.Status}`;
      if (seenTargets.has(key)) return false;
      seenTargets.add(key);
      return true;
    })
    .slice(0, 4)
    .map(t => ({
      label:  t.Nama_Target,
      done:   t.Sesi_Terlalui,
      total:  t.Target_Sesi,
      status: t.Status,
    }));

  // ── Dimensi kesehatan mental dari progress sesi terakhir ──────
  const dimensi = latest ? [
    { label: "Mindfulness",        pct: Math.round(latest.Mindfulness * 100) },
    { label: "Manajemen Stres",    pct: Math.round(latest.Manajemen_Stres * 100) },
    { label: "Ketahanan Diri",     pct: Math.round(latest.Ketahanan_Diri * 100) },
    { label: "Hubungan Sosial",    pct: Math.round(latest.Hubungan_Sosial * 100) },
    { label: "Keseimbangan Hidup", pct: Math.round(latest.Keseimbangan_Hidup * 100) },
  ] : [];

  // ── Skor sesi dari progress terakhir ─────────────────────────
  const skorKeterbukaan = latest?.Skor_Keterbukaan ?? 0;
  const skorKemajuan    = latest?.Skor_Kemajuan    ?? 0;
  const skorKonsistensi = latest?.Skor_Konsistensi ?? 0;

  // Sesi tercapai dari progress terakhir (misal "4/4")
  const sesiTercapai = latest?.Sesi_Tercapai ?? "-";

  // ── Riwayat sesi: konselor yang menangani user ────────────────
  const myKonselorIDs = [...new Set(myBookings.map(b => b.ID_Konselor))];
  const myKonselor    = data_konselor.filter(k => myKonselorIDs.includes(k.ID));

  // ── Rekomendasi konselor: semua konselor di luar yang sudah pernah ──
  // Jika sudah pernah semua, tampilkan top 3 berdasarkan rating
  const rekomendasiKonselor = data_konselor
    .filter(k => !myKonselorIDs.includes(k.ID))
    .sort((a, b) => b["Rating_(Final)"] - a["Rating_(Final)"])
    .slice(0, 3);
  // Fallback: jika semua konselor sudah dipakai, tampilkan top 3 by rating
  const finalReko = rekomendasiKonselor.length > 0
    ? rekomendasiKonselor
    : data_konselor.sort((a, b) => b["Rating_(Final)"] - a["Rating_(Final)"]).slice(0, 3);

  // Catatan mentor: ambil dari kategori masalah progress terakhir
  const kategoriTerakhir = latest?.Kategori_Masalah ?? "Akademik";
  const suasanaTerakhir  = latest?.Suasana_Hati ?? "Baik";

  const firstName    = user?.name?.split(" ")[0] ?? "User";
  const handleLogout = () => { localStorage.removeItem("sanctuary_user"); navigate("/login"); };

  return (
    <div className="sk-shell">

      {/* ── SIDEBAR ── */}
      <aside className="sk-sidebar">
        <div className="sk-sidebar-top">
          <span className="sk-sidebar-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          <nav className="sk-sidebar-nav">
            <div className="sk-sidebar-item" onClick={() => navigate("/dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Home
            </div>
            <div className="sk-sidebar-item sk-sidebar-item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Statistik
            </div>
            <div className="sk-sidebar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              Pengaturan
            </div>
          </nav>
        </div>
        <button className="sk-sidebar-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="sk-main">

        {/* ── TOPBAR ── */}
        <header className="sk-topbar">
          <div className="sk-topbar-l">
            <span className="sk-logo" onClick={() => navigate("/")}>The Sanctuary</span>
            <nav className="sk-topbar-nav">
              <span onClick={() => navigate("/")}>Beranda</span>
              <span onClick={() => navigate("/konselor")}>Konselor</span>
              <span className="sk-active" onClick={() => navigate("/dashboard")}>Dashboard</span>
            </nav>
          </div>
          <div className="sk-topbar-r">
            <button className="sk-cta" onClick={() => navigate("/konselor")}>Temukan Konselor</button>
            <button className="sk-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="sk-avatar">{user?.name?.charAt(0).toUpperCase() ?? "U"}</div>
          </div>
        </header>

        {/* ── GREETING ── */}
        <div className="sk-greeting">
          <p className="sk-greeting-sub">Statistik Kamu, {firstName} 📊</p>
          <p className="sk-greeting-hint">Pantau progres dan evaluasi perjalanan konselingmu</p>
        </div>

        {/* ── BANNER — mindfulness dari progress sesi terakhir ── */}
        <div className="sk-banner">
          <div className="sk-banner-left">
            <span className="sk-banner-tag">MONITOR PROGRES</span>
            <h2 className="sk-banner-h1">
              Setiap sesi adalah langkah nyata<br />menuju kesehatan mental yang lebih baik
            </h2>
            <p className="sk-banner-p">
              Monitor progres dan evaluasi pengalaman Anda bersama mentor berpengalaman.
              Perjalanan pemulihan Anda tercatat di sini.
            </p>
            <button className="sk-banner-btn" onClick={() => navigate("/konselor")}>
              Laporan Mingguan Sesi
            </button>
          </div>
          <div className="sk-banner-right">
            {/* Mindfulness dari progress sesi terakhir M-001 */}
            <Donut
              pct={Math.round((latest?.Mindfulness ?? 0) * 100)}
              size={150} stroke={14} color="#79d8d1" sub="MINDFULNESS"
            />
          </div>
        </div>

        <div className="sk-content">

          {/* ── STAT CARDS — semua dari dataset ── */}
          <div className="sk-stats-row">
            {[
              {
                icon: "📋",
                // Total sesi dari data_booking M-001
                val:   totalSesi,
                lbl:   "Sesi Konseling",
                // Delta: jumlah sesi yang sudah diselesaikan
                delta: deltaSesi,
              },
              {
                icon: "📅",
                // Tanggal sesi terakhir dari booking terakhir
                val:   lastTanggal,
                lbl:   "Tanggal Terakhir",
                delta: "Terbaru",
              },
              {
                icon: "💚",
                // Skor kesejahteraan dari progress sesi terakhir
                val:   skorKesejahteraan,
                lbl:   "Skor Kesejahteraan",
                // Delta dari sesi pertama ke terakhir
                delta: `+${deltaKesej}`,
              },
              {
                icon: "🎯",
                // Target selesai vs total dari data_target M-001
                val:   `${targetSelesai}/${targetTotal}`,
                lbl:   "Target Tercapai",
                // Persentase pencapaian target
                delta: targetTotal > 0 ? `${Math.round((targetSelesai/targetTotal)*100)}%` : "0%",
              },
            ].map((s, i) => (
              <div key={i} className="sk-stat-card">
                <div className="sk-stat-top">
                  <span className="sk-stat-icon">{s.icon}</span>
                  <span className="sk-stat-delta">{s.delta}</span>
                </div>
                <div className="sk-stat-val">{s.val}</div>
                <div className="sk-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* ── GRID ── */}
          <div className="sk-grid">

            {/* Tren Suasana Hati — dari progress_responden M-001 */}
            <div className="sk-card sk-card--wide">
              <h3 className="sk-card-h3">Tren Suasana Hati</h3>
              <p className="sk-card-sub">Perkembangan kondisi selama konseling</p>
              {/* Bar per sesi berdasarkan Suasana_Hati di progress_responden */}
              <BarChart data={trendBars} />
              <div className="sk-chart-legend">
                {[
                  { label: "Sangat Baik", color: "#2f7d79" },
                  { label: "Baik",        color: "#79d8d1" },
                  { label: "Netral",      color: "#c8e8e0" },
                  { label: "Stres",       color: "#e8c4a0" },
                ].map(l => (
                  <div key={l.label} className="sk-legend-item">
                    <span className="sk-legend-dot" style={{ background: l.color }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimensi Kesehatan Mental — dari progress sesi terakhir */}
            <div className="sk-card">
              <h3 className="sk-card-h3">Dimensi Kesehatan Mental</h3>
              <p className="sk-card-sub">Perkembangan berdasarkan evaluasi mentor</p>
              <div className="sk-dim-list">
                {dimensi.map(d => (
                  <div key={d.label} className="sk-dim-row">
                    <span className="sk-dim-label">{d.label}</span>
                    <div className="sk-dim-track">
                      <div className="sk-dim-fill" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="sk-dim-val">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Perkembangan — dari data_target M-001 */}
            <div className="sk-card">
              <h3 className="sk-card-h3">Target Perkembangan Konseling</h3>
              <p className="sk-card-sub">Target yang ditetapkan bersama konselor</p>
              <div className="sk-target-list">
                {targetRows.length === 0 && (
                  <p style={{ color: "#aaa", fontSize: 13 }}>Belum ada target yang ditetapkan.</p>
                )}
                {targetRows.map((t, i) => (
                  <div key={i} className="sk-target-row">
                    <div className={`sk-target-icon ${t.status === "Selesai" ? "ti-done" : "ti-run"}`}>
                      {t.status === "Selesai" ? "✓" : "○"}
                    </div>
                    <div className="sk-target-info">
                      {/* Nama target dari data_target */}
                      <span className="sk-target-name">{t.label}</span>
                    </div>
                    {/* Sesi terlalui dari data_target */}
                    <span className="sk-target-count">{t.done} kali</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skor Sesi — dari progress sesi terakhir M-001 */}
            <div className="sk-card">
              <h3 className="sk-card-h3">Skor Sesi</h3>
              <p className="sk-card-sub">Rata-rata tiap kategori</p>
              <div className="sk-skor-row">
                <div className="sk-skor-item">
                  {/* Skor_Keterbukaan dari progress terakhir */}
                  <DonutLight pct={Math.round(skorKeterbukaan)} color="#2f7d79" sub="KETERBUKAAN" />
                  <span className="sk-skor-lbl">Keterbukaan</span>
                </div>
                <div className="sk-skor-item">
                  {/* Skor_Kemajuan dari progress terakhir */}
                  <DonutLight pct={Math.round(skorKemajuan)} color="#79d8d1" sub="KEMAJUAN" />
                  <span className="sk-skor-lbl">Kemajuan</span>
                </div>
                <div className="sk-skor-item">
                  {/* Skor_Konsistensi dari progress terakhir */}
                  <DonutLight pct={Math.round(skorKonsistensi)} color="#1a5e5a" sub="KONSISTENSI" />
                  <span className="sk-skor-lbl">Konsistensi</span>
                </div>
              </div>
              {latest && (
                <div className="sk-catatan-mentor">
                  <span className="sk-catatan-tag">CATATAN MENTOR</span>
                  {/* Catatan dinamis berdasarkan kategori masalah & suasana hati terakhir */}
                  <p className="sk-catatan-text">
                    "Sesi {sesiTercapai} dengan topik {kategoriTerakhir} menunjukkan progres yang {suasanaTerakhir.toLowerCase()}. Konsistensi latihan mindfulness perlu dijaga setiap harinya."
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ── RIWAYAT SESI — dari konselor yang menangani M-001 ── */}
          <div className="sk-section-hd">
            <div>
              <h2 className="sk-section-h2">Riwayat Sesi Konseling</h2>
              <p className="sk-section-sub">Rekap sesi yang telah dilalui</p>
            </div>
            <button className="sk-link-btn" onClick={() => navigate("/konselor")}>Lihat semua →</button>
          </div>

          <div className="sk-riwayat-list">
            {myKonselor.map(k => {
              const bk       = myBookings.find(b => b.ID_Konselor === k.ID);
              // Progress sesi terkait konselor ini (ambil dari Kategori_Masalah booking)
              const progList = myProgress.filter(p => p.Kategori_Masalah === bk?.Kategori_Masalah);
              const lastProg = progList[progList.length - 1] ?? myProgress[myProgress.length - 1];

              // Detail sesi: kondisi awal → kondisi saat ini
              const kondisiAwal   = bk ? Math.round(bk.Kondisi_Awal * 100) : 0;
              const kondisiAkhir  = bk ? Math.round(bk.Kondisi_Saat_Ini * 100) : 0;

              return (
                <div key={k.ID} className="sk-riwayat-item">
                  <div className="sk-riwayat-left">
                    <img src={k.image} alt={k.Nama} className="sk-riwayat-img" />
                    <div>
                      <p className="sk-riwayat-name">
                        {k.Nama}
                        <span className="sk-riwayat-spec"> — {bk?.Kategori_Masalah ?? k.Kategori_Masalah}</span>
                      </p>
                      {/* Tanggal & jumlah sesi dari data_booking */}
                      <p className="sk-riwayat-date">
                        {bk ? new Date(bk.Tanggal_Sesi).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"}
                        {bk ? ` · ${bk.Sesi_Konseling} sesi` : ""}
                      </p>
                      {lastProg && (
                        <p className="sk-riwayat-note">
                          Kondisi berkembang dari {kondisiAwal}% menjadi {kondisiAkhir}%. Fokus pada kategori {bk?.Kategori_Masalah ?? "-"} dengan pendekatan grounding dan manajemen stres.
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`sk-riwayat-badge ${bk?.Status === "Selesai" ? "rb-done" : "rb-run"}`}>
                    {/* Status langsung dari data_booking */}
                    Progres {bk?.Status ?? "Berjalan"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── MENTOR PILIHAN — konselor yang belum pernah ditangani user ── */}
          <div className="sk-section-hd">
            <div>
              <h2 className="sk-section-h2">Mentor Pilihan Untuk Anda</h2>
              <p className="sk-section-sub">Berdasarkan kebutuhan dan preferensi Anda</p>
            </div>
            <button className="sk-link-btn" onClick={() => navigate("/konselor")}>Temukan Lebih Banyak →</button>
          </div>

          <div className="sk-mentor-grid">
            {finalReko.map((k, ci) => {
              const initials = k.Nama.split(" ").slice(0, 2).map(n => n[0]).join("");
              const colors   = ["#2f7d79","#79d8d1","#1a5e5a"];
              // Success rate dan jumlah kasus dari data_konselor langsung
              const successRate = Math.round(k["Success_Rate"] * 100);
              return (
                <div key={k.ID} className="sk-mentor-card">
                  <div className="sk-mentor-avatar" style={{ background: colors[ci % colors.length] }}>
                    {initials}
                  </div>
                  <p className="sk-mentor-name">{k.Nama}</p>
                  {/* Kategori dari data_konselor */}
                  <p className="sk-mentor-cat">{k.Kategori_Masalah}</p>
                  <div className="sk-mentor-stats">
                    <div className="sk-mstat">
                      {/* Jumlah kasus dari data_konselor */}
                      <span className="sk-mstat-val">{k.Jumlah_Kasus}</span>
                      <span className="sk-mstat-lbl">Kasus</span>
                    </div>
                    <div className="sk-mstat">
                      {/* Rating dari data_konselor */}
                      <span className="sk-mstat-val">{k["Rating_(Final)"].toFixed(1)} ★</span>
                      <span className="sk-mstat-lbl">Rating</span>
                    </div>
                    <div className="sk-mstat">
                      {/* Kasus selesai dari data_konselor */}
                      <span className="sk-mstat-val">{k.Kasus_Selesai}</span>
                      <span className="sk-mstat-lbl">Selesai</span>
                    </div>
                  </div>
                  <div className="sk-mentor-rate-bar">
                    {/* Success rate dari data_konselor */}
                    <div className="sk-mentor-rate-fill"
                      style={{ width: `${successRate}%`, background: colors[ci % colors.length] }}
                    />
                  </div>
                  <p className="sk-mentor-sr">Capaian progres {successRate}%</p>
                  <button
                    className={`sk-mentor-btn ${ci === 0 ? "sk-mentor-btn--rec" : ""}`}
                    onClick={() => navigate("/konselor")}
                  >
                    {/* Tandai rekomendasi utama (rating tertinggi) */}
                    {ci === 0 ? "⭐ Rekomendasi" : "→ Mulai Sesi"}
                  </button>
                </div>
              );
            })}
          </div>

        </div>

        {/* ── FOOTER ── */}
        <footer className="sk-footer">
          <div>
            <span className="sk-footer-brand">The Sanctuary</span>
            <p className="sk-footer-copy">© 2024 The Editorial Sanctuary. Menciptakan kedamaian melalui data dan empati</p>
          </div>
          <div className="sk-footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact Support</span>
            <span>Our Methodology</span>
          </div>
        </footer>

      </main>
    </div>
  );
}