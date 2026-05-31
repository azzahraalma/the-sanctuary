import { supabase } from "../lib/supabase";
import data_konselor from "../data/data_konselor";
import data_booking from "../data/data_booking";
import users from "../data/users";

export async function seedAll() {
    const konselorRows = data_konselor.map((k) => ({
        id: k.ID,
        nama: k.Nama,
        kategori_masalah: k.Kategori_Masalah,
        pengalaman: k.Pengalaman,
        rating_final: k["Rating_(Final)"],
        keramahan: k["Keramahan_(30%)"],
        solusi: k["Solusi_(50%)"],
        respon: k["Respon_(20%)"],
        jumlah_kasus: k.Jumlah_Kasus,
        kasus_selesai: k.Kasus_Selesai,
        success_rate: k["Success_Rate"],
        image_url: k.image,
    }));

    const { error: e1 } = await supabase.from("konselor").upsert(konselorRows);
    if (e1) console.error("❌ Konselor:", e1.message);
    else console.log("✅ Konselor selesai!");

    const bookingRows = data_booking
        .filter((b) => b.ID_Booking !== null)
        .map((b) => ({
            id: b.ID_Booking,
            id_konselor: b.ID_Konselor,
            id_mahasiswa: b.ID_Mahasiswa,
            nama_mahasiswa: b.Nama_Mahasiswa,
            kategori_masalah: b.Kategori_Masalah,
            tanggal_sesi: b.Tanggal_Sesi,
            sesi_konseling: b.Sesi_Konseling,
            status: b.Status,
            kondisi_awal: b.Kondisi_Awal,
            kondisi_saat_ini: b.Kondisi_Saat_Ini,
        }));

    const { error: e2 } = await supabase.from("booking").upsert(bookingRows);
    if (e2) console.error("❌ Booking:", e2.message);
    else console.log("✅ Booking selesai!");

    const userRows = users.map((u) => ({
        email: u.email,
        nama: u.nama ?? u.Nama,
        nim: u.nim ?? u.NIM,
        role: u.role ?? "mahasiswa",
        konselor_id: u.konselorId ?? null,
        password: u.password,
    }));

    const { error: e3 } = await supabase.from("users").upsert(userRows, { onConflict: "email" });
    if (e3) console.error("❌ Users:", e3.message);
    else console.log("✅ Users selesai!");
}