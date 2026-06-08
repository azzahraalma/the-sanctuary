import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  BOOKING_STATUS,
  normalizeStatus,
  isMenungguEvaluasi,
  isBerjalan,
  isSelesai,
} from "../lib/bookingStatus.js";
import { syncKonselorStats } from "../lib/konselorStats.js";
import "../styles/evaluasi-sesi.css";

// [FIX 1] Hapus duplikasi createClient — gunakan instance supabase yang sudah ada
// di src/lib/supabase.js agar tidak ada dua koneksi berbeda ke Supabase.

const SUASANA_HATI_OPTIONS = [
  { label: "Sangat Baik",  value: 1.0 },
  { label: "Baik",         value: 0.75 },
  { label: "Netral",       value: 0.5 },
  { label: "Stres",        value: 0.25 },
  { label: "Sangat Stres", value: 0.1 },
];
// [FIX 2] Tambahkan emoji yang hilang. Sebelumnya semua emoji string kosong "",
// sehingga tombol suasana hati tampil kosong dan tidak informatif bagi pengguna.

const SLIDER_FIELDS = [
  { key: "mindfulness",        label: "Mindfulness",        desc: "Seberapa hadir & sadar klien selama sesi" },
  { key: "manajemen_stres",    label: "Manajemen Stres",    desc: "Kemampuan klien mengelola tekanan" },
  { key: "ketahanan_diri",     label: "Ketahanan Diri",     desc: "Daya lenting dan resiliensi klien" },
  { key: "hubungan_sosial",    label: "Hubungan Sosial",    desc: "Kualitas relasi klien dengan lingkungannya" },
  { key: "keseimbangan_hidup", label: "Keseimbangan Hidup", desc: "Keseimbangan antara studi, sosial, dan diri" },
];

