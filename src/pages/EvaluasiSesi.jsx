import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import {
  BOOKING_STATUS,
  normalizeStatus,
  isMenungguEvaluasi,
  isBerjalan,
  isSelesai,
} from "../lib/bookingStatus.js";
import { syncKonselorStats } from "../lib/konselorStats.js";
import "../styles/evaluasi-sesi.css";

const SUASANA_HATI_OPTIONS = [
  { label: "Sangat Baik",  value: 1.0, emoji: "😊" },
  { label: "Baik",         value: 0.75, emoji: "🙂" },
  { label: "Netral",       value: 0.5, emoji: "😐" },
  { label: "Stres",        value: 0.25, emoji: "😟" },
  { label: "Sangat Stres", value: 0.1, emoji: "😰" },
];

const SLIDER_FIELDS = [
  { key: "mindfulness",        label: "Mindfulness",        desc: "Seberapa hadir & sadar klien selama sesi" },
  { key: "manajemen_stres",    label: "Manajemen Stres",    desc: "Kemampuan klien mengelola tekanan" },
  { key: "ketahanan_diri",     label: "Ketahanan Diri",     desc: "Daya lenting dan resiliensi klien" },
  { key: "hubungan_sosial",    label: "Hubungan Sosial",    desc: "Kualitas relasi klien dengan lingkungannya" },
  { key: "keseimbangan_hidup", label: "Keseimbangan Hidup", desc: "Keseimbangan antara studi, sosial, dan diri" },
];

