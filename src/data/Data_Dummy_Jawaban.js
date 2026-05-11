/**
 * data_dummy_jawaban.js
 * Jawaban kuesioner refleksi kesehatan mental mahasiswa
 * M-001 (Prasetyo) TIDAK ADA di sini — dia user prototype yang ngisi sendiri
 *
 * Struktur jawaban:
 *   soal 1, 3, 5 → pilihan_kartu: "a" | "b" | "c" | "d"
 *   soal 2, 4    → slider: 0–100 (angka)
 *
 * Kemudahan (K), Kejelasan (J), DayaTarik (DT) diambil dari data_responden.
 */

const data_dummy_jawaban = [
  // ─── M-002 · Siti Aminah Zulfa · Angkatan 2024 ───────────────────────────
  // K=2 (rendah), J=3 (biasa), DT=4 (baik) → kondisi lumayan berat
  {
    ID_Mahasiswa: "M-002",
    Nama: "Siti Aminah Zulfa",
    NIM: "202601002",
    Angkatan: 2024,
    Kemudahan: 2,
    Kejelasan: 3,
    DayaTarik: 4,
    Keterangan: "Burnout ringan, energi naik-turun",
    jawaban: {
      1: "b", // energi naik-turun
      2: 68,  // agak butuh waktu sendiri
      3: "b", // pikiran rame
      4: 38,  // belum terlalu siap cerita
      5: "c", // sering kebangun
    },
  },

  // ─── M-003 · Budi Santoso · Angkatan 2023 ────────────────────────────────
  // K=1 (sangat rendah), J=2 (buruk), DT=5 (sangat baik)
  // Daya tarik tinggi tapi kejelasan & kemudahan rendah → banyak beban tersembunyi
  {
    ID_Mahasiswa: "M-003",
    Nama: "Budi Santoso",
    NIM: "202601003",
    Angkatan: 2023,
    Kemudahan: 1,
    Kejelasan: 2,
    DayaTarik: 5,
    Keterangan: "Tekanan akademik tinggi",
    jawaban: {
      1: "d", // berat dan sulit bergerak
      2: 80,  // sangat butuh ruang pribadi
      3: "d", // cemas dan nggak tenang
      4: 20,  // belum siap cerita
      5: "d", // tidur buruk banget
    },
  },

  // ─── M-004 · Rina Putri Wahyuni · Angkatan 2022 ──────────────────────────
  // K=3, J=4, DT=5 → kondisi biasa, ada tantangan karier
  {
    ID_Mahasiswa: "M-004",
    Nama: "Rina Putri Wahyuni",
    NIM: "202601004",
    Angkatan: 2022,
    Kemudahan: 3,
    Kejelasan: 4,
    DayaTarik: 5,
    Keterangan: "Galau soal karier & relasi",
    jawaban: {
      1: "b", // naik-turun
      2: 45,  // antara mau ngobrol dan mau sendiri
      3: "b", // pikiran rame
      4: 55,  // agak siap cerita
      5: "b", // tidur lumayan
    },
  },

  // ─── M-005 · Fajar Shidiq Permana · Angkatan 2023 ────────────────────────
  // K=4, J=3, DT=4 → cukup baik tapi ada kecemasan
  {
    ID_Mahasiswa: "M-005",
    Nama: "Fajar Shidiq Permana",
    NIM: "202601005",
    Angkatan: 2023,
    Kemudahan: 4,
    Kejelasan: 3,
    DayaTarik: 4,
    Keterangan: "Cemas & pengelolaan emosi",
    jawaban: {
      1: "c", // lebih pengen menyendiri
      2: 72,  // butuh ketenangan
      3: "d", // cemas dan nggak tenang
      4: 30,  // belum siap terbuka
      5: "c", // sering kebangun
    },
  },

  // ─── M-006 · Dewi Lestari · Angkatan 2024 ────────────────────────────────
  // K=4, J=2, DT=3 → kejelasan rendah, kondisi agak burnout
  {
    ID_Mahasiswa: "M-006",
    Nama: "Dewi Lestari",
    NIM: "202601006",
    Angkatan: 2024,
    Kemudahan: 4,
    Kejelasan: 2,
    DayaTarik: 3,
    Keterangan: "Kelelahan akademik awal",
    jawaban: {
      1: "c", // lebih pengen menyendiri
      2: 60,  // butuh waktu sendiri
      3: "c", // kosong dan hampa
      4: 42,  // ragu-ragu mau cerita
      5: "c", // sering kebangun
    },
  },

  // ─── M-007 · Hendra Gunawan · Angkatan 2023 ──────────────────────────────
  // K=3, J=2, DT=4 → kondisi karier, cukup stabil
  {
    ID_Mahasiswa: "M-007",
    Nama: "Hendra Gunawan",
    NIM: "202601007",
    Angkatan: 2023,
    Kemudahan: 3,
    Kejelasan: 2,
    DayaTarik: 4,
    Keterangan: "Perencanaan karier, cukup stabil",
    jawaban: {
      1: "a", // oke dan stabil
      2: 35,  // masih mau ngobrol
      3: "a", // adem dan jernih
      4: 65,  // cukup siap cerita
      5: "b", // tidur lumayan
    },
  },

  // ─── M-008 · Maya Indah Sari · Angkatan 2022 ─────────────────────────────
  // K=2, J=3, DT=4 → ada masalah emosi/hubungan
  {
    ID_Mahasiswa: "M-008",
    Nama: "Maya Indah Sari",
    NIM: "202601008",
    Angkatan: 2022,
    Kemudahan: 2,
    Kejelasan: 3,
    DayaTarik: 4,
    Keterangan: "Pengelolaan emosi & hubungan",
    jawaban: {
      1: "b", // naik-turun
      2: 55,  // agak butuh sendiri
      3: "d", // cemas
      4: 40,  // belum terlalu siap
      5: "b", // lumayan
    },
  },

  // ─── M-009 · Rizky Ramadhan · Angkatan 2023 ──────────────────────────────
  // K=2, J=2, DT=4 → tekanan keuangan
  {
    ID_Mahasiswa: "M-009",
    Nama: "Rizky Ramadhan",
    NIM: "202601009",
    Angkatan: 2023,
    Kemudahan: 2,
    Kejelasan: 2,
    DayaTarik: 4,
    Keterangan: "Stres finansial, kondisi tertekan",
    jawaban: {
      1: "d", // berat
      2: 75,  // butuh ruang sendiri
      3: "b", // rame di kepala
      4: 25,  // belum siap cerita
      5: "d", // tidur buruk
    },
  },

  // ─── M-010 · Laila Fitriani · Angkatan 2022 ──────────────────────────────
  // K=1, J=5, DT=3 → kejelasan tinggi (self-aware) tapi kemudahan rendah (susah gerak)
  {
    ID_Mahasiswa: "M-010",
    Nama: "Laila Fitriani",
    NIM: "202601010",
    Angkatan: 2022,
    Kemudahan: 1,
    Kejelasan: 5,
    DayaTarik: 3,
    Keterangan: "Self-aware tinggi, galau karier",
    jawaban: {
      1: "b", // naik-turun
      2: 50,  // tengah-tengah
      3: "b", // rame di kepala
      4: 60,  // lumayan siap cerita
      5: "c", // sering kebangun
    },
  },

  // ─── M-011 · Andi Wijaya Kusuma · Angkatan 2024 ──────────────────────────
  // K=2, J=3, DT=4 → burnout akademik
  {
    ID_Mahasiswa: "M-011",
    Nama: "Andi Wijaya Kusuma",
    NIM: "202601011",
    Angkatan: 2024,
    Kemudahan: 2,
    Kejelasan: 3,
    DayaTarik: 4,
    Keterangan: "Burnout akademik, perlu dukungan",
    jawaban: {
      1: "d", // berat dan sulit bergerak
      2: 70,  // butuh sendiri
      3: "c", // kosong dan hampa
      4: 35,  // belum siap
      5: "d", // tidur buruk
    },
  },

  // ─── M-012 · Siska Olivia · Angkatan 2023 ────────────────────────────────
  // K=4, J=3, DT=4 → baru mulai konseling, awal perjalanan
  {
    ID_Mahasiswa: "M-012",
    Nama: "Siska Olivia",
    NIM: "202601012",
    Angkatan: 2023,
    Kemudahan: 4,
    Kejelasan: 3,
    DayaTarik: 4,
    Keterangan: "Baru mulai, burnout ringan",
    jawaban: {
      1: "c", // lebih pengen menyendiri
      2: 62,  // butuh ketenangan
      3: "b", // rame di kepala
      4: 45,  // agak ragu
      5: "c", // sering kebangun
    },
  },

  // ─── M-013 · Bambang Hermawan · Angkatan 2024 ────────────────────────────
  // K=2, J=2, DT=4 → burnout + masalah hubungan
  {
    ID_Mahasiswa: "M-013",
    Nama: "Bambang Hermawan",
    NIM: "202601013",
    Angkatan: 2024,
    Kemudahan: 2,
    Kejelasan: 2,
    DayaTarik: 4,
    Keterangan: "Burnout + konflik hubungan",
    jawaban: {
      1: "d", // berat
      2: 78,  // sangat butuh ruang
      3: "d", // cemas
      4: 22,  // belum siap
      5: "d", // tidur buruk banget
    },
  },

  // ─── M-014 · Putri Ayu Lestari · Angkatan 2022 ───────────────────────────
  // K=3, J=3, DT=3 → kondisi biasa, stabil
  {
    ID_Mahasiswa: "M-014",
    Nama: "Putri Ayu Lestari",
    NIM: "202601014",
    Angkatan: 2022,
    Kemudahan: 3,
    Kejelasan: 3,
    DayaTarik: 3,
    Keterangan: "Kondisi stabil, masalah keuangan",
    jawaban: {
      1: "a", // oke dan stabil
      2: 40,  // masih mau terhubung
      3: "a", // adem dan jernih
      4: 70,  // cukup siap cerita
      5: "b", // lumayan
    },
  },

  // ─── M-015 · Guntur Saputra · Angkatan 2022 ──────────────────────────────
  // K=4, J=4, DT=4 → kondisi baik, masalah relasi ringan
  {
    ID_Mahasiswa: "M-015",
    Nama: "Guntur Saputra",
    NIM: "202601015",
    Angkatan: 2022,
    Kemudahan: 4,
    Kejelasan: 4,
    DayaTarik: 4,
    Keterangan: "Kondisi baik, relasi perlu diperhatikan",
    jawaban: {
      1: "b", // naik-turun
      2: 42,  // antara sendiri dan ngobrol
      3: "b", // rame di kepala
      4: 58,  // agak siap
      5: "b", // lumayan
    },
  },

  // ─── M-016 · Nanda Ardiansyah · Angkatan 2024 ────────────────────────────
  // K=4, J=4, DT=3 → stabil, keuangan jadi pikiran
  {
    ID_Mahasiswa: "M-016",
    Nama: "Nanda Ardiansyah",
    NIM: "202601016",
    Angkatan: 2024,
    Kemudahan: 4,
    Kejelasan: 4,
    DayaTarik: 3,
    Keterangan: "Stabil tapi kepikiran finansial",
    jawaban: {
      1: "b", // naik-turun
      2: 48,  // tengah-tengah
      3: "b", // rame di kepala
      4: 62,  // lumayan siap
      5: "b", // lumayan
    },
  },

  // ─── M-017 · Eka Nurhaliza · Angkatan 2023 ───────────────────────────────
  // K=4, J=5, DT=3 → kejelasan tinggi, ada beban akademik-keluarga
  {
    ID_Mahasiswa: "M-017",
    Nama: "Eka Nurhaliza",
    NIM: "202601017",
    Angkatan: 2023,
    Kemudahan: 4,
    Kejelasan: 5,
    DayaTarik: 3,
    Keterangan: "Beban akademik + dinamika keluarga",
    jawaban: {
      1: "c", // lebih pengen menyendiri
      2: 65,  // butuh sendiri
      3: "c", // kosong dan hampa
      4: 50,  // tengah-tengah
      5: "c", // sering kebangun
    },
  },

  // ─── M-018 · Doni Tata Pradana · Angkatan 2022 ───────────────────────────
  // K=2, J=2, DT=4 → kondisi berat, ada masalah keluarga
  {
    ID_Mahasiswa: "M-018",
    Nama: "Doni Tata Pradana",
    NIM: "202601018",
    Angkatan: 2022,
    Kemudahan: 2,
    Kejelasan: 2,
    DayaTarik: 4,
    Keterangan: "Masalah keluarga, kondisi berat",
    jawaban: {
      1: "d", // berat
      2: 76,  // butuh ruang
      3: "d", // cemas
      4: 28,  // belum siap
      5: "d", // tidur buruk
    },
  },

  // ─── M-019 · Tiara Andini · Angkatan 2024 ────────────────────────────────
  // K=4, J=5, DT=3 → banyak pikiran akademik, tapi progres bagus
  {
    ID_Mahasiswa: "M-019",
    Nama: "Tiara Andini",
    NIM: "202601019",
    Angkatan: 2024,
    Kemudahan: 4,
    Kejelasan: 5,
    DayaTarik: 3,
    Keterangan: "Tekanan akademik, progres bagus",
    jawaban: {
      1: "b", // naik-turun
      2: 58,  // agak butuh sendiri
      3: "b", // rame di kepala
      4: 70,  // cukup siap
      5: "b", // lumayan
    },
  },

  // ─── M-020 · Yusuf Mansyur Ali · Angkatan 2022 ───────────────────────────
  // K=4, J=5, DT=3 → kondisi akademik, masih berjalan
  {
    ID_Mahasiswa: "M-020",
    Nama: "Yusuf Mansyur Ali",
    NIM: "202601020",
    Angkatan: 2022,
    Kemudahan: 4,
    Kejelasan: 5,
    DayaTarik: 3,
    Keterangan: "Akademik naik-turun",
    jawaban: {
      1: "b", // naik-turun
      2: 55,  // tengah-tengah
      3: "b", // rame
      4: 65,  // lumayan siap
      5: "a", // tidur nyenyak
    },
  },
];

export default data_dummy_jawaban;