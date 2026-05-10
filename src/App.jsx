import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Konselor from "./pages/konselor";

// ── Cek apakah user sudah login (session di localStorage) ──────────
function isLoggedIn() {
  return !!localStorage.getItem("sanctuary_user");
}

// ── ProtectedRoute: halaman yang butuh login ───────────────────────
// Kalau belum login → redirect ke /login
function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

// ── AuthRoute: halaman login/register ─────────────────────────────
// Kalau sudah login → redirect ke / (biar ga balik ke login lagi)
function AuthRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Halaman utama — bisa diakses siapa saja, tapi tombol di dalamnya cek login */}
        <Route path="/" element={<Home />} />

        {/* Dashboard — harus login */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* konselor — harus login */}
        <Route
          path="/konselor"
          element={
            <ProtectedRoute>
              <Konselor />
            </ProtectedRoute>
          }
        />

        {/* Login — kalau sudah login langsung ke home */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />

        {/* Register — kalau sudah login langsung ke home */}
        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}