import { Instagram, Youtube } from "lucide-react";

export const TikTokIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.6 2.6 0 1 1-1.86-2.49V9.76a5.7 5.7 0 1 0 4.96 5.64V8.9a7.3 7.3 0 0 0 4.06 1.23V7.03a4.28 4.28 0 0 1-2.99-1.21Z" />
  </svg>
);

const clean = (v) => (v || "").trim().replace(/^@/, "");

export const socialLinks = (settings = {}) => {
  const out = [];
  if (settings.instagram)
    out.push({
      key: "instagram",
      label: "Instagram",
      href: `https://instagram.com/${clean(settings.instagram)}`,
      Icon: Instagram,
    });
  if (settings.tiktok)
    out.push({
      key: "tiktok",
      label: "TikTok",
      href: `https://www.tiktok.com/@${clean(settings.tiktok)}`,
      Icon: TikTokIcon,
    });
  if (settings.youtube) {
    const y = (settings.youtube || "").trim();
    const href = y.startsWith("http")
      ? y
      : `https://www.youtube.com/${y.startsWith("@") ? y : `@${clean(y)}`}`;
    out.push({ key: "youtube", label: "YouTube", href, Icon: Youtube });
  }
  return out;
};

export const SocialRow = ({ settings, size = 16, testPrefix = "social" }) => {
  const links = socialLinks(settings);
  if (links.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      {links.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          data-testid={`${testPrefix}-${key}`}
          className="grid place-items-center h-9 w-9 rounded-full border transition-colors hover:bg-[var(--muted)]"
          style={{ borderColor: "var(--line)" }}
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
};
