import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, MailOpen, Plus } from "lucide-react";
import { api, errText, fmtDate } from "@/lib/api";
import { AdminLayout, Btn, Card, Field, input, inputStyle } from "@/components/AdminLayout";
import { ImageUpload } from "@/components/Uploads";
import { useSettings } from "@/context/SettingsContext";

export function InboxAdmin() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/messages").then(({ data }) => setItems(data)).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout title="Inbox Pesan">
      <div className="space-y-3" data-testid="inbox-list">
        {items.map((m) => (
          <Card key={m.id} data-testid={`message-${m.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-bold">
                  {m.subject}
                  {!m.read && (
                    <span
                      className="ml-2 text-[10px] px-2 py-0.5 rounded-full text-white align-middle"
                      style={{ background: "var(--primary)" }}
                    >
                      BARU
                    </span>
                  )}
                </p>
                <p className="text-xs mt-1 font-mono-data" style={{ color: "var(--muted-fg)" }}>
                  {m.name} · {m.email} · {m.phone || "-"} · {fmtDate(m.created_at)}
                </p>
                <p className="mt-3 text-sm whitespace-pre-line">{m.message}</p>
              </div>
              <div className="flex gap-2">
                {!m.read && (
                  <Btn
                    variant="ghost"
                    onClick={async () => {
                      await api.put(`/admin/messages/${m.id}/read`);
                      load();
                    }}
                    data-testid={`message-read-${m.id}`}
                  >
                    <MailOpen size={14} />
                  </Btn>
                )}
                <Btn
                  variant="danger"
                  onClick={async () => {
                    await api.delete(`/admin/messages/${m.id}`);
                    load();
                  }}
                  data-testid={`message-delete-${m.id}`}
                >
                  <Trash2 size={14} />
                </Btn>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm">Belum ada pesan.</p>}
      </div>
    </AdminLayout>
  );
}

export function AuditAdmin() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/admin/audit", { params: { limit: 200 } }).then(({ data }) => setItems(data)).catch(() => {});
  }, []);

  return (
    <AdminLayout title="Audit Log">
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <table className="w-full text-sm" data-testid="audit-table">
          <thead>
            <tr className="text-left text-xs uppercase" style={{ color: "var(--muted-fg)" }}>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Pengguna</th>
              <th className="py-3 px-4">Aksi</th>
              <th className="py-3 px-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                <td className="py-2.5 px-4 font-mono-data text-xs whitespace-nowrap">{fmtDate(a.at)}</td>
                <td className="py-2.5 px-4">{a.user_name}</td>
                <td className="py-2.5 px-4">{a.action.replace(/_/g, " ")}</td>
                <td className="py-2.5 px-4 text-xs" style={{ color: "var(--muted-fg)" }}>
                  {a.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export function SettingsAdmin() {
  const { settings, reloadSettings } = useSettings();
  const [form, setForm] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (settings.site_name && !form)
      setForm({
        site_name: settings.site_name || "",
        tagline_id: settings.tagline_id || "",
        tagline_en: settings.tagline_en || "",
        season_theme: settings.season_theme || "netral",
        logo_file_ids: settings.logo_file_ids || [],
        org_names: settings.org_names || [],
        show_population: settings.show_population !== false,
        contact_email: settings.contact_email || "",
        contact_phone: settings.contact_phone || "",
        address: settings.address || "",
        instagram: settings.instagram || "",
        whatsapp: settings.whatsapp || "",
      });
  }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get("/profile").then(({ data }) => setProfile(data)).catch(() => {});
  }, []);

  if (!form) return <AdminLayout title="Pengaturan">Memuat...</AdminLayout>;

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put("/admin/settings", form);
      toast.success("Pengaturan disimpan");
      reloadSettings();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/admin/profile", {
        about_id: profile.about_id || "",
        about_en: profile.about_en || null,
        vision_id: profile.vision_id || null,
        vision_en: profile.vision_en || null,
        mission_id: profile.mission_id || [],
        mission_en: profile.mission_en || [],
        address: profile.address || null,
        email: profile.email || null,
        phone: profile.phone || null,
      });
      toast.success("Profil disimpan");
    } catch (err) {
      toast.error(errText(err));
    }
  };

  return (
    <AdminLayout title="Pengaturan Identitas & Tema">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={save} className="space-y-4" data-testid="settings-form">
            <Field label="Nama portal">
              <input
                required
                data-testid="settings-site-name"
                className={input}
                style={inputStyle}
                value={form.site_name}
                onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              />
            </Field>
            <Field label="Tagline (ID)">
              <input
                className={input}
                style={inputStyle}
                value={form.tagline_id}
                onChange={(e) => setForm({ ...form, tagline_id: e.target.value })}
              />
            </Field>
            <Field label="Tagline (EN)">
              <input
                className={input}
                style={inputStyle}
                value={form.tagline_en}
                onChange={(e) => setForm({ ...form, tagline_en: e.target.value })}
              />
            </Field>
            <Field label="Aksen musiman">
              <select
                data-testid="settings-theme"
                className={input}
                style={inputStyle}
                value={form.season_theme}
                onChange={(e) => setForm({ ...form, season_theme: e.target.value })}
              >
                <option value="netral">Netral</option>
                <option value="lebaran">Lebaran</option>
                <option value="agustus17">17 Agustus</option>
              </select>
            </Field>
            <Field label="Nama organisasi (pisahkan dengan koma)">
              <input
                data-testid="settings-orgs"
                className={input}
                style={inputStyle}
                value={form.org_names.join(", ")}
                onChange={(e) =>
                  setForm({ ...form, org_names: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                }
              />
            </Field>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-fg)" }}>
                Logo organisasi (maks 3)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {form.logo_file_ids.map((id) => (
                  <span key={id} className="relative">
                    <img src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${id}`} alt="" className="h-14 w-14 object-contain border rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logo_file_ids: form.logo_file_ids.filter((x) => x !== id) })}
                      className="absolute -top-2 -right-2 p-1 rounded-full text-white"
                      style={{ background: "#B3261E" }}
                      data-testid={`logo-remove-${id}`}
                    >
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
                {form.logo_file_ids.length < 3 && (
                  <ImageUpload
                    label="Tambah logo"
                    kind="logo"
                    value={null}
                    onChange={(id) => id && setForm({ ...form, logo_file_ids: [...form.logo_file_ids, id] })}
                  />
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                data-testid="settings-show-population"
                checked={form.show_population}
                onChange={(e) => setForm({ ...form, show_population: e.target.checked })}
              />
              Tampilkan jumlah KK &amp; jiwa di halaman publik
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email kontak (penerima notifikasi pesan)">
                <input
                  data-testid="settings-contact-email"
                  className={input}
                  style={inputStyle}
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </Field>
              <Field label="Telepon">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </Field>
              <Field label="Alamat">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Field>
              <Field label="Instagram">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                />
              </Field>
              <Field label="WhatsApp (628...)">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </Field>
            </div>
            <Btn type="submit" data-testid="settings-save-btn">
              Simpan pengaturan
            </Btn>
          </form>
        </Card>

        {profile && (
          <Card>
            <form onSubmit={saveProfile} className="space-y-4" data-testid="profile-form">
              <p className="font-display font-bold">Tentang Kami</p>
              <Field label="Tentang (ID)">
                <textarea
                  rows={5}
                  data-testid="profile-about-id"
                  className={input}
                  style={inputStyle}
                  value={profile.about_id || ""}
                  onChange={(e) => setProfile({ ...profile, about_id: e.target.value })}
                />
              </Field>
              <Field label="Tentang (EN)">
                <textarea
                  rows={4}
                  className={input}
                  style={inputStyle}
                  value={profile.about_en || ""}
                  onChange={(e) => setProfile({ ...profile, about_en: e.target.value })}
                />
              </Field>
              <Field label="Visi (ID)">
                <input
                  className={input}
                  style={inputStyle}
                  value={profile.vision_id || ""}
                  onChange={(e) => setProfile({ ...profile, vision_id: e.target.value })}
                />
              </Field>
              <Field label="Misi (ID) — satu per baris">
                <textarea
                  rows={4}
                  data-testid="profile-mission"
                  className={input}
                  style={inputStyle}
                  value={(profile.mission_id || []).join("\n")}
                  onChange={(e) =>
                    setProfile({ ...profile, mission_id: e.target.value.split("\n").filter((s) => s.trim()) })
                  }
                />
              </Field>
              <Btn type="submit" data-testid="profile-save-btn">
                Simpan profil
              </Btn>
            </form>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

export function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);

  const load = () => api.get("/auth/users").then(({ data }) => setUsers(data)).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`/auth/users/${form.id}`, {
          name: form.name,
          role: form.role,
          active: form.active,
          password: form.password || null,
        });
      } else {
        await api.post("/auth/users", {
          email: form.email,
          name: form.name,
          password: form.password,
          role: form.role,
        });
      }
      toast.success("Akun disimpan");
      setForm(null);
      load();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  return (
    <AdminLayout
      title="Kelola Akun Admin"
      actions={
        <Btn
          onClick={() => setForm({ email: "", name: "", password: "", role: "admin", active: true })}
          data-testid="user-new-btn"
        >
          <span className="flex items-center gap-2">
            <Plus size={14} /> Akun baru
          </span>
        </Btn>
      }
    >
      {form && (
        <Card className="mb-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2" data-testid="user-form">
            {!form.id && (
              <Field label="Email">
                <input
                  required
                  type="email"
                  data-testid="user-email"
                  className={input}
                  style={inputStyle}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
            )}
            <Field label="Nama">
              <input
                required
                data-testid="user-name"
                className={input}
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label={form.id ? "Kata sandi baru (opsional)" : "Kata sandi (min. 8)"}>
              <input
                type="password"
                required={!form.id}
                minLength={form.id ? 0 : 8}
                data-testid="user-password"
                className={input}
                style={inputStyle}
                value={form.password || ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <Field label="Peran">
              <select
                data-testid="user-role"
                className={input}
                style={inputStyle}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </Field>
            {form.id && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  data-testid="user-active"
                />
                Akun aktif
              </label>
            )}
            <div className="md:col-span-2 flex gap-2">
              <Btn type="submit" data-testid="user-save-btn">
                Simpan
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setForm(null)}>
                Batal
              </Btn>
            </div>
          </form>
        </Card>
      )}
      <div className="space-y-3" data-testid="user-list">
        {users.map((u) => (
          <Card key={u.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold">{u.name}</p>
              <p className="text-xs mt-1 font-mono-data" style={{ color: "var(--muted-fg)" }}>
                {u.email} · {u.role} · {u.active ? "aktif" : "nonaktif"}
              </p>
            </div>
            <Btn
              variant="ghost"
              onClick={() => setForm({ ...u, password: "" })}
              data-testid={`user-edit-${u.id}`}
            >
              Edit
            </Btn>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
