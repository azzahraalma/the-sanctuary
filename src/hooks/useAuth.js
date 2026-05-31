// src/hooks/useAuth.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  });

  useEffect(() => {
    // Cek session Supabase Auth aktif
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        localStorage.removeItem("sanctuary_user");
        setUser(null);
        return;
      }

      // Fetch profil terbaru dari profil_pengguna
      const { data: profil } = await supabase
        .from("profil_pengguna")
        .select("*")
        .eq("email", session.user.email)
        .maybeSingle();

      const userData = {
        id:         session.user.id,
        email:      session.user.email,
        nama:       profil?.nama ?? session.user.user_metadata?.nama ?? session.user.email.split("@")[0],
        name:       profil?.nama ?? session.user.user_metadata?.nama ?? session.user.email.split("@")[0],
        role:       profil?.role ?? session.user.user_metadata?.role ?? "mahasiswa",
        konselorId: profil?.konselor_id ?? null,
      };

      localStorage.setItem("sanctuary_user", JSON.stringify(userData));
      setUser(userData);
    });

    // Listen perubahan auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        localStorage.removeItem("sanctuary_user");
        setUser(null);
        return;
      }
      if (event === "SIGNED_IN") {
        const { data: profil } = await supabase
          .from("profil_pengguna")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

        const userData = {
          id:         session.user.id,
          email:      session.user.email,
          nama:       profil?.nama ?? session.user.user_metadata?.nama ?? session.user.email.split("@")[0],
          name:       profil?.nama ?? session.user.user_metadata?.nama ?? session.user.email.split("@")[0],
          role:       profil?.role ?? "mahasiswa",
          konselorId: profil?.konselor_id ?? null,
        };

        localStorage.setItem("sanctuary_user", JSON.stringify(userData));
        setUser(userData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return user;
}