import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { useMid } from "../hooks/useMid.js";
import { isSelesai, statusLabel } from "../lib/bookingStatus.js";
import "../styles/statistik.css";

function mapKonselor(k) {
  return {
    ID: k.id,
    Nama: k.nama,
    Kategori_Masalah: k.kategori_masalah,
    Jumlah_Kasus: k.jumlah_kasus,
    Kasus_Selesai: k.kasus_selesai,
    "Rating_(Final)": Number(k.rating_final) || 0,
    Success_Rate: Number(k.success_rate) || 0,
    image: k.image_url || k.foto_url || "",
  };
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.val), 1);
  const COLORS = [
    "#c8e8e0", "#a0d8d0", "#79d8d1", "#2f7d79",
    "#1a5e5a", "#0f3e3c", "#08282a", "#071e1c",
  ];
  return (
    <div className="sk-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="sk-bar-col">
          <div className="sk-bar-wrap">
            <div
              className="sk-bar"
              style={{
                height: `${(d.val / max) * 100}%`,
                background: COLORS[i % COLORS.length],
              }}
            />
          </div>
          <span className="sk-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ pct, size = 100, stroke = 11, color = "#79d8d1", sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="sk-donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
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

function DonutLight({ pct, size = 110, stroke = 11, color = "#2f7d79", sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="sk-donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(47,125,121,0.10)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s ease" }}
        />
      </svg>
      <div className="sk-donut-center">
        <span className="sk-donut-val" style={{ color, fontSize: 18 }}>{pct}%</span>
        {sub && <span className="sk-donut-sub" style={{ color: "#888" }}>{sub}</span>}
      </div>
    </div>
  );
}

