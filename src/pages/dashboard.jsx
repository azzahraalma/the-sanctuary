import "../styles/home.css";

export default function Dashboard() {
  return (
    <div className="page-dummy">
      <h1>Dashboard Mahasiswa</h1>
      <p>
        Ini halaman dashboard user setelah login.
      </p>

      <div className="dummy-box">
        <p>📊 Statistik pribadi kamu akan muncul di sini</p>
        <p>📅 Jadwal konseling</p>
        <p>💬 Riwayat sesi</p>
      </div>
    </div>
  );
}