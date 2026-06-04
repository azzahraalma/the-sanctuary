import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import "../styles/admin-dashboard.css";
import "../styles/riwayat-sesi-admin.css";

/* ─── HELPERS ────────────────────────────────────── */
function getMetrik(rows, nama) {
  return rows.find(d => d.metrik_statistik === nama) || {};
}

const STATUS_OPTIONS = ["Semua", "Terjadwal", "Selesai", "Dibatalkan"];

/* ─── DONUT ─────────────────────────────────────── */
function DonutChart({ parts, total }) {
  const r = 70, cx = 90, cy = 90;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = parts.map((p) => {
    const pct = p.val / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const seg = { ...p, dash, gap, offset };
    offset += dash;
    return seg;
  });
  const maxPart = parts.reduce((a, b) => (a.val > b.val ? a : b));
  return (
    <div className="ad-donut-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(47,125,121,0.08)" strokeWidth="22" />
        {segs.map((s) => (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="22"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circ * 0.25}
            strokeLinecap="round" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="ad-donut-lbl">{maxPart.label}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="ad-donut-pct">
          {(maxPart.val / total * 100).toFixed(1)}%
        </text>
      </svg>
      <div className="ad-donut-legend">
        {parts.map((p) => (
          <div key={p.label} className="ad-donut-leg-item">
            <span className="ad-donut-dot" style={{ background: p.color }} />
            <span>{(p.val / total * 100).toFixed(1)}% {p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BAR CHART ─────────────────────────────────── */
function BarGroup({ label, values }) {
  const colors = ["#79d8d1", "#2f7d79", "#b0d8c8"];
  const max = 5;
  return (
    <div className="ad-bargroup">
      <div className="ad-bargroup-bars">
        {values.map((v, i) => (
          <div key={i} className="ad-bar-col">
            <div className="ad-bar-track">
              <div className="ad-bar-fill" style={{ height: `${(v / max) * 100}%`, background: colors[i] }} />
            </div>
            <span className="ad-bar-val">{typeof v === "number" ? v.toFixed(2) : v}</span>
          </div>
        ))}
      </div>
      <span className="ad-bargroup-label">{label}</span>
    </div>
  );
}

/* ─── GAUGE ─────────────────────────────────────── */
function GaugeChart({ value, max = 10 }) {
  const pct = value / max;
  const r = 54, cx = 70, cy = 70;
  const startAngle = -210, endAngle = 30;
  const totalArc = endAngle - startAngle;
  const arcPct = pct * totalArc;
  function polarToXY(deg, radius) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }
  const s1 = polarToXY(startAngle, r);
  const e1 = polarToXY(startAngle + arcPct, r);
  const largeArc = arcPct > 180 ? 1 : 0;
  const s2 = polarToXY(startAngle, r);
  const e2 = polarToXY(endAngle, r);
  const la2 = totalArc > 180 ? 1 : 0;
  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      <path d={`M${s2.x},${s2.y} A${r},${r} 0 ${la2},1 ${e2.x},${e2.y}`}
        fill="none" stroke="rgba(47,125,121,0.12)" strokeWidth="12" strokeLinecap="round" />
      <path d={`M${s1.x},${s1.y} A${r},${r} 0 ${largeArc},1 ${e1.x},${e1.y}`}
        fill="none" stroke="#2f7d79" strokeWidth="12" strokeLinecap="round" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="ad-gauge-val">{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="ad-gauge-max">/ {max}.0</text>
    </svg>
  );
}

/* ─── LIKERT CHART ───────────────────────────────── */
function LikertChart({ rows }) {
  const colors = { Kemudahan: "#79d8d1", Kejelasan: "#2f7d79", "Daya Tarik": "#b0d8c8" };
  const maxFreq = Math.max(...rows.map(r => Math.max(r.kemudahan || 0, r.kejelasan || 0, r.daya_tarik || 0)));
  return (
    <div className="ad-likert-wrap">
      <div className="ad-likert-chart">
        {rows.map((row) => {
          const freqs = [
            { label: "Kemudahan", val: row.kemudahan || 0 },
            { label: "Kejelasan", val: row.kejelasan || 0 },
            { label: "Daya Tarik", val: row.daya_tarik || 0 },
          ];
          return (
            <div key={row.metrik_statistik} className="ad-likert-group">
              <div className="ad-likert-bars">
                {freqs.map((f) => (
                  <div key={f.label} className="ad-likert-bar-col">
                    <div className="ad-likert-track">
                      <div className="ad-likert-fill"
                        style={{ height: `${maxFreq > 0 ? (f.val / maxFreq) * 100 : 0}%`, background: colors[f.label] }} />
                    </div>
                    <span className="ad-likert-num">{f.val}</span>
                  </div>
                ))}
              </div>
              <span className="ad-likert-xlabel">{row.metrik_statistik}</span>
            </div>
          );
        })}
      </div>
      <div className="ad-likert-legend">
        {Object.entries(colors).map(([label, color]) => (
          <div key={label} className="ad-legend-item">
            <span className="ad-legend-dot" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MIN MAX BAR ────────────────────────────────── */
function MinMaxBar({ label, min, max }) {
  return (
    <div className="ad-minmax-col">
      <span className="ad-minmax-lbl">{label}</span>
      <div className="ad-minmax-row">
        <div className="ad-minmax-group">
          <span className="ad-minmax-tag">MIN</span>
          <div className="ad-minmax-pill ad-minmax-pill--min">{min}</div>
          <span className="ad-minmax-val">{min}.0</span>
        </div>
        <div className="ad-minmax-group">
          <span className="ad-minmax-tag">MAX</span>
          <div className="ad-minmax-pill ad-minmax-pill--max">{max}</div>
          <span className="ad-minmax-val">{max}.0</span>
        </div>
      </div>
    </div>
  );
}

/* ─── RIWAYAT SESI TAB ───────────────────────────── */
function RiwayatSesiTab() {
  const [sesi, setSesi] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKonselor, setFilterKonselor] = useState("Semua");
  const [sortBy, setSortBy] = useState("tanggal_desc");
  const [selectedSesi, setSelectedSesi] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [konselorList, setKonselorList] = useState([]);

  useEffect(() => { fetchAllSesi(); }, []);

  async function fetchAllSesi() {
    setLoading(true); setError(null);
    try {
      const { data: bookings, error: bookErr } = await supabase
        .from("booking").select("*").order("tanggal_sesi", { ascending: false });
      if (bookErr) throw bookErr;

      const { data: profil, error: profilErr } = await supabase
        .from("profil_pengguna").select("nama, konselor_id").not("konselor_id", "is", null);
      if (profilErr) throw profilErr;

      const konselorMap = {};
      profil.forEach((p) => { if (p.konselor_id) konselorMap[p.konselor_id] = p.nama; });

      const merged = (bookings || []).map((b) => ({
        ...b, nama_konselor: konselorMap[b.id_konselor] || b.id_konselor || "—",
      }));

      setSesi(merged); setFiltered(merged);
      setKonselorList(["Semua", ...new Set(merged.map((s) => s.nama_konselor))]);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let result = [...sesi];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.nama_mahasiswa?.toLowerCase().includes(q) ||
        s.nama_konselor?.toLowerCase().includes(q) ||
        s.kategori_masalah?.toLowerCase().includes(q) ||
        s.id_mahasiswa?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "Semua") result = result.filter(s => s.status?.toLowerCase() === filterStatus.toLowerCase());
    if (filterKonselor !== "Semua") result = result.filter(s => s.nama_konselor === filterKonselor);
    switch (sortBy) {
      case "tanggal_asc": result.sort((a, b) => new Date(a.tanggal_sesi) - new Date(b.tanggal_sesi)); break;
      case "tanggal_desc": result.sort((a, b) => new Date(b.tanggal_sesi) - new Date(a.tanggal_sesi)); break;
      case "sesi_asc": result.sort((a, b) => (a.sesi_konseling || 0) - (b.sesi_konseling || 0)); break;
      case "nama_az": result.sort((a, b) => (a.nama_mahasiswa || "").localeCompare(b.nama_mahasiswa || "")); break;
    }
    setFiltered(result);
  }, [searchQuery, filterStatus, filterKonselor, sortBy, sesi]);

  function openModal(item) { setSelectedSesi(item); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setTimeout(() => setSelectedSesi(null), 300); }

  function getStatusClass(status) {
    if (!status) return "status-badge status-unknown";
    const s = status.toLowerCase();
    if (s === "selesai") return "status-badge status-selesai";
    if (s === "terjadwal") return "status-badge status-terjadwal";
    if (s === "dibatalkan") return "status-badge status-dibatalkan";
    return "status-badge status-unknown";
  }

  function formatTanggal(t) {
    if (!t) return "—";
    return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  function getProgressBar(value) {
    const pct = Math.min(Math.round((value / 1) * 100), 100);
    return (
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
        <span className="progress-label">{value?.toFixed(2) ?? "—"}</span>
      </div>
    );
  }

  const totalSesi = sesi.length;
  const totalSelesai = sesi.filter(s => s.status?.toLowerCase() === "selesai").length;
  const totalTerjadwal = sesi.filter(s => s.status?.toLowerCase() === "terjadwal").length;
  const totalDibatalkan = sesi.filter(s => s.status?.toLowerCase() === "dibatalkan").length;

  return (
    <div className="rsa-tab-content">
      <div className="rsa-summary">
        <div className="rsa-stat-card"><span className="rsa-stat-value">{totalSesi}</span><span className="rsa-stat-label">Total Sesi</span></div>
        <div className="rsa-stat-card rsa-stat-selesai"><span className="rsa-stat-value">{totalSelesai}</span><span className="rsa-stat-label">Selesai</span></div>
        <div className="rsa-stat-card rsa-stat-terjadwal"><span className="rsa-stat-value">{totalTerjadwal}</span><span className="rsa-stat-label">Terjadwal</span></div>
        <div className="rsa-stat-card rsa-stat-dibatalkan"><span className="rsa-stat-value">{totalDibatalkan}</span><span className="rsa-stat-label">Dibatalkan</span></div>
      </div>

      <div className="rsa-filter-bar">
        <div className="rsa-search-wrap">
          <svg className="rsa-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="rsa-search" type="text" placeholder="Cari mahasiswa, konselor, kategori..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="rsa-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="rsa-select" value={filterKonselor} onChange={(e) => setFilterKonselor(e.target.value)}>
          {konselorList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="rsa-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="tanggal_desc">Terbaru</option>
          <option value="tanggal_asc">Terlama</option>
          <option value="sesi_asc">Sesi ↑</option>
          <option value="nama_az">Nama A–Z</option>
        </select>
        <button className="rsa-refresh-btn" onClick={fetchAllSesi}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
        <span className="rsa-count">{filtered.length} sesi</span>
      </div>

      {loading ? (
        <div className="rsa-loading"><div className="rsa-spinner" /><span>Memuat data sesi...</span></div>
      ) : error ? (
        <div className="rsa-error"><span>⚠ Gagal memuat data: {error}</span><button onClick={fetchAllSesi}>Coba lagi</button></div>
      ) : filtered.length === 0 ? (
        <div className="rsa-empty"><span>Tidak ada sesi yang sesuai filter</span></div>
      ) : (
        <div className="rsa-table-wrap">
          <table className="rsa-table">
            <thead>
              <tr>
                <th>Mahasiswa</th><th>Konselor</th><th>Kategori Masalah</th>
                <th>Tanggal Sesi</th><th>Sesi ke-</th><th>Status</th>
                <th>Kondisi Awal</th><th>Kondisi Saat Ini</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} onClick={() => openModal(item)} className="rsa-row">
                  <td>
                    <div className="rsa-cell-name">
                      <div className="rsa-avatar">{(item.nama_mahasiswa || "?")[0].toUpperCase()}</div>
                      <div>
                        <div className="rsa-name">{item.nama_mahasiswa || "—"}</div>
                        <div className="rsa-id">{item.id_mahasiswa}</div>
                      </div>
                    </div>
                  </td>
                  <td className="rsa-td-konselor">{item.nama_konselor}</td>
                  <td><span className="rsa-kategori">{item.kategori_masalah || "—"}</span></td>
                  <td className="rsa-td-date">{formatTanggal(item.tanggal_sesi)}</td>
                  <td className="rsa-td-center"><span className="rsa-sesi-badge">{item.sesi_konseling ?? "—"}</span></td>
                  <td><span className={getStatusClass(item.status)}>{item.status || "—"}</span></td>
                  <td>{item.kondisi_awal != null ? Number(item.kondisi_awal).toFixed(2) : "—"}</td>
                  <td>{item.kondisi_saat_ini != null ? Number(item.kondisi_saat_ini).toFixed(2) : "—"}</td>
                  <td>
                    <button className="rsa-detail-btn" onClick={(e) => { e.stopPropagation(); openModal(item); }}>Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && selectedSesi && (
        <div className="rsa-modal-overlay" onClick={closeModal}>
          <div className="rsa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rsa-modal-header">
              <div>
                <span className="rsa-modal-eyebrow">Detail Sesi</span>
                <h2 className="rsa-modal-title">{selectedSesi.nama_mahasiswa || "—"}</h2>
                <span className="rsa-modal-id">{selectedSesi.id_mahasiswa}</span>
              </div>
              <button className="rsa-modal-close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="rsa-modal-body">
              <div className="rsa-modal-grid">
                <div className="rsa-modal-field"><label>Konselor</label><span>{selectedSesi.nama_konselor}</span></div>
                <div className="rsa-modal-field"><label>Tanggal Sesi</label><span>{formatTanggal(selectedSesi.tanggal_sesi)}</span></div>
                <div className="rsa-modal-field"><label>Sesi ke-</label><span>{selectedSesi.sesi_konseling ?? "—"}</span></div>
                <div className="rsa-modal-field">
                  <label>Status</label>
                  <span className={getStatusClass(selectedSesi.status)}>{selectedSesi.status || "—"}</span>
                </div>
                <div className="rsa-modal-field rsa-modal-full"><label>Kategori Masalah</label><span>{selectedSesi.kategori_masalah || "—"}</span></div>
              </div>
              <div className="rsa-modal-section">
                <h3>Perkembangan Kondisi</h3>
                <div className="rsa-kondisi-row">
                  <div className="rsa-kondisi-item"><label>Kondisi Awal</label>{getProgressBar(selectedSesi.kondisi_awal)}</div>
                  <div className="rsa-kondisi-arrow">→</div>
                  <div className="rsa-kondisi-item"><label>Kondisi Saat Ini</label>{getProgressBar(selectedSesi.kondisi_saat_ini)}</div>
                </div>
                {selectedSesi.kondisi_awal != null && selectedSesi.kondisi_saat_ini != null && (
                  <div className={`rsa-delta ${selectedSesi.kondisi_saat_ini >= selectedSesi.kondisi_awal ? "delta-up" : "delta-down"}`}>
                    {selectedSesi.kondisi_saat_ini >= selectedSesi.kondisi_awal ? "▲" : "▼"}{" "}
                    {Math.abs(selectedSesi.kondisi_saat_ini - selectedSesi.kondisi_awal).toFixed(2)} poin
                    {selectedSesi.kondisi_saat_ini >= selectedSesi.kondisi_awal ? " (membaik)" : " (menurun)"}
                  </div>
                )}
              </div>
              <div className="rsa-modal-section">
                <h3>Info Sistem</h3>
                <div className="rsa-modal-grid">
                  <div className="rsa-modal-field"><label>ID Booking</label><span className="rsa-mono">{selectedSesi.id}</span></div>
                  <div className="rsa-modal-field"><label>Dibuat pada</label><span>{formatTanggal(selectedSesi.created_at)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DASHBOARD TAB ──────────────────────────────── */
function DashboardTab() {
  const [stats, setStats] = useState([]);
  const [totalResponden, setTotalResponden] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const [{ data: statsData, error: statsErr }, { count, error: countErr }] = await Promise.all([
        supabase.from("analisis_statistik").select("*"),
        supabase.from("data_responden").select("*", { count: "exact", head: true }),
      ]);
      if (statsErr) throw statsErr;
      if (countErr) throw countErr;
      setStats(statsData || []);
      setTotalResponden(count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="rsa-loading" style={{ marginTop: "4rem" }}>
      <div className="rsa-spinner" />
      <span>Memuat data analitik...</span>
    </div>
  );

  if (error) return (
    <div className="rsa-error" style={{ marginTop: "4rem" }}>
      <span>⚠ Gagal memuat data: {error}</span>
      <button onClick={fetchData}>Coba lagi</button>
    </div>
  );

  // Parse dari Supabase rows
  const mean = getMetrik(stats, "Mean (Rata-rata)");
  const median = getMetrik(stats, "Median");
  const stddev = getMetrik(stats, "Standar Deviasi");
  const minK = getMetrik(stats, "Nilai Minimum");
  const maxK = getMetrik(stats, "Nilai Maksimum");
  const skorIdx = getMetrik(stats, "Skor Indeks");

  const likertRows = stats.filter(d =>
    ["Likert 1", "Likert 2", "Likert 3", "Likert 4", "Likert 5"].includes(d.metrik_statistik)
  );

  const meanK = Number(mean.kemudahan) || 0;
  const meanJ = Number(mean.kejelasan) || 0;
  const meanDT = Number(mean.daya_tarik) || 0;
  const uxIndex = ((meanK + meanJ + meanDT) / 3 / 5 * 100).toFixed(0);
  const gapPercent = (100 - Number(uxIndex)).toFixed(0);

  const donutParts = [
    { label: "Kemudahan", val: meanK, color: "#79d8d1" },
    { label: "Kejelasan", val: meanJ, color: "#2f7d79" },
    { label: "Daya Tarik", val: meanDT, color: "#b0d8c8" },
  ];
  const donutTotal = donutParts.reduce((s, d) => s + d.val, 0);

  return (
    <>
      {/* TOP STATS */}
      <section className="ad-stats-row">
        <div className="ad-stat-card">
          <span className="ad-stat-label">Total Responden</span>
          <span className="ad-stat-big">{totalResponden}</span>
        </div>
        <div className="ad-stat-card">
          <span className="ad-stat-label">UX Index Score</span>
          <span className="ad-stat-big">{uxIndex}%</span>
          <div className="ad-stat-progress">
            <div className="ad-stat-progress-fill" style={{ width: `${uxIndex}%` }} />
          </div>
        </div>
        <div className="ad-stat-card">
          <span className="ad-stat-label">Rata-Rata Kemudahan</span>
          <span className="ad-stat-big">{meanK.toFixed(1)}</span>
          <div className="ad-star-row">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                fill={i <= Math.round(meanK) ? "#2f7d79" : "none"} stroke="#2f7d79" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
        </div>
        <div className="ad-stat-card ad-stat-card--alert">
          <span className="ad-stat-label">Gap to Perfect</span>
          <span className="ad-stat-big ad-stat-big--red">{gapPercent}%</span>
        </div>
      </section>

      {/* DIMENSI SCORE CARDS */}
      <section className="ad-dim-row">
        {[
          { label: "Kemudahan", sub: "Usability & Navigation", val: meanK, idx: Number(skorIdx.kemudahan) },
          { label: "Kejelasan", sub: "Content & Messaging", val: meanJ, idx: Number(skorIdx.kejelasan) },
          { label: "Daya Tarik", sub: "Visual Aesthetics", val: meanDT, idx: Number(skorIdx.daya_tarik) },
        ].map((d) => (
          <div key={d.label} className="ad-dim-card">
            <div className="ad-dim-top">
              <div>
                <span className="ad-dim-title">{d.label}</span>
                <span className="ad-dim-sub">{d.sub}</span>
              </div>
              <span className="ad-dim-score">{d.val.toFixed(1)}</span>
            </div>
            <div className="ad-dim-track">
              <span className="ad-dim-track-label">SCORE PROGRESS</span>
              <span className="ad-dim-track-pct">{d.idx?.toFixed(0) ?? 0}%</span>
            </div>
            <div className="ad-dim-bar">
              <div className="ad-dim-bar-fill" style={{ width: `${d.idx ?? 0}%` }} />
            </div>
          </div>
        ))}
      </section>

      {/* CHART SECTION */}
      <section className="ad-chart-row">
        <div className="ad-chart-card">
          <div className="ad-chart-head">
            <span className="ad-chart-title">Rata-rata Skor UX</span>
          </div>
          <div className="ad-bar-chart">
            <BarGroup label="KEMUDAHAN" values={[meanK, 0, 0]} />
            <BarGroup label="KEJELASAN" values={[0, meanJ, 0]} />
            <BarGroup label="DAYA TARIK" values={[0, 0, meanDT]} />
          </div>
        </div>
        <div className="ad-chart-card">
          <div className="ad-chart-head">
            <span className="ad-chart-title">Nilai Tengah Skor UX</span>
          </div>
          <div className="ad-bar-chart">
            <BarGroup label="KEMUDAHAN" values={[Number(median.kemudahan), 0, 0]} />
            <BarGroup label="KEJELASAN" values={[0, Number(median.kejelasan), 0]} />
            <BarGroup label="DAYA TARIK" values={[0, 0, Number(median.daya_tarik)]} />
          </div>
        </div>
        <div className="ad-chart-card">
          <div className="ad-chart-head">
            <span className="ad-chart-title">Standar Deviasi UX</span>
          </div>
          <div className="ad-std-list">
            {[
              { label: "KEMUDAHAN", val: Number(stddev.kemudahan) },
              { label: "KEJELASAN", val: Number(stddev.kejelasan) },
              { label: "DAYA TARIK", val: Number(stddev.daya_tarik) },
            ].map((s) => (
              <div key={s.label} className="ad-std-item">
                <span className="ad-std-label">{s.label}</span>
                <div className="ad-std-track">
                  <div className="ad-std-fill" style={{ width: `${(s.val / 2) * 100}%` }} />
                </div>
                <span className="ad-std-val">{s.val?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISTRIBUSI */}
      <section className="ad-section">
        <h2 className="ad-section-title">Distribusi & Sebaran</h2>
        <p className="ad-section-sub">Analisis mendalam mengenai distribusi skor dan sebaran jawaban responden.</p>
        <div className="ad-distrib-row">
          <div className="ad-distrib-card">
            <span className="ad-distrib-title">Nilai UX Per Dimensi</span>
            <DonutChart parts={donutParts} total={donutTotal} />
          </div>
          <div className="ad-distrib-card">
            <span className="ad-distrib-title">Nilai Keseluruhan UX</span>
            <div className="ad-gauge-wrap">
              <GaugeChart value={(Number(uxIndex) / 10).toFixed(1)} max={10} />
              <div className="ad-gauge-stats">
                <div className="ad-gauge-stat">
                  <span className="ad-gauge-stat-label">TARGET ACHIEVEMENT</span>
                  <span className="ad-gauge-stat-val">{(Number(uxIndex) / 10).toFixed(1)} <span className="ad-gauge-stat-max">/ 10.0</span></span>
                </div>
                <div className="ad-gauge-stat">
                  <span className="ad-gauge-stat-label ad-gauge-stat-label--red">GAP TO PERFECT</span>
                  <span className="ad-gauge-stat-val ad-gauge-stat-val--red">{(gapPercent / 10).toFixed(1)} <span className="ad-gauge-stat-max">/ 10.0</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIKERT */}
      <section className="ad-section">
        <div className="ad-card ad-card--full">
          <span className="ad-distrib-title">Frekuensi Jawaban Likert (1–5)</span>
          <LikertChart rows={likertRows} />
        </div>
      </section>

      {/* MIN MAX */}
      <section className="ad-section">
        <div className="ad-card ad-card--full">
          <span className="ad-distrib-title">Nilai Min &amp; Max Per Dimensi</span>
          <div className="ad-minmax-row-outer">
            <MinMaxBar label="KEMUDAHAN" min={Number(minK.kemudahan)} max={Number(maxK.kemudahan)} />
            <MinMaxBar label="KEJELASAN" min={Number(minK.kejelasan)} max={Number(maxK.kejelasan)} />
            <MinMaxBar label="DAYA TARIK" min={Number(minK.daya_tarik)} max={Number(maxK.daya_tarik)} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── MAIN ───────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="ad-shell">
      {/* TOPNAV */}
      <header className="ad-topnav">
        <span className="ad-topnav-logo" onClick={() => navigate("/")}>The Sanctuary</span>
        <nav className="ad-topnav-links">
          <span
            className={`ad-topnav-link${activeTab === "dashboard" ? " ad-topnav-link--active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >Dashboard</span>
          <span
            className={`ad-topnav-link${activeTab === "riwayat" ? " ad-topnav-link--active" : ""}`}
            onClick={() => setActiveTab("riwayat")}
          >Riwayat Sesi</span>
        </nav>
        <button
          className="ad-logout-btn"
          onClick={() => {
            localStorage.removeItem("sanctuary_user");
            navigate("/login");
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </header>

      <main className="ad-main">
        {activeTab === "dashboard" && (
          <>
            <section className="ad-hero">
              <h1 className="ad-hero-title">UX Analytics Dashboard</h1>
              <p className="ad-hero-sub">Menganalisis ketangguhan pengalaman pengguna dan metrik kepuasan di seluruh ekosistem digital The Sanctuary.</p>
            </section>
            <DashboardTab />
          </>
        )}

        {activeTab === "riwayat" && (
          <>
            <section className="ad-hero">
              <h1 className="ad-hero-title">Riwayat Sesi</h1>
              <p className="ad-hero-sub">Seluruh rekam jejak sesi konseling di The Sanctuary.</p>
            </section>
            <RiwayatSesiTab />
          </>
        )}
      </main>

      <footer className="ad-footer">
        <div className="ad-footer-brand">
          <span className="ad-footer-logo">The Sanctuary</span>
          <p>© 2024 The Editorial Sanctuary. A space for resilient horizons. Menciptakan kedamaian melalui data dan empati.</p>
        </div>
        <div className="ad-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
        <div className="ad-footer-links">
          <a href="#">Contact Support</a>
          <a href="#">Our Methodology</a>
        </div>
      </footer>
    </div>
  );
}