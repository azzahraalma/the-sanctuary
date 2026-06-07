import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/edit-profil-modal.css";

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

    return createPortal(
        <div className="ep-overlay" onClick={onClose}>
            <div className="ep-modal" onClick={(e) => e.stopPropagation()}>

                <div className="ep-header">
                    <h3 className="ep-h3">Edit Profil</h3>
                    <button className="ep-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="ep-section">
                    <span className="ep-label">Foto Profil</span>
                    <div className="ep-foto-wrap">
                        {foto
                            ? <img src={foto} alt="foto" className="ep-foto-img" />
                            : <div className="ep-foto-placeholder">{initials}</div>
                        }
                        <button className="ep-btn-secondary" onClick={() => fileRef.current.click()}>Ganti Foto</button>
                        {foto && <button className="ep-btn-ghost" onClick={() => setFoto(null)}>Hapus</button>}
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFoto} />
                    </div>
                </div>

                <div className="ep-section">
                    <span className="ep-label">Bio / Deskripsi</span>
                    <textarea
                        className="ep-textarea"
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Ceritakan tentang dirimu..."
                    />
                </div>

                <div className="ep-section">
                    <span className="ep-label">Spesialisasi Keahlian</span>
                    {keahlian.map((k, i) => (
                        <div key={i} className="ep-keahlian-item">
                            <input
                                className="ep-input-icon"
                                value={k.icon}
                                onChange={(e) => updateKeahlian(i, "icon", e.target.value)}
                                placeholder="🎯"
                                maxLength={2}
                            />
                            <div className="ep-keahlian-fields">
                                <input
                                    className="ep-input"
                                    value={k.title}
                                    onChange={(e) => updateKeahlian(i, "title", e.target.value)}
                                    placeholder="Judul keahlian"
                                />
                                <input
                                    className="ep-input"
                                    value={k.desc}
                                    onChange={(e) => updateKeahlian(i, "desc", e.target.value)}
                                    placeholder="Deskripsi singkat"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="ep-footer">
                    <button className="ep-btn-ghost" onClick={onClose}>Batal</button>
                    <button className="ep-btn-primary" onClick={handleSave}>Simpan Perubahan</button>
                </div>

            </div>
        </div>,
        document.body
    );
}