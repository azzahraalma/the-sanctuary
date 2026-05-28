import { useState, useRef } from "react";
import { createPortal } from "react-dom";

const SPESIALISASI_DEFAULT = [
    { icon: "📊", title: "Manajemen Stres Akademik", desc: "Membantu mahasiswa mengelola tekanan tugas, ujian, dan deadline dengan strategi yang efektif dan berkelanjutan." },
    { icon: "🧠", title: "Kesejahteraan Mental", desc: "Pendampingan untuk menjaga keseimbangan mental di tengah tuntutan perkuliahan yang tinggi." },
    { icon: "🎯", title: "Fokus & Produktivitas", desc: "Teknik dan strategi untuk meningkatkan konsentrasi belajar dan produktivitas akademik sehari-hari." },
];

export default function EditProfilModal({ profil, onSave, onClose }) {
    const [foto, setFoto]         = useState(profil?.foto || profil?.image || null);
    const [bio, setBio]           = useState(profil?.bio || "");
    const [keahlian, setKeahlian] = useState(profil?.spesialisasi || SPESIALISASI_DEFAULT);
    const fileRef = useRef();

    const initials = (profil?.Nama ?? "K")
        .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    function handleFoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setFoto(ev.target.result);
        reader.readAsDataURL(file);
    }

    function updateKeahlian(idx, field, val) {
        setKeahlian((prev) => prev.map((k, i) => (i === idx ? { ...k, [field]: val } : k)));
    }

    function handleSave() {
        onSave({ foto, bio, spesialisasi: keahlian });
        onClose();
    }

    const S = {
        overlay: {
            position: "fixed", inset: 0, top: 0, left: 0, right: 0, bottom: 0,
            width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.65)",
            zIndex: 99999,
            display: "flex", alignItems: "center", justifyContent: "center",
        },
        modal: {
            background: "#fff", borderRadius: 16,
            width: "min(560px, 92vw)", maxHeight: "85vh",
            overflowY: "auto", padding: 28,
            display: "flex", flexDirection: "column", gap: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            position: "relative", zIndex: 100000,
        },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
        h3: { fontSize: 17, fontWeight: 700, margin: 0 },
        closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888", lineHeight: 1 },
        section: { display: "flex", flexDirection: "column", gap: 8 },
        label: { fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" },
        fotoWrap: { display: "flex", alignItems: "center", gap: 12 },
        fotoImg: { width: 72, height: 72, minWidth: 72, minHeight: 72, maxWidth: 72, maxHeight: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #e0e0e0" },
        fotoPlaceholder: {
            width: 72, height: 72, minWidth: 72, minHeight: 72, borderRadius: "50%",
            background: "#2f7d79", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 22, flexShrink: 0,
        },
        textarea: {
            width: "100%", padding: "10px 14px", borderRadius: 8,
            border: "1.5px solid #e0e0e0", fontSize: 14,
            background: "#f8f8f8", resize: "vertical",
            fontFamily: "inherit", boxSizing: "border-box", minHeight: 90,
        },
        input: {
            width: "100%", padding: "9px 12px", borderRadius: 8,
            border: "1.5px solid #e0e0e0", fontSize: 14,
            background: "#f8f8f8", fontFamily: "inherit", boxSizing: "border-box",
        },
        inputIcon: {
            width: 52, minWidth: 52, padding: "9px 6px", borderRadius: 8,
            border: "1.5px solid #e0e0e0", fontSize: 18,
            background: "#f8f8f8", textAlign: "center", boxSizing: "border-box",
        },
        keahlianItem: { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 },
        keahlianFields: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
        footer: { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 },
        btnPrimary: {
            padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "#2f7d79", color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
        },
        btnSecondary: {
            padding: "8px 16px", borderRadius: 8,
            border: "1.5px solid #2f7d79", color: "#2f7d79",
            background: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
        },
        btnGhost: {
            padding: "8px 16px", borderRadius: 8, border: "none",
            color: "#888", background: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit",
        },
    };

    return createPortal(
        <div style={S.overlay} onClick={onClose}>
            <div style={S.modal} onClick={(e) => e.stopPropagation()}>

                <div style={S.header}>
                    <h3 style={S.h3}>Edit Profil</h3>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={S.section}>
                    <span style={S.label}>Foto Profil</span>
                    <div style={S.fotoWrap}>
                        {foto
                            ? <img src={foto} alt="foto" style={S.fotoImg} />
                            : <div style={S.fotoPlaceholder}>{initials}</div>
                        }
                        <button style={S.btnSecondary} onClick={() => fileRef.current.click()}>Ganti Foto</button>
                        {foto && <button style={S.btnGhost} onClick={() => setFoto(null)}>Hapus</button>}
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFoto} />
                    </div>
                </div>

                <div style={S.section}>
                    <span style={S.label}>Bio / Deskripsi</span>
                    <textarea
                        style={S.textarea}
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Ceritakan tentang dirimu..."
                    />
                </div>

                <div style={S.section}>
                    <span style={S.label}>Spesialisasi Keahlian</span>
                    {keahlian.map((k, i) => (
                        <div key={i} style={S.keahlianItem}>
                            <input
                                style={S.inputIcon}
                                value={k.icon}
                                onChange={(e) => updateKeahlian(i, "icon", e.target.value)}
                                placeholder="🎯"
                                maxLength={2}
                            />
                            <div style={S.keahlianFields}>
                                <input
                                    style={S.input}
                                    value={k.title}
                                    onChange={(e) => updateKeahlian(i, "title", e.target.value)}
                                    placeholder="Judul keahlian"
                                />
                                <input
                                    style={S.input}
                                    value={k.desc}
                                    onChange={(e) => updateKeahlian(i, "desc", e.target.value)}
                                    placeholder="Deskripsi singkat"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={S.footer}>
                    <button style={S.btnGhost} onClick={onClose}>Batal</button>
                    <button style={S.btnPrimary} onClick={handleSave}>Simpan Perubahan</button>
                </div>

            </div>
        </div>,
        document.body
    );
}