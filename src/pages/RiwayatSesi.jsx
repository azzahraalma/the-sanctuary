import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { useMid } from "../hooks/useMid.js";
import { isSelesai, statusLabel } from "../lib/bookingStatus.js";
import "../styles/riwayat.css";

function mapKonselor(k) {
  return {
    ID: k.id,
    Nama: k.nama,
    Kategori_Masalah: k.kategori_masalah,
    image: k.image_url || k.foto_url || "",
  };
}

function MiniDonut({ pct, color, label }) {
  const size = 72, stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="rw-donut-item">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="rgba(47,125,121,0.10)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray .8s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
        </div>
      </div>
      <span className="rw-donut-lbl">{label}</span>
    </div>
  );
}

function MoodBadge({ mood }) {
  const map = {
    "Sangat Baik": { cls: "mood-sangat-baik", icon: "" },
    "Baik": { cls: "mood-baik", icon: "" },
    "Netral": { cls: "mood-netral", icon: "" },
    "Stres": { cls: "mood-stres", icon: "" },
  };
  const m = map[mood] ?? map["Netral"];
  return (
    <span className={`rw-mood ${m.cls}`}>{m.icon} {mood}</span>
  );
}

function KonselorAvatar({ konselor }) {
  const [imgErr, setImgErr] = useState(false);
  if (!konselor) return null;
  return (
    <div className="rw-k-row">
      {!imgErr && konselor.image ? (
        <img
          src={konselor.image} alt={konselor.Nama}
          className="rw-k-img"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="rw-k-fallback">{konselor.Nama.charAt(0)}</div>
      )}
      <div>
        <div className="rw-k-name">{konselor.Nama}</div>
        <div className="rw-k-cat">{konselor.Kategori_Masalah}</div>
      </div>
    </div>
  );
}

