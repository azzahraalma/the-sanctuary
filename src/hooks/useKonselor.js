import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { isSelesai, isMenungguEvaluasi, normalizeStatus, BOOKING_STATUS } from "../lib/bookingStatus.js";

function isDibatalkan(status) {
  return normalizeStatus(status) === BOOKING_STATUS.DIBATALKAN;
}

function isKasusSelesai(status) {
  return isSelesai(status) || isMenungguEvaluasi(status);
}

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

      // 1. Fetch semua konselor
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

      // 2. Fetch semua booking sekaligus (satu query)
      const konselorIds = konselor.map((k) => k.id);

      const [
        { data: allBookings },
        { data: allUlasan },
        { data: avSlots, error: errA },
      ] = await Promise.all([
        supabase
          .from("booking")
          .select("id_konselor, status")
          .in("id_konselor", konselorIds),
        supabase
          .from("ulasan_konselor")
          .select("id_konselor, rating")
          .in("id_konselor", konselorIds),
        supabase
          .from("konselor_availability")
          .select("konselor_id, tanggal, jam_mulai")
          .eq("status", "tersedia")
          .gte("tanggal", new Date().toISOString().split("T")[0]),
      ]);

      if (errA) console.warn("Availability fetch gagal:", errA.message);

      // 3. Group booking per konselor
      const bookingMap = {};
      (allBookings ?? []).forEach((b) => {
        if (!bookingMap[b.id_konselor]) bookingMap[b.id_konselor] = [];
        bookingMap[b.id_konselor].push(b);
      });

      // 4. Group ulasan per konselor
      const ulasanMap = {};
      (allUlasan ?? []).forEach((u) => {
        if (!ulasanMap[u.id_konselor]) ulasanMap[u.id_konselor] = [];
        ulasanMap[u.id_konselor].push(u);
      });

      // 5. Group slot per konselor
      const slotMap = {};
      (avSlots ?? []).forEach((s) => {
        if (!slotMap[s.konselor_id]) slotMap[s.konselor_id] = [];
        slotMap[s.konselor_id].push(s);
      });

      // 6. Hitung stats live per konselor
      const normalized = konselor.map((k) => {
        const bookings = (bookingMap[k.id] ?? []).filter((b) => !isDibatalkan(b.status));
        const total    = bookings.length;
        const selesai  = bookings.filter((b) => isKasusSelesai(b.status)).length;
        const successRate = total > 0 ? selesai / total : 0;

        const ratings = (ulasanMap[k.id] ?? [])
          .map((u) => Number(u.rating))
          .filter((r) => r >= 1 && r <= 5);
        const avgUlasan = ratings.length
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

        const ratingFinal = avgUlasan ?? k.rating_final ?? 0;

        return {
          ID: k.id,
          Nama: k.nama,
          Kategori_Masalah: k.kategori_masalah,
          Pengalaman: k.pengalaman,
          "Rating_(Final)": ratingFinal,
          Keramahan: k.keramahan ?? 0,
          Solusi: k.solusi ?? 0,
          Respon: k.respon ?? 0,
          Jumlah_Kasus: total,
          Kasus_Selesai: selesai,
          Success_Rate: successRate,
          image: k.image_url || k.foto_url || "/placeholder-avatar.png",
          bio: k.bio ?? "",
          spesialisasi: k.spesialisasi ?? [],
          availability: hitungLabel(slotMap[k.id] || []),
          slots: slotMap[k.id] || [],
        };
      });

      setData(normalized);
      setLoading(false);
    }

    fetchAll();
  }, []);

  return { data, loading, error };
}