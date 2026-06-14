import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import "../styles/admin-dashboard.css";
import "../styles/riwayat-sesi-admin.css";

const STATUS_OPTIONS = ["Semua", "Terjadwal", "Berjalan", "Menunggu Evaluasi", "Selesai", "Dibatalkan"];

function filterStatusValue(label) {
  const map = {
    Terjadwal: "terjadwal",
    Berjalan: "berjalan",
    "Menunggu Evaluasi": "menunggu_evaluasi",
    Selesai: "selesai",
    Dibatalkan: "dibatalkan",
  };
  return map[label] ?? label.toLowerCase();
}

function DonutChart({ parts, total }) {
  const r = 70, cx = 90, cy = 90;
  const circ = 2 * Math.PI * r;
  const segs = parts.map((p, idx) => {
    const pct  = p.val / total;
    const dash = pct * circ;
    const gap  = circ - dash;
    const offset = parts.slice(0, idx).reduce((sum, prev) => sum + (prev.val / total) * circ, 0);
    return { ...p, dash, gap, offset };
  });
  const maxPart = parts.reduce((a, b) => (a.val > b.val ? a : b));
  return (
    <div className="ad-donut-wrap">
      <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(47,125,121,0.08)" strokeWidth="22" />
        {segs.map((s) => (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="22"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circ * 0.25}
            strokeLinecap="round" />
        ))}
        <text x={cx} y={cy - 6}  textAnchor="middle" className="ad-donut-lbl">{maxPart.label}</text>
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

function GaugeChart({ value, max = 10 }) {
  const pct = value / max;
  const r = 54, cx = 70, cy = 70;
  const startAngle = -210, endAngle = 30;
  const totalArc = endAngle - startAngle;
  const arcPct   = pct * totalArc;
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
    <svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
      <path d={`M${s2.x},${s2.y} A${r},${r} 0 ${la2},1 ${e2.x},${e2.y}`}
        fill="none" stroke="rgba(47,125,121,0.12)" strokeWidth="12" strokeLinecap="round" />
      <path d={`M${s1.x},${s1.y} A${r},${r} 0 ${largeArc},1 ${e1.x},${e1.y}`}
        fill="none" stroke="#2f7d79" strokeWidth="12" strokeLinecap="round" />
      <text x={cx} y={cy - 4}  textAnchor="middle" className="ad-gauge-val">{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="ad-gauge-max">/ {max}.0</text>
    </svg>
  );
}

function LikertChart({ rows }) {
  const colors = { Kemudahan: "#79d8d1", Kejelasan: "#2f7d79", "Daya Tarik": "#b0d8c8" };
  const maxFreq = Math.max(...rows.map(r => Math.max(r.kemudahan || 0, r.kejelasan || 0, r.daya_tarik || 0)));
  return (
    <div className="ad-likert-wrap">
      <div className="ad-likert-chart">
        {rows.map((row) => {
          const freqs = [
            { label: "Kemudahan",  val: row.kemudahan   || 0 },
            { label: "Kejelasan",  val: row.kejelasan   || 0 },
            { label: "Daya Tarik", val: row.daya_tarik  || 0 },
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
  };
  const c = content[type];
  if (!c) return null;
  return (
    <div className="footer-modal-overlay" onClick={onClose}>
      <div className="footer-modal-container" onClick={e => e.stopPropagation()}>
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

function RiwayatSesiTab() {
  const [sesi, setSesi]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [searchQuery, setSearchQuery]       = useState("");
  const [filterStatus, setFilterStatus]     = useState("Semua");
  const [filterKonselor, setFilterKonselor] = useState("Semua");
  const [sortBy, setSortBy]                 = useState("tanggal_desc");
  const [selectedSesi, setSelectedSesi]     = useState(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [konselorList, setKonselorList]     = useState([]);

  useEffect(() => { fetchAllSesi(); }, []);

  async function fetchAllSesi() {
    setLoading(true); setError(null);
    try {
      const { data: bookings, error: bookErr } = await supabase
        .from("booking").select("*").order("tanggal_sesi", { ascending: false });
      if (bookErr) throw bookErr;

      const { data: konselorData, error: konselorErr } = await supabase
        .from("data_konselor").select("id, nama");
      if (konselorErr) throw konselorErr;

      const konselorMap = {};
      (konselorData || []).forEach((k) => { konselorMap[k.id] = k.nama; });

      const merged = (bookings || []).map((b) => ({
        ...b, nama_konselor: konselorMap[b.id_konselor] || b.id_konselor || "—",
      }));

      setSesi(merged);
      setKonselorList(["Semua", ...new Set(merged.map((s) => s.nama_konselor))]);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
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
    if (filterStatus !== "Semua") {
      const want = filterStatusValue(filterStatus);
      result = result.filter(s => s.status?.toLowerCase() === want);
    }
    if (filterKonselor !== "Semua") result = result.filter(s => s.nama_konselor === filterKonselor);
    switch (sortBy) {
      case "tanggal_asc":  result.sort((a, b) => new Date(a.tanggal_sesi) - new Date(b.tanggal_sesi)); break;
      case "tanggal_desc": result.sort((a, b) => new Date(b.tanggal_sesi) - new Date(a.tanggal_sesi)); break;
      case "sesi_asc":     result.sort((a, b) => (a.sesi_konseling || 0) - (b.sesi_konseling || 0)); break;
      case "nama_az":      result.sort((a, b) => (a.nama_mahasiswa || "").localeCompare(b.nama_mahasiswa || "")); break;
    }
    return result;
  }, [searchQuery, filterStatus, filterKonselor, sortBy, sesi]);

  function openModal(item)  { setSelectedSesi(item); setModalOpen(true); }
  function closeModal()     { setModalOpen(false); setTimeout(() => setSelectedSesi(null), 300); }

  function getStatusClass(status) {
    if (!status) return "status-badge status-unknown";
    const s = status.toLowerCase();
    if (s === "selesai")           return "status-badge status-selesai";
    if (s === "terjadwal")         return "status-badge status-terjadwal";
    if (s === "berjalan")          return "status-badge status-terjadwal";
    if (s === "menunggu_evaluasi") return "status-badge status-terjadwal";
    if (s === "dibatalkan")        return "status-badge status-dibatalkan";
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

  const totalSesi       = sesi.length;
  const totalSelesai    = sesi.filter(s => s.status?.toLowerCase() === "selesai").length;
  const totalTerjadwal  = sesi.filter(s => s.status?.toLowerCase() === "terjadwal").length;
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
        <select className="rsa-select" value={filterStatus}   onChange={(e) => setFilterStatus(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="rsa-select" value={filterKonselor} onChange={(e) => setFilterKonselor(e.target.value)}>
          {konselorList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="rsa-select" value={sortBy}         onChange={(e) => setSortBy(e.target.value)}>
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
        <div className="rsa-error"><span>Gagal memuat data: {error}</span><button onClick={fetchAllSesi}>Coba lagi</button></div>
      ) : filtered.length === 0 ? (
        <div className="rsa-empty"><span>Tidak ada sesi yang sesuai filter</span></div>
      ) : (
        <div className="rsa-table-wrap">
          <table className="rsa-table">
            <thead>
              <tr>
                <th>Mahasiswa</th>
                <th>Konselor</th>
                <th>Kategori Masalah</th>
                <th>Tanggal Sesi</th>
                <th className="rsa-td-center">Sesi ke-</th>
                <th>Status</th>
                <th>Kondisi Awal</th>
                <th>Kondisi Saat Ini</th>
                <th></th>
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
                  <td className="rsa-td-kondisi">{item.kondisi_awal != null ? Number(item.kondisi_awal).toFixed(2) : "—"}</td>
                  <td className="rsa-td-kondisi">{item.kondisi_saat_ini != null ? Number(item.kondisi_saat_ini).toFixed(2) : "—"}</td>
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

function DashboardTab() {
  const [stats, setStats]               = useState(null);
  const [totalResponden, setTotalResponden] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const { data: rows, error: rowsErr } = await supabase.from("data_responden").select("*");
      if (rowsErr) throw rowsErr;
      if (!rows || rows.length === 0) { setStats(null); setTotalResponden(0); return; }

      const dims = {
        kemudahan:  rows.map(r => Number(r.mean_kemudahan)  || 0),
        kejelasan:  rows.map(r => Number(r.mean_kejelasan)  || 0),
        daya_tarik: rows.map(r => Number(r.mean_daya_tarik) || 0),
      };
      const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
      const med = arr => {
        const s = [...arr].sort((a, b) => a - b);
        return s.length % 2 === 0 ? (s[s.length/2 - 1] + s[s.length/2]) / 2 : s[Math.floor(s.length/2)];
      };
      const std = arr => {
        const m = avg(arr);
        return Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length);
      };

      setStats({
        mean:    { kemudahan: avg(dims.kemudahan), kejelasan: avg(dims.kejelasan), daya_tarik: avg(dims.daya_tarik) },
        median:  { kemudahan: med(dims.kemudahan), kejelasan: med(dims.kejelasan), daya_tarik: med(dims.daya_tarik) },
        stddev:  { kemudahan: std(dims.kemudahan), kejelasan: std(dims.kejelasan), daya_tarik: std(dims.daya_tarik) },
        min:     { kemudahan: Math.min(...dims.kemudahan), kejelasan: Math.min(...dims.kejelasan), daya_tarik: Math.min(...dims.daya_tarik) },
        max:     { kemudahan: Math.max(...dims.kemudahan), kejelasan: Math.max(...dims.kejelasan), daya_tarik: Math.max(...dims.daya_tarik) },
        skorIdx: { kemudahan: avg(dims.kemudahan)/5*100, kejelasan: avg(dims.kejelasan)/5*100, daya_tarik: avg(dims.daya_tarik)/5*100 },
        likert: [1,2,3,4,5].map(skor => ({
          metrik_statistik: `Likert ${skor}`,
          kemudahan:  rows.filter(r => Math.round(r.mean_kemudahan)  === skor).length,
          kejelasan:  rows.filter(r => Math.round(r.mean_kejelasan)  === skor).length,
          daya_tarik: rows.filter(r => Math.round(r.mean_daya_tarik) === skor).length,
        })),
      });
      setTotalResponden(rows.length);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="rsa-loading" style={{ marginTop: "2rem" }}><div className="rsa-spinner" /><span>Memuat data analitik...</span></div>;
  if (error)   return <div className="rsa-error"   style={{ marginTop: "2rem" }}><span>Gagal memuat data: {error}</span><button onClick={fetchData}>Coba lagi</button></div>;
  if (!stats)  return <div className="rsa-empty"   style={{ marginTop: "2rem" }}><span>Belum ada data responden.</span></div>;

  const mean    = stats.mean    || {};
  const median  = stats.median  || {};
  const stddev  = stats.stddev  || {};
  const minK    = stats.min     || {};
  const maxK    = stats.max     || {};
  const skorIdx = stats.skorIdx || {};

  const meanK  = Number(mean.kemudahan)  || 0;
  const meanJ  = Number(mean.kejelasan)  || 0;
  const meanDT = Number(mean.daya_tarik) || 0;
  const uxIndex    = ((meanK + meanJ + meanDT) / 3 / 5 * 100).toFixed(0);
  const gapPercent = (100 - Number(uxIndex)).toFixed(0);

  const donutParts = [
    { label: "Kemudahan",  val: meanK,  color: "#79d8d1" },
    { label: "Kejelasan",  val: meanJ,  color: "#2f7d79" },
    { label: "Daya Tarik", val: meanDT, color: "#b0d8c8" },
  ];
  const donutTotal = donutParts.reduce((s, d) => s + d.val, 0);

  return (
    <>
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
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="13" height="13" viewBox="0 0 24 24"
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

      <section className="ad-dim-row">
        {[
          { label: "Kemudahan",  sub: "Usability & Navigation", val: meanK,  idx: Number(skorIdx.kemudahan)  },
          { label: "Kejelasan",  sub: "Content & Messaging",    val: meanJ,  idx: Number(skorIdx.kejelasan)  },
          { label: "Daya Tarik", sub: "Visual Aesthetics",      val: meanDT, idx: Number(skorIdx.daya_tarik) },
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

      <section className="ad-chart-row">
        <div className="ad-chart-card">
          <div className="ad-chart-head"><span className="ad-chart-title">Rata-rata Skor UX</span></div>
          <div className="ad-bar-chart">
            <BarGroup label="KEMUDAHAN"  values={[meanK]} />
            <BarGroup label="KEJELASAN"  values={[meanJ]} />
            <BarGroup label="DAYA TARIK" values={[meanDT]} />
          </div>
        </div>
        <div className="ad-chart-card">
          <div className="ad-chart-head"><span className="ad-chart-title">Nilai Tengah Skor UX</span></div>
          <div className="ad-bar-chart">
            <BarGroup label="KEMUDAHAN"  values={[Number(median.kemudahan)  || 0]} />
            <BarGroup label="KEJELASAN"  values={[Number(median.kejelasan)  || 0]} />
            <BarGroup label="DAYA TARIK" values={[Number(median.daya_tarik) || 0]} />
          </div>
        </div>
        <div className="ad-chart-card">
          <div className="ad-chart-head"><span className="ad-chart-title">Standar Deviasi UX</span></div>
          <div className="ad-std-list">
            {[
              { label: "KEMUDAHAN",  val: Number(stddev.kemudahan)  || 0 },
              { label: "KEJELASAN",  val: Number(stddev.kejelasan)  || 0 },
              { label: "DAYA TARIK", val: Number(stddev.daya_tarik) || 0 },
            ].map((s) => (
              <div key={s.label} className="ad-std-item">
                <span className="ad-std-label">{s.label}</span>
                <div className="ad-std-track"><div className="ad-std-fill" style={{ width: `${(s.val / 2) * 100}%` }} /></div>
                <span className="ad-std-val">{s.val.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ad-section">
        <h2 className="ad-section-title">Distribusi &amp; Sebaran</h2>
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

      <section className="ad-section">
        <div className="ad-card ad-card--full">
          <span className="ad-distrib-title">Frekuensi Jawaban Likert (1–5)</span>
          <LikertChart rows={stats.likert || []} />
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-card ad-card--full">
          <span className="ad-distrib-title">Nilai Min &amp; Max Per Dimensi</span>
          <div className="ad-minmax-row-outer">
            <MinMaxBar label="KEMUDAHAN"  min={Number(minK.kemudahan)}  max={Number(maxK.kemudahan)} />
            <MinMaxBar label="KEJELASAN"  min={Number(minK.kejelasan)}  max={Number(maxK.kejelasan)} />
            <MinMaxBar label="DAYA TARIK" min={Number(minK.daya_tarik)} max={Number(maxK.daya_tarik)} />
          </div>
        </div>
      </section>
    </>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState("dashboard");
  const [footerModal, setFooterModal] = useState(null);

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
  }, []);

  return (
    <div className="ad-shell">
      <FooterModal type={footerModal} onClose={() => setFooterModal(null)} />

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
            supabase.auth.signOut();
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
          <p>© 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan</p>
        </div>
        <div className="ad-footer-links">
          <span onClick={() => setFooterModal("privasi")}>Kebijakan Privasi</span>
          <span onClick={() => setFooterModal("syarat")}>Syarat dan Ketentuan</span>
          <span onClick={() => setFooterModal("bantuan")}>Bantuan</span>
        </div>
      </footer>
    </div>
  );
}