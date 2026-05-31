/* ─────────────────────────────────────────────────────────────────
   Settings.jsx — The Sanctuary
   • Profil (tanpa bio)
   • Ganti password dengan verifikasi password lama
   • Preferensi notifikasi → Supabase
   • Web Push (subscribe/unsubscribe) via usePushNotif hook
───────────────────────────────────────────────────────────────── */

import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import "../styles/dashboard.css";
import "../styles/settings.css";
import { supabase } from "../lib/supabase";
import { usePushNotif } from "../hooks/usePushNotif";

// ─── Toggle ───────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <label className="stg-toggle" style={{ opacity: disabled ? 0.5 : 1 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="stg-toggle-track">
        <span className="stg-toggle-thumb" />
      </span>
    </label>
  );
}

// ─── Section ──────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="stg-section">
      <h2 className="stg-section-title">{title}</h2>
      <div className="stg-section-body">{children}</div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [msg]); // eslint-disable-line
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: "linear-gradient(135deg,#2f7d79,#79d8d1)",
      color: "#fff", padding: "12px 20px", borderRadius: 12,
      fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      animation: "stgFadeUp .3s ease",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {msg}
    </div>
  );
}

// ─── Input Password dengan show/hide ─────────────────────────────
function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="stg-input"
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingRight: 38 }}
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "#6b8f8c", padding: 2,
        }}
      >
        {show ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Strength bar password ────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8)         score++;
  if (/[A-Z]/.test(password))       score++;
  if (/[0-9]/.test(password))       score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Lemah",   color: "#ef4444" },
    { label: "Cukup",   color: "#f97316" },
    { label: "Bagus",   color: "#eab308" },
    { label: "Kuat",    color: "#22c55e" },
  ];
  const lvl = levels[score - 1] ?? levels[0];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i < score ? lvl.color : "#e0eeec",
            transition: "background .3s",
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: lvl.color, margin: 0, fontWeight: 600 }}>
        Kekuatan password: {lvl.label}
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
export default function Settings() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  }, []);

  const userName  = user?.nama ?? user?.name ?? "Pengguna";
  const userEmail = user?.email ?? "";

  // ── Profil ──────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(userName);
  const [isEditing, setIsEditing]     = useState(false);
  const [isSaving, setIsSaving]       = useState(false);

  // ── Password ────────────────────────────────────────────────────
  const [pwLama, setPwLama]     = useState("");
  const [pwBaru, setPwBaru]     = useState("");
  const [pwKonfirm, setPwKonfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]   = useState("");

  // ── Notifikasi preferensi ───────────────────────────────────────
  const [pengingat, setPengingat]         = useState(true);
  const [komunitas, setKomunitas]         = useState(true);
  const [pesanLangsung, setPesanLangsung] = useState(false);
  const [notifLoaded, setNotifLoaded]     = useState(false);

  // ── Push notif hook ─────────────────────────────────────────────
  const { status: pushStatus, loading: pushLoading, subscribe, unsubscribe } = usePushNotif(userEmail);

  // ── Toast ───────────────────────────────────────────────────────
  const [toast, setToast] = useState("");
  const showToast = (msg) => setToast(msg);

  const handleLogout = () => {
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  // ── Load preferensi notif ───────────────────────────────────────
  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      const { data } = await supabase
        .from("preferensi_notif")
        .select("*")
        .eq("email", userEmail)
        .maybeSingle();
      if (data) {
        setPengingat(data.pengingat_sesi ?? true);
        setKomunitas(data.komunitas ?? true);
        setPesanLangsung(data.pesan_langsung ?? false);
      }
      setNotifLoaded(true);
    })();
  }, [userEmail]);

  // ── Simpan preferensi notif ─────────────────────────────────────
  const saveNotifPref = async (field, val) => {
    if (!userEmail) return;
    await supabase
      .from("preferensi_notif")
      .upsert({ email: userEmail, [field]: val }, { onConflict: "email" });
    showToast("Preferensi disimpan ✓");
  };

  const handlePengingat     = (v) => { setPengingat(v);     saveNotifPref("pengingat_sesi", v); };
  const handleKomunitas     = (v) => { setKomunitas(v);     saveNotifPref("komunitas", v); };
  const handlePesanLangsung = (v) => { setPesanLangsung(v); saveNotifPref("pesan_langsung", v); };

  // ── Simpan profil ───────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!userEmail) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profil_pengguna")
      .upsert({ email: userEmail, nama: displayName }, { onConflict: "email" });
    if (!error) {
      localStorage.setItem("sanctuary_user", JSON.stringify({ ...user, name: displayName, nama: displayName }));
      showToast("Profil berhasil diperbarui ✓");
      setIsEditing(false);
    } else {
      showToast("Gagal menyimpan profil 😢");
    }
    setIsSaving(false);
  };

  // ── Ganti password dengan verifikasi password lama ──────────────
  const handleGantiPassword = async () => {
    setPwError("");
    if (!pwLama)                     { setPwError("Masukkan password lama kamu dulu ya"); return; }
    if (!pwBaru)                     { setPwError("Password baru tidak boleh kosong"); return; }
    if (pwBaru.length < 6)           { setPwError("Password baru minimal 6 karakter"); return; }
    if (pwBaru !== pwKonfirm)        { setPwError("Konfirmasi password tidak cocok"); return; }
    if (pwBaru === pwLama)           { setPwError("Password baru tidak boleh sama dengan yang lama"); return; }

    setPwLoading(true);
    try {
      // 1. Verifikasi password lama — sign in ulang dengan kredensial yang sama
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    userEmail,
        password: pwLama,
      });

      if (signInErr) {
        setPwError("Password lama salah. Coba lagi ya 😅");
        setPwLoading(false);
        return;
      }

      // 2. Kalau berhasil verify → update password
      const { error: updateErr } = await supabase.auth.updateUser({ password: pwBaru });
      if (updateErr) throw updateErr;

      showToast("Password berhasil diubah ✓");
      setPwLama(""); setPwBaru(""); setPwKonfirm("");
    } catch (err) {
      setPwError("Terjadi kesalahan. Coba beberapa saat lagi.");
      console.error(err);
    } finally {
      setPwLoading(false);
    }
  };

  // ── Push notif toggle handler ───────────────────────────────────
  const handlePushToggle = async () => {
    if (pushStatus === "subscribed") {
      await unsubscribe();
      showToast("Notifikasi push dinonaktifkan");
    } else {
      await subscribe();
      if (pushStatus !== "denied") showToast("Notifikasi push diaktifkan ✓");
    }
  };

  // ── Sync profil dari Supabase ──────────────────────────────────
