// src/hooks/useKonselor.js
// Fetch data konselor + availability real dari Supabase

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

// Hitung label availability dari array slot tanggal+jam
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

    // Sesi malam: jam mulai >= 18:00
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

      // ── 1. Fetch data konselor ──────────────────────────────────────────────
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

      // ── 2. Fetch availability (hanya slot yang belum lewat) ────────────────
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: avSlots, error: errA } = await supabase
        .from("konselor_availability")
        .select("konselor_id, tanggal, jam_mulai")
        .eq("status", "tersedia")
        .gte("tanggal", todayStr);

      if (errA) {
        // Availability gagal fetch — tetap tampilkan konselor, tanpa label
        console.warn("Availability fetch gagal:", errA.message);
      }

      // ── 3. Kelompokkan slot per konselor_id ───────────────────────────────
      const slotMap = {};
      (avSlots || []).forEach((s) => {
        if (!slotMap[s.konselor_id]) slotMap[s.konselor_id] = [];
        slotMap[s.konselor_id].push(s);
      });

      // ── 4. Normalize + gabungkan ──────────────────────────────────────────
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
        // Label availability yang dihitung dari slot nyata
        availability: hitungLabel(slotMap[k.id] || []),
        // Slot mentah kalau halaman detail butuh tampilkan jadwal lengkap
        slots: slotMap[k.id] || [],
      }));

      setData(normalized);
      setLoading(false);
    }

    fetchAll();
  }, []);

  return { data, loading, error };
}