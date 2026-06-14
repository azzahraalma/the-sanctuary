import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { useKonselorPushNotif } from "../hooks/useKonselorPushNotif.js";

function Toggle({ checked, onChange, disabled }) {
  return (
    <label className="stg-toggle" style={{ opacity: disabled ? 0.5 : 1, flexShrink: 0 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="stg-toggle-track">
        <span className="stg-toggle-thumb" />
      </span>
    </label>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: "linear-gradient(135deg,#2f7d79,#79d8d1)",
      color: "#fff", padding: "12px 20px", borderRadius: 12,
      fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    }}>
      {msg}
    </div>
  );
}

export default function KonselorNotifSection({ kid, user }) {
  const konselorEmail = (user?.email ?? "").toLowerCase();

  const [pengingat, setPengingat]       = useState(true);   
  const [notifBooking, setNotifBooking] = useState(true);  
  const [notifEmail, setNotifEmail]     = useState(true); 
  const [notifLoaded, setNotifLoaded]   = useState(false);
  const [pushLoading, setPushLoading]   = useState(false);
  const [toast, setToast]               = useState("");

  const {
    status: pushStatus,
    loading: pushHookLoading,
    subscribe,
    unsubscribe,
  } = useKonselorPushNotif(kid, konselorEmail);

  useEffect(() => {
    if (!konselorEmail) return;
    (async () => {
      const { data } = await supabase
        .from("preferensi_notif")
        .select("*")
        .eq("email", konselorEmail)
        .maybeSingle();
      if (data) {
        setPengingat(data.pengingat_sesi    ?? true);
        setNotifBooking(data.notif_booking  ?? true);
        setNotifEmail(data.notif_email      ?? true);
      }
      setNotifLoaded(true);
    })();
  }, [konselorEmail]);

  const saveNotifPref = async (field, val) => {
    if (!konselorEmail) return;
    await supabase
      .from("preferensi_notif")
      .upsert({ email: konselorEmail, [field]: val }, { onConflict: "email" });
    setToast("Preferensi disimpan ✓");
  };

  const handlePengingat    = (v) => { setPengingat(v);    saveNotifPref("pengingat_sesi", v); };
  const handleNotifBooking = (v) => { setNotifBooking(v); saveNotifPref("notif_booking",  v); };
  const handleNotifEmail   = (v) => { setNotifEmail(v);   saveNotifPref("notif_email",    v); };

  const handlePushToggle = async () => {
    if (pushLoading || pushHookLoading) return;
    setPushLoading(true);
    try {
      if (pushStatus === "subscribed") {
        await unsubscribe();
        await saveNotifPref("push_aktif", false);
        setToast("Push notifikasi dinonaktifkan");
      } else {
        if (pushStatus === "unsupported") { setToast("Browser tidak mendukung push notifikasi"); return; }
        if (pushStatus === "denied")      { setToast("Izin notifikasi ditolak — aktifkan di pengaturan browser"); return; }
        await subscribe();
        await saveNotifPref("push_aktif", true);
        setToast("Push notifikasi diaktifkan ✓");
      }
    } finally {
      setPushLoading(false);
    }
  };

  const pushChecked = pushStatus === "subscribed";
  const pushLabel   = {
    idle:         "Memeriksa...",
    unsupported:  "Browser tidak mendukung push notif",
    denied:       "Izin notifikasi ditolak — aktifkan di pengaturan browser",
    subscribed:   "Aktif — kamu akan menerima notifikasi langsung",
    unsubscribed: "Nonaktif",
  }[pushStatus] ?? "";

  const cardStyle = {
    background: "#fff",
    border: "1.5px solid rgba(47,125,121,0.13)",
    borderRadius: 16,
    padding: "20px 24px",
    marginTop: 20,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "14px 0",
    borderBottom: "1px solid #f0f4f4",
  };

  const lastRowStyle = { ...rowStyle, borderBottom: "none", paddingBottom: 0 };

  return (
    <>
      <Toast msg={toast} onDone={() => setToast("")} />

      <div className="kd-card kd-card--wide" style={{ marginTop: 20 }}>
        <div className="kd-card-hd" style={{ marginBottom: 4 }}>
          <div>
            <div className="kd-card-h3">Preferensi Notifikasi</div>
            <div className="kd-card-sub">
              Atur kapan dan bagaimana kamu menerima notifikasi sesi konseling.
            </div>
          </div>
        </div>

        <div style={{
          ...cardStyle,
          background: pushChecked ? "linear-gradient(135deg,#f0fffe,#e4f8f6)" : "#fafbfb",
          border: `1.5px solid ${pushChecked ? "#b0e8e2" : "#e0eeec"}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a3d3a" }}>
                  Push Notification ke Browser / HP
                </p>
                {pushChecked && (
                  <span style={{ background: "#2f7d79", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: ".5px", padding: "2px 8px", borderRadius: 99 }}>
                    AKTIF
                  </span>
                )}
                {pushStatus === "denied" && (
                  <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 9, fontWeight: 700, letterSpacing: ".5px", padding: "2px 8px", borderRadius: 99 }}>
                    DIBLOKIR
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#6b8f8c" }}>{pushLabel}</p>
              {pushStatus === "denied" && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>
                  Buka pengaturan browser → izinkan notifikasi untuk situs ini, lalu muat ulang.
                </p>
              )}
            </div>
            <Toggle
              checked={pushChecked}
              onChange={handlePushToggle}
              disabled={
                pushLoading ||
                pushHookLoading ||
                pushStatus === "unsupported" ||
                pushStatus === "denied"
              }
            />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={rowStyle}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1a3d3a" }}>
                Pengingat Sesi (Push)
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b8f8c" }}>
                Dapatkan push notification 15 menit sebelum sesi dimulai.
              </p>
            </div>
            <Toggle checked={pengingat} onChange={handlePengingat} disabled={!notifLoaded || !pushChecked} />
          </div>

          <div style={rowStyle}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1a3d3a" }}>
                Notifikasi Booking Baru (Push)
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b8f8c" }}>
                Terima push notification saat ada mahasiswa yang booking sesi denganmu.
              </p>
            </div>
            <Toggle checked={notifBooking} onChange={handleNotifBooking} disabled={!notifLoaded || !pushChecked} />
          </div>

          <div style={lastRowStyle}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1a3d3a" }}>
                Notifikasi via Email
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b8f8c" }}>
                Kirim ringkasan booking baru dan pengingat sesi ke <strong>{konselorEmail || "email kamu"}</strong>.
              </p>
            </div>
            <Toggle checked={notifEmail} onChange={handleNotifEmail} disabled={!notifLoaded} />
          </div>
        </div>

        {!pushChecked && pushStatus !== "idle" && (
          <p style={{ fontSize: 11, color: "#aaa", marginTop: 8, textAlign: "center" }}>
            Aktifkan push notification terlebih dahulu untuk mengatur pengingat & notif booking.
          </p>
        )}
      </div>
    </>
  );
}