import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import "../styles/dashboard.css";
import "../styles/settings.css";
import { supabase } from "../lib/supabase.js";
import { usePushNotif } from "../hooks/usePushNotif.js";

function Toggle({ checked, onChange, disabled }) {
  return (
    <label className="stg-toggle" style={{ opacity: disabled ? 0.5 : 1 }}>
      <input type="checkbox" checked={checked} onChange={e => !disabled && onChange(e.target.checked)} disabled={disabled} />
      <span className="stg-toggle-track"><span className="stg-toggle-thumb" /></span>
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="stg-section">
      <h2 className="stg-section-title">{title}</h2>
      <div className="stg-section-body">{children}</div>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [msg]); 
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

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input className="stg-input" type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ paddingRight: 38 }} />
      <button type="button" onClick={() => setShow(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b8f8c", padding: 2 }}>
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

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: "Lemah",  color: "#ef4444" },
    { label: "Cukup",  color: "#f97316" },
    { label: "Bagus",  color: "#eab308" },
    { label: "Kuat",   color: "#22c55e" },
  ];
  const lvl = levels[score - 1] ?? levels[0];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < score ? lvl.color : "#e0eeec", transition: "background .3s" }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: lvl.color, margin: 0, fontWeight: 600 }}>Kekuatan password: {lvl.label}</p>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  }, []);

  const userName  = user?.nama ?? user?.name ?? "Pengguna";
  const userEmail = (user?.email ?? "").toLowerCase();

  const [displayName, setDisplayName] = useState(userName);
  const [fotoUrl, setFotoUrl]         = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile]       = useState(null);
  const [isEditing, setIsEditing]     = useState(false);
  const [isSaving, setIsSaving]       = useState(false);

  const [pwLama, setPwLama]       = useState("");
  const [pwBaru, setPwBaru]       = useState("");
  const [pwKonfirm, setPwKonfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState("");

  const [pengingat, setPengingat]     = useState(true);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const { status: pushStatus, loading: pushHookLoading, subscribe, unsubscribe } = usePushNotif(userEmail.toLowerCase());

  const [toast, setToast] = useState("");
  const showToast = (msg) => setToast(msg);

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      const { data, error } = await supabase
        .from("profil_pengguna")
        .select("nama, foto_url")
        .eq("email", userEmail)
        .maybeSingle();
      if (error) console.warn("Fetch profil:", error.message);
      if (data?.nama) {
        setDisplayName(data.nama);
        localStorage.setItem("sanctuary_user", JSON.stringify({ ...user, nama: data.nama, name: data.nama }));
      }
      if (data?.foto_url) setFotoUrl(data.foto_url);
    })();
  }, [userEmail]); 

  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      const { data } = await supabase.from("preferensi_notif").select("*").eq("email", userEmail).maybeSingle();
      if (data) setPengingat(data.pengingat_sesi ?? true);
      setNotifLoaded(true);
    })();
  }, [userEmail]);

  const saveNotifPref = async (field, val) => {
    if (!userEmail) return;
    await supabase.from("preferensi_notif").upsert({ email: userEmail, [field]: val }, { onConflict: "email" });
    showToast("Preferensi disimpan ✓");
  };

  const handlePengingat    = (v) => { setPengingat(v); saveNotifPref("pengingat_sesi", v); };

  const handlePushToggle = async () => {
    if (pushLoading || pushHookLoading) return;
    setPushLoading(true);
    if (pushStatus === "subscribed") {
      await unsubscribe();
      await saveNotifPref("push_aktif", false);
      showToast("Push notifikasi dinonaktifkan");
    } else {
      if (pushStatus === "unsupported") {
        showToast("Browser tidak mendukung push notifikasi");
        setPushLoading(false);
        return;
      }
      if (pushStatus === "denied") {
        showToast("Izin notifikasi ditolak di browser");
        setPushLoading(false);
        return;
      }
      await subscribe();
      await saveNotifPref("push_aktif", true);
      showToast("Push notifikasi diaktifkan ✓");
    }
    setPushLoading(false);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!userEmail || !user?.id) {
      showToast("Sesi tidak valid. Silakan login ulang.");
      return;
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      showToast("Nama tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      let uploadedUrl = fotoUrl;
      if (fotoFile) {
        const ext  = fotoFile.name.split(".").pop();
        const path = `${userEmail.replace("@", "_")}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, fotoFile, { upsert: true });
        if (uploadErr) {
          showToast("Gagal upload foto");
          return;
        }
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        uploadedUrl = urlData.publicUrl;
        setFotoUrl(uploadedUrl);
        setFotoPreview(null);
        setFotoFile(null);
      }

      const updatedAt = new Date().toISOString();
      const updatePayload = { nama: trimmedName, updated_at: updatedAt };
      if (uploadedUrl) updatePayload.foto_url = uploadedUrl;

      let saved = false;

      for (const filter of [
        { col: "email", val: userEmail },
        { col: "id", val: user.id },
      ]) {
        const { data, error } = await supabase
          .from("profil_pengguna")
          .update(updatePayload)
          .eq(filter.col, filter.val)
          .select("email")
          .maybeSingle();
        if (error) {
          console.warn(`Update profil via ${filter.col}:`, error.message);
          continue;
        }
        if (data) {
          saved = true;
          break;
        }
      }

      if (!saved) {
        const insertPayload = {
          email: userEmail,
          nama: trimmedName,
          role: user.role ?? "mahasiswa",
          student_id: user.student_id ?? null,
          konselor_id: user.konselorId ?? null,
          updated_at: updatedAt,
        };
        if (user.id) insertPayload.id = user.id;
        if (uploadedUrl) insertPayload.foto_url = uploadedUrl;

        const { error: insertErr } = await supabase
          .from("profil_pengguna")
          .upsert(insertPayload, { onConflict: "email" });
        if (insertErr) throw insertErr;
      }

      const { error: authErr } = await supabase.auth.updateUser({
        data: { nama: trimmedName, name: trimmedName },
      });
      if (authErr) console.warn("Auth metadata update:", authErr.message);

      const updatedUser = {
        ...user,
        email: userEmail,
        name: trimmedName,
        nama: trimmedName,
      };
      if (uploadedUrl) updatedUser.foto_url = uploadedUrl;
      localStorage.setItem("sanctuary_user", JSON.stringify(updatedUser));

      showToast("Profil berhasil diperbarui ✓");
      setIsEditing(false);
    } catch (err) {
      console.error("Save profile error:", err);
      showToast(err?.message ? `Gagal menyimpan: ${err.message}` : "Gagal menyimpan profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGantiPassword = async () => {
    setPwError("");
    if (!pwLama)              { setPwError("Masukkan password lama kamu dulu ya"); return; }
    if (!pwBaru)              { setPwError("Password baru tidak boleh kosong"); return; }
    if (pwBaru.length < 6)   { setPwError("Password baru minimal 6 karakter"); return; }
    if (pwBaru !== pwKonfirm) { setPwError("Konfirmasi password tidak cocok"); return; }
    if (pwBaru === pwLama)    { setPwError("Password baru tidak boleh sama dengan yang lama"); return; }
    setPwLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: userEmail, password: pwLama });
      if (signInErr) { setPwError("Password lama salah. Coba lagi ya"); return; }
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

  const avatarSrc   = fotoPreview ?? fotoUrl;
  const pushChecked = pushStatus === "subscribed";
  const pushLabel   = {
    idle:         "Memeriksa...",
    unsupported:  "Browser tidak mendukung push notif",
    denied:       "Izin notifikasi ditolak — aktifkan di pengaturan browser",
    subscribed:   "Aktif — kamu akan menerima notifikasi langsung",
    unsubscribed: "Nonaktif",
  }[pushStatus] ?? "";

  return (
    <div className="db-shell">
      <Toast msg={toast} onDone={() => setToast("")} />

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

      <main className="db-main">
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
            <button className="db-topbar-cta" onClick={() => navigate("/konselor")}>Temukan Konselor</button>
            <button className="db-icon-btn" onClick={() => navigate("/notifikasi")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="db-avatar" onClick={() => navigate("/dashboard")}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : userName.charAt(0).toUpperCase()
              }
            </div>
          </div>
        </header>

        <div className="db-content">
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
          <div className="stg-page-header">
            <h1 className="stg-page-title">Pengaturan</h1>
            <p className="stg-page-sub">Kelola akun dan preferensi perjalanan konselingmu.</p>
          </div>

          <div className="stg-panels">

            <Section title="Identitas Profil">
              <div className="stg-profile-top">
                <div className="stg-profile-avatar-wrap">
                  <div className="stg-profile-avatar" style={{ overflow: "hidden" }}>
                    {avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : userName.charAt(0).toUpperCase()}
                  </div>
                  {isEditing && (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoChange} />
                      <button className="stg-avatar-change" title="Ganti foto" onClick={() => fileRef.current?.click()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <div className="stg-profile-info">
                  {isEditing ? (
                    <>
                      <div className="stg-profile-row">
                        <div className="stg-profile-field" style={{ flex: 1 }}>
                          <p className="stg-field-label">NAMA TAMPILAN</p>
                          <input className="stg-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nama kamu" style={{ marginTop: 4 }} />
                        </div>
                        <div className="stg-profile-field" style={{ flex: 1 }}>
                          <p className="stg-field-label">EMAIL TERDAFTAR</p>
                          <input className="stg-input" value={userEmail} disabled style={{ marginTop: 4, opacity: 0.55, cursor: "not-allowed" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button className="stg-btn-outline" onClick={handleSaveProfile} disabled={isSaving} style={{ background: "linear-gradient(135deg,#2f7d79,#79d8d1)", color: "#fff", borderColor: "transparent", opacity: isSaving ? 0.6 : 1 }}>
                          {isSaving ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button className="stg-btn-outline" onClick={() => { setIsEditing(false); setDisplayName(userName); setFotoPreview(null); setFotoFile(null); }}>Batal</button>
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
                {!isEditing && <button className="stg-btn-outline stg-btn-sm" onClick={() => setIsEditing(true)}>Edit Profil</button>}
              </div>
            </Section>

            <Section title="Keamanan Akun">
              <div className="stg-grid-2">
                <div className="stg-info-card">
                  <div className="stg-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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
                    {pwKonfirm && (
                      <p style={{ fontSize: 11, margin: 0, fontWeight: 600, color: pwBaru === pwKonfirm ? "#22c55e" : "#ef4444" }}>
                        {pwBaru === pwKonfirm ? "✓ Password cocok" : "✗ Password tidak cocok"}
                      </p>
                    )}
                    {pwError && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626" }}>{pwError}</div>
                    )}
                    <button className="stg-btn-outline stg-btn-sm" onClick={handleGantiPassword} disabled={pwLoading || !pwLama || !pwBaru || !pwKonfirm} style={{ alignSelf: "flex-start", marginTop: 4 }}>
                      {pwLoading ? "Memverifikasi..." : "Perbarui Password"}
                    </button>
                  </div>
                </div>

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
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1a3d3a", margin: 0 }}>{userEmail || "—"}</p>
                  <p className="stg-info-sub">Untuk mengubah email, hubungi tim Sanctuary</p>
                </div>
              </div>
            </Section>

            <Section title="Preferensi Notifikasi">
              <div className="stg-notif-list">
                <div className="stg-notif-item">
                  <div className="stg-notif-info">
                    <p className="stg-notif-title">Pengingat Sesi</p>
                    <p className="stg-notif-sub">Dapatkan pengingat 15 menit sebelum sesi konseling dimulai.</p>
                  </div>
                  <Toggle checked={pengingat} onChange={handlePengingat} disabled={!notifLoaded} />
                </div>

                <div className="stg-notif-item" style={{
                  background: pushChecked ? "linear-gradient(135deg,#f0fffe,#e4f8f6)" : "#fafbfb",
                  border: `1px solid ${pushChecked ? "#b0e8e2" : "#e0eeec"}`,
                  borderRadius: 14, padding: "16px", marginTop: 8,
                }}>
                  <div className="stg-notif-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p className="stg-notif-title" style={{ margin: 0 }}>Push Notification ke Browser / HP</p>
                      {pushChecked && <span style={{ background: "#2f7d79", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: ".5px", padding: "2px 8px", borderRadius: 99 }}>AKTIF</span>}
                      {pushStatus === "denied" && <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 9, fontWeight: 700, letterSpacing: ".5px", padding: "2px 8px", borderRadius: 99 }}>DIBLOKIR</span>}
                    </div>
                    <p className="stg-notif-sub">{pushLabel}</p>
                    {pushStatus === "denied" && <p className="stg-notif-sub" style={{ color: "#dc2626", marginTop: 4 }}>Buka pengaturan browser → izinkan notifikasi untuk situs ini, lalu muat ulang halaman.</p>}
                  </div>
                  <Toggle checked={pushChecked} onChange={handlePushToggle} disabled={pushLoading || pushStatus === "idle" || pushStatus === "unsupported" || pushStatus === "denied"} />
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => navigate("/notifikasi")}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#f0fffe", border: "1px solid #b0e8e2",
                      borderRadius: 10, padding: "10px 16px",
                      fontSize: 13, color: "#2f7d79", fontWeight: 600,
                      cursor: "pointer", width: "100%",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Lihat Semua Notifikasi →
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Keluar">
              <div className="stg-notif-item" style={{ border: "1px solid #fecaca", borderRadius: 12, padding: "16px 18px", background: "#fff9f9" }}>
                <div className="stg-notif-info">
                  <p className="stg-notif-title" style={{ color: "#dc2626" }}>Keluar dari Akun</p>
                  <p className="stg-notif-sub">Kamu akan diarahkan kembali ke halaman masuk.</p>
                </div>
                <button className="stg-btn-outline stg-btn-sm" onClick={handleLogout} style={{ borderColor: "#f87171", color: "#dc2626" }}>Keluar</button>
              </div>
            </Section>

          </div>
        </div>

        <footer className="db-footer">
          <div>
            <span className="db-footer-brand">The Sanctuary</span>
            <p className="db-footer-copy">© 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan</p>
          </div>
          <div className="db-footer-links">
            <span>Kebijakan Privasi</span><span>Syarat dan Ketentuan</span><span>Bantuan</span>
          </div>
        </footer>
      </main>
    </div>
  );
}