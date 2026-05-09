import dataKonselor from '../data/data_konselor'

export default function Mentors() {
  return (
    <section className="mentors-section">

      <div className="mentor-header">
        <div>
          <h2>Mentor Unggulan</h2>
          <p>
            Belajarlah dari mereka yang mengutamakan ketangguhanmu.
          </p>
        </div>
      </div>

      <div className="mentor-grid">

        {dataKonselor.map((mentor) => (

          <div className="mentor-card" key={mentor.id}>

            <img
              src={mentor.image}
              alt={mentor.nama}
            />

            <h3>{mentor.nama}</h3>

            <span>{mentor.spesialis}</span>

            <p>{mentor.sesi}</p>

          </div>

        ))}

      </div>

    </section>
  )
}