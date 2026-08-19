import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Send, CheckCircle2, XCircle, EyeOff, Eye, Receipt, History } from "lucide-react";
import { api, errText, fileUrl, fmtDate, rupiah } from "@/lib/api";
import { AdminLayout, Btn, Card, Field, input, inputStyle } from "@/components/AdminLayout";
import { ReceiptCensor } from "@/components/Uploads";
import { useAuth } from "@/context/AuthContext";

const emptyReport = {
  title_id: "",
  title_en: "",
  event_date: new Date().toISOString().slice(0, 10),
  description_id: "",
  description_en: "",
  items: [],
};

const emptyItem = {
  type: "masuk",
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  receipt_file_id: null,
  receipt_public: true,
};

const statusLabel = {
  draft: "Draft",
  menunggu_persetujuan: "Menunggu persetujuan",
  terbit: "Terbit",
};

export default function FinanceAdmin() {
  const { isSuper } = useAuth();
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(null);
  const [item, setItem] = useState(null);
  const [censorFor, setCensorFor] = useState(false);
  const [reason, setReason] = useState("");

  const load = () => api.get("/admin/finance").then(({ data }) => setReports(data)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const cleanItems = (items) =>
    items.map((i) => ({
      type: i.type,
      description: i.description,
      amount: Math.round(Number(i.amount) || 0),
      date: i.date || null,
      receipt_file_id: i.receipt_file_id || null,
      receipt_public: i.receipt_public !== false,
    }));

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      title_id: form.title_id,
      title_en: form.title_en || null,
      event_date: form.event_date || null,
      description_id: form.description_id || null,
      description_en: form.description_en || null,
      items: cleanItems(form.items),
      revision_reason: reason || null,
    };
    try {
      if (form.id) await api.put(`/admin/finance/${form.id}`, payload);
      else await api.post("/admin/finance", payload);
      toast.success("Laporan disimpan");
      setForm(null);
      setReason("");
      load();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  const act = async (id, path, body) => {
    try {
      await api.post(`/admin/finance/${id}/${path}`, body || {});
      toast.success("Berhasil");
      load();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  const toggleReceipt = async (report, index) => {
    try {
      await api.put(`/admin/finance/${report.id}/items/${index}/receipt`, {
        receipt_public: !(report.items[index].receipt_public !== false),
      });
      toast.success("Visibilitas nota diperbarui");
      load();
    } catch (err) {
      toast.error(errText(err));
    }
  };

  const totals = (items) => {
    const inc = items.filter((i) => i.type === "masuk").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const out = items.filter((i) => i.type === "keluar").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return { inc, out, bal: inc - out };
  };

  return (
    <AdminLayout
      title="Modul Keuangan"
      actions={
        <Btn onClick={() => setForm({ ...emptyReport, items: [] })} data-testid="finance-new-btn">
          <span className="flex items-center gap-2">
            <Plus size={14} /> Laporan baru
          </span>
        </Btn>
      }
    >
      {form && (
        <Card className="mb-6">
          <form onSubmit={save} className="space-y-5" data-testid="finance-form">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Judul laporan (ID)">
                <input
                  required
                  data-testid="finance-title-id"
                  className={input}
                  style={inputStyle}
                  value={form.title_id}
                  onChange={(e) => setForm({ ...form, title_id: e.target.value })}
                />
              </Field>
              <Field label="Judul laporan (EN)">
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
                  data-testid="finance-date"
                  className={input}
                  style={inputStyle}
                  value={form.event_date || ""}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </Field>
              <Field label="Keterangan (ID)">
                <input
                  className={input}
                  style={inputStyle}
                  value={form.description_id || ""}
                  onChange={(e) => setForm({ ...form, description_id: e.target.value })}
                />
              </Field>
            </div>

            <div className="rounded-lg border p-4" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
                  Rincian masuk / keluar
                </p>
                <Btn type="button" variant="ghost" onClick={() => setItem({ ...emptyItem })} data-testid="item-add-btn">
                  <span className="flex items-center gap-2">
                    <Plus size={13} /> Tambah item
                  </span>
                </Btn>
              </div>

              {item && (
                <div className="mt-4 grid gap-3 md:grid-cols-4 items-end" data-testid="item-form">
                  <Field label="Jenis">
                    <select
                      data-testid="item-type"
                      className={input}
                      style={inputStyle}
                      value={item.type}
                      onChange={(e) => setItem({ ...item, type: e.target.value })}
                    >
                      <option value="masuk">Masuk</option>
                      <option value="keluar">Keluar</option>
                    </select>
                  </Field>
                  <Field label="Keterangan">
                    <input
                      data-testid="item-description"
                      className={input}
                      style={inputStyle}
                      value={item.description}
                      onChange={(e) => setItem({ ...item, description: e.target.value })}
                    />
                  </Field>
                  <Field label="Jumlah (Rupiah, bulat)">
                    <input
                      type="number"
                      step="1"
                      data-testid="item-amount"
                      className={input}
                      style={inputStyle}
                      value={item.amount}
                      onChange={(e) => setItem({ ...item, amount: e.target.value })}
                    />
                  </Field>
                  <Field label="Tanggal">
                    <input
                      type="date"
                      data-testid="item-date"
                      className={input}
                      style={inputStyle}
                      value={item.date || ""}
                      onChange={(e) => setItem({ ...item, date: e.target.value })}
                    />
                  </Field>
                  <div className="md:col-span-4">
                    {item.receipt_file_id ? (
                      <div className="flex items-center gap-3">
                        <img src={fileUrl(item.receipt_file_id)} alt="nota" className="h-16 rounded border" />
                        <Btn
                          type="button"
                          variant="ghost"
                          onClick={() => setItem({ ...item, receipt_file_id: null })}
                          data-testid="item-receipt-clear"
                        >
                          Ganti nota
                        </Btn>
                      </div>
                    ) : censorFor ? (
                      <ReceiptCensor
                        onUploaded={(id) => {
                          setItem((prev) => ({ ...prev, receipt_file_id: id }));
                          setCensorFor(false);
                        }}
                        onCancel={() => setCensorFor(false)}
                      />
                    ) : (
                      <Btn type="button" variant="ghost" onClick={() => setCensorFor(true)} data-testid="item-receipt-btn">
                        <span className="flex items-center gap-2">
                          <Receipt size={13} /> Unggah nota (wajib disensor)
                        </span>
                      </Btn>
                    )}
                  </div>
                  <div className="md:col-span-4 flex gap-2">
                    <Btn
                      type="button"
                      onClick={() => {
                        if (!item.description || !item.amount) {
                          toast.error("Keterangan dan jumlah wajib diisi");
                          return;
                        }
                        setForm({ ...form, items: [...form.items, item] });
                        setItem(null);
                        setCensorFor(false);
                      }}
                      data-testid="item-save-btn"
                    >
                      Tambahkan
                    </Btn>
                    <Btn
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setItem(null);
                        setCensorFor(false);
                      }}
                    >
                      Batal
                    </Btn>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2" data-testid="item-list">
                {form.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-sm border-b pb-2"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span className="font-mono-data text-xs" style={{ color: "var(--muted-fg)" }}>
                      {it.date} · {it.type}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{it.description}</span>
                    {it.receipt_file_id && <Receipt size={13} style={{ color: "var(--primary)" }} />}
                    <span className="font-mono-data">{rupiah(it.amount)}</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                      data-testid={`item-remove-${idx}`}
                    >
                      <Trash2 size={13} style={{ color: "#B3261E" }} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm font-mono-data" data-testid="form-totals">
                <span>Masuk: {rupiah(totals(form.items).inc)}</span>
                <span>Keluar: {rupiah(totals(form.items).out)}</span>
                <span style={{ color: "var(--primary)" }}>Saldo: {rupiah(totals(form.items).bal)}</span>
              </div>
            </div>

            {form.status === "terbit" && (
              <Field label="Alasan revisi (wajib, tampil publik)">
                <input
                  required
                  data-testid="finance-revision-reason"
                  className={input}
                  style={inputStyle}
                  placeholder="contoh: koreksi angka konsumsi"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            )}

            <div className="flex gap-2">
              <Btn type="submit" data-testid="finance-save-btn">
                Simpan
              </Btn>
              <Btn
                type="button"
                variant="ghost"
                onClick={() => {
                  setForm(null);
                  setItem(null);
                  setReason("");
                }}
              >
                Batal
              </Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4" data-testid="admin-finance-list">
        {reports.map((r) => (
          <Card key={r.id} data-testid={`finance-row-${r.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display font-bold">{r.title_id}</p>
                <p className="text-xs mt-1 font-mono-data" style={{ color: "var(--muted-fg)" }}>
                  {fmtDate(r.event_date)} · {statusLabel[r.status] || r.status} · Saldo {rupiah(r.balance)}
                </p>
                {r.reject_reason && r.status === "draft" && (
                  <p className="text-xs mt-1" style={{ color: "#B3261E" }}>
                    Ditolak: {r.reject_reason}
                  </p>
                )}
                {(r.revisions || []).length > 0 && (
                  <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: "var(--muted-fg)" }}>
                    <History size={12} /> {r.revisions.length} revisi · terakhir: {r.revisions[r.revisions.length - 1].reason}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn
                  variant="ghost"
                  onClick={() => {
                    setForm({ ...emptyReport, ...r, items: r.items || [] });
                    setReason("");
                  }}
                  data-testid={`finance-edit-${r.id}`}
                >
                  Edit
                </Btn>
                {r.status === "draft" && (
                  <Btn onClick={() => act(r.id, "submit")} data-testid={`finance-submit-${r.id}`}>
                    <span className="flex items-center gap-2">
                      <Send size={13} /> Ajukan
                    </span>
                  </Btn>
                )}
                {isSuper && r.status === "menunggu_persetujuan" && (
                  <>
                    <Btn onClick={() => act(r.id, "approve")} data-testid={`finance-approve-${r.id}`}>
                      <span className="flex items-center gap-2">
                        <CheckCircle2 size={13} /> Setujui & terbitkan
                      </span>
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => {
                        const why = window.prompt("Alasan penolakan?");
                        if (why) act(r.id, "reject", { reason: why });
                      }}
                      data-testid={`finance-reject-${r.id}`}
                    >
                      <span className="flex items-center gap-2">
                        <XCircle size={13} /> Tolak
                      </span>
                    </Btn>
                  </>
                )}
                {isSuper && r.status === "terbit" && (
                  <Btn
                    variant="danger"
                    onClick={() => {
                      const why = window.prompt("Alasan menarik laporan dari publik?");
                      if (why) act(r.id, "unpublish", { reason: why });
                    }}
                    data-testid={`finance-unpublish-${r.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <EyeOff size={13} /> Tarik dari publik
                    </span>
                  </Btn>
                )}
              </div>
            </div>

            {isSuper && (r.items || []).some((i) => i.receipt_file_id) && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--muted-fg)" }}>
                  Visibilitas nota per item
                </p>
                <div className="space-y-2">
                  {r.items.map((it, idx) =>
                    it.receipt_file_id ? (
                      <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{it.description}</span>
                        <button
                          onClick={() => toggleReceipt(r, idx)}
                          data-testid={`receipt-toggle-${r.id}-${idx}`}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
                          style={{ borderColor: "var(--line)" }}
                        >
                          {it.receipt_public !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                          {it.receipt_public !== false ? "Publik" : "Disembunyikan"}
                        </button>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
        {reports.length === 0 && <p className="text-sm">Belum ada laporan keuangan.</p>}
      </div>
    </AdminLayout>
  );
}
