import { KATEGORI } from "./kategori";

const raw_konselor = [
  {
    "ID": "K-001",
    "Nama": "Almalia Azzahra Wally",
    "image": "/mentor1.jpg",
    "Keramahan_(30%)": 5.0,
    "Solusi_(50%)": 4.0,
    "Respon_(20%)": 4.0,
    "Jumlah_Kasus": 6.0,
    "Kasus_Selesai": 3.0,
    "Kategori_Masalah": KATEGORI.AKADEMIK,
    "Pengalaman": "2 Thn",
    "Catatan_Untuk_Konselor": null,
  },
  {
    "ID": "K-002",
    "Nama": "Felicia Oktovany Jonathans",
    "image": "/mentor2.jpg",
    "Keramahan_(30%)": 4.0,
    "Solusi_(50%)": 3.0,
    "Respon_(20%)": 5.0,
    "Jumlah_Kasus": 9.0,
    "Kasus_Selesai": 4.0,
    "Kategori_Masalah": KATEGORI.KARIER,
    "Pengalaman": "1.5 Thn",
    "Catatan_Untuk_Konselor": null,
  },
  {
    "ID": "K-003",
    "Nama": "Muhammad Haris",
    "image": "/mentor3.jpg",
    "Keramahan_(30%)": 5.0,
    "Solusi_(50%)": 5.0,
    "Respon_(20%)": 5.0,
    "Jumlah_Kasus": 3.0,
    "Kasus_Selesai": 1.0,
    "Kategori_Masalah": KATEGORI.EMOSI,
    "Pengalaman": "3 Thn",
    "Catatan_Untuk_Konselor": null,
  },
  {
    "ID": "K-004",
    "Nama": "Haikal Azmi Burhan Habibi",
    "image": "/mentor4.jpg",
    "Keramahan_(30%)": 1.0,
    "Solusi_(50%)": 3.0,
    "Respon_(20%)": 2.0,
    "Jumlah_Kasus": 2.0,
    "Kasus_Selesai": 0.0,
    "Kategori_Masalah": KATEGORI.BURNOUT,
    "Pengalaman": "1Thn",
    "Catatan_Untuk_Konselor": null,
  },
];

const data_konselor = raw_konselor.map((k) => ({
  ...k,
  "Rating_(Final)": parseFloat(
    (k["Keramahan_(30%)"] * 0.3 + k["Solusi_(50%)"] * 0.5 + k["Respon_(20%)"] * 0.2).toFixed(1)
  ),
  "Success_Rate": k["Jumlah_Kasus"] > 0 ? k["Kasus_Selesai"] / k["Jumlah_Kasus"] : 0,
}));

export default data_konselor;