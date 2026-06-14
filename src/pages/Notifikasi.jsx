import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import "../styles/notification.css";
import { supabase } from "../lib/supabase.js";
import { seedPesan } from "../lib/seedPesan.js";
import { useMid } from "../hooks/useMid.js";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTipeConfig(tipe = "") {
  if (tipe.startsWith("pasca_sesi") || tipe.startsWith("pengingat_sesi")) {
    return {
      type: "pesan",
      label: "Pesan",
      color: "#2f7d79",
      bg: "#f0fffe",
      border: "#b0e8e2",
    };
  }
  if (tipe === "welcome" || tipe === "motivasi") {
    return {
      type: "team",
      label: "Info",
      color: "#1a5e5a",
      bg: "#f0fffe",
      border: "#b0e8e2",
    };
  }
  return {
    type: "pesan",
    label: "Pesan",
    color: "#2f7d79",
    bg: "#f0fffe",
    border: "#b0e8e2",
  };
}

const FILTER_TABS = ["Semua", "Pesan", "Info"];

export default function Notifikasi() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("sanctuary_user"));
    } catch {
      return null;
    }
  }, []);

  const userEmail = user?.email?.toLowerCase() ?? "";
  const userName = user?.nama ?? user?.name ?? "Kamu";
  const firstName = userName.split(" ")[0];
  const { mid } = useMid(userEmail);

  const [notifikasi, setNotifikasi] = useState([]);
  const [dibacaSet, setDibacaSet] = useState(new Set());
  const [filter, setFilter] = useState("Semua");
  const [isLoading, setIsLoading] = useState(!!userEmail);

  useEffect(() => {
    if (!userEmail) return;

    let active = true;
    async function fetchData() {
      if (mid) {
        const { data: bookings } = await supabase
          .from("booking")
          .select("*")
          .eq("id_mahasiswa", mid);
        const konselorIds = [
          ...new Set((bookings ?? []).map((b) => b.id_konselor).filter(Boolean)),
        ];
        let konselorData = [];
        if (konselorIds.length > 0) {
          const { data: kData } = await supabase
            .from("data_konselor")
            .select("*")
            .in("id", konselorIds);
          konselorData = kData ?? [];
        }
        await seedPesan(userEmail, firstName, bookings ?? [], konselorData).catch(
          () => {}
        );
      }

      const { data: pesanData } = await supabase
        .from("pesan")
        .select("*")
        .eq("id_penerima", userEmail)
        .order("created_at", { ascending: false });

      if (active) {
        const list = (pesanData ?? []).map((p) => {
          const cfg = getTipeConfig(p.tipe ?? "");
          return {
            id: p.id,
            type: cfg.type,
            label: cfg.label,
            color: cfg.color,
            bg: cfg.bg,
            border: cfg.border,
            judul: p.nama_pengirim ?? "The Sanctuary",
            teks: p.teks,
            waktu: p.created_at,
            foto: p.foto_pengirim ?? null,
            inisial: (p.nama_pengirim ?? "S").charAt(0),
            dibaca: p.dibaca ?? false,
          };
        });

        setNotifikasi(list);
        setIsLoading(false);
      }
    }

    fetchData();

    const pesanChannel = supabase
      .channel(`notifikasi-pesan-${userEmail}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pesan",
          filter: `id_penerima=eq.${userEmail}`,
        },
        (payload) => {
          if (!active) return;
          const p = payload.new;
          const cfg = getTipeConfig(p.tipe ?? "");
          setNotifikasi((prev) => [
            {
              id: p.id,
              type: cfg.type,
              label: cfg.label,
              color: cfg.color,
              bg: cfg.bg,
              border: cfg.border,
              judul: p.nama_pengirim ?? "The Sanctuary",
              teks: p.teks,
              waktu: p.created_at,
              foto: p.foto_pengirim ?? null,
              inisial: (p.nama_pengirim ?? "S").charAt(0),
              dibaca: p.dibaca ?? false,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(pesanChannel);
    };
  }, [userEmail, mid, firstName]);

  const tandaiBaca = async (item) => {
    if (item.dibaca || dibacaSet.has(item.id)) return;
    setDibacaSet((prev) => new Set([...prev, item.id]));
    await supabase.from("pesan").update({ dibaca: true }).eq("id", item.id);
  };

  const tandaiSemuaBaca = async () => {
    const unreadIds = notifikasi
      .filter((n) => !n.dibaca && !dibacaSet.has(n.id))
      .map((n) => n.id);
    setDibacaSet(new Set(notifikasi.map((n) => n.id)));
    if (unreadIds.length > 0) {
      await supabase.from("pesan").update({ dibaca: true }).in("id", unreadIds);
    }
  };

  const filtered = notifikasi.filter((n) => {
    if (filter === "Semua") return true;
    if (filter === "Pesan") return n.type === "pesan";
    if (filter === "Info") return n.type === "team";
    return true;
  });

  const unreadCount = notifikasi.filter(
    (n) => !n.dibaca && !dibacaSet.has(n.id)
  ).length;

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("sanctuary_user");
    navigate("/login");
  };

  return (
    <div className="notif-shell">
      <header className="notif-topbar">
        <div className="notif-topbar-row">
          <div className="notif-topbar-l">
            <span className="notif-logo" onClick={() => navigate("/")}>
              The Sanctuary
            </span>
            <nav className="notif-topbar-nav">
              <span onClick={() => navigate("/?home=1")}>Beranda</span>
              <span onClick={() => navigate("/konselor")}>Konselor</span>
              <span
                className="notif-nav-active"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </span>
            </nav>
          </div>
          <div className="notif-topbar-r">
            <button className="notif-cta" onClick={() => navigate("/konselor")}>
              Temukan Konselor
            </button>
            <button
              className="notif-icon-btn"
              onClick={() => navigate("/notifikasi")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="18"
                height="18"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="notif-avatar" onClick={() => navigate("/settings")}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <button
              className="notif-logout-btn"
              onClick={handleLogout}
              title="Keluar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="notif-main">
        <div className="notif-greeting">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="notif-back-btn" onClick={() => navigate(-1)}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                width="18"
                height="18"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="notif-greeting-content">
              <h1 className="notif-greeting-title">Notifikasi Kamu</h1>
              <p className="notif-greeting-sub">
                Semua aktivitas dan pesan untukmu, {firstName}
              </p>
            </div>
          </div>
        </div>

        <div className="notif-filter-row">
          <div className="notif-filter-buttons">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`notif-filter-btn ${
                  filter === tab ? "notif-filter-btn--active" : ""
                }`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="notif-actions">
            {unreadCount > 0 && (
              <>
                <span className="notif-unread-badge">
                  {unreadCount} belum dibaca
                </span>
                <button className="notif-mark-all-btn" onClick={tandaiSemuaBaca}>
                  Tandai semua dibaca
                </button>
              </>
            )}
          </div>
        </div>

        <div className="notif-list">
          {isLoading && (
            <div className="notif-loading">
              <div className="notif-loading-spinner" />
              <p>Memuat notifikasi...</p>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="notif-empty">
              <p>Belum ada notifikasi di kategori ini</p>
            </div>
          )}

          {!isLoading &&
            filtered.map((n) => {
              const dibaca = n.dibaca || dibacaSet.has(n.id);
              return (
                <div
                  key={n.id}
                  className={`notif-card ${!dibaca ? "notif-card--unread" : ""}`}
                  onClick={() => tandaiBaca(n)}
                >
                  <div className="notif-avatar-wrapper">
                    {n.foto ? (
                      <img src={n.foto} alt={n.inisial} />
                    ) : (
                      <span className="notif-avatar-initial">{n.inisial}</span>
                    )}
                  </div>

                  <div className="notif-content">
                    <div className="notif-header">
                      <span className="notif-sender">{n.judul}</span>
                      <span
                        className="notif-badge"
                        style={{
                          background: n.bg,
                          color: n.color,
                          borderColor: n.border,
                        }}
                      >
                        {n.label.toUpperCase()}
                      </span>
                      {!dibaca && <span className="notif-unread-dot" />}
                    </div>
                    <p className="notif-message">{n.teks}</p>
                    <span className="notif-time">{timeAgo(n.waktu)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      <footer className="notif-footer">
        <div>
          <span className="notif-footer-brand">The Sanctuary</span>
          <p className="notif-footer-copy">
            © 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan
            menguatkan
          </p>
        </div>
        <div className="notif-footer-links">
          <span>Kebijakan Privasi</span>
          <span>Syarat dan Ketentuan</span>
          <span>Bantuan</span>
        </div>
      </footer>
    </div>
  );
}