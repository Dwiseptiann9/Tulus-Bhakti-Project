import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, fileUrl, fmtDate } from "@/lib/api";
import { useLang } from "@/i18n";
import { Section, LangNote } from "@/components/PublicLayout";
import { ShareButton } from "@/components/ShareButton";

export default function NewsDetail() {
  const { slug } = useParams();
  const { t, lang, pick } = useLang();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/news/${slug}`)
      .then(({ data }) => {
        setItem(data);
        const title = lang === "en" ? data.title_en || data.title_id : data.title_id;
        document.title = `${title} — Portal Desa Digital`;
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = "description";
          document.head.appendChild(meta);
        }
        meta.content = (data.excerpt_id || data.body_id || "").slice(0, 155);
      })
      .catch(() => setError("Berita tidak ditemukan."));
  }, [slug, lang]);

  if (error)
    return (
      <Section className="py-24" data-testid="news-detail-error">
        <p className="text-sm">{error}</p>
        <Link to="/berita" className="link-underline text-sm mt-4 inline-block">
          {t("back")}
        </Link>
      </Section>
    );
  if (!item) return <Section className="py-24 text-sm">...</Section>;

  const title = pick(item, "title");
  const body = pick(item, "body");

  return (
    <Section className="py-16 max-w-3xl" data-testid="news-detail-page">
      <Link to="/berita" className="inline-flex items-center gap-1.5 text-sm link-underline" data-testid="news-back-link">
        <ArrowLeft size={15} /> {t("nav_news")}
      </Link>
      <p className="mt-8 text-xs tracking-[0.2em] uppercase" style={{ color: "var(--primary)" }}>
        {item.category === "kegiatan" ? t("activity") : t("news")} · {fmtDate(item.event_date, lang)}
      </p>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.05]">
        {title.value}
        <LangNote show={title.fallback} />
      </h1>
      {item.cover_file_id && (
        <img
          src={fileUrl(item.cover_file_id)}
          alt=""
          className="mt-10 w-full rounded-xl object-cover max-h-[70vh]"
          loading="lazy"
        />
      )}
      {body.fallback && (
        <p className="mt-8 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--muted)", color: "var(--muted-fg)" }}>
          {t("lang_note")}
        </p>
      )}
      <div className="mt-8 space-y-5 text-base leading-relaxed whitespace-pre-line">{body.value}</div>
      <div className="mt-10">
        <ShareButton title={title.value} sharePath={`/share/berita/${item.slug}`} testId="news-share-wa" />
      </div>
      <p className="mt-12 text-xs" style={{ color: "var(--muted-fg)" }}>
        {t("last_updated")}: {fmtDate(item.updated_at, lang)} · {item.author}
      </p>
    </Section>
  );
}
