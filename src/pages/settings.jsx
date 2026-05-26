import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import "../styles/dashboard.css";
import "../styles/settings.css";

// ── Toggle Switch ────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
    return (
        <label className="stg-toggle">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="stg-toggle-track">
                <span className="stg-toggle-thumb" />
            </span>
        </label>
    );
}

// ── Settings Section ─────────────────────────────────────────────
function Section({ title, children }) {
    return (
        <div className="stg-section">
            <h2 className="stg-section-title">{title}</h2>
            <div className="stg-section-body">{children}</div>
        </div>
    );
}

export default function Settings() {
    const navigate = useNavigate();

    const user = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("sanctuary_user")); }
        catch { return null; }
    }, []);

    const firstName = user?.name?.split(" ")[0] ?? "Kamu";

    const handleLogout = () => {
        localStorage.removeItem("sanctuary_user");
        navigate("/login");
    };

    // ── State ────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("account");
    const [sessionReminder, setSessionReminder] = useState(true);
    const [communityInsight, setCommunityInsight] = useState(true);
    const [pushNotif, setPushNotif] = useState(false);
    const [serenityMode, setSerenityMode] = useState(true);
    const [publicProfile, setPublicProfile] = useState(false);

    const TABS = [
        {
            key: "profile",
            label: "Profile",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
        {
            key: "account",
            label: "Account",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                </svg>
            ),
        },
        {
            key: "notifications",
            label: "Notifications",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            ),
        },
    ];

    return (
        <div className="db-shell">

            {/* ── SIDEBAR ── */}
            <aside className="db-sidebar">
                <div className="db-sidebar-top">
                    <span className="db-logo" onClick={() => navigate("/")}>The Sanctuary</span>
                    <nav className="db-nav">
                        <div className="db-nav-item" onClick={() => navigate("/dashboard")}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Beranda
                        </div>
                        <div className="db-nav-item" onClick={() => navigate("/statistik")}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Statistik
                        </div>
                        <div className="db-nav-item db-nav-item--active">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                            </svg>
                            Pengaturan
                        </div>
                    </nav>
                </div>
                <button className="db-logout" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar
                </button>
            </aside>

            {/* ── MAIN ── */}
            <main className="db-main">

                {/* ── TOPBAR ── */}
                <header className="db-topbar">
                    <div className="db-topbar-l">
                        <span className="db-topbar-logo" onClick={() => navigate("/")}>The Sanctuary</span>
                        <nav className="db-topbar-nav">
                            <span onClick={() => navigate("/")}>Beranda</span>
                            <span onClick={() => navigate("/konselor")}>Konselor</span>
                            <span onClick={() => navigate("/dashboard")}>Dashboard</span>
                        </nav>
                    </div>
                    <div className="db-topbar-r">
                        <button className="db-topbar-cta" onClick={() => navigate("/konselor")}>Cari Teman Cerita</button>
                        <button className="db-icon-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </button>
                        <div className="db-avatar" onClick={() => navigate("/dashboard")}>
                            {user?.name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                    </div>
                </header>

                <div className="db-content">

                    {/* ── PAGE TITLE ── */}
                    <div className="stg-page-header">
                        <h1 className="stg-page-title">Settings</h1>
                        <p className="stg-page-sub">Personalisasi perjalanan menuju resolusi bagi harimu.</p>
                    </div>

                    {/* ── LAYOUT ── */}
                    <div className="stg-layout">

                        {/* ── LEFT NAV ── */}
                        <aside className="stg-leftnav">
                            {TABS.map(t => (
                                <button
                                    key={t.key}
                                    className={`stg-leftnav-item ${activeTab === t.key ? "stg-leftnav-item--active" : ""}`}
                                    onClick={() => setActiveTab(t.key)}
                                >
                                    {t.icon}
                                    {t.label}
                                </button>
                            ))}
                        </aside>

                        {/* ── CONTENT PANELS ── */}
                        <div className="stg-panels">

                            {/* ── PROFILE IDENTITY ── */}
                            {(activeTab === "profile" || activeTab === "account") && (
                                <Section title="Profile Identity">
                                    <div className="stg-profile-card">
                                        <div className="stg-profile-top">
                                            <div className="stg-profile-avatar-wrap">
                                                <div className="stg-profile-avatar">
                                                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                                                </div>
                                                <button className="stg-avatar-change">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="stg-profile-info">
                                                <div className="stg-profile-row">
                                                    <div className="stg-profile-field">
                                                        <p className="stg-field-label">DISPLAY NAME</p>
                                                        <p className="stg-field-val">{user?.name ?? "Elena Rosales"}</p>
                                                    </div>
                                                    <div className="stg-profile-field">
                                                        <p className="stg-field-label">CONTACT EMAIL</p>
                                                        <p className="stg-field-val">{user?.email ?? "elena@editorial-sanctuary.com"}</p>
                                                    </div>
                                                </div>
                                                <div className="stg-field-label" style={{ marginTop: 8 }}>PERSONAL BIO</div>
                                                <p className="stg-bio-text">
                                                    "Seeking stillness in the pressure of life. Dedicated to the practice of mindful reflection and resillience."
                                                </p>
                                            </div>
                                            <button className="stg-btn-outline">Edit Details</button>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* ── ACCOUNT SETTINGS ── */}
                            {activeTab === "account" && (
                                <Section title="Account Settings">
                                    <div className="stg-grid-2">

                                        <div className="stg-info-card">
                                            <div className="stg-info-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="stg-info-title">Email Address</p>
                                                <p className="stg-info-sub">Update login credential</p>
                                            </div>
                                            <div className="stg-info-input-wrap">
                                                <input
                                                    className="stg-input"
                                                    type="email"
                                                    defaultValue={user?.email ?? "elena@editorial-sanctuary.com"}
                                                />
                                            </div>
                                        </div>

                                        <div className="stg-info-card">
                                            <div className="stg-info-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="stg-info-title">Authentication</p>
                                                <p className="stg-info-sub">Last changed 2 months ago</p>
                                            </div>
                                            <button className="stg-btn-outline stg-btn-sm">Update Password</button>
                                        </div>

                                    </div>
                                </Section>
                            )}
                            {/* ── NOTIFICATIONS ── */}
                            {(activeTab === "notifications" || activeTab === "account") && (
                                <Section title="Notifications">
                                    <div className="stg-notif-list">
                                        <div className="stg-notif-item">
                                            <div className="stg-notif-info">
                                                <p className="stg-notif-title">Session Reminders</p>
                                                <p className="stg-notif-sub">Receive a nudge 15 minutes before your scheduled reflection or therapy session.</p>
                                            </div>
                                            <Toggle checked={sessionReminder} onChange={setSessionReminder} />
                                        </div>
                                        <div className="stg-notif-item">
                                            <div className="stg-notif-info">
                                                <p className="stg-notif-title">Community Insights</p>
                                                <p className="stg-notif-sub">Weekly digest of articles, success stories, and upcoming collective meditations.</p>
                                            </div>
                                            <Toggle checked={communityInsight} onChange={setCommunityInsight} />
                                        </div>
                                        <div className="stg-notif-item">
                                            <div className="stg-notif-info">
                                                <p className="stg-notif-title">Push Notifications</p>
                                                <p className="stg-notif-sub">Urgent platform updates and direct messages from your mentors.</p>
                                            </div>
                                            <Toggle checked={pushNotif} onChange={setPushNotif} />
                                        </div>
                                    </div>
                                </Section>
                            )}


                        </div>{/* /stg-panels */}
                    </div>{/* /stg-layout */}
                </div>{/* /db-content */}

                {/* ── FOOTER ── */}
                <footer className="db-footer">
                    <div>
                        <span className="db-footer-brand">The Sanctuary</span>
                        <p className="db-footer-copy">© 2026 The Sanctuary Polimedia. Tempat aman untuk saling mendengar dan menguatkan 🌱</p>
                    </div>
                    <div className="db-footer-links">
                        <span>Kebijakan Privasi</span>
                        <span>Syarat dan Ketentuan</span>
                        <span>Bantuan</span>
                    </div>
                </footer>

            </main>
        </div>
    );
}