export default function RiwayatSesi() {
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
  const [myKonselor, setMyKonselor] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(userEmail));
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    if (!midLoading && !mid) setLoading(false);
  }, [userEmail, mid, midLoading]);

  useEffect(() => {
    if (!mid) return;

    let active = true;

    async function fetchAll() {
      const [progRes, bookRes] = await Promise.all([
        supabase
          .from("progress_konseling")
          .select("*")
          .eq("id_mahasiswa", mid)
          .order("sesi_konseling", { ascending: false }),
        supabase
          .from("booking")
          .select("*")
          .eq("id_mahasiswa", mid),
      ]);

      if (!active) return;

      const progress = (progRes.data ?? []).map(p => ({
        Sesi_Konseling: p.sesi_konseling,
        Tanggal: p.tanggal,
        Suasana_Hati: p.suasana_hati,
        Kategori_Masalah: p.kategori_masalah,
        ID_Konselor: p.id_konselor,
        Mindfulness: Number(p.mindfulness) || 0,
        Manajemen_Stres: Number(p.manajemen_stres) || 0,
        Ketahanan_Diri: Number(p.ketahanan_diri) || 0,
        Hubungan_Sosial: Number(p.hubungan_sosial) || 0,
        Keseimbangan_Hidup: Number(p.keseimbangan_hidup) || 0,
        Skor_Kesejahteraan: Number(p.skor_kesejahteraan) || 0,
        Skor_Keterbukaan: Number(p.skor_keterbukaan) || 0,
        Skor_Kemajuan: Number(p.skor_kemajuan) || 0,
        Skor_Konsistensi: Number(p.skor_konsistensi) || 0,
      }));

      const bookings = (bookRes.data ?? []).map(b => ({
        ID_Konselor: b.id_konselor,
        Tanggal_Sesi: b.tanggal_sesi,
        Kondisi_Awal: Number(b.kondisi_awal) || 0,
        Kondisi_Saat_Ini: Number(b.kondisi_saat_ini) || 0,
        Status: b.status,
        Kategori_Masalah: b.kategori_masalah,
      }));

      setMyProgress(progress);
      setMyBookings(bookings);

      const ids = [...new Set([
        ...progress.map(p => p.ID_Konselor),
        ...bookings.map(b => b.ID_Konselor),
      ])].filter(Boolean);

      if (ids.length > 0) {
        const { data: kData } = await supabase
          .from("data_konselor")
          .select("*")
          .in("id", ids);
        if (active) {
          setMyKonselor((kData ?? []).map(mapKonselor));
        }
      }

      if (active) setLoading(false);
    }

    fetchAll();

    const progressChannel = supabase
      .channel(`riwayat-progress-${mid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progress_konseling", filter: `id_mahasiswa=eq.${mid}` },
        () => { if (active) fetchAll(); }
      )
      .subscribe();

    const bookingChannel = supabase
      .channel(`riwayat-booking-${mid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking", filter: `id_mahasiswa=eq.${mid}` },
        () => { if (active) fetchAll(); }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(bookingChannel);
    };
  }, [mid]);

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="sk-shell rw-loading">
        <div className="rw-loading-container">
          <div className="rw-loading-spinner" />
          <p className="rw-loading-text">Memuat riwayat sesi...</p>
        </div>
      </div>
    );
  }

  const totalSesi = myProgress.length;
  const lastP = myProgress[0] ?? null;
  const firstP = myProgress[totalSesi - 1] ?? null;
  const lastTanggal = lastP?.Tanggal
    ? new Date(lastP.Tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "-";
  const skorAkhir = lastP ? (lastP.Skor_Kesejahteraan * 10).toFixed(1) : "-";
  const deltaSkor = firstP && lastP && totalSesi > 1
    ? `+${((lastP.Skor_Kesejahteraan - firstP.Skor_Kesejahteraan) * 10).toFixed(1)}`
    : "—";
  const selesai = myBookings.filter(b => isSelesai(b.Status)).length;

  return (
    <div className="sk-shell">

      <aside className="sk-sidebar">
        <div className="sk-sidebar-top">
          <span className="sk-sidebar-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          <nav className="sk-sidebar-nav">
            <div className="sk-sidebar-item" onClick={() => navigate("/dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Beranda
            </div>
            <div className="sk-sidebar-item" onClick={() => navigate("/statistik")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Statistik
            </div>
            <div className="sk-sidebar-item sk-sidebar-item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Riwayat Sesi
            </div>
            <div className="sk-sidebar-item" onClick={() => navigate("/settings")}>
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
            <div className="sk-avatar">
              {(user?.nama ?? user?.name ?? "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="sk-greeting">
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: "#2f7d79", fontSize: 13, fontWeight: 700,
              marginBottom: 10, padding: 0, fontFamily: "inherit",
            }}
          >
            ← Kembali
          </button>
          <p className="sk-greeting-sub">Riwayat Sesi Cerita, {firstName}</p>
          <p className="sk-greeting-hint">Detail lengkap setiap sesi konseling yang pernah kamu jalani</p>
        </div>

        <div className="sk-content">

          <div className="sk-stats-row">
            {[
              { icon: "", val: totalSesi, lbl: "Total Sesi", delta: `${totalSesi} sesi` },
              { icon: "", val: lastTanggal, lbl: "Sesi Terakhir", delta: "Terbaru" },
              { icon: "", val: skorAkhir, lbl: "Skor Terakhir", delta: deltaSkor },
              { icon: "", val: selesai, lbl: "Sesi Selesai", delta: `dari ${myBookings.length} booking` },
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

          <div className="sk-section-hd">
            <div>
              <h2 className="sk-section-h2">Semua Riwayat Sesi</h2>
              <p className="sk-section-sub">Klik sesi untuk lihat detail lengkapnya</p>
            </div>
          </div>

          {!mid ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b8f8c" }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Data riwayat belum tersedia</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Hubungi admin untuk menghubungkan akunmu dengan data konseling</p>
            </div>
          ) : myProgress.length === 0 ? (
            <div className="rw-empty">
              <div className="rw-empty-icon"></div>
              <p className="rw-empty-title">Belum ada sesi konseling</p>
              <p className="rw-empty-sub">Mulai cerita dengan konselor sebaya kamu</p>
              <button className="sk-cta" style={{ marginTop: 20 }} onClick={() => navigate("/konselor")}>
                Cari Konselor
              </button>
            </div>
          ) : (
            <div className="rw-list">
              {myProgress.map((p, idx) => {
                const isOpen = expanded === idx;
                const konselor = myKonselor.find(k => k.ID === p.ID_Konselor) ?? myKonselor[0] ?? null;
                const bookingsForKonselor = myBookings
                  .filter(b => b.ID_Konselor === p.ID_Konselor)
                  .sort((a, b) => new Date(b.Tanggal_Sesi ?? 0) - new Date(a.Tanggal_Sesi ?? 0));
                const booking = bookingsForKonselor[0] ?? null;
                const prevSkor = idx > 0 ? myProgress[idx - 1].Skor_Kesejahteraan : null;
                const delta = prevSkor !== null
                  ? ((p.Skor_Kesejahteraan - prevSkor) * 10).toFixed(1)
                  : null;
                const skorVal = (p.Skor_Kesejahteraan * 10).toFixed(1);

                const dimensi = [
                  { label: "Mindfulness", val: Math.round(p.Mindfulness * 100) },
                  { label: "Manajemen Stres", val: Math.round(p.Manajemen_Stres * 100) },
                  { label: "Ketahanan Diri", val: Math.round(p.Ketahanan_Diri * 100) },
                  { label: "Hubungan Sosial", val: Math.round(p.Hubungan_Sosial * 100) },
                  { label: "Keseimbangan Hidup", val: Math.round(p.Keseimbangan_Hidup * 100) },
                ];

                return (
                  <div
                    key={idx}
                    className={`rw-item ${isOpen ? "rw-item--open" : ""}`}
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <div className="rw-header" onClick={() => setExpanded(isOpen ? null : idx)}>
                      <div className="rw-badge">S{p.Sesi_Konseling}</div>

                      <div className="rw-meta">
                        <div className="rw-meta-top">
                          <span className="rw-title">Sesi {p.Sesi_Konseling}</span>
                          {konselor && (
                            <span className="rw-konselor">bersama {konselor.Nama}</span>
                          )}
                          <MoodBadge mood={p.Suasana_Hati} />
                        </div>
                        <div className="rw-meta-sub">
                          <span>
                            {p.Tanggal
                              ? new Date(p.Tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
                              : "—"}
                          </span>
                          <span>{p.Kategori_Masalah}</span>
                          {delta !== null && (
                            <span className={Number(delta) >= 0 ? "rw-delta-pos" : "rw-delta-neg"}>
                              {Number(delta) >= 0 ? "↑" : "↓"} {Math.abs(delta)} poin
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rw-right">
                        <div className="rw-skor">
                          <div className="rw-skor-val">{skorVal}</div>
                          <div className="rw-skor-lbl">Skor</div>
                        </div>
                        <svg
                          className={`rw-chevron ${isOpen ? "rw-chevron--open" : ""}`}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" width="18" height="18"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="rw-body">
                        <div className="rw-body-grid">

                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {konselor && (
                              <div className="rw-panel">
                                <div className="rw-panel-title">Konselor Kamu</div>
                                <KonselorAvatar konselor={konselor} />
                                {booking && (
                                  <span className={`rw-k-status ${isSelesai(booking.Status) ? "ks-done" : "ks-run"}`}>
                                    {isSelesai(booking.Status) ? "✓ Sesi Selesai" : `● ${statusLabel(booking.Status)}`}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="rw-panel">
                              <div className="rw-panel-title">Aspek Kesehatan Mental</div>
                              {dimensi.map(d => (
                                <div key={d.label} className="rw-dim-row">
                                  <span className="rw-dim-label">{d.label}</span>
                                  <div className="rw-dim-track">
                                    <div className="rw-dim-fill" style={{ width: `${d.val}%` }} />
                                  </div>
                                  <span className="rw-dim-val">{d.val}%</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div className="rw-panel">
                              <div className="rw-panel-title">Skor Sesi Ini</div>
                              <div className="rw-donut-row">
                                <MiniDonut pct={Math.round(p.Skor_Keterbukaan)} color="#2f7d79" label="KETERBUKAAN" />
                                <MiniDonut pct={Math.round(p.Skor_Kemajuan)} color="#79d8d1" label="KEMAJUAN" />
                                <MiniDonut pct={Math.round(p.Skor_Konsistensi)} color="#1a5e5a" label="KONSISTENSI" />
                              </div>
                            </div>

                            {booking && (
                              <div className="rw-panel">
                                <div className="rw-panel-title">Kondisi Sebelum vs Sesudah</div>
                                <div className="rw-kondisi-row">
                                  <div className="rw-kondisi-box">
                                    <div className="rw-kondisi-val" style={{ color: "#d4854a" }}>
                                      {Math.round(booking.Kondisi_Awal * 100)}%
                                    </div>
                                    <div className="rw-kondisi-lbl">Kondisi Awal</div>
                                  </div>
                                  <div className="rw-kondisi-arrow">→</div>
                                  <div className="rw-kondisi-box">
                                    <div className="rw-kondisi-val" style={{ color: "#2f7d79" }}>
                                      {Math.round(booking.Kondisi_Saat_Ini * 100)}%
                                    </div>
                                    <div className="rw-kondisi-lbl">Kondisi Saat Ini</div>
                                  </div>
                                </div>
                                <div className="rw-kondisi-note">
                                  Kondisi berkembang {Math.round((booking.Kondisi_Saat_Ini - booking.Kondisi_Awal) * 100)} poin — terus semangat ya!
                                </div>
                              </div>
                            )}

                            <div className="rw-catatan">
                              <div className="rw-panel-title" style={{ marginBottom: 8 }}>Catatan Sesi</div>
                              <p>
                                "Sesi {p.Sesi_Konseling} membahas {p.Kategori_Masalah} — kamu terlihat {(p.Suasana_Hati ?? "baik").toLowerCase()} dan terus menunjukkan perkembangan yang berarti. Tetap semangat ya!"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <footer className="sk-footer">
          <div>
            <span className="sk-footer-brand">The Sanctuary</span>
            <p className="sk-footer-copy">
              © 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan
            </p>
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