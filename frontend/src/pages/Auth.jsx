import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, errText } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const shell = "min-h-screen grid place-items-center px-5 py-16";
const card = "w-full max-w-md rounded-2xl border p-8";
const field = "w-full px-4 py-3 rounded-lg border text-sm outline-none";
const st = { borderColor: "var(--line)", background: "var(--surface)" };

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(errText(err));
    }
    setBusy(false);
  };

  return (
    <div className={shell} data-testid="login-page">
      <form onSubmit={submit} className={card} style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <Link to="/" className="text-xs link-underline" data-testid="login-home-link">
          ← Portal Desa Digital
        </Link>
        <h1 className="mt-6 font-display text-2xl font-bold">Masuk Area Admin</h1>
        <div className="mt-8 space-y-4">
          <input
            required
            type="email"
            data-testid="login-email"
            className={field}
            style={st}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            data-testid="login-password"
            className={field}
            style={st}
            placeholder="Kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="mt-4 text-sm" data-testid="login-error" style={{ color: "#B3261E" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          data-testid="login-submit-btn"
          className="mt-6 w-full py-3.5 rounded-full text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {busy ? "Memproses..." : "Masuk"}
        </button>
        <Link
          to="/admin/forgot-password"
          className="block mt-5 text-xs link-underline w-fit"
          data-testid="forgot-password-link"
        >
          Lupa kata sandi?
        </Link>
      </form>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(errText(err));
    }
    setBusy(false);
  };

  return (
    <div className={shell} data-testid="forgot-page">
      <form onSubmit={submit} className={card} style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <h1 className="font-display text-2xl font-bold">Lupa Kata Sandi</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--muted-fg)" }}>
          Masukkan email admin Anda. Kami akan mengirim tautan pengaturan ulang.
        </p>
        <input
          required
          type="email"
          data-testid="forgot-email"
          className={`${field} mt-6`}
          style={st}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="forgot-submit-btn"
          className="mt-6 w-full py-3.5 rounded-full text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          Kirim tautan
        </button>
        {sent && (
          <p className="mt-4 text-sm" data-testid="forgot-success">
            Jika email terdaftar, tautan telah dikirim.
          </p>
        )}
        <Link to="/admin/login" className="block mt-5 text-xs link-underline w-fit">
          Kembali ke halaman masuk
        </Link>
      </form>
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token: params.get("token") || "", password });
      toast.success("Kata sandi diperbarui. Silakan masuk.");
      navigate("/admin/login");
    } catch (err) {
      toast.error(errText(err));
    }
    setBusy(false);
  };

  return (
    <div className={shell} data-testid="reset-page">
      <form onSubmit={submit} className={card} style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <h1 className="font-display text-2xl font-bold">Atur Kata Sandi Baru</h1>
        <input
          required
          type="password"
          minLength={8}
          data-testid="reset-password"
          className={`${field} mt-6`}
          style={st}
          placeholder="Kata sandi baru (min. 8 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="reset-submit-btn"
          className="mt-6 w-full py-3.5 rounded-full text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          Simpan
        </button>
      </form>
    </div>
  );
}