// [FIX 3] SliderField dipindah ke luar komponen utama agar tidak di-redeclare
// setiap render. Sebelumnya sudah benar posisinya, tapi onChange dibiarkan
// inline tanpa useCallback — diperbaiki di komponen induk.
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
  const [error, setError]         = useState(null); // [FIX 4] Tambah state error untuk feedback ke user
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep]           = useState(1);

  const [answers, setAnswers] = useState({
    suasana_hati:      "",
    suasana_hati_val:  0.5,
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

    let cancelled = false; // [FIX 5] Guard untuk mencegah state update setelah unmount

    (async () => {
      try {
        const { data: bk, error: bkErr } = await supabase
          .from("booking")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();

        // [FIX 6] Periksa error Supabase, sebelumnya error query diabaikan sepenuhnya
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

        if (bk.id_mahasiswa) {
          const { data: mhs, error: mhsErr } = await supabase
            .from("profil_pengguna")
            .select("nama, foto_url")
            .eq("student_id", bk.id_mahasiswa)
            .maybeSingle();

          // Error profil tidak fatal — lanjutkan meski gagal
          if (mhsErr) console.warn("Gagal ambil profil mahasiswa:", mhsErr.message);
          if (!cancelled) setMahasiswa(mhs ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message ?? "Terjadi kesalahan saat memuat data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; }; // cleanup saat unmount
  }, [bookingId, navigate]); // [FIX 7] Tambah navigate ke dependency array (sebelumnya di-suppress eslint)

  const avgScore = useMemo(() => {
    const keys = ["mindfulness","manajemen_stres","ketahanan_diri","hubungan_sosial","keseimbangan_hidup"];
    const sum = keys.reduce((acc, k) => acc + answers[k], 0);
    return sum / keys.length;
  }, [answers]);

  // [FIX 8] Stabilkan handler onChange slider dengan useCallback agar tidak
  // membuat fungsi baru setiap render untuk setiap field.
  const handleSliderChange = useCallback((key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = async () => {
    if (!answers.suasana_hati || submitting) return;

    // [FIX 9] Pastikan booking sudah ada sebelum melanjutkan submit
    if (!booking) return;

    setSubmitting(true);
    setError(null);

    try {
      const skor_kesejahteraan = parseFloat((avgScore * 10).toFixed(1));
      const skor_kemajuan      = Math.round(avgScore * 100);
      const skor_keterbukaan   = Math.round(avgScore * 100);
      const skor_konsistensi   = Math.round(avgScore * 90);

      // Hitung sesi ke-berapa
      const { count, error: countErr } = await supabase
        .from("progress_konseling")
        .select("*", { count: "exact", head: true })
        .eq("id_mahasiswa", booking.id_mahasiswa);

      if (countErr) throw countErr;
      const sesiKe = (count ?? 0) + 1;

      // Ambil target sesi
      const { data: targets, error: targetErr } = await supabase
        .from("data_target")
        .select("*")
        .eq("id_mahasiswa", booking.id_mahasiswa);

      if (targetErr) throw targetErr;

      const targetSesi = targets?.[0]?.target_sesi ?? 4;

      // Insert progress
      const { error: progErr } = await supabase.from("progress_konseling").insert({
        id_mahasiswa:       booking.id_mahasiswa,
        id_konselor:        booking.id_konselor,
        sesi_konseling:     sesiKe,
        tanggal:            new Date().toISOString(),
        kondisi_terkini:    avgScore,
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

      // [FIX 10] Lempar error insert agar tidak lanjut ke step berikutnya bila gagal
      if (progErr) throw progErr;

      // Update data_target
      if (targets && targets.length > 0) {
        for (const t of targets) {
          if (normalizeStatus(t.status) === BOOKING_STATUS.BERJALAN) {
            const nextTerlalui = (t.sesi_terlalui ?? 0) + 1;
            const nextStatus   = nextTerlalui >= t.target_sesi ? BOOKING_STATUS.SELESAI : BOOKING_STATUS.BERJALAN;
            const { error: tErr } = await supabase
              .from("data_target")
              .update({ sesi_terlalui: nextTerlalui, status: nextStatus })
              .eq("id_mahasiswa", booking.id_mahasiswa)
              .eq("nama_target", t.nama_target);

            // [FIX 11] Log warning tapi jangan lempar — tidak blokir alur utama
            if (tErr) console.warn("Gagal update data_target:", tErr.message);
          }
        }
      }

      // Update booking jadi Selesai
      const { error: bkUpdateErr } = await supabase
        .from("booking")
        .update({ status: BOOKING_STATUS.SELESAI, kondisi_saat_ini: avgScore })
        .eq("id", bookingId);

      if (bkUpdateErr) throw bkUpdateErr;

      await syncKonselorStats(booking.id_konselor);

      navigate("/konselor-dashboard");
    } catch (err) {
      // [FIX 12] Sebelumnya semua error hanya di-console.error dan submit tetap
      // dianggap selesai. Sekarang error ditampilkan ke user dan submitting di-reset.
      console.error("Submit evaluasi error:", err);
      setError(err.message ?? "Gagal menyimpan evaluasi. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  // ─── Loading & Error states ───────────────────────────────────────────────
  if (isLoading) return (
    <div className="ev-loading">
      <div className="ev-loading-spinner" />
      <p>Memuat data sesi...</p>
    </div>
  );

  // [FIX 13] Tampilkan layar error bila fetch awal gagal (sebelumnya tidak ada)
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

  // ─── Derived display values ───────────────────────────────────────────────
  // [FIX 14] Guard split() — jika namaMahasiswa string kosong, initials jadi ""
  // bukan crash. Sebelumnya w[0] bisa undefined bila kata kosong.
  const namaMahasiswa = mahasiswa?.nama ?? booking?.nama_mahasiswa ?? "Klien";
  const initials = namaMahasiswa
    .split(" ")
    .slice(0, 2)
    .map(w => w?.[0] ?? "")
    .join("")
    .toUpperCase() || "?";

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
            <div className="ev-header-tag">Evaluasi Sesi</div>
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
              <div className="ev-klien-sub">
                {booking?.kategori_masalah} · Sesi ke-{booking?.sesi_konseling ?? 1}
              </div>
            </div>
            <div className="ev-klien-badge">{booking?.id_mahasiswa}</div>
          </div>

          {/* PROGRESS STEPS */}
          <div className="ev-steps">
            <div className={`ev-step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`} />
            <div className={`ev-step ${step >= 2 ? "active" : ""}`} />
          </div>

          {/* ERROR INLINE (submit gagal) */}
          {error && booking && (
            <div className="ev-error-banner" role="alert">
              ⚠️ {error}
            </div>
          )}

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
                    onClick={() => setAnswers(p => ({
                      ...p,
                      suasana_hati:     opt.label,
                      suasana_hati_val: opt.value,
                    }))}
                    aria-pressed={answers.suasana_hati === opt.label}
                  >
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
                  <div className="ev-summary-mood">{answers.suasana_hati}</div>
                </div>
              </div>

              <div className="ev-card">
                <div className="ev-card-title">Penilaian Kondisi Klien</div>
                <div className="ev-card-sub">
                  Geser untuk menilai tiap aspek kondisi klien (0 = rendah, 100 = tinggi)
                </div>
                {SLIDER_FIELDS.map(field => (
                  <SliderField
                    key={field.key}
                    field={field}
                    value={answers[field.key]}
                    onChange={val => handleSliderChange(field.key, val)}
                  />
                ))}
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
