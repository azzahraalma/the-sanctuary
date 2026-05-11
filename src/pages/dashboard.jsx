import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import data_booking from "../data/data_booking";
import data_konselor from "../data/data_konselor";
import "../styles/dashboard.css";

// ── Map email → ID_Mahasiswa ──────────────────────────────────────
const EMAIL_TO_MID = {
  "pras@sanctuary.com": "M-001",
  "demo@sanctuary.com": "M-002",
};
function getMID(user) {
  if (!user) return null;
  return EMAIL_TO_MID[user.email?.toLowerCase()] ?? null;
}

// ── Donut SVG ─────────────────────────────────────────────────────
function Donut({ pct, size = 88, stroke = 10, color = "#79d8d1", label }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
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

// ── Pertanyaan ────────────────────────────────────────────────────
const PERTANYAAN = {
  kemudahan: [
    { id: "k1", teks: "Tampilan dashboard mudah dipahami",         desc: "Navigasi dan layout secara keseluruhan" },
    { id: "k2", teks: "Menu dan fitur mudah ditemukan",            desc: "Kemudahan akses ke setiap fitur" },
    { id: "k3", teks: "Proses booking konselor mudah dilakukan",   desc: "Alur pembuatan janji temu" },
    { id: "k4", teks: "Informasi yang dibutuhkan mudah diakses",   desc: "Kelengkapan dan aksesibilitas data" },
  ],
  kejelasan: [
    { id: "j1", teks: "Ikon dan tombol memiliki label yang jelas", desc: "Kejelasan teks dan label elemen UI" },
    { id: "j2", teks: "Status sesi konseling ditampilkan jelas",   desc: "Progress dan status sesi" },
    { id: "j3", teks: "Feedback dari sistem mudah dimengerti",     desc: "Notifikasi dan pesan sistem" },
    { id: "j4", teks: "Alur konseling dijelaskan dengan baik",     desc: "Panduan dan onboarding" },
  ],
  daya_tarik: [
    { id: "d1", teks: "Desain visual website menarik",             desc: "Estetika dan tampilan keseluruhan" },
    { id: "d2", teks: "Kombinasi warna nyaman dipandang",          desc: "Skema warna dan kontras" },
    { id: "d3", teks: "Tampilan website terasa profesional",       desc: "Kesan dan branding platform" },
    { id: "d4", teks: "Saya ingin menggunakan platform ini lagi",  desc: "Keseluruhan pengalaman pengguna" },
  ],
};

const TAB_KEYS   = ["kemudahan", "kejelasan", "daya_tarik"];
const TAB_LABELS = { kemudahan: "Kemudahan", kejelasan: "Kejelasan", daya_tarik: "Daya Tarik" };
const DIM_COLOR  = { kemudahan: "#2f7d79", kejelasan: "#1a5e5a", daya_tarik: "#79d8d1" };

const LS_KEY = "sanctuary_ux_kuesioner";

function calcMean(obj) {
  const v = Object.values(obj).filter(Boolean);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
function toIdx(mean) {
  return mean ? Math.round(((mean - 1) / 4) * 100) : 0;
}

// ── SmallDonut (hasil) ────────────────────────────────────────────
function SmallDonut({ pct, color, label }) {
  const size = 120;
  const r = 45;
  const stroke = 12;

  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="db-kues-donut-item">
      <div
        className="db-kues-donut-wrap"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e8e8e0"
            strokeWidth={stroke}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease .15s" }}
          />
        </svg>

        <div className="db-kues-donut-center">
          <span
            className="db-kues-donut-val"
            style={{ color }}
          >
            {pct}
          </span>
        </div>
      </div>

      <span className="db-kues-donut-lbl">{label}</span>
    </div>
  );
}

// ── Kuesioner component ───────────────────────────────────────────
function KuesionerUX({ userName, onScoreChange, userKey }) {
  const storageKey = userKey ? `${LS_KEY}_${userKey}` : LS_KEY;

  const [tab, setTab] = useState("kemudahan");
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.answers ?? { kemudahan: {}, kejelasan: {}, daya_tarik: {} };
      }
    } catch {}
    return { kemudahan: {}, kejelasan: {}, daya_tarik: {} };
  });
  const [submitted, setSubmitted] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.submitted ?? false;
      }
    } catch {}
    return false;
  });

  const means   = TAB_KEYS.reduce((o, t) => ({ ...o, [t]: calcMean(answers[t]) }), {});
  const indices = TAB_KEYS.reduce((o, t) => ({ ...o, [t]: toIdx(means[t])      }), {});
  const uxIdx   = Math.round(TAB_KEYS.reduce((s, t) => s + indices[t], 0) / TAB_KEYS.length);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers, submitted }));
    } catch {}
  }, [answers, submitted, storageKey]);

  useEffect(() => {
    if (submitted) onScoreChange?.(uxIdx);
    else           onScoreChange?.(0);
  }, [submitted, uxIdx]); // eslint-disable-line

  const setAns = (t, id, val) =>
    setAnswers(prev => ({ ...prev, [t]: { ...prev[t], [id]: val } }));

  const totalQ   = TAB_KEYS.flatMap(t => PERTANYAAN[t]).length;
  const answered = TAB_KEYS.reduce((n, t) => n + Object.keys(answers[t]).length, 0);
  const allDone  = answered === totalQ;
  const tabDone  = (t) => Object.keys(answers[t]).length === PERTANYAAN[t].length;

  const submit = () => { if (!allDone) return; setSubmitted(true); };
  const reset  = () => {
    setAnswers({ kemudahan: {}, kejelasan: {}, daya_tarik: {} });
    setSubmitted(false);
    setTab("kemudahan");
    try { localStorage.removeItem(storageKey); } catch {}
  };

  const uxLabel = uxIdx >= 75 ? "Sangat Baik 😊" : uxIdx >= 50 ? "Cukup Baik 😐" : "Perlu Peningkatan 😟";
  const tabIdx  = TAB_KEYS.indexOf(tab);
  const badgeClass = submitted ? "db-kues-badge db-kues-badge--done" : "db-kues-badge";

  if (submitted) return (
    <div className="db-kuesioner-card">
      <div className="db-kues-header">
        <div>
          <h3 className="db-kues-h3">Penilaian UX Website</h3>
          <p className="db-kues-sub">Hasil evaluasi {userName}</p>
        </div>
        <span className={badgeClass}>Selesai ✓</span>
      </div>
      <div className="db-ux-index">
        <span className="db-ux-index-val">{uxIdx}%</span>
        <span className="db-ux-index-lbl">Skor UX Keseluruhan</span>
        <span className="db-ux-index-sub">{uxLabel}</span>
      </div>
      <div className="db-kues-donuts-row">
        {TAB_KEYS.map(k => (
          <SmallDonut key={k} pct={indices[k]} color={DIM_COLOR[k]} label={TAB_LABELS[k]} />
        ))}
      </div>
      <div className="db-kues-hasil">
        <p className="db-kues-hasil-h">Skor Per Dimensi</p>
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
        <p className="db-kues-hasil-h">Detail Jawaban</p>
        {TAB_KEYS.map(k => (
          <div key={k} className="db-kues-detail-group">
            <p className="db-kues-detail-dim" style={{ color: DIM_COLOR[k] }}>{TAB_LABELS[k]}</p>
            {PERTANYAAN[k].map((q, i) => {
              const val = answers[k][q.id] ?? 0;
              return (
                <div key={q.id} className="db-kues-detail-row">
                  <span className="db-kues-detail-q">{i + 1}. {q.teks}</span>
                  <div className="db-kues-detail-track">
                    <div className="db-kues-detail-fill" style={{ width: `${(val/5)*100}%`, background: DIM_COLOR[k] }} />
                  </div>
                  <span className="db-kues-detail-val">{val}/5</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button className="db-kues-submit" onClick={reset} style={{ width: "100%", textAlign: "center" }}>
        Isi Ulang Kuesioner
      </button>
    </div>
  );

  return (
    <div className="db-kuesioner-card">
      <div className="db-kues-header">
        <div>
          <h3 className="db-kues-h3">Penilaian UX Website</h3>
          <p className="db-kues-sub">Bantu kami dengan mengisi kuesioner singkat ini</p>
        </div>
        <span className="db-kues-badge">Skala 1 – 5</span>
      </div>
      <div className="db-kues-progress-wrap">
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--gray)", fontWeight:600 }}>
          <span>Progress pengisian</span>
          <span>{answered} / {totalQ} pertanyaan</span>
        </div>
        <div className="db-kues-progress-track">
          <div className="db-kues-progress-fill" style={{ width:`${(answered/totalQ)*100}%` }} />
        </div>
      </div>
      <div className="db-kues-tabs">
        {TAB_KEYS.map(t => (
          <button key={t} className={`db-kues-tab ${tab === t ? "db-kues-tab--active" : ""}`} onClick={() => setTab(t)}>
            <span>{TAB_LABELS[t]}</span>
            <span className="db-kues-tab-count">{tabDone(t) ? "✓" : `${Object.keys(answers[t]).length}/${PERTANYAAN[t].length}`}</span>
          </button>
        ))}
      </div>
      <div className="db-kues-form">
        {PERTANYAAN[tab].map((q, i) => (
          <div key={q.id} className="db-kues-question">
            <div className="db-kues-q-label">
              <span className="db-kues-q-num">{i + 1}</span>
              {q.teks}
            </div>
            <p className="db-kues-q-desc">{q.desc}</p>
            <div className="db-kues-scale">
              {[1,2,3,4,5].map(v => (
                <button key={v}
                  className={`db-kues-scale-btn ${answers[tab]?.[q.id] === v ? "db-kues-scale-btn--active" : ""}`}
                  onClick={() => setAns(tab, q.id, v)}
                  title={["","Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"][v]}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="db-kues-scale-lbl">
              <span>Tidak Setuju</span>
              <span>Sangat Setuju</span>
            </div>
          </div>
        ))}
      </div>
      <div className="db-kues-nav-row">
        <div style={{ display:"flex", gap:8 }}>
          {tabIdx > 0 && (
            <button className="db-kues-btn-ghost" onClick={() => setTab(TAB_KEYS[tabIdx - 1])}>← Sebelumnya</button>
          )}
          {tabIdx < TAB_KEYS.length - 1 && (
            <button className="db-kues-submit" onClick={() => setTab(TAB_KEYS[tabIdx + 1])}>Selanjutnya →</button>
          )}
        </div>
        {tabIdx === TAB_KEYS.length - 1 && (
          <button className="db-kues-submit" disabled={!allDone} onClick={submit}>
            {allDone ? "Lihat Hasil ✓" : `Isi semua dulu (${answered}/${totalQ})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate  = useNavigate();
  const [uxScore, setUxScore] = useState(0);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  }, []);

  const mid = getMID(user);

  // ── Seed uxScore dari localStorage saat mount ─────────────────
  useEffect(() => {
    const userKey = user?.email?.toLowerCase() ?? "guest";
    const storageKey = `sanctuary_ux_kuesioner_${userKey}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { answers, submitted } = JSON.parse(saved);
        if (submitted && answers) {
          const calcMeanLocal = (obj) => {
            const v = Object.values(obj).filter(Boolean);
            return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
          };
          const toIdxLocal = (mean) => mean ? Math.round(((mean - 1) / 4) * 100) : 0;
          const indices = TAB_KEYS.reduce((o, t) => ({ ...o, [t]: toIdxLocal(calcMeanLocal(answers[t] ?? {})) }), {});
          const uxIdx   = Math.round(TAB_KEYS.reduce((s, t) => s + indices[t], 0) / TAB_KEYS.length);
          setUxScore(uxIdx);
        }
      }
    } catch {}
  }, [user]);

  // ── Data dari dataset ─────────────────────────────────────────
  const myBookings = useMemo(() =>
    data_booking.filter(b => b.ID_Mahasiswa === mid && b.ID_Booking),
  [mid]);

  const totalSesi = myBookings.length;

  // Tanggal sesi terakhir dari booking terakhir
  const lastBooking = myBookings[myBookings.length - 1] ?? null;
  const lastTanggal = lastBooking
    ? new Date(lastBooking.Tanggal_Sesi)
        .toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  // Konselor yang pernah ditangani user
  const myKonselorIDs = [...new Set(myBookings.map(b => b.ID_Konselor))];
  const myKonselor    = data_konselor.filter(k => myKonselorIDs.includes(k.ID));

  // Kategori masalah dari booking pertama user
  const kategoriMasalah = lastBooking?.Kategori_Masalah ?? "-";

  // Kondisi saat ini dari booking terakhir (sebagai persentase)
  const kondisiSaatIni = lastBooking
    ? Math.round(lastBooking.Kondisi_Saat_Ini * 100)
    : 0;

  // Status sesi terakhir
  const statusTerakhir = lastBooking?.Status ?? "-";

  const handleLogout = () => { localStorage.removeItem("sanctuary_user"); navigate("/login"); };
  const firstName    = user?.name?.split(" ")[0] ?? "User";
  const userKey      = user?.email?.toLowerCase() ?? "guest";

  return (
    <div className="db-shell">

      {/* SIDEBAR */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <span className="db-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          <nav className="db-nav">
            <div className="db-nav-item db-nav-item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Home
            </div>
            <div className="db-nav-item" onClick={() => navigate("/statistik")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Statistik
            </div>
            <div className="db-nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              Pengaturan
            </div>
          </nav>
        </div>
        <button className="db-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      </aside>

      {/* MAIN */}
      <main className="db-main">

        {/* TOPBAR */}
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
            <button className="db-topbar-cta" onClick={() => navigate("/konselor")}>Temukan Konselor</button>
            <button className="db-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="db-avatar" onClick={() => navigate("/dashboard")}>
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        <div className="db-content">

          {/* GREETING */}
          <div className="db-greeting">
            <p className="db-greeting-sub">Selamat Datang, {firstName} 👋</p>
            <p className="db-greeting-hint">Temukan kedamaian dan pantau progres perjalananmu</p>
          </div>

          {/* HERO */}
          <div className="db-hero-card">
            <div className="db-hero-left">
              <span className="db-hero-tag">REFLEKSI HARIAN</span>
              <h2 className="db-hero-h2">
                Momen kecil penuh syukur apa yang<br />ingin Anda genggam hari ini?
              </h2>
              <p className="db-hero-p">
                Ceritakan perasaanmu kepada konselor sebaya yang siap mendengarkan.<br />
                Setiap langkah kecil adalah kemajuan yang berarti.
              </p>
              <button className="db-hero-btn" onClick={() => navigate("/konselor")}>
                Temukan Konselor
              </button>
            </div>
            <div className="db-hero-right">
              <Donut pct={uxScore} size={150} stroke={16} color="#79d8d1" label="UX SCORE" />
              <div className="db-hero-badge">
                <p className="db-hero-badge-title">Skor UX Platform</p>
                <p className="db-hero-badge-desc">
                  {uxScore ? `Kamu memberi skor ${uxScore}%` : "Isi kuesioner di bawah untuk melihat skormu!"}
                </p>
              </div>
            </div>
          </div>

          {/* STAT CARDS — semua dari dataset M-001 */}
          <div className="db-stats-row">
            <div className="db-stat-card">
              <span className="db-stat-icon">📋</span>
              {/* Total sesi dari data_booking M-001 */}
              <div className="db-stat-val">{totalSesi}</div>
              <div className="db-stat-lbl">Sesi Konseling</div>
            </div>
            <div className="db-stat-card">
              <span className="db-stat-icon">📅</span>
              {/* Tanggal sesi terakhir dari booking terakhir */}
              <div className="db-stat-val" style={{ fontSize:16 }}>{lastTanggal}</div>
              <div className="db-stat-lbl">Sesi Terakhir</div>
            </div>
            <div className="db-stat-card">
              <span className="db-stat-icon">🎯</span>
              {/* Skor UX dari kuesioner */}
              <div className="db-stat-val">{uxScore ? `${uxScore}%` : "—"}</div>
              <div className="db-stat-lbl">Skor UX Kamu</div>
            </div>
            <div className="db-stat-card">
              <span className="db-stat-icon">🧠</span>
              {/* Jumlah konselor unik yang menangani M-001 */}
              <div className="db-stat-val">{myKonselor.length}</div>
              <div className="db-stat-lbl">Konselor Aktif</div>
            </div>
          </div>

          {/* GRID */}
          <div className="db-grid">

            {/* Kuesioner */}
            <KuesionerUX
              userName={firstName}
              onScoreChange={setUxScore}
              userKey={userKey}
            />

            {/* Konsultasi — dari data booking + konselor M-001 */}
            <div className="db-card">
              <div className="db-card-hd">
                <div>
                  <h3 className="db-card-h3">Konsultasi</h3>
                  <p className="db-card-sub">Daftar konselor yang mendampingimu</p>
                </div>
                <button className="db-card-link" onClick={() => navigate("/konselor")}>Lihat Jadwal →</button>
              </div>
              <div className="db-konsul-list">
                {myKonselor.length === 0 && <p className="db-empty">Belum ada sesi konseling.</p>}
                {myKonselor.map(k => {
                  // Ambil booking yang sesuai konselor ini untuk user M-001
                  const bk = myBookings.find(b => b.ID_Konselor === k.ID);
                  const tgl = bk
                    ? new Date(bk.Tanggal_Sesi).toLocaleDateString("id-ID", { weekday: "long" })
                    : "-";
                  return (
                    <div key={k.ID} className="db-konsul-item">
                      <img src={k.image} alt={k.Nama} className="db-konsul-img" />
                      <div className="db-konsul-info">
                        <p className="db-konsul-name">{k.Nama}</p>
                        {/* Kategori masalah dari booking, bukan hardcode */}
                        <p className="db-konsul-cat">{bk?.Kategori_Masalah ?? k.Kategori_Masalah}</p>
                      </div>
                      <div className="db-konsul-tgl">
                        <span className="db-konsul-day">{tgl}</span>
                        <span className={`db-konsul-status ${bk?.Status === "Selesai" ? "s-done" : "s-run"}`}>
                          {/* Status dari data_booking langsung */}
                          {bk?.Status ?? "-"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pesan — nama konselor dari dataset, bukan placeholder */}
            <div className="db-card">
              <div className="db-card-hd">
                <div>
                  <h3 className="db-card-h3">Pesan Terkini</h3>
                  <p className="db-card-sub">Pesan dari konselor dan tim</p>
                </div>
                <span className="db-badge-new">2 NEW</span>
              </div>
              <div className="db-pesan-list">
                {myKonselor.slice(0, 1).map(k => {
                  const bk = myBookings.find(b => b.ID_Konselor === k.ID);
                  // Pesan berisi info nyata: kategori masalah & sesi
                  const kategori = bk?.Kategori_Masalah ?? k.Kategori_Masalah;
                  const sesiKe   = bk?.Sesi_Konseling ?? 1;
                  return (
                    <div key={k.ID} className="db-pesan-item db-pesan-item--unread">
                      <div className="db-pesan-avatar">{k.Nama.charAt(0)}</div>
                      <div className="db-pesan-body">
                        <div className="db-pesan-head">
                          <span className="db-pesan-name">{k.Nama}</span>
                          <span className="db-pesan-time">20m ago</span>
                        </div>
                        {/* Preview pesan yang relevan dengan data sesi */}
                        <p className="db-pesan-text">
                          "Sesi {sesiKe} terkait {kategori} berjalan sangat baik. Kamu menunjukkan perkembangan yang luar biasa..."
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div className="db-pesan-item">
                  <div className="db-pesan-avatar db-pesan-avatar--team">S</div>
                  <div className="db-pesan-body">
                    <div className="db-pesan-head">
                      <span className="db-pesan-name">The Sanctuary Team</span>
                      <span className="db-pesan-time">yesterday</span>
                    </div>
                    {/* Pesan tim yang relevan dengan status sesi user */}
                    <p className="db-pesan-text">
                      "Selamat! Sesi konselingmu berstatus {statusTerakhir.toLowerCase()}. Terus semangat dalam perjalananmu..."
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <footer className="db-footer">
          <div>
            <span className="db-footer-brand">The Sanctuary</span>
            <p className="db-footer-copy">© 2024 The Editorial Sanctuary. Menciptakan kedamaian melalui data dan empati</p>
          </div>
          <div className="db-footer-links">
            <span>Privacy Policy</span><span>Terms of Service</span>
            <span>Contact Support</span><span>Our Methodology</span>
          </div>
        </footer>

      </main>
    </div>
  );
}