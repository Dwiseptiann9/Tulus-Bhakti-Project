import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { api, fileUrl, fmtDate } from "@/lib/api";
import { useLang } from "@/i18n";
import { Section, LangNote } from "@/components/PublicLayout";

export function Gallery() {
  const { t, lang, pick } = useLang();
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    api.get("/albums").then(({ data }) => setAlbums(data)).catch(() => {});
  }, []);

  return (
    <Section className="py-16" data-testid="gallery-page">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_gallery")}</h1>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="album-list">
        {albums.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-fg)" }}>
            {t("no_data")}
          </p>
        )}
        {albums.map((a, i) => {
          const title = pick(a, "title");
          return (
            <Link
              key={a.id}
              to={`/galeri/${a.id}`}
              data-testid={`album-card-${a.id}`}
              className="rise rounded-xl border overflow-hidden transition-transform hover:-translate-y-1"
              style={{ background: "var(--surface)", borderColor: "var(--line)", animationDelay: `${i * 50}ms` }}
            >
              {a.cover_file_id ? (
                <img src={fileUrl(a.cover_file_id)} alt="" loading="lazy" className="w-full h-48 object-cover" />
              ) : (
                <div className="h-48" style={{ background: "var(--muted)" }} />
              )}
              <div className="p-6">
                <h2 className="font-display text-lg font-bold">
                  {title.value}
                  <LangNote show={title.fallback} />
                </h2>
                <p className="mt-2 text-xs font-mono-data" style={{ color: "var(--muted-fg)" }}>
                  {a.photo_count} {t("photos")} · {fmtDate(a.event_date, lang)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

export function GalleryAlbum() {
  const { albumId } = useParams();
  const { t, lang, pick } = useLang();
  const [album, setAlbum] = useState(null);
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    api.get(`/albums/${albumId}`).then(({ data }) => setAlbum(data)).catch(() => {});
  }, [albumId]);

  useEffect(() => {
    const onKey = (e) => {
      if (index < 0 || !album) return;
      if (e.key === "Escape") setIndex(-1);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % album.photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + album.photos.length) % album.photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, album]);

  if (!album) return <Section className="py-24 text-sm">...</Section>;
  const title = pick(album, "title");
  const desc = pick(album, "description");

  return (
    <Section className="py-16" data-testid="album-detail-page">
      <Link to="/galeri" className="inline-flex items-center gap-1.5 text-sm link-underline">
        <ArrowLeft size={15} /> {t("nav_gallery")}
      </Link>
      <h1 className="mt-8 font-display text-3xl sm:text-4xl font-extrabold">
        {title.value}
        <LangNote show={title.fallback} />
      </h1>
      <p className="mt-3 text-sm font-mono-data" style={{ color: "var(--muted-fg)" }}>
        {fmtDate(album.event_date, lang)} · {album.photos.length} {t("photos")}
      </p>
      {desc.value && <p className="mt-6 max-w-2xl text-sm leading-relaxed">{desc.value}</p>}

      <div className="mt-12 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" data-testid="photo-grid">
        {album.photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i)}
            data-testid={`photo-thumb-${p.id}`}
            className="rounded-lg overflow-hidden border transition-transform hover:-translate-y-1"
            style={{ borderColor: "var(--line)" }}
          >
            <img src={fileUrl(p.file_id)} alt={p.caption_id || ""} loading="lazy" className="w-full h-40 object-cover" />
          </button>
        ))}
        {album.photos.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-fg)" }}>
            {t("no_data")}
          </p>
        )}
      </div>

      {index >= 0 && album.photos[index] && (
        <div
          className="fixed inset-0 z-[100] bg-black/92 flex items-center justify-center p-4"
          data-testid="lightbox"
          onClick={() => setIndex(-1)}
        >
          <button
            className="absolute top-5 right-5 text-white p-2"
            data-testid="lightbox-close"
            onClick={() => setIndex(-1)}
          >
            <X size={26} />
          </button>
          <button
            className="absolute left-3 text-white p-3"
            data-testid="lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + album.photos.length) % album.photos.length);
            }}
          >
            <ChevronLeft size={30} />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-w-5xl">
            <img
              src={fileUrl(album.photos[index].file_id)}
              alt=""
              className="max-h-[80vh] w-auto mx-auto rounded-lg"
            />
            <figcaption className="text-center text-white/80 text-sm mt-4">
              {pick(album.photos[index], "caption").value}
            </figcaption>
          </figure>
          <button
            className="absolute right-3 text-white p-3"
            data-testid="lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % album.photos.length);
            }}
          >
            <ChevronRight size={30} />
          </button>
        </div>
      )}
    </Section>
  );
}
