import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import "../styles/auth.css";

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mode, setMode]         = useState("mahasiswa");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Pesan dari halaman register (misal setelah daftar berhasil)
  const notice = location.state?.notice ?? "";

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Masukkan email kamu dulu sebelum reset password ya.");
      return;
    }
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (resetErr) {
      setError("Gagal kirim email reset: " + resetErr.message);
    } else {
      setError("");
      alert(`Link reset password sudah dikirim ke ${email}. Cek inbox atau folder spam ya.`);
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Yuk lengkapi email dan password dulu");
      return;
    }

    setLoading(true);

    // ── 1. Login via Supabase Auth ──────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // Bedakan pesan error berdasarkan penyebabnya
      if (authError?.message?.toLowerCase().includes("email not confirmed")) {
        setError("Email kamu belum dikonfirmasi. Cek inbox atau folder spam ya.");
      } else if (authError?.message?.toLowerCase().includes("invalid login credentials")) {
        setError("Hmm, email atau password kamu belum cocok. Coba cek lagi ya.");
      } else if (authError?.message?.toLowerCase().includes("too many requests")) {
        setError("Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.");
      } else {
        setError(authError?.message ?? "Hmm, email atau password kamu belum cocok. Coba cek lagi ya.");
      }
      setLoading(false);
      return;
    }

    const emailLower = email.toLowerCase();

    // ── 2. Fetch profil dari profil_pengguna ────────────────────
    let { data: profil } = await supabase
      .from("profil_pengguna")
      .select("*")
      .eq("email", emailLower)
      .maybeSingle();

    const role       = profil?.role        ?? authData.user.user_metadata?.role        ?? "mahasiswa";
    const nama       = profil?.nama        ?? authData.user.user_metadata?.nama        ?? emailLower.split("@")[0];
    const konselorId = profil?.konselor_id ?? authData.user.user_metadata?.konselor_id ?? null;

    // ── 3. Validasi role sesuai mode ────────────────────────────
    if (mode === "konselor" && role !== "konselor") {
      setError("Akun ini bukan akun konselor. Coba login sebagai Mahasiswa ya.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    if (mode === "mahasiswa" && role !== "mahasiswa") {
      setError("Akun ini bukan akun mahasiswa. Silakan pilih mode yang sesuai.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    if (mode === "admin" && role !== "admin") {
      setError("Akun ini bukan akun admin.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    let studentId = profil?.student_id ?? null;

    if (!studentId && role === "mahasiswa") {
      const suffix = Date.now().toString().slice(-6);
      studentId = `M-${suffix}`;
    }

    const { data: upserted } = await supabase
      .from("profil_pengguna")
      .upsert(
        {
          email:      emailLower,
          nama,
          role,
          student_id: studentId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select()
      .maybeSingle();

    if (upserted?.student_id) studentId = upserted.student_id;

    // Tulis localStorage SEBELUM navigate agar useCurrentUser di App.jsx
    // selalu dapat data valid saat route guard dievaluasi
    localStorage.setItem("sanctuary_user", JSON.stringify({
      id:         authData.user.id,
      name:       nama,
      nama:       nama,
      email:      emailLower,
      role,
      konselorId,
      student_id: studentId,
    }));

    setLoading(false);

    if (role === "admin") {
      navigate("/admin-dashboard", { replace: true });
    } else if (role === "konselor") {
      navigate("/konselor-dashboard", { replace: true });
    } else {
      const redirect = sessionStorage.getItem("redirect_after_login") || "/dashboard";
      sessionStorage.removeItem("redirect_after_login");
      navigate(redirect, { replace: true });
    }
  };

  const isKonselor = mode === "konselor";
  const isAdmin    = mode === "admin";

  return (
    <div className="auth-shell">
      <div className={`auth-panel-left ${isKonselor ? "auth-panel-left--konselor" : ""} ${isAdmin ? "auth-panel-left--admin" : ""}`}>
        <div className="auth-overlay" />
        <div className="auth-left-brand">
          <span className="auth-logo auth-logo--light">The Sanctuary</span>
        </div>
        <div className="auth-left-copy">
          {isKonselor ? (
            <>
              <h2 className="auth-left-h2">Halo, Konselor!<br />Siap menemani<br />hari ini?</h2>
              <p className="auth-left-p">Terima kasih sudah hadir dan siap mendengarkan. Masuk dulu untuk melihat jadwal dan mahasiswa yang menunggumu.</p>
            </>
          ) : isAdmin ? (
            <>
              <h2 className="auth-left-h2">Halo, Admin!<br />Siap memantau<br />data hari ini?</h2>
              <p className="auth-left-p">Akses dashboard analitik UX dan pantau performa seluruh ekosistem The Sanctuary dari sini.</p>
            </>
          ) : (
            <>
              <h2 className="auth-left-h2">Senang melihat<br />kamu kembali di<br />ruang aman ini</h2>
              <p className="auth-left-p">Tempat kecil untuk beristirahat sejenak, bercerita, dan tumbuh dengan lebih tenang. Masuk dulu yuk, ruangmu sudah menunggu.</p>
            </>
          )}
        </div>
        <div className="auth-left-footer">© 2026 THE SANCTUARY</div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          <div className="auth-mode-toggle">
            <button
              className={`auth-mode-btn ${mode === "mahasiswa" ? "auth-mode-btn--active" : ""}`}
              onClick={() => handleModeSwitch("mahasiswa")}
            >
              Mahasiswa
            </button>
            <button
              className={`auth-mode-btn ${mode === "konselor" ? "auth-mode-btn--active" : ""}`}
              onClick={() => handleModeSwitch("konselor")}
            >
              Konselor
            </button>
            <button
              className={`auth-mode-btn ${mode === "admin" ? "auth-mode-btn--active" : ""}`}
              onClick={() => handleModeSwitch("admin")}
            >
              Admin
            </button>
          </div>

          <div className="auth-form-header">
            <h1 className="auth-form-h1">
              {isKonselor
                ? <>Masuk sebagai<br />Konselor</>
                : isAdmin
                ? <>Masuk sebagai<br />Admin</>
                : <>Halo,<br />selamat datang<br />kembali</>}
            </h1>
            <p className="auth-form-sub">
              {isKonselor
                ? "Masukkan akun konselor kamu untuk mengakses dashboard dan jadwal sesimu."
                : isAdmin
                ? "Masukkan akun admin kamu untuk mengakses dashboard analitik UX."
                : "Masukkan akun kamu untuk lanjut ngobrol, melihat dashboard, dan mengakses ruang yang sudah dipersonalisasi buat kamu."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="auth-label">Alamat Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder={
                  isKonselor ? "email.konselor@sanctuary.com"
                  : isAdmin  ? "admin@sanctuary.com"
                  : "contoh@email.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <button type="button" className="auth-forgot" onClick={handleForgotPassword}>Lupa password?</button>
              </div>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  className="auth-input"
                  placeholder="Masukkan password kamu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {notice && <p className="auth-notice">{notice}</p>}
            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className={`auth-submit ${loading ? "auth-submit--loading" : ""} ${isKonselor ? "auth-submit--konselor" : ""} ${isAdmin ? "auth-submit--admin" : ""}`}
              disabled={loading}
            >
              {loading
                ? <span className="auth-spinner" />
                : isKonselor ? "Masuk sebagai Konselor"
                : isAdmin    ? "Masuk sebagai Admin"
                : "Masuk ke Ruang Saya"}
            </button>
          </form>

          {!isKonselor && !isAdmin && (
            <p className="auth-switch" style={{ textAlign: "center" }}>
              Belum punya akun?{" "}
              <span className="auth-switch-link" onClick={() => navigate("/register")}>Yuk daftar dulu</span>
            </p>
          )}

          <div className="auth-support-wrapper">
            <button className="auth-support-btn" onClick={() => navigate("/")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Balik ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}