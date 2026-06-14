import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { isSelesai, isMenungguEvaluasi, normalizeStatus, BOOKING_STATUS } from "../lib/bookingStatus.js";

const EMPTY_FORM = {
  nama: "",
  kategori_masalah: "",
  pengalaman: "",
  bio: "",
  image_url: "",
  keramahan: "",
  solusi: "",
  respon: "",
};

function isDibatalkan(status) {
  return normalizeStatus(status) === BOOKING_STATUS.DIBATALKAN;
}

function isKasusSelesai(status) {
  return isSelesai(status) || isMenungguEvaluasi(status);
}

function avg3(k, s, r) {
  const vals = [Number(k) * 0.3, Number(s) * 0.5, Number(r) * 0.2].filter(
    (v) => !isNaN(v)
  );
  return vals.length ? vals.reduce((a, b) => a + b, 0).toFixed(2) : "0.00";
}

function initials(nama = "") {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function AvatarCircle({ src, nama, size = 48 }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <img
        src={src}
        alt={nama}
        className="km-avatar-img"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      className="km-avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(nama)}
    </div>
  );
}

function StarRow({ val }) {
  const n = Math.round(Number(val) || 0);
  return (
    <span className="km-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={i <= n ? "#2f7d79" : "none"}
          stroke="#2f7d79"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`km-toast km-toast--${type}`}>
      {type === "ok" ? "✓" : "✕"} {msg}
    </div>
  );
}

