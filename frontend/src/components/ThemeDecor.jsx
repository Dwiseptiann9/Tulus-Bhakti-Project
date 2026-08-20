import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";

// --- Motif SVGs (satu warna, mengikuti currentColor) ---

export const Ketupat = ({ size = 40, className = "" }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M24 3 45 24 24 45 3 24Z" />
      <path d="M24 9 39 24 24 39 9 24Z" opacity="0.65" />
      <path d="M11 17h26M11 31h26M17 11v26M31 11v26" opacity="0.45" />
      <path d="M24 3v-2M24 45v2" opacity="0.8" />
    </g>
  </svg>
);

export const Crescent = ({ size = 36, className = "" }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
    <path
      d="M31 5a19 19 0 1 0 0 38 15 15 0 1 1 0-38Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M39 12l1.6 3.6L44 17l-3.4 1.4L39 22l-1.6-3.6L34 17l3.4-1.4Z" fill="currentColor" opacity="0.8" />
  </svg>
);

export const Lantern = ({ size = 36, className = "" }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M24 3v5" />
      <rect x="15" y="8" width="18" height="4" rx="1.5" />
      <path d="M17 12c-3 5-3 15 0 20h14c3-5 3-15 0-20" />
      <path d="M24 14v16M20 16v12M28 16v12" opacity="0.5" />
      <rect x="19" y="32" width="10" height="4" rx="1.5" />
      <path d="M24 36v7" />
    </g>
  </svg>
);

export const Sheep = ({ size = 44, className = "" }) => (
  <svg viewBox="0 0 64 48" width={size} height={size} className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 26a7 7 0 0 1 1-13 7 7 0 0 1 11-3 7 7 0 0 1 11 3 7 7 0 0 1 1 13Z" />
      <path d="M42 20a6 6 0 1 0 9 6c0 3-2 5-5 5" />
      <path d="M50 22c3-2 5-1 5 1s-2 3-4 2" />
      <circle cx="49" cy="26" r="1.2" fill="currentColor" stroke="none" />
      <path d="M21 30v8M28 31v7M36 31v7M43 31v6" />
    </g>
  </svg>
);

export const Mosque = ({ size = 40, className = "" }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M24 7c5 4 8 7 8 11H16c0-4 3-7 8-11Z" />
      <path d="M24 4v3" />
      <path d="M12 40V22a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v18" />
      <path d="M8 40V26M40 40V26M6 40h36" />
      <path d="M24 40v-9a3 3 0 0 1 6 0v9" opacity="0.6" />
    </g>
  </svg>
);

export const Garuda = ({ size = 44, className = "" }) => (
  <svg viewBox="0 0 64 48" width={size} height={size} className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 10c2 0 3.5 1.6 3.5 3.5S34 17 32 17s-3.5-1.6-3.5-3.5S30 10 32 10Z" />
      <path d="M32 17v20" />
      <path d="M29 15c-6-3-13-4-21-2 4 3 6 5 6 9 4-1 7 0 10 2" />
      <path d="M35 15c6-3 13-4 21-2-4 3-6 5-6 9-4-1-7 0-10 2" />
      <path d="M26 30h12l-6 9Z" />
      <path d="M22 41h20" />
    </g>
  </svg>
);

export const FlagStripes = ({ className = "" }) => (
  <span className={`inline-flex flex-col overflow-hidden rounded-sm border border-black/10 ${className}`}>
    <span className="block w-7 h-2" style={{ background: "#C1121F" }} />
    <span className="block w-7 h-2 bg-white" />
  </span>
);

export const FlagPole = ({ size = 40, className = "" }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v38" />
      <path d="M12 8c7-3 14 3 21 0v7c-7 3-14-3-21 0Z" />
      <path d="M12 15c7-3 14 3 21 0v7c-7 3-14-3-21 0Z" opacity="0.55" />
      <path d="M7 43h12" />
    </g>
  </svg>
);

export const Star = ({ size = 34, className = "" }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
    <path
      d="M24 5l5.6 12.2L43 19l-9.6 9 2.4 13.4L24 34.9 12.2 41.4 14.6 28 5 19l13.4-1.8Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const CONFIG = {
  idul_fitri: {
    greeting: { id: "Selamat Idul Fitri — Mohon maaf lahir dan batin", en: "Eid Mubarak — Wishing you peace and forgiveness" },
    motifs: [Ketupat, Crescent, Lantern, Mosque],
  },
  idul_adha: {
    greeting: { id: "Selamat Idul Adha — Semangat berkurban dan berbagi", en: "Eid al-Adha — A season of sacrifice and sharing" },
    motifs: [Sheep, Crescent, Mosque, Sheep],
  },
  kemerdekaan: {
    greeting: { id: "Dirgahayu Republik Indonesia — Merdeka!", en: "Happy Indonesian Independence Day — Merdeka!" },
    motifs: [Garuda, FlagPole, Star, FlagPole],
  },
};

export const useThemeMotif = () => {
  const { settings } = useSettings();
  const theme = settings.season_theme || "netral";
  return { theme, config: CONFIG[theme] || null };
};

// Strip dekoratif di bawah header: motif berjalan + ucapan musiman
export const ThemeRibbon = () => {
  const { lang } = useLang();
  const { theme, config } = useThemeMotif();
  if (!config) return null;
  const Motifs = config.motifs;
  const strip = Array.from({ length: 12 }, (_, i) => Motifs[i % Motifs.length]);

  return (
    <div
      className="no-print relative overflow-hidden border-b"
      style={{ borderColor: "var(--line)", background: "var(--muted)", color: "var(--primary)" }}
      data-testid={`theme-ribbon-${theme}`}
    >
      <div className="absolute inset-0 flex items-center opacity-[0.22] pointer-events-none">
        <div className="flex items-center gap-10 shrink-0 motif-marquee">
          {[...strip, ...strip].map((M, i) => (
            <M key={i} size={26} />
          ))}
        </div>
      </div>
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-2.5 flex items-center justify-center gap-3">
        {theme === "kemerdekaan" && <FlagStripes />}
        <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-center" style={{ color: "var(--fg)" }}>
          {config.greeting[lang] || config.greeting.id}
        </p>
      </div>
    </div>
  );
};

// Motif besar transparan sebagai lapisan dekor di hero
export const ThemeHeroDecor = () => {
  const { theme, config } = useThemeMotif();
  if (!config) return null;
  const [A, B, C] = config.motifs;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" data-testid={`theme-hero-decor-${theme}`}>
      <span className="absolute right-[6%] top-[14%] text-white/25 motif-float" style={{ "--spin": "8deg" }}>
        <A size={150} />
      </span>
      <span
        className="absolute right-[24%] bottom-[16%] text-white/20 motif-float"
        style={{ animationDelay: "1.4s", "--spin": "-10deg" }}
      >
        <B size={92} />
      </span>
      <span
        className="absolute left-[52%] top-[8%] hidden md:inline text-white/15 motif-float"
        style={{ animationDelay: "2.6s" }}
      >
        <C size={70} />
      </span>
      {theme === "kemerdekaan" && (
        <span className="absolute left-0 top-0 h-full w-2 flex flex-col">
          <span className="flex-1" style={{ background: "#C1121F" }} />
          <span className="flex-1 bg-white" />
        </span>
      )}
    </div>
  );
};

// Motif kecil sebagai penanda seksi
export const ThemeAccentIcon = ({ size = 22 }) => {
  const { config } = useThemeMotif();
  if (!config) return null;
  const M = config.motifs[0];
  return (
    <span style={{ color: "var(--accent)" }} aria-hidden="true">
      <M size={size} />
    </span>
  );
};
