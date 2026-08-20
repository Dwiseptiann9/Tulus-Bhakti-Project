import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Mail, Images, Newspaper } from "lucide-react";
import { api, newsImage, fmtDate, rupiah } from "@/lib/api";
import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { Section, LangNote } from "@/components/PublicLayout";
import { ThemeHeroDecor, ThemeAccentIcon } from "@/components/ThemeDecor";

const HERO = "https://images.pexels.com/photos/15830193/pexels-photo-15830193.jpeg";

export default function Home() {
  const { t, lang, pick } = useLang();
  const { settings } = useSettings();
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [finance, setFinance] = useState([]);
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    api.get("/news", { params: { limit: 6 } }).then(({ data }) => setNews(data)).catch(() => {});
    api
      .get("/news", { params: { category: "kegiatan", limit: 4 } })
      .then(({ data }) => setEvents(data))
      .catch(() => {});
    api.get("/finance").then(({ data }) => setFinance(data.slice(0, 3))).catch(() => {});
    api.get("/albums").then(({ data }) => setAlbums(data.slice(0, 3))).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => (e.event_date || "") >= today);
  const shownUpcoming = upcoming.length ? upcoming : events.slice(0, 2);

  return (
    <div data-testid="home-page">
      <div className="relative overflow-hidden grain">
        <img src={HERO} alt="Desa" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,35,25,0.9) 0%, rgba(15,35,25,0.6) 100%)" }} />
        <ThemeHeroDecor />
        <Section className="relative py-24 sm:py-32">
          <p className="text-xs tracking-[0.2em] uppercase text-white/70 mb-5 flex items-center gap-3">
            <ThemeAccentIcon size={20} />
            {(settings.org_names || []).join(" · ")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white max-w-3xl leading-[1.02]">
            {settings.site_name}
          </h1>
          <p className="mt-6 text-white/85 max-w-xl text-base leading-relaxed">
            {lang === "en" ? settings.tagline_en || settings.tagline_id : settings.tagline_id}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/berita"
              data-testid="hero-news-btn"
              className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--primary)" }}
            >
              <Newspaper size={16} /> {t("nav_news")}
            </Link>
            <Link
              to="/kontak"
              data-testid="hero-contact-btn"
              className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-white/10 text-white border border-white/25 backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Mail size={16} /> {t("nav_contact")} <ArrowRight size={15} />
            </Link>
          </div>
        </Section>
      </div>

      <Section className="py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <CalendarDays size={22} style={{ color: "var(--primary)" }} /> {t("upcoming")}
            </h2>
            <div className="mt-8 space-y-4" data-testid="upcoming-list">
              {shownUpcoming.length === 0 && (
                <p className="text-sm" style={{ color: "var(--muted-fg)" }}>
                  {t("no_data")}
                </p>
              )}
              {shownUpcoming.map((e) => {
                const title = pick(e, "title");
                return (
                  <Link
                    key={e.id}
                    to={`/berita/${e.slug}`}
                    data-testid={`upcoming-item-${e.id}`}
                    className="block rounded-xl border p-6 transition-transform hover:-translate-y-1"
                    style={{ background: "var(--surface)", borderColor: "var(--line)" }}
                  >
                    <p className="font-mono-data text-xs" style={{ color: "var(--primary)" }}>
                      {fmtDate(e.event_date, lang)}
                    </p>
                    <p className="mt-2 font-display text-lg font-bold leading-snug">
                      {title.value}
                      <LangNote show={title.fallback} />
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">{t("latest_news")}</h2>
              <Link to="/berita" className="text-sm link-underline" data-testid="see-all-news">
                {t("see_all")}
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2" data-testid="latest-news-list">
              {news.map((n, i) => {
                const title = pick(n, "title");
                const ex = pick(n, "excerpt");
                return (
                  <Link
                    key={n.id}
                    to={`/berita/${n.slug}`}
                    data-testid={`news-card-${n.id}`}
                    className="rise rounded-xl border overflow-hidden transition-transform hover:-translate-y-1"
                    style={{ background: "var(--surface)", borderColor: "var(--line)", animationDelay: `${i * 60}ms` }}
                  >
                    <img
                      src={newsImage(n, i)}
                      alt=""
                      loading="lazy"
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-5">
                      <span
                        className="text-[10px] tracking-[0.16em] uppercase"
                        style={{ color: "var(--primary)" }}
                      >
                        {n.category === "kegiatan" ? t("activity") : t("news")} · {fmtDate(n.event_date, lang)}
                      </span>
                      <p className="mt-2 font-display font-bold leading-snug">
                        {title.value}
                        <LangNote show={title.fallback} />
                      </p>
                      {ex.value && (
                        <p className="mt-2 text-sm line-clamp-2" style={{ color: "var(--muted-fg)" }}>
                          {ex.value}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {finance.length > 0 && (
        <Section className="pb-20">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <div className="p-8 sm:p-12 grid gap-10 md:grid-cols-2 items-center">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--muted-fg)" }}>
                  {t("transparency")}
                </p>
                <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold">{t("nav_finance")}</h2>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
                  {t("finance_intro")}
                </p>
                <div className="mt-8 space-y-3" data-testid="home-finance-list">
                  {finance.map((f) => (
                    <Link
                      key={f.id}
                      to={`/keuangan/${f.id}`}
                      className="flex items-baseline justify-between gap-4 border-b pb-3"
                      style={{ borderColor: "var(--line)" }}
                      data-testid={`home-finance-${f.id}`}
                    >
                      <span className="text-sm font-medium">{pick(f, "title").value}</span>
                      <span className="font-mono-data text-sm whitespace-nowrap" style={{ color: "var(--primary)" }}>
                        {rupiah(f.balance)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <img
                src="https://images.pexels.com/photos/7947744/pexels-photo-7947744.jpeg"
                alt="Laporan"
                loading="lazy"
                className="rounded-xl w-full h-64 md:h-80 object-cover"
              />
            </div>
          </div>
        </Section>
      )}

      {albums.length > 0 && (
        <Section className="pb-24">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Images size={22} style={{ color: "var(--primary)" }} /> {t("nav_gallery")}
            </h2>
            <Link to="/galeri" className="text-sm link-underline">
              {t("see_all")}
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {albums.map((a) => (
              <Link
                key={a.id}
                to={`/galeri/${a.id}`}
                className="rounded-xl border p-6 transition-transform hover:-translate-y-1"
                style={{ background: "var(--surface)", borderColor: "var(--line)" }}
                data-testid={`home-album-${a.id}`}
              >
                <p className="font-display font-bold">{pick(a, "title").value}</p>
                <p className="text-xs mt-2 font-mono-data" style={{ color: "var(--muted-fg)" }}>
                  {a.photo_count} {t("photos")} · {fmtDate(a.event_date, lang)}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