function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div className="km-overlay" onClick={onCancel}>
      <div className="km-confirm" onClick={(e) => e.stopPropagation()}>
        <p>{msg}</p>
        <div className="km-confirm-btns">
          <button className="km-btn km-btn--ghost" onClick={onCancel}>
            Batal
          </button>
          <button className="km-btn km-btn--danger" onClick={onConfirm}>
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function KonselorDrawer({ mode, data, onClose, onSaved }) {
  const [form, setForm] = useState(
    mode === "edit" && data
      ? {
          nama: data.nama ?? "",
          kategori_masalah: data.kategori_masalah ?? "",
          pengalaman: data.pengalaman ?? "",
          bio: data.bio ?? "",
          image_url: data.image_url ?? data.foto_url ?? "",
          keramahan: data.keramahan ?? "",
          solusi: data.solusi ?? "",
          respon: data.respon ?? "",
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.nama.trim()) {
      setErr("Nama konselor wajib diisi.");
      return;
    }
    setSaving(true);
    setErr("");

    const payload = {
      nama: form.nama.trim(),
      kategori_masalah: form.kategori_masalah.trim(),
      pengalaman: form.pengalaman.trim(),
      bio: form.bio.trim(),
      image_url: form.image_url.trim() || null,
      keramahan: form.keramahan !== "" ? Number(form.keramahan) : null,
      solusi: form.solusi !== "" ? Number(form.solusi) : null,
      respon: form.respon !== "" ? Number(form.respon) : null,
      rating_final:
        form.keramahan && form.solusi && form.respon
          ? Number(avg3(form.keramahan, form.solusi, form.respon))
          : null,
    };

    let result, error;
    if (mode === "edit") {
      ({ data: result, error } = await supabase
        .from("data_konselor")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single());
    } else {
      ({ data: result, error } = await supabase
        .from("data_konselor")
        .insert(payload)
        .select()
        .single());
    }

    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved(result, mode);
  }

  const ratingNote = avg3(form.keramahan, form.solusi, form.respon);

  return (
    <div className="km-overlay" onClick={onClose}>
      <aside className="km-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="km-drawer-header">
          <h2 className="km-drawer-title">
            {mode === "edit" ? "Edit Konselor" : "Tambah Konselor"}
          </h2>
          <button className="km-drawer-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="km-drawer-body">
          <div className="km-drawer-avatar-row">
            <AvatarCircle src={form.image_url} nama={form.nama || "?"} size={64} />
            <div className="km-drawer-avatar-info">
              <span className="km-drawer-avatar-name">{form.nama || "Nama konselor"}</span>
              <span className="km-drawer-avatar-kat">{form.kategori_masalah || "Kategori"}</span>
            </div>
          </div>

          <fieldset className="km-fieldset">
            <legend>Informasi Dasar</legend>
            <label className="km-label">
              Nama Lengkap <span className="km-req">*</span>
            </label>
            <input ref={firstRef} className="km-input" value={form.nama} onChange={set("nama")} placeholder="cth. Almalia Azzahra Wally" />

            <label className="km-label">Kategori Masalah</label>
            <input className="km-input" value={form.kategori_masalah} onChange={set("kategori_masalah")} placeholder="cth. Akademik, Karier, Emosi…" />

            <label className="km-label">Pengalaman</label>
            <input className="km-input" value={form.pengalaman} onChange={set("pengalaman")} placeholder="cth. 2 Thn" />

            <label className="km-label">URL Foto</label>
            <input className="km-input" value={form.image_url} onChange={set("image_url")} placeholder="https://… atau /mentor1.jpg" />
          </fieldset>

          <fieldset className="km-fieldset">
            <legend>Bio</legend>
            <textarea
              className="km-input km-textarea"
              value={form.bio}
              onChange={set("bio")}
              placeholder="Tuliskan bio singkat konselor…"
              rows={4}
            />
          </fieldset>

          <fieldset className="km-fieldset">
            <legend>
              Rating Komponen{" "}
              <span className="km-fieldset-note">→ Rating Final: {ratingNote}</span>
            </legend>
            <div className="km-rating-grid">
              {[
                { key: "keramahan", label: "Keramahan", weight: "30%" },
                { key: "solusi",    label: "Solusi",    weight: "50%" },
                { key: "respon",    label: "Respon",    weight: "20%" },
              ].map(({ key, label, weight }) => (
                <div key={key} className="km-rating-item">
                  <label className="km-label">
                    {label} <span className="km-weight">({weight})</span>
                  </label>
                  <input
                    className="km-input"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form[key]}
                    onChange={set(key)}
                    placeholder="0–5"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {err && <p className="km-form-err">{err}</p>}
        </div>

        <div className="km-drawer-footer">
          <button className="km-btn km-btn--ghost" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button className="km-btn km-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : mode === "edit" ? "Simpan Perubahan" : "Tambah Konselor"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function KonselorDetailPanel({ konselor, onClose, onEdit, onDelete }) {
  const imgSrc = konselor.image_url || konselor.foto_url;
  const rating = Number(konselor.rating_final) || 0;

  return (
    <div className="km-overlay" onClick={onClose}>
      <aside className="km-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="km-drawer-header">
          <span className="km-drawer-eyebrow">Profil Konselor</span>
          <button className="km-drawer-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="km-drawer-body">
          <div className="km-detail-hero">
            <AvatarCircle src={imgSrc} nama={konselor.nama} size={72} />
            <div className="km-detail-hero-info">
              <h3 className="km-detail-name">{konselor.nama}</h3>
              <span className="km-detail-kat">{konselor.kategori_masalah || "—"}</span>
              <div className="km-detail-meta">
                <StarRow val={rating} />
                <span className="km-detail-rating-num">{rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="km-detail-stats">
            {[
              { label: "Pengalaman",    val: konselor.pengalaman || "—" },
              { label: "Jumlah Kasus",  val: konselor.jumlah_kasus ?? "—" },
              { label: "Kasus Selesai", val: konselor.kasus_selesai ?? "—" },
              { label: "Success Rate",  val: konselor.success_rate != null ? `${Math.round(konselor.success_rate * 100)}%` : "—" },
            ].map(({ label, val }) => (
              <div key={label} className="km-detail-stat">
                <span className="km-detail-stat-val">{val}</span>
                <span className="km-detail-stat-lbl">{label}</span>
              </div>
            ))}
          </div>

          <div className="km-detail-rating-breakdown">
            {[
              { label: "Keramahan (30%)", val: Number(konselor.keramahan) || 0 },
              { label: "Solusi (50%)",    val: Number(konselor.solusi)    || 0 },
              { label: "Respon (20%)",    val: Number(konselor.respon)    || 0 },
            ].map(({ label, val }) => (
              <div key={label} className="km-detail-rb-row">
                <span className="km-detail-rb-label">{label}</span>
                <div className="km-detail-rb-track">
                  <div className="km-detail-rb-fill" style={{ width: `${(val / 5) * 100}%` }} />
                </div>
                <span className="km-detail-rb-val">{val.toFixed(1)}</span>
              </div>
            ))}
          </div>

          {konselor.bio && (
            <div className="km-detail-bio">
              <span className="km-detail-bio-label">Bio</span>
              <p>{konselor.bio}</p>
            </div>
          )}

          <div className="km-detail-id">
            <span>ID:</span> <code>{konselor.id}</code>
          </div>
        </div>

        <div className="km-drawer-footer">
          <button
            className="km-btn km-btn--danger-ghost"
            onClick={() => onDelete(konselor)}
          >
            Hapus
          </button>
          <button className="km-btn km-btn--primary" onClick={() => onEdit(konselor)}>
            Edit
          </button>
        </div>
      </aside>
    </div>
  );
}

export function KonselorTab() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");

  const [drawer,  setDrawer]  = useState(null);
  const [detail,  setDetail]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    setError(null);

    // 1. Fetch semua konselor
    const { data: konselor, error: err } = await supabase
      .from("data_konselor")
      .select("*")
      .order("nama", { ascending: true });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const konselorIds = (konselor || []).map((k) => k.id);

    // 2. Fetch booking + ulasan sekaligus (2 query untuk semua konselor)
    const [{ data: allBookings }, { data: allUlasan }] = await Promise.all([
      supabase
        .from("booking")
        .select("id_konselor, status")
        .in("id_konselor", konselorIds),
      supabase
        .from("ulasan_konselor")
        .select("id_konselor, rating")
        .in("id_konselor", konselorIds),
    ]);

    // 3. Group per konselor
    const bookingMap = {};
    (allBookings ?? []).forEach((b) => {
      if (!bookingMap[b.id_konselor]) bookingMap[b.id_konselor] = [];
      bookingMap[b.id_konselor].push(b);
    });

    const ulasanMap = {};
    (allUlasan ?? []).forEach((u) => {
      if (!ulasanMap[u.id_konselor]) ulasanMap[u.id_konselor] = [];
      ulasanMap[u.id_konselor].push(u);
    });

    // 4. Hitung stats live, gabung ke data konselor
    const enriched = (konselor || []).map((k) => {
      const bookings    = (bookingMap[k.id] ?? []).filter((b) => !isDibatalkan(b.status));
      const total       = bookings.length;
      const selesai     = bookings.filter((b) => isKasusSelesai(b.status)).length;
      const successRate = total > 0 ? selesai / total : 0;

      const ratings = (ulasanMap[k.id] ?? [])
        .map((u) => Number(u.rating))
        .filter((r) => r >= 1 && r <= 5);
      const avgUlasan = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

      return {
        ...k,
        jumlah_kasus:  total,
        kasus_selesai: selesai,
        success_rate:  successRate,
        rating_final:  avgUlasan ?? k.rating_final ?? 0,
      };
    });

    setList(enriched);
    setLoading(false);
  }

  const filtered = list.filter((k) => {
    const q = search.toLowerCase();
    return (
      !q ||
      k.nama?.toLowerCase().includes(q) ||
      k.kategori_masalah?.toLowerCase().includes(q)
    );
  });

  function handleSaved(result, mode) {
    if (mode === "edit") {
      setList((prev) => prev.map((k) => (k.id === result.id ? { ...k, ...result } : k)));
      setToast({ msg: "Perubahan berhasil disimpan.", type: "ok" });
    } else {
      setList((prev) => [...prev, result].sort((a, b) => a.nama.localeCompare(b.nama)));
      setToast({ msg: "Konselor baru berhasil ditambahkan.", type: "ok" });
    }
    setDrawer(null);
    setDetail(null);
  }

  async function handleDelete(k) {
    const { error: err } = await supabase
      .from("data_konselor")
      .delete()
      .eq("id", k.id);
    if (err) {
      setToast({ msg: "Gagal menghapus: " + err.message, type: "err" });
    } else {
      setList((prev) => prev.filter((c) => c.id !== k.id));
      setToast({ msg: `${k.nama} berhasil dihapus.`, type: "ok" });
    }
    setConfirm(null);
    setDetail(null);
  }

  return (
    <div className="km-root">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          msg={`Hapus konselor "${confirm.nama}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {detail && !drawer && (
        <KonselorDetailPanel
          konselor={detail}
          onClose={() => setDetail(null)}
          onEdit={(k) => { setDetail(null); setDrawer({ mode: "edit", data: k }); }}
          onDelete={(k) => { setDetail(null); setConfirm(k); }}
        />
      )}
      {drawer && (
        <KonselorDrawer
          mode={drawer.mode}
          data={drawer.data}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="km-toolbar">
        <div className="km-search-wrap">
          <svg className="km-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="km-search"
            type="text"
            placeholder="Cari nama atau kategori…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="km-count">{filtered.length} konselor</span>
        <button className="km-btn km-btn--primary km-add-btn" onClick={() => setDrawer({ mode: "add" })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Konselor
        </button>
        <button className="km-btn km-btn--ghost km-refresh-btn" onClick={fetchList} title="Refresh">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="rsa-loading"><div className="rsa-spinner" /><span>Memuat data konselor…</span></div>
      ) : error ? (
        <div className="rsa-error"><span>Gagal memuat: {error}</span><button onClick={fetchList}>Coba lagi</button></div>
      ) : filtered.length === 0 ? (
        <div className="km-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2f7d79" strokeWidth="1.5" opacity=".4">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{search ? "Tidak ada konselor yang cocok." : "Belum ada konselor. Tambahkan sekarang!"}</span>
        </div>
      ) : (
        <div className="km-grid">
          {filtered.map((k) => {
            const imgSrc = k.image_url || k.foto_url;
            const rating = Number(k.rating_final) || 0;
            const srPct  = k.success_rate != null ? Math.round(k.success_rate * 100) : null;
            return (
              <div
                key={k.id}
                className="km-card"
                onClick={() => setDetail(k)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setDetail(k)}
              >
                <div className="km-card-top">
                  <AvatarCircle src={imgSrc} nama={k.nama} size={52} />
                  <div className="km-card-info">
                    <span className="km-card-name">{k.nama}</span>
                    <span className="km-card-kat">{k.kategori_masalah || "—"}</span>
                    <span className="km-card-exp">{k.pengalaman || "—"}</span>
                  </div>
                  <div className="km-card-rating">
                    <span className="km-card-rating-num">{rating.toFixed(1)}</span>
                    <StarRow val={rating} />
                  </div>
                </div>
                <div className="km-card-bottom">
                  <div className="km-card-stat">
                    <span className="km-card-stat-val">{k.jumlah_kasus ?? "—"}</span>
                    <span className="km-card-stat-lbl">Kasus</span>
                  </div>
                  <div className="km-card-divider" />
                  <div className="km-card-stat">
                    <span className="km-card-stat-val">{k.kasus_selesai ?? "—"}</span>
                    <span className="km-card-stat-lbl">Selesai</span>
                  </div>
                  <div className="km-card-divider" />
                  <div className="km-card-stat">
                    <span className="km-card-stat-val">{srPct != null ? `${srPct}%` : "—"}</span>
                    <span className="km-card-stat-lbl">Success</span>
                  </div>
                  <div className="km-card-actions">
                    <button
                      className="km-icon-btn km-icon-btn--edit"
                      title="Edit"
                      onClick={(e) => { e.stopPropagation(); setDrawer({ mode: "edit", data: k }); }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="km-icon-btn km-icon-btn--del"
                      title="Hapus"
                      onClick={(e) => { e.stopPropagation(); setConfirm(k); }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}