import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findUser } from "../data/users";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("mahasiswa"); // "mahasiswa" | "konselor"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset field saat ganti mode
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Yuk lengkapi email dan password dulu 😊");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = findUser(email, password);

      if (!user) {
        setError("Hmm, email atau password kamu belum cocok. Coba cek lagi ya.");
        setLoading(false);
        return;
      }

      // Validasi: role harus sesuai mode yang dipilih
      if (mode === "konselor" && user.role !== "konselor") {
        setError("Akun ini bukan akun konselor. Coba login sebagai Mahasiswa ya.");
        setLoading(false);
        return;
      }
      if (mode === "mahasiswa" && user.role === "konselor") {
        setError("Akun ini adalah akun konselor. Silakan login sebagai Konselor.");
        setLoading(false);
        return;
      }

      localStorage.setItem("sanctuary_user", JSON.stringify(user));
      setLoading(false);

      if (user.role === "konselor") {
        navigate("/konselor-dashboard", { replace: true });
      } else {
        const redirect = sessionStorage.getItem("redirect_after_login") || "/";
        sessionStorage.removeItem("redirect_after_login");
        navigate(redirect, { replace: true });
      }
    }, 800);
  };

  const isKonselor = mode === "konselor";

  return (
    <div className="auth-shell">

      {/* ── PANEL KIRI — berubah sesuai mode ── */}
      <div className={`auth-panel-left ${isKonselor ? "auth-panel-left--konselor" : ""}`}>
        <div className="auth-overlay" />
        <div className="auth-left-brand">
          <span className="auth-logo auth-logo--light">The Sanctuary</span>
        </div>
        <div className="auth-left-copy">
          {isKonselor ? (
            <>
              <h2 className="auth-left-h2">
                Halo, Konselor!<br />
                Siap menemani<br />
                hari ini?
              </h2>
              <p className="auth-left-p">
                Terima kasih sudah hadir dan siap mendengarkan.
                Masuk dulu untuk melihat jadwal dan mahasiswa yang menunggumu.
              </p>
            </>
          ) : (
            <>
              <h2 className="auth-left-h2">
                Senang melihat<br />
                kamu kembali di<br />
                ruang aman ini
              </h2>
              <p className="auth-left-p">
                Tempat kecil untuk beristirahat sejenak, bercerita, dan tumbuh
                dengan lebih tenang. Masuk dulu yuk, ruangmu sudah menunggu.
              </p>
            </>
          )}
        </div>
        <div className="auth-left-footer">© 2026 THE SANCTUARY</div>
      </div>

      {/* ── PANEL KANAN ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">

          {/* ── TOGGLE MODE ── */}
          <div className="auth-mode-toggle">
            <button
              className={`auth-mode-btn ${!isKonselor ? "auth-mode-btn--active" : ""}`}
              onClick={() => handleModeSwitch("mahasiswa")}
            >
              🎓 Mahasiswa
            </button>
            <button
              className={`auth-mode-btn ${isKonselor ? "auth-mode-btn--active" : ""}`}
              onClick={() => handleModeSwitch("konselor")}
            >
              🤝 Konselor
            </button>
          </div>

          <div className="auth-form-header">
            <h1 className="auth-form-h1">
              {isKonselor ? (
                <>Masuk sebagai<br />Konselor ✨</>
              ) : (
                <>Halo,<br />selamat datang<br />kembali ✨</>
              )}
            </h1>
            <p className="auth-form-sub">
              {isKonselor
                ? "Masukkan akun konselor kamu untuk mengakses dashboard dan jadwal sesimu."
                : "Masukkan akun kamu untuk lanjut ngobrol, melihat dashboard, dan mengakses ruang yang sudah dipersonalisasi buat kamu."
              }
            </p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="auth-label">Alamat Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder={isKonselor ? "email.konselor@sanctuary.com" : "contoh@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <button type="button" className="auth-forgot">Lupa password?</button>
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

            <button
              type="submit"
              className={`auth-submit ${loading ? "auth-submit--loading" : ""} ${isKonselor ? "auth-submit--konselor" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : isKonselor ? (
                "Masuk sebagai Konselor"
              ) : (
                "Masuk ke Ruang Saya"
              )}
            </button>
          </form>

          {!isKonselor && (
            <p className="auth-switch" style={{ textAlign: "center" }}>
              Belum punya akun?{" "}
              <span className="auth-switch-link" onClick={() => navigate("/register")}>
                Yuk daftar dulu
              </span>
            </p>
          )}

          <div className="auth-support-wrapper">
            <button className="auth-support-btn" onClick={() => navigate("/")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Balik ke Beranda
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}