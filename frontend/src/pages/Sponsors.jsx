import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api, fileUrl } from "@/lib/api";
import { useLang } from "@/i18n";
import { Section } from "@/components/PublicLayout";

const Grid = ({ items, testid }) => (
  <div className="mt-8 grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" data-testid={testid}>
    {items.map((p) => {
      const Wrapper = p.url ? "a" : "div";
      return (
        <Wrapper
          key={p.id}
          {...(p.url ? { href: p.url, target: "_blank", rel: "noreferrer" } : {})}
          data-testid={`partner-${p.id}`}
          className="rounded-xl border p-6 flex flex-col items-center gap-4 text-center transition-transform hover:-translate-y-1"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          {p.logo_file_id ? (
            <img
              src={fileUrl(p.logo_file_id)}
              alt={p.name}
              loading="lazy"
              className="logo-safe h-16 w-full object-contain"
            />
          ) : (
            <span
              className="h-16 w-16 grid place-items-center rounded-full font-display font-bold"
              style={{ background: "var(--muted)", color: "var(--primary)" }}
            >
              {p.name.slice(0, 1)}
            </span>
          )}
          <span className="text-sm font-semibold flex items-center gap-1.5">
            {p.name}
            {p.url && <ExternalLink size={12} style={{ color: "var(--muted-fg)" }} />}
          </span>
        </Wrapper>
      );
    })}
  </div>
);

export default function Sponsors() {
  const { t } = useLang();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/partners").then(({ data }) => setItems(data)).catch(() => {});
  }, []);

  const sponsors = items.filter((p) => p.type === "sponsor");
  const supports = items.filter((p) => p.type === "support");

  return (
    <Section className="py-16" data-testid="sponsor-page">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_sponsor")}</h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
        {t("sponsor_intro")}
      </p>

      {sponsors.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl font-bold">{t("sponsor")}</h2>
          <Grid items={sponsors} testid="sponsor-grid" />
        </div>
      )}
      {supports.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl font-bold">{t("support")}</h2>
          <Grid items={supports} testid="support-grid" />
        </div>
      )}
      {items.length === 0 && (
        <p className="mt-10 text-sm" data-testid="sponsor-empty" style={{ color: "var(--muted-fg)" }}>
          {t("no_data")}
        </p>
      )}
    </Section>
  );
}

// Strip logo sponsor untuk beranda
export const PartnerStrip = () => {
  const { t } = useLang();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/partners").then(({ data }) => setItems(data)).catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <Section className="py-16" data-testid="home-partner-strip">
      <p className="text-xs tracking-[0.2em] uppercase text-center" style={{ color: "var(--muted-fg)" }}>
        {t("nav_sponsor")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        {items.map((p) => (
          <span key={p.id} className="flex items-center gap-2" data-testid={`strip-partner-${p.id}`}>
            {p.logo_file_id ? (
              <img
                src={fileUrl(p.logo_file_id)}
                alt={p.name}
                loading="lazy"
                className="logo-safe h-12 w-auto max-w-[150px] object-contain"
              />
            ) : (
              <span className="text-sm font-semibold">{p.name}</span>
            )}
          </span>
        ))}
      </div>
    </Section>
  );
};
