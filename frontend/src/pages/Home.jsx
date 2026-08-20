import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Newspaper } from "lucide-react";
import { fileUrl } from "@/lib/api";
import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { Section } from "@/components/PublicLayout";
import { ThemeHeroDecor, ThemeAccentIcon } from "@/components/ThemeDecor";
import { PartnerStrip } from "@/pages/Sponsors";

const DEFAULT_BANNER = "https://images.pexels.com/photos/15830193/pexels-photo-15830193.jpeg?auto=compress&cs=tinysrgb&w=1800";

export default function Home() {
  const { t, lang } = useLang();
  const { settings } = useSettings();
  const banners = (settings.banner_file_ids || []).map(fileUrl);
  const slides = banners.length > 0 ? banners : [DEFAULT_BANNER];
  const [index, setIndex] = useState(0);
  const logos = settings.logo_file_ids || [];

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const tagline = lang === "en" ? settings.tagline_en || settings.tagline_id : settings.tagline_id;

  return (
    <div data-testid="home-page">
      <div className="relative overflow-hidden grain min-h-[78vh] flex items-center" data-testid="home-banner">
        {slides.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === index ? 1 : 0 }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(10,22,17,0.78) 0%, rgba(10,22,17,0.62) 45%, rgba(10,22,17,0.9) 100%)" }}
        />
        <ThemeHeroDecor />

        <Section className="relative py-24 sm:py-32 w-full">
          <div className="max-w-3xl">
            {logos.length > 0 ? (
              <div className="flex items-center gap-4 mb-8" data-testid="banner-logos">
                {logos.slice(0, 3).map((id) => (
                  <img
                    key={id}
                    src={fileUrl(id)}
                    alt="logo"
                    className="logo-safe h-16 w-16 sm:h-20 sm:w-20 object-contain"
                  />
                ))}
              </div>
            ) : (
              <span
                className="mb-8 inline-grid place-items-center h-16 w-16 rounded-2xl text-white font-display font-bold"
                style={{ background: "var(--primary)" }}
              >
                KT
              </span>
            )}

            <p className="text-xs tracking-[0.2em] uppercase text-white/70 mb-5 flex items-center gap-3">
              <ThemeAccentIcon size={20} />
              {(settings.org_names || []).join(" · ")}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.02]">
              {settings.site_name}
            </h1>
            {tagline && (
              <p
                className="mt-6 text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl"
                data-testid="banner-tagline"
              >
                {tagline}
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/berita"
                data-testid="hero-news-btn"
                className="flex items-center gap-2 px-7 py-4 rounded-full text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--primary)" }}
              >
                <Newspaper size={16} /> {t("open_news")}
              </Link>
              <Link
                to="/kontak"
                data-testid="hero-contact-btn"
                className="flex items-center gap-2 px-7 py-4 rounded-full text-sm font-semibold bg-white/10 text-white border border-white/25 backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Mail size={16} /> {t("nav_contact")} <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {slides.length > 1 && (
            <div className="mt-14 flex gap-2" data-testid="banner-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  data-testid={`banner-dot-${i}`}
                  aria-label={`Banner ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === index ? 34 : 14, background: i === index ? "#fff" : "rgba(255,255,255,0.4)" }}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      <PartnerStrip />
    </div>
  );
}
