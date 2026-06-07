import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "../styles/evaluasi-sesi.css";

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

    // Ambil target sesi dari data_target
    const { data: targets } = await supabase
      .from("data_target")
      .select("*")
      .eq("id_mahasiswa", booking?.id_mahasiswa);

    const targetSesi = targets?.[0]?.target_sesi ?? 4;

    // Insert progress
    const { error: progErr } = await supabase.from("progress_konseling").insert({
      id_mahasiswa:      booking?.id_mahasiswa,
      id_konselor:       booking?.id_konselor,
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
      sesi_tercapai:     `${sesiKe}/${targetSesi}`,
    });

    if (progErr) console.error("Insert progress error:", progErr);

    // Update target di data_target (increment sesi_terlalui dan ubah status jika selesai)
    if (targets && targets.length > 0) {
      for (const t of targets) {
        if (t.status === "Berjalan") {
          const nextTerlalui = (t.sesi_terlalui ?? 0) + 1;
          const nextStatus = nextTerlalui >= t.target_sesi ? "Selesai" : "Berjalan";
          await supabase
            .from("data_target")
            .update({
              sesi_terlalui: nextTerlalui,
              status: nextStatus
            })
            .eq("id_mahasiswa", booking?.id_mahasiswa)
            .eq("nama_target", t.nama_target);
        }
      }
    }

    // Update booking jadi Selesai + kondisi_saat_ini
    await supabase.from("booking").update({
      status: "Selesai",
      kondisi_saat_ini: avgScore,
    }).eq("id", bookingId);

    setSubmitting(false);
    navigate("/konselor-dashboard");
  };

  if (isLoading) return (
    <div className="ev-loading">
      <div className="ev-loading-spinner" />
      <p>Memuat data sesi...</p>
    </div>
  );

  const namaMahasiswa = mahasiswa?.nama ?? booking?.nama_mahasiswa ?? "Klien";
  const initials = namaMahasiswa.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const selectedMood = SUASANA_HATI_OPTIONS.find(o => o.label === answers.suasana_hati);

  return (
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
  );
}