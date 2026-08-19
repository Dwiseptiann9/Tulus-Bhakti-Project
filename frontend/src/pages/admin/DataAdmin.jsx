import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, errText, fmtDate } from "@/lib/api";
import { AdminLayout, Btn, Card, Field, input, inputStyle } from "@/components/AdminLayout";
import { ImageUpload } from "@/components/Uploads";

const emptyMember = { name: "", position_id: "", position_en: "", period: "", order: 0, photo_file_id: null };
const emptyRow = { rw: "", rt: "", head_name: "", phone: "", families: 0, residents: 0, note_id: "" };
const emptyFaq = { question_id: "", question_en: "", answer_id: "", answer_en: "", order: 0 };

function useCrud(listUrl, adminUrl, mapList) {
  const [items, setItems] = useState([]);
  const load = () =>
    api
      .get(listUrl)
      .then(({ data }) => setItems(mapList ? mapList(data) : data))
      .catch(() => {});
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (form) => {
    const payload = { ...form };
    delete payload.id;
    delete payload.updated_at;
    if (form.id) await api.put(`${adminUrl}/${form.id}`, payload);
    else await api.post(adminUrl, payload);
    load();
  };
  const remove = async (id) => {
    await api.delete(`${adminUrl}/${id}`);
    load();
  };
  return { items, save, remove, load };
}

export function MembersAdmin() {
  const { items, save, remove } = useCrud("/members", "/admin/members");
  const [form, setForm] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save({ ...form, order: Number(form.order) || 0 });
      toast.success("Anggota disimpan");
      setForm(null);
    } catch (err) {
      toast.error(errText(err));
    }
  };

  return (
    <AdminLayout
      title="Anggota Karang Taruna"
      actions={
        <Btn onClick={() => setForm({ ...emptyMember })} data-testid="member-new-btn">
          <span className="flex items-center gap-2">
            <Plus size={14} /> Tambah
          </span>
        </Btn>
      }
    >
      {form && (
        <Card className="mb-6">
          <form onSubmit={submit} className="space-y-4" data-testid="member-form">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama">
                <input
                  required
                  data-testid="member-name"
                  className={input}
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Jabatan (ID)">
                <input
                  required
                  data-testid="member-position"
                  className={input}
                  style={inputStyle}
                  value={form.position_id}
                  onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                />
              </Field>
              <Field label="Jabatan (EN)">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.position_en || ""}
                  onChange={(e) => setForm({ ...form, position_en: e.target.value })}
                />
              </Field>
              <Field label="Periode">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.period || ""}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                />
              </Field>
              <Field label="Urutan">
                <input
                  type="number"
                  className={input}
                  style={inputStyle}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </Field>
            </div>
            <ImageUpload
              label="Foto"
              kind="anggota"
              value={form.photo_file_id}
              onChange={(id) => setForm({ ...form, photo_file_id: id })}
            />
            <div className="flex gap-2">
              <Btn type="submit" data-testid="member-save-btn">
                Simpan
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setForm(null)}>
                Batal
              </Btn>
            </div>
          </form>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2" data-testid="admin-member-list">
        {items.map((m) => (
          <Card key={m.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display font-bold">{m.name}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-fg)" }}>
                {m.position_id} · {m.period}
              </p>
            </div>
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setForm({ ...emptyMember, ...m })} data-testid={`member-edit-${m.id}`}>
                <Pencil size={14} />
              </Btn>
              <Btn variant="danger" onClick={() => remove(m.id)} data-testid={`member-delete-${m.id}`}>
                <Trash2 size={14} />
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}

