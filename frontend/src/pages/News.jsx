import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { api, fileUrl, fmtDate } from "@/lib/api";
import { useLang } from "@/i18n";
import { Section, LangNote } from "@/components/PublicLayout";

export default function News() {
  const { t, lang, pick } = useLang();
  const [items, setItems] = useState([]);
  const [years, setYears] = useState([]);
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    api.get("/news/years").then(({ data }) => setYears(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = { limit: 100 };
    if (q) params.q = q;
    if (year) params.year = year;
    if (category) params.category = category;
    const id = setTimeout(() => {
      api.get("/news", { params }).then(({ data }) => setItems(data)).catch(() => {});
    }, 250);
    return () => clearTimeout(id);
  }, [q, year, category]);

  return (
    <Section className="py-16" data-testid="news-page">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_news")}</h1>

      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-fg)" }} />
          <input
            data-testid="news-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full pl-9 pr-3 py-3 rounded-full border text-sm outline-none"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          />
        </div>
        <select
          data-testid="news-year-filter"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-4 py-3 rounded-full border text-sm"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <option value="">{t("all_years")}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          data-testid="news-category-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 rounded-full border text-sm"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <option value="">{t("nav_news")}</option>
          <option value="berita">{t("news")}</option>
          <option value="kegiatan">{t("activity")}</option>
        </select>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="news-list">
        {items.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-fg)" }} data-testid="news-empty">
            {t("no_data")}
          </p>
        )}
        {items.map((n, i) => {
          const title = pick(n, "title");
          const ex = pick(n, "excerpt");
          return (
            <Link
              key={n.id}
              to={`/berita/${n.slug}`}
              data-testid={`news-item-${n.id}`}
              className="rise rounded-xl border overflow-hidden transition-transform hover:-translate-y-1"
              style={{ background: "var(--surface)", borderColor: "var(--line)", animationDelay: `${i * 50}ms` }}
            >
              {n.cover_file_id && (
                <img src={fileUrl(n.cover_file_id)} alt="" loading="lazy" className="w-full h-44 object-cover" />
              )}
              <div className="p-6">
                <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: "var(--primary)" }}>
                  {n.category === "kegiatan" ? t("activity") : t("news")} · {fmtDate(n.event_date, lang)}
                </span>
                <h2 className="mt-2 font-display text-lg font-bold leading-snug">
                  {title.value}
                  <LangNote show={title.fallback} />
                </h2>
                {ex.value && (
                  <p className="mt-3 text-sm line-clamp-3" style={{ color: "var(--muted-fg)" }}>
                    {ex.value}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
