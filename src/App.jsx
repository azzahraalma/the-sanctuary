import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Konselor from "./pages/konselor";
import Statistik from "./pages/statistik";
import Kuesioner from "./pages/kuesioner";
import KonselorDetail from "./pages/KonselorDetail";
import KonselorDashboard from "./pages/KonselorDashboard";
import Settings from "./pages/settings";
// ─── HELPERS ──────────────────────────────────────────────────────

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("sanctuary_user"));
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getUser();
}

function isKonselor() {
  const user = getUser();
  return user?.role === "konselor";
}

// ─── ROUTE GUARDS ─────────────────────────────────────────────────

/** Hanya user yang sudah login yang bisa masuk */
function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

/** Hanya konselor yang bisa masuk — selain itu redirect ke /dashboard */
function KonselorRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isKonselor()) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Kalau sudah login, jangan tampilkan halaman login/register lagi */
function AuthRoute({ children }) {
  if (!isLoggedIn()) return children;
  // Kalau konselor, langsung ke dashboard konselor
  return isKonselor()
    ? <Navigate to="/konselor-dashboard" replace />
    : <Navigate to="/" replace />;
}

// ─── APP ──────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Dashboard mahasiswa */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kuesioner"
          element={
            <ProtectedRoute>
              <Kuesioner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/statistik"
          element={
            <ProtectedRoute>
              <Statistik />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/konselor"
          element={
            <ProtectedRoute>
              <Konselor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/konselor/:id"
          element={
            <ProtectedRoute>
              <KonselorDetail />
            </ProtectedRoute>
          }
        />

        {/* Dashboard khusus konselor */}
        <Route
          path="/konselor-dashboard"
          element={
            <KonselorRoute>
              <KonselorDashboard />
            </KonselorRoute>
          }
        />

        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />

        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}