function SliderField({ field, value, onChange }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 75 ? "#2f7d79" :
    pct >= 50 ? "#4aab7a" :
    pct >= 25 ? "#e8a838" : "#e05c5c";

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
          aria-label={field.label}
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
  const [error, setError]         = useState(null); 
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep]           = useState(1);

  const [answers, setAnswers] = useState({
    suasana_hati:      "",
    suasana_hati_val:  0.5,
    kondisi_awal:      0.5,
    catatan_sesi:      "",
    mindfulness:       0.5,
    manajemen_stres:   0.5,
    ketahanan_diri:    0.5,
    hubungan_sosial:   0.5,
    keseimbangan_hidup:0.5,
  });

  useEffect(() => {
    if (!bookingId) {
      navigate("/konselor-dashboard");
      return;
    }

    let cancelled = false; 

    (async () => {
      try {
        const { data: bk, error: bkErr } = await supabase
          .from("booking")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();

        if (bkErr) throw bkErr;
        if (!bk) { navigate("/konselor-dashboard"); return; }

        if (isSelesai(bk.status)) {
          navigate("/konselor-dashboard");
          return;
        }
        if (!isMenungguEvaluasi(bk.status) && !isBerjalan(bk.status)) {
          navigate("/konselor-dashboard");
          return;
        }

        if (cancelled) return;
        setBooking(bk);

        setAnswers(prev => ({
          ...prev,
          kondisi_awal: bk.kondisi_awal ?? 0.5,
        }));

        if (bk.id_mahasiswa) {
          const { data: mhs, error: mhsErr } = await supabase
            .from("profil_pengguna")
            .select("nama, foto_url")
            .eq("student_id", bk.id_mahasiswa)
            .maybeSingle();

          if (mhsErr) console.warn("Gagal ambil profil mahasiswa:", mhsErr.message);
          if (!cancelled) setMahasiswa(mhs ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message ?? "Terjadi kesalahan saat memuat data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [bookingId, navigate]); 

  const avgScore = useMemo(() => {
    const keys = ["mindfulness","manajemen_stres","ketahanan_diri","hubungan_sosial","keseimbangan_hidup"];
    const sum = keys.reduce((acc, k) => acc + answers[k], 0);
    return sum / keys.length;
  }, [answers]);

  const handleSliderChange = useCallback((key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = async () => {
    if (!answers.suasana_hati || submitting) return;
    if (!booking) return;

    setSubmitting(true);
    setError(null);

    try {
      const skor_kesejahteraan = parseFloat((avgScore * 10).toFixed(1));
      const skor_kemajuan      = Math.round(avgScore * 100);
      const skor_keterbukaan   = Math.round(avgScore * 100);
      const skor_konsistensi   = Math.round(avgScore * 90);

      const { count, error: countErr } = await supabase
        .from("progress_konseling")
        .select("*", { count: "exact", head: true })
        .eq("id_mahasiswa", booking.id_mahasiswa);

      if (countErr) throw countErr;
      const sesiKe = (count ?? 0) + 1;

      const { data: targets, error: targetErr } = await supabase
        .from("data_target")
        .select("*")
        .eq("id_mahasiswa", booking.id_mahasiswa);

      if (targetErr) throw targetErr;

      const targetSesi = targets?.[0]?.target_sesi ?? 4;

      const { error: progErr } = await supabase.from("progress_konseling").insert({
        id_mahasiswa:       booking.id_mahasiswa,
        id_konselor:        booking.id_konselor,
        sesi_konseling:     sesiKe,
        tanggal:            new Date().toISOString(),
        kondisi_terkini:    avgScore,
        kondisi_awal_sesi:  answers.kondisi_awal,
        catatan_sesi:       answers.catatan_sesi || null,
        kategori_masalah:   booking.kategori_masalah,
        status:             BOOKING_STATUS.BERJALAN,
        suasana_hati:       answers.suasana_hati,
        mindfulness:        answers.mindfulness,
        manajemen_stres:    answers.manajemen_stres,
        ketahanan_diri:     answers.ketahanan_diri,
        hubungan_sosial:    answers.hubungan_sosial,
        keseimbangan_hidup: answers.keseimbangan_hidup,
        skor_kesejahteraan,
        skor_keterbukaan,
        skor_kemajuan,
        skor_konsistensi,
        sesi_tercapai:      `${sesiKe}/${targetSesi}`,
      });

      if (progErr) throw progErr;

      const { error: bkUpdateErr } = await supabase
        .from("booking")
        .update({ 
          status: BOOKING_STATUS.SELESAI, 
          kondisi_saat_ini: avgScore,
        })
        .eq("id", bookingId);

      if (bkUpdateErr) throw bkUpdateErr;

      if (targets && targets.length > 0) {
        for (const t of targets) {
          if (normalizeStatus(t.status) === BOOKING_STATUS.BERJALAN) {
            const nextTerlalui = (t.sesi_terlalui ?? 0) + 1;
            const nextStatus   = nextTerlalui >= t.target_sesi ? BOOKING_STATUS.SELESAI : BOOKING_STATUS.BERJALAN;
            await supabase
              .from("data_target")
              .update({ sesi_terlalui: nextTerlalui, status: nextStatus })
              .eq("id_mahasiswa", booking.id_mahasiswa)
              .eq("nama_target", t.nama_target);
          }
        }
      }

      await syncKonselorStats(booking.id_konselor);
      navigate("/konselor-dashboard");
    } catch (err) {
      console.error("Submit evaluasi error:", err);
      setError(err.message ?? "Gagal menyimpan evaluasi. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="ev-loading">
      <div className="ev-loading-spinner" />
      <p>Memuat data sesi...</p>
    </div>
  );

  if (error && !booking) return (
    <div className="ev-loading">
      <p style={{ color: "#e05c5c", textAlign: "center" }}>
        ⚠️ {error}
      </p>
      <button
        className="ev-btn-back"
        style={{ marginTop: 16 }}
        onClick={() => navigate("/konselor-dashboard")}
      >
        ← Kembali
      </button>
    </div>
  );

  const namaMahasiswa = mahasiswa?.nama ?? booking?.nama_mahasiswa ?? "Klien";
  const initials = namaMahasiswa
    .split(" ")
    .slice(0, 2)
    .map(w => w?.[0] ?? "")
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="ev-shell">
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

          <div className="ev-header">
            <div className="ev-header-tag">Evaluasi Sesi</div>
            <h1>Bagaimana kondisi klien<br />setelah sesi ini?</h1>
            <p>Isi evaluasi singkat ini untuk memantau perkembangan klien dari sesi ke sesi.</p>
          </div>

          <div className="ev-klien-card">
            <div className="ev-klien-avatar">
              {mahasiswa?.foto_url
                ? <img src={mahasiswa.foto_url} alt={namaMahasiswa} />
                : initials
              }
            </div>
            <div>
              <div className="ev-klien-name">{namaMahasiswa}</div>
              <div className="ev-klien-sub">
                {booking?.kategori_masalah} · Sesi ke-{booking?.sesi_konseling ?? 1}
              </div>
            </div>
            <div className="ev-klien-badge">{booking?.id_mahasiswa}</div>
          </div>

          <div className="ev-steps">
            <div className={`ev-step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`} />
            <div className={`ev-step ${step >= 2 ? "active" : ""}`} />
          </div>

          {error && booking && (
            <div className="ev-error-banner" role="alert">
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <div className="ev-card">
              <div className="ev-card-title">Suasana Hati Klien</div>
              <div className="ev-card-sub">Pilih yang paling menggambarkan kondisi emosional klien saat ini</div>
              <div className="ev-mood-grid">
                {SUASANA_HATI_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    className={`ev-mood-btn ${answers.suasana_hati === opt.label ? "selected" : ""}`}
                    onClick={() => setAnswers(p => ({
                      ...p,
                      suasana_hati:     opt.label,
                      suasana_hati_val: opt.value,
                    }))}
                    aria-pressed={answers.suasana_hati === opt.label}
                  >
                    <span className="ev-mood-emoji">{opt.emoji}</span>
                    <span className="ev-mood-label">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="ev-btn-row" style={{ marginTop: 28 }}>
                <button
                  className="ev-btn-next ev-btn-next--full"
                  disabled={!answers.suasana_hati}
                  onClick={() => setStep(2)}
                  style={{ width: "100%" }}
                >
                  {!answers.suasana_hati ? "Pilih suasana hati dulu" : "Lanjut →"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="ev-summary">
                <div className="ev-summary-score">{Math.round(avgScore * 100)}%</div>
                <div className="ev-summary-info">
                  <div className="ev-summary-label">Skor Rata-rata Kondisi</div>
                  <div className="ev-summary-mood">{answers.suasana_hati}</div>
                </div>
              </div>

              <div className="ev-card">
                <div className="ev-card-title">Penilaian Kondisi Klien</div>
                <div className="ev-card-sub">
                  Geser untuk menilai tiap aspek kondisi klien (0 = rendah, 100 = tinggi)
                </div>

                <div className="ev-section">
                  <div className="ev-section-label">📊 Kondisi Awal Klien</div>
                  <div className="ev-section-desc">
                    Bagaimana kondisi klien sebelum sesi dimulai? (skala 0-100)
                  </div>
                  <div className="ev-kondisi-row">
                    <span className="ev-kondisi-badge">Sebelum Sesi</span>
                    <div className="ev-slider-track-wrap" style={{ flex: 1 }}>
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={answers.kondisi_awal}
                        onChange={e => setAnswers(prev => ({ ...prev, kondisi_awal: parseFloat(e.target.value) }))}
                        className="ev-range"
                        style={{ "--val": `${Math.round(answers.kondisi_awal * 100)}%`, "--color": "#e8a838" }}
                      />
                    </div>
                    <div className="ev-kondisi-val" style={{ color: "#e8a838" }}>
                      {Math.round(answers.kondisi_awal * 100)}%
                    </div>
                  </div>
                </div>

                <div className="ev-divider" />

                {SLIDER_FIELDS.map(field => (
                  <SliderField
                    key={field.key}
                    field={field}
                    value={answers[field.key]}
                    onChange={val => handleSliderChange(field.key, val)}
                  />
                ))}

                <div className="ev-divider" />

                <div className="ev-section">
                  <div className="ev-section-label">📝 Catatan Sesi (opsional)</div>
                  <div className="ev-section-desc">
                    Tuliskan catatan atau perkembangan penting selama sesi berlangsung.
                    Catatan ini akan ditampilkan di riwayat klien.
                  </div>
                  <textarea
                    className="ev-textarea"
                    rows={4}
                    placeholder="Contoh: Klien mulai bisa mengidentifikasi pemicu stresnya hari ini... atau Klien menunjukkan kemajuan yang baik dalam mengelola kecemasan..."
                    value={answers.catatan_sesi}
                    onChange={e => setAnswers(prev => ({ ...prev, catatan_sesi: e.target.value }))}
                  />
                  <div className="ev-textarea-hint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Catatan ini hanya bisa dilihat oleh kamu dan klien di riwayat sesi
                  </div>
                </div>

                <div className="ev-btn-row" style={{ marginTop: 28 }}>
                  <button
                    className="ev-btn-back"
                    onClick={() => setStep(1)}
                    disabled={submitting}
                  >
                    ← Kembali
                  </button>
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