import { useState } from "react";

function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="kd-star-picker" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`kd-star-picker-btn ${n <= active ? "is-on" : ""}`}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n} bintang`}
        >
          ★
        </button>
      ))}
      <span className="kd-star-picker-label">
        {value ? `${value}/5` : "Pilih rating"}
      </span>
    </div>
  );
}

export default function UlasanForm({
  konselorNama,
  sesiKe,
  onSubmit,
  onSkip,
  submitting,
  error,
}) {
  const [rating, setRating] = useState(0);
  const [teks, setTeks] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || !teks.trim()) return;
    onSubmit({ rating, teks: teks.trim() });
  };

  return (
    <div className="kd-ulasan-form-wrap">
      <div className="kd-ulasan-form-badge">Sesi Selesai ✓</div>
      <h3 className="kd-ulasan-form-title">Bagaimana pengalamanmu dengan {konselorNama?.split(" ")[0]}?</h3>
      <p className="kd-ulasan-form-sub">
        Sesi ke-{sesiKe} sudah selesai. Ceritakan pengalamanmu — ulasanmu membantu konselor dan mahasiswa lain.
      </p>

      <form className="kd-ulasan-form" onSubmit={handleSubmit}>
        <label className="kd-ulasan-label">Rating</label>
        <StarPicker value={rating} onChange={setRating} disabled={submitting} />

        <label className="kd-ulasan-label" htmlFor="ulasan-teks">Ulasan</label>
        <textarea
          id="ulasan-teks"
          className="kd-ulasan-textarea"
          rows={4}
          maxLength={500}
          placeholder="Ceritakan apa yang membantu, apa yang bisa ditingkatkan..."
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          disabled={submitting}
        />
        <span className="kd-ulasan-char">{teks.length}/500</span>

        {error && <p className="kd-ulasan-error">{error}</p>}

        <div className="kd-ulasan-actions">
          <button
            type="submit"
            className="kd-ulasan-submit"
            disabled={submitting || !rating || !teks.trim()}
          >
            {submitting ? "Menyimpan..." : "Kirim Ulasan"}
          </button>
        </div>
      </form>
    </div>
  );
}
