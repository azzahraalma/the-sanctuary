import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

function syncStudentIdToStorage(studentId) {
  if (!studentId) return;
  try {
    const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
    if (saved && saved.student_id !== studentId) {
      localStorage.setItem("sanctuary_user", JSON.stringify({ ...saved, student_id: studentId }));
    }
  } catch { /* ignore */ }
}

export function useMid(userEmail) {
  const [mid, setMid] = useState(() => {
    if (!userEmail) return null;
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) return saved.student_id;
    } catch { /* ignore */ }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (!userEmail) return false;
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) return false;
    } catch { /* ignore */ }
    return true;
  });

  useEffect(() => {
    if (!userEmail) return;

    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) {
        setMid(saved.student_id);
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profil_pengguna")
        .select("student_id")
        .eq("email", userEmail)
        .maybeSingle();

      if (!active) return;

      const sid = data?.student_id ?? null;
      setMid(sid);
      syncStudentIdToStorage(sid);
      setLoading(false);
    })();

    return () => { active = false; };
  }, [userEmail]);

  return { mid, loading };
}
