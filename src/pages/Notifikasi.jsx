import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import "../styles/dashboard.css";
import { supabase } from "../lib/supabase.js";

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return "Baru saja";
  if (mins < 60)   return `${mins} menit lalu`;
  if (hours < 24)  return `${hours} jam lalu`;
  if (days < 7)    return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getTipeConfig(tipe = "") {
  if (tipe.startsWith("pasca_sesi") || tipe.startsWith("pengingat_sesi")) {
    return { type: "pesan", label: "Pesan", color: "#2f7d79", bg: "#f0fffe", border: "#b0e8e2" };
  }
  if (tipe === "welcome" || tipe === "motivasi") {
    return { type: "team", label: "Info", color: "#1a5e5a", bg: "#f0fffe", border: "#b0e8e2" };
  }
  return { type: "pesan", label: "Pesan", color: "#2f7d79", bg: "#f0fffe", border: "#b0e8e2" };
}

const FILTER_TABS = ["Semua", "Pesan", "Info"];

export default function Notifikasi() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
    catch { return null; }
  }, []);

  const userEmail = user?.email?.toLowerCase() ?? "";
  const userName  = user?.nama ?? user?.name ?? "Kamu";

  const [notifikasi, setNotifikasi] = useState([]);
  const [dibacaSet, setDibacaSet]   = useState(new Set());
  const [filter, setFilter]         = useState("Semua");
  const [isLoading, setIsLoading]   = useState(!!userEmail);

  useEffect(() => {
    if (!userEmail) return;

    let active = true;
    async function fetchData() {
      const { data: pesanData } = await supabase
        .from("pesan")
        .select("*")
        .eq("id_penerima", userEmail)
        .order("created_at", { ascending: false });

      if (active) {
        const list = (pesanData ?? []).map(p => {
          const cfg = getTipeConfig(p.tipe ?? "");
          return {
            id:      p.id,
            type:    cfg.type,
            label:   cfg.label,
            color:   cfg.color,
            bg:      cfg.bg,
            border:  cfg.border,
            judul:   p.nama_pengirim ?? "The Sanctuary",
            teks:    p.teks,
            waktu:   p.created_at,
            foto:    p.foto_pengirim ?? null,
            inisial: (p.nama_pengirim ?? "S").charAt(0),
            dibaca:  p.dibaca ?? false,
          };
        });

        setNotifikasi(list);
        setIsLoading(false);
      }
    }

    fetchData();

    // Realtime: tampilkan pesan baru tanpa refresh
    const pesanChannel = supabase
      .channel(`notifikasi-pesan-${userEmail}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "pesan",
        filter: `id_penerima=eq.${userEmail}`,
      }, payload => {
        if (!active) return;
        const p = payload.new;
        const cfg = getTipeConfig(p.tipe ?? "");
        setNotifikasi(prev => [{
          id:      p.id,
          type:    cfg.type,
          label:   cfg.label,
          color:   cfg.color,
          bg:      cfg.bg,
          border:  cfg.border,
          judul:   p.nama_pengirim ?? "The Sanctuary",
          teks:    p.teks,
          waktu:   p.created_at,
          foto:    p.foto_pengirim ?? null,
          inisial: (p.nama_pengirim ?? "S").charAt(0),
          dibaca:  p.dibaca ?? false,
        }, ...prev]);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(pesanChannel);
    };
  }, [userEmail]);

  const tandaiBaca = async (item) => {
    if (item.dibaca || dibacaSet.has(item.id)) return;
    setDibacaSet(prev => new Set([...prev, item.id]));
    await supabase.from("pesan").update({ dibaca: true }).eq("id", item.id);
  };

  const tandaiSemuaBaca = async () => {
    const unreadIds = notifikasi
      .filter(n => !n.dibaca && !dibacaSet.has(n.id))
      .map(n => n.id);
    setDibacaSet(new Set(notifikasi.map(n => n.id)));
    if (unreadIds.length > 0) {
      await supabase.from("pesan").update({ dibaca: true }).in("id", unreadIds);
    }
  };

  const filtered = notifikasi.filter(n => {
    if (filter === "Semua") return true;
    if (filter === "Pesan") return n.type === "pesan";
    if (filter === "Info")  return n.type === "team";
    return true;
  });

  const unreadCount = notifikasi.filter(n => !n.dibaca && !dibacaSet.has(n.id)).length;

    return (
    <div className="db-shell">
      {/* ── SIDEBAR ── */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <span className="db-logo" onClick={() => navigate("/")}>The Sanctuary</span>
          <nav className="db-nav">
            <div className="db-nav-item" onClick={() => navigate("/dashboard")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Beranda
            </div>
            <div className="db-nav-item" onClick={() => navigate("/statistik")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Statistik
            </div>
            <div className="db-nav-item" onClick={() => navigate("/riwayat")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Riwayat Sesi
            </div>
            <div className="db-nav-item db-nav-item--active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Notifikasi
            </div>
            <div className="db-nav-item" onClick={() => navigate("/settings")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
              Pengaturan
            </div>
          </nav>
        </div>
        <button className="db-logout" onClick={() => { supabase.auth.signOut(); localStorage.removeItem("sanctuary_user"); navigate("/login"); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
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
              <span onClick={() => navigate("/dashboard")}>Dashboard</span>
            </nav>
          </div>
          <div className="db-topbar-r">
            <div className="db-avatar" onClick={() => navigate("/dashboard")}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="db-content">

          {/* ── HEADER SECTION — back + judul dalam satu baris, filter di bawah ── */}
          <div className="db-greeting">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: "linear-gradient(135deg, #2f7d79, #79d8d1)",
                  border: "none", borderRadius: 10,
                  width: 36, height: 36, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(47,125,121,0.35)",
                  transition: "opacity .2s, transform .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" width="16" height="16">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <p className="db-greeting-sub" style={{ margin: 0 }}>Notifikasi Kamu</p>
            </div>
            <p className="db-greeting-hint">Semua aktivitas dan pesan untukmu, {userName.split(" ")[0]}</p>
          </div>

          {/* ── FILTER BAR ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all .2s",
                    background: filter === tab ? "#2f7d79" : "#f0fffe",
                    color: filter === tab ? "#fff" : "#2f7d79",
                    border: `1px solid ${filter === tab ? "#2f7d79" : "#b0e8e2"}`,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {unreadCount > 0 && (
                <span style={{
                  background: "#2f7d79", color: "#fff", fontSize: 11,
                  fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                }}>
                  {unreadCount} baru
                </span>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={tandaiSemuaBaca}
                  style={{
                    background: "none", border: "1px solid #b0e8e2", borderRadius: 8,
                    padding: "6px 14px", fontSize: 12, color: "#2f7d79", fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>
          </div>

          {/* ── LIST NOTIFIKASI ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isLoading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#6b8f8c", fontSize: 14 }}>
                Memuat notifikasi...
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#6b8f8c", fontSize: 14 }}>
                Belum ada notifikasi di kategori ini
              </div>
            )}

            {!isLoading && filtered.map(n => {
              const dibaca = n.dibaca || dibacaSet.has(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => tandaiBaca(n)}
                  style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    background: dibaca ? "#fafbfb" : n.bg,
                    border: `1px solid ${dibaca ? "#e8eeed" : n.border}`,
                    borderRadius: 14, padding: "16px 18px",
                    cursor: "pointer", transition: "all .2s",
                    opacity: dibaca ? 0.75 : 1,
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: dibaca ? "#e8eeed" : n.bg,
                    border: `2px solid ${dibaca ? "#d0d8d6" : n.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: n.color, overflow: "hidden",
                  }}>
                    {n.foto
                      ? <img src={n.foto} alt={n.inisial} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 16, fontWeight: 700, color: n.color }}>{n.inisial}</span>
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a3d3a" }}>{n.judul}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: ".5px",
                        padding: "2px 8px", borderRadius: 99,
                        background: n.bg, color: n.color,
                        border: `1px solid ${n.border}`,
                      }}>
                        {n.label.toUpperCase()}
                      </span>
                      {!dibaca && (
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: n.color, display: "inline-block", flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#4a6b68", margin: "0 0 6px", lineHeight: 1.5 }}>{n.teks}</p>
                    <span style={{ fontSize: 11, color: "#9bb5b2", fontWeight: 500 }}>{timeAgo(n.waktu)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="db-footer">
          <div>
            <span className="db-footer-brand">The Sanctuary</span>
            <p className="db-footer-copy">© 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan</p>
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