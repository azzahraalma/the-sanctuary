import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";

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
import AdminDashboard from "./pages/AdminDashboard.jsx";

// [FIX] Tambah state loading agar guard tidak redirect saat user sedang di-fetch.
// Sebelumnya: user=null langsung dianggap "belum login", padahal bisa jadi
// sedang menunggu hasil fetch profil dari Supabase (race condition).
function useCurrentUser() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  });
  // Selalu ready dari awal — gunakan localStorage sebagai source of truth.
  // Supabase session di-sync di background, tidak memblokir render.
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    // Listener untuk login, logout, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        localStorage.removeItem("sanctuary_user");
        setUser(null);
        return;
      }

      // Kalau localStorage sudah terisi (dari login.jsx), pakai itu
      try {
        const stored = JSON.parse(localStorage.getItem("sanctuary_user"));
        if (stored?.email) {
          setUser(stored);
          return;
        }
      } catch { /* ignore */ }

      // Fallback: fetch profil dari Supabase
      try {
        const { data: profil } = await supabase
          .from("profil_pengguna")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

        const userData = {
          id:         session.user.id,
          email:      session.user.email,
          nama:       profil?.nama        ?? session.user.user_metadata?.nama        ?? session.user.email.split("@")[0],
          name:       profil?.nama        ?? session.user.user_metadata?.nama        ?? session.user.email.split("@")[0],
          role:       profil?.role        ?? session.user.user_metadata?.role        ?? "mahasiswa",
          konselorId: profil?.konselor_id ?? null,
          student_id: profil?.student_id  ?? session.user.user_metadata?.student_id ?? null,
        };

        localStorage.setItem("sanctuary_user", JSON.stringify(userData));
        setUser(userData);
      } catch {
        setUser({ id: session.user.id, email: session.user.email, role: "mahasiswa" });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isReady };
}

/* =========================
   ROUTE GUARDS
========================= */

// Tampilkan layar kosong saat auth sedang di-resolve agar tidak flicker
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
  if (!isReady) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "konselor") return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ user, isReady, children }) {
  if (!isReady) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AuthRoute({ user, isReady, children }) {
  if (!isReady) return <AuthLoader />;
  if (!user) return children;
  if (user.role === "admin")    return <Navigate to="/admin-dashboard" replace />;
  if (user.role === "konselor") return <Navigate to="/konselor-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

/* =========================
   APP
========================= */

export default function App() {
  const { user, isReady } = useCurrentUser();

  return (
    <BrowserRouter>
      <Routes>

        {/* ================= HOME ================= */}
        <Route path="/" element={<Home />} />

        {/* ================= AUTH ================= */}
        <Route path="/login"    element={<AuthRoute user={user} isReady={isReady}><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute user={user} isReady={isReady}><Register /></AuthRoute>} />

        {/* ================= MAHASISWA ================= */}
        <Route path="/dashboard"  element={<ProtectedRoute user={user} isReady={isReady}><Dashboard /></ProtectedRoute>} />
        <Route path="/kuesioner"  element={<ProtectedRoute user={user} isReady={isReady}><Kuesioner /></ProtectedRoute>} />
        <Route path="/statistik"  element={<ProtectedRoute user={user} isReady={isReady}><Statistik /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute user={user} isReady={isReady}><Settings /></ProtectedRoute>} />
        <Route path="/riwayat"    element={<ProtectedRoute user={user} isReady={isReady}><RiwayatSesi /></ProtectedRoute>} />
        <Route path="/notifikasi" element={<ProtectedRoute user={user} isReady={isReady}><Notifikasi /></ProtectedRoute>} />

        {/* ================= KONSELOR ================= */}
        <Route path="/konselor"            element={<ProtectedRoute user={user} isReady={isReady}><Konselor /></ProtectedRoute>} />
        <Route path="/konselor/:id"        element={<ProtectedRoute user={user} isReady={isReady}><KonselorDetail /></ProtectedRoute>} />
        <Route path="/konselor-dashboard"  element={<KonselorRoute  user={user} isReady={isReady}><KonselorDashboard /></KonselorRoute>} />

        {/* ================= SESI ================= */}
        <Route path="/sesi/:bookingId"     element={<ProtectedRoute user={user} isReady={isReady}><SesiKonseling /></ProtectedRoute>} />

        {/* ================= EVALUASI SESI ================= */}
        <Route path="/evaluasi/:bookingId" element={<ProtectedRoute user={user} isReady={isReady}><EvaluasiSesi /></ProtectedRoute>} />

        {/* ================= ADMIN ================= */}
        <Route path="/admin-dashboard" element={<AdminRoute user={user} isReady={isReady}><AdminDashboard /></AdminRoute>} />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}