function IconHamburger() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Statistik() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  }, []);

  const userEmail = user?.email?.toLowerCase() ?? null;
  const firstName = (user?.nama ?? user?.name ?? "Kamu").split(" ")[0];

  const { mid, loading: midLoading } = useMid(userEmail);
  const [myProgress, setMyProgress] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myTargets, setMyTargets]   = useState([]);
  const [myKonselor, setMyKonselor] = useState([]);
  const [finalReko, setFinalReko]   = useState([]);
  const [loading, setLoading]       = useState(() => Boolean(userEmail));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    if (!midLoading && !mid) setLoading(false);
  }, [userEmail, mid, midLoading]);

  useEffect(() => {
    if (!mid) return;

    let active = true;
    async function fetchAll() {
      const [progRes, bookRes, targetRes] = await Promise.all([
        supabase.from("progress_konseling").select("*").eq("id_mahasiswa", mid).order("sesi_konseling", { ascending: true }),
        supabase.from("booking").select("*").eq("id_mahasiswa", mid),
        supabase.from("data_target").select("*").eq("id_mahasiswa", mid),
      ]);

      if (!active) return;

      const progress = (progRes.data ?? []).map((p) => ({
        ID_Mahasiswa:       p.id_mahasiswa,
        Sesi_Konseling:     p.sesi_konseling,
        Suasana_Hati:       p.suasana_hati,
        Mindfulness:        Number(p.mindfulness)        || 0,
        Manajemen_Stres:    Number(p.manajemen_stres)    || 0,
        Ketahanan_Diri:     Number(p.ketahanan_diri)     || 0,
        Hubungan_Sosial:    Number(p.hubungan_sosial)    || 0,
        Keseimbangan_Hidup: Number(p.keseimbangan_hidup) || 0,
        Skor_Kesejahteraan: Number(p.skor_kesejahteraan) || 0,
        Skor_Keterbukaan:   Number(p.skor_keterbukaan)   || 0,
        Skor_Kemajuan:      Number(p.skor_kemajuan)      || 0,
        Skor_Konsistensi:   Number(p.skor_konsistensi)   || 0,
        Sesi_Tercapai:      p.sesi_tercapai,
        Kategori_Masalah:   p.kategori_masalah,
      }));

      const bookings = (bookRes.data ?? []).map((b) => ({
        ID_Booking:       b.id,
        ID_Mahasiswa:     b.id_mahasiswa,
        ID_Konselor:      b.id_konselor,
        Tanggal_Sesi:     b.tanggal_sesi,
        Kategori_Masalah: b.kategori_masalah,
        Sesi_Konseling:   b.sesi_konseling,
        Kondisi_Awal:     Number(b.kondisi_awal)     || 0,
        Kondisi_Saat_Ini: Number(b.kondisi_saat_ini) || 0,
        Status:           b.status,
      }));

      const targets = (targetRes.data ?? []).map((t) => ({
        ID_Mahasiswa:  t.id_mahasiswa,
        Nama_Target:   t.nama_target,
        Target_Sesi:   t.target_sesi,
        Sesi_Terlalui: t.sesi_terlalui,
        Status:        t.status,
      }));

      setMyProgress(progress);
      setMyBookings(bookings);
      setMyTargets(targets);

      const konselorIDs = [...new Set(bookings.map((b) => b.ID_Konselor))].filter(Boolean);
      if (konselorIDs.length > 0) {
        const { data: kData } = await supabase.from("data_konselor").select("*").in("id", konselorIDs);
        if (active) setMyKonselor((kData ?? []).map(mapKonselor));
      }

      const { data: rekoData } = await supabase
        .from("data_konselor")
        .select("*")
        .order("rating_final", { ascending: false })
        .limit(12);

      const reko = (rekoData ?? [])
        .filter((k) => !konselorIDs.includes(k.id))
        .slice(0, 3)
        .map(mapKonselor);

      if (active) {
        setFinalReko(reko);
        setLoading(false);
      }
    }

    fetchAll();

    const progressChannel = supabase
      .channel(`statistik-progress-${mid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "progress_konseling", filter: `id_mahasiswa=eq.${mid}` }, () => { if (active) fetchAll(); })
      .subscribe();

    const bookingChannel = supabase
      .channel(`statistik-booking-${mid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "booking", filter: `id_mahasiswa=eq.${mid}` }, () => { if (active) fetchAll(); })
      .subscribe();

    const targetChannel = supabase
      .channel(`statistik-target-${mid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "data_target", filter: `id_mahasiswa=eq.${mid}` }, () => { if (active) fetchAll(); })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(targetChannel);
    };
  }, [mid]);

  const latest = myProgress[myProgress.length - 1] ?? null;

  const totalSesi         = myBookings.length;
  const lastBooking       = myBookings[myBookings.length - 1] ?? null;
  const lastTanggal       = lastBooking
    ? new Date(lastBooking.Tanggal_Sesi).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";
  const skorKesejahteraan = latest?.Skor_Kesejahteraan?.toFixed(1) ?? "-";
  const targetSelesai     = myTargets.filter((t) => isSelesai(t.Status)).length;
  const targetTotal       = myTargets.length;
  const skorAwal          = myProgress[0]?.Skor_Kesejahteraan ?? 0;
  const skorAkhir         = latest?.Skor_Kesejahteraan ?? 0;
  const deltaKesej        = (skorAkhir - skorAwal).toFixed(1);

  const MOOD_VAL  = { "Sangat Baik": 4, Baik: 3, Netral: 2, Stres: 1 };
  const trendBars = myProgress.map((p) => ({ label: `S${p.Sesi_Konseling}`, val: MOOD_VAL[p.Suasana_Hati] ?? 2 }));

  const seenTargets = new Set();
  const targetRows  = myTargets
    .filter((t) => {
      const key = `${t.Nama_Target}_${t.Status}`;
      if (seenTargets.has(key)) return false;
      seenTargets.add(key);
      return true;
    })
    .slice(0, 4)
    .map((t) => ({ label: t.Nama_Target, done: t.Sesi_Terlalui, total: t.Target_Sesi, status: t.Status }));

  const dimensi = latest
    ? [
        { label: "Mindfulness",        pct: Math.round(latest.Mindfulness * 100) },
        { label: "Manajemen Stres",     pct: Math.round(latest.Manajemen_Stres * 100) },
        { label: "Ketahanan Diri",      pct: Math.round(latest.Ketahanan_Diri * 100) },
        { label: "Hubungan Sosial",     pct: Math.round(latest.Hubungan_Sosial * 100) },
        { label: "Keseimbangan Hidup",  pct: Math.round(latest.Keseimbangan_Hidup * 100) },
      ]
    : [];

  const skorKeterbukaan  = latest?.Skor_Keterbukaan  ?? 0;
  const skorKemajuan     = latest?.Skor_Kemajuan     ?? 0;
  const skorKonsistensi  = latest?.Skor_Konsistensi  ?? 0;
  const sesiTercapai     = latest?.Sesi_Tercapai     ?? "-";
  const kategoriTerakhir = latest?.Kategori_Masalah  ?? "Akademik";
  const suasanaTerakhir  = latest?.Suasana_Hati      ?? "Baik";

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="sk-shell st-loading">
        <div className="st-loading-container">
          <div className="st-loading-spinner" />
          <p className="st-loading-text">Memuat data kamu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sk-shell">

      {sidebarOpen && (
        <div className="sk-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sk-sidebar ${sidebarOpen ? "sk-sidebar--open" : ""}`}>
        <div className="sk-sidebar-top">
          <span className="sk-sidebar-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          <nav className="sk-sidebar-nav">
            <div className="sk-sidebar-item" onClick={() => { navigate("/dashboard"); setSidebarOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Beranda
            </div>
            <div className="sk-sidebar-item sk-sidebar-item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Statistik
            </div>
            <div className="sk-sidebar-item" onClick={() => { navigate("/riwayat"); setSidebarOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Riwayat Sesi
            </div>
            <div className="sk-sidebar-item" onClick={() => { navigate("/settings"); setSidebarOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              </svg>
              Pengaturan
            </div>
          </nav>
        </div>
        <button className="sk-sidebar-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Keluar
        </button>
      </aside>

      <main className="sk-main">

        <header className="sk-topbar">
          <div className="sk-topbar-l">
            <button
              className="sk-sidebar-toggle"
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? "Tutup menu" : "Buka menu"}
            >
              {sidebarOpen ? <IconClose /> : <IconHamburger />}
            </button>

            <span className="sk-logo" onClick={() => navigate("/")}>The Sanctuary</span>
            <nav className="sk-topbar-nav">
              <span onClick={() => navigate("/")}>Beranda</span>
              <span onClick={() => navigate("/konselor")}>Konselor</span>
              <span className="sk-active" onClick={() => navigate("/dashboard")}>Dashboard</span>
            </nav>
          </div>
          <div className="sk-topbar-r">
            <button className="sk-cta" onClick={() => navigate("/konselor")}>Cari Teman Cerita</button>
            <button className="sk-icon-btn" onClick={() => navigate("/notifikasi")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="sk-avatar">{(user?.nama ?? user?.name ?? "U").charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="sk-greeting">
          <p className="sk-greeting-sub">Perkembangan Kamu, {firstName}</p>
          <p className="sk-greeting-hint">Yuk lihat sejauh mana perjalanan konselingmu berjalan</p>
        </div>

        <div className="sk-banner">
          <div className="sk-banner-left">
            <span className="sk-banner-tag">PANTAU PERJALANANMU</span>
            <h2 className="sk-banner-h1">Setiap sesi adalah langkah nyata<br />menuju dirimu yang lebih tenang</h2>
            <p className="sk-banner-p">Setiap cerita yang kamu bagi bersama konselor sebaya adalah langkah berani menuju kebaikan diri. Perjalananmu tercatat dan kamu nggak sendirian.</p>
            <button className="sk-banner-btn" onClick={() => navigate("/riwayat")}>Lihat Rekap Mingguan</button>
          </div>
          <div className="sk-banner-right">
            <Donut pct={Math.round((latest?.Mindfulness ?? 0) * 100)} size={150} stroke={14} color="#79d8d1" sub="MINDFULNESS" />
          </div>
        </div>

        <div className="sk-content">

          <div className="sk-stats-row">
            {[
              { icon: "", val: totalSesi,                           lbl: "Total Sesi Cerita",  delta: `+${totalSesi}` },
              { icon: "", val: lastTanggal,                         lbl: "Sesi Terakhir",      delta: "Terbaru" },
              { icon: "", val: skorKesejahteraan,                   lbl: "Skor Kesejahteraan", delta: `+${deltaKesej}` },
              { icon: "", val: `${targetSelesai}/${targetTotal}`,   lbl: "Target Tercapai",    delta: targetTotal > 0 ? `${Math.round((targetSelesai / targetTotal) * 100)}%` : "0%" },
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

          {!mid ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b8f8c" }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Data statistik belum tersedia</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Hubungi admin untuk menghubungkan akunmu dengan data konseling</p>
            </div>
          ) : (
            <>
              <div className="sk-grid">
                <div className="sk-card sk-card--wide">
                  <h3 className="sk-card-h3">Gimana Mood Kamu Tiap Sesi?</h3>
                  <p className="sk-card-sub">Perubahan suasana hati dari sesi ke sesi konselingmu</p>
                  <BarChart data={trendBars} />
                  <div className="sk-chart-legend">
                    {[
                      { label: "Sangat Baik", color: "#2f7d79" },
                      { label: "Baik",        color: "#79d8d1" },
                      { label: "Netral",      color: "#c8e8e0" },
                      { label: "Lagi Berat",  color: "#e8c4a0" },
                    ].map((l) => (
                      <div key={l.label} className="sk-legend-item">
                        <span className="sk-legend-dot" style={{ background: l.color }} />
                        <span>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sk-card">
                  <h3 className="sk-card-h3">Aspek Kesehatan Mentalmu</h3>
                  <p className="sk-card-sub">Hasil evaluasi dari sesi terakhir bersama konselor</p>
                  <div className="sk-dim-list">
                    {dimensi.map((d) => (
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

                <div className="sk-card">
                  <h3 className="sk-card-h3">Target Perjalanan Konseling</h3>
                  <p className="sk-card-sub">Hal-hal yang ingin kita capai bareng konselor</p>
                  <div className="sk-target-list">
                    {targetRows.length === 0 && (
                      <p style={{ color: "#aaa", fontSize: 13 }}>Belum ada target yang ditetapkan.</p>
                    )}
                    {targetRows.map((t, i) => (
                      <div key={i} className="sk-target-row">
                        <div className={`sk-target-icon ${isSelesai(t.status) ? "ti-done" : "ti-run"}`}>
                          {isSelesai(t.status) ? "✓" : "○"}
                        </div>
                        <div className="sk-target-info">
                          <span className="sk-target-name">{t.label}</span>
                        </div>
                        <span className="sk-target-count">{t.done}× dilakukan</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sk-card">
                  <h3 className="sk-card-h3">Skor Sesi Terakhir</h3>
                  <p className="sk-card-sub">Seberapa jauh kamu sudah berkembang</p>
                  <div className="sk-skor-row">
                    <div className="sk-skor-item">
                      <DonutLight pct={Math.round(skorKeterbukaan)} color="#2f7d79" sub="KETERBUKAAN" />
                      <span className="sk-skor-lbl">Mau Cerita</span>
                    </div>
                    <div className="sk-skor-item">
                      <DonutLight pct={Math.round(skorKemajuan)} color="#79d8d1" sub="KEMAJUAN" />
                      <span className="sk-skor-lbl">Berkembang</span>
                    </div>
                    <div className="sk-skor-item">
                      <DonutLight pct={Math.round(skorKonsistensi)} color="#1a5e5a" sub="KONSISTENSI" />
                      <span className="sk-skor-lbl">Konsisten</span>
                    </div>
                  </div>
                  {latest && (
                    <div className="sk-catatan-mentor">
                      <span className="sk-catatan-tag">CATATAN DARI KONSELOR</span>
                      <p className="sk-catatan-text">
                        "Sesi {sesiTercapai} membahas {kategoriTerakhir} — kamu terlihat {suasanaTerakhir.toLowerCase()} dan terus menunjukkan perkembangan yang berarti. Tetap semangat ya!"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sk-section-hd">
                <div>
                  <h2 className="sk-section-h2">Riwayat Sesi Cerita Kamu</h2>
                  <p className="sk-section-sub">Semua pertemuan bersamamu sudah kami catat dengan baik</p>
                </div>
                <button className="sk-link-btn" onClick={() => navigate("/riwayat")}>Lihat semua →</button>
              </div>

              <div className="sk-riwayat-list">
                {myKonselor.map((k) => {
                  const booksForKonselor = myBookings.filter((b) => b.ID_Konselor === k.ID);
                  const bk = booksForKonselor.sort((a, b) =>
                    new Date(b.Tanggal_Sesi) - new Date(a.Tanggal_Sesi)
                  )[0] ?? null;
                  const kondisiAwal  = bk ? Math.round(bk.Kondisi_Awal * 100) : 0;
                  const kondisiAkhir = bk ? Math.round(bk.Kondisi_Saat_Ini * 100) : 0;
                  const progList = myProgress.filter((p) => p.Kategori_Masalah === bk?.Kategori_Masalah);
                  const lastProg = progList[progList.length - 1] ?? myProgress[myProgress.length - 1];
                  return (
                    <div key={k.ID} className="sk-riwayat-item">
                      <div className="sk-riwayat-left">
                        <img src={k.image} alt={k.Nama} className="sk-riwayat-img" />
                        <div>
                          <p className="sk-riwayat-name">
                            {k.Nama}
                            <span className="sk-riwayat-spec"> — {bk?.Kategori_Masalah ?? k.Kategori_Masalah}</span>
                          </p>
                          <p className="sk-riwayat-date">
                            {bk ? new Date(bk.Tanggal_Sesi).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"}
                            {bk ? ` · ${bk.Sesi_Konseling} sesi bareng` : ""}
                          </p>
                          {lastProg && (
                            <p className="sk-riwayat-note">
                              Kondisi berkembang dari {kondisiAwal}% ke {kondisiAkhir}%. Fokus pada topik {bk?.Kategori_Masalah ?? "-"} — kamu sudah sangat berani mau bercerita
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`sk-riwayat-badge ${isSelesai(bk?.Status) ? "rb-done" : "rb-run"}`}>
                        {isSelesai(bk?.Status) ? "Sesi Selesai ✓" : statusLabel(bk?.Status)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="sk-section-hd">
                <div>
                  <h2 className="sk-section-h2">Teman Konselor yang Mungkin Cocok</h2>
                  <p className="sk-section-sub">Pilihan konselor sebaya berdasarkan rating dan kecocokan topik</p>
                </div>
                <button className="sk-link-btn" onClick={() => navigate("/konselor")}>Temukan Lainnya →</button>
              </div>

              <div className="sk-mentor-grid">
                {finalReko.map((k, ci) => {
                  const initials    = k.Nama.split(" ").slice(0, 2).map((n) => n[0]).join("");
                  const colors      = ["#2f7d79", "#79d8d1", "#1a5e5a"];
                  const successRate = Math.round(k.Success_Rate * 100);
                  return (
                    <div key={k.ID} className="sk-mentor-card">
                      <div className="sk-mentor-avatar" style={{ background: colors[ci % colors.length] }}>{initials}</div>
                      <p className="sk-mentor-name">{k.Nama}</p>
                      <p className="sk-mentor-cat">{k.Kategori_Masalah}</p>
                      <div className="sk-mentor-stats">
                        <div className="sk-mstat"><span className="sk-mstat-val">{k.Jumlah_Kasus}</span><span className="sk-mstat-lbl">Kasus</span></div>
                        <div className="sk-mstat"><span className="sk-mstat-val">{k["Rating_(Final)"].toFixed(1)} ★</span><span className="sk-mstat-lbl">Rating</span></div>
                        <div className="sk-mstat"><span className="sk-mstat-val">{k.Kasus_Selesai}</span><span className="sk-mstat-lbl">Selesai</span></div>
                      </div>
                      <div className="sk-mentor-rate-bar">
                        <div className="sk-mentor-rate-fill" style={{ width: `${successRate}%`, background: colors[ci % colors.length] }} />
                      </div>
                      <p className="sk-mentor-sr">Berhasil bantu {successRate}% mahasiswa</p>
                      <button
                        className={`sk-mentor-btn ${ci === 0 ? "sk-mentor-btn--rec" : ""}`}
                        onClick={() => navigate("/konselor")}
                      >
                        {ci === 0 ? "Paling Direkomendasikan" : "→ Mulai Cerita"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        <footer className="sk-footer">
          <div>
            <span className="sk-footer-brand">The Sanctuary</span>
            <p className="sk-footer-copy">© 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan</p>
          </div>
          <div className="sk-footer-links">
            <span>Kebijakan Privasi</span>
            <span>Syarat dan Ketentuan</span>
            <span>Bantuan</span>
          </div>
        </footer>

      </main>
    </div>
  );
}