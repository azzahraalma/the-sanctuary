import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";

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
import RiwayatSesiAdmin from "./pages/RiwayatSesiAdmin.jsx";
import Notifikasi from "./pages/Notifikasi.jsx";
import SesiKonseling from "./pages/SesiKonseling.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EvaluasiSesi from "./pages/EvaluasiSesi.jsx";

function AuthLoader() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#f0faf9",
    }} />
  );
}

function ProtectedRoute({ user, isReady, children }) {
  if (!isReady) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function KonselorRoute({ user, isReady, children }) {
  if (!isReady) {
    try {
      const cached = JSON.parse(localStorage.getItem("sanctuary_user") || "null");
      if (cached?.role === "konselor") return <AuthLoader />;
      if (cached?.role && cached.role !== "konselor") return <Navigate to="/dashboard" replace />;
    } catch { }
    return <AuthLoader />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "konselor") return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ user, isReady, children }) {
  if (!isReady) {
    try {
      const cached = JSON.parse(localStorage.getItem("sanctuary_user") || "null");
      if (cached?.role === "admin") return <AuthLoader />;
      if (cached?.role && cached.role !== "admin") return <Navigate to="/dashboard" replace />;
    } catch { }
    return <AuthLoader />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AuthRoute({ user, isReady, children }) {
  if (!isReady) return <AuthLoader />;
  if (!user) return children;
  if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
  if (user.role === "konselor") return <Navigate to="/konselor-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { user, isReady } = useAuth();

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<AuthRoute user={user} isReady={isReady}><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute user={user} isReady={isReady}><Register /></AuthRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute user={user} isReady={isReady}><Dashboard /></ProtectedRoute>} />
        <Route path="/kuesioner" element={<ProtectedRoute user={user} isReady={isReady}><Kuesioner /></ProtectedRoute>} />
        <Route path="/statistik" element={<ProtectedRoute user={user} isReady={isReady}><Statistik /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} isReady={isReady}><Settings /></ProtectedRoute>} />
        <Route path="/riwayat" element={<ProtectedRoute user={user} isReady={isReady}><RiwayatSesi /></ProtectedRoute>} />
        <Route path="/notifikasi" element={<ProtectedRoute user={user} isReady={isReady}><Notifikasi /></ProtectedRoute>} />

        <Route path="/konselor" element={<ProtectedRoute user={user} isReady={isReady}><Konselor /></ProtectedRoute>} />
        <Route path="/konselor/:id" element={<ProtectedRoute user={user} isReady={isReady}><KonselorDetail /></ProtectedRoute>} />
        <Route path="/konselor-dashboard" element={<KonselorRoute user={user} isReady={isReady}><KonselorDashboard /></KonselorRoute>} />

        <Route path="/sesi/:bookingId" element={<ProtectedRoute user={user} isReady={isReady}><SesiKonseling /></ProtectedRoute>} />
        <Route path="/evaluasi/:bookingId" element={<KonselorRoute user={user} isReady={isReady}><EvaluasiSesi /></KonselorRoute>} />

        <Route path="/admin-dashboard" element={<AdminRoute user={user} isReady={isReady}><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/riwayat" element={<AdminRoute user={user} isReady={isReady}><RiwayatSesiAdmin /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/evaluasi-sesi/:bookingId" element={<EvaluasiSesi />} />

      </Routes>
    </BrowserRouter>
  );
}
