import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import {
  BOOKING_STATUS,
  isSelesai,
  isTerjadwal,
  isBerjalan,
  isMenungguEvaluasi,
} from "../lib/bookingStatus.js";
import { syncKonselorStats } from "../lib/konselorStats.js";
import "../styles/sesi-konseling.css";

function timeStr(dateStr) {
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(messages) {
  const groups = {};
  messages.forEach(m => {
    const d = new Date(m.created_at).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!groups[d]) groups[d] = [];
    groups[d].push(m);
  });
  return groups;
}

export default function SesiKonseling() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking]             = useState(null);
  const [konselor, setKonselor]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [isSending, setIsSending]         = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [showEndModal, setShowEndModal]   = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [elapsed, setElapsed]             = useState(0);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sanctuary_user")) ?? {}; }
    catch { return {}; }
  });

  const isKonselor = user?.role === "konselor";
  const userEmail  = (user?.email ?? "").toLowerCase().trim();
  const firstName  = (user?.nama ?? user?.name ?? "Kamu").split(" ")[0];

  useEffect(() => {
    if (!bookingId) { navigate(isKonselor ? "/konselor-dashboard" : "/dashboard"); return; }

    (async () => {
      const { data: bk, error: bkErr } = await supabase
        .from("booking")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      if (bkErr) console.error("booking fetch error:", bkErr);
      if (!bk) { navigate(isKonselor ? "/konselor-dashboard" : "/dashboard"); return; }

      if (isSelesai(bk.status)) {
        alert("Sesi konseling ini sudah selesai. Terima kasih!");
        navigate(isKonselor ? "/konselor-dashboard" : "/dashboard");
        return;
      }

      if (isMenungguEvaluasi(bk.status)) {
        if (!isKonselor) {
          sessionStorage.setItem("sanctuary_pending_ulasan", JSON.stringify({
            bookingId: bk.id,
            konselorId: bk.id_konselor,
          }));
          alert("Sesi telah diakhiri. Yuk berikan ulasan untuk konselormu!");
          navigate(`/konselor/${bk.id_konselor}?ulasan=1`);
          return;
        }
        setBooking(bk);
        const { data: kons } = await supabase
          .from("data_konselor").select("*").eq("id", bk.id_konselor).maybeSingle();
        setKonselor(kons);
        setIsLoading(false);
        return;
      }

      if (isKonselor) {
        if (isTerjadwal(bk.status)) {
          await supabase
            .from("booking")
            .update({ status: BOOKING_STATUS.BERJALAN })
            .eq("id", bookingId);
          bk.status = BOOKING_STATUS.BERJALAN;
        }

        setBooking(bk);
        const { data: kons } = await supabase
          .from("data_konselor").select("*").eq("id", bk.id_konselor).maybeSingle();
        setKonselor(kons);
        setIsLoading(false);
        return;
      }

      let slot = null;
      if (bk.tanggal_sesi) {
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
            hour12: false,
          }).replace(/\./g, ":");
        };

        const isDateOnly = bk.tanggal_sesi.includes("T00:00:00") || !bk.tanggal_sesi.includes("T");
        const bkDateStr  = getWIBDateStr(bk.tanggal_sesi);
        const bkTimeStr  = getWIBTimeStr(bk.tanggal_sesi);

        const { data: slots } = await supabase
          .from("konselor_availability")
          .select("*")
          .eq("konselor_id", bk.id_konselor)
          .eq("tanggal", bkDateStr)
          .eq("status", "booked");

        if (slots && slots.length > 0) {
          slot = slots.find(s => isDateOnly || normalizeTime(s.jam_mulai) === bkTimeStr) || slots[0];
        }
      }

      const normalizeTime = (t) => {
        if (!t) return "00:00:00";
        const parts = t.split(":");
        if (parts.length === 2) return `${t}:00`;
        return t;
      };

      let start = null;
      let end   = null;

      if (slot) {
        start = new Date(`${slot.tanggal}T${normalizeTime(slot.jam_mulai)}+07:00`);
        end   = new Date(`${slot.tanggal}T${normalizeTime(slot.jam_selesai)}+07:00`);
      } else if (bk.tanggal_sesi) {
        start = new Date(bk.tanggal_sesi);
        end   = new Date(start.getTime() + 60 * 60 * 1000);
      }

      const now         = new Date();
      const isTimeRange = start && end && now >= start && now <= end;

      if (isBerjalan(bk.status)) {
        const effectiveEnd = end ?? (bk.tanggal_sesi
          ? new Date(new Date(bk.tanggal_sesi).getTime() + 2 * 60 * 60 * 1000)
          : null);
        if (effectiveEnd && now > effectiveEnd) {
          alert("Jadwal sesi ini sudah berakhir.");
          navigate("/dashboard");
          return;
        }
      }

      if (isTerjadwal(bk.status)) {
        if (isTimeRange) {
          await supabase
            .from("booking")
            .update({ status: BOOKING_STATUS.BERJALAN })
            .eq("id", bookingId);
          bk.status = BOOKING_STATUS.BERJALAN;
        } else {
          if (start && now < start) {
            alert("Sesi ini belum dimulai. Silakan tunggu jadwal sesimu ya!");
          } else {
            alert("Jadwal sesi ini sudah berakhir. Sesi tidak dapat dimulai.");
          }
          navigate("/dashboard");
          return;
        }
      }

      setBooking(bk);

      const { data: kons } = await supabase
        .from("data_konselor").select("*").eq("id", bk.id_konselor).maybeSingle();
      setKonselor(kons);
      setIsLoading(false);
    })();
  }, [bookingId, user]);

  useEffect(() => {
    if (!bookingId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("pesan_sesi")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      if (error) console.error("fetch pesan error:", error);
      setMessages(data ?? []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`sesi-${bookingId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "pesan_sesi",
        filter: `booking_id=eq.${bookingId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;

    const bookingChannel = supabase
      .channel(`booking-status-${bookingId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "booking",
        filter: `id=eq.${bookingId}`,
      }, payload => {
        const st = payload.new.status;
        setBooking(payload.new);
        if (!isKonselor) {
          const konselorId = payload.new.id_konselor;
          if (isMenungguEvaluasi(st)) {
            sessionStorage.setItem("sanctuary_pending_ulasan", JSON.stringify({
              bookingId: payload.new.id,
              konselorId,
            }));
            alert("Sesi telah diakhiri. Yuk berikan ulasan untuk konselormu!");
            navigate(`/konselor/${konselorId}?ulasan=1`);
          } else if (isSelesai(st)) {
            sessionStorage.setItem("sanctuary_pending_ulasan", JSON.stringify({
              bookingId: payload.new.id,
              konselorId,
            }));
            alert("Sesi konseling telah selesai. Terima kasih telah bercerita!");
            navigate(`/konselor/${konselorId}?ulasan=1`);
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(bookingChannel);
  }, [bookingId, user, navigate]);

  useEffect(() => {
    if (isLoading) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const elapsedStr = (() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    if (!bookingId || !userEmail || !firstName) {
      console.error("Missing fields:", { bookingId, userEmail, firstName });
      return;
    }

    setIsSending(true);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const payload = {
      booking_id:     bookingId,
      pengirim_email: userEmail,
      pengirim_nama:  firstName,
      teks:           text,
      tipe:           isKonselor ? "konselor" : "mahasiswa",
    };

    const { error } = await supabase.from("pesan_sesi").insert(payload);
    if (error) {
      console.error("Insert pesan error:", error);
      setInput(text);
    }
    setIsSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const endSession = async () => {
    const { error } = await supabase
      .from("booking")
      .update({ status: BOOKING_STATUS.MENUNGGU_EVALUASI })
      .eq("id", bookingId);

    if (error) {
      console.error("Gagal mengakhiri sesi:", error);
      return;
    }

    if (booking?.id_konselor) {
      syncKonselorStats(booking.id_konselor).catch(() => {});
    }

    navigate(`/evaluasi/${bookingId}`);
  };

  const grouped = groupByDate(messages);

  if (isLoading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#f5fffe",
      fontFamily: "'DM Sans', sans-serif", color: "#2f7d79", fontSize: 15,
    }}>
      Memuat sesi...
    </div>
  );

  return (
    <div className="sesi-konseling-page">

      {showEndModal && (
        <div className="sk-overlay">
          <div className="sk-modal">
            <div className="sk-modal-emoji"></div>
            <h3>Akhiri Sesi Ini?</h3>
            <p>
              Kamu sudah menghabiskan <strong>{elapsedStr}</strong> bersama{" "}
              <strong>{konselor?.nama ?? "konselor"}</strong>.<br />
              Semua pesan akan tersimpan di riwayat sesimu.
            </p>
            <div className="sk-modal-btns">
              <button className="sk-modal-cancel" onClick={() => setShowEndModal(false)}>
                Lanjutkan
              </button>
              <button className="sk-modal-confirm" onClick={endSession}>
                Ya, Akhiri Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="sk-info-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="sk-info-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sk-info-close" onClick={() => setShowInfoModal(false)}>✕</button>
            <div className="sk-info-modal-body">
              <div className="sk-info-avatar-wrap">
                {konselor?.image_url ? (
                  <img src={konselor.image_url} alt={konselor.nama} />
                ) : (
                  <div className="sk-info-avatar-placeholder">
                    {(konselor?.nama ?? "K").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="sk-info-kons-name">{konselor?.nama ?? "—"}</h3>
              {konselor?.kategori_masalah && (
                <div style={{ textAlign: "center", marginTop: 6 }}>
                  <span className="sk-info-kons-cat">{konselor.kategori_masalah}</span>
                </div>
              )}
              {konselor?.["Rating_(Final)"] && (
                <div className="sk-info-rating">
                  ★ {Number(konselor["Rating_(Final)"]).toFixed(1)}
                </div>
              )}
              <div className="sk-info-divider" />
              <div className="sk-info-details">
                <div className="sk-info-detail-row">
                  <span className="sk-info-detail-label">Kamu</span>
                  <span className="sk-info-detail-val">{firstName}</span>
                </div>
                <div className="sk-info-detail-row">
                  <span className="sk-info-detail-label">Kategori</span>
                  <span className="sk-info-detail-val">{booking?.kategori_masalah ?? konselor?.kategori_masalah ?? "—"}</span>
                </div>
                <div className="sk-info-detail-row">
                  <span className="sk-info-detail-label">Durasi Sesi</span>
                  <span className="sk-info-detail-val">{elapsedStr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sk-shell">
        <header className="sk-topbar">
          <span className="sk-topbar-brand" onClick={() => navigate("/")}>
            The <span>Sanctuary</span>
          </span>
          <div
            className="sk-session-info"
            onClick={() => setShowInfoModal(true)}
            style={{ cursor: "pointer" }}
            title="Klik untuk detail sesi"
          >
            <div className="sk-dot" />
            <span className="sk-session-title">
              <span className="sk-session-prefix">Sesi dengan </span>
              {konselor?.nama ?? "Konselor"}
            </span>
            <span className="sk-timer">{elapsedStr}</span>
            <span className="sk-info-icon" style={{ marginLeft: 4, fontSize: 13, opacity: 0.7 }}>ⓘ</span>
          </div>
          {isKonselor ? (
            <button className="sk-end-btn" onClick={() => setShowEndModal(true)}>
              Akhiri Sesi
            </button>
          ) : (
            <button
              className="sk-end-btn"
              style={{ background: "#2f7d79", color: "#fff" }}
              onClick={() => navigate("/dashboard")}
            >
              Kembali ke Dashboard
            </button>
          )}
        </header>

        <div className="sk-body">
          <aside className="sk-left">
            <div className="sk-avatar-wrap">
              {konselor?.image_url
                ? <img src={konselor.image_url} alt={konselor.nama} />
                : (konselor?.nama ?? "K").charAt(0)
              }
            </div>
            <p className="sk-kons-name">{konselor?.nama ?? "—"}</p>
            {konselor?.kategori_masalah && (
              <span className="sk-kons-cat">{konselor.kategori_masalah}</span>
            )}
            {konselor?.["Rating_(Final)"] && (
              <span className="sk-kons-rating">
                {Number(konselor["Rating_(Final)"]).toFixed(1)}
              </span>
            )}
            <div className="sk-divider" />
            <div className="sk-sesi-info">
              <div><strong>Kamu</strong><br />{firstName}</div>
              <div style={{ marginTop: 8 }}>
                <strong>Kategori</strong><br />
                {booking?.kategori_masalah ?? konselor?.kategori_masalah ?? "—"}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Durasi</strong><br />{elapsedStr}
              </div>
            </div>
          </aside>

          <div className="sk-center">
            <div className="sk-messages">
              {messages.length === 0 ? (
                <div className="sk-empty-chat">
                  <span className="sk-empty-emoji"></span>
                  <span>Sesi dimulai! Apa yang ingin kamu ceritakan hari ini?</span>
                </div>
              ) : (
                Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="sk-date-sep">{date}</div>
                    {msgs.map(m => {
                      const isMe = m.pengirim_email.toLowerCase().trim() === userEmail.toLowerCase().trim();
                      return (
                        <div key={m.id} className={`sk-bubble-wrap ${isMe ? "me" : "them"}`}>
                          {!isMe && <span className="sk-sender-label">{m.pengirim_nama}</span>}
                          <div className={`sk-bubble ${isMe ? "me" : "them"}`}>{m.teks}</div>
                          <span className="sk-bubble-time">{timeStr(m.created_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="sk-quick-ref">
              <p className="sk-quick-ref-label">Quick Reflection</p>
              <div className="sk-chips">
                {[
                  "Aku merasa lebih baik sekarang",
                  "Aku masih bingung",
                  "Aku butuh waktu untuk merenung",
                  "Terima kasih sudah mendengarkan",
                ].map(chip => (
                  <button key={chip} className="sk-chip" onClick={() => setInput(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="sk-input-area">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Tulis pesanmu di sini..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
              />
              <button
                className="sk-send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}