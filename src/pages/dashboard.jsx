import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import "../styles/dashboard.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function Donut({ pct, size = 88, stroke = 10, color = "#79d8d1", label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s ease" }}
        />
      </svg>
      <div className="donut-center">
        <span className="donut-pct">{pct}%</span>
        {label && <span className="donut-lbl">{label}</span>}
      </div>
    </div>
  );
}

const TAB_KEYS = ["kemudahan", "kejelasan", "daya_tarik"];
const TAB_LABELS = {
  kemudahan: "Mudah Dipakai",
  kejelasan: "Mudah Dipahami",
  daya_tarik: "Kenyamanan Tampilan",
};
const DIM_COLOR = {
  kemudahan: "#2f7d79",
  kejelasan: "#1a5e5a",
  daya_tarik: "#79d8d1",
};

function calcMean(obj) {
  const v = Object.values(obj).filter(Boolean);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function toIdx(mean) {
  return mean ? Math.round(((mean - 1) / 4) * 100) : 0;
}

function SmallDonut({ pct, color, label }) {
  const r = 30, stroke = 9;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="db-kues-donut-item">
      <div className="db-kues-donut-wrap">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e8e8e0" strokeWidth={stroke} />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease .15s" }}
          />
        </svg>
        <div className="db-kues-donut-center">
          <span className="db-kues-donut-val" style={{ color }}>{pct}</span>
        </div>
      </div>
      <span className="db-kues-donut-lbl">{label}</span>
    </div>
  );
}

// ─── Modal Pesan ─────────────────────────────────────────────────────────────
function PesanModal({ pesan, onClose }) {
  if (!pesan) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: "28px 24px",
          maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: "#aaa", lineHeight: 1,
          }}
        >✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg,#79d8d1,#2f7d79)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "#fff", fontSize: 16, flexShrink: 0,
            overflow: "hidden",
          }}>
            {pesan.foto
              ? <img src={pesan.foto} alt={pesan.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : pesan.avatar
            }
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", margin: 0 }}>{pesan.nama}</p>
            <p style={{ fontSize: 11, color: "#999", margin: 0 }}>{pesan.waktu}</p>
          </div>
        </div>
        <div style={{
          background: "#f8fffe", border: "1px solid #e0f5f3",
          borderRadius: 12, padding: "16px 18px",
        }}>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.7, margin: 0 }}>
            {pesan.teks}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 18, width: "100%", padding: "10px",
            background: "linear-gradient(135deg,#79d8d1,#2f7d79)",
            color: "#fff", border: "none", borderRadius: 10,
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

