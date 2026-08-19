import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, RefreshCw } from "lucide-react";
import { api, errText } from "@/lib/api";
import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { Section } from "@/components/PublicLayout";

export default function Contact() {
  const { t } = useLang();
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [captcha, setCaptcha] = useState(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const loadCaptcha = () => {
    api.get("/captcha").then(({ data }) => setCaptcha(data)).catch(() => {});
  };
  useEffect(loadCaptcha, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/messages", {
        ...form,
        captcha_id: captcha?.captcha_id,
        captcha_answer: parseInt(answer, 10) || 0,
      });
      setDone(true);
      toast.success(t("sent_ok"));
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setAnswer("");
      loadCaptcha();
    } catch (err) {
      toast.error(errText(err));
      loadCaptcha();
      setAnswer("");
    }
    setBusy(false);
  };

  const field = "w-full px-4 py-3 rounded-lg border text-sm outline-none";
  const st = { borderColor: "var(--line)", background: "var(--surface)" };

  return (
    <Section className="py-16" data-testid="contact-page">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold">{t("nav_contact")}</h1>
          <div className="mt-8 space-y-2 text-sm">
            <p>{settings.address}</p>
            <p>{settings.contact_phone}</p>
            <p>{settings.contact_email}</p>
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-4 link-underline"
                style={{ color: "var(--primary)" }}
                data-testid="whatsapp-link"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="lg:col-span-7 space-y-4" data-testid="contact-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              data-testid="contact-name"
              className={field}
              style={st}
              placeholder={t("name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              required
              type="email"
              data-testid="contact-email"
              className={field}
              style={st}
              placeholder={t("email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <input
            data-testid="contact-phone"
            className={field}
            style={st}
            placeholder={t("phone")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            required
            data-testid="contact-subject"
            className={field}
            style={st}
            placeholder={t("subject")}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <textarea
            required
            rows={6}
            data-testid="contact-message"
            className={field}
            style={st}
            placeholder={t("message")}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono-data" data-testid="captcha-question">
              {t("captcha")} {captcha?.question ?? "…"} ?
            </span>
            <input
              required
              data-testid="contact-captcha"
              className="w-24 px-3 py-2.5 rounded-lg border text-sm font-mono-data"
              style={st}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button type="button" onClick={loadCaptcha} data-testid="captcha-refresh" className="p-2">
              <RefreshCw size={15} />
            </button>
          </div>
          <button
            type="submit"
            disabled={busy}
            data-testid="contact-submit-btn"
            className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            <Send size={15} /> {t("send")}
          </button>
          {done && (
            <p className="text-sm" data-testid="contact-success" style={{ color: "var(--primary)" }}>
              {t("sent_ok")}
            </p>
          )}
        </form>
      </div>
    </Section>
  );
}
