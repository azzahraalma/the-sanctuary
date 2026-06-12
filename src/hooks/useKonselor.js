import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

function hitungLabel(slots) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const labels = new Set();

  slots.forEach(({ tanggal, jam_mulai }) => {
    const slotDate = new Date(tanggal);
    slotDate.setHours(0, 0, 0, 0);

    const diffHari = (slotDate - today) / (1000 * 60 * 60 * 24);

    if (diffHari === 0) labels.add("Hari ini");
    if (diffHari >= 0 && diffHari <= 6) labels.add("Minggu ini");

    const [jam] = jam_mulai.split(":").map(Number);
    if (jam >= 18) labels.add("Sesi Malam");
  });

  return [...labels];
}

export function useKonselor() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);

      const { data: konselor, error: errK } = await supabase
        .from("data_konselor")
        .select(`
          id, nama, kategori_masalah, pengalaman,
          rating_final, keramahan, solusi, respon,
          jumlah_kasus, kasus_selesai, success_rate,
          image_url, foto_url, bio, spesialisasi
        `)
        .order("rating_final", { ascending: false });

      if (errK) {
        setError(errK.message);
        setLoading(false);
        return;
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const { data: avSlots, error: errA } = await supabase
        .from("konselor_availability")
        .select("konselor_id, tanggal, jam_mulai")
        .eq("status", "tersedia")
        .gte("tanggal", todayStr);

      if (errA) {
        console.warn("Availability fetch gagal:", errA.message);
      }

      const slotMap = {};
      (avSlots || []).forEach((s) => {
        if (!slotMap[s.konselor_id]) slotMap[s.konselor_id] = [];
        slotMap[s.konselor_id].push(s);
      });

      const normalized = konselor.map((k) => ({
        ID: k.id,
        Nama: k.nama,
        Kategori_Masalah: k.kategori_masalah,
        Pengalaman: k.pengalaman,
        "Rating_(Final)": k.rating_final ?? 0,
        Keramahan: k.keramahan ?? 0,
        Solusi: k.solusi ?? 0,
        Respon: k.respon ?? 0,
        Jumlah_Kasus: k.jumlah_kasus ?? 0,
        Kasus_Selesai: k.kasus_selesai ?? 0,
        Success_Rate: k.success_rate ?? 0,
        image: k.image_url || k.foto_url || "/placeholder-avatar.png",
        bio: k.bio ?? "",
        spesialisasi: k.spesialisasi ?? [],
        availability: hitungLabel(slotMap[k.id] || []),
        slots: slotMap[k.id] || [],
      }));

      setData(normalized);
      setLoading(false);
    }

    fetchAll();
  }, []);

  return { data, loading, error };
}