import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Newspaper, Images, Users, MapPinned, Wallet, Inbox,
  Settings, ScrollText, UserCog, LogOut, Globe, HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/i18n";

const items = [
  ["/admin", "Dashboard", LayoutDashboard, false],
  ["/admin/berita", "Berita & Kegiatan", Newspaper, false],
  ["/admin/galeri", "Galeri", Images, false],
  ["/admin/anggota", "Anggota KT", Users, false],
  ["/admin/rw-rt", "Data RW/RT", MapPinned, false],
  ["/admin/keuangan", "Keuangan", Wallet, false],
  ["/admin/faq", "Tanya Jawab", HelpCircle, false],
  ["/admin/inbox", "Inbox Pesan", Inbox, false],
  ["/admin/audit", "Audit Log", ScrollText, false],
  ["/admin/pengaturan", "Pengaturan", Settings, true],
  ["/admin/akun", "Kelola Akun", UserCog, true],
];

export const AdminLayout = ({ children, title, actions }) => {
  const { user, logout, isSuper } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();

  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center text-sm" data-testid="admin-loading">
        Memuat...
      </div>
    );
  if (user === false) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="admin-layout">
      <aside
        className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r lg:min-h-screen"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <div className="p-5 border-b" style={{ borderColor: "var(--line)" }}>
          <Link to="/" className="font-display font-bold text-lg block" data-testid="admin-home-link">
            Portal Desa
          </Link>
          <p className="text-xs mt-1" style={{ color: "var(--muted-fg)" }}>
            {user.name} · {isSuper ? "Super Admin" : "Admin"}
          </p>
        </div>
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {items
            .filter(([, , , superOnly]) => !superOnly || isSuper)
            .map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                data-testid={`admin-nav-${to.split("/").pop() || "dashboard"}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isActive ? "font-semibold" : "hover:bg-[var(--muted)]"
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--muted)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--fg)",
                })}
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
        </nav>
        <div className="p-3 mt-auto flex gap-2">
          <button
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border"
            style={{ borderColor: "var(--line)" }}
            data-testid="admin-lang-toggle"
          >
            <Globe size={14} /> {lang.toUpperCase()}
          </button>
          <button
            data-testid="admin-logout-btn"
            onClick={async () => {
              await logout();
              navigate("/admin/login");
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border"
            style={{ borderColor: "var(--line)" }}
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div
          className="sticky top-0 z-30 backdrop-blur-xl bg-[var(--surface)]/85 border-b px-5 sm:px-8 py-5 flex items-center justify-between gap-4"
          style={{ borderColor: "var(--line)" }}
        >
          <h1 className="font-display text-xl sm:text-2xl font-bold" data-testid="admin-page-title">
            {title}
          </h1>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
};

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
      {label}
    </span>
    {children}
    {hint && (
      <span className="block text-xs mt-1" style={{ color: "var(--muted-fg)" }}>
        {hint}
      </span>
    )}
  </label>
);

export const input =
  "w-full px-3 py-2.5 rounded-lg border bg-[var(--surface)] text-sm outline-none focus:ring-2 transition-shadow";
export const inputStyle = { borderColor: "var(--line)", "--tw-ring-color": "var(--primary)" };

export const Btn = ({ children, variant = "primary", className = "", ...rest }) => {
  const styles = {
    primary: { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" },
    ghost: { background: "transparent", color: "var(--fg)", borderColor: "var(--line)" },
    danger: { background: "#B3261E", color: "#fff", borderColor: "#B3261E" },
  };
  return (
    <button
      {...rest}
      style={styles[variant]}
      className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-xl border p-6 ${className}`}
    style={{ background: "var(--surface)", borderColor: "var(--line)" }}
  >
    {children}
  </div>
);
