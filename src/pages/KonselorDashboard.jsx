import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import analisis_konselor from "../data/analisis_konselor";
import "../styles/konselor-dashboard.css";
import EditProfilModal from "./EditProfilModal";
import { supabase } from "../lib/supabase";


// ── Email → ID Konselor mapping ──────────────────────────────────
function getKID(user) {
    if (!user) return null;
    return user.konselorId ?? null;
}

// ── Kondisi label ────────────────────────────────────────────────
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

// ── Donut SVG ────────────────────────────────────────────────────
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

// ── Star Rating ──────────────────────────────────────────────────
function Stars({ rating, max = 5, size = "lg" }) {
    return (
        <div className="kd-stars">
            {Array.from({ length: max }).map((_, i) => (
                <span key={i} className={`kd-star kd-star--${size} ${i < Math.round(rating) ? "kd-star--on" : ""}`}>★</span>
            ))}
        </div>
    );
}

// ── Progress Bar ─────────────────────────────────────────────────
function ProgressBar({ value, max, color = "var(--grad-teal)" }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="kd-bar-track">
            <div className="kd-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

// ── Spesialisasi data (statis, sesuai referensi gambar) ──────────
const SPESIALISASI = [
    {
        icon: "📊",
        title: "Manajemen Stres Akademik",
        desc: "Membantu mahasiswa mengelola tekanan tugas, ujian, dan deadline dengan strategi yang efektif dan berkelanjutan.",
    },
    {
        icon: "🧠",
        title: "Kesejahteraan Mental",
        desc: "Pendampingan untuk menjaga keseimbangan mental di tengah tuntutan perkuliahan yang tinggi.",
    },
    {
        icon: "🎯",
        title: "Fokus & Produktivitas",
        desc: "Teknik dan strategi untuk meningkatkan konsentrasi belajar dan produktivitas akademik sehari-hari.",
    },
];

// ── Testimoni data (statis dummy) ────────────────────────────────
const TESTIMONI = [
    {
        nama: "Rizki Pratama",
        sub: "Mahasiswa Semester 6",
        rating: 5,
        teks: "Konselor sangat sabar dan penuh empati. Beliau membantu saya menemukan cara belajar yang lebih efektif saat menghadapi tekanan skripsi. Sangat recommended!",
    },
    {
        nama: "Sari Dewi",
        sub: "Mahasiswa Semester 4",
        rating: 5,
        teks: "Sesi bersama konselor benar-benar mengubah cara pandang saya terhadap stres akademik. Sekarang saya lebih tenang menghadapi ujian.",
    },
];

// ── Main Component ───────────────────────────────────────────────
export default function KonselorDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");

    // ── State data dari Supabase ──────────────────────────────
    const [konselor, setKonselor] = useState(null);
    const [myBookings, setMyBookings] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const user = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
        catch { return null; }
    }, []);

    const kid = user?.konselorId ?? null;

    // ── Fetch konselor & booking dari Supabase ────────────────
    useEffect(() => {
        if (!kid) return;
        async function fetchData() {
            setLoadingData(true);

            const [{ data: kData }, { data: bData }] = await Promise.all([
                supabase.from("konselor").select("*").eq("id", kid).single(),
                supabase.from("booking").select("*").eq("id_konselor", kid),
            ]);

            if (kData) {
                // Normalize field names agar JSX tidak perlu diubah banyak
                setKonselor({
                    ID: kData.id,
                    Nama: kData.nama,
                    Kategori_Masalah: kData.kategori_masalah,
                    Pengalaman: kData.pengalaman,
                    "Rating_(Final)": kData.rating_final,
                    "Keramahan_(30%)": kData.keramahan,
                    "Solusi_(50%)": kData.solusi,
                    "Respon_(20%)": kData.respon,
                    Jumlah_Kasus: kData.jumlah_kasus,
                    Kasus_Selesai: kData.kasus_selesai,
                    Success_Rate: kData.success_rate,
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

            setLoadingData(false);
        }
        fetchData();
    }, [kid]);

    // ── Hook update profil ke Supabase ────────────────────────
    const updateProfil = useCallback(async (fields) => {
    if (!kid) return;

    let fotoUrl = konselor?.foto || konselor?.image || null;

    // Kalau foto adalah base64 (file baru dipilih), upload ke Storage dulu
    if (fields.foto && fields.foto.startsWith("data:")) {
        // Convert base64 ke File object
        const res = await fetch(fields.foto);
        const blob = await res.blob();
        const ext = blob.type.split("/")[1] || "jpg";
        const fileName = `${kid}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("konselor-foto")
            .upload(fileName, blob, {
                contentType: blob.type,
                upsert: true,
            });

        if (!uploadError) {
            const { data: urlData } = supabase.storage
                .from("konselor-foto")
                .getPublicUrl(fileName);
            fotoUrl = urlData.publicUrl;
        } else {
            console.error("Upload foto gagal:", uploadError.message);
        }
    } else if (fields.foto === null) {
        // User hapus foto
        fotoUrl = null;
    }

    const { error } = await supabase
        .from("konselor")
        .update({
            foto_url: fotoUrl,
            bio: fields.bio,
            spesialisasi: fields.spesialisasi,
        })
        .eq("id", kid);

    if (!error) {
        setKonselor((prev) => ({
            ...prev,
            foto: fotoUrl,
            bio: fields.bio,
            spesialisasi: fields.spesialisasi,
        }));
    } else {
        console.error("Update profil gagal:", error.message);
    }
}, [kid, konselor]);

    // ── Kalkulasi dari booking ────────────────────────────────
    const selesai = myBookings.filter((b) => b.Status === "Selesai").length;
    const berjalan = myBookings.filter((b) => b.Status === "Berjalan").length;
    const total = myBookings.length;
    const successRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    const ratingTim = analisis_konselor.find((a) => a.Metrik_Tim === "Rata-rata Rating Konselor")?.Rumus_Excel ?? 0;
    const kasusTim = analisis_konselor.find((a) => a.Metrik_Tim === "Total Kasus Teratasi")?.Rumus_Excel ?? 0;
    const probTim = analisis_konselor.find((a) => a.Metrik_Tim === "Probabilitas Sukses Tim")?.Rumus_Excel ?? 0;

    const kategoriMap = useMemo(() => {
        const map = {};
        myBookings.forEach((b) => {
            if (!b.Kategori_Masalah) return;
            map[b.Kategori_Masalah] = (map[b.Kategori_Masalah] ?? 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [myBookings]);

    function handleLogout() {
        localStorage.removeItem("sanctuary_user");
        navigate("/login");
    }

    const initials = (konselor?.Nama ?? "K")
        .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    const navItems = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "klien", label: "Klien Saya", icon: "👥" },
    { key: "performa", label: "Performa", icon: "📈" },
    { key: "profil", label: "Profil Saya", icon: "👤" },
];

    const keramahan = konselor?.["Keramahan_(30%)"] ?? 0;
    const solusi = konselor?.["Solusi_(50%)"] ?? 0;
    const respon = konselor?.["Respon_(20%)"] ?? 0;
    const ratingFinal = konselor?.["Rating_(Final)"] ?? 0;

    const SPESIALISASI_DEFAULT = [
        { icon: "📊", title: "Manajemen Stres Akademik", desc: "Membantu mahasiswa mengelola tekanan tugas, ujian, dan deadline." },
        { icon: "🧠", title: "Kesejahteraan Mental", desc: "Pendampingan untuk menjaga keseimbangan mental." },
        { icon: "🎯", title: "Fokus & Produktivitas", desc: "Teknik untuk meningkatkan konsentrasi belajar." },
    ];

    const TESTIMONI = [
        { nama: "Rizki Pratama", sub: "Mahasiswa Semester 6", rating: 5, teks: "Konselor sangat sabar dan penuh empati. Sangat recommended!" },
        { nama: "Sari Dewi", sub: "Mahasiswa Semester 4", rating: 5, teks: "Sesi bersama konselor benar-benar mengubah cara pandang saya." },
    ];

    const ratingDist = [5, 4, 3, 2, 1].map((bintang) => ({
        bintang,
        count: TESTIMONI.filter((t) => t.rating === bintang).length,
    }));

    // ── Loading state ─────────────────────────────────────────
    if (loadingData) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12 }}>
                <div style={{ width: 40, height: 40, border: "4px solid #e0e0e0", borderTop: "4px solid #2f7d79", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#2f7d79", fontWeight: 600 }}>Memuat dashboard...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="kd-shell">
            {/* ── SIDEBAR ─────────────────────────────── */}
            <aside className="kd-sidebar">
                <div>
                    <span className="kd-logo" onClick={() => navigate("/konselor-dashboard")}>The Sanctuary</span>

                    <div className="kd-profile-mini">
                        <div className="kd-profile-avatar">{initials}</div>
                        <div>
                            <div className="kd-profile-name">{konselor?.Nama ?? "Konselor"}</div>
                            <div className="kd-profile-role">Konselor · {konselor?.Kategori_Masalah}</div>
                        </div>
                    </div>

                    <nav className="kd-nav">
                        {navItems.map((item) => (
                            <button
                                key={item.key}
                                className={`kd-nav-item ${activeTab === item.key ? "kd-nav-item--active" : ""}`}
                                onClick={() => setActiveTab(item.key)}
                            >
                                <span className="kd-nav-icon">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <button className="kd-logout" onClick={handleLogout}>← Keluar</button>
            </aside>

            {/* ── MAIN ────────────────────────────────── */}
            <main className="kd-main">
                {/* Topbar */}
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
                    </div>
                </div>

                {/* Content */}
                <div className="kd-content">

                    {/* ══ TAB: OVERVIEW ═══════════════════════════════════════ */}
                    {activeTab === "overview" && (
                        <>
                            <div className="kd-greeting">
                                <h2 className="kd-greeting-h2">Halo, {konselor?.Nama?.split(" ")[0]} 👋</h2>
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
                                    { icon: "⭐", val: ratingFinal.toFixed(1), lbl: "Rating Saya" },
                                    { icon: "📂", val: total, lbl: "Total Kasus" },
                                    { icon: "✅", val: selesai, lbl: "Kasus Selesai" },
                                    { icon: "🔄", val: berjalan, lbl: "Sedang Berjalan" },
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
                                        <button className="kd-card-link" onClick={() => setActiveTab("klien")}>Lihat semua →</button>
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
                                                    <span className={`kd-badge ${b.Status === "Selesai" ? "kd-badge--done" : "kd-badge--run"}`}>{b.Status}</span>
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

                    {/* ══ TAB: KLIEN SAYA ══════════════════════════════════════ */}
                    {activeTab === "klien" && (
                        <>
                            <div className="kd-greeting">
                                <h2 className="kd-greeting-h2">Klien Saya</h2>
                                <p className="kd-greeting-sub">{total} klien terdaftar · {berjalan} sedang berjalan</p>
                            </div>
                            <div className="kd-filter-row">
                                {["Semua", "Berjalan", "Selesai"].map((f) => (
                                    <button key={f} className="kd-filter-pill kd-filter-pill--active">{f}</button>
                                ))}
                            </div>
                            <div className="kd-klien-table">
                                <div className="kd-table-head">
                                    <span>Klien</span>
                                    <span>Kategori</span>
                                    <span>Sesi</span>
                                    <span>Progress</span>
                                    <span>Status</span>
                                </div>
                                {myBookings.map((b) => {
                                    const progPct = Math.round((b.Kondisi_Saat_Ini ?? 0) * 100);
                                    const awalPct = Math.round((b.Kondisi_Awal ?? 0) * 100);
                                    const gain = progPct - awalPct;
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
                                                <span className={`kd-badge ${b.Status === "Selesai" ? "kd-badge--done" : "kd-badge--run"}`}>{b.Status}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {myBookings.length === 0 && <p className="kd-empty" style={{ padding: "32px 0" }}>Belum ada klien yang ditangani.</p>}
                            </div>
                        </>
                    )}

                    {/* ══ TAB: PERFORMA ════════════════════════════════════════ */}
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
                                        {myBookings.filter((b) => b.Status === "Berjalan").map((b) => {
                                            const now = Math.round((b.Kondisi_Saat_Ini ?? 0) * 100);
                                            const awal = Math.round((b.Kondisi_Awal ?? 0) * 100);
                                            return (
                                                <div key={b.ID_Booking} className="kd-prog-item">
                                                    <div className="kd-prog-head">
                                                        <span className="kd-prog-name">{b.Nama_Mahasiswa?.split(" ")[0]}</span>
                                                        <span className="kd-prog-pct" style={{ color: kondisiColor(b.Kondisi_Saat_Ini) }}>{now}%</span>
                                                    </div>
                                                    <div className="kd-prog-track">
                                                        <div className="kd-prog-awal" style={{ left: `${awal}%` }} title={`Awal: ${awal}%`} />
                                                        <div className="kd-prog-fill" style={{ width: `${now}%`, background: kondisiColor(b.Kondisi_Saat_Ini) }} />
                                                    </div>
                                                    <div className="kd-prog-foot">
                                                        <span>Awal: {awal}%</span>
                                                        <span>{kondisiLabel(b.Kondisi_Saat_Ini)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {myBookings.filter((b) => b.Status === "Berjalan").length === 0 && <p className="kd-empty">Tidak ada klien aktif.</p>}
                                    </div>
                                </div>
                                <div className="kd-card">
                                    <div className="kd-card-h3" style={{ marginBottom: 16 }}>Komparasi vs Tim</div>
                                    {[
                                        { lbl: "Rating", saya: ratingFinal, tim: ratingTim, max: 5, fmt: (v) => v.toFixed(1) },
                                        { lbl: "Success Rate", saya: successRate / 100, tim: probTim, max: 1, fmt: (v) => `${Math.round(v * 100)}%` },
                                        { lbl: "Kasus Selesai", saya: selesai, tim: kasusTim / (analisis_konselor.length || 1), max: Math.max(selesai, kasusTim / (analisis_konselor.length || 1), 1), fmt: (v) => Math.round(v) },
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

                    {/* ══ TAB: PROFIL SAYA ════════════════════════════════════ */}
                    {activeTab === "profil" && (
                        <>
                            <div className="kd-greeting">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h2 className="kd-greeting-h2">Profil Saya</h2>
                                        <p className="kd-greeting-sub">Tampilan profil publikmu seperti yang dilihat oleh mahasiswa.</p>
                                    </div>
                                    <button className="kd-card-link" onClick={() => setShowEditModal(true)}>✏️ Edit Profil</button>
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
                                        {(konselor?.spesialisasi ?? SPESIALISASI_DEFAULT).map((s) => (
                                            <div key={s.title} className="kd-spesialis-item">
                                                <div className="kd-spesialis-icon">{s.icon}</div>
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
                                                <span className="kd-testi-ulasan">{TESTIMONI.length} ulasan</span>
                                            </div>
                                            <div className="kd-testi-dist">
                                                {ratingDist.map((r) => (
                                                    <div key={r.bintang} className="kd-testi-dist-row">
                                                        <span className="kd-testi-dist-bintang">{r.bintang} ★</span>
                                                        <div className="kd-bar-track" style={{ flex: 1, height: 6 }}>
                                                            <div className="kd-bar-fill" style={{
                                                                width: TESTIMONI.length > 0 ? `${(r.count / TESTIMONI.length) * 100}%` : "0%",
                                                                background: "#f5c842",
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
                                            {TESTIMONI.map((t, i) => (
                                                <div key={i} className="kd-testi-card">
                                                    <p className="kd-testi-text">"{t.teks}"</p>
                                                    <div className="kd-testi-foot">
                                                        <div className="kd-testi-avatar">{t.nama.charAt(0)}</div>
                                                        <div>
                                                            <div className="kd-testi-nama">{t.nama}</div>
                                                            <div className="kd-testi-sub">{t.sub}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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
                        <span className="kd-footer-copy">© 2025 · Dashboard Konselor</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}