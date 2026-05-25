import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import data_konselor from "../data/data_konselor";
import data_booking from "../data/data_booking";
import analisis_konselor from "../data/analisis_konselor";
import "../styles/konselor-dashboard.css";

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
function Stars({ rating, max = 5 }) {
    return (
        <div className="kd-stars">
            {Array.from({ length: max }).map((_, i) => (
                <span key={i} className={i < Math.round(rating) ? "kd-star kd-star--on" : "kd-star"}>★</span>
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

// ── Main Component ───────────────────────────────────────────────
export default function KonselorDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");

    const user = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
        catch { return null; }
    }, []);

    const kid = getKID(user);

    // Data konselor yang login
    const konselor = useMemo(
        () => data_konselor.find((k) => k.ID === kid) ?? data_konselor[0],
        [kid]
    );

    // Booking yang ditangani konselor ini
    const myBookings = useMemo(
        () => data_booking.filter((b) => b.ID_Konselor === kid && b.ID_Booking !== null),
        [kid]
    );

    const selesai = myBookings.filter((b) => b.Status === "Selesai").length;
    const berjalan = myBookings.filter((b) => b.Status === "Berjalan").length;
    const total = myBookings.length;
    const successRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    // Rata-rata kondisi progress klien aktif
    const avgProgress = useMemo(() => {
        const aktif = myBookings.filter((b) => b.Status === "Berjalan");
        if (!aktif.length) return 0;
        const avg = aktif.reduce((s, b) => s + (b.Kondisi_Saat_Ini ?? 0), 0) / aktif.length;
        return Math.round(avg * 100);
    }, [myBookings]);

    // Analisis tim
    const ratingTim = analisis_konselor.find((a) => a.Metrik_Tim === "Rata-rata Rating Konselor")?.Rumus_Excel ?? 0;
    const kasusTim = analisis_konselor.find((a) => a.Metrik_Tim === "Total Kasus Teratasi")?.Rumus_Excel ?? 0;
    const probTim = analisis_konselor.find((a) => a.Metrik_Tim === "Probabilitas Sukses Tim")?.Rumus_Excel ?? 0;

    // Distribusi kategori
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
        { key: "overview", label: "Overview", icon: "⊡" },
        { key: "klien", label: "Klien Saya", icon: "👥" },
        { key: "performa", label: "Performa", icon: "📊" },
    ];

    return (
        <div className="kd-shell">
            {/* ── SIDEBAR ─────────────────────────────── */}
            <aside className="kd-sidebar">
                <div>
                    <span className="kd-logo" onClick={() => navigate("/konselor-dashboard")}>The Sanctuary</span>

                    {/* Profile mini */}
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

                <button className="kd-logout" onClick={handleLogout}>
                    ← Keluar
                </button>
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
                        <div className="kd-avatar" title={konselor?.Nama} onClick={() => setActiveTab("overview")} style={{ cursor: "pointer" }}>
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

                            {/* Hero card */}
                            <div className="kd-hero">
                                <div className="kd-hero-left">
                                    <span className="kd-hero-tag">KONSELOR AKTIF</span>
                                    <h3 className="kd-hero-h3">{konselor?.Nama}</h3>
                                    <p className="kd-hero-p">
                                        Spesialisasi <strong>{konselor?.Kategori_Masalah}</strong> · Pengalaman {konselor?.Pengalaman}
                                    </p>
                                    <Stars rating={konselor?.["Rating_(Final)"] ?? 0} />
                                    <p className="kd-hero-rating-val">
                                        {(konselor?.["Rating_(Final)"] ?? 0).toFixed(1)} / 5.0
                                    </p>
                                </div>
                                <div className="kd-hero-right">
                                    <Donut
                                        pct={successRate}
                                        size={110}
                                        stroke={12}
                                        color="#79d8d1"
                                        label={`${successRate}%`}
                                        sublabel="Success Rate"
                                    />
                                </div>
                            </div>

                            {/* Stat cards */}
                            <div className="kd-stats-row">
                                {[
                                    { icon: "⭐", val: (konselor?.["Rating_(Final)"] ?? 0).toFixed(1), lbl: "Rating Saya" },
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

                            {/* Grid bawah */}
                            <div className="kd-grid">
                                {/* Sesi terbaru */}
                                <div className="kd-card">
                                    <div className="kd-card-hd">
                                        <div>
                                            <div className="kd-card-h3">Sesi Terbaru</div>
                                            <div className="kd-card-sub">{myBookings.length} total sesi</div>
                                        </div>
                                        <button className="kd-card-link" onClick={() => setActiveTab("klien")}>
                                            Lihat semua →
                                        </button>
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
                                                    <span className={`kd-badge ${b.Status === "Selesai" ? "kd-badge--done" : "kd-badge--run"}`}>
                                                        {b.Status}
                                                    </span>
                                                    <div className="kd-sesi-date">
                                                        {new Date(b.Tanggal_Sesi).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {myBookings.length === 0 && (
                                            <p className="kd-empty">Belum ada sesi yang ditangani.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Indikator Performa */}
                                <div className="kd-card">
                                    <div className="kd-card-hd">
                                        <div>
                                            <div className="kd-card-h3">Indikator Performa</div>
                                            <div className="kd-card-sub">Komponen penilaian rata-rata</div>
                                        </div>
                                    </div>
                                    <div className="kd-performa-list">
                                        {[
                                            { lbl: "Keramahan (30%)", val: konselor?.["Keramahan_(30%)"] ?? 0, max: 5 },
                                            { lbl: "Solusi (50%)", val: konselor?.["Solusi_(50%)"] ?? 0, max: 5 },
                                            { lbl: "Respon (20%)", val: konselor?.["Respon_(20%)"] ?? 0, max: 5 },
                                        ].map((p) => (
                                            <div key={p.lbl} className="kd-perf-row">
                                                <div className="kd-perf-lbl">{p.lbl}</div>
                                                <ProgressBar value={p.val} max={p.max} />
                                                <div className="kd-perf-val">{p.val.toFixed(1)}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="kd-divider" />

                                    {/* Tim stats */}
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

                                {/* Distribusi Kategori */}
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

                            {/* Filter pills */}
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
                                                    <div className="kd-prog-fill-sm" style={{
                                                        width: `${progPct}%`,
                                                        background: kondisiColor(b.Kondisi_Saat_Ini)
                                                    }} />
                                                </div>
                                                <div className="kd-prog-detail">
                                                    <span style={{ color: kondisiColor(b.Kondisi_Saat_Ini) }}>
                                                        {kondisiLabel(b.Kondisi_Saat_Ini)}
                                                    </span>
                                                    <span className={`kd-gain ${gain >= 0 ? "kd-gain--pos" : "kd-gain--neg"}`}>
                                                        {gain >= 0 ? "+" : ""}{gain}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="kd-table-cell">
                                                <span className={`kd-badge ${b.Status === "Selesai" ? "kd-badge--done" : "kd-badge--run"}`}>
                                                    {b.Status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {myBookings.length === 0 && (
                                    <p className="kd-empty" style={{ padding: "32px 0" }}>Belum ada klien yang ditangani.</p>
                                )}
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
                                {/* Rating donut */}
                                <div className="kd-card kd-card--center">
                                    <div className="kd-card-h3" style={{ marginBottom: 20, textAlign: "center" }}>Rating Final</div>
                                    <Donut
                                        pct={Math.round((konselor?.["Rating_(Final)"] / 5) * 100)}
                                        size={130}
                                        stroke={14}
                                        color="#2f7d79"
                                        label={(konselor?.["Rating_(Final)"] ?? 0).toFixed(1)}
                                        sublabel="/ 5.0"
                                    />
                                    <Stars rating={konselor?.["Rating_(Final)"] ?? 0} />
                                    <p className="kd-card-sub" style={{ marginTop: 8, textAlign: "center" }}>
                                        Berdasarkan keramahan, solusi & respon
                                    </p>
                                </div>

                                {/* Komponen rating */}
                                <div className="kd-card">
                                    <div className="kd-card-h3" style={{ marginBottom: 16 }}>Breakdown Rating</div>
                                    {[
                                        { lbl: "Keramahan", bobot: "30%", val: konselor?.["Keramahan_(30%)"] ?? 0, color: "#2f7d79" },
                                        { lbl: "Solusi", bobot: "50%", val: konselor?.["Solusi_(50%)"] ?? 0, color: "#79d8d1" },
                                        { lbl: "Respon", bobot: "20%", val: konselor?.["Respon_(20%)"] ?? 0, color: "#1a5e5a" },
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

                                {/* Progress klien aktif */}
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
                                                        <span className="kd-prog-pct" style={{ color: kondisiColor(b.Kondisi_Saat_Ini) }}>
                                                            {now}%
                                                        </span>
                                                    </div>
                                                    <div className="kd-prog-track">
                                                        {/* awal marker */}
                                                        <div className="kd-prog-awal" style={{ left: `${awal}%` }} title={`Awal: ${awal}%`} />
                                                        <div className="kd-prog-fill" style={{
                                                            width: `${now}%`,
                                                            background: kondisiColor(b.Kondisi_Saat_Ini)
                                                        }} />
                                                    </div>
                                                    <div className="kd-prog-foot">
                                                        <span>Awal: {awal}%</span>
                                                        <span>{kondisiLabel(b.Kondisi_Saat_Ini)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {myBookings.filter((b) => b.Status === "Berjalan").length === 0 && (
                                            <p className="kd-empty">Tidak ada klien aktif.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Komparasi dengan tim */}
                                <div className="kd-card">
                                    <div className="kd-card-h3" style={{ marginBottom: 16 }}>Komparasi vs Tim</div>
                                    {[
                                        {
                                            lbl: "Rating",
                                            saya: konselor?.["Rating_(Final)"] ?? 0,
                                            tim: ratingTim,
                                            max: 5,
                                            fmt: (v) => v.toFixed(1),
                                        },
                                        {
                                            lbl: "Success Rate",
                                            saya: successRate / 100,
                                            tim: probTim,
                                            max: 1,
                                            fmt: (v) => `${Math.round(v * 100)}%`,
                                        },
                                        {
                                            lbl: "Kasus Selesai",
                                            saya: selesai,
                                            tim: kasusTim / data_konselor.length,
                                            max: Math.max(selesai, kasusTim),
                                            fmt: (v) => Math.round(v),
                                        },
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

                </div>{/* end kd-content */}

                {/* Footer */}
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