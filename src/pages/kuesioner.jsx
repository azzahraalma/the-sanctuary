import { useState } from "react";
import { useNavigate } from "react-router-dom";
import data_konselor from "../data/data_konselor";
import "../styles/kuesioner.css";

// ── Data Soal ────────────────────────────────────────────────────
const soalList = [
  {
    id: 1,
    tipe: "pilihan_kartu",
    pertanyaan: "Bagaimana perasaan energi Anda dalam beberapa hari terakhir?",
    pilihan: [
      { id: "a", icon: "⚡", label: "Penuh Energi & Stabil", sub: "Saya merasa fokus" },
      { id: "b", icon: "🌊", label: "Tenang namun Berfluktuasi", sub: "Kadang-kadang saya seperti gelombang" },
      { id: "c", icon: "🌫️", label: "Mering Mendalam", sub: "Saya merasa ingin menyendiri diri" },
      { id: "d", icon: "📦", label: "Berat atau Terganjal", sub: "Rasakan masa yang sulit dan terbengong" },
    ],
  },
  {
    id: 2,
    tipe: "slider",
    pertanyaan: "Seberapa besar Anda mencari ketenangan hari ini?",
    labelKiri: "SAYA INGIN MERASA TERHUBUNG",
    labelKanan: "I NEED TOTAL STILLNESS",
  },
  {
    id: 3,
    tipe: "pilihan_kartu",
    pertanyaan: "Apa yang paling menggambarkan kondisi pikiran Anda saat ini?",
    pilihan: [
      { id: "a", icon: "🧘", label: "Tenang & Jernih", sub: "Pikiran saya terasa damai" },
      { id: "b", icon: "🌀", label: "Sibuk & Berputar", sub: "Banyak hal yang saya pikirkan" },
      { id: "c", icon: "😶", label: "Kosong & Hampa", sub: "Saya merasa tidak bersemangat" },
      { id: "d", icon: "😟", label: "Cemas & Gelisah", sub: "Ada rasa khawatir yang mengganggu" },
    ],
  },
  {
    id: 4,
    tipe: "slider",
    pertanyaan: "Seberapa nyaman Anda berbagi perasaan dengan orang lain saat ini?",
    labelKiri: "SANGAT TERTUTUP",
    labelKanan: "SANGAT TERBUKA",
  },
  {
    id: 5,
    tipe: "pilihan_kartu",
    pertanyaan: "Bagaimana kualitas tidur Anda beberapa hari terakhir?",
    pilihan: [
      { id: "a", icon: "😴", label: "Nyenyak & Segar", sub: "Bangun dengan penuh energi" },
      { id: "b", icon: "🌙", label: "Cukup Baik", sub: "Tidur normal, tidak ada masalah berarti" },
      { id: "c", icon: "😵", label: "Sering Terjaga", sub: "Tidur terganggu beberapa kali" },
      { id: "d", icon: "💤", label: "Sangat Buruk", sub: "Sulit tidur atau tidur berlebihan" },
    ],
  },
];

// ── Hitung skor dari jawaban ─────────────────────────────────────
function hitungSkor(jawaban) {
  let total = 0, count = 0;
  soalList.forEach((s) => {
    const j = jawaban[s.id];
    if (j === undefined || j === null) return;
    if (s.tipe === "pilihan_kartu") {
      const map = { a: 10, b: 40, c: 70, d: 90 };
      total += map[j] || 0;
    } else {
      total += Number(j);
    }
    count++;
  });
  return count > 0 ? Math.round(total / count) : 0;
}

