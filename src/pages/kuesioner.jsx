import { useState } from "react";
import { useNavigate } from "react-router-dom";
import data_konselor from "../data/data_konselor";
import "../styles/kuesioner.css";

const soalList = [
  {
    id: 1,
    tipe: "pilihan_kartu",
    pertanyaan: "Jujur deh — energi kamu beberapa hari terakhir gimana?",
    hint: "Nggak ada jawaban yang salah ya. Pilih yang paling jujur sama kondisi kamu sekarang.",
    pilihan: [
      {
        id: "a",
        label: "Oke dan stabil",
        sub: "Cukup fokus, aktivitas berjalan kayak biasanya",
      },
      {
        id: "b",
        label: "Naik-turun",
        sub: "Kadang semangat, tapi tiba-tiba ngerasa beda aja",
      },
      {
        id: "c",
        label: "Lebih pengen menyendiri",
        sub: "Kurang mood ketemu orang, nyaman di ruang sendiri dulu",
      },
      {
        id: "d",
        label: "Berat dan susah gerak",
        sub: "Ngerasa nggak kuat, susah banget buat mulai sesuatu",
      },
    ],
  },
  {
    id: 2,
    tipe: "slider",
    pertanyaan: "Sekarang, seberapa besar sih kamu butuh ketenangan dan me-time?",
    hint: "Geser ke arah yang paling menggambarkan kondisimu hari ini ya!",
    labelKiri: "Pengen ngobrol dan connect sama orang",
    labelKanan: "Butuh waktu sendiri dan hening dulu",
  },
  {
    id: 3,
    tipe: "pilihan_kartu",
    pertanyaan: "Kalau liat kondisi pikiran kamu sekarang, yang mana paling cocok?",
    hint: "Pilih yang paling deket — nggak harus 100% sama persis.",
    pilihan: [
      {
        id: "a",
        label: "Adem dan jernih",
        sub: "Pikiran lumayan tenang, bisa mikir dengan baik",
      },
      {
        id: "b",
        label: "Rame banget di kepala",
        sub: "Banyak hal muter-muter, susah fokus ke satu hal",
      },
      {
        id: "c",
        label: "Hampa dan kosong",
        sub: "Nggak banyak semangat, kayak jalan di tempat aja",
      },
      {
        id: "d",
        label: "Cemas dan gelisah",
        sub: "Ada kekhawatiran yang terus-terusan muncul dan ganggu",
      },
    ],
  },
  {
    id: 4,
    tipe: "slider",
    pertanyaan: "Seberapa nyaman kamu kalau harus cerita soal perasaan ke orang lain?",
    hint: "Ini soal kondisimu sekarang, bukan standar kamu sehari-hari ya.",
    labelKiri: "Belum siap cerita ke siapapun dulu",
    labelKanan: "Siap dan terbuka banget!",
  },
  {
    id: 5,
    tipe: "pilihan_kartu",
    pertanyaan: "Tidur kamu belakangan ini gimana?",
    hint: "Tidur sering jadi cermin kondisi kita. Jawab yang paling jujur ya.",
    pilihan: [
      {
        id: "a",
        label: "Nyenyak dan segar",
        sub: "Bangun dengan energi cukup, kualitas tidur oke",
      },
      {
        id: "b",
        label: "Lumayan baik",
        sub: "Normal aja sih, nggak ada yang terlalu ganggu",
      },
      {
        id: "c",
        label: "Sering kebangun",
        sub: "Tidur terganggu beberapa kali, kurang nyenyak",
      },
      {
        id: "d",
        label: "Berantakan banget",
        sub: "Susah tidur atau malah ketiduran terus tapi tetap capek",
      },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function hitungSkor(jawaban) {
  let total = 0,
    count = 0;

  soalList.forEach((s) => {
    const j = jawaban[s.id];

    if (j === undefined || j === null) return;

    if (s.tipe === "pilihan_kartu") {
      const map = { a: 10, b: 35, c: 65, d: 90 };
      total += map[j] || 0;
    } else {
      total += Number(j);
    }

    count++;
  });

  return count > 0 ? Math.round(total / count) : 0;
}

function tentukanKategori(jawaban, skor) {
  const KATEGORI = {
    AKADEMIK: "Tekanan Akademik & Kesejahteraan Mahasiswa",
    KARIER: "Perencanaan Karier & Kehidupan Kampus",
    EMOSI: "Pengelolaan Kebiasaan & Emosi Mahasiswa",
    BURNOUT: "Kelelahan Akademik & Aktivitas Kampus",
  };

  const j1 = jawaban[1];
  const j3 = jawaban[3];

  if (j1 === "d" || j3 === "d") return KATEGORI.EMOSI;
  if (j1 === "c" || j3 === "c") return KATEGORI.BURNOUT;
  if (skor > 50) return KATEGORI.AKADEMIK;

  return KATEGORI.KARIER;
}

function hitungMatch(konselor, kategoriUser, skor) {
  let match = 60;

  if (konselor.Kategori_Masalah === kategoriUser) match += 25;

  match += Math.round(konselor["Rating_(Final)"] * 3);

  if (skor > 50 && konselor["Rating_(Final)"] >= 4.5) match += 5;

  return Math.min(match, 99);
}

function alasanCocok(konselor, kategoriUser) {
  const alasan = [];

  if (konselor.Kategori_Masalah === kategoriUser)
    alasan.push(`Spesialis ${konselor.Kategori_Masalah}`);

  if (konselor["Rating_(Final)"] >= 4.5)
    alasan.push(`Rating ${konselor["Rating_(Final)"]}/5`);

  if (konselor["Success_Rate"] >= 0.5)
    alasan.push(`Success rate ${Math.round(konselor["Success_Rate"] * 100)}%`);

  alasan.push(`${konselor.Pengalaman} pengalaman`);

  return alasan.slice(0, 3);
}

function generateInsight(jawaban, namaUser) {
  const firstName =
    namaUser?.split(" ")[1] || namaUser?.split(" ")[0] || "Kamu";

  const j1 = jawaban[1];
  const j3 = jawaban[3];
  const j5 = jawaban[5];
  const j4 = Number(jawaban[4] ?? 50);

  const parts = [];

  if (j1 === "a") parts.push("Energimu cukup stabil belakangan ini");
  else if (j1 === "b")
    parts.push("Energimu lagi naik-turun dan nggak menentu");
  else if (j1 === "c")
    parts.push("Kamu lagi lebih banyak menarik diri dari sekitar");
  else if (j1 === "d")
    parts.push("Kamu lagi menanggung beban yang terasa cukup berat");

  if (j3 === "a") parts.push("tapi pikiran kamu cukup jernih");
  else if (j3 === "b") parts.push("dan pikiran kamu lagi cukup rame");
  else if (j3 === "c")
    parts.push("dan ada rasa hampa yang perlu diperhatiin");
  else if (j3 === "d")
    parts.push("dan ada kecemasan yang ikut nempel");

  if (j5 === "c")
    parts.push("Tidur yang kurang nyenyak bisa jadi sinyal awal kelelahan");
  else if (j5 === "d")
    parts.push("Pola tidur yang berantakan perlu jadi prioritas buat diperbaiki");

  if (j4 >= 60) {
    parts.push(
      `${firstName} cukup terbuka buat berbagi — itu modal bagus banget buat sesi konseling!`
    );
  } else {
    parts.push(
      `Wajar kalau belum siap terbuka sepenuhnya — konselor kami siap ngikutin ritme kamu`
    );
  }

  return parts.join(". ") + ".";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const prasetyo_store = {
  sudahIsi: false,
  data: null,
};

function simpanJawabanPrasetyo(jawaban, skor) {
  const entry = {
    ID_Mahasiswa: "M-001",
    Nama: "Muhammad Prasetyo Hanggara",
    NIM: "202601001",
    Angkatan: 2023,
    jawaban: { ...jawaban },
    tanggalIsi: new Date().toISOString(),
    skor,
  };

  prasetyo_store.sudahIsi = true;
  prasetyo_store.data = entry;

  console.log("Jawaban Prasetyo tersimpan:", entry);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function KuisNav({ navigate }) {
  return (
    <header className="kuis-nav">
      <span className="kuis-nav-brand" onClick={() => navigate("/")}>
        The Sanctuary
      </span>

      <nav className="kuis-nav-links">
        <span onClick={() => navigate("/")}>Beranda</span>
        <span onClick={() => navigate("/konselor")}>Mentor</span>
        <span onClick={() => navigate("/dashboard")}>Dashboard</span>
      </nav>

      <button className="kuis-nav-cta" onClick={() => navigate("/konselor")}>
        Temukan Mentor
      </button>
    </header>
  );
}

function KuisFooter() {
  return (
    <footer className="kuis-footer">
      <div className="kuis-footer-left">
        <strong>The Sanctuary</strong>
        <p>© 2025 The Sanctuary. A space for healing & hope.</p>
      </div>

      <div className="kuis-footer-links">
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>Contact Support</span>
        <span>Our Methodology</span>
      </div>
    </footer>
  );
}

function Stars({ rating }) {
  return (
    <div className="hasil-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= Math.round(rating) ? "star-on" : "star-off"}
        >
          ★
        </span>
      ))}

      <span className="hasil-rating-val">{rating.toFixed(1)}</span>
    </div>
  );
}

function SkorLabel({ skor }) {
  let label;
  let warna;

  if (skor < 30) {
    label = "Kondisi Baik";
    warna = "#2d6b68";
  } else if (skor < 55) {
    label = "Perlu Diperhatiin";
    warna = "#d97706";
  } else {
    label = "Butuh Dukungan Lebih";
    warna = "#b45309";
  }

  return <span style={{ color: warna, fontWeight: 600 }}>{label}</span>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HALAMAN HASIL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function HalamanHasil({
  skor,
  jawaban,
  navigate,
  onUlang,
  namaUser,
  dataResponden,
  isPrasetyo,
}) {
  const kategoriUser = tentukanKategori(jawaban, skor);

  const konselorRanked = [...data_konselor]
    .map((k) => ({
      ...k,
      match: hitungMatch(k, kategoriUser, skor),
    }))
    .sort((a, b) => b.match - a.match);

  const utama = konselorRanked[0];
  const alternatif = konselorRanked.slice(1, 3);

  const alasan = alasanCocok(utama, kategoriUser);

  const firstName =
    namaUser?.split(" ")[1] || namaUser?.split(" ")[0] || "Kamu";

  const insight = generateInsight(jawaban, namaUser);

  const pendekatan = [
    {
      icon: "👥",
      judul: "Komunitas Sebaya",
      desc: "Sharing bareng mahasiswa lain yang punya pengalaman serupa, di ruang yang aman dan supportif.",
    },
    {
      icon: "🧘",
      judul: "Latihan Mindfulness",
      desc: "Latihan singkat buat bantu kamu kelola kecemasan, lebih hadir, dan istirahat lebih berkualitas.",
    },
    {
      icon: "📔",
      judul: "Jurnal Digital",
      desc: "Nulis perasaan dan pikiranmu kadang nulis aja udah bikin lega lebih dari yang kamu kira.",
    },
  ];

  return (
    <div className="kuis-shell">
      <KuisNav navigate={navigate} />

      <main className="hasil-main">
        {isPrasetyo && (
          <div className="hasil-saved-notice">
            ✅ Jawaban kamu udah tersimpan di data sesi ini, Prasetyo!
          </div>
        )}

        <div className="hasil-header">
          <div className="hasil-greeting-badge">
            Selesai, {firstName}! Makasih udah mau jujur sama diri sendiri.
          </div>

          <h1 className="hasil-h1">Ini langkah pertama yang berani.</h1>

          <p className="hasil-sub">
            Dari apa yang kamu ceritain tadi, kami udah nemuin konselor yang
            paling pas buat nemenin kamu.
          </p>
        </div>

        <div className="hasil-kondisi-wrap">
          <div className="hasil-kondisi-header">
            <span className="hasil-kondisi-label">
              Gambaran kondisimu sekarang
            </span>

            <span className="hasil-kondisi-skor">
              Skor {skor}/100 · <SkorLabel skor={skor} />
            </span>
          </div>

          <div className="hasil-kondisi-bar-track">
            <div
              className="hasil-kondisi-bar-fill"
              style={{ width: `${skor}%` }}
            />
          </div>

          {dataResponden && (
            <div className="hasil-dimensi-grid">
              <div className="hasil-dimensi-card">
                <span className="hasil-dimensi-val">
                  {dataResponden.Kemudahan}/5
                </span>
                <span className="hasil-dimensi-label">
                  Kemudahan Interaksi
                </span>
              </div>

              <div className="hasil-dimensi-card">
                <span className="hasil-dimensi-val">
                  {dataResponden.Kejelasan}/5
                </span>
                <span className="hasil-dimensi-label">
                  Kejelasan Pikiran
                </span>
              </div>

              <div className="hasil-dimensi-card">
                <span className="hasil-dimensi-val">
                  {dataResponden.DayaTarik}/5
                </span>
                <span className="hasil-dimensi-label">
                  Tingkat Energi
                </span>
              </div>
            </div>
          )}

          <div className="hasil-insight-box">
            <span className="hasil-insight-icon">💬</span>
            <p className="hasil-insight-text">{insight}</p>
          </div>
        </div>

        <div className="hasil-utama-grid">
          <div className="hasil-card-utama">
            <div className="hasil-match-badge">
              {utama.match}% paling cocok buat kamu
            </div>

            <div className="hasil-utama-foto-wrap">
              <img
                src={utama.image}
                alt={utama.Nama}
                className="hasil-utama-foto"
              />
            </div>

            <div className="hasil-utama-info">
              <h2 className="hasil-utama-nama">{utama.Nama}</h2>

              <p className="hasil-utama-spesialis">
                {utama.Kategori_Masalah}
              </p>

              <Stars rating={utama["Rating_(Final)"]} />

              <p className="hasil-utama-exp">
                {utama.Pengalaman} pengalaman
              </p>

              <button
                className="hasil-btn-jadwal"
                onClick={() => navigate("/konselor")}
              >
                Jadwalin sesi pertama →
              </button>
            </div>
          </div>

          <div className="hasil-card-alasan">
            <div className="hasil-alasan-icon">↗</div>

            <h3 className="hasil-alasan-h3">
              Kenapa {utama.Nama.split(" ")[0]} cocok buat {firstName}?
            </h3>

            <p className="hasil-alasan-p">
              {utama.Nama.split(" ")[0]} berpengalaman nemenin mahasiswa yang
              lagi di fase yang mirip sama yang kamu rasain.
            </p>

            <div className="hasil-alasan-tags">
              {alasan.map((a, i) => (
                <span key={i} className="hasil-tag">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hasil-alternatif-grid">
          {alternatif.map((k) => (
            <div key={k.ID} className="hasil-card-alt">
              <div className="hasil-alt-top">
                <img
                  src={k.image}
                  alt={k.Nama}
                  className="hasil-alt-foto"
                />

                <div>
                  <span className="hasil-alt-match">{k.match}% match</span>

                  <h4 className="hasil-alt-nama">{k.Nama}</h4>

                  <p className="hasil-alt-kat">{k.Kategori_Masalah}</p>

                  <Stars rating={k["Rating_(Final)"]} />
                </div>
              </div>

              <p className="hasil-alt-desc">
                {k.Nama.split(" ")[0]} fokus di{" "}
                {k.Kategori_Masalah.toLowerCase()}.
              </p>

              <button
                className="hasil-btn-alt"
                onClick={() => navigate("/konselor")}
              >
                Lihat profil lengkap →
              </button>
            </div>
          ))}
        </div>

        <div className="hasil-pendekatan-wrap">
          <div className="hasil-pendekatan-header">
            <h3 className="hasil-pendekatan-h3">
              Belum siap langsung sesi? Santai, nggak apa-apa kok!
            </h3>

            <p className="hasil-pendekatan-sub">
              Setiap orang punya ritme masing-masing.
            </p>
          </div>

          <div className="hasil-pendekatan-grid">
            {pendekatan.map((p, i) => (
              <div key={i} className="hasil-pend-card">
                <div className="hasil-pend-icon">{p.icon}</div>

                <h4 className="hasil-pend-judul">{p.judul}</h4>

                <p className="hasil-pend-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hasil-bottom-actions">
          <button
            className="hasil-btn-dashboard"
            onClick={() => navigate("/dashboard")}
          >
            Lihat Dashboard Saya
          </button>

          <button className="hasil-btn-ulang" onClick={onUlang}>
            Isi Ulang Refleksi
          </button>
        </div>
      </main>

      <KuisFooter />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER AKTIF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ACTIVE_USER = {
  ID_Mahasiswa: "M-001",
  Nama: "Muhammad Prasetyo Hanggara",
  NIM: "202601001",
  Angkatan: 2023,
  Kemudahan: 4,
  Kejelasan: 5,
  DayaTarik: 3,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function Kuesioner() {
  const navigate = useNavigate();

  const [langkah, setLangkah] = useState("soal");
  const [soalIdx, setSoalIdx] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [isPrasetyoSave, setIsPrasetyoSave] = useState(false);

  const soal = soalList[soalIdx];

  const totalSoal = soalList.length;

  const progres = Math.round((soalIdx / totalSoal) * 100);

  const jawabanSaatIni = jawaban[soal?.id];

  const namaUser = ACTIVE_USER.Nama;

  const dataResponden = ACTIVE_USER;

  const firstName =
    namaUser.split(" ")[1] || namaUser.split(" ")[0];

  const handlePilih = (id) => {
    setJawaban((prev) => ({
      ...prev,
      [soal.id]: id,
    }));
  };

  const handleSlider = (val) => {
    setJawaban((prev) => ({
      ...prev,
      [soal.id]: Number(val),
    }));
  };

  const handleLanjut = () => {
    if (soal.tipe === "slider" && jawaban[soal.id] === undefined) {
      setJawaban((prev) => ({
        ...prev,
        [soal.id]: 50,
      }));
    }

    if (soalIdx + 1 < totalSoal) {
      setSoalIdx(soalIdx + 1);
    } else {
      const finalJawaban = { ...jawaban };

      if (
        soal.tipe === "slider" &&
        finalJawaban[soal.id] === undefined
      ) {
        finalJawaban[soal.id] = 50;
      }

      const skor = hitungSkor(finalJawaban);

      simpanJawabanPrasetyo(finalJawaban, skor);

      setIsPrasetyoSave(true);

      setLangkah("hasil");
    }
  };

  const handleBack = () => {
    if (soalIdx > 0) {
      setSoalIdx(soalIdx - 1);
    }
  };

  const handleUlang = () => {
    setJawaban({});
    setSoalIdx(0);
    setLangkah("soal");
    setIsPrasetyoSave(false);
  };

  if (langkah === "hasil") {
    return (
      <HalamanHasil
        skor={hitungSkor(jawaban)}
        jawaban={jawaban}
        navigate={navigate}
        onUlang={handleUlang}
        namaUser={namaUser}
        dataResponden={dataResponden}
        isPrasetyo={isPrasetyoSave}
      />
    );
  }

  return (
    <div className="kuis-shell">
      <KuisNav navigate={navigate} />

      <main className="kuis-main">
        <div className="kuis-header">
          <div className="kuis-greeting">
            Halo, {firstName}! 👋 Makasih udah mau luangin waktu buat ini
          </div>

          <h1 className="kuis-h1">Gimana kabarmu sekarang?</h1>

          <p className="kuis-sub">
            Ini bukan tes dan nggak ada jawaban yang benar atau salah.
          </p>

          <div className="kuis-progress-wrap">
            <div className="kuis-progress-top">
              <span className="kuis-progress-label">
                Progres · {progres}%
              </span>

              <span className="kuis-progress-step">
                Pertanyaan {soalIdx + 1} dari {totalSoal}
              </span>
            </div>

            <div className="kuis-progress-track">
              <div
                className="kuis-progress-fill"
                style={{ width: `${progres}%` }}
              />
            </div>
          </div>
        </div>

        <div className="kuis-card">
          <h2 className="kuis-soal-q">{soal.pertanyaan}</h2>

          {soal.hint && (
            <p className="kuis-soal-hint">{soal.hint}</p>
          )}

          {soal.tipe === "pilihan_kartu" && (
            <div className="kuis-kartu-grid">
              {soal.pilihan.map((p) => (
                <button
                  key={p.id}
                  className={`kuis-kartu ${jawabanSaatIni === p.id ? "terpilih" : ""
                    }`}
                  onClick={() => handlePilih(p.id)}
                >
                  <span className="kuis-kartu-icon">{p.icon}</span>

                  <span className="kuis-kartu-label">{p.label}</span>

                  <span className="kuis-kartu-sub">{p.sub}</span>
                </button>
              ))}
            </div>
          )}

          {soal.tipe === "slider" && (
            <div className="kuis-slider-wrap">
              <div className="kuis-slider-labels">
                <span>{soal.labelKiri}</span>
                <span>{soal.labelKanan}</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={jawabanSaatIni ?? 50}
                onChange={(e) => handleSlider(e.target.value)}
                className="kuis-slider"
                style={{
                  background: `linear-gradient(to right, #2d6b68 0%, #2d6b68 ${jawabanSaatIni ?? 50}%, #d1d5db ${jawabanSaatIni ?? 50}%, #d1d5db 100%)`
                }}
              />

              <p className="kuis-slider-val">
                {jawabanSaatIni ?? 50}%
              </p>
            </div>
          )}
        </div>

        <div className="kuis-nav-btn">
          <button
            className="kuis-btn-lewati"
            onClick={handleLanjut}
          >
            Lewatin pertanyaan ini
          </button>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {soalIdx > 0 && (
              <button
                className="kuis-btn-outline"
                onClick={handleBack}
              >
                ← Balik
              </button>
            )}

            <button
              className="kuis-btn-lanjut"
              onClick={handleLanjut}
              disabled={
                soal.tipe === "pilihan_kartu" &&
                jawabanSaatIni === undefined
              }
            >
              {soalIdx + 1 === totalSoal
                ? "Lihat hasilnya ✨"
                : "Lanjut →"}
            </button>
          </div>
        </div>

        <p className="kuis-quote">
          "Ngomongin perasaan itu butuh keberanian — dan kamu udah ada di sini."
        </p>
      </main>

      <KuisFooter />
    </div>
  );
}