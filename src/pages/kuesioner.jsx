import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/kuesioner.css";

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

function hitungSkor(jawaban) {
  let total = 0;
  let count = 0;
  soalList.forEach((s) => {
    const j = jawaban[s.id];
    if (j === undefined || j === null) return;
    if (s.tipe === "pilihan_kartu") {
      const map = { a: 10, b: 40, c: 70, d: 90 };
      total += map[j] || 0;
      count++;
    } else {
      total += Number(j);
      count++;
    }
  });
  return count > 0 ? Math.round(total / count) : 0;
}

function hasilDariSkor(skor) {
  if (skor <= 30) return { level: "Baik", warna: "#10b981", desc: "Kondisi psikologismu terlihat baik! Pertahankan kebiasaan positifmu.", icon: "🌿" };
  if (skor <= 55) return { level: "Waspada", warna: "#f59e0b", desc: "Ada beberapa hal yang perlu diperhatikan. Jangan abaikan sinyal dari dirimu.", icon: "🌤️" };
  if (skor <= 75) return { level: "Perlu Dukungan", warna: "#f97316", desc: "Kamu sedang menanggung banyak hal. Berbicara dengan konselor sebaya bisa sangat membantu.", icon: "🌧️" };
  return { level: "Segera Cari Bantuan", warna: "#ef4444", desc: "Kondisimu memerlukan perhatian segera. Jangan ragu untuk mencari bantuan.", icon: "⛈️" };
}

// ── Navbar shared ─────────────────────────────────────────────────
function KuisNav({ navigate }) {
  return (
    <header className="kuis-nav">
      <span className="kuis-nav-brand" onClick={() => navigate("/")}>The Sanctuary</span>
      <nav className="kuis-nav-links">
        <span onClick={() => navigate("/")}>Beranda</span>
        <span onClick={() => navigate("/konselor")}>Mentor</span>
        <span onClick={() => navigate("/dashboard")}>Dashboard</span>
      </nav>
      <div className="kuis-nav-right-group">
        <button className="kuis-nav-cta" onClick={() => navigate("/konselor")}>Temukan Mentor</button>
      </div>
    </header>
  );
}

// ── Footer shared ─────────────────────────────────────────────────
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

export default function Kuesioner() {
  const navigate = useNavigate();
  const [langkah, setLangkah] = useState("soal"); // langsung ke soal
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

  // ===== HASIL =====
  if (langkah === "hasil") {
    const skor = hitungSkor(jawaban);
    const hasil = hasilDariSkor(skor);
    return (
      <div className="kuis-shell">
        <KuisNav navigate={navigate} />
        <main className="kuis-main">
          <div className="kuis-hasil-box">
            <div className="kuis-hasil-icon">{hasil.icon}</div>
            <h2 className="kuis-hasil-h2">Terima Kasih atas Refleksimu</h2>
            <p className="kuis-hasil-sub">Kami telah memproses jawabanmu dengan penuh perhatian.</p>
            <div className="kuis-hasil-badge" style={{ borderColor: hasil.warna }}>
              <span className="kuis-badge-label" style={{ background: hasil.warna }}>{hasil.level}</span>
              <p className="kuis-hasil-desc">{hasil.desc}</p>
            </div>
            <div className="kuis-skor-bar">
              <div className="kuis-skor-info">
                <span>Tingkat Kebutuhan</span>
                <strong>{skor}%</strong>
              </div>
              <div className="kuis-skor-track">
                <div className="kuis-skor-fill" style={{ width: `${skor}%`, background: hasil.warna }} />
              </div>
            </div>
            <div className="kuis-hasil-actions">
              <button className="kuis-btn-lanjut" onClick={() => navigate("/konselor")}>
                Temukan Konselor →
              </button>
              <button className="kuis-btn-outline" onClick={() => navigate("/dashboard")}>
                Lihat Dashboard
              </button>
              <button className="kuis-btn-lewati" onClick={() => { setSoalIdx(0); setJawaban({}); setLangkah("soal"); }}>
                Ulangi Tes
              </button>
            </div>
          </div>
        </main>
        <KuisFooter />
      </div>
    );
  }

  // ===== SOAL =====
  return (
    <div className="kuis-shell">
      <KuisNav navigate={navigate} />

      <main className="kuis-main">
        {/* Header */}
        <div className="kuis-header">
          <h1 className="kuis-h1">Refleksi Diri</h1>
          <p className="kuis-sub">
            Mari luangkan sejenak dalam ketenangan bersama. Refleksi ini dirancang untuk memberi kami memahami
            kondisi Anda saat ini dan bagaimana kami dapat mendukung perjalanan Anda dengan sebaik mungkin.
          </p>

          {/* Progress */}
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

        {/* Card Soal */}
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
                type="range"
                min="0"
                max="100"
                value={jawabanSaatIni ?? 50}
                onChange={(e) => setJawaban({ ...jawaban, [soal.id]: Number(e.target.value) })}
                className="kuis-slider"
              />
            </div>
          )}
        </div>

        {/* Navigasi */}
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

        {/* Quote */}
        <p className="kuis-quote">
          "Pertumbuhan bukan tentang tujuan, melainkan cara menjalani hidup dengan penuh kesadaran terhadap diri sendiri."
        </p>
      </main>

      <KuisFooter />
    </div>
  );
}