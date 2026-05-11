import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isEmailTaken, registerUser } from "../data/users";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Yuk lengkapi dulu semua datanya 😊");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter ya.");
      return;
    }

    if (isEmailTaken(email)) {
      setError("Email ini sudah terdaftar. Coba masuk aja ya ✨");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const user = registerUser(name, email, password);
      localStorage.setItem("sanctuary_user", JSON.stringify(user));
      setLoading(false);
      navigate("/", { replace: true });
    }, 800);
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel-left">
        <div className="auth-overlay" />

        <div className="auth-left-brand">
          <span className="auth-logo auth-logo--light">
            The Sanctuary
          </span>
        </div>

        <div className="auth-left-copy">
          <h2 className="auth-left-h2">
            Yuk mulai<br />
            perjalananmu<br />
            di ruang aman ini
          </h2>

          <p className="auth-left-p">
            Tempat untuk berbagi cerita, mengenal diri sendiri,
            dan tumbuh pelan-pelan tanpa harus merasa sendirian.
          </p>
        </div>

        <div className="auth-left-footer">
          © 2026 THE SANCTUARY
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-h1">
              Hai,<br />
              senang kamu<br />
              ada di sini ✨
            </h1>

            <p className="auth-form-sub">
              Buat akun dulu yuk supaya kamu bisa mengakses
              ruang konseling sebaya dan fitur personal lainnya.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field">
              <label className="auth-label">
                Nama Lengkap
              </label>

              <input
                type="text"
                className="auth-input"
                placeholder="Nama lengkap kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">
                Alamat Email
              </label>

              <input
                type="email"
                className="auth-input"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">
                Buat Password
              </label>

              <input
                type="password"
                className="auth-input"
                placeholder="Buat password kamu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className={`auth-submit ${loading ? "auth-submit--loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>Buat Akun Sekarang</>
              )}
            </button>
          </form>

          <p
            className="auth-switch"
            style={{ textAlign: "center", marginTop: "20px" }}
          >
            Sudah punya akun?{" "}
            <span
              className="auth-switch-link"
              onClick={() => navigate("/login")}
            >
              Masuk di sini
            </span>
          </p>

          <div className="auth-support-wrapper">
            <button
              className="auth-support-btn"
              onClick={() => navigate("/")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
              >
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