// ── Tentukan kategori masalah dari jawaban ───────────────────────
function tentukanKategori(jawaban, skor) {
  const { KATEGORI } = { KATEGORI: {
    AKADEMIK: "Tekanan Akademik & Kesejahteraan Mahasiswa",
    KARIER: "Perencanaan Karier & Kehidupan Kampus",
    EMOSI: "Pengelolaan Kebiasaan & Emosi Mahasiswa",
    BURNOUT: "Kelelahan Akademik & Aktivitas Kampus",
  }};
  // Mapping jawaban ke kategori
  const j1 = jawaban[1], j3 = jawaban[3];
  if (j1 === "d" || j3 === "d") return KATEGORI.EMOSI;
  if (j1 === "c" || j3 === "c") return KATEGORI.BURNOUT;
  if (skor > 55) return KATEGORI.AKADEMIK;
  return KATEGORI.KARIER;
}

// ── Hitung % match konselor ──────────────────────────────────────
function hitungMatch(konselor, kategoriUser, skor) {
  let match = 60;
  if (konselor.Kategori_Masalah === kategoriUser) match += 25;
  match += Math.round(konselor["Rating_(Final)"] * 3);
  if (skor > 55 && konselor["Rating_(Final)"] >= 4.5) match += 5;
  return Math.min(match, 99);
}

// ── Alasan cocok ─────────────────────────────────────────────────
function alasanCocok(konselor, kategoriUser) {
  const alasan = [];
  if (konselor.Kategori_Masalah === kategoriUser)
    alasan.push(`Spesialis di bidang ${konselor.Kategori_Masalah.toLowerCase()}`);
  if (konselor["Rating_(Final)"] >= 4.5)
    alasan.push(`Rating tinggi ${konselor["Rating_(Final)"]}/5`);
  if (konselor["Success_Rate"] >= 0.5)
    alasan.push(`Success rate ${Math.round(konselor["Success_Rate"] * 100)}%`);
  alasan.push(`${konselor.Pengalaman} pengalaman`);
  return alasan.slice(0, 3);
}

// ── Navbar ───────────────────────────────────────────────────────
function KuisNav({ navigate }) {
  return (
    <header className="kuis-nav">
      <span className="kuis-nav-brand" onClick={() => navigate("/")}>The Sanctuary</span>
      <nav className="kuis-nav-links">
        <span onClick={() => navigate("/")}>Beranda</span>
        <span onClick={() => navigate("/konselor")}>Mentor</span>
        <span onClick={() => navigate("/dashboard")}>Dashboard</span>
      </nav>
      <button className="kuis-nav-cta" onClick={() => navigate("/konselor")}>Temukan Mentor</button>
    </header>
  );
}

// ── Footer ───────────────────────────────────────────────────────
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

// ── Star Rating ──────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="hasil-stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={n <= Math.round(rating) ? "star-on" : "star-off"}>★</span>
      ))}
      <span className="hasil-rating-val">{rating.toFixed(1)}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HALAMAN HASIL REKOMENDASI
