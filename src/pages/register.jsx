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
    setTimeout(() => {
      localStorage.setItem("sanctuary_user", JSON.stringify({ email, name }));
      setLoading(false);
      navigate("/");
    }, 1000);
  };

  return (
    <div className="auth-shell">

      {/* ── KIRI ── */}
      <div className="auth-panel-left">
        <div className="auth-overlay" />
        <div className="auth-left-brand">
          <span className="auth-logo auth-logo--light">The Sanctuary</span>
        </div>
        <div className="auth-left-copy">
          <h2 className="auth-left-h2">Ciptakan Ruang<br />Kedamaian Anda</h2>
          <p className="auth-left-p">
            Tarik napas dalam-dalam. Mari mulai dari hal-hal dasar dan 
            bergabung bersama komunitas konseling sebaya Polimedia.
          </p>
        </div>
        <div className="auth-left-footer">© 2026 THE SANCTUARY</div>
      </div>

      {/* ── KANAN ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h1 className="auth-form-h1">Ciptakan Ruang<br />Kedamaian Anda</h1>
            <p className="auth-form-sub">
              Tarik napas dalam-dalam. Mari mulai dari hal-hal dasar.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleRegister}>

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

    </div>
  );
}