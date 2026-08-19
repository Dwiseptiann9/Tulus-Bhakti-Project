import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Eraser, ShieldAlert } from "lucide-react";
import { api, errText, fileUrl } from "@/lib/api";
import { Btn } from "@/components/AdminLayout";

export const ImageUpload = ({ value, onChange, kind = "umum", label = "Gambar" }) => {
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    fd.append("censored", "false");
    try {
      const { data } = await api.post("/admin/upload", fd);
      onChange(data.file_id);
      toast.success("Gambar diunggah");
    } catch (e) {
      toast.error(errText(e));
    }
    setBusy(false);
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-fg)" }}>
        {label}
      </p>
      <div className="flex items-center gap-3">
        {value && <img src={fileUrl(value)} alt="" className="h-16 w-16 rounded-lg object-cover border" />}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
          data-testid={`upload-input-${kind}`}
        />
        <Btn type="button" variant="ghost" onClick={() => ref.current?.click()} disabled={busy} data-testid={`upload-btn-${kind}`}>
          <span className="flex items-center gap-2">
            <Upload size={14} /> {busy ? "Mengunggah..." : "Pilih gambar"}
          </span>
        </Btn>
        {value && (
          <Btn type="button" variant="ghost" onClick={() => onChange(null)} data-testid="upload-clear">
            Hapus
          </Btn>
        )}
      </div>
    </div>
  );
};

// Nota: preview -> sensor (blok hitam) -> checkbox konfirmasi -> simpan
export const ReceiptCensor = ({ onUploaded, onCancel }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const drawing = useRef(null);

  const pickFile = (file) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const scale = Math.min(1, 900 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      imgRef.current = img;
      setLoaded(true);
      setConfirmed(false);
    };
    img.src = URL.createObjectURL(file);
  };

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * canvasRef.current.width,
      y: ((cy - rect.top) / rect.height) * canvasRef.current.height,
    };
  };

  const start = (e) => {
    if (!loaded) return;
    drawing.current = pos(e);
  };
  const end = (e) => {
    if (!drawing.current) return;
    const p = pos(e.changedTouches ? { touches: e.changedTouches } : e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#111111";
    ctx.fillRect(
      Math.min(drawing.current.x, p.x),
      Math.min(drawing.current.y, p.y),
      Math.abs(p.x - drawing.current.x),
      Math.abs(p.y - drawing.current.y)
    );
    drawing.current = null;
    setConfirmed(false);
  };

  const reset = () => {
    if (!imgRef.current) return;
    const canvas = canvasRef.current;
    canvas.getContext("2d").drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    setConfirmed(false);
  };

  const save = async () => {
    if (!confirmed) return;
    setBusy(true);
    canvasRef.current.toBlob(async (blob) => {
      const fd = new FormData();
      fd.append("file", new File([blob], "nota.png", { type: "image/png" }));
      fd.append("kind", "nota");
      fd.append("censored", "true");
      try {
        const { data } = await api.post("/admin/upload", fd);
        onUploaded(data.file_id);
        toast.success("Nota tersensor diunggah");
      } catch (e) {
        toast.error(errText(e));
      }
      setBusy(false);
    }, "image/png");
  };

  return (
    <div className="space-y-4" data-testid="receipt-censor">
      <div
        className="flex items-start gap-2 text-xs p-3 rounded-lg"
        style={{ background: "var(--muted)", color: "var(--muted-fg)" }}
      >
        <ShieldAlert size={16} className="shrink-0 mt-0.5" />
        <span>
          Wajib disensor: seret di atas gambar untuk menutup NIK, nomor HP, dan tanda tangan dengan blok hitam.
          Nota akan tampil publik.
        </span>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => pickFile(e.target.files?.[0])}
        data-testid="receipt-file-input"
        className="text-sm"
      />
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseUp={end}
        onTouchStart={start}
        onTouchEnd={end}
        data-testid="receipt-canvas"
        className="max-w-full border rounded-lg touch-none cursor-crosshair"
        style={{ borderColor: "var(--line)", display: loaded ? "block" : "none" }}
      />
      {loaded && (
        <>
          <Btn type="button" variant="ghost" onClick={reset} data-testid="receipt-reset-btn">
            <span className="flex items-center gap-2">
              <Eraser size={14} /> Ulangi sensor
            </span>
          </Btn>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              data-testid="receipt-confirm-checkbox"
              className="mt-1"
            />
            <span>Saya sudah menghapus NIK, nomor HP, dan tanda tangan dari nota ini.</span>
          </label>
          <div className="flex gap-2">
            <Btn type="button" onClick={save} disabled={!confirmed || busy} data-testid="receipt-save-btn">
              {busy ? "Mengunggah..." : "Simpan nota"}
            </Btn>
            <Btn type="button" variant="ghost" onClick={onCancel} data-testid="receipt-cancel-btn">
              Batal
            </Btn>
          </div>
        </>
      )}
    </div>
  );
};
