import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import "../styles/konselor-dashboard.css";
import EditProfilModal from "./EditProfilModal.jsx";
import { supabase } from "../lib/supabase.js";
import { fetchTeamStats } from "../lib/teamStats.js";
import {
    BOOKING_STATUS,
    isSelesai,
    isAktif,
    isBerjalan,
    isTerjadwal,
    isMenungguEvaluasi,
    statusLabel,
} from "../lib/bookingStatus.js";

function kondisiLabel(val) {
    if (val >= 1.0) return "Pulih";
    if (val >= 0.75) return "Membaik";
    if (val >= 0.5) return "Proses";
    if (val >= 0.25) return "Awal";
    return "Kritis";
}

function kondisiColor(val) {
    if (val >= 1.0) return "#2f7d79";
    if (val >= 0.75) return "#4aab7a";
    if (val >= 0.5) return "#e8a838";
    return "#e05c5c";
}

function Donut({ pct, size = 90, stroke = 10, color = "#79d8d1", label, sublabel }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <div className="kd-donut-wrap" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(47,125,121,0.1)" strokeWidth={stroke} />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={circ * 0.25}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray .8s ease" }}
                />
            </svg>
            <div className="kd-donut-center">
                <span className="kd-donut-val" style={{ color }}>{label}</span>
                {sublabel && <span className="kd-donut-sub">{sublabel}</span>}
            </div>
        </div>
    );
}

function Stars({ rating, max = 5, size = "lg" }) {
    return (
        <div className="kd-stars">
            {Array.from({ length: max }).map((_, i) => (
                <span key={i} className={`kd-star kd-star--${size} ${i < Math.round(rating) ? "kd-star--on" : ""}`}>★</span>
            ))}
        </div>
    );
}

function ProgressBar({ value, max, color = "var(--grad-teal)" }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="kd-bar-track">
            <div className="kd-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

function KlienDetailModal({ klien, onClose, konselor }) {
    if (!klien) return null;

    const progPct = Math.round((klien.Kondisi_Saat_Ini ?? 0) * 100);
    const awalPct = Math.round((klien.Kondisi_Awal ?? 0) * 100);
    const gain = progPct - awalPct;

    return (
        <div className="kd-modal-overlay" onClick={onClose}>
            <div className="kd-modal" onClick={e => e.stopPropagation()}>
                <div className="kd-modal-header">
                    <div className="kd-modal-avatar">
                        {klien.Nama_Mahasiswa?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                    </div>
                    <div className="kd-modal-title-wrap">
                        <h3 className="kd-modal-title">{klien.Nama_Mahasiswa}</h3>
                        <p className="kd-modal-sub">ID: {klien.ID_Mahasiswa}</p>
                    </div>
                    <button className="kd-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="kd-modal-body">
                    <div className="kd-modal-section">
                        <div className="kd-modal-info-row">
                            <span className="kd-modal-info-label">Kategori Masalah</span>
                            <span className="kd-modal-info-value">{klien.Kategori_Masalah}</span>
                        </div>
                        <div className="kd-modal-info-row">
                            <span className="kd-modal-info-label">Sesi ke-</span>
                            <span className="kd-modal-info-value">{klien.Sesi_Konseling}</span>
                        </div>
                        <div className="kd-modal-info-row">
                            <span className="kd-modal-info-label">Status</span>
                            <span className={`kd-modal-status ${isSelesai(klien.Status) ? "kd-modal-status--done" : "kd-modal-status--run"}`}>
                                {statusLabel(klien.Status)}
                            </span>
                        </div>
                    </div>

                    <div className="kd-modal-section">
                        <div className="kd-modal-section-title">Progress Kondisi Klien</div>
                        <div className="kd-modal-progress-wrap">
                            <div className="kd-modal-progress-label">
                                <span>Kondisi Awal</span>
                                <span>Kondisi Saat Ini</span>
                            </div>
                            <div className="kd-modal-progress-track">
                                <div className="kd-modal-progress-awal" style={{ left: `${awalPct}%` }} title={`Awal: ${awalPct}%`} />
                                <div className="kd-modal-progress-fill" style={{ width: `${progPct}%`, background: kondisiColor(klien.Kondisi_Saat_Ini) }} />
                            </div>
                                <div className="kd-modal-progress-numbers">
                                <span className="kd-modal-progress-num">{awalPct}%</span>
                                <span className="kd-modal-progress-arrow">→</span>
                                <span className="kd-modal-progress-num" style={{ color: kondisiColor(klien.Kondisi_Saat_Ini) }}>
                                    {progPct}%
                                </span>
                                <span className={`kd-modal-gain ${gain >= 0 ? "kd-modal-gain--pos" : "kd-modal-gain--neg"}`}>
                                    {gain >= 0 ? "+" : ""}{gain}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="kd-modal-section">
                        <div className="kd-modal-info-row">
                            <span className="kd-modal-info-label">Tingkat Pemulihan</span>
                            <span className="kd-modal-info-value" style={{ color: kondisiColor(klien.Kondisi_Saat_Ini) }}>
                                {kondisiLabel(klien.Kondisi_Saat_Ini)}
                            </span>
                        </div>
                    </div>

                    <div className="kd-modal-section">
                        <div className="kd-modal-section-title">Catatan Perkembangan</div>
                        <p className="kd-modal-note">
                            {klien.Kondisi_Saat_Ini >= 0.75 
                                ? `Klien menunjukkan perkembangan yang sangat baik. ${klien.Nama_Mahasiswa?.split(" ")[0]} sudah mulai bisa mengelola stres dengan lebih baik.`
                                : klien.Kondisi_Saat_Ini >= 0.5
                                ? `Klien dalam proses pemulihan yang baik. Terus berikan dukungan dan motivasi.`
                                : `Masih dalam tahap awal pemulihan. Perlu pendekatan yang lebih intensif.`}
                        </p>
                    </div>
                </div>

                <div className="kd-modal-footer">
                    <button className="kd-modal-btn" onClick={onClose}>Tutup</button>
                </div>
            </div>
        </div>
    );
}

export default function KonselorDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [filterKlien, setFilterKlien] = useState("Semua");
    const [konselor, setKonselor] = useState(null);
    const [myBookings, setMyBookings] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [slots, setSlots] = useState([]);
    const [newSlot, setNewSlot] = useState({ tanggal: "", jam_mulai: "", jam_selesai: "" });
    const [addingSlot, setAddingSlot] = useState(false);
    const [now, setNow] = useState(new Date());
    const [teamStats, setTeamStats] = useState({ ratingTim: 0, kasusTim: 0, probSukses: 0, avgKasusSelesai: 0 });
    const [ulasanList, setUlasanList] = useState([]);
    const [selectedKlien, setSelectedKlien] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchTeamStats().then(setTeamStats);
    }, []);

    const user = (() => {
        try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
        catch { return null; }
    })();

    const kid = user?.konselorId ?? user?.konselor_id ?? null;

    useEffect(() => {
        if (!kid) {
            setLoadingData(false);
            return;
        }
        async function fetchData() {
            setLoadingData(true);
            try {
                const [{ data: kData, error: kErr }, { data: bData, error: bErr }] = await Promise.all([
                    supabase.from("data_konselor").select("*").eq("id", kid).single(),
                    supabase.from("booking").select("*").eq("id_konselor", kid).order("tanggal_sesi", { ascending: false }),
                ]);

                if (kErr) console.error("Fetch konselor error:", kErr.message);
                if (bErr) console.error("Fetch booking error:", bErr.message);

                if (kData) {
                    setKonselor({
                        ID: kData.id,
                        Nama: kData.nama,
                        Kategori_Masalah: kData.kategori_masalah,
                        Pengalaman: kData.pengalaman,
                        "Rating_(Final)": kData.rating_final ?? 0,
                        "Keramahan_(30%)": kData.keramahan ?? 0,
                        "Solusi_(50%)": kData.solusi ?? 0,
                        "Respon_(20%)": kData.respon ?? 0,
                        Jumlah_Kasus: kData.jumlah_kasus ?? 0,
                        Kasus_Selesai: kData.kasus_selesai ?? 0,
                        Success_Rate: kData.success_rate ?? 0,
                        image: kData.image_url,
                        foto: kData.foto_url,
                        bio: kData.bio,
                        spesialisasi: kData.spesialisasi,
                    });
                }

                if (bData) {
                    setMyBookings(bData.map((b) => ({
                        ID_Booking: b.id,
                        ID_Konselor: b.id_konselor,
                        ID_Mahasiswa: b.id_mahasiswa,
                        Nama_Mahasiswa: b.nama_mahasiswa,
                        Kategori_Masalah: b.kategori_masalah,
                        Tanggal_Sesi: b.tanggal_sesi,
                        Sesi_Konseling: b.sesi_konseling,
                        Status: b.status,
                        Kondisi_Awal: b.kondisi_awal,
                        Kondisi_Saat_Ini: b.kondisi_saat_ini,
                    })));
                }

                const { data: ulasanData, error: ulasanErr } = await supabase
                    .from("ulasan_konselor")
                    .select("*")
                    .eq("id_konselor", kid)
                    .order("created_at", { ascending: false });

                console.log("ulasan fetch:", { ulasanData, ulasanErr });
                if (ulasanData) setUlasanList(ulasanData);

            } catch (err) {
                console.error("KonselorDashboard fetchData error:", err);
            } finally {
                setLoadingData(false);
            }

        }
        fetchData();
    }, [kid]);

    useEffect(() => {
        if (!kid) return;
        async function fetchSlots() {
            try {
                const { data, error } = await supabase
                    .from("konselor_availability")
                    .select("*")
                    .eq("konselor_id", kid)
                    .order("tanggal", { ascending: true })
                    .order("jam_mulai", { ascending: true });
                if (error) console.error("Fetch slots error:", error.message);
                setSlots(data || []);
            } catch (err) {
                console.error("fetchSlots error:", err);
            }
        }
        fetchSlots();
    }, [kid]);

    const updateProfil = useCallback(async (fields) => {
        if (!kid) return;
        let fotoUrl = konselor?.foto || konselor?.image || null;

        if (fields.foto && fields.foto.startsWith("data:")) {
            const res = await fetch(fields.foto);
            const blob = await res.blob();
            const ext = blob.type.split("/")[1] || "jpg";
            const fileName = `${kid}_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("konselor-foto")
                .upload(fileName, blob, { contentType: blob.type, upsert: true });
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from("konselor-foto").getPublicUrl(fileName);
                fotoUrl = urlData.publicUrl;
            } else {
                console.error("Upload foto gagal:", uploadError.message);
            }
        } else if (fields.foto === null) {
            fotoUrl = null;
        }

        const { error } = await supabase
            .from("data_konselor")
            .update({ foto_url: fotoUrl, bio: fields.bio, spesialisasi: fields.spesialisasi })
            .eq("id", kid);

        if (!error) {
            setKonselor((prev) => ({ ...prev, foto: fotoUrl, bio: fields.bio, spesialisasi: fields.spesialisasi }));
        } else {
            console.error("Update profil gagal:", error.message);
        }
    }, [kid, konselor]);

    const selesai = myBookings.filter((b) => isSelesai(b.Status)).length;
    const berjalan = myBookings.filter((b) => isAktif(b.Status)).length;
    const total = myBookings.length;
    const successRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    const ratingTim = teamStats.ratingTim;
    const kasusTim = teamStats.kasusTim;
    const probTim = teamStats.probSukses;
    const avgKasusSelesai = teamStats.avgKasusSelesai ?? 0;

    const kategoriMap = useMemo(() => {
        const map = {};
        myBookings.forEach((b) => {
            if (!b.Kategori_Masalah) return;
            map[b.Kategori_Masalah] = (map[b.Kategori_Masalah] ?? 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [myBookings]);

    const filteredBookings = useMemo(() => {
        let result;
        if (filterKlien === "Semua") result = myBookings;
        else if (filterKlien === "Berjalan") result = myBookings.filter((b) => isAktif(b.Status));
        else if (filterKlien === "Selesai") result = myBookings.filter((b) => isSelesai(b.Status));
        else result = myBookings;
        return [...result].sort((a, b) => new Date(b.Tanggal_Sesi) - new Date(a.Tanggal_Sesi));
    }, [myBookings, filterKlien]);

    function handleLogout() {
        localStorage.removeItem("sanctuary_user");
        supabase.auth.signOut().then(() => {
            navigate("/login");
        }).catch(() => {
            navigate("/login");
        });
    }

    async function handleTambahSlot() {
        if (!newSlot.tanggal || !newSlot.jam_mulai || !newSlot.jam_selesai) return;
        setAddingSlot(true);
        const { data, error } = await supabase
            .from("konselor_availability")
            .insert({
                konselor_id: kid,
                tanggal: newSlot.tanggal,
                jam_mulai: newSlot.jam_mulai,
                jam_selesai: newSlot.jam_selesai,
                status: "tersedia",
            })
            .select()
            .single();
        if (!error && data) {
            setSlots((prev) => [...prev, data].sort((a, b) =>
                a.tanggal.localeCompare(b.tanggal) || a.jam_mulai.localeCompare(b.jam_mulai)
            ));
            setNewSlot({ tanggal: "", jam_mulai: "", jam_selesai: "" });
        }
        setAddingSlot(false);
    }

    async function handleHapusSlot(slotId) {
        await supabase.from("konselor_availability").delete().eq("id", slotId);
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
    }

    const initials = (konselor?.Nama ?? "K")
        .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    const navItems = [
        { key: "overview", label: "Overview", icon: "" },
        { key: "klien", label: "Klien Saya", icon: "" },
        { key: "jadwal", label: "Jadwal", icon: "" },
        { key: "performa", label: "Performa", icon: "" },
        { key: "profil", label: "Profil Saya", icon: "" },
    ];

    const keramahan = konselor?.["Keramahan_(30%)"] ?? 0;
    const solusi = konselor?.["Solusi_(50%)"] ?? 0;
    const respon = konselor?.["Respon_(20%)"] ?? 0;
    const ratingFinal = konselor?.["Rating_(Final)"] ?? 0;

    const SPESIALISASI_DEFAULT = [
        { icon: "✓", title: "Manajemen Stres Akademik", desc: "Membantu mahasiswa mengelola tekanan tugas, ujian, dan deadline." },
        { icon: "✓", title: "Kesejahteraan Mental", desc: "Pendampingan untuk menjaga keseimbangan mental." },
        { icon: "✓", title: "Fokus & Produktivitas", desc: "Teknik untuk meningkatkan konsentrasi belajar." },
    ];

    const ratingDist = [5, 4, 3, 2, 1].map((bintang) => ({
        bintang,
        count: ulasanList.filter(u => Math.round(Number(u.rating)) === bintang).length,
    }));

    if (loadingData) {
        return (
            <div className="kd-loading">
                <div className="kd-loading-spinner" />
                <p className="kd-loading-text">Memuat dashboard...</p>
            </div>
        );
    }

    if (!kid) {
        return (
            <div className="kd-loading">
                <p className="kd-loading-text" style={{ textAlign: "center", maxWidth: 360 }}>
                    Akun kamu belum terhubung ke data konselor.<br />
                    Hubungi admin untuk menghubungkan akun ini dengan profil konselor.
                </p>
                <button
                    style={{ marginTop: 20, padding: "10px 24px", background: "#2f7d79", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                    onClick={() => { supabase.auth.signOut(); localStorage.removeItem("sanctuary_user"); navigate("/login"); }}
                >
                    Keluar
                </button>
            </div>
        );
    }

    return (
        <div className="kd-shell">
            {showDetailModal && (
                <KlienDetailModal 
                    klien={selectedKlien} 
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedKlien(null);
                    }} 
                />
            )}

            <main className="kd-main">
                <div className="kd-topbar">
                    <div className="kd-topbar-l">
                        <span className="kd-topbar-logo" onClick={() => navigate("/konselor-dashboard")}>The Sanctuary</span>
                        <div className="kd-topbar-nav">
                            {navItems.map((item) => (
                                <span
                                    key={item.key}
                                    className={activeTab === item.key ? "kd-topbar-active" : ""}
                                    onClick={() => setActiveTab(item.key)}
                                >
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="kd-topbar-r">
                        <div className="kd-avatar" title={konselor?.Nama} onClick={() => setActiveTab("profil")} style={{ cursor: "pointer" }}>
                            {initials}
                        </div>
                        
                        <button className="kd-nav-logout-btn" onClick={handleLogout} title="Keluar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Keluar</span>
                        </button>

                        <button className="kd-topbar-logout" onClick={handleLogout} title="Keluar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="kd-content">

                    {activeTab === "overview" && (
                        <>
                            <div className="kd-greeting">
                                <h2 className="kd-greeting-h2">Halo, {konselor?.Nama?.split(" ")[0]}</h2>
                                <p className="kd-greeting-sub">Berikut ringkasan aktivitas konselingmu hari ini.</p>
                            </div>

                            <div className="kd-hero">
                                <div className="kd-hero-left">
                                    <span className="kd-hero-tag">KONSELOR AKTIF</span>
                                    <h3 className="kd-hero-h3">{konselor?.Nama}</h3>
                                    <p className="kd-hero-p">
                                        Spesialisasi <strong>{konselor?.Kategori_Masalah}</strong> · Pengalaman {konselor?.Pengalaman}
                                    </p>
                                    <Stars rating={ratingFinal} />
                                    <p className="kd-hero-rating-val">{ratingFinal.toFixed(1)} / 5.0</p>
                                </div>
                                <div className="kd-hero-right">
                                    <Donut pct={successRate} size={110} stroke={12} color="#79d8d1" label={`${successRate}%`} sublabel="Success Rate" />
                                </div>
                            </div>

                            <div className="kd-stats-row">
                                {[
                                    { icon: "", val: ratingFinal.toFixed(1), lbl: "Rating Saya" },
                                    { icon: "", val: total, lbl: "Total Kasus" },
                                    { icon: "", val: selesai, lbl: "Kasus Selesai" },
                                    { icon: "", val: berjalan, lbl: "Sedang Berjalan" },
                                ].map((s, i) => (
                                    <div key={i} className="kd-stat-card">
                                        <span className="kd-stat-icon">{s.icon}</span>
                                        <span className="kd-stat-val">{s.val}</span>
                                        <span className="kd-stat-lbl">{s.lbl}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="kd-grid">
                                <div className="kd-card">
                                    <div className="kd-card-hd">
                                        <div>
                                            <div className="kd-card-h3">Sesi Terbaru</div>
                                            <div className="kd-card-sub">{myBookings.length} total sesi</div>
                                        </div>
                                        <button className="kd-card-link" onClick={() => setActiveTab("klien")}>Lihat semua </button>
                                    </div>
                                    <div className="kd-sesi-list">
                                        {myBookings.slice(0, 4).map((b) => (
                                            <div key={b.ID_Booking} className="kd-sesi-item">
                                                <div className="kd-sesi-avatar">
                                                    {b.Nama_Mahasiswa?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                                                </div>
                                                <div className="kd-sesi-info">
                                                    <div className="kd-sesi-name">{b.Nama_Mahasiswa}</div>
                                                    <div className="kd-sesi-kat">{b.Kategori_Masalah} · Sesi ke-{b.Sesi_Konseling}</div>
                                                </div>
                                                <div className="kd-sesi-right">
                                                    <span className={`kd-badge ${isSelesai(b.Status) ? "kd-badge--done" : "kd-badge--run"}`}>{statusLabel(b.Status)}</span>
                                                    <div className="kd-sesi-date">{new Date(b.Tanggal_Sesi).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {myBookings.length === 0 && <p className="kd-empty">Belum ada sesi yang ditangani.</p>}
                                    </div>
                                </div>

                                <div className="kd-card">
                                    <div className="kd-card-hd">
                                        <div>
                                            <div className="kd-card-h3">Indikator Performa</div>
                                            <div className="kd-card-sub">Komponen penilaian rata-rata</div>
                                        </div>
                                    </div>
                                    <div className="kd-performa-list">
                                        {[
                                            { lbl: "Keramahan (30%)", val: keramahan, max: 5 },
                                            { lbl: "Solusi (50%)", val: solusi, max: 5 },
                                            { lbl: "Respon (20%)", val: respon, max: 5 },
                                        ].map((p) => (
                                            <div key={p.lbl} className="kd-perf-row">
                                                <div className="kd-perf-lbl">{p.lbl}</div>
                                                <ProgressBar value={p.val} max={p.max} />
                                                <div className="kd-perf-val">{p.val.toFixed(1)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="kd-divider" />
                                    <div className="kd-card-h3" style={{ marginBottom: 12 }}>Performa Tim</div>
                                    <div className="kd-tim-row">
                                        <div className="kd-tim-item">
                                            <div className="kd-tim-val">{ratingTim.toFixed(1)}</div>
                                            <div className="kd-tim-lbl">Avg Rating Tim</div>
                                        </div>
                                        <div className="kd-tim-item">
                                            <div className="kd-tim-val">{kasusTim}</div>
                                            <div className="kd-tim-lbl">Kasus Selesai Tim</div>
                                        </div>
                                        <div className="kd-tim-item">
                                            <div className="kd-tim-val">{Math.round(probTim * 100)}%</div>
                                            <div className="kd-tim-lbl">Prob. Sukses Tim</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="kd-card kd-card--wide">
                                    <div className="kd-card-hd">
                                        <div>
                                            <div className="kd-card-h3">Distribusi Kategori Klien</div>
                                            <div className="kd-card-sub">Berdasarkan masalah yang ditangani</div>
                                        </div>
                                    </div>
                                    {kategoriMap.length > 0 ? (
                                        <div className="kd-kat-list">
                                            {kategoriMap.map(([kat, count]) => (
                                                <div key={kat} className="kd-kat-row">
                                                    <div className="kd-kat-lbl">{kat}</div>
                                                    <ProgressBar value={count} max={total} />
                                                    <div className="kd-kat-count">{count} klien</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="kd-empty">Belum ada data kategori.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "klien" && (
                        <>
                            <div className="kd-greeting">
                                <h2 className="kd-greeting-h2">Klien Saya</h2>
                                <p className="kd-greeting-sub">{total} klien terdaftar · {berjalan} sedang berjalan</p>
                            </div>

                            <div className="kd-filter-row">
                                {["Semua", "Berjalan", "Selesai"].map((f) => (
                                    <button
                                        key={f}
                                        className={`kd-filter-pill ${filterKlien === f ? "kd-filter-pill--active" : ""}`}
                                        onClick={() => setFilterKlien(f)}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="kd-klien-table">
                                <div className="kd-table-head">
                                    <span>Klien</span>
                                    <span>Kategori</span>
                                    <span>Sesi</span>
                                    <span>Progress</span>
                                    <span>Status</span>
                                    <span>Aksi</span>
                                </div>
                                {filteredBookings.map((b) => {
                                    const progPct = Math.round((b.Kondisi_Saat_Ini ?? 0) * 100);
                                    const awalPct = Math.round((b.Kondisi_Awal ?? 0) * 100);
                                    const gain = progPct - awalPct;

                                    const normalizeTime = (t) => {
                                        if (!t) return "00:00:00";
                                        const parts = t.split(":");
                                        if (parts.length === 2) return `${t}:00`;
                                        return t;
                                    };

                                    const getWIBDateStr = (dateStr) => {
                                        if (!dateStr) return "";
                                        const date = new Date(dateStr);
                                        return date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
                                    };

                                    const getWIBTimeStr = (dateStr) => {
                                        if (!dateStr) return "00:00:00";
                                        const date = new Date(dateStr);
                                        return date.toLocaleTimeString("id-ID", {
                                            timeZone: "Asia/Jakarta",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                            hour12: false
                                        }).replace(/\./g, ":");
                                    };

                                    const isDateOnly = b.Tanggal_Sesi && (b.Tanggal_Sesi.includes("T00:00:00") || !b.Tanggal_Sesi.includes("T"));
                                    const bkDateStr = b.Tanggal_Sesi ? getWIBDateStr(b.Tanggal_Sesi) : "";
                                    const bkTimeStr = b.Tanggal_Sesi ? getWIBTimeStr(b.Tanggal_Sesi) : "00:00:00";
                                    const isBerjalanSesi = isBerjalan(b.Status);
                                    const isMenungguEval = isMenungguEvaluasi(b.Status);

                                    const matchedSlot = slots.find(s =>
                                        s.tanggal === bkDateStr &&
                                        (isDateOnly || normalizeTime(s.jam_mulai) === bkTimeStr)
                                    );

                                    let start = null;
                                    let end = null;

                                    if (matchedSlot) {
                                        start = new Date(`${matchedSlot.tanggal}T${normalizeTime(matchedSlot.jam_mulai)}+07:00`);
                                        end = new Date(`${matchedSlot.tanggal}T${normalizeTime(matchedSlot.jam_selesai)}+07:00`);
                                    } else if (b.Tanggal_Sesi) {
                                        start = new Date(b.Tanggal_Sesi);
                                        end = new Date(start.getTime() + 60 * 60 * 1000);
                                    }

                                    const startBuffer = start;
                                    const isTimeRange = startBuffer && end && now >= startBuffer && now <= end;
                                    const bisaMulai = isTerjadwal(b.Status) && isTimeRange;
                                    const bisaMasuk = isBerjalanSesi && (end ? now <= end : true);

                                    let statusHelperText = null;
                                    if (b.Status !== "Selesai") {
                                        if (isTerjadwal(b.Status) && startBuffer && now < startBuffer) {
                                            const jamStr = start.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
                                            statusHelperText = `Mulai pukul ${jamStr}`;
                                        } else if (end && now > end) {
                                            statusHelperText = "Terlewat";
                                        }
                                    }

                                    return (
                                        <div key={b.ID_Booking} className="kd-table-row">
                                            <div className="kd-table-cell kd-cell-name">
                                                <div className="kd-mini-avatar">
                                                    {b.Nama_Mahasiswa?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="kd-cell-nm">{b.Nama_Mahasiswa}</div>
                                                    <div className="kd-cell-id">{b.ID_Mahasiswa}</div>
                                                </div>
                                            </div>
                                            <div className="kd-table-cell">
                                                <span className="kd-kat-chip">{b.Kategori_Masalah}</span>
                                            </div>
                                            <div className="kd-table-cell kd-cell-center">
                                                <span className="kd-sesi-num">#{b.Sesi_Konseling}</span>
                                            </div>
                                            <div className="kd-table-cell kd-cell-progress">
                                                <div className="kd-prog-bar-sm">
                                                    <div className="kd-prog-fill-sm" style={{ width: `${progPct}%`, background: kondisiColor(b.Kondisi_Saat_Ini) }} />
                                                </div>
                                                <div className="kd-prog-detail">
                                                    <span style={{ color: kondisiColor(b.Kondisi_Saat_Ini) }}>{kondisiLabel(b.Kondisi_Saat_Ini)}</span>
                                                    <span className={`kd-gain ${gain >= 0 ? "kd-gain--pos" : "kd-gain--neg"}`}>{gain >= 0 ? "+" : ""}{gain}%</span>
                                                </div>
                                            </div>
                                            <div className="kd-table-cell">
                                                <span className={`kd-badge ${isSelesai(b.Status) ? "kd-badge--done" : "kd-badge--run"}`}>{statusLabel(b.Status)}</span>
                                            </div>
                                            <div className="kd-table-cell" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                {bisaMulai || bisaMasuk ? (
                                                    <button
                                                        className="kd-btn-mulai-sesi"
                                                        onClick={async () => {
                                                            await supabase
                                                                .from("booking")
                                                                .update({ status: BOOKING_STATUS.BERJALAN })
                                                                .eq("id", b.ID_Booking);
                                                            navigate(`/sesi/${b.ID_Booking}`);
                                                        }}
                                                    >
                                                        {bisaMasuk ? "Masuk Sesi →" : "Mulai Sesi →"}
                                                    </button>
                                                ) : isMenungguEval ? (
                                                    <button 
                                                        className="kd-btn-evaluasi"
                                                        onClick={() => navigate(`/evaluasi-sesi/${b.ID_Booking}`)}
                                                    >
                                                        Isi Evaluasi →
                                                    </button>
                                                ) : statusHelperText ? (
                                                    <span className="kd-status-helper" style={{ fontSize: "0.75rem", color: "#666", fontWeight: "500" }}>
                                                        {statusHelperText}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="kd-cell-dash">—</span>
                                                        <button 
                                                            className="kd-btn-detail"
                                                            onClick={() => {
                                                                setSelectedKlien(b);
                                                                setShowDetailModal(true);
                                                            }}
                                                        >
                                                            Lihat Detail 
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredBookings.length === 0 && (
                                    <p className="kd-empty" style={{ padding: "32px 0" }}>
                                        {filterKlien === "Semua" ? "Belum ada klien yang ditangani." : `Tidak ada klien dengan status "${filterKlien}".`}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "jadwal" && (
                        <>
                            <div className="kd-greeting">
                                <h2 className="kd-greeting-h2">Jadwal Saya</h2>
                                <p className="kd-greeting-sub">Atur slot waktu yang tersedia untuk mahasiswa booking.</p>
                            </div>

                            <div className="kd-card" style={{ marginBottom: 20 }}>
                                <div className="kd-card-h3" style={{ marginBottom: 16 }}>Tambah Slot Baru</div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tanggal</label>
                                        <input
                                            type="date"
                                            value={newSlot.tanggal}
                                            min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })}
                                            onChange={(e) => setNewSlot((p) => ({ ...p, tanggal: e.target.value }))}
                                            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid var(--gray-lt)", fontSize: 13, fontFamily: "inherit", background: "#fafafa" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jam Mulai</label>
                                        <input
                                            type="time"
                                            value={newSlot.jam_mulai}
                                            onChange={(e) => setNewSlot((p) => ({ ...p, jam_mulai: e.target.value }))}
                                            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid var(--gray-lt)", fontSize: 13, fontFamily: "inherit", background: "#fafafa" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jam Selesai</label>
                                        <input
                                            type="time"
                                            value={newSlot.jam_selesai}
                                            onChange={(e) => setNewSlot((p) => ({ ...p, jam_selesai: e.target.value }))}
                                            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid var(--gray-lt)", fontSize: 13, fontFamily: "inherit", background: "#fafafa" }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleTambahSlot}
                                        disabled={addingSlot || !newSlot.tanggal || !newSlot.jam_mulai || !newSlot.jam_selesai}
                                        style={{
                                            padding: "9px 20px",
                                            background: "linear-gradient(135deg, #2f7d79, #79d8d1)",
                                            color: "white", border: "none", borderRadius: 10,
                                            fontSize: 13, fontWeight: 700, cursor: "pointer",
                                            fontFamily: "inherit", opacity: addingSlot ? 0.7 : 1,
                                            transition: "opacity 0.2s",
                                        }}
                                    >
                                        {addingSlot ? "Menyimpan..." : "+ Tambah Slot"}
                                    </button>
                                </div>
                            </div>

                            <div className="kd-card">
                                <div className="kd-card-hd">
                                    <div>
                                        <div className="kd-card-h3">Slot Tersedia</div>
                                        <div className="kd-card-sub">{slots.filter(s => s.status === "tersedia").length} slot aktif · {slots.filter(s => s.status === "booked").length} sudah dibooking</div>
                                    </div>
                                </div>
                                {slots.length === 0 ? (
                                    <p className="kd-empty">Belum ada slot. Tambah slot di atas agar mahasiswa bisa booking.</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {Object.entries(
                                            slots.reduce((acc, s) => {
                                                if (!acc[s.tanggal]) acc[s.tanggal] = [];
                                                acc[s.tanggal].push(s);
                                                return acc;
                                            }, {})
                                        ).map(([tanggal, slotList]) => (
                                            <div key={tanggal}>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--teal)", marginBottom: 8, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    {new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                                </div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                                    {slotList.map((s) => (
                                                        <div key={s.id} style={{
                                                            display: "flex", alignItems: "center", gap: 10,
                                                            padding: "8px 14px",
                                                            background: s.status === "booked" ? "rgba(232,168,56,0.10)" : "rgba(47,125,121,0.07)",
                                                            border: `1.5px solid ${s.status === "booked" ? "rgba(232,168,56,0.3)" : "rgba(47,125,121,0.18)"}`,
                                                            borderRadius: 999, fontSize: 13, fontWeight: 600,
                                                        }}>
                                                            <span style={{ color: s.status === "booked" ? "#a06030" : "var(--teal)" }}>
                                                                {s.jam_mulai.slice(0, 5)} – {s.jam_selesai.slice(0, 5)}
                                                            </span>
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                                                                borderRadius: 999,
                                                                background: s.status === "booked" ? "rgba(232,168,56,0.2)" : "rgba(47,125,121,0.12)",
                                                                color: s.status === "booked" ? "#a06030" : "var(--teal)",
                                                            }}>
                                                                {s.status === "booked" ? "Dipesan" : "Tersedia"}
                                                            </span>
                                                            {s.status === "tersedia" && (
                                                                <button
                                                                    onClick={() => handleHapusSlot(s.id)}
                                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#e05c5c", fontSize: 14, padding: "0 2px", lineHeight: 1, fontWeight: 700 }}
                                                                    title="Hapus slot"
                                                                >✕</button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "performa" && (
                        <>
                            <div className="kd-greeting">
                                <h2 className="kd-greeting-h2">Analisis Performa</h2>
                                <p className="kd-greeting-sub">Detail metrik dan komparasi performa konselor.</p>
                            </div>
                            <div className="kd-perf-grid">
                                <div className="kd-card kd-card--center">
                                    <div className="kd-card-h3" style={{ marginBottom: 20, textAlign: "center" }}>Rating Final</div>
                                    <Donut pct={Math.round((ratingFinal / 5) * 100)} size={130} stroke={14} color="#2f7d79" label={ratingFinal.toFixed(1)} sublabel="/ 5.0" />
                                    <Stars rating={ratingFinal} />
                                    <p className="kd-card-sub" style={{ marginTop: 8, textAlign: "center" }}>Berdasarkan keramahan, solusi & respon</p>
                                </div>
                                <div className="kd-card">
                                    <div className="kd-card-h3" style={{ marginBottom: 16 }}>Breakdown Rating</div>
                                    {[
                                        { lbl: "Keramahan", bobot: "30%", val: keramahan, color: "#2f7d79" },
                                        { lbl: "Solusi", bobot: "50%", val: solusi, color: "#79d8d1" },
                                        { lbl: "Respon", bobot: "20%", val: respon, color: "#1a5e5a" },
                                    ].map((p) => (
                                        <div key={p.lbl} className="kd-perf-breakdown">
                                            <div className="kd-perf-bd-head">
                                                <span className="kd-perf-bd-lbl">{p.lbl}</span>
                                                <span className="kd-perf-bd-bobot">Bobot {p.bobot}</span>
                                                <span className="kd-perf-bd-val" style={{ color: p.color }}>{p.val.toFixed(1)}/5</span>
                                            </div>
                                            <div className="kd-bar-track">
                                                <div className="kd-bar-fill" style={{ width: `${(p.val / 5) * 100}%`, background: p.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="kd-card">
                                    <div className="kd-card-hd">
                                        <div>
                                            <div className="kd-card-h3">Progress Klien Aktif</div>
                                            <div className="kd-card-sub">Kondisi saat ini vs kondisi awal</div>
                                        </div>
                                    </div>
                                    <div className="kd-progress-list">
                                        {myBookings.filter((b) => isAktif(b.Status)).map((b) => {
                                            const nowPct = Math.round((b.Kondisi_Saat_Ini ?? 0) * 100);
                                            const awal = Math.round((b.Kondisi_Awal ?? 0) * 100);
                                            return (
                                                <div key={b.ID_Booking} className="kd-prog-item">
                                                    <div className="kd-prog-head">
                                                        <span className="kd-prog-name">{b.Nama_Mahasiswa?.split(" ")[0]}</span>
                                                        <span className="kd-prog-pct" style={{ color: kondisiColor(b.Kondisi_Saat_Ini) }}>{nowPct}%</span>
                                                    </div>
                                                    <div className="kd-prog-track">
                                                        <div className="kd-prog-awal" style={{ left: `${awal}%` }} title={`Awal: ${awal}%`} />
                                                        <div className="kd-prog-fill" style={{ width: `${nowPct}%`, background: kondisiColor(b.Kondisi_Saat_Ini) }} />
                                                    </div>
                                                    <div className="kd-prog-foot">
                                                        <span>Awal: {awal}%</span>
                                                        <span>{kondisiLabel(b.Kondisi_Saat_Ini)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {myBookings.filter((b) => isAktif(b.Status)).length === 0 && <p className="kd-empty">Tidak ada klien aktif.</p>}
                                    </div>
                                </div>
                                <div className="kd-card">
                                    <div className="kd-card-h3" style={{ marginBottom: 16 }}>Komparasi vs Tim</div>
                                    {[
                                        { lbl: "Rating", saya: ratingFinal, tim: ratingTim, max: 5, fmt: (v) => v.toFixed(1) },
                                        { lbl: "Success Rate", saya: successRate / 100, tim: probTim, max: 1, fmt: (v) => `${Math.round(v * 100)}%` },
                                        { lbl: "Kasus Selesai", saya: selesai, tim: avgKasusSelesai, max: Math.max(selesai, avgKasusSelesai, 1), fmt: (v) => Math.round(v) },
                                    ].map((c) => (
                                        <div key={c.lbl} className="kd-compare-row">
                                            <div className="kd-compare-lbl">{c.lbl}</div>
                                            <div className="kd-compare-bars">
                                                <div className="kd-compare-bar-wrap">
                                                    <div className="kd-compare-bar-label">Saya</div>
                                                    <div className="kd-bar-track">
                                                        <div className="kd-bar-fill" style={{ width: `${(c.saya / c.max) * 100}%`, background: "var(--grad-teal)" }} />
                                                    </div>
                                                    <div className="kd-compare-val">{c.fmt(c.saya)}</div>
                                                </div>
                                                <div className="kd-compare-bar-wrap">
                                                    <div className="kd-compare-bar-label kd-compare-bar-label--tim">Tim</div>
                                                    <div className="kd-bar-track">
                                                        <div className="kd-bar-fill kd-bar-fill--tim" style={{ width: `${(c.tim / c.max) * 100}%` }} />
                                                    </div>
                                                    <div className="kd-compare-val kd-compare-val--tim">{c.fmt(c.tim)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "profil" && (
                        <>
                            <div className="kd-greeting">
                                <div className="kd-greeting-header">
                                    <div>
                                        <h2 className="kd-greeting-h2">Profil Saya</h2>
                                        <p className="kd-greeting-sub kd-greeting-sub--limited">
                                            Tampilan profil publikmu seperti yang dilihat oleh mahasiswa.
                                        </p>
                                    </div>
                                    <button className="kd-edit-btn" onClick={() => setShowEditModal(true)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                                            <path d="M4 20h16" />
                                        </svg>
                                        Edit Profil
                                    </button>
                                </div>
                            </div>

                            {showEditModal && (
                                <EditProfilModal
                                    profil={konselor}
                                    onSave={updateProfil}
                                    onClose={() => setShowEditModal(false)}
                                />
                            )}

                            <div className="kd-profil-hero">
                                <div className="kd-profil-hero-left">
                                    {(konselor?.foto || konselor?.image) ? (
                                        <img src={konselor.foto || konselor.image} alt={konselor?.Nama} className="kd-profil-photo" />
                                    ) : (
                                        <div className="kd-profil-photo kd-profil-photo--placeholder">{initials}</div>
                                    )}
                                    <div className="kd-profil-available">
                                        <span className="kd-available-dot" />
                                        Tersedia untuk sesi
                                    </div>
                                </div>
                                <div className="kd-profil-hero-info">
                                    <span className="kd-profil-kategori-badge">{konselor?.Kategori_Masalah}</span>
                                    <h2 className="kd-profil-nama">{konselor?.Nama}</h2>
                                    <p className="kd-profil-bio">
                                        {konselor?.bio || `${konselor?.Nama?.split(" ")[0]} adalah konselor sebaya yang berfokus pada pendampingan mahasiswa.`}
                                    </p>
                                    <div className="kd-profil-stat-row">
                                        <div className="kd-profil-stat-item">
                                            <span className="kd-profil-stat-val" style={{ color: "var(--teal)" }}>{ratingFinal.toFixed(1)}</span>
                                            <span className="kd-profil-stat-lbl">Rating</span>
                                        </div>
                                        <div className="kd-profil-stat-divider" />
                                        <div className="kd-profil-stat-item">
                                            <span className="kd-profil-stat-val">{total}</span>
                                            <span className="kd-profil-stat-lbl">Total Kasus</span>
                                        </div>
                                        <div className="kd-profil-stat-divider" />
                                        <div className="kd-profil-stat-item">
                                            <span className="kd-profil-stat-val">{selesai}</span>
                                            <span className="kd-profil-stat-lbl">Kasus Selesai</span>
                                        </div>
                                        <div className="kd-profil-stat-divider" />
                                        <div className="kd-profil-stat-item">
                                            <span className="kd-profil-stat-val">{successRate}%</span>
                                            <span className="kd-profil-stat-lbl">Success Rate</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="kd-profil-grid">
                                <div className="kd-card kd-profil-about">
                                    <div className="kd-card-h3" style={{ marginBottom: 16 }}>Tentang Saya</div>
                                    <p className="kd-profil-about-text">
                                        {konselor?.bio || `${konselor?.Nama?.split(" ")[0]} adalah konselor sebaya yang berfokus pada pendampingan mahasiswa dalam menghadapi tekanan akademik. Dengan pengalaman ${konselor?.Pengalaman ?? "2 tahun"}, ia telah mendampingi puluhan mahasiswa menemukan strategi belajar yang lebih sehat dan efektif.`}
                                    </p>
                                    {!konselor?.bio && (
                                        <p className="kd-profil-about-text" style={{ marginTop: 12 }}>
                                            Melalui pendekatan yang hangat dan empatik, {konselor?.Nama?.split(" ")[0]} percaya bahwa setiap mahasiswa memiliki potensi untuk bangkit dari tekanan akademik dan meraih keseimbangan antara prestasi dan kebahagiaan.
                                        </p>
                                    )}
                                    <div style={{ marginTop: 24 }}>
                                        {[
                                            { lbl: "Keramahan", val: keramahan },
                                            { lbl: "Kualitas Solusi", val: solusi },
                                            { lbl: "Kecepatan Respon", val: respon },
                                        ].map((p) => (
                                            <div key={p.lbl} className="kd-profil-rating-row">
                                                <span className="kd-profil-rating-lbl">{p.lbl}</span>
                                                <div className="kd-bar-track" style={{ flex: 1 }}>
                                                    <div className="kd-bar-fill" style={{ width: `${(p.val / 5) * 100}%` }} />
                                                </div>
                                                <span className="kd-profil-rating-val">{p.val.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="kd-card">
                                    <div className="kd-card-h3" style={{ marginBottom: 16 }}>Spesialisasi Keahlian</div>
                                    <div className="kd-spesialis-list">
                                        {(konselor?.spesialisasi ?? SPESIALISASI_DEFAULT).map((s, idx) => (
                                            <div key={idx} className="kd-spesialis-item">
                                                <div className="kd-spesialis-icon">{s.icon || "✓"}</div>
                                                <div>
                                                    <div className="kd-spesialis-title">{s.title}</div>
                                                    <div className="kd-spesialis-desc">{s.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="kd-card kd-card--wide">
                                    <div className="kd-card-h3" style={{ marginBottom: 20 }}>Testimoni Klien</div>
                                    <div className="kd-testimoni-wrap">
                                        <div className="kd-testimoni-summary">
                                            <div className="kd-testi-big-rating">
                                                <span className="kd-testi-big-num">{ratingFinal.toFixed(1)}</span>
                                                <Stars rating={ratingFinal} size="sm" />
                                            </div>
                                            <div className="kd-testi-dist">
                                                {ratingDist.map((r) => (
                                                    <div key={r.bintang} className="kd-testi-dist-row">
                                                        <span className="kd-testi-dist-bintang">{r.bintang} ★</span>
                                                        <div className="kd-bar-track" style={{ flex: 1, height: 6 }}>
                                                            <div className="kd-bar-fill" style={{
                                                                width: `${ulasanList.length > 0 ? (r.count / ulasanList.length) * 100 : 0}%`,
                                                                background: "#f5c842"
                                                            }} />
                                                        </div>
                                                        <span className="kd-testi-dist-count">{r.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="kd-testi-kat-wrap">
                                                <div className="kd-testi-kat-label">KATEGORI MASALAH DITANGANI</div>
                                                <div className="kd-testi-kat-pills">
                                                    {kategoriMap.slice(0, 4).map(([kat]) => (
                                                        <span key={kat} className="kd-testi-kat-pill">{kat}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="kd-testi-cards">
                                            {ulasanList.length === 0 ? (
                                                <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                                                    Belum ada testimoni. Fitur ini akan aktif setelah mahasiswa dapat memberikan ulasan sesi.
                                                </p>
                                            ) : (
                                                ulasanList.map((u, i) => (
                                                    <div key={u.id ?? i} className="kd-testi-card">
                                                        <div className="kd-stars" style={{ marginBottom: 8 }}>
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <span key={n} className={`kd-star kd-star--sm ${n <= Math.round(Number(u.rating)) ? "kd-star--on" : ""}`}>★</span>
                                                            ))}
                                                        </div>
                                                        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 12 }}>
                                                            "{u.teks}"
                                                        </p>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div className="kd-mini-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                                                                {(u.nama_mahasiswa ?? "M").charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>
                                                                    {u.nama_mahasiswa ?? "Mahasiswa"}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: "#999" }}>
                                                                    {u.created_at
                                                                        ? new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                                                                        : "—"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                <footer className="kd-footer">
                    <div>
                        <span className="kd-footer-brand">The Sanctuary</span>
                        <span className="kd-footer-copy">© 2026</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}