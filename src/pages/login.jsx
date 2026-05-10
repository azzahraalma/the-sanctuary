import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Lengkapi semua kolom dulu ya."); return; }

    setLoading(true);
    // Simulasi auth — ganti dengan API call nyata
    setTimeout(() => {
      // Simpan session
      localStorage.setItem("sanctuary_user", JSON.stringify({ email, name: email.split("@")[0] }));

      // Ambil tujuan asal (kalau ada), lalu hapus
      const redirect = sessionStorage.getItem("redirect_after_login") || "/";
      sessionStorage.removeItem("redirect_after_login");

      setLoading(false);
      navigate(redirect, { replace: true });
    }, 1000);
  };

  return (
    <div className="auth-shell">

      {/* ── KIRI: foto + overlay teks ── */}
      <div className="auth-panel-left">
        <img src="/forest.jpg" alt="" className="auth-bg-img" />
        <div className="auth-overlay" />

        <div className="auth-left-brand">
          <span className="auth-logo">The Sanctuary</span>
        </div>

        <div className="auth-left-copy">
          <h2 className="auth-left-h2">Kembali ke cakrawala<br />ketangguhan Anda</h2>
          <p className="auth-left-p">
            Ruang khusus yang dikurasi untuk kesejahteraan mental Anda. Masuk
            untuk melanjutkan perjalanan Anda di dalam ruang editorial kami.
          </p>
        </div>

        <div className="auth-left-footer">
          © 2026 THE SANCTUARY
        </div>
      </div>

      {/* ── KANAN: form login ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h1 className="auth-form-h1">Selamat datang<br />kembali di ruang<br />ketenangan Anda</h1>
            <p className="auth-form-sub">
              Masukkan detail akun Anda untuk mengakses dashboard dan fitur yang dipersonalisasi.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>

            <div className="auth-field">
              <label className="auth-label">Alamat Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <button type="button" className="auth-forgot">Lupa Kata Kunci?</button>
              </div>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPw(!showPw)}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className={`auth-submit ${loading ? "auth-submit--loading" : ""}`} disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Masuk"}
            </button>

          </form>

          <p className="auth-switch">
            Baru di The Sanctuary?{" "}
            <span className="auth-switch-link" onClick={() => navigate("/register")}>
              Buat akun anda
            </span>
          </p>

          <button className="auth-support-btn" onClick={() => {}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Kontak Dukungan
          </button>

        </div>
      </div>

    </div>
  );
}