import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

function buildUserData(session, profil) {
  return {
    id: session.user.id,
    email: session.user.email,
    nama: profil?.nama ?? session.user.user_metadata?.nama ?? session.user.email.split("@")[0],
    name: profil?.nama ?? session.user.user_metadata?.nama ?? session.user.email.split("@")[0],
    role: profil?.role ?? session.user.user_metadata?.role ?? "mahasiswa",
    konselorId: profil?.konselor_id ?? session.user.user_metadata?.konselor_id ?? null,
    student_id: profil?.student_id ?? session.user.user_metadata?.student_id ?? null,
  };
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncUser(session) {
      if (!active) return;

      if (!session) {
        localStorage.removeItem("sanctuary_user");
        setUser(null);
        setIsReady(true);
        return;
      }

      // Kalau sudah ada data valid di localStorage, pakai langsung tanpa re-fetch
      const cached = JSON.parse(localStorage.getItem("sanctuary_user") || "null");
      if (cached?.email === session.user.email && cached?.role) {
        setUser(cached);
        setIsReady(true);
        return;
      }

      try {
        // ... sisa kode fetch profil tetap sama
        const { data: profil } = await supabase
          .from("profil_pengguna")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

        const userData = buildUserData(session, profil);
        localStorage.setItem("sanctuary_user", JSON.stringify(userData));
        setUser(userData);
      } catch {
        const cachedFallback = JSON.parse(localStorage.getItem("sanctuary_user") || "null");
        if (cachedFallback?.email === session.user.email && cachedFallback?.role) {
          setUser(cachedFallback);
        } else {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: "mahasiswa",
          });
        }
      } finally {
        if (active) setIsReady(true);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => syncUser(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isReady };
}
