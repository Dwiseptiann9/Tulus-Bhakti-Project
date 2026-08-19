import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer, History, Receipt, EyeOff, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { api, fileUrl, fmtDate, rupiah } from "@/lib/api";
import { useLang } from "@/i18n";
import { Section, LangNote } from "@/components/PublicLayout";
import { ShareButton } from "@/components/ShareButton";

function YearlyChart() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("all");

  useEffect(() => {
    api.get("/finance/summary/yearly").then(({ data }) => setData(data)).catch(() => {});
  }, []);

  if (!data || data.years.length === 0) return null;
  const visible = selected === "all" ? data.years : data.years.filter((y) => y.year === selected);
  const rows = visible.map((y) => ({
    ...y,
    [t("total_in")]: y.total_in,
    [t("total_out")]: y.total_out,
  }));
  const shownBalance = visible.reduce((s, y) => s + y.balance, 0);
  const compact = (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)} jt` : `${Math.round(v / 1000)} rb`);

  return (
    <div
      className="mt-12 rounded-2xl border p-6 sm:p-8"
      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      data-testid="yearly-summary"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={20} style={{ color: "var(--primary)" }} /> {t("yearly_summary")}
          </h2>
          <p className="mt-2 text-sm max-w-xl" style={{ color: "var(--muted-fg)" }}>
            {t("yearly_note")}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <select
            data-testid="yearly-year-filter"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="px-4 py-2.5 rounded-full border text-sm"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <option value="all">{t("all_years")}</option>
            {data.years.map((y) => (
              <option key={y.year} value={y.year}>
                {y.year}
              </option>
            ))}
          </select>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
              {selected === "all" ? t("grand_total") : `${t("balance")} ${selected}`}
            </p>
            <p className="font-mono-data text-lg font-semibold" style={{ color: "var(--primary)" }} data-testid="grand-balance">
              {rupiah(shownBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 h-72 w-full" data-testid="yearly-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
            <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--muted-fg)" width={60} />
            <Tooltip formatter={(v) => rupiah(v)} contentStyle={{ borderRadius: 10, borderColor: "var(--line)", fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey={t("total_in")} fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={54} />
            <Bar dataKey={t("total_out")} fill="var(--muted-fg)" radius={[6, 6, 0, 0]} maxBarSize={54} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm" data-testid="yearly-table">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
              <th className="py-2 pr-4 font-semibold">{t("year")}</th>
              <th className="py-2 pr-4 font-semibold text-right">{t("total_in")}</th>
              <th className="py-2 pr-4 font-semibold text-right">{t("total_out")}</th>
              <th className="py-2 pr-4 font-semibold text-right">{t("balance")}</th>
              <th className="py-2 font-semibold text-right">{t("reports_count")}</th>
            </tr>
          </thead>
          <tbody>
            {data.years.map((y) => (
              <tr
                key={y.year}
                className="border-b"
                style={{ borderColor: "var(--line)", opacity: selected === "all" || selected === y.year ? 1 : 0.35 }}
                data-testid={`yearly-row-${y.year}`}
              >
                <td className="py-2.5 pr-4 font-mono-data">{y.year}</td>
                <td className="py-2.5 pr-4 text-right font-mono-data">{rupiah(y.total_in)}</td>
                <td className="py-2.5 pr-4 text-right font-mono-data">{rupiah(y.total_out)}</td>
                <td className="py-2.5 pr-4 text-right font-mono-data" style={{ color: "var(--primary)" }}>
                  {rupiah(y.balance)}
                </td>
                <td className="py-2.5 text-right font-mono-data">{y.reports}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Finance() {
  const { t, lang, pick } = useLang();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get("/finance").then(({ data }) => setReports(data)).catch(() => {});
  }, []);

  return (
    <Section className="py-16" data-testid="finance-page">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_finance")}</h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
        {t("finance_intro")}
      </p>
      <YearlyChart />
      <div className="mt-12 grid gap-5 md:grid-cols-2" data-testid="finance-list">
        {reports.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-fg)" }}>
            {t("no_data")}
          </p>
        )}
        {reports.map((r) => {
          const title = pick(r, "title");
          return (
            <Link
              key={r.id}
              to={`/keuangan/${r.id}`}
              data-testid={`finance-card-${r.id}`}
              className="rounded-xl border p-6 transition-transform hover:-translate-y-1"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            >
              <p className="text-xs font-mono-data" style={{ color: "var(--muted-fg)" }}>
                {fmtDate(r.event_date, lang)}
              </p>
              <h2 className="mt-2 font-display text-lg font-bold leading-snug">
                {title.value}
                <LangNote show={title.fallback} />
              </h2>
              <div className="mt-6 grid grid-cols-3 gap-3 font-mono-data text-xs">
                <div>
                  <p style={{ color: "var(--muted-fg)" }}>{t("total_in")}</p>
                  <p className="mt-1 text-sm">{rupiah(r.total_in)}</p>
                </div>
                <div>
                  <p style={{ color: "var(--muted-fg)" }}>{t("total_out")}</p>
                  <p className="mt-1 text-sm">{rupiah(r.total_out)}</p>
                </div>
                <div>
                  <p style={{ color: "var(--muted-fg)" }}>{t("balance")}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    {rupiah(r.balance)}
                  </p>
                </div>
              </div>
              {(r.revisions || []).length > 0 && (
                <p className="mt-4 text-xs flex items-center gap-1.5" style={{ color: "var(--muted-fg)" }}>
                  <History size={12} /> {t("updated_on")} {fmtDate(r.revisions[r.revisions.length - 1].at, lang)} —{" "}
                  {r.revisions[r.revisions.length - 1].reason}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

export function FinanceDetail() {
  const { reportId } = useParams();
  const { t, lang, pick } = useLang();
  const [r, setR] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/finance/${reportId}`)
      .then(({ data }) => setR(data))
      .catch(() => setError("Laporan tidak ditemukan atau belum terbit."));
  }, [reportId]);

  if (error)
    return (
      <Section className="py-24" data-testid="finance-detail-error">
        <p className="text-sm">{error}</p>
      </Section>
    );
  if (!r) return <Section className="py-24 text-sm">...</Section>;

  const title = pick(r, "title");
  const desc = pick(r, "description");
  const rows = (r.items || []).map((it, i) => ({ ...it, _i: i }));

  return (
    <Section className="py-16 max-w-4xl" data-testid="finance-detail-page">
      <Link to="/keuangan" className="no-print inline-flex items-center gap-1.5 text-sm link-underline">
        <ArrowLeft size={15} /> {t("nav_finance")}
      </Link>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>          <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
            {title.value}
            <LangNote show={title.fallback} />
          </h1>
          <p className="mt-3 text-sm font-mono-data" style={{ color: "var(--muted-fg)" }}>
            {fmtDate(r.event_date, lang)} · {t("published_on")} {fmtDate(r.published_at, lang)}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          data-testid="finance-export-pdf"
          className="no-print flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          <Printer size={15} /> {t("export_pdf")}
        </button>
        <ShareButton title={title.value} sharePath={`/share/keuangan/${r.id}`} testId="finance-share-wa" />
      </div>

      {desc.value && <p className="mt-6 text-sm leading-relaxed max-w-2xl">{desc.value}</p>}

      <div className="mt-10 grid gap-4 sm:grid-cols-3" data-testid="finance-summary">
        {[
          [t("total_in"), r.total_in, "var(--fg)"],
          [t("total_out"), r.total_out, "var(--fg)"],
          [t("balance"), r.balance, "var(--primary)"],
        ].map(([label, val, color]) => (
          <div
            key={label}
            className="rounded-xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
              {label}
            </p>
            <p className="mt-2 font-mono-data text-xl font-semibold" style={{ color }}>
              {rupiah(val)}
            </p>
          </div>
        ))}
      </div>

      {["masuk", "keluar"].map((type) => (
        <div key={type} className="mt-12">
          <h2 className="font-display text-xl font-bold">{type === "masuk" ? t("income") : t("expense")}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" data-testid={`finance-table-${type}`}>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
                  <th className="py-3 pr-4 font-semibold">{t("date")}</th>
                  <th className="py-3 pr-4 font-semibold">{t("description")}</th>
                  <th className="py-3 pr-4 font-semibold text-right">{t("amount")}</th>
                  <th className="py-3 font-semibold">{t("receipt")}</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((i) => i.type === type)
                  .map((i) => (
                    <tr key={i._i} className="border-b" style={{ borderColor: "var(--line)" }}>
                      <td className="py-3 pr-4 font-mono-data text-xs whitespace-nowrap">{i.date || "-"}</td>
                      <td className="py-3 pr-4">{i.description}</td>
                      <td className="py-3 pr-4 text-right font-mono-data whitespace-nowrap">{rupiah(i.amount)}</td>
                      <td className="py-3">
                        {i.receipt_file_id ? (
                          <a
                            href={fileUrl(i.receipt_file_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs link-underline"
                            style={{ color: "var(--primary)" }}
                            data-testid={`receipt-link-${i._i}`}
                          >
                            <Receipt size={13} /> {t("view_receipt")}
                          </a>
                        ) : i.receipt_hidden ? (
                          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-fg)" }}>
                            <EyeOff size={13} /> {t("receipt_hidden")}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--muted-fg)" }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                {rows.filter((i) => i.type === type).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-xs" style={{ color: "var(--muted-fg)" }}>
                      {t("no_data")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {(r.revisions || []).length > 0 && (
        <div className="mt-14" data-testid="revision-history">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <History size={18} /> {t("revision_history")}
          </h2>
          <ul className="mt-4 space-y-3">
            {[...r.revisions].reverse().map((rev, i) => (
              <li
                key={i}
                className="text-sm border-l-2 pl-4"
                style={{ borderColor: "var(--primary)" }}
                data-testid={`revision-item-${i}`}
              >
                <span className="font-mono-data text-xs" style={{ color: "var(--muted-fg)" }}>
                  {t("updated_on")} {fmtDate(rev.at, lang)} · {rev.by}
                </span>
                <p className="mt-1">{rev.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
