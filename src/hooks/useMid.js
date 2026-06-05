// hooks/useMid.js
// Ambil student_id: coba dari localStorage dulu, fallback ke Supabase.
// Dipakai di Dashboard, Statistik, dan Riwayat agar konsisten.

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export function useMid(userEmail) {
  const [mid, setMid] = useState(() => {
    if (!userEmail) return null;
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) {
        return saved.student_id;
      }
    } catch { /* ignore */ }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (!userEmail) return false;
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) {
        return false;
      }
    } catch { /* ignore */ }
    return true;
  });

  useEffect(() => {
    if (!userEmail) return;

    // Jika mid sudah terisi dari localStorage, tidak perlu memanggil Supabase
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) return;
    } catch { /* ignore */ }

    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profil_pengguna")
        .select("student_id")
        .eq("email", userEmail)
        .maybeSingle();
      if (active) {
        setMid(data?.student_id ?? null);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [userEmail]);

  return { mid, loading };
}