useEffect(() => {
  if (!userEmail) return;
  (async () => {
    const { data } = await supabase
      .from("profil_pengguna")
      .select("nama")
      .eq("email", userEmail)
      .maybeSingle();
    if (data?.nama) {
      setDisplayName(data.nama);
      localStorage.setItem(
        "sanctuary_user",
        JSON.stringify({ ...user, nama: data.nama, name: data.nama })
      );
    }
  })();
}, [userEmail]);

  // ── Push status label ───────────────────────────────────────────
  const pushLabel = {
    idle:          "Memeriksa...",
    unsupported:   "Browser tidak mendukung push notif",
    denied:        "Izin notifikasi ditolak — aktifkan di pengaturan browser",
    subscribed:    "Aktif — kamu akan menerima notifikasi langsung",
    unsubscribed:  "Nonaktif",
  }[pushStatus] ?? "";

  const pushChecked = pushStatus === "subscribed";

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="db-shell">
      <Toast msg={toast} onDone={() => setToast("")} />

      {/* ── SIDEBAR ── */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <span className="db-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          <nav className="db-nav">
            <div className="db-nav-item" onClick={() => navigate("/dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Beranda
            </div>
            <div className="db-nav-item" onClick={() => navigate("/statistik")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Statistik
            </div>
            <div className="db-nav-item" onClick={() => navigate("/riwayat")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Riwayat Sesi
            </div>
            <div className="db-nav-item db-nav-item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
              Pengaturan
            </div>
          </nav>
        </div>
        <button className="db-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="db-main">

        {/* ── TOPBAR ── */}
        <header className="db-topbar">
          <div className="db-topbar-l">
            <span className="db-topbar-logo" onClick={() => navigate("/")}>The Sanctuary</span>
            <nav className="db-topbar-nav">
              <span onClick={() => navigate("/")}>Beranda</span>
              <span onClick={() => navigate("/konselor")}>Konselor</span>
              <span onClick={() => navigate("/dashboard")}>Dashboard</span>
            </nav>
          </div>
          <div className="db-topbar-r">
            <button className="db-topbar-cta" onClick={() => navigate("/konselor")}>Cari Teman Cerita</button>
            <button className="db-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="db-avatar" onClick={() => navigate("/dashboard")}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="db-content">

          <div className="stg-page-header">
            <h1 className="stg-page-title">Pengaturan</h1>
            <p className="stg-page-sub">Kelola akun dan preferensi perjalanan konselingmu.</p>
          </div>

          <div className="stg-panels">

            {/* ══ 1. IDENTITAS PROFIL ══ */}
            <Section title="Identitas Profil">
              <div className="stg-profile-top">
                <div className="stg-profile-avatar-wrap">
                  <div className="stg-profile-avatar">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <button className="stg-avatar-change" title="Ganti foto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                </div>

                <div className="stg-profile-info">
                  {isEditing ? (
                    <>
                      <div className="stg-profile-row">
                        <div className="stg-profile-field" style={{ flex: 1 }}>
                          <p className="stg-field-label">NAMA TAMPILAN</p>
                          <input
                            className="stg-input"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Nama kamu"
                            style={{ marginTop: 4 }}
                          />
                        </div>
                        <div className="stg-profile-field" style={{ flex: 1 }}>
                          <p className="stg-field-label">EMAIL TERDAFTAR</p>
                          <input
                            className="stg-input"
                            value={userEmail}
                            disabled
                            style={{ marginTop: 4, opacity: 0.55, cursor: "not-allowed" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button
                          className="stg-btn-outline"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          style={{
                            background: "linear-gradient(135deg,#2f7d79,#79d8d1)",
                            color: "#fff", borderColor: "transparent",
                            opacity: isSaving ? 0.6 : 1,
                          }}
                        >
                          {isSaving ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button className="stg-btn-outline" onClick={() => { setIsEditing(false); setDisplayName(userName); }}>
                          Batal
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="stg-profile-row">
                      <div className="stg-profile-field">
                        <p className="stg-field-label">NAMA TAMPILAN</p>
                        <p className="stg-field-val">{displayName}</p>
                      </div>
                      <div className="stg-profile-field">
                        <p className="stg-field-label">EMAIL TERDAFTAR</p>
                        <p className="stg-field-val">{userEmail || "—"}</p>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <button className="stg-btn-outline stg-btn-sm" onClick={() => setIsEditing(true)}>
                    Edit Profil
                  </button>
                )}
              </div>
            </Section>

            {/* ══ 2. KEAMANAN AKUN ══ */}
            <Section title="Keamanan Akun">
              <div className="stg-grid-2">

                {/* Ganti Password */}
                <div className="stg-info-card">
                  <div className="stg-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="stg-info-title">Ganti Password</p>
                    <p className="stg-info-sub">Verifikasi password lama sebelum membuat yang baru</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <PasswordInput value={pwLama} onChange={setPwLama} placeholder="Password lama" />
                    <PasswordInput value={pwBaru} onChange={setPwBaru} placeholder="Password baru" />
                    <PasswordStrength password={pwBaru} />
                    <PasswordInput value={pwKonfirm} onChange={setPwKonfirm} placeholder="Konfirmasi password baru" />

                    {/* Indikator cocok/tidak */}
                    {pwKonfirm && (
                      <p style={{
                        fontSize: 11, margin: 0, fontWeight: 600,
                        color: pwBaru === pwKonfirm ? "#22c55e" : "#ef4444",
                      }}>
                        {pwBaru === pwKonfirm ? "✓ Password cocok" : "✗ Password tidak cocok"}
                      </p>
                    )}

                    {/* Error message */}
                    {pwError && (
                      <div style={{
                        background: "#fef2f2", border: "1px solid #fecaca",
                        borderRadius: 8, padding: "8px 12px",
                        fontSize: 12, color: "#dc2626",
                      }}>
                        {pwError}
                      </div>
                    )}

                    <button
                      className="stg-btn-outline stg-btn-sm"
                      onClick={handleGantiPassword}
                      disabled={pwLoading || !pwLama || !pwBaru || !pwKonfirm}
                      style={{ alignSelf: "flex-start", marginTop: 4 }}
                    >
                      {pwLoading ? "Memverifikasi..." : "Perbarui Password"}
                    </button>
                  </div>
                </div>

                {/* Info Email */}
                <div className="stg-info-card">
                  <div className="stg-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <p className="stg-info-title">Alamat Email</p>
                    <p className="stg-info-sub">Email yang terdaftar di akunmu</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1a3d3a", margin: 0 }}>
                    {userEmail || "—"}
                  </p>
                  <p className="stg-info-sub">Untuk mengubah email, hubungi tim Sanctuary</p>
                </div>

              </div>
            </Section>

            {/* ══ 3. PREFERENSI NOTIFIKASI ══ */}
            <Section title="Preferensi Notifikasi">
              <div className="stg-notif-list">

                {/* Pengingat Sesi */}
                <div className="stg-notif-item">
                  <div className="stg-notif-info">
                    <p className="stg-notif-title">Pengingat Sesi</p>
                    <p className="stg-notif-sub">
                      Dapatkan pengingat 15 menit sebelum sesi konseling dimulai.
                    </p>
                  </div>
                  <Toggle checked={pengingat} onChange={handlePengingat} disabled={!notifLoaded} />
                </div>

                {/* Informasi Komunitas */}
                <div className="stg-notif-item">
                  <div className="stg-notif-info">
                    <p className="stg-notif-title">Informasi Komunitas</p>
                    <p className="stg-notif-sub">
                      Ringkasan mingguan: artikel, cerita inspiratif, dan meditasi bersama.
                    </p>
                  </div>
                  <Toggle checked={komunitas} onChange={handleKomunitas} disabled={!notifLoaded} />
                </div>

                {/* Pesan Langsung */}
                <div className="stg-notif-item">
                  <div className="stg-notif-info">
                    <p className="stg-notif-title">Pesan Langsung</p>
                    <p className="stg-notif-sub">
                      Notifikasi ketika konselormu mengirim pesan baru.
                    </p>
                  </div>
                  <Toggle checked={pesanLangsung} onChange={handlePesanLangsung} disabled={!notifLoaded} />
                </div>

                {/* ── Push Notifikasi Beneran ── */}
                <div className="stg-notif-item" style={{
                  background: pushChecked ? "linear-gradient(135deg,#f0fffe,#e4f8f6)" : "#fafbfb",
                  border: `1px solid ${pushChecked ? "#b0e8e2" : "#e0eeec"}`,
                  borderRadius: 14, padding: "16px", marginTop: 8,
                }}>
                  <div className="stg-notif-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p className="stg-notif-title" style={{ margin: 0 }}>Push Notification ke Browser / HP</p>
                      {pushChecked && (
                        <span style={{
                          background: "#2f7d79", color: "#fff",
                          fontSize: 9, fontWeight: 700, letterSpacing: ".5px",
                          padding: "2px 8px", borderRadius: 99,
                        }}>AKTIF</span>
                      )}
                      {pushStatus === "denied" && (
                        <span style={{
                          background: "#fee2e2", color: "#dc2626",
                          fontSize: 9, fontWeight: 700, letterSpacing: ".5px",
                          padding: "2px 8px", borderRadius: 99,
                        }}>DIBLOKIR</span>
                      )}
                    </div>
                    <p className="stg-notif-sub">{pushLabel}</p>
                    {pushStatus === "denied" && (
                      <p className="stg-notif-sub" style={{ color: "#dc2626", marginTop: 4 }}>
                        Buka pengaturan browser → izinkan notifikasi untuk situs ini, lalu muat ulang halaman.
                      </p>
                    )}
                  </div>
                  <Toggle
                    checked={pushChecked}
                    onChange={handlePushToggle}
                    disabled={pushLoading || pushStatus === "idle" || pushStatus === "unsupported" || pushStatus === "denied"}
                  />
                </div>

              </div>
            </Section>

            {/* ══ 4. ZONA BAHAYA ══ */}
            <Section title="Keluar">
              <div className="stg-notif-item" style={{
                border: "1px solid #fecaca", borderRadius: 12,
                padding: "16px 18px", background: "#fff9f9",
              }}>
                <div className="stg-notif-info">
                  <p className="stg-notif-title" style={{ color: "#dc2626" }}>Keluar dari Akun</p>
                  <p className="stg-notif-sub">Kamu akan diarahkan kembali ke halaman masuk.</p>
                </div>
                <button
                  className="stg-btn-outline stg-btn-sm"
                  onClick={handleLogout}
                  style={{ borderColor: "#f87171", color: "#dc2626" }}
                >
                  Keluar
                </button>
              </div>
            </Section>

          </div>{/* /stg-panels */}
        </div>{/* /db-content */}

        {/* ── FOOTER ── */}
        <footer className="db-footer">
          <div>
            <span className="db-footer-brand">The Sanctuary</span>
            <p className="db-footer-copy">© 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan 🌱</p>
          </div>
          <div className="db-footer-links">
            <span>Kebijakan Privasi</span>
            <span>Syarat dan Ketentuan</span>
            <span>Bantuan</span>
          </div>
        </footer>

      </main>
    </div>
  );
}