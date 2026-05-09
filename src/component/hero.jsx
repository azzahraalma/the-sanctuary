export default function Hero() {
  return (
    <section className="hero-section">

      <div className="hero-left">

        <span className="tag">
          Resident Horizons
        </span>

        <h1>
          Temukan
          <span> Kedamaianmu </span>
          dengan
          Bimbingan
          Mentor
          Berpengalaman
        </h1>

        <p>
          Hadapi lika-liku kehidupan bersama pendamping terpercaya.
          Platform kami mempertemukan Anda dengan mentor yang peduli
          dan siap memberikan dukungan yang disesuaikan untuk perjalanan
          kesehatan mental Anda.
        </p>

        <div className="hero-buttons">
          <button className="primary-btn">
            Mulai Perjalanan Anda
          </button>

          <button className="secondary-btn">
            Bagaimana cara kami membantu?
          </button>
        </div>

      </div>

      <div className="hero-right">

        <img
          src="/hero.jpg"
          alt="Hero"
          className="hero-image"
        />

        <div className="floating-card">
          <h4>Penolong Terpercaya</h4>
          <p>
            Akses dan temukan mentor-mentor
            dengan pengalaman yang sesuai.
          </p>
        </div>

      </div>

    </section>
  )
}