// App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Konselor from "./pages/Konselor";
import Statistik from "./pages/statistik";
import Kuesioner from "./pages/kuesioner";
import KonselorDetail from "./pages/KonselorDetail";

function isLoggedIn() {
  return !!localStorage.getItem("sanctuary_user");
}

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

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