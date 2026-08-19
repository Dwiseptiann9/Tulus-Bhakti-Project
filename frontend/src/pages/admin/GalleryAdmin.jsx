import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { api, errText, fileUrl, fmtDate } from "@/lib/api";
import { AdminLayout, Btn, Card, Field, input, inputStyle } from "@/components/AdminLayout";
import { ImageUpload } from "@/components/Uploads";

const empty = {
  title_id: "",
  title_en: "",
  event_date: new Date().toISOString().slice(0, 10),
  description_id: "",
  description_en: "",
  cover_file_id: null,
  published: true,
};

export default function GalleryAdmin() {
  const [albums, setAlbums] = useState([]);
  const [form, setForm] = useState(null);
  const [openAlbum, setOpenAlbum] = useState(null);

  const load = () =>
    api.get("/albums", { params: { include_draft: true } }).then(({ data }) => setAlbums(data)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    delete payload.id;
    delete payload.photo_count;
    delete payload.photos;
    try {
      if (form.id) await api.put(`/admin/albums/${form.id}`, payload);
      else await api.post("/admin/albums", payload);
      toast.success("Album disimpan");
      setForm(null);
      load();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus album beserta fotonya?")) return;
    await api.delete(`/admin/albums/${id}`);
    load();
  };

  const openPhotos = async (id) => {
    const { data } = await api.get(`/albums/${id}`);
    setOpenAlbum(data);
  };

  const addPhoto = async (fileId) => {
    if (!fileId || !openAlbum) return;
    try {
      await api.post("/admin/photos", { album_id: openAlbum.id, file_id: fileId });
      toast.success("Foto ditambahkan");
      openPhotos(openAlbum.id);
      load();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  const removePhoto = async (photoId) => {
    await api.delete(`/admin/photos/${photoId}`);
    openPhotos(openAlbum.id);
    load();
  };

  return (
    <AdminLayout
      title="Galeri"
      actions={
        <Btn onClick={() => setForm({ ...empty })} data-testid="album-new-btn">
          <span className="flex items-center gap-2">
            <Plus size={14} /> Album baru
          </span>
        </Btn>
      }
    >
      {form && (
        <Card className="mb-6">
          <form onSubmit={save} className="space-y-4" data-testid="album-form">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama acara (ID)">
                <input
                  required
                  data-testid="album-title-id"
                  className={input}
                  style={inputStyle}
                  value={form.title_id}
                  onChange={(e) => setForm({ ...form, title_id: e.target.value })}
                />
              </Field>
              <Field label="Nama acara (EN)">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.title_en || ""}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                />
              </Field>
              <Field label="Tanggal acara">
                <input
                  type="date"
                  data-testid="album-date"
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
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    data-testid="album-published"
                  />
                  Terbitkan
                </label>
              </Field>
            </div>
            <Field label="Deskripsi (ID)">
              <textarea
                rows={3}
                className={input}
                style={inputStyle}
                value={form.description_id || ""}
                onChange={(e) => setForm({ ...form, description_id: e.target.value })}
              />
            </Field>
            <ImageUpload
              label="Cover album"
              kind="galeri"
              value={form.cover_file_id}
              onChange={(id) => setForm({ ...form, cover_file_id: id })}
            />
            <div className="flex gap-2">
              <Btn type="submit" data-testid="album-save-btn">
                Simpan
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setForm(null)}>
                Batal
              </Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2" data-testid="admin-album-list">
        {albums.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-bold truncate">{a.title_id}</p>
                <p className="text-xs mt-1 font-mono-data" style={{ color: "var(--muted-fg)" }}>
                  {fmtDate(a.event_date)} · {a.photo_count} foto · {a.published ? "terbit" : "draft"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Btn variant="ghost" onClick={() => openPhotos(a.id)} data-testid={`album-photos-${a.id}`}>
                  <ImageIcon size={14} />
                </Btn>
                <Btn variant="ghost" onClick={() => setForm({ ...empty, ...a })} data-testid={`album-edit-${a.id}`}>
                  <Pencil size={14} />
                </Btn>
                <Btn variant="danger" onClick={() => remove(a.id)} data-testid={`album-delete-${a.id}`}>
                  <Trash2 size={14} />
                </Btn>
              </div>
            </div>
          </Card>
        ))}
        {albums.length === 0 && <p className="text-sm">Belum ada album.</p>}
      </div>

      {openAlbum && (
        <Card className="mt-6" data-testid="album-photo-manager">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold">Foto — {openAlbum.title_id}</p>
            <Btn variant="ghost" onClick={() => setOpenAlbum(null)} data-testid="close-photo-manager">
              Tutup
            </Btn>
          </div>
          <div className="mt-5">
            <ImageUpload label="Tambah foto" kind="galeri" value={null} onChange={addPhoto} />
          </div>
          <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
            {openAlbum.photos.map((p) => (
              <div key={p.id} className="relative">
                <img src={fileUrl(p.file_id)} alt="" className="w-full h-28 object-cover rounded-lg border" />
                <button
                  onClick={() => removePhoto(p.id)}
                  data-testid={`photo-delete-${p.id}`}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full text-white"
                  style={{ background: "#B3261E" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
