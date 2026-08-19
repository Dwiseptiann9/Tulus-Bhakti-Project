import { useEffect, useState } from "react";
import { api, fileUrl, fmtDate } from "@/lib/api";
import { useLang } from "@/i18n";
import { Section, LangNote } from "@/components/PublicLayout";

export function About() {
  const { t, lang, pick } = useLang();
  const [p, setP] = useState({});
  const [faq, setFaq] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.get("/profile").then(({ data }) => setP(data)).catch(() => {});
    api.get("/faq").then(({ data }) => setFaq(data)).catch(() => {});
  }, []);

  const about = pick(p, "about");
  const vision = pick(p, "vision");
  const mission = lang === "en" && p.mission_en?.length ? p.mission_en : p.mission_id || [];

  return (
    <Section className="py-16" data-testid="about-page">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_about")}</h1>
          <p className="mt-8 text-base leading-relaxed whitespace-pre-line">
            {about.value}
            <LangNote show={about.fallback} />
          </p>
          {vision.value && (
            <div className="mt-12">
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--muted-fg)" }}>
                {t("vision")}
              </p>
              <p className="mt-3 font-display text-2xl font-bold leading-snug">{vision.value}</p>
            </div>
          )}
          {mission.length > 0 && (
            <div className="mt-10">
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--muted-fg)" }}>
                {t("mission")}
              </p>
              <ul className="mt-4 space-y-3" data-testid="mission-list">
                {mission.map((m, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="font-mono-data text-xs mt-1" style={{ color: "var(--primary)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="lg:col-span-5">
          <img
            src="https://images.unsplash.com/photo-1713634437183-f86ae928dcd4"
            alt="Komunitas desa"
            loading="lazy"
            className="rounded-xl w-full h-72 lg:h-[420px] object-cover"
          />
          <div
            className="mt-6 rounded-xl border p-6 text-sm space-y-2"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <p>{p.address}</p>
            <p>{p.phone}</p>
            <p>{p.email}</p>
            {p.updated_at && (
              <p className="text-xs pt-2" style={{ color: "var(--muted-fg)" }}>
                {t("last_updated")}: {fmtDate(p.updated_at, lang)}
              </p>
            )}
          </div>
        </div>
      </div>

      {faq.length > 0 && (
        <div className="mt-24 max-w-3xl" data-testid="faq-section">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">{t("faq")}</h2>
          <div className="mt-8 divide-y" style={{ borderColor: "var(--line)" }}>
            {faq.map((f) => {
              const q = pick(f, "question");
              const a = pick(f, "answer");
              return (
                <div key={f.id} className="py-5 border-b" style={{ borderColor: "var(--line)" }}>
                  <button
                    className="w-full text-left font-display font-bold"
                    onClick={() => setOpen(open === f.id ? null : f.id)}
                    data-testid={`faq-q-${f.id}`}
                  >
                    {q.value}
                  </button>
                  {open === f.id && (
                    <p className="mt-3 text-sm leading-relaxed" data-testid={`faq-a-${f.id}`}>
                      {a.value}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}

export function Structure() {
  const { t, lang, pick } = useLang();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get("/members").then(({ data }) => setMembers(data)).catch(() => {});
  }, []);

  const latest = members.reduce((acc, m) => (m.updated_at > acc ? m.updated_at : acc), "");

  return (
    <Section className="py-16" data-testid="structure-page">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_structure")}</h1>
      {latest && (
        <p className="mt-4 text-xs font-mono-data" style={{ color: "var(--muted-fg)" }} data-testid="structure-updated">
          {t("last_updated")}: {fmtDate(latest, lang)}
        </p>
      )}
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="member-list">
        {members.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-fg)" }}>
            {t("no_data")}
          </p>
        )}
        {members.map((m, i) => {
          const pos = pick(m, "position");
          return (
            <div
              key={m.id}
              className="rise rounded-xl border p-6 flex items-center gap-4"
              style={{ background: "var(--surface)", borderColor: "var(--line)", animationDelay: `${i * 50}ms` }}
              data-testid={`member-card-${m.id}`}
            >
              {m.photo_file_id ? (
                <img src={fileUrl(m.photo_file_id)} alt="" loading="lazy" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span
                  className="h-16 w-16 rounded-full grid place-items-center font-display font-bold text-lg"
                  style={{ background: "var(--muted)", color: "var(--primary)" }}
                >
                  {m.name.slice(0, 1)}
                </span>
              )}
              <div>
                <p className="font-display font-bold">{m.name}</p>
                <p className="text-sm" style={{ color: "var(--primary)" }}>
                  {pos.value}
                </p>
                {m.period && (
                  <p className="text-xs mt-0.5 font-mono-data" style={{ color: "var(--muted-fg)" }}>
                    {t("period")} {m.period}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function RwRt() {
  const { t, lang } = useLang();
  const [data, setData] = useState({ rows: [], updated_at: null, show_population: true });

  useEffect(() => {
    api.get("/rwrt").then(({ data }) => setData(data)).catch(() => {});
  }, []);

  return (
    <Section className="py-16" data-testid="rwrt-page">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_rwrt")}</h1>
      <p className="mt-4 text-xs font-mono-data" style={{ color: "var(--muted-fg)" }} data-testid="rwrt-updated">
        {t("last_updated")}: {data.updated_at ? fmtDate(data.updated_at, lang) : "-"}
      </p>

      <div className="mt-12 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <table className="w-full text-sm" data-testid="rwrt-table">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
              <th className="py-4 px-5 font-semibold">{t("rw")}</th>
              <th className="py-4 px-5 font-semibold">{t("rt")}</th>
              <th className="py-4 px-5 font-semibold">{t("head")}</th>
              <th className="py-4 px-5 font-semibold">{t("phone")}</th>
              {data.show_population && (
                <>
                  <th className="py-4 px-5 font-semibold text-right">{t("families")}</th>
                  <th className="py-4 px-5 font-semibold text-right">{t("residents")}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--line)" }} data-testid={`rwrt-row-${r.id}`}>
                <td className="py-3 px-5 font-mono-data">{r.rw}</td>
                <td className="py-3 px-5 font-mono-data">{r.rt}</td>
                <td className="py-3 px-5">{r.head_name}</td>
                <td className="py-3 px-5 font-mono-data text-xs">{r.phone || "-"}</td>
                {data.show_population && (
                  <>
                    <td className="py-3 px-5 text-right font-mono-data">{r.families ?? "-"}</td>
                    <td className="py-3 px-5 text-right font-mono-data">{r.residents ?? "-"}</td>
                  </>
                )}
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 px-5 text-sm" style={{ color: "var(--muted-fg)" }}>
                  {t("no_data")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
