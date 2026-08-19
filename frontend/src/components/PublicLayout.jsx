import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Languages, Sparkles, ShieldCheck } from "lucide-react";
import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { fileUrl } from "@/lib/api";

const links = [
  ["/", "nav_home"],
  ["/berita", "nav_news"],
  ["/galeri", "nav_gallery"],
  ["/keuangan", "nav_finance"],
  ["/tentang", "nav_about"],
  ["/struktur", "nav_structure"],
  ["/rw-rt", "nav_rwrt"],
  ["/kontak", "nav_contact"],
];

export const PublicLayout = ({ children }) => {
  const { t, lang, setLang } = useLang();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const logos = settings.logo_file_ids || [];

  return (
    <div className="min-h-screen flex flex-col" data-testid="public-layout">
      <header className="no-print sticky top-0 z-50 backdrop-blur-xl bg-[var(--surface)]/80 border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link to="/" className="flex items-center gap-3 min-w-0" data-testid="site-logo-link">
              {logos.length > 0 ? (
                <span className="flex items-center gap-2">
                  {logos.slice(0, 3).map((id) => (
                    <img key={id} src={fileUrl(id)} alt="logo" className="h-9 w-9 object-contain" />
                  ))}
                </span>
              ) : (
                <span
                  className="h-10 w-10 grid place-items-center rounded-lg text-white text-sm font-bold font-display"
                  style={{ background: "var(--primary)" }}
                >
                  KT
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-display text-base font-bold leading-tight truncate max-w-[190px] sm:max-w-none">
                  {settings.site_name || "Portal Desa Digital"}
                </span>
                <span className="hidden sm:block text-xs" style={{ color: "var(--muted-fg)" }}>
                  {(settings.org_names || []).join(" · ")}
                </span>
              </span>
            </Link>

            <nav className="hidden xl:flex items-center gap-6">
              {links.map(([to, key]) => (
                <NavLink
                  key={to}
                  to={to}
                  data-testid={`nav-${key}`}
                  className={({ isActive }) =>
                    `text-sm link-underline transition-colors ${isActive ? "font-semibold" : ""}`
                  }
                  style={({ isActive }) => ({ color: isActive ? "var(--primary)" : "var(--fg)" })}
                >
                  {t(key)}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                data-testid="lang-toggle"
                onClick={() => setLang(lang === "id" ? "en" : "id")}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-colors hover:bg-[var(--muted)]"
                style={{ borderColor: "var(--line)" }}
              >
                <Languages size={14} /> {lang.toUpperCase()}
              </button>
              <Link
                to="/admin/login"
                data-testid="header-admin-link"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                <ShieldCheck size={14} /> {t("admin_area")}
              </Link>
              <button
                data-testid="mobile-menu-btn"
                className="xl:hidden p-2"
                onClick={() => setOpen(!open)}
                aria-label="menu"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
        {open && (
          <div
            className="xl:hidden border-t px-5 py-4 space-y-1 bg-[var(--surface)]"
            style={{ borderColor: "var(--line)" }}
            data-testid="mobile-menu"
          >
            {links.map(([to, key]) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-${key}`}
                className="block py-2.5 text-sm font-medium"
                style={{ color: location.pathname === to ? "var(--primary)" : "var(--fg)" }}
              >
                {t(key)}
              </Link>
            ))}
            <Link
              to="/admin/login"
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-semibold"
              style={{ color: "var(--primary)" }}
            >
              {t("admin_area")}
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="no-print mt-24 border-t"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {logos.slice(0, 3).map((id) => (
                <img key={id} src={fileUrl(id)} alt="logo" className="h-10 w-10 object-contain" />
              ))}
            </div>
            <h3 className="font-display text-xl font-bold">{settings.site_name}</h3>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {lang === "en" ? settings.tagline_en || settings.tagline_id : settings.tagline_id}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "var(--muted-fg)" }}>
              {t("nav_home")}
            </p>
            <div className="grid grid-cols-2 gap-y-2">
              {links.slice(1).map(([to, key]) => (
                <Link key={to} to={to} className="text-sm link-underline w-fit">
                  {t(key)}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "var(--muted-fg)" }}>
              {t("nav_contact")}
            </p>
            <p className="text-sm">{settings.address}</p>
            <p className="text-sm mt-1">{settings.contact_phone}</p>
            <p className="text-sm mt-1">{settings.contact_email}</p>
            {settings.instagram && (
              <p className="text-sm mt-3 flex items-center gap-1.5">
                <Sparkles size={14} /> @{settings.instagram}
              </p>
            )}
          </div>
        </div>
        <div
          className="border-t py-6 text-center text-xs"
          style={{ borderColor: "var(--line)", color: "var(--muted-fg)" }}
        >
          © {new Date().getFullYear()} {settings.site_name}. {t("transparency")}.
        </div>
      </footer>
    </div>
  );
};

export const Section = ({ children, className = "" }) => (
  <section className={`max-w-7xl mx-auto px-5 sm:px-8 ${className}`}>{children}</section>
);

export const LangNote = ({ show }) => {
  const { t } = useLang();
  if (!show) return null;
  return (
    <span
      className="inline-block text-[10px] px-2 py-0.5 rounded-full ml-2 align-middle"
      style={{ background: "var(--muted)", color: "var(--muted-fg)" }}
      data-testid="lang-fallback-badge"
    >
      ID
    </span>
  );
};
