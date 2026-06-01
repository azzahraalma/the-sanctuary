import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Konselor from "./pages/konselor.jsx";
import Statistik from "./pages/statistik.jsx";
import Kuesioner from "./pages/kuesioner.jsx";
import KonselorDetail from "./pages/KonselorDetail.jsx";
import KonselorDashboard from "./pages/KonselorDashboard.jsx";
import Settings from "./pages/settings.jsx";
import RiwayatSesi from "./pages/RiwayatSesi.jsx";
import Notifikasi from "./pages/Notifikasi.jsx";
import SesiKonseling from "./pages/SesiKonseling.jsx";
import EvaluasiSesi from "./pages/EvaluasiSesi.jsx";

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

/* =========================
   ROUTE GUARDS
========================= */

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function KonselorRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (!isKonselor()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AuthRoute({ children }) {
  if (!isLoggedIn()) {
    return children;
  }

  return isKonselor()
    ? <Navigate to="/konselor-dashboard" replace />
    : <Navigate to="/dashboard" replace />;
}

/* =========================
   APP
========================= */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= HOME ================= */}
        <Route path="/" element={<Home />} />

        {/* ================= AUTH ================= */}
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

        {/* ================= MAHASISWA ================= */}
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
          path="/riwayat"
          element={
            <ProtectedRoute>
              <RiwayatSesi />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifikasi"
          element={
            <ProtectedRoute>
              <Notifikasi />
            </ProtectedRoute>
          }
        />

        {/* ================= KONSELOR ================= */}
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

        <Route
          path="/konselor-dashboard"
          element={
            <KonselorRoute>
              <KonselorDashboard />
            </KonselorRoute>
          }
        />

        {/* ================= SESI ================= */}
        <Route
          path="/sesi/:bookingId"
          element={
            <ProtectedRoute>
              <SesiKonseling />
            </ProtectedRoute>
          }
        />

        {/* ================= EVALUASI SESI ================= */}
        <Route
  path="/evaluasi/:bookingId"
  element={
    <ProtectedRoute>
      <EvaluasiSesi />
    </ProtectedRoute>
  }
/>

        {/* ================= FALLBACK ================= */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}