import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import "../styles/auth.css";

export default function Register() {
  const navigate    = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Yuk lengkapi dulu semua datanya");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter ya.");
      return;
    }

    setLoading(true);

    const emailLower = email.toLowerCase();

    const suffix    = Date.now().toString().slice(-6);
    const studentId = `M-${suffix}`;


    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama:       name,
          name:       name,
          role:       "mahasiswa",
          student_id: studentId,
        },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("Email ini sudah terdaftar. Coba masuk aja ya");
      } else {
        setError("Gagal membuat akun. Coba lagi ya.");
      }
      setLoading(false);
      return;
    }

    // Supabase mengirim email konfirmasi jika fitur itu aktif.
    // authData.user ada tapi session null = email belum dikonfirmasi.
    const needsConfirmation = authData.user && !authData.session;

    await supabase
      .from("profil_pengguna")
      .upsert(
        {
          email:      emailLower,
          nama:       name,
          role:       "mahasiswa",
          student_id: studentId,  
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    setLoading(false);

    if (needsConfirmation) {
      // Jangan auto-login — arahkan ke halaman login dengan pesan
      navigate("/login", {
        replace: true,
        state: { notice: `Akun berhasil dibuat! Cek email ${emailLower} untuk konfirmasi, lalu login.` },
      });
      return;
    }

    // Jika tidak perlu konfirmasi (email confirmation dimatikan di Supabase),
    // simpan session dan langsung masuk
    localStorage.setItem("sanctuary_user", JSON.stringify({
      id:         authData.user.id,
      name,
      nama:       name,
      email:      emailLower,
      role:       "mahasiswa",
      konselorId: null,
      student_id: studentId,
    }));

    navigate("/", { replace: true });
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel-left">
        <div className="auth-overlay" />
        <div className="auth-left-brand">
          <span className="auth-logo auth-logo--light">The Sanctuary</span>
        </div>
        <div className="auth-left-copy">
          <h2 className="auth-left-h2">Yuk mulai<br />perjalananmu<br />di ruang aman ini</h2>
          <p className="auth-left-p">Tempat untuk berbagi cerita, mengenal diri sendiri, dan tumbuh pelan-pelan tanpa harus merasa sendirian.</p>
        </div>
        <div className="auth-left-footer">© 2026 THE SANCTUARY</div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-h1">Hai,<br />senang kamu<br />ada di sini</h1>
            <p className="auth-form-sub">Buat akun dulu yuk supaya kamu bisa mengakses ruang konseling sebaya dan fitur personal lainnya.</p>
          </div>

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field">
              <label className="auth-label">Nama Lengkap</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Nama lengkap kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Alamat Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Buat Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  className="auth-input"
                  placeholder="Minimal 6 karakter"
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

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className={`auth-submit ${loading ? "auth-submit--loading" : ""}`}
              disabled={loading}
            >
              {loading ? <span className="auth-spinner" /> : <>Buat Akun Sekarang</>}
            </button>
          </form>

          <p className="auth-switch" style={{ textAlign: "center", marginTop: "20px" }}>
            Sudah punya akun?{" "}
            <span className="auth-switch-link" onClick={() => navigate("/login")}>Masuk di sini</span>
          </p>

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