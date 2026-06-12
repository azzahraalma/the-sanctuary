import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
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

export default function RiwayatSesiAdmin() {
  const navigate = useNavigate();
  const [sesi, setSesi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKonselor, setFilterKonselor] = useState("Semua");
  const [sortBy, setSortBy] = useState("tanggal_desc");

  const [selectedSesi, setSelectedSesi] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [konselorList, setKonselorList] = useState([]);

  useEffect(() => {
    fetchAllSesi();
  }, []);

  async function fetchAllSesi() {
    setLoading(true);
    setError(null);
    try {
      const { data: bookings, error: bookErr } = await supabase
        .from("booking")
        .select("*")
        .order("tanggal_sesi", { ascending: false });

      if (bookErr) throw bookErr;

      const { data: profil, error: profilErr } = await supabase
        .from("profil_pengguna")
        .select("nama, konselor_id")
        .not("konselor_id", "is", null);

      if (profilErr) throw profilErr;

      const konselorMap = {};
      profil.forEach((p) => {
        if (p.konselor_id) konselorMap[p.konselor_id] = p.nama;
      });

      const merged = (bookings || []).map((b) => ({
        ...b,
        nama_konselor: konselorMap[b.id_konselor] || b.id_konselor || "—",
      }));

      setSesi(merged);

      const uniqueKonselor = [
        "Semua",
        ...new Set(merged.map((s) => s.nama_konselor)),
      ];
      setKonselorList(uniqueKonselor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = [...sesi];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.nama_mahasiswa?.toLowerCase().includes(q) ||
          s.nama_konselor?.toLowerCase().includes(q) ||
          s.kategori_masalah?.toLowerCase().includes(q) ||
          s.id_mahasiswa?.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "Semua") {
      const want = filterStatusValue(filterStatus);
      result = result.filter((s) => s.status?.toLowerCase() === want);
    }

    if (filterKonselor !== "Semua") {
      result = result.filter((s) => s.nama_konselor === filterKonselor);
    }

    switch (sortBy) {
      case "tanggal_asc":
        result.sort((a, b) => new Date(a.tanggal_sesi) - new Date(b.tanggal_sesi));
        break;
      case "tanggal_desc":
        result.sort((a, b) => new Date(b.tanggal_sesi) - new Date(a.tanggal_sesi));
        break;
      case "sesi_asc":
        result.sort((a, b) => (a.sesi_konseling || 0) - (b.sesi_konseling || 0));
        break;
      case "nama_az":
        result.sort((a, b) =>
          (a.nama_mahasiswa || "").localeCompare(b.nama_mahasiswa || "")
        );
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, filterStatus, filterKonselor, sortBy, sesi]);

  function openModal(item) {
    setSelectedSesi(item);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setTimeout(() => setSelectedSesi(null), 300);
  }

  function getStatusClass(status) {
    if (!status) return "status-badge status-unknown";
    const s = status.toLowerCase();
    if (s === "selesai") return "status-badge status-selesai";
    if (s === "terjadwal") return "status-badge status-terjadwal";
    if (s === "berjalan") return "status-badge status-terjadwal";
    if (s === "menunggu_evaluasi") return "status-badge status-terjadwal";
    if (s === "dibatalkan") return "status-badge status-dibatalkan";
    return "status-badge status-unknown";
  }

  function formatTanggal(tanggal) {
    if (!tanggal) return "—";
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getProgressBar(value, max = 1) {
    const pct = Math.min(Math.round((value / max) * 100), 100);
    return (
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
        <span className="progress-label">{value?.toFixed(2) ?? "—"}</span>
      </div>
    );
  }

  const totalSesi = sesi.length;
  const totalSelesai = sesi.filter(
    (s) => s.status?.toLowerCase() === "selesai"
  ).length;
  const totalTerjadwal = sesi.filter(
    (s) => s.status?.toLowerCase() === "terjadwal"
  ).length;
  const totalDibatalkan = sesi.filter(
    (s) => s.status?.toLowerCase() === "dibatalkan"
  ).length;

  return (
    <div className="rsa-page">
      <div className="rsa-header">
        <button className="rsa-back-btn" onClick={() => navigate("/admin-dashboard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Kembali
        </button>
        <div className="rsa-header-left">
          <span className="rsa-eyebrow">Admin Panel</span>
          <h1 className="rsa-title">Riwayat Sesi</h1>
          <p className="rsa-subtitle">
            Seluruh rekam jejak sesi konseling di The Sanctuary
          </p>
        </div>
        <button className="rsa-refresh-btn" onClick={fetchAllSesi}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="rsa-summary">
        <div className="rsa-stat-card">
          <span className="rsa-stat-value">{totalSesi}</span>
          <span className="rsa-stat-label">Total Sesi</span>
        </div>
        <div className="rsa-stat-card rsa-stat-selesai">
          <span className="rsa-stat-value">{totalSelesai}</span>
          <span className="rsa-stat-label">Selesai</span>
        </div>
        <div className="rsa-stat-card rsa-stat-terjadwal">
          <span className="rsa-stat-value">{totalTerjadwal}</span>
          <span className="rsa-stat-label">Terjadwal</span>
        </div>
        <div className="rsa-stat-card rsa-stat-dibatalkan">
          <span className="rsa-stat-value">{totalDibatalkan}</span>
          <span className="rsa-stat-label">Dibatalkan</span>
        </div>
      </div>

      <div className="rsa-filter-bar">
        <div className="rsa-search-wrap">
          <svg className="rsa-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="rsa-search"
            type="text"
            placeholder="Cari mahasiswa, konselor, kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="rsa-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="rsa-select"
          value={filterKonselor}
          onChange={(e) => setFilterKonselor(e.target.value)}
        >
          {konselorList.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <select
          className="rsa-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="tanggal_desc">Terbaru</option>
          <option value="tanggal_asc">Terlama</option>
          <option value="sesi_asc">Sesi ↑</option>
          <option value="nama_az">Nama A–Z</option>
        </select>

        <span className="rsa-count">{filtered.length} sesi</span>
      </div>

      {loading ? (
        <div className="rsa-loading">
          <div className="rsa-spinner" />
          <span>Memuat data sesi...</span>
        </div>
      ) : error ? (
        <div className="rsa-error">
          <span>Gagal memuat data: {error}</span>
          <button onClick={fetchAllSesi}>Coba lagi</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rsa-empty">
          <span>Tidak ada sesi yang sesuai filter</span>
        </div>
      ) : (
        <div className="rsa-table-wrap">
          <table className="rsa-table">
            <thead>
              <tr>
                <th>Mahasiswa</th>
                <th>Konselor</th>
                <th>Kategori Masalah</th>
                <th>Tanggal Sesi</th>
                <th>Sesi ke-</th>
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
                      <div className="rsa-avatar">
                        {(item.nama_mahasiswa || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="rsa-name">{item.nama_mahasiswa || "—"}</div>
                        <div className="rsa-id">{item.id_mahasiswa}</div>
                      </div>
                    </div>
                  </td>
                  <td className="rsa-td-konselor">{item.nama_konselor}</td>
                  <td>
                    <span className="rsa-kategori">{item.kategori_masalah || "—"}</span>
                  </td>
                  <td className="rsa-td-date">{formatTanggal(item.tanggal_sesi)}</td>
                  <td className="rsa-td-center">
                    <span className="rsa-sesi-badge">{item.sesi_konseling ?? "—"}</span>
                  </td>
                  <td>
                    <span className={getStatusClass(item.status)}>
                      {item.status || "—"}
                    </span>
                  </td>
                  <td>{item.kondisi_awal ?? "—"}</td>
                  <td>{item.kondisi_saat_ini ?? "—"}</td>
                  <td>
                    <button className="rsa-detail-btn" onClick={(e) => { e.stopPropagation(); openModal(item); }}>
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail */}
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="rsa-modal-body">
              <div className="rsa-modal-grid">
                <div className="rsa-modal-field">
                  <label>Konselor</label>
                  <span>{selectedSesi.nama_konselor}</span>
                </div>
                <div className="rsa-modal-field">
                  <label>Tanggal Sesi</label>
                  <span>{formatTanggal(selectedSesi.tanggal_sesi)}</span>
                </div>
                <div className="rsa-modal-field">
                  <label>Sesi ke-</label>
                  <span>{selectedSesi.sesi_konseling ?? "—"}</span>
                </div>
                <div className="rsa-modal-field">
                  <label>Status</label>
                  <span className={getStatusClass(selectedSesi.status)}>
                    {selectedSesi.status || "—"}
                  </span>
                </div>
                <div className="rsa-modal-field rsa-modal-full">
                  <label>Kategori Masalah</label>
                  <span>{selectedSesi.kategori_masalah || "—"}</span>
                </div>
              </div>

              <div className="rsa-modal-section">
                <h3>Perkembangan Kondisi</h3>
                <div className="rsa-kondisi-row">
                  <div className="rsa-kondisi-item">
                    <label>Kondisi Awal</label>
                    {getProgressBar(selectedSesi.kondisi_awal)}
                  </div>
                  <div className="rsa-kondisi-arrow">→</div>
                  <div className="rsa-kondisi-item">
                    <label>Kondisi Saat Ini</label>
                    {getProgressBar(selectedSesi.kondisi_saat_ini)}
                  </div>
                </div>

                {selectedSesi.kondisi_awal != null && selectedSesi.kondisi_saat_ini != null && (
                  <div className={`rsa-delta ${selectedSesi.kondisi_saat_ini >= selectedSesi.kondisi_awal ? "delta-up" : "delta-down"}`}>
                    {selectedSesi.kondisi_saat_ini >= selectedSesi.kondisi_awal ? "▲" : "▼"}
                    {" "}
                    {Math.abs(selectedSesi.kondisi_saat_ini - selectedSesi.kondisi_awal).toFixed(2)} poin
                    {selectedSesi.kondisi_saat_ini >= selectedSesi.kondisi_awal ? " (membaik)" : " (menurun)"}
                  </div>
                )}
              </div>

              <div className="rsa-modal-section">
                <h3>Info Sistem</h3>
                <div className="rsa-modal-grid">
                  <div className="rsa-modal-field">
                    <label>ID Booking</label>
                    <span className="rsa-mono">{selectedSesi.id}</span>
                  </div>
                  <div className="rsa-modal-field">
                    <label>Dibuat pada</label>
                    <span>{formatTanggal(selectedSesi.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}