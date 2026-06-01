import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SUASANA_HATI_OPTIONS = [
  { label: "Sangat Baik", emoji: "😄", value: 1.0 },
  { label: "Baik",        emoji: "🙂", value: 0.75 },
  { label: "Netral",      emoji: "😐", value: 0.5 },
  { label: "Stres",       emoji: "😟", value: 0.25 },
  { label: "Sangat Stres",emoji: "😢", value: 0.1 },
];

const SLIDER_FIELDS = [
  { key: "mindfulness",       label: "Mindfulness",        desc: "Seberapa hadir & sadar klien selama sesi" },
  { key: "manajemen_stres",   label: "Manajemen Stres",    desc: "Kemampuan klien mengelola tekanan" },
  { key: "ketahanan_diri",    label: "Ketahanan Diri",     desc: "Daya lenting dan resiliensi klien" },
  { key: "hubungan_sosial",   label: "Hubungan Sosial",    desc: "Kualitas relasi klien dengan lingkungannya" },
  { key: "keseimbangan_hidup",label: "Keseimbangan Hidup", desc: "Keseimbangan antara studi, sosial, dan diri" },
];

function SliderField({ field, value, onChange }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "#2f7d79" : pct >= 50 ? "#4aab7a" : pct >= 25 ? "#e8a838" : "#e05c5c";

  return (
    <div className="ev-slider-item">
      <div className="ev-slider-head">
        <div>
          <div className="ev-slider-label">{field.label}</div>
          <div className="ev-slider-desc">{field.desc}</div>
        </div>
        <div className="ev-slider-val" style={{ color }}>{pct}%</div>
      </div>
      <div className="ev-slider-track-wrap">
        <input
          type="range" min="0" max="1" step="0.05"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="ev-range"
          style={{ "--val": `${pct}%`, "--color": color }}
        />
        <div className="ev-slider-ticks">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>
    </div>
  );
}

export default function EvaluasiSesi() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking]     = useState(null);
  const [mahasiswa, setMahasiswa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep]           = useState(1); // 1 = suasana hati, 2 = slider

  const [answers, setAnswers] = useState({
    suasana_hati: "",
    suasana_hati_val: 0.5,
    mindfulness: 0.5,
    manajemen_stres: 0.5,
    ketahanan_diri: 0.5,
    hubungan_sosial: 0.5,
    keseimbangan_hidup: 0.5,
  });

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")) ?? {}; }
    catch { return {}; }
  }, []);

  useEffect(() => {
    if (!bookingId) { navigate("/konselor-dashboard"); return; }
    (async () => {
      const { data: bk } = await supabase
        .from("booking")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      if (!bk) { navigate("/konselor-dashboard"); return; }
      setBooking(bk);

      // Ambil nama mahasiswa dari profil_pengguna
      if (bk.id_mahasiswa) {
        const { data: mhs } = await supabase
          .from("profil_pengguna")
          .select("nama, foto_url")
          .eq("student_id", bk.id_mahasiswa)
          .maybeSingle();
        setMahasiswa(mhs);
      }

      setIsLoading(false);
    })();
  }, [bookingId]); // eslint-disable-line

  const avgScore = useMemo(() => {
    const vals = ["mindfulness","manajemen_stres","ketahanan_diri","hubungan_sosial","keseimbangan_hidup"]
      .map(k => answers[k]);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [answers]);

  const handleSubmit = async () => {
    if (!answers.suasana_hati || submitting) return;
    setSubmitting(true);

    // Hitung skor otomatis
    const skor_kesejahteraan = parseFloat((avgScore * 10).toFixed(1));
    const skor_kemajuan      = Math.round(avgScore * 100);
    const skor_keterbukaan   = Math.round(avgScore * 100);
    const skor_konsistensi   = Math.round(avgScore * 90);

    // Sesi ke-berapa
    const { count } = await supabase
      .from("progress_konseling")
      .select("*", { count: "exact", head: true })
      .eq("id_mahasiswa", booking?.id_mahasiswa);

    const sesiKe = (count ?? 0) + 1;

    // Insert progress
    const { error: progErr } = await supabase.from("progress_konseling").insert({
      id_mahasiswa:      booking?.id_mahasiswa,
      sesi_konseling:    sesiKe,
      tanggal:           new Date().toISOString(),
      kondisi_terkini:   avgScore,
      kategori_masalah:  booking?.kategori_masalah,
      status:            "Berjalan",
      suasana_hati:      answers.suasana_hati,
      mindfulness:       answers.mindfulness,
      manajemen_stres:   answers.manajemen_stres,
      ketahanan_diri:    answers.ketahanan_diri,
      hubungan_sosial:   answers.hubungan_sosial,
      keseimbangan_hidup:answers.keseimbangan_hidup,
      skor_kesejahteraan,
      skor_keterbukaan,
      skor_kemajuan,
      skor_konsistensi,
      sesi_tercapai:     `${sesiKe}/4`,
    });

    if (progErr) console.error("Insert progress error:", progErr);

    // Update booking jadi Selesai + kondisi_saat_ini
    await supabase.from("booking").update({
      status: "Selesai",
      kondisi_saat_ini: avgScore,
    }).eq("id", bookingId);

    setSubmitting(false);
    navigate("/konselor-dashboard");
  };

  if (isLoading) return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#f0faf9",
      fontFamily:"'DM Sans',sans-serif", color:"#2f7d79", fontSize:15,
      flexDirection:"column", gap:12,
    }}>
      <div style={{ width:36, height:36, border:"3px solid #e0f2f1", borderTop:"3px solid #2f7d79", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <p>Memuat data sesi...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const namaMahasiswa = mahasiswa?.nama ?? booking?.nama_mahasiswa ?? "Klien";
  const initials = namaMahasiswa.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const selectedMood = SUASANA_HATI_OPTIONS.find(o => o.label === answers.suasana_hati);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,400;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        body { background:#f0faf9; }

        .ev-shell {
          min-height:100vh; background:#f0faf9;
          font-family:'DM Sans',sans-serif;
          display:flex; flex-direction:column;
        }

        /* TOPBAR */
        .ev-topbar {
          height:56px; background:#fff;
          border-bottom:1px solid #e0f2f1;
          display:flex; align-items:center;
          justify-content:space-between;
          padding:0 32px; flex-shrink:0;
          position:sticky; top:0; z-index:10;
        }
        .ev-brand {
          font-family:'Fraunces',serif; font-size:17px;
          font-weight:600; color:#1a1a2e; cursor:pointer;
        }
        .ev-brand span { color:#2f7d79; }
        .ev-topbar-right {
          display:flex; align-items:center; gap:10px;
          font-size:12px; color:#888; font-weight:500;
        }
        .ev-step-badge {
          background:#e8f5f3; color:#2f7d79;
          font-size:11px; font-weight:700;
          padding:4px 12px; border-radius:20px;
        }

        /* MAIN */
        .ev-main {
          flex:1; display:flex; justify-content:center;
          padding:40px 20px 60px;
        }
        .ev-container { width:100%; max-width:640px; }

        /* HEADER */
        .ev-header { margin-bottom:32px; }
        .ev-header-tag {
          display:inline-flex; align-items:center; gap:6px;
          background:#e8f5f3; color:#2f7d79;
          font-size:11px; font-weight:700;
          padding:4px 12px; border-radius:20px;
          text-transform:uppercase; letter-spacing:0.06em;
          margin-bottom:12px;
        }
        .ev-header h1 {
          font-family:'Fraunces',serif; font-size:28px;
          font-weight:600; color:#1a1a2e; line-height:1.3;
          margin-bottom:8px;
        }
        .ev-header p { font-size:13.5px; color:#888; line-height:1.6; }

        /* KLIEN CARD */
        .ev-klien-card {
          background:#fff; border-radius:16px;
          border:1.5px solid #e0f2f1;
          padding:16px 20px;
          display:flex; align-items:center; gap:14px;
          margin-bottom:28px;
          box-shadow:0 2px 12px rgba(47,125,121,0.06);
        }
        .ev-klien-avatar {
          width:48px; height:48px; border-radius:50%;
          background:linear-gradient(135deg,#79d8d1,#2f7d79);
          display:flex; align-items:center; justify-content:center;
          font-weight:700; color:#fff; font-size:18px;
          flex-shrink:0; overflow:hidden;
        }
        .ev-klien-avatar img { width:100%; height:100%; object-fit:cover; }
        .ev-klien-name { font-size:14px; font-weight:700; color:#1a1a2e; }
        .ev-klien-sub { font-size:12px; color:#888; margin-top:2px; }
        .ev-klien-badge {
          margin-left:auto;
          background:#f0faf9; border:1.5px solid #c8ece8;
          color:#2f7d79; font-size:11px; font-weight:700;
          padding:4px 12px; border-radius:20px;
        }

        /* PROGRESS STEPS */
        .ev-steps {
          display:flex; align-items:center; gap:8px;
          margin-bottom:28px;
        }
        .ev-step {
          flex:1; height:4px; border-radius:4px;
          background:#e0f2f1; transition:background 0.3s;
        }
        .ev-step.active { background:#2f7d79; }
        .ev-step.done { background:#79d8d1; }

        /* CARD */
        .ev-card {
          background:#fff; border-radius:20px;
          border:1.5px solid #e8f5f3;
          padding:28px; margin-bottom:16px;
          box-shadow:0 4px 20px rgba(47,125,121,0.07);
        }
        .ev-card-title {
          font-family:'Fraunces',serif; font-size:18px;
          font-weight:600; color:#1a1a2e; margin-bottom:6px;
        }
        .ev-card-sub { font-size:12.5px; color:#999; margin-bottom:24px; }

        /* SUASANA HATI */
        .ev-mood-grid {
          display:flex; flex-wrap:wrap; gap:10px;
        }
        .ev-mood-btn {
          flex:1; min-width:100px;
          display:flex; flex-direction:column; align-items:center;
          gap:6px; padding:14px 10px;
          border-radius:14px; border:2px solid #e8f5f3;
          background:#fafffe; cursor:pointer;
          transition:all 0.18s; font-family:'DM Sans',sans-serif;
        }
        .ev-mood-btn:hover { border-color:#79d8d1; background:#f0faf9; }
        .ev-mood-btn.selected {
          border-color:#2f7d79; background:#e8f5f3;
        }
        .ev-mood-emoji { font-size:28px; }
        .ev-mood-label {
          font-size:11px; font-weight:700; color:#555;
          text-align:center; line-height:1.3;
        }
        .ev-mood-btn.selected .ev-mood-label { color:#2f7d79; }

        /* SLIDER */
        .ev-slider-item { margin-bottom:24px; }
        .ev-slider-item:last-child { margin-bottom:0; }
        .ev-slider-head {
          display:flex; justify-content:space-between;
          align-items:flex-start; margin-bottom:10px;
        }
        .ev-slider-label { font-size:13px; font-weight:700; color:#1a1a2e; }
        .ev-slider-desc { font-size:11px; color:#aaa; margin-top:2px; }
        .ev-slider-val { font-size:16px; font-weight:800; min-width:40px; text-align:right; }
        .ev-slider-track-wrap { position:relative; }
        .ev-range {
          width:100%; height:6px; border-radius:6px;
          appearance:none; outline:none; cursor:pointer;
          background:linear-gradient(to right, var(--color) var(--val), #e0f2f1 var(--val));
        }
        .ev-range::-webkit-slider-thumb {
          appearance:none; width:20px; height:20px;
          border-radius:50%; background:#fff;
          border:3px solid var(--color);
          box-shadow:0 2px 8px rgba(0,0,0,0.15);
          transition:transform 0.15s;
        }
        .ev-range::-webkit-slider-thumb:hover { transform:scale(1.2); }
        .ev-slider-ticks {
          display:flex; justify-content:space-between;
          font-size:10px; color:#ccc; font-weight:600;
          margin-top:4px; padding:0 2px;
        }

        /* SUMMARY */
        .ev-summary {
          background:linear-gradient(135deg,#2f7d79,#1a5e5a);
          border-radius:16px; padding:20px 24px;
          display:flex; align-items:center; gap:16px;
          margin-bottom:20px;
        }
        .ev-summary-score {
          font-size:40px; font-weight:800; color:#fff;
          font-family:'Fraunces',serif; line-height:1;
        }
        .ev-summary-info { flex:1; }
        .ev-summary-label { font-size:11px; color:rgba(255,255,255,0.7); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
        .ev-summary-mood { font-size:20px; margin-top:4px; }

        /* BTN */
        .ev-btn-row {
          display:flex; gap:10px; margin-top:8px;
        }
        .ev-btn-back {
          flex:0 0 auto; padding:13px 20px;
          border:1.5px solid #e0ece9; border-radius:12px;
          background:#fff; color:#666;
          font-size:13px; font-weight:600;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:background 0.15s;
        }
        .ev-btn-back:hover { background:#f5f5f5; }
        .ev-btn-next {
          flex:1; padding:13px;
          border:none; border-radius:12px;
          background:linear-gradient(135deg,#2f7d79,#1a5e5a);
          color:#fff; font-size:13px; font-weight:700;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:opacity 0.2s;
        }
        .ev-btn-next:disabled { opacity:0.45; cursor:not-allowed; }
        .ev-btn-next:not(:disabled):hover { opacity:0.88; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .ev-card { animation:fadeUp 0.3s ease both; }
      `}</style>

      <div className="ev-shell">
        {/* TOPBAR */}
        <header className="ev-topbar">
          <span className="ev-brand" onClick={() => navigate("/konselor-dashboard")}>
            The <span>Sanctuary</span>
          </span>
          <div className="ev-topbar-right">
            <span>Evaluasi Pasca Sesi</span>
            <span className="ev-step-badge">Langkah {step} dari 2</span>
          </div>
        </header>

        <main className="ev-main">
          <div className="ev-container">

            {/* HEADER */}
            <div className="ev-header">
              <div className="ev-header-tag">📋 Evaluasi Sesi</div>
              <h1>Bagaimana kondisi klien<br />setelah sesi ini?</h1>
              <p>Isi evaluasi singkat ini untuk memantau perkembangan klien dari sesi ke sesi.</p>
            </div>

            {/* KLIEN INFO */}
            <div className="ev-klien-card">
              <div className="ev-klien-avatar">
                {mahasiswa?.foto_url
                  ? <img src={mahasiswa.foto_url} alt={namaMahasiswa} />
                  : initials
                }
              </div>
              <div>
                <div className="ev-klien-name">{namaMahasiswa}</div>
                <div className="ev-klien-sub">{booking?.kategori_masalah} · Sesi ke-{booking?.sesi_konseling ?? 1}</div>
              </div>
              <div className="ev-klien-badge">{booking?.id_mahasiswa}</div>
            </div>

            {/* PROGRESS STEPS */}
            <div className="ev-steps">
              <div className={`ev-step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`} />
              <div className={`ev-step ${step >= 2 ? "active" : ""}`} />
            </div>

            {/* STEP 1: SUASANA HATI */}
            {step === 1 && (
              <div className="ev-card">
                <div className="ev-card-title">Suasana Hati Klien</div>
                <div className="ev-card-sub">Pilih yang paling menggambarkan kondisi emosional klien saat ini</div>
                <div className="ev-mood-grid">
                  {SUASANA_HATI_OPTIONS.map(opt => (
                    <button
                      key={opt.label}
                      className={`ev-mood-btn ${answers.suasana_hati === opt.label ? "selected" : ""}`}
                      onClick={() => setAnswers(p => ({ ...p, suasana_hati: opt.label, suasana_hati_val: opt.value }))}
                    >
                      <span className="ev-mood-emoji">{opt.emoji}</span>
                      <span className="ev-mood-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="ev-btn-row" style={{ marginTop: 28 }}>
                  <button
                    className="ev-btn-back"
                    onClick={() => navigate("/konselor-dashboard")}
                  >
                    Lewati
                  </button>
                  <button
                    className="ev-btn-next"
                    disabled={!answers.suasana_hati}
                    onClick={() => setStep(2)}
                  >
                    Lanjut →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SLIDER */}
            {step === 2 && (
              <>
                <div className="ev-summary">
                  <div className="ev-summary-score">{Math.round(avgScore * 100)}%</div>
                  <div className="ev-summary-info">
                    <div className="ev-summary-label">Skor Rata-rata Kondisi</div>
                    <div className="ev-summary-mood">
                      {selectedMood?.emoji} {answers.suasana_hati}
                    </div>
                  </div>
                </div>

                <div className="ev-card">
                  <div className="ev-card-title">Penilaian Kondisi Klien</div>
                  <div className="ev-card-sub">Geser untuk menilai tiap aspek kondisi klien (0 = rendah, 100 = tinggi)</div>
                  {SLIDER_FIELDS.map(field => (
                    <SliderField
                      key={field.key}
                      field={field}
                      value={answers[field.key]}
                      onChange={val => setAnswers(p => ({ ...p, [field.key]: val }))}
                    />
                  ))}
                  <div className="ev-btn-row" style={{ marginTop: 28 }}>
                    <button className="ev-btn-back" onClick={() => setStep(1)}>← Kembali</button>
                    <button
                      className="ev-btn-next"
                      disabled={submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? "Menyimpan..." : "Simpan & Selesaikan Sesi ✓"}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </>
  );
}