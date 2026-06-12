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
    role: "mahasiswa",
  },

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
 * @param {string} email
 * @param {string} password
 * @returns {object|null} 
 */
export function findUser(email, password) {
  const user = DUMMY_USERS.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );
  if (!user) return null;

  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

/**
 * @param {string} email
 * @returns {boolean}
 */
export function isEmailTaken(email) {
  return DUMMY_USERS.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {object} 
 */
export function registerUser(name, email, password) {
  const newUser = {
    id: DUMMY_USERS.length + 1,
    name,
    email,
    password,
    role: "mahasiswa",
  };
  DUMMY_USERS.push(newUser);

  const safeUser = { ...newUser };
  delete safeUser.password;
  return safeUser;
}