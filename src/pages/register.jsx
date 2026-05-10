import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Lengkapi semua kolom dulu ya."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }

    setLoading(true);
    // Simulasi register — ganti dengan API call nyata
    setTimeout(() => {
      localStorage.setItem("sanctuary_user", JSON.stringify({ email, name }));
      setLoading(false);
      navigate("/");
    }, 1000);
  };

  return (
    <div className="reg-shell">
      {/* Background foto gunung/alam */}
      <img src="/mountain.jpg" alt="" className="reg-bg-img" />
      <div className="reg-overlay" />

      {/* Brand top-left */}
      <div className="reg-brand">
        <span className="auth-logo auth-logo--light">The Sanctuary</span>
      </div>

      {/* Card register di tengah kanan */}
      <div className="reg-card-wrap">
        <div className="reg-card">

          <div className="reg-card-header">
            <h1 className="reg-card-h1">Ciptakan Ruang Kedamaian Anda</h1>
            <p className="reg-card-sub">Tarik napas dalam-dalam. Mari mulai dari hal-hal dasar.</p>
          </div>

          <form className="auth-form" onSubmit={handleRegister}>

            <div className="reg-field-row">
              <div className="auth-field">
                <label className="auth-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Evelyn Harper"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Alamat Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Buat Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className={`auth-submit ${loading ? "auth-submit--loading" : ""}`} disabled={loading}>
              {loading ? <span className="auth-spinner" /> : <>Mulai Perjalanan Anda →</>}
            </button>

          </form>

          <p className="auth-switch" style={{ textAlign: "center", marginTop: "20px" }}>
            Sudah memiliki tempat disini?{" "}
            <span className="auth-switch-link" onClick={() => navigate("/login")}>
              Sign in
            </span>
          </p>

        </div>
      </div>

      {/* Feature bullets bawah kiri */}
      <div className="reg-features">
        <div className="reg-feat-item">
          <div className="reg-feat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span>Mindfulness Berbasis Bukti Ilmiah</span>
        </div>
        <div className="reg-feat-item">
          <div className="reg-feat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <span>Ketangguhan Mental dengan Bimbingan Profesional</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="reg-footer">
        <div className="reg-footer-brand">
          <span className="auth-logo">The Sanctuary.</span>
          <p className="reg-footer-copy">© 2026 The Sanctuary. A space for resilient horizons.</p>
        </div>
        <div className="reg-footer-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact Support</span>
          <span>Our Methodology</span>
        </div>
      </footer>

    </div>
  );
}