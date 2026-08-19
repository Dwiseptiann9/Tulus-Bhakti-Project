import { MessageCircle } from "lucide-react";
import { useLang } from "@/i18n";

export const ShareButton = ({ title, testId = "share-wa-btn" }) => {
  const { t } = useLang();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(`${title}\n${url}`);

  return (
    <a
      href={`https://wa.me/?text=${text}`}
      target="_blank"
      rel="noreferrer"
      data-testid={testId}
      className="no-print inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border transition-colors hover:bg-[var(--muted)]"
      style={{ borderColor: "var(--line)", color: "var(--fg)" }}
    >
      <MessageCircle size={15} style={{ color: "var(--primary)" }} /> {t("share_wa")}
    </a>
  );
};
