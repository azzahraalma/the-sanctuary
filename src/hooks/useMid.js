// hooks/useMid.js
// Ambil student_id: coba dari localStorage dulu, fallback ke Supabase.
// Dipakai di Dashboard, Statistik, dan Riwayat agar konsisten.

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useMid(userEmail) {
  const [mid, setMid]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }

    // Coba ambil dari localStorage dulu (sudah diset saat login/register)
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) {
        setMid(saved.student_id);
        setLoading(false);
        return;                   // ← tidak perlu hit Supabase
      }
    } catch { /* ignore */ }

    // Fallback: fetch dari profil_pengguna (user lama yang belum re-login)
    (async () => {
      const { data } = await supabase
        .from("profil_pengguna")
        .select("student_id")
        .eq("email", userEmail)
        .maybeSingle();
      setMid(data?.student_id ?? null);
      setLoading(false);
    })();
  }, [userEmail]);

  return { mid, loading };
}