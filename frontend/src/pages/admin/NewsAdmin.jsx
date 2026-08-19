import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, errText, fmtDate } from "@/lib/api";
import { AdminLayout, Btn, Card, Field, input, inputStyle } from "@/components/AdminLayout";
import { ImageUpload } from "@/components/Uploads";

const empty = {
  title_id: "",
  title_en: "",
  excerpt_id: "",
  excerpt_en: "",
  body_id: "",
  body_en: "",
  category: "berita",
  event_date: new Date().toISOString().slice(0, 10),
  cover_file_id: null,
  published: true,
};

export default function NewsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get("/news", { params: { include_draft: true, limit: 200 } })
      .then(({ data }) => setItems(data))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form };
    delete payload.id;
    delete payload.slug;
    try {
      if (form.id) await api.put(`/admin/news/${form.id}`, payload);
      else await api.post("/admin/news", payload);
      toast.success("Berita disimpan");
      setForm(null);
      load();
    } catch (err) {
      toast.error(errText(err));
    }
    setBusy(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus berita ini?")) return;
    try {
      await api.delete(`/admin/news/${id}`);
      toast.success("Berita dihapus");
      load();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  return (
    <AdminLayout
      title="Berita & Kegiatan"
      actions={
        <Btn onClick={() => setForm({ ...empty })} data-testid="news-new-btn">
          <span className="flex items-center gap-2">
            <Plus size={14} /> Tulis baru
          </span>
        </Btn>
      }
    >
      {form && (
        <Card className="mb-6">
          <form onSubmit={save} className="space-y-4" data-testid="news-form">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Judul (ID) — wajib">
                <input
                  required
                  data-testid="news-title-id"
                  className={input}
                  style={inputStyle}
                  value={form.title_id}
                  onChange={(e) => setForm({ ...form, title_id: e.target.value })}
                />
              </Field>
              <Field label="Judul (EN) — opsional">
                <input
                  data-testid="news-title-en"
                  className={input}
                  style={inputStyle}
                  value={form.title_en || ""}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                />
              </Field>
              <Field label="Ringkasan (ID)">
                <input
                  data-testid="news-excerpt-id"
                  className={input}
                  style={inputStyle}
                  value={form.excerpt_id || ""}
                  onChange={(e) => setForm({ ...form, excerpt_id: e.target.value })}
                />
              </Field>
              <Field label="Ringkasan (EN)">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.excerpt_en || ""}
                  onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Isi (ID) — wajib">
              <textarea
                required
                rows={7}
                data-testid="news-body-id"
                className={input}
                style={inputStyle}
                value={form.body_id}
                onChange={(e) => setForm({ ...form, body_id: e.target.value })}
              />
            </Field>
            <Field label="Isi (EN) — opsional">
              <textarea
                rows={5}
                className={input}
                style={inputStyle}
                value={form.body_en || ""}
                onChange={(e) => setForm({ ...form, body_en: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Kategori">
                <select
                  data-testid="news-category"
                  className={input}
                  style={inputStyle}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="berita">Berita</option>
                  <option value="kegiatan">Kegiatan</option>
                </select>
              </Field>
              <Field label="Tanggal">
                <input
                  type="date"
                  data-testid="news-date"
                  className={input}
                  style={inputStyle}
                  value={form.event_date || ""}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input
                    type="checkbox"
                    data-testid="news-published"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  Terbitkan
                </label>
              </Field>
            </div>
            <ImageUpload
              label="Gambar utama"
              kind="berita"
              value={form.cover_file_id}
              onChange={(id) => setForm({ ...form, cover_file_id: id })}
            />
            <div className="flex gap-2">
              <Btn type="submit" disabled={busy} data-testid="news-save-btn">
                Simpan
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setForm(null)} data-testid="news-cancel-btn">
                Batal
              </Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3" data-testid="admin-news-list">
        {items.map((n) => (
          <Card key={n.id} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display font-bold truncate">{n.title_id}</p>
              <p className="text-xs mt-1 font-mono-data" style={{ color: "var(--muted-fg)" }}>
                {n.category} · {fmtDate(n.event_date)} · {n.published ? "terbit" : "draft"}
                {n.title_en ? " · EN" : " · ID saja"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Btn variant="ghost" onClick={() => setForm({ ...empty, ...n })} data-testid={`news-edit-${n.id}`}>
                <Pencil size={14} />
              </Btn>
              <Btn variant="danger" onClick={() => remove(n.id)} data-testid={`news-delete-${n.id}`}>
                <Trash2 size={14} />
              </Btn>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm">Belum ada berita.</p>}
      </div>
    </AdminLayout>
  );
}
