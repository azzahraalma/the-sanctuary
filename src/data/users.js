// ─── DATABASE DUMMY USERS ─────────────────────────────────────────
// File ini berfungsi sebagai "database" lokal sementara.
// Dalam pengembangan nyata, data ini akan digantikan oleh API backend.

export const DUMMY_USERS = [
  {
    id: 1,
    name: "Muhammad Prasetyo Hanggara",
    email: "pras@sanctuary.com",
    password: "pras123",
    role: "admin",
  },
  {
    id: 2,
    name: "Demo User",
    email: "demo@sanctuary.com",
    password: "demo123",
    role: "user",
  },
  // ─── AKUN KONSELOR ─────────────────────────────────────────────
  // konselorId harus cocok dengan ID di data_konselor.js (K-001 dst)
  {
    id: 3,
    name: "Alma",
    email: "alma@sanctuary.com",
    password: "alma123",
    role: "konselor",
    konselorId: "K-001",
  },
  {
    id: 4,
    name: "Felicia",
    email: "felicia@sanctuary.com",
    password: "felicia123",
    role: "konselor",
    konselorId: "K-002",
  },
  {
    id: 5,
    name: "Haris",
    email: "haris@sanctuary.com",
    password: "haris123",
    role: "konselor",
    konselorId: "K-003",
  },
  {
    id: 6,
    name: "Haikal",
    email: "haikal@sanctuary.com",
    password: "haikal123",
    role: "konselor",
    konselorId: "K-004",
  },
];

/**
 * Cari user berdasarkan email dan password.
 * @param {string} email
 * @param {string} password
 * @returns {object|null} user tanpa field password, atau null jika tidak ditemukan
 */
export function findUser(email, password) {
  const user = DUMMY_USERS.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );
  if (!user) return null;

  // Jangan pernah simpan password ke localStorage
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

/**
 * Cek apakah email sudah terdaftar.
 * @param {string} email
 * @returns {boolean}
 */
export function isEmailTaken(email) {
  return DUMMY_USERS.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Tambahkan user baru ke DUMMY_USERS (hanya berlaku selama sesi browser).
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {object} user baru tanpa field password
 */
export function registerUser(name, email, password) {
  const newUser = {
    id: DUMMY_USERS.length + 1,
    name,
    email,
    password,
    role: "user",
  };
  DUMMY_USERS.push(newUser);

  const safeUser = { ...newUser };
  delete safeUser.password;
  return safeUser;
}