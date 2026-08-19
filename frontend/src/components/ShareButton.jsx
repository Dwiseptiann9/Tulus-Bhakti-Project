import { MessageCircle } from "lucide-react";
import { useLang } from "@/i18n";
import { API } from "@/lib/api";

// sharePath = backend landing route that serves Open Graph tags + preview card,
// so WhatsApp shows an image instead of a bare link.
export const ShareButton = ({ title, sharePath, testId = "share-wa-btn" }) => {
  const { t } = useLang();
  const url = sharePath ? `${API}${sharePath}` : typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(`${title}\n${url}`);

  return (
    <a
      href={`https://wa.me/?text=${text}`}
      target="_blank"
      rel="noreferrer"
      data-testid={testId}
      data-share-url={url}
      className="no-print inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border transition-colors hover:bg-[var(--muted)]"
      style={{ borderColor: "var(--line)", color: "var(--fg)" }}
    >
      <MessageCircle size={15} style={{ color: "var(--primary)" }} /> {t("share_wa")}
    </a>
  );
};
