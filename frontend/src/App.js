import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { LangProvider } from "@/i18n";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { DarkProvider } from "@/context/DarkContext";
import { PublicLayout } from "@/components/PublicLayout";

import Home from "@/pages/Home";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import { Gallery, GalleryAlbum } from "@/pages/Gallery";
import { Finance, FinanceDetail } from "@/pages/Finance";
import { About, Structure, RwRt } from "@/pages/StaticPages";
import Contact from "@/pages/Contact";
import Sponsors from "@/pages/Sponsors";
import { Login, ForgotPassword, ResetPassword } from "@/pages/Auth";
import Dashboard from "@/pages/admin/Dashboard";
import NewsAdmin from "@/pages/admin/NewsAdmin";
import GalleryAdmin from "@/pages/admin/GalleryAdmin";
import { MembersAdmin, RwRtAdmin, FaqAdmin } from "@/pages/admin/DataAdmin";
import FinanceAdmin from "@/pages/admin/FinanceAdmin";
import { InboxAdmin, AuditAdmin, SettingsAdmin, UsersAdmin, PartnersAdmin } from "@/pages/admin/MiscAdmin";

const Public = ({ children }) => <PublicLayout>{children}</PublicLayout>;

export default function App() {
  return (
    <LangProvider>
      <SettingsProvider>
        <DarkProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/" element={<Public><Home /></Public>} />
              <Route path="/berita" element={<Public><News /></Public>} />
              <Route path="/berita/:slug" element={<Public><NewsDetail /></Public>} />
              <Route path="/galeri" element={<Public><Gallery /></Public>} />
              <Route path="/galeri/:albumId" element={<Public><GalleryAlbum /></Public>} />
              <Route path="/keuangan" element={<Public><Finance /></Public>} />
              <Route path="/keuangan/:reportId" element={<Public><FinanceDetail /></Public>} />
              <Route path="/tentang" element={<Public><About /></Public>} />
              <Route path="/struktur" element={<Public><Structure /></Public>} />
              <Route path="/rw-rt" element={<Public><RwRt /></Public>} />
              <Route path="/kontak" element={<Public><Contact /></Public>} />
              <Route path="/sponsor" element={<Public><Sponsors /></Public>} />

              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/berita" element={<NewsAdmin />} />
              <Route path="/admin/galeri" element={<GalleryAdmin />} />
              <Route path="/admin/anggota" element={<MembersAdmin />} />
              <Route path="/admin/rw-rt" element={<RwRtAdmin />} />
              <Route path="/admin/faq" element={<FaqAdmin />} />
              <Route path="/admin/keuangan" element={<FinanceAdmin />} />
              <Route path="/admin/inbox" element={<InboxAdmin />} />
              <Route path="/admin/sponsor" element={<PartnersAdmin />} />
              <Route path="/admin/audit" element={<AuditAdmin />} />
              <Route path="/admin/pengaturan" element={<SettingsAdmin />} />
              <Route path="/admin/akun" element={<UsersAdmin />} />

              <Route path="*" element={<Public><Home /></Public>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        </DarkProvider>
      </SettingsProvider>
    </LangProvider>
  );
}
