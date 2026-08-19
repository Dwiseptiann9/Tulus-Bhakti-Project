import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Images, Users, MapPinned, Wallet, Inbox, Clock } from "lucide-react";
import { api, fmtDate } from "@/lib/api";
import { AdminLayout, Card } from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { isSuper } = useAuth();
  const [stats, setStats] = useState({});
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/admin/audit", { params: { limit: 8 } }).then(({ data }) => setAudit(data)).catch(() => {});
  }, []);

  const tiles = [
    ["Berita & Kegiatan", stats.news, Newspaper, "/admin/berita"],
    ["Album Galeri", stats.albums, Images, "/admin/galeri"],
    ["Anggota KT", stats.members, Users, "/admin/anggota"],
    ["Baris RW/RT", stats.rwrt, MapPinned, "/admin/rw-rt"],
    ["Laporan Terbit", stats.finance_published, Wallet, "/admin/keuangan"],
    ["Pesan Belum Dibaca", stats.messages_unread, Inbox, "/admin/inbox"],
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="dashboard-tiles">
        {tiles.map(([label, value, Icon, to]) => (
          <Link key={label} to={to} data-testid={`stat-${to.split("/").pop()}`}>
            <Card className="transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
                    {label}
                  </p>
                  <p className="mt-2 font-mono-data text-3xl font-semibold">{value ?? 0}</p>
                </div>
                <Icon size={20} style={{ color: "var(--primary)" }} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>
            Status Laporan Keuangan
          </p>
          <div className="mt-5 space-y-3 text-sm" data-testid="finance-status-summary">
            <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--line)" }}>
              <span>Draft</span>
              <span className="font-mono-data">{stats.finance_draft ?? 0}</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--line)" }}>
              <span>Menunggu persetujuan</span>
              <span className="font-mono-data" style={{ color: "var(--primary)" }}>
                {stats.finance_pending ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Terbit</span>
              <span className="font-mono-data">{stats.finance_published ?? 0}</span>
            </div>
          </div>
          {isSuper && (stats.finance_pending ?? 0) > 0 && (
            <Link
              to="/admin/keuangan"
              className="mt-5 inline-block text-sm link-underline"
              style={{ color: "var(--primary)" }}
              data-testid="review-pending-link"
            >
              Tinjau laporan yang menunggu persetujuan
            </Link>
          )}
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--muted-fg)" }}>
            <Clock size={13} /> Aktivitas Terakhir
          </p>
          <ul className="mt-5 space-y-3 text-sm" data-testid="recent-audit">
            {audit.map((a) => (
              <li key={a.id} className="border-b pb-2" style={{ borderColor: "var(--line)" }}>
                <span className="font-medium">{a.user_name}</span>{" "}
                <span style={{ color: "var(--muted-fg)" }}>{a.action.replace(/_/g, " ")}</span>
                <span className="block text-xs font-mono-data" style={{ color: "var(--muted-fg)" }}>
                  {fmtDate(a.at)} {a.detail ? `· ${a.detail}` : ""}
                </span>
              </li>
            ))}
            {audit.length === 0 && (
              <li className="text-xs" style={{ color: "var(--muted-fg)" }}>
                Belum ada aktivitas.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