// ════════════════════════════════════════════════════════════════
function HalamanHasil({ skor, jawaban, navigate, onUlang }) {
  const kategoriUser = tentukanKategori(jawaban, skor);

  // Urutkan konselor berdasarkan % match
  const konselorRanked = [...data_konselor]
    .map(k => ({ ...k, match: hitungMatch(k, kategoriUser, skor) }))
    .sort((a, b) => b.match - a.match);

  const utama = konselorRanked[0];
  const alternatif = konselorRanked.slice(1, 3);

  const alasan = alasanCocok(utama, kategoriUser);

  const pendekatan = [
    { icon: "👥", judul: "Komunitas Sebaya", desc: "Bergabung dan berbagi pengalaman bersama komunitas dalam lingkungan yang aman dan mendukung." },
    { icon: "🧘", judul: "Berlatih Mindfulness", desc: "Temukan ketenangan melalui latihan kesadaran diri, meditasi, dan teknik relaksasi." },
    { icon: "📔", judul: "Jurnal Digital", desc: "Ekspresikan perasaan dan pikiran melalui jurnal reflektif sebagai terapi diri." },
  ];

  return (
    <div className="kuis-shell">
      <KuisNav navigate={navigate} />

      <main className="hasil-main">
        {/* ── Header ── */}
        <div className="hasil-header">
          <h1 className="hasil-h1">Perjalanan Anda Menuju Kedamaian</h1>
          <p className="hasil-sub">
            Berdasarkan refleksi Anda, kami telah mengidentifikasi mentor yang memiliki keahlian dalam membantu
            menghadapi transisi yang Anda sebutkan. Koneksi ini dibangun atas dasar empati, pengalaman yang
            serupa, dan ketangguhan profesional.
          </p>
        </div>

        {/* ── Konselor Utama ── */}
        <div className="hasil-utama-grid">
          {/* Card konselor utama */}
          <div className="hasil-card-utama">
            <div className="hasil-match-badge">{utama.match}% Resilience Match</div>
            <div className="hasil-utama-foto-wrap">
              <img src={utama.image} alt={utama.Nama} className="hasil-utama-foto" />
            </div>
            <div className="hasil-utama-info">
              <h2 className="hasil-utama-nama">{utama.Nama}</h2>
              <p className="hasil-utama-spesialis">Spesialis {utama.Kategori_Masalah}</p>
              <Stars rating={utama["Rating_(Final)"]} />
              <p className="hasil-utama-exp">{utama.Pengalaman} pengalaman · {utama.Kasus_Selesai}/{utama.Jumlah_Kasus} kasus</p>
              <button className="hasil-btn-jadwal" onClick={() => navigate("/konselor")}>
                Jadwalkan Konsultasi Awal
              </button>
            </div>
          </div>

          {/* Kenapa cocok */}
          <div className="hasil-card-alasan">
            <div className="hasil-alasan-icon">↗</div>
            <h3 className="hasil-alasan-h3">Mengapa cocok untuk Anda?</h3>
            <p className="hasil-alasan-p">
              {utama.Nama.split(" ")[0]} memiliki pengalaman mendampingi mahasiswa yang menghadapi tantangan
              seperti yang Anda alami, dengan pendekatan berbasis empati dan <em>mindful movement</em>,
              membantu Anda menemukan jalur yang paling sesuai dengan kebutuhan Anda saat ini.
            </p>
            <div className="hasil-alasan-tags">
              {alasan.map((a, i) => (
                <span key={i} className="hasil-tag">{a}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Konselor Alternatif ── */}
        <div className="hasil-alternatif-grid">
          {alternatif.map((k) => (
            <div key={k.ID} className="hasil-card-alt">
              <div className="hasil-alt-top">
                <img src={k.image} alt={k.Nama} className="hasil-alt-foto" />
                <div>
                  <span className="hasil-alt-match">{k.match}% Match</span>
                  <h4 className="hasil-alt-nama">{k.Nama}</h4>
                  <p className="hasil-alt-kat">{k.Kategori_Masalah}</p>
                  <Stars rating={k["Rating_(Final)"]} />
                </div>
              </div>
              <p className="hasil-alt-desc">
                {k.Nama.split(" ")[0]} memiliki fokus pada {k.Kategori_Masalah.toLowerCase()},
                dengan {k.Pengalaman} pengalaman mendampingi mahasiswa.
              </p>
              <button className="hasil-btn-alt" onClick={() => navigate("/konselor")}>
                Atur Sesi Konsultasi Awal
              </button>
            </div>
          ))}
        </div>

        {/* ── Pendekatan Alternatif ── */}
        <div className="hasil-pendekatan-wrap">
          <div className="hasil-pendekatan-header">
            <h3 className="hasil-pendekatan-h3">Pendekatan Alternatif</h3>
            <p className="hasil-pendekatan-sub">
              Pendekatan satu-ke-satu sering merupakan langkah paling kuat — tetapi setiap perjalanan unik.
              Temukan pendekatan pendukung bersama yang dapat mendampingi Anda dari sudut pandang yang berbeda.
            </p>
            <button className="hasil-link-sumber" onClick={() => navigate("/konselor")}>
              Lihat semua sumber →
            </button>
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

        {/* ── Aksi bawah ── */}
        <div className="hasil-bottom-actions">
          <button className="hasil-btn-dashboard" onClick={() => navigate("/dashboard")}>
            Lihat Dashboard Saya
          </button>
          <button className="hasil-btn-ulang" onClick={onUlang}>
            Ulangi Refleksi
          </button>
        </div>
      </main>

      <KuisFooter />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function Kuesioner() {
  const navigate = useNavigate();
  const [langkah, setLangkah] = useState("soal");
  const [soalIdx, setSoalIdx] = useState(0);
  const [jawaban, setJawaban] = useState({});

  const soal = soalList[soalIdx];
  const totalSoal = soalList.length;
  const progres = Math.round((soalIdx / totalSoal) * 100);
  const jawabanSaatIni = jawaban[soal?.id];

  const handleLanjut = () => {
    if (soalIdx + 1 < totalSoal) setSoalIdx(soalIdx + 1);
    else setLangkah("hasil");
  };

  const handleBack = () => {
    if (soalIdx > 0) setSoalIdx(soalIdx - 1);
  };

  const handleUlang = () => {
    setSoalIdx(0);
    setJawaban({});
    setLangkah("soal");
  };

  // ── HASIL ──
  if (langkah === "hasil") {
    const skor = hitungSkor(jawaban);
    return (
      <HalamanHasil
        skor={skor}
        jawaban={jawaban}
        navigate={navigate}
        onUlang={handleUlang}
      />
    );
  }

  // ── SOAL ──
  return (
    <div className="kuis-shell">
      <KuisNav navigate={navigate} />

      <main className="kuis-main">
        <div className="kuis-header">
          <h1 className="kuis-h1">Refleksi Diri</h1>
          <p className="kuis-sub">
            Mari luangkan sejenak dalam ketenangan bersama. Refleksi ini dirancang untuk memberi kami memahami
            kondisi Anda saat ini dan bagaimana kami dapat mendukung perjalanan Anda dengan sebaik mungkin.
          </p>
          <div className="kuis-progress-wrap">
            <div className="kuis-progress-top">
              <span className="kuis-progress-label">PROGRESS ANDA · {progres}%</span>
              <span className="kuis-progress-step">Langkah {soalIdx + 1} dari {totalSoal}</span>
            </div>
            <div className="kuis-progress-track">
              <div className="kuis-progress-fill" style={{ width: `${progres}%` }} />
            </div>
          </div>
        </div>

        <div className="kuis-card">
          <h2 className="kuis-soal-q">{soal.pertanyaan}</h2>

          {soal.tipe === "pilihan_kartu" && (
            <div className="kuis-kartu-grid">
              {soal.pilihan.map((p) => (
                <button
                  key={p.id}
                  className={`kuis-kartu ${jawabanSaatIni === p.id ? "terpilih" : ""}`}
                  onClick={() => setJawaban({ ...jawaban, [soal.id]: p.id })}
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
                type="range" min="0" max="100"
                value={jawabanSaatIni ?? 50}
                onChange={(e) => setJawaban({ ...jawaban, [soal.id]: Number(e.target.value) })}
                className="kuis-slider"
              />
            </div>
          )}
        </div>

        <div className="kuis-nav-btn">
          <button className="kuis-btn-lewati" onClick={handleLanjut}>Lewati</button>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {soalIdx > 0 && (
              <button className="kuis-btn-outline" onClick={handleBack}>← Kembali</button>
            )}
            <button
              className="kuis-btn-lanjut"
              onClick={handleLanjut}
              disabled={soal.tipe === "pilihan_kartu" && jawabanSaatIni === undefined}
            >
              {soalIdx + 1 === totalSoal ? "Lihat Hasil ✨" : "Lanjutkan Perjalanan →"}
            </button>
          </div>
        </div>

        <p className="kuis-quote">
          "Pertumbuhan bukan tentang tujuan, melainkan cara menjalani hidup dengan penuh kesadaran terhadap diri sendiri."
        </p>
      </main>

      <KuisFooter />
    </div>
  );
}