export function RwRtAdmin() {
  const { items, save, remove } = useCrud("/rwrt", "/admin/rwrt", (d) => d.rows);
  const [form, setForm] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    api.get("/rwrt").then(({ data }) => setUpdatedAt(data.updated_at)).catch(() => {});
  }, [items]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save({
        ...form,
        families: Number(form.families) || 0,
        residents: Number(form.residents) || 0,
      });
      toast.success("Data RW/RT disimpan");
      setForm(null);
    } catch (err) {
      toast.error(errText(err));
    }
  };

  return (
    <AdminLayout
      title="Data RW/RT"
      actions={
        <Btn onClick={() => setForm({ ...emptyRow })} data-testid="rwrt-new-btn">
          <span className="flex items-center gap-2">
            <Plus size={14} /> Tambah baris
          </span>
        </Btn>
      }
    >
      <p className="text-xs mb-5 font-mono-data" style={{ color: "var(--muted-fg)" }} data-testid="rwrt-admin-updated">
        Stempel publik "Terakhir diperbarui": {updatedAt ? fmtDate(updatedAt) : "-"}
      </p>
      {form && (
        <Card className="mb-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3" data-testid="rwrt-form">
            <Field label="RW">
              <input
                required
                data-testid="rwrt-rw"
                className={input}
                style={inputStyle}
                value={form.rw}
                onChange={(e) => setForm({ ...form, rw: e.target.value })}
              />
            </Field>
            <Field label="RT">
              <input
                required
                data-testid="rwrt-rt"
                className={input}
                style={inputStyle}
                value={form.rt}
                onChange={(e) => setForm({ ...form, rt: e.target.value })}
              />
            </Field>
            <Field label="Nama Ketua">
              <input
                required
                data-testid="rwrt-head"
                className={input}
                style={inputStyle}
                value={form.head_name}
                onChange={(e) => setForm({ ...form, head_name: e.target.value })}
              />
            </Field>
            <Field label="Telepon">
              <input
                className={input}
                style={inputStyle}
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Jumlah KK">
              <input
                type="number"
                className={input}
                style={inputStyle}
                value={form.families}
                onChange={(e) => setForm({ ...form, families: e.target.value })}
              />
            </Field>
            <Field label="Jumlah Jiwa">
              <input
                type="number"
                className={input}
                style={inputStyle}
                value={form.residents}
                onChange={(e) => setForm({ ...form, residents: e.target.value })}
              />
            </Field>
            <div className="flex gap-2 md:col-span-3">
              <Btn type="submit" data-testid="rwrt-save-btn">
                Simpan
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setForm(null)}>
                Batal
              </Btn>
            </div>
          </form>
        </Card>
      )}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <table className="w-full text-sm" data-testid="admin-rwrt-table">
          <thead>
            <tr className="text-left text-xs uppercase" style={{ color: "var(--muted-fg)" }}>
              <th className="py-3 px-4">RW</th>
              <th className="py-3 px-4">RT</th>
              <th className="py-3 px-4">Ketua</th>
              <th className="py-3 px-4">Telepon</th>
              <th className="py-3 px-4 text-right">KK</th>
              <th className="py-3 px-4 text-right">Jiwa</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                <td className="py-2.5 px-4 font-mono-data">{r.rw}</td>
                <td className="py-2.5 px-4 font-mono-data">{r.rt}</td>
                <td className="py-2.5 px-4">{r.head_name}</td>
                <td className="py-2.5 px-4 font-mono-data text-xs">{r.phone}</td>
                <td className="py-2.5 px-4 text-right font-mono-data">{r.families}</td>
                <td className="py-2.5 px-4 text-right font-mono-data">{r.residents}</td>
                <td className="py-2.5 px-4">
                  <div className="flex gap-2 justify-end">
                    <Btn variant="ghost" onClick={() => setForm({ ...emptyRow, ...r })} data-testid={`rwrt-edit-${r.id}`}>
                      <Pencil size={13} />
                    </Btn>
                    <Btn variant="danger" onClick={() => remove(r.id)} data-testid={`rwrt-delete-${r.id}`}>
                      <Trash2 size={13} />
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export function FaqAdmin() {
  const { items, save, remove } = useCrud("/faq", "/admin/faq");
  const [form, setForm] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save({ ...form, order: Number(form.order) || 0 });
      toast.success("FAQ disimpan");
      setForm(null);
    } catch (err) {
      toast.error(errText(err));
    }
  };

  return (
    <AdminLayout
      title="Tanya Jawab"
      actions={
        <Btn onClick={() => setForm({ ...emptyFaq })} data-testid="faq-new-btn">
          <span className="flex items-center gap-2">
            <Plus size={14} /> Tambah
          </span>
        </Btn>
      }
    >
      {form && (
        <Card className="mb-6">
          <form onSubmit={submit} className="space-y-4" data-testid="faq-form">
            <Field label="Pertanyaan (ID)">
              <input
                required
                data-testid="faq-question"
                className={input}
                style={inputStyle}
                value={form.question_id}
                onChange={(e) => setForm({ ...form, question_id: e.target.value })}
              />
            </Field>
            <Field label="Jawaban (ID)">
              <textarea
                required
                rows={3}
                data-testid="faq-answer"
                className={input}
                style={inputStyle}
                value={form.answer_id}
                onChange={(e) => setForm({ ...form, answer_id: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Pertanyaan (EN)">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.question_en || ""}
                  onChange={(e) => setForm({ ...form, question_en: e.target.value })}
                />
              </Field>
              <Field label="Jawaban (EN)">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.answer_en || ""}
                  onChange={(e) => setForm({ ...form, answer_en: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex gap-2">
              <Btn type="submit" data-testid="faq-save-btn">
                Simpan
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setForm(null)}>
                Batal
              </Btn>
            </div>
          </form>
        </Card>
      )}
      <div className="space-y-3" data-testid="admin-faq-list">
        {items.map((f) => (
          <Card key={f.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">{f.question_id}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-fg)" }}>
                {f.answer_id}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Btn variant="ghost" onClick={() => setForm({ ...emptyFaq, ...f })} data-testid={`faq-edit-${f.id}`}>
                <Pencil size={13} />
              </Btn>
              <Btn variant="danger" onClick={() => remove(f.id)} data-testid={`faq-delete-${f.id}`}>
                <Trash2 size={13} />
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
