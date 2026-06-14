import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import "../styles/konselor-dashboard.css";
import EditProfilModal from "./EditProfilModal.jsx";
import { supabase } from "../lib/supabase.js";
import { fetchTeamStats } from "../lib/teamStats.js";
import { useKonselorPushNotif } from "../hooks/useKonselorPushNotif.js";
import {
    BOOKING_STATUS,
    isSelesai,
    isAktif,
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

function Toggle({ checked, onChange, disabled }) {
    return (
        <label className="stg-toggle" style={{ opacity: disabled ? 0.4 : 1, flexShrink: 0, cursor: disabled ? "not-allowed" : "pointer" }}>
            <input type="checkbox" checked={checked} onChange={(e) => !disabled && onChange(e.target.checked)} disabled={disabled} />
            <span className="stg-toggle-track"><span className="stg-toggle-thumb" /></span>
        </label>
    );
}

function NotifToast({ msg, onDone }) {
    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(onDone, 2800);
        return () => clearTimeout(t);
    }, [msg]);
    if (!msg) return null;
    return (
        <div className="kd-toast">
            {msg}
        </div>
    );
}

function KlienDetailModal({ klien, onClose }) {
    if (!klien) return null;
    const progPct = Math.round((klien.Kondisi_Saat_Ini ?? 0) * 100);
    const awalPct = Math.round((klien.Kondisi_Awal ?? 0) * 100);
    const gain = progPct - awalPct;
    return (
        <div className="kd-modal-overlay" onClick={onClose}>
            <div className="kd-modal" onClick={(e) => e.stopPropagation()}>
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
                                <div className="kd-modal-progress-awal" style={{ left: `${awalPct}%` }} />
                                <div className="kd-modal-progress-fill" style={{ width: `${progPct}%`, background: kondisiColor(klien.Kondisi_Saat_Ini) }} />
                            </div>
                            <div className="kd-modal-progress-numbers">
                                <span className="kd-modal-progress-num">{awalPct}%</span>
                                <span className="kd-modal-progress-arrow">→</span>
                                <span className="kd-modal-progress-num" style={{ color: kondisiColor(klien.Kondisi_Saat_Ini) }}>{progPct}%</span>
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
                                    ? "Klien dalam proses pemulihan yang baik. Terus berikan dukungan dan motivasi."
                                    : "Masih dalam tahap awal pemulihan. Perlu pendekatan yang lebih intensif."}
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

function KonselorNotifSection({ kid, user }) {
    const konselorEmail = (user?.email ?? "").toLowerCase();
    const [pengingat, setPengingat] = useState(true);
    const [notifBooking, setNotifBooking] = useState(true);
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifLoaded, setNotifLoaded] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [toast, setToast] = useState("");
    const { status: pushStatus, loading: pushHookLoading, subscribe, unsubscribe } = useKonselorPushNotif(kid, konselorEmail);

    useEffect(() => {
        if (!konselorEmail) return;
        (async () => {
            const { data } = await supabase.from("preferensi_notif").select("*").eq("email", konselorEmail).maybeSingle();
            if (data) {
                setPengingat(data.pengingat_sesi ?? true);
                setNotifBooking(data.notif_booking ?? true);
                setNotifEmail(data.notif_email ?? true);
            }
            setNotifLoaded(true);
        })();
    }, [konselorEmail]);

    const saveNotifPref = async (field, val) => {
        if (!konselorEmail) return;
        await supabase.from("preferensi_notif").upsert({ email: konselorEmail, [field]: val }, { onConflict: "email" });
        setToast("Preferensi disimpan ✓");
    };

    const handlePengingat = (v) => { setPengingat(v); saveNotifPref("pengingat_sesi", v); };
    const handleNotifBooking = (v) => { setNotifBooking(v); saveNotifPref("notif_booking", v); };
    const handleNotifEmail = (v) => { setNotifEmail(v); saveNotifPref("notif_email", v); };

    const handlePushToggle = async () => {
        if (pushLoading || pushHookLoading) return;
        setPushLoading(true);
        try {
            if (pushStatus === "subscribed") {
                await unsubscribe();
                await saveNotifPref("push_aktif", false);
                setToast("Push notifikasi dinonaktifkan");
            } else {
                if (pushStatus === "unsupported") { setToast("Browser tidak mendukung push notifikasi"); return; }
                if (pushStatus === "denied") { setToast("Izin notifikasi ditolak — aktifkan di pengaturan browser"); return; }
                await subscribe();
                await saveNotifPref("push_aktif", true);
                setToast("Push notifikasi diaktifkan ✓");
            }
        } finally {
            setPushLoading(false);
        }
    };

    const pushChecked = pushStatus === "subscribed";
    const isLoading = pushStatus === "idle" || pushHookLoading;

    const pushStatusLabel = {
        idle: "Memeriksa status...",
        unsupported: "Browser tidak mendukung push notifikasi",
        denied: "Izin notifikasi ditolak di browser",
        subscribed: "Aktif — kamu akan menerima notifikasi langsung",
        unsubscribed: "Nonaktif",
    }[pushStatus] ?? "";

    return (
        <>
            <NotifToast msg={toast} onDone={() => setToast("")} />
            <div className="kd-card kd-card--wide" style={{ marginTop: 24 }}>
                <div className="kd-notif-header">
                    <div className="kd-notif-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="16" height="16">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <div>
                        <div className="kd-card-h3" style={{ marginBottom: 2 }}>Preferensi Notifikasi</div>
                        <div className="kd-card-sub">Atur kapan dan bagaimana kamu menerima notifikasi sesi.</div>
                    </div>
                </div>

                <div className={`kd-push-card ${pushChecked ? "kd-push-card--active" : ""}`}>
                    <div className="kd-push-card-content">
                        <div>
                            <div className="kd-push-card-title">
                                Push Notification ke Browser / HP
                                {isLoading && <span className="kd-push-badge kd-push-badge--loading">MEMERIKSA...</span>}
                                {!isLoading && pushChecked && <span className="kd-push-badge kd-push-badge--active">AKTIF</span>}
                                {!isLoading && pushStatus === "denied" && <span className="kd-push-badge kd-push-badge--denied">DIBLOKIR</span>}
                            </div>
                            <p className="kd-push-card-desc">{pushStatusLabel}</p>
                            {pushStatus === "denied" && (
                                <p className="kd-push-card-warning">Buka pengaturan browser → izinkan notifikasi → muat ulang halaman.</p>
                            )}
                        </div>
                        <Toggle checked={pushChecked} onChange={handlePushToggle} disabled={pushLoading || isLoading || pushStatus === "unsupported" || pushStatus === "denied"} />
                    </div>
                </div>

                <div className="kd-notif-pref-list">
                    <div className="kd-notif-pref-item">
                        <div>
                            <p className="kd-notif-pref-title">Pengingat Sesi</p>
                            <p className="kd-notif-pref-desc">Push notification 15 menit sebelum sesi dimulai.</p>
                        </div>
                        <Toggle checked={pengingat} onChange={handlePengingat} disabled={!notifLoaded || !pushChecked} />
                    </div>
                    <div className="kd-notif-pref-item">
                        <div>
                            <p className="kd-notif-pref-title">Notifikasi Booking Baru</p>
                            <p className="kd-notif-pref-desc">Terima push notification saat mahasiswa booking sesi denganmu.</p>
                        </div>
                        <Toggle checked={notifBooking} onChange={handleNotifBooking} disabled={!notifLoaded || !pushChecked} />
                    </div>
                    <div className="kd-notif-pref-item kd-notif-pref-item--last">
                        <div>
                            <p className="kd-notif-pref-title">Notifikasi via Email</p>
                            <p className="kd-notif-pref-desc">Kirim ringkasan booking baru dan pengingat ke <strong>{konselorEmail || "email kamu"}</strong>.</p>
                        </div>
                        <Toggle checked={notifEmail} onChange={handleNotifEmail} disabled={!notifLoaded} />
                    </div>
                </div>

                {!pushChecked && !isLoading && pushStatus !== "denied" && pushStatus !== "unsupported" && (
                    <p className="kd-notif-hint">Aktifkan push notification terlebih dahulu untuk mengatur pengingat & notif booking.</p>
                )}
            </div>
        </>
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
    const [teamStats, setTeamStats] = useState({ ratingTim: 0, kasusTim: 0, probSukses: 0, avgKasusSelesai: 0 });
    const [ulasanList, setUlasanList] = useState([]);
    const [selectedKlien, setSelectedKlien] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchTeamStats().then(setTeamStats);
    }, []);

    const user = (() => {
        try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
        catch { return null; }
    })();

    const kid = user?.konselorId ?? user?.konselor_id ?? null;

    useEffect(() => {
        if (!kid) { setLoadingData(false); return; }
        async function fetchData() {
            setLoadingData(true);
            try {
                const [{ data: kData }, { data: bData }] = await Promise.all([
                    supabase.from("data_konselor").select("*").eq("id", kid).single(),
                    supabase.from("booking").select("*").eq("id_konselor", kid).order("tanggal_sesi", { ascending: false }),
                ]);
                if (kData) {
                    setKonselor({
                        ID: kData.id, Nama: kData.nama, Kategori_Masalah: kData.kategori_masalah,
                        Pengalaman: kData.pengalaman, "Rating_(Final)": kData.rating_final ?? 0,
                        "Keramahan_(30%)": kData.keramahan ?? 0, "Solusi_(50%)": kData.solusi ?? 0,
                        "Respon_(20%)": kData.respon ?? 0, Jumlah_Kasus: kData.jumlah_kasus ?? 0,
                        Kasus_Selesai: kData.kasus_selesai ?? 0, Success_Rate: kData.success_rate ?? 0,
                        image: kData.image_url, foto: kData.foto_url, bio: kData.bio, spesialisasi: kData.spesialisasi,
                    });
                }
                if (bData) {
                    setMyBookings(bData.map((b) => ({
                        ID_Booking: b.id, ID_Konselor: b.id_konselor, ID_Mahasiswa: b.id_mahasiswa,
                        Nama_Mahasiswa: b.nama_mahasiswa, Kategori_Masalah: b.kategori_masalah,
                        Tanggal_Sesi: b.tanggal_sesi, Sesi_Konseling: b.sesi_konseling,
                        Status: b.status, Kondisi_Awal: b.kondisi_awal, Kondisi_Saat_Ini: b.kondisi_saat_ini,
                    })));
                }
                const { data: ulasanData } = await supabase.from("ulasan_konselor").select("*").eq("id_konselor", kid).order("created_at", { ascending: false });
                if (ulasanData) setUlasanList(ulasanData);
            } catch (err) {
                console.error("fetchData error:", err);
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
                const { data } = await supabase.from("konselor_availability").select("*").eq("konselor_id", kid).order("tanggal", { ascending: true });
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
            await supabase.storage.from("konselor-foto").upload(fileName, blob, { contentType: blob.type, upsert: true });
            const { data: urlData } = supabase.storage.from("konselor-foto").getPublicUrl(fileName);
            fotoUrl = urlData.publicUrl;
        } else if (fields.foto === null) {
            fotoUrl = null;
        }
        await supabase.from("data_konselor").update({ foto_url: fotoUrl, bio: fields.bio, spesialisasi: fields.spesialisasi }).eq("id", kid);
        setKonselor((prev) => ({ ...prev, foto: fotoUrl, bio: fields.bio, spesialisasi: fields.spesialisasi }));
    }, [kid, konselor]);

    const selesai = myBookings.filter((b) => isSelesai(b.Status)).length;
    const berjalan = myBookings.filter((b) => isAktif(b.Status)).length;
    const total = myBookings.length;
    const successRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    const { ratingTim, kasusTim, probSukses: probTim, avgKasusSelesai = 0 } = teamStats;
    const ratingFinal = konselor?.["Rating_(Final)"] ?? 0;
    const keramahan = konselor?.["Keramahan_(30%)"] ?? 0;
    const solusi = konselor?.["Solusi_(50%)"] ?? 0;
    const respon = konselor?.["Respon_(20%)"] ?? 0;

    const kategoriMap = useMemo(() => {
        const map = {};
        myBookings.forEach((b) => {
            if (!b.Kategori_Masalah) return;
            map[b.Kategori_Masalah] = (map[b.Kategori_Masalah] ?? 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [myBookings]);

    const filteredBookings = useMemo(() => {
        if (filterKlien === "Berjalan") return myBookings.filter((b) => isAktif(b.Status));
        if (filterKlien === "Selesai") return myBookings.filter((b) => isSelesai(b.Status));
        return myBookings;
    }, [myBookings, filterKlien]);

    function handleLogout() {
        localStorage.removeItem("sanctuary_user");
        supabase.auth.signOut().then(() => navigate("/login")).catch(() => navigate("/login"));
    }

    async function handleTambahSlot() {
        if (!newSlot.tanggal || !newSlot.jam_mulai || !newSlot.jam_selesai) return;
        setAddingSlot(true);
        const { data, error } = await supabase.from("konselor_availability").insert({
            konselor_id: kid, tanggal: newSlot.tanggal, jam_mulai: newSlot.jam_mulai,
            jam_selesai: newSlot.jam_selesai, status: "tersedia"
        }).select().single();
        if (!error && data) {
            setSlots((prev) => [...prev, data].sort((a, b) => a.tanggal.localeCompare(b.tanggal)));
            setNewSlot({ tanggal: "", jam_mulai: "", jam_selesai: "" });
        }
        setAddingSlot(false);
    }

    async function handleHapusSlot(slotId) {
        await supabase.from("konselor_availability").delete().eq("id", slotId);
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
    }

    const initials = (konselor?.Nama ?? "K").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const SPESIALISASI_DEFAULT = [
        { icon: "✓", title: "Manajemen Stres Akademik", desc: "Membantu mahasiswa mengelola tekanan tugas, ujian, dan deadline." },
        { icon: "✓", title: "Kesejahteraan Mental", desc: "Pendampingan untuk menjaga keseimbangan mental." },
        { icon: "✓", title: "Fokus & Produktivitas", desc: "Teknik untuk meningkatkan konsentrasi belajar." },
    ];

    const ratingDist = [5, 4, 3, 2, 1].map((bintang) => ({
        bintang,
        count: ulasanList.filter((u) => Math.round(Number(u.rating)) === bintang).length,
    }));

    const navItems = [
        { key: "overview", label: "Overview" },
        { key: "klien", label: "Klien Saya" },
        { key: "jadwal", label: "Jadwal" },
        { key: "performa", label: "Performa" },
        { key: "profil", label: "Profil Saya" },
    ];

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
                    Akun kamu belum terhubung ke data konselor.<br />Hubungi admin untuk menghubungkan akun ini dengan profil konselor.
                </p>
                <button className="kd-logout-btn" onClick={() => { supabase.auth.signOut(); localStorage.removeItem("sanctuary_user"); navigate("/login"); }}>
                    Keluar
                </button>
            </div>
        );
    }

    return (
        <div className="kd-shell">
            {showDetailModal && (
                <KlienDetailModal klien={selectedKlien} onClose={() => { setShowDetailModal(false); setSelectedKlien(null); }} />
            )}

            <main className="kd-main">
                <div className="kd-topbar">
                    <div className="kd-topbar-l">
                        <span className="kd-topbar-logo" onClick={() => navigate("/konselor-dashboard")}>The Sanctuary</span>
                        <div className="kd-topbar-nav">
                            {navItems.map((item) => (
                                <span key={item.key} className={activeTab === item.key ? "kd-topbar-active" : ""} onClick={() => setActiveTab(item.key)}>
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="kd-topbar-r">
                        <div className="kd-avatar" onClick={() => setActiveTab("profil")}>{initials}</div>
                        <button className="kd-nav-logout-btn" onClick={handleLogout}>Keluar</button>
                        <button className="kd-topbar-logout" onClick={handleLogout}>
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
                                    <p className="kd-hero-p">Spesialisasi <strong>{konselor?.Kategori_Masalah}</strong> · Pengalaman {konselor?.Pengalaman}</p>
                                    <Stars rating={ratingFinal} />
                                    <p className="kd-hero-rating-val">{ratingFinal.toFixed(1)} / 5.0</p>
                                </div>
                                <div className="kd-hero-right">
                                    <Donut pct={successRate} size={110} stroke={12} color="#79d8d1" label={`${successRate}%`} sublabel="Success Rate" />
                                </div>
                            </div>
                            <div className="kd-stats-row">
                                {[
                                    { val: ratingFinal.toFixed(1), lbl: "Rating Saya" },
                                    { val: total, lbl: "Total Kasus" },
                                    { val: selesai, lbl: "Kasus Selesai" },
                                    { val: berjalan, lbl: "Sedang Berjalan" },
                                ].map((s, i) => (
                                    <div key={i} className="kd-stat-card">
                                        <div className="kd-stat-val">{s.val}</div>
                                        <div className="kd-stat-lbl">{s.lbl}</div>
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
                                                <div className="kd-sesi-avatar">{b.Nama_Mahasiswa?.charAt(0).toUpperCase()}</div>
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
                                    <div className="kd-divider" />
                                    <div className="kd-card-h3">Performa Tim</div>
                                    <div className="kd-tim-row">
                                        <div className="kd-tim-item"><div className="kd-tim-val">{ratingTim.toFixed(1)}</div><div className="kd-tim-lbl">Avg Rating Tim</div></div>
                                        <div className="kd-tim-item"><div className="kd-tim-val">{kasusTim}</div><div className="kd-tim-lbl">Kasus Selesai Tim</div></div>
                                        <div className="kd-tim-item"><div className="kd-tim-val">{Math.round(probTim * 100)}%</div><div className="kd-tim-lbl">Prob. Sukses Tim</div></div>
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
                                        kategoriMap.map(([kat, count]) => (
                                            <div key={kat} className="kd-kat-row">
                                                <div className="kd-kat-lbl">{kat}</div>
                                                <ProgressBar value={count} max={total} />
                                                <div className="kd-kat-count">{count} klien</div>
                                            </div>
                                        ))
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
                                    <button key={f} className={`kd-filter-pill ${filterKlien === f ? "kd-filter-pill--active" : ""}`} onClick={() => setFilterKlien(f)}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="kd-klien-table">
                                <div className="kd-table-head">
                                    <span>Klien</span><span>Kategori</span><span>Sesi</span><span>Progress</span><span>Status</span><span>Aksi</span>
                                </div>
                                {filteredBookings.map((b) => {
                                    const progPct = Math.round((b.Kondisi_Saat_Ini ?? 0) * 100);
                                    const awalPct = Math.round((b.Kondisi_Awal ?? 0) * 100);
                                    const gain = progPct - awalPct;

                                    return (
                                        <div key={b.ID_Booking} className="kd-table-row">
                                            <div className="kd-table-cell kd-cell-name">
                                                <div className="kd-mini-avatar">{b.Nama_Mahasiswa?.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div className="kd-cell-nm">{b.Nama_Mahasiswa}</div>
                                                    <div className="kd-cell-id">{b.ID_Mahasiswa}</div>
                                                </div>
                                            </div>
                                            <div className="kd-table-cell"><span className="kd-kat-chip">{b.Kategori_Masalah}</span></div>
                                            <div className="kd-table-cell kd-cell-center"><span className="kd-sesi-num">#{b.Sesi_Konseling}</span></div>
                                            <div className="kd-table-cell kd-cell-progress">
                                                <div className="kd-prog-bar-sm"><div className="kd-prog-fill-sm" style={{ width: `${progPct}%`, background: kondisiColor(b.Kondisi_Saat_Ini) }} /></div>
                                                <div className="kd-prog-detail">
                                                    <span style={{ color: kondisiColor(b.Kondisi_Saat_Ini) }}>{kondisiLabel(b.Kondisi_Saat_Ini)}</span>
                                                    <span className={`kd-gain ${gain >= 0 ? "kd-gain--pos" : "kd-gain--neg"}`}>{gain >= 0 ? "+" : ""}{gain}%</span>
                                                </div>
                                            </div>
                                            <div className="kd-table-cell"><span className={`kd-badge ${isSelesai(b.Status) ? "kd-badge--done" : "kd-badge--run"}`}>{statusLabel(b.Status)}</span></div>
                                            <div className="kd-table-cell">
                                                <button className="kd-btn-detail" onClick={() => { setSelectedKlien(b); setShowDetailModal(true); }}>
                                                    Lihat Detail 
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredBookings.length === 0 && (
                                    <p className="kd-empty">Belum ada klien yang ditangani.</p>
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
                                <div className="kd-card-h3">Tambah Slot Baru</div>
                                <div className="kd-slot-form">
                                    <div className="kd-slot-field">
                                        <label>Tanggal</label>
                                        <input type="date" value={newSlot.tanggal} min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })} onChange={(e) => setNewSlot((p) => ({ ...p, tanggal: e.target.value }))} />
                                    </div>
                                    <div className="kd-slot-field">
                                        <label>Jam Mulai</label>
                                        <input type="time" value={newSlot.jam_mulai} onChange={(e) => setNewSlot((p) => ({ ...p, jam_mulai: e.target.value }))} />
                                    </div>
                                    <div className="kd-slot-field">
                                        <label>Jam Selesai</label>
                                        <input type="time" value={newSlot.jam_selesai} onChange={(e) => setNewSlot((p) => ({ ...p, jam_selesai: e.target.value }))} />
                                    </div>
                                    <button className="kd-slot-add-btn" onClick={handleTambahSlot} disabled={addingSlot || !newSlot.tanggal || !newSlot.jam_mulai || !newSlot.jam_selesai}>
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
                                    Object.entries(slots.reduce((acc, s) => { if (!acc[s.tanggal]) acc[s.tanggal] = []; acc[s.tanggal].push(s); return acc; }, {})).map(([tanggal, slotList]) => (
                                        <div key={tanggal} className="kd-slot-group">
                                            <div className="kd-slot-date">{new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                                            <div className="kd-slot-list">
                                                {slotList.map((s) => (
                                                    <div key={s.id} className={`kd-slot-item ${s.status === "booked" ? "kd-slot-item--booked" : "kd-slot-item--available"}`}>
                                                        <span>{s.jam_mulai.slice(0, 5)} – {s.jam_selesai.slice(0, 5)}</span>
                                                        <span className="kd-slot-status">{s.status === "booked" ? "Dipesan" : "Tersedia"}</span>
                                                        {s.status === "tersedia" && (
                                                            <button className="kd-slot-delete" onClick={() => handleHapusSlot(s.id)}>✕</button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
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
                                    <div className="kd-card-h3">Rating Final</div>
                                    <Donut pct={Math.round((ratingFinal / 5) * 100)} size={130} stroke={14} color="#2f7d79" label={ratingFinal.toFixed(1)} sublabel="/ 5.0" />
                                    <Stars rating={ratingFinal} />
                                    <p className="kd-card-sub">Berdasarkan keramahan, solusi & respon</p>
                                </div>
                                <div className="kd-card">
                                    <div className="kd-card-h3">Breakdown Rating</div>
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
                                            <div className="kd-bar-track"><div className="kd-bar-fill" style={{ width: `${(p.val / 5) * 100}%`, background: p.color }} /></div>
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
                                                    <div className="kd-prog-awal" style={{ left: `${awal}%` }} />
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
                                <div className="kd-card">
                                    <div className="kd-card-h3">Komparasi vs Tim</div>
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
                                                    <div className="kd-bar-track"><div className="kd-bar-fill" style={{ width: `${(c.saya / c.max) * 100}%` }} /></div>
                                                    <div className="kd-compare-val">{c.fmt(c.saya)}</div>
                                                </div>
                                                <div className="kd-compare-bar-wrap">
                                                    <div className="kd-compare-bar-label kd-compare-bar-label--tim">Tim</div>
                                                    <div className="kd-bar-track"><div className="kd-bar-fill kd-bar-fill--tim" style={{ width: `${(c.tim / c.max) * 100}%` }} /></div>
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
                                        <p className="kd-greeting-sub">Tampilan profil publikmu seperti yang dilihat oleh mahasiswa.</p>
                                    </div>
                                    <button className="kd-edit-btn" onClick={() => setShowEditModal(true)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                            <path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" />
                                        </svg>
                                        Edit Profil
                                    </button>
                                </div>
                            </div>

                            {showEditModal && <EditProfilModal profil={konselor} onSave={updateProfil} onClose={() => setShowEditModal(false)} />}

                            <div className="kd-profil-hero">
                                <div className="kd-profil-hero-left">
                                    {(konselor?.foto || konselor?.image) ? (
                                        <img src={konselor.foto || konselor.image} alt={konselor?.Nama} className="kd-profil-photo" />
                                    ) : (
                                        <div className="kd-profil-photo kd-profil-photo--placeholder">{initials}</div>
                                    )}
                                    <div className="kd-profil-available"><span className="kd-available-dot" />Tersedia untuk sesi</div>
                                </div>
                                <div className="kd-profil-hero-info">
                                    <span className="kd-profil-kategori-badge">{konselor?.Kategori_Masalah}</span>
                                    <h2 className="kd-profil-nama">{konselor?.Nama}</h2>
                                    <p className="kd-profil-bio">{konselor?.bio || `${konselor?.Nama?.split(" ")[0]} adalah konselor sebaya yang berfokus pada pendampingan mahasiswa.`}</p>
                                    <div className="kd-profil-stat-row">
                                        <div className="kd-profil-stat-item"><span className="kd-profil-stat-val" style={{ color: "var(--teal)" }}>{ratingFinal.toFixed(1)}</span><span className="kd-profil-stat-lbl">Rating</span></div>
                                        <div className="kd-profil-stat-divider" />
                                        <div className="kd-profil-stat-item"><span className="kd-profil-stat-val">{total}</span><span className="kd-profil-stat-lbl">Total Kasus</span></div>
                                        <div className="kd-profil-stat-divider" />
                                        <div className="kd-profil-stat-item"><span className="kd-profil-stat-val">{selesai}</span><span className="kd-profil-stat-lbl">Kasus Selesai</span></div>
                                        <div className="kd-profil-stat-divider" />
                                        <div className="kd-profil-stat-item"><span className="kd-profil-stat-val">{successRate}%</span><span className="kd-profil-stat-lbl">Success Rate</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="kd-profil-grid">
                                <div className="kd-card kd-profil-about">
                                    <div className="kd-card-h3">Tentang Saya</div>
                                    <p className="kd-profil-about-text">{konselor?.bio || `${konselor?.Nama?.split(" ")[0]} adalah konselor sebaya yang berfokus pada pendampingan mahasiswa dalam menghadapi tekanan akademik.`}</p>
                                    {!konselor?.bio && (
                                        <p className="kd-profil-about-text">Melalui pendekatan yang hangat dan empatik, {konselor?.Nama?.split(" ")[0]} percaya bahwa setiap mahasiswa memiliki potensi untuk bangkit.</p>
                                    )}
                                    <div style={{ marginTop: 24 }}>
                                        {[
                                            { lbl: "Keramahan", val: keramahan },
                                            { lbl: "Kualitas Solusi", val: solusi },
                                            { lbl: "Kecepatan Respon", val: respon },
                                        ].map((p) => (
                                            <div key={p.lbl} className="kd-profil-rating-row">
                                                <span className="kd-profil-rating-lbl">{p.lbl}</span>
                                                <div className="kd-bar-track"><div className="kd-bar-fill" style={{ width: `${(p.val / 5) * 100}%` }} /></div>
                                                <span className="kd-profil-rating-val">{p.val.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="kd-card">
                                    <div className="kd-card-h3">Spesialisasi Keahlian</div>
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
                                    <div className="kd-card-h3">Testimoni Klien</div>
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
                                                        <div className="kd-bar-track"><div className="kd-bar-fill" style={{ width: `${ulasanList.length > 0 ? (r.count / ulasanList.length) * 100 : 0}%`, background: "#f5c842" }} /></div>
                                                        <span className="kd-testi-dist-count">{r.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="kd-testi-kat-wrap">
                                                <div className="kd-testi-kat-label">KATEGORI MASALAH DITANGANI</div>
                                                <div className="kd-testi-kat-pills">
                                                    {kategoriMap.slice(0, 4).map(([kat]) => <span key={kat} className="kd-testi-kat-pill">{kat}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="kd-testi-cards">
                                            {ulasanList.length === 0 ? (
                                                <p className="kd-empty">Belum ada testimoni. Fitur ini akan aktif setelah mahasiswa memberikan ulasan sesi.</p>
                                            ) : (
                                                ulasanList.map((u, i) => (
                                                    <div key={u.id ?? i} className="kd-testi-card">
                                                        <div className="kd-stars">{/* stars */}</div>
                                                        <p className="kd-testi-text">"{u.teks}"</p>
                                                        <div className="kd-testi-foot">
                                                            <div className="kd-mini-avatar">{(u.nama_mahasiswa ?? "M").charAt(0).toUpperCase()}</div>
                                                            <div>
                                                                <div className="kd-testi-nama">{u.nama_mahasiswa ?? "Mahasiswa"}</div>
                                                                <div className="kd-testi-sub">{u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "—"}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <KonselorNotifSection kid={kid} user={user} />
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