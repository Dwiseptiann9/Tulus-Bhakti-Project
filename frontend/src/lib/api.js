import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pdd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiError(detail) {
  if (detail == null) return "Terjadi kesalahan. Coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const errText = (e) => apiError(e?.response?.data?.detail) || e?.message;

export const fileUrl = (id) => (id ? `${API}/files/${id}` : null);

const FALLBACK_IMAGES = {
  kegiatan: [
    "https://images.unsplash.com/photo-1542897643-8158da5b4607?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.unsplash.com/photo-1542897842-85aaec89ba6f?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "https://images.pexels.com/photos/16130194/pexels-photo-16130194.png?auto=compress&cs=tinysrgb&w=900",
  ],
  berita: [
    "https://images.pexels.com/photos/15647015/pexels-photo-15647015.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/37361321/pexels-photo-37361321.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/15830193/pexels-photo-15830193.jpeg?auto=compress&cs=tinysrgb&w=900",
  ],
};

// Setiap kartu berita selalu punya gambar: pakai cover bila ada, kalau tidak
// pilih gambar bawaan yang stabil per item (berdasarkan id).
export const newsImage = (item, index = 0) => {
  if (!item) return FALLBACK_IMAGES.berita[0];
  if (item.cover_file_id) return fileUrl(item.cover_file_id);
  const pool = FALLBACK_IMAGES[item.category] || FALLBACK_IMAGES.berita;
  const key = String(item.id || item.slug || "x");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  return pool[(hash + index) % pool.length];
};

export const rupiah = (n) =>
  "Rp " + (Number(n) || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

export const fmtDate = (iso, lang = "id") => {
  if (!iso) return "-";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