function KuesionerUX({ userName, onScoreChange, userKey }) {
  const [tab, setTab] = useState("kemudahan");
  const [pertanyaan, setPertanyaan] = useState({ kemudahan: [], kejelasan: [], daya_tarik: [] });
  const [answers, setAnswers] = useState({ kemudahan: {}, kejelasan: {}, daya_tarik: {} });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const means = TAB_KEYS.reduce((o, t) => ({ ...o, [t]: calcMean(answers[t]) }), {});
  const indices = TAB_KEYS.reduce((o, t) => ({ ...o, [t]: toIdx(means[t]) }), {});
  const uxIdx = Math.round(TAB_KEYS.reduce((s, t) => s + indices[t], 0) / TAB_KEYS.length);

  useEffect(() => {
    onScoreChange?.(submitted ? uxIdx : 0);
  }, [submitted, uxIdx]); // eslint-disable-line

  useEffect(() => {
    async function fetchPertanyaan() {
      const { data, error } = await supabase.from("pertanyaan_kuesioner").select("*");
      if (error) { console.error(error); return; }
      setPertanyaan({
        kemudahan: data.filter(i => i.kategori === "kemudahan"),
        kejelasan: data.filter(i => i.kategori === "kejelasan"),
        daya_tarik: data.filter(i => i.kategori === "daya_tarik"),
      });
    }
    fetchPertanyaan();
  }, []);

  useEffect(() => {
    if (!userKey) { setIsLoading(false); return; }
    async function checkSudahIsi() {
      const { data, error } = await supabase
        .from("hasil_kuesioner")
        .select("*")
        .eq("email", userKey)
        .maybeSingle();
      if (data) {
        setSubmitted(true);
        setAnswers(data.jawaban ?? { kemudahan: {}, kejelasan: {}, daya_tarik: {} });
      }
      if (error) console.error(error);
      setIsLoading(false);
    }
    checkSudahIsi();
  }, [userKey]);

  const setAns = (t, id, val) => setAnswers(p => ({ ...p, [t]: { ...p[t], [id]: val } }));
  const totalQ = TAB_KEYS.flatMap(t => pertanyaan[t]).length;
  const answered = TAB_KEYS.reduce((n, t) => n + Object.keys(answers[t]).length, 0);
  const allDone = totalQ > 0 && answered === totalQ;
  const tabDone = (t) => Object.keys(answers[t]).length === pertanyaan[t].length;
  const tabIdx = TAB_KEYS.indexOf(tab);

  const uxLabel =
    uxIdx >= 75 ? "Website terasa sangat nyaman!"
    : uxIdx >= 50 ? "Website sudah cukup nyaman"
    : "Ada yang perlu kita tingkatkan bareng";

  const handleSubmit = async () => {
    if (!allDone || submitted) return;
    const { error } = await supabase
      .from("hasil_kuesioner")
      .insert([{ email: userKey, nama: userName, ux_score: uxIdx, jawaban: answers }]);
    if (error) {
      console.error(error);
      if (error.code === "23505") alert("Kamu sudah pernah isi kuesioner");
      return;
    }
    setSubmitted(true);
  };

  if (isLoading) return (
    <div className="db-kuesioner-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
      <p style={{ color: "var(--gray)", fontSize: 14 }}>Memuat kuesioner...</p>
    </div>
  );

  if (submitted) return (
    <div className="db-kuesioner-card">
      <div className="db-kues-header">
        <div>
          <h3 className="db-kues-h3">Gimana Pengalaman Kamu?</h3>
          <p className="db-kues-sub">Hasil penilaian dari {userName}</p>
        </div>
        <span className="db-kues-badge db-kues-badge--done">Selesai ✓</span>
      </div>
      <div className="db-ux-index">
        <span className="db-ux-index-val">{uxIdx}%</span>
        <span className="db-ux-index-lbl">Skor Pengalaman Website</span>
        <span className="db-ux-index-sub">{uxLabel}</span>
      </div>
      <div className="db-kues-donuts-row">
        {TAB_KEYS.map(k => (
          <SmallDonut key={k} pct={indices[k]} color={DIM_COLOR[k]} label={TAB_LABELS[k]} />
        ))}
      </div>
      <div className="db-kues-hasil">
        <p className="db-kues-hasil-h">Skor Per Aspek</p>
        {TAB_KEYS.map(k => (
          <div key={k} className="db-kues-result-row">
            <span className="db-kues-result-label">{TAB_LABELS[k]}</span>
            <div className="db-kues-result-track">
              <div className="db-kues-result-fill" style={{ width: `${indices[k]}%`, background: `linear-gradient(90deg,${DIM_COLOR[k]},#79d8d1)` }} />
            </div>
            <span className="db-kues-result-val" style={{ color: DIM_COLOR[k] }}>{indices[k]}%</span>
          </div>
        ))}
      </div>
      <div className="db-kues-detail">
        <p className="db-kues-hasil-h">Detail Jawaban Kamu</p>
        {TAB_KEYS.map(k => (
          <div key={k} className="db-kues-detail-group">
            <p className="db-kues-detail-dim" style={{ color: DIM_COLOR[k] }}>{TAB_LABELS[k]}</p>
            {pertanyaan[k].map((q, i) => {
              const val = answers[k]?.[q.id] ?? 0;
              return (
                <div key={q.id} className="db-kues-detail-row">
                  <span className="db-kues-detail-q">{i + 1}. {q.teks}</span>
                  <div className="db-kues-detail-track">
                    <div className="db-kues-detail-fill" style={{ width: `${(val / 5) * 100}%`, background: DIM_COLOR[k] }} />
                  </div>
                  <span className="db-kues-detail-val">{val}/5</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="db-kuesioner-card">
      <div className="db-kues-header">
        <div>
          <h3 className="db-kues-h3">Gimana Pengalaman Kamu?</h3>
          <p className="db-kues-sub">Bantu kami jadi lebih baik dengan cerita pengalamanmu</p>
        </div>
        <span className="db-kues-badge">Skala 1 – 5</span>
      </div>
      <div className="db-kues-progress-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--gray)", fontWeight: 600 }}>
          <span>Progres pengisian</span>
          <span>{answered} dari {totalQ} pertanyaan</span>
        </div>
        <div className="db-kues-progress-track">
          <div className="db-kues-progress-fill" style={{ width: `${(answered / totalQ) * 100}%` }} />
        </div>
      </div>
      <div className="db-kues-tabs">
        {TAB_KEYS.map(t => (
          <button key={t} className={`db-kues-tab ${tab === t ? "db-kues-tab--active" : ""}`} onClick={() => setTab(t)}>
            <span>{TAB_LABELS[t]}</span>
            <span className="db-kues-tab-count">
              {tabDone(t) ? "✓" : `${Object.keys(answers[t]).length}/${pertanyaan[t].length}`}
            </span>
          </button>
        ))}
      </div>
      <div className="db-kues-form">
        {pertanyaan[tab].map((q, i) => (
          <div key={q.id} className="db-kues-question">
            <div className="db-kues-q-label">
              <span className="db-kues-q-num">{i + 1}</span>
              {q.teks}
            </div>
            <p className="db-kues-q-desc">{q.deskripsi}</p>
            <div className="db-kues-scale">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  className={`db-kues-scale-btn ${answers[tab]?.[q.id] === v ? "db-kues-scale-btn--active" : ""}`}
                  onClick={() => setAns(tab, q.id, v)}
                  title={["", "Sangat Tidak Setuju", "Tidak Setuju", "Netral", "Setuju", "Sangat Setuju"][v]}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="db-kues-scale-lbl">
              <span>Nggak setuju</span>
              <span>Sangat setuju</span>
            </div>
          </div>
        ))}
      </div>
      <div className="db-kues-nav-row">
        <div style={{ display: "flex", gap: 8 }}>
          {tabIdx > 0 && (
            <button className="db-kues-btn-ghost" onClick={() => setTab(TAB_KEYS[tabIdx - 1])}>← Sebelumnya</button>
          )}
          {tabIdx < TAB_KEYS.length - 1 && (
            <button className="db-kues-submit" onClick={() => setTab(TAB_KEYS[tabIdx + 1])}>Selanjutnya →</button>
          )}
        </div>
        {tabIdx === TAB_KEYS.length - 1 && (
          <button className="db-kues-submit" disabled={!allDone} onClick={handleSubmit}>
            {allDone ? "Lihat Hasil ✓" : `Isi semua dulu (${answered}/${totalQ})`}
          </button>
        )}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

async function seedPesan(email, firstName, bookings, konselorData) {
  const { data: existing } = await supabase
    .from("pesan")
    .select("tipe")
    .eq("id_penerima", email);

  const tipeYangAda = new Set((existing ?? []).map(p => p.tipe));
  const toInsert = [];

  if (!tipeYangAda.has("welcome")) {
    toInsert.push({
      id_penerima: email,
      id_pengirim: "sanctuary-team",
      nama_pengirim: "The Sanctuary Team",
      foto_pengirim: null,
      teks: `Halo ${firstName}! Senang kamu bergabung di Sanctuary. Gimana kabarmu hari ini? Kami selalu ada buat mendengarkan`,
      dibaca: false,
      tipe: "welcome",
    });
  }

  for (const k of (konselorData ?? [])) {
    const bk = bookings.find(b => b.id_konselor === k.id);
    if (!bk) continue;

    if (bk.status === "Selesai") {
      const tipe = `pasca_sesi_${k.id}`;
      if (!tipeYangAda.has(tipe)) {
        toInsert.push({
          id_penerima: email,
          id_pengirim: k.id,
          nama_pengirim: k.nama,
          foto_pengirim: k.foto_url ?? null,
          teks: `Sesi ${bk.sesi_konseling} kita udah selesai ya ${firstName}! Gimana perasaanmu sekarang? Semangat terus, kamu udah berani cerita`,
          dibaca: false,
          tipe,
        });
      }
    } else if (bk.status === "Berjalan") {
      const tipe = `pengingat_sesi_${k.id}`;
      if (!tipeYangAda.has(tipe)) {
        const tglSesi = new Date(bk.tanggal_sesi).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long",
        });
        toInsert.push({
          id_penerima: email,
          id_pengirim: k.id,
          nama_pengirim: k.nama,
          foto_pengirim: k.foto_url ?? null,
          teks: `Hai ${firstName}! Jangan lupa sesi kita ${tglSesi} ya Siapkan dirimu, aku siap mendengarkan`,
          dibaca: false,
          tipe,
        });
      }
    }
  }

  if (!tipeYangAda.has("motivasi")) {
    toInsert.push({
      id_penerima: email,
      id_pengirim: "sanctuary-team",
      nama_pengirim: "The Sanctuary Team",
      foto_pengirim: null,
      teks: "Makasih udah jadi bagian dari Sanctuary, Semoga hari-harimu terasa lebih ringan.",
      dibaca: false,
      tipe: "motivasi",
    });
  }

  if (toInsert.length > 0) {
    await supabase.from("pesan").insert(toInsert);
  }
}

// ─── Status yang dianggap "aktif" untuk tombol Mulai Sesi ─────────────────────
const STATUS_AKTIF = ["berjalan", "terjadwal", "Berjalan", "Terjadwal", "aktif", "Aktif"];

export default function Dashboard() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  }, []);

  const userEmail = user?.email?.toLowerCase() ?? null;
  const firstName = (user?.nama ?? user?.name ?? "Kamu").split(" ")[0];

  const [mid, setMid]                   = useState(() => {
    if (!userEmail) return null;
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) return saved.student_id;
    } catch { /* ignore */ }
    return null;
  });
  const [bookings, setBookings]         = useState([]);
  const [konselor, setKonselor]         = useState([]);
  const [progress, setProgress]         = useState([]);
  const [pesan, setPesan]               = useState([]);
  const [isLoading, setIsLoading]       = useState(() => {
    if (!userEmail) return false;
    return true;
  });
  const [selectedPesan, setSelectedPesan] = useState(null);
  const [slots, setSlots]                 = useState([]);
  const [now, setNow]                     = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // ── Step 1: Fetch student_id dari profil_pengguna ──
  useEffect(() => {
    if (!userEmail) return;
    try {
      const saved = JSON.parse(localStorage.getItem("sanctuary_user"));
      if (saved?.student_id) return;
    } catch { /* ignore */ }

    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profil_pengguna")
        .select("student_id")
        .eq("email", userEmail)
        .maybeSingle();
      if (active) {
        setMid(data?.student_id ?? null);
        if (!data?.student_id) {
          setIsLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [userEmail]);

  // ── Step 2: Fetch semua data dashboard pakai mid ──
  useEffect(() => {
    if (!mid) return;

    let active = true;
    async function fetchDashboardData() {
      const [bookingRes, progressRes] = await Promise.all([
        supabase
          .from("booking")
          .select("*")
          .eq("id_mahasiswa", mid)
          .order("tanggal_sesi", { ascending: false }),
        supabase
          .from("progress_konseling")
          .select("*")
          .eq("id_mahasiswa", mid)
          .order("sesi_konseling", { ascending: false }),
      ]);

      if (!active) return;

      const myBookings = bookingRes.data ?? [];
      const myProgress = (progressRes.data ?? []).map(p => ({
        ...p,
        mindfulness: Number(p.mindfulness) || 0,
      }));

      setBookings(myBookings);
      setProgress(myProgress);

      const konselorIds = [...new Set(myBookings.map(b => b.id_konselor).filter(Boolean))];
      let konselorData = [];
      let slotsData = [];

      if (konselorIds.length > 0) {
        const [kRes, sRes] = await Promise.all([
          supabase
            .from("data_konselor")
            .select("*")
            .in("id", konselorIds),
          supabase
            .from("konselor_availability")
            .select("*")
            .in("konselor_id", konselorIds)
            .eq("status", "booked")
        ]);
        konselorData = kRes.data ?? [];
        slotsData = sRes.data ?? [];
        if (active) {
          setKonselor(konselorData);
          setSlots(slotsData);
        }
      }

      await seedPesan(userEmail, firstName, myBookings, konselorData);

      const { data: pesanData } = await supabase
        .from("pesan")
        .select("*")
        .eq("id_penerima", userEmail)
        .order("created_at", { ascending: false });

      if (active) {
        setPesan((pesanData ?? []).map(p => ({
          id: p.id,
          nama: p.nama_pengirim,
          avatar: p.nama_pengirim?.charAt(0) ?? "S",
          foto: p.foto_pengirim ?? null,
          waktu: timeAgo(p.created_at),
          teks: p.teks,
          unread: !p.dibaca,
        })));
        setIsLoading(false);
      }
    }

    fetchDashboardData();

    // Subscribe ke perubahan booking secara realtime agar status terupdate
    const bookingChannel = supabase
      .channel(`student-bookings-${mid}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "booking",
        filter: `id_mahasiswa=eq.${mid}`,
      }, () => {
        if (active) {
          fetchDashboardData();
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(bookingChannel);
    };
  }, [mid]); // eslint-disable-line

  const handlePesanClick = async (p) => {
    setSelectedPesan(p);
    if (p.unread) {
      await supabase
        .from("pesan")
        .update({ dibaca: true })
        .eq("id", p.id);
      setPesan(prev => prev.map(item =>
        item.id === p.id ? { ...item, unread: false } : item
      ));
    }
  };

  const latestProgress = progress[0] ?? null;
  const totalSesi      = bookings.length;
  const lastBooking    = bookings[0] ?? null;
  const lastTanggal    = lastBooking
    ? new Date(lastBooking.tanggal_sesi).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  const mindfulnessPct = Math.round((latestProgress?.mindfulness ?? 0) * 100);
  const unreadCount    = pesan.filter(p => p.unread).length;

  const handleLogout = () => {
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  const userKey = userEmail ?? "guest";

  return (
    <div className="db-shell">
      <PesanModal
        pesan={selectedPesan}
        onClose={() => setSelectedPesan(null)}
      />

      {/* ── SIDEBAR ── */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <span className="db-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          <nav className="db-nav">
            <div className="db-nav-item db-nav-item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Beranda
            </div>
            <div className="db-nav-item" onClick={() => navigate("/statistik")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Statistik
            </div>
            <div className="db-nav-item" onClick={() => navigate("/riwayat")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Riwayat Sesi
            </div>
            <div className="db-nav-item" onClick={() => navigate("/settings")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              </svg>
              Pengaturan
            </div>
          </nav>
        </div>
        <button className="db-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Keluar
        </button>
      </aside>

      <main className="db-main">
        {/* ── TOPBAR ── */}
        <header className="db-topbar">
          <div className="db-topbar-l">
            <span className="db-topbar-logo" onClick={() => navigate("/")}>The Sanctuary</span>
            <nav className="db-topbar-nav">
              <span onClick={() => navigate("/")}>Beranda</span>
              <span onClick={() => navigate("/konselor")}>Konselor</span>
              <span className="db-topbar-active">Dashboard</span>
            </nav>
          </div>
          <div className="db-topbar-r">
            <button className="db-topbar-cta" onClick={() => navigate("/konselor")}>Cari Teman Cerita</button>
            <button
              className="db-icon-btn"
              onClick={() => navigate("/notifikasi")}
              style={{ position: "relative" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#2f7d79", border: "2px solid #fff",
                }} />
              )}
            </button>
            <div className="db-avatar" onClick={() => navigate("/dashboard")}>
              {(user?.nama ?? user?.name ?? "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="db-content">
          <div className="db-greeting">
            <p className="db-greeting-sub">Halo, {firstName} 👋</p>
            <p className="db-greeting-hint">Senang kamu ada di sini. Yuk pantau perjalanan konselingmu hari ini 🌱</p>
          </div>

          <div className="db-hero-card">
            <div className="db-hero-left">
              <span className="db-hero-tag">RUANG CERITA HARI INI</span>
              <h2 className="db-hero-h2">
                Apa yang sedang kamu rasakan<br />akhir-akhir ini?
              </h2>
              <p className="db-hero-p">
                Kamu nggak harus menghadapi semuanya sendiri.<br />
                Ceritakan apa yang kamu rasakan kepada konselor sebaya yang siap mendengarkan.
              </p>
              <button className="db-hero-btn" onClick={() => navigate("/konselor")}>
                Cari Teman Cerita
              </button>
            </div>
            <div className="db-hero-right">
              <Donut pct={mindfulnessPct} size={150} stroke={16} color="#79d8d1" label="MINDFULNESS" />
              <div className="db-hero-badge">
                <p className="db-hero-badge-title">Progres Mindfulness Kamu</p>
                <p className="db-hero-badge-desc">
                  {mindfulnessPct > 0
                    ? `Sudah di ${mindfulnessPct}% — terus jaga konsistensinya ya! 🌿`
                    : "Mulai sesi pertama untuk lihat perkembangan mindfulness-mu ✨"}
                </p>
              </div>
            </div>
          </div>

          <div className="db-stats-row">
            <div className="db-stat-card">
              <span className="db-stat-icon">💬</span>
              <div className="db-stat-val">{isLoading ? "..." : totalSesi}</div>
              <div className="db-stat-lbl">Total Sesi Cerita</div>
            </div>
            <div className="db-stat-card">
              <span className="db-stat-icon">📅</span>
              <div className="db-stat-val" style={{ fontSize: 16 }}>{isLoading ? "..." : lastTanggal}</div>
              <div className="db-stat-lbl">Terakhir Konseling</div>
            </div>
            <div className="db-stat-card">
              <span className="db-stat-icon">🌿</span>
              <div className="db-stat-val">{isLoading ? "..." : mindfulnessPct ? `${mindfulnessPct}%` : "—"}</div>
              <div className="db-stat-lbl">Progres Mindfulness</div>
            </div>
            <div className="db-stat-card">
              <span className="db-stat-icon">🤝</span>
              <div className="db-stat-val">{isLoading ? "..." : konselor.length}</div>
              <div className="db-stat-lbl">Teman Konselor</div>
            </div>
          </div>

          <div className="db-grid">
            <KuesionerUX
              userName={firstName}
              userKey={userKey}
            />

            {/* ── Sesi Konseling ── */}
            <div className="db-card">
              <div className="db-card-hd">
                <div>
                  <h3 className="db-card-h3">Sesi Konseling Kamu</h3>
                  <p className="db-card-sub">Teman konselor yang sudah menemanimu cerita</p>
                </div>
                <button className="db-card-link" onClick={() => navigate("/riwayat")}>Lihat Semua →</button>
              </div>
              <div className="db-konsul-list">
                {isLoading && <p className="db-empty">Memuat data... 🌱</p>}
                {!isLoading && konselor.length === 0 && (
                  <p className="db-empty">Kamu belum punya sesi konseling. Yuk mulai cerita 🌱</p>
                )}
                {!isLoading && konselor.map(k => {
                  const bk = bookings.find(b => b.id_konselor === k.id);
                  const tgl = bk
                    ? new Date(bk.tanggal_sesi).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long" })
                    : "-";

                  const isBerjalan = bk && ["Berjalan", "berjalan", "aktif", "Aktif"].includes(bk.status);

                  const normalizeTime = (t) => {
                    if (!t) return "00:00:00";
                    const parts = t.split(":");
                    if (parts.length === 2) return `${t}:00`;
                    return t;
                  };

                  const getWIBDateStr = (dateStr) => {
                    if (!dateStr) return "";
                    const date = new Date(dateStr);
                    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
                  };

                  const getWIBTimeStr = (dateStr) => {
                    if (!dateStr) return "00:00:00";
                    const date = new Date(dateStr);
                    return date.toLocaleTimeString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false
                    }).replace(/\./g, ":");
                  };

                  const isDateOnly = bk && bk.tanggal_sesi && (bk.tanggal_sesi.includes("T00:00:00") || !bk.tanggal_sesi.includes("T"));

                  const bkDateStr = bk && bk.tanggal_sesi ? getWIBDateStr(bk.tanggal_sesi) : "";
                  const bkTimeStr = bk && bk.tanggal_sesi ? getWIBTimeStr(bk.tanggal_sesi) : "00:00:00";

                  const matchedSlot = slots.find(s => 
                    s.konselor_id === bk?.id_konselor &&
                    s.tanggal === bkDateStr &&
                    (isDateOnly || normalizeTime(s.jam_mulai) === bkTimeStr)
                  );

                  let start = null;
                  let end = null;

                  if (matchedSlot) {
                    start = new Date(`${matchedSlot.tanggal}T${normalizeTime(matchedSlot.jam_mulai)}+07:00`);
                    end = new Date(`${matchedSlot.tanggal}T${normalizeTime(matchedSlot.jam_selesai)}+07:00`);
                  } else if (bk && bk.tanggal_sesi) {
                    start = new Date(bk.tanggal_sesi);
                    end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour fallback
                  }

                  const startBuffer = start;
                  const isTimeRange = startBuffer && end && now >= startBuffer && now <= end;

                  const showMulaiSesiButton = bk && ["Terjadwal", "terjadwal"].includes(bk.status) && isTimeRange;
                  const showMasukSesiButton = isBerjalan;

                  let statusHelperText = null;
                  if (bk && ["Terjadwal", "terjadwal"].includes(bk.status)) {
                    if (startBuffer && now < startBuffer) {
                      const jamStr = start.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
                      statusHelperText = `Mulai pukul ${jamStr} ⏱`;
                    } else if (end && now > end) {
                      statusHelperText = "Jadwal Terlewat ⌛";
                    }
                  }

                  return (
                    <div
                      key={k.id}
                      className="db-konsul-item"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/riwayat")}
                    >
                      <img src={k.image_url ?? k.foto_url} alt={k.nama} className="db-konsul-img" />
                      <div className="db-konsul-info">
                        <p className="db-konsul-name">{k.nama}</p>
                        <p className="db-konsul-cat">{bk?.kategori_masalah ?? k.kategori_masalah}</p>
                      </div>
                      <div className="db-konsul-tgl" style={{ alignItems: "flex-end", gap: 6 }}>
                        <span className="db-konsul-day">{tgl}</span>
                        <span className={`db-konsul-status ${bk?.status === "Selesai" ? "s-done" : "s-run"}`}>
                          {bk?.status ?? "-"}
                        </span>
                        {statusHelperText && (
                          <span className="db-status-helper" style={{ fontSize: "0.75rem", color: "#666", marginTop: 4, fontWeight: "500" }}>
                            {statusHelperText}
                          </span>
                        )}
                        {/* ── Tombol Mulai Sesi ── */}
                        {showMasukSesiButton && (
                          <button
                            className="db-btn-mulai-sesi"
                            onClick={e => {
                              e.stopPropagation(); // jangan trigger navigate ke /riwayat
                              navigate(`/sesi/${bk.id}`);
                            }}
                          >
                            Masuk Sesi →
                          </button>
                        )}
                        {showMulaiSesiButton && (
                          <button
                            className="db-btn-mulai-sesi"
                            onClick={async e => {
                              e.stopPropagation(); // jangan trigger navigate ke /riwayat
                              // Update status ke "Berjalan" agar aktif bagi kedua pihak
                              await supabase
                                .from("booking")
                                .update({ status: "Berjalan" })
                                .eq("id", bk.id);
                              navigate(`/sesi/${bk.id}`);
                            }}
                          >
                            Mulai Sesi →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Pesan Masuk ── */}
            <div className="db-card">
              <div className="db-card-hd">
                <div>
                  <h3 className="db-card-h3">Pesan Masuk</h3>
                  <p className="db-card-sub">Dukungan dan pesan terbaru untukmu</p>
                </div>
                {unreadCount > 0 && (
                  <span className="db-badge-new">{unreadCount} NEW</span>
                )}
              </div>
              <div className="db-pesan-list">
                {isLoading && <p className="db-empty">Memuat pesan... 🌱</p>}
                {!isLoading && pesan.length === 0 && (
                  <p className="db-empty">Belum ada pesan masuk 🌱</p>
                )}
                {!isLoading && pesan.map(p => (
                  <div
                    key={p.id}
                    className={`db-pesan-item ${p.unread ? "db-pesan-item--unread" : ""}`}
                    onClick={() => handlePesanClick(p)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="db-pesan-avatar">
                      {p.foto
                        ? <img src={p.foto} alt={p.nama} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        : p.avatar
                      }
                    </div>
                    <div className="db-pesan-body">
                      <div className="db-pesan-head">
                        <span className="db-pesan-name">{p.nama}</span>
                        <span className="db-pesan-time">{p.waktu}</span>
                      </div>
                      <p className="db-pesan-text">"{p.teks.length > 60 ? p.teks.slice(0, 60) + "..." : p.teks}"</p>
                    </div>
                    {p.unread && (
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#79d8d1", flexShrink: 0, alignSelf: "center",
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="db-footer">
          <div>
            <span className="db-footer-brand">The Sanctuary</span>
            <p className="db-footer-copy">© 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan 🌱</p>
          </div>
          <div className="db-footer-links">
            <span>Kebijakan Privasi</span>
            <span>Syarat dan Ketentuan</span>
            <span>Bantuan</span>
          </div>
        </footer>
      </main>
    </div>
  );
}