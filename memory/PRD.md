# Portal Desa Digital — PRD

## Problem Statement (original)
Portal publik untuk Karang Taruna + Forum Desa: berita kegiatan, galeri, profil organisasi, data RW/RT, dan laporan keuangan yang bisa dipertanggungjawabkan. Keputusan kunci: publikasi keuangan wajib approval Super Admin; nota publik tapi wajib disensor sebelum upload; revisi laporan punya jejak publik; dwibahasa ID/EN (UI penuh, konten ID wajib + EN opsional); 1 tema dasar + toggle aksen musiman (Netral, Lebaran, 17 Agustus). Stack: React SPA + FastAPI + MongoDB, mobile-first, uang disimpan sebagai integer rupiah.

## Architecture
- Frontend: React (CRA + craco), Tailwind, `@/` alias. Contexts: LangProvider (i18n ID/EN), SettingsProvider (identitas + tema musiman via body class), AuthProvider (JWT cookie + Bearer fallback).
- Backend: FastAPI, semua route di bawah `/api`. Modul: `core.py` (db/auth/audit), `routers_auth.py`, `routers_content.py`, `routers_finance.py`, `routers_misc.py`, `storage.py` (Emergent Object Storage + WebP resize <=300KB), `mailer.py` (Resend terkelola Emergent).
- DB: MongoDB — collections: users, news, albums, photos, members, rwrt, faq, pages, finance, finance_versions, files, messages, captchas, settings, meta, audit_logs, login_attempts, password_reset_tokens.
- SEO: meta title/description dinamis di halaman berita + `/sitemap.xml`.

## User Personas
- Pengunjung/warga: baca berita, galeri, cek laporan keuangan & data RW/RT, kirim pesan.
- Admin (3 orang): CRUD konten, kelola anggota & RW/RT, buat/edit draft laporan keuangan, inbox.
- Super Admin: semua akses Admin + approve/unpublish laporan, visibilitas nota, logo & tema, kelola akun.

## Core Requirements (static)
- Laporan keuangan hanya publik setelah disetujui Super Admin.
- Nota wajib disensor + checkbox konfirmasi sebelum tersimpan.
- Edit laporan terbit wajib alasan revisi, tampil publik, versi lama disimpan.
- Semua nominal integer rupiah.
- Data RW/RT selalu menampilkan tanggal terakhir diperbarui.

## Implemented (2026-06)
- Fase 1: JWT auth (bcrypt, brute-force lockout per IP dan per email, reset password via Resend), peran admin/super_admin, layout publik + admin, i18n ID/EN dengan penanda fallback, logo & aksen musiman.
- Fase 2: CMS berita/kegiatan (pencarian + filter tahun), galeri album + foto + lightbox, profil/visi/misi, struktur Karang Taruna, data RW/RT dengan stempel tanggal, FAQ.
- Fase 3: modul keuangan draft → ajukan → approve/tolak → terbit, unpublish, item masuk/keluar integer rupiah, tool sensor nota (blok hitam + checkbox wajib), visibilitas nota per item (Super Admin), riwayat revisi publik, ekspor PDF via print style.
- Fase 4: form kontak + captcha matematika + rate limit 5/jam per IP, inbox admin + notifikasi email, audit log, SEO meta + sitemap, upload dikompres ke WebP.
- Uji: 38/39 backend test lulus pada iterasi 1; satu isu brute-force lockout ditemukan dan sudah diperbaiki + diverifikasi manual (429 setelah 5 percobaan).

## Implemented (lanjutan, 2026-06)
- Ringkasan Kas Tahunan publik di `/keuangan`: endpoint `GET /api/finance/summary/yearly` (agregasi laporan terbit per tahun) + grafik batang Recharts (masuk vs keluar), tabel per tahun, dan total keseluruhan.
- Tombol "Bagikan ke WhatsApp" (`ShareButton`) di halaman detail berita dan detail laporan keuangan.
- Kartu gambar bagikan otomatis: `GET /api/og/news/{slug}.png` dan `GET /api/og/finance/{id}.png` menghasilkan kartu 1200x630 (Pillow) mengikuti warna tema musiman aktif; laporan keuangan menampilkan total masuk/keluar/saldo. Tautan bagikan mengarah ke landing `GET /api/share/berita/{slug}` & `/api/share/keuangan/{id}` yang menyajikan meta Open Graph lalu redirect ke halaman SPA — perlu karena crawler WhatsApp tidak menjalankan JavaScript.
- Filter tahun pada grafik Ringkasan Kas Tahunan (dropdown Semua tahun / per tahun), saldo ringkasan mengikuti pilihan.

## Tema musiman (4 pilihan, interaktif)
Dipilih Super Admin di `/admin/pengaturan`, tersimpan di `settings.season_theme`:
1. `netral` — Natural, tanpa dekorasi tambahan.
2. `idul_fitri` — palet hijau/emas + motif SVG ketupat, bulan sabit, lentera, masjid; ribbon ucapan berjalan + motif mengapung di hero.
3. `idul_adha` — palet cokelat tanah/sand + motif hewan kurban (kambing), bulan sabit, masjid.
4. `kemerdekaan` — palet merah/putih + motif garuda, bendera, bintang, dan strip merah-putih.
Komponen: `components/ThemeDecor.jsx` (`ThemeRibbon`, `ThemeHeroDecor`, `ThemeAccentIcon`); kartu bagikan OG mengikuti warna tema. Nilai lama `lebaran`/`agustus17` otomatis dipetakan ke tema baru.

## Implemented (lanjutan)
- Pratinjau tema di `/admin/pengaturan`: komponen `ThemePreview` (di `ThemeDecor.jsx`) menampilkan contoh header, ribbon ucapan, hero, dan palet warna sesuai pilihan dropdown sebelum disimpan. Variabel tema kini juga berlaku pada kelas `.theme-*` (bukan hanya `body.theme-*`) agar bisa di-scope ke pratinjau.
- Cover otomatis galeri: `GET /api/albums` dan `/api/albums/{id}` mengembalikan `cover_display` = cover pilihan admin, atau foto pertama album bila kosong. Dipakai di halaman Galeri dan kartu galeri beranda.

## Implemented (lanjutan 2)
- Sosial media: `settings.instagram`, `tiktok`, `youtube` → ikon di header (desktop), menu mobile, dan footer (`components/Social.jsx`, ikon TikTok custom SVG).
- Mode gelap: `context/DarkContext.jsx` (toggle di header publik & sidebar admin, tersimpan di localStorage, default ikut preferensi sistem). Palet gelap per tema via `body.dark.theme-*` di `index.css`.
- Beranda disederhanakan: hanya banner besar (logo + nama + tagline + tombol "Portal Berita" & "Hubungi Kami") lalu strip sponsor. Banner bisa diganti/ditambah Super Admin lewat `settings.banner_file_ids`; bila lebih dari satu, tampil bergantian tiap 6 detik dengan indikator titik.
- Upload logo/sponsor tetap transparan: `to_webp(keep_alpha=True)` untuk kind `logo`, `sponsor`, `support` (tidak lagi jadi latar hitam); kind `banner` disimpan lebih besar (maks 2200px, ~550KB).
- Menu Sponsor & Dukungan: koleksi `partners` (nama, jenis sponsor/support, logo, tautan, urutan), CRUD di `/admin/sponsor`, halaman publik `/sponsor` + strip logo di beranda.
- Impor keuangan via Excel: `GET /api/admin/finance-template.xlsx` (template + sheet Petunjuk) dan `POST /api/admin/finance-parse-excel` (validasi jenis/tanggal/jumlah, laporan error per baris) — hasil parsing masuk sebagai item draft, nota tetap wajib lewat alat sensor.

## Backlog
- P0: tidak ada yang terbuka.
- P1: pengujian UI mendalam (CRUD via UI, lightbox, submit form kontak), unggah nota dengan blur (bukan hanya blok hitam), pagination berita bila konten bertambah.
- P2: notifikasi email ke semua admin (bukan hanya satu contact_email), ekspor PDF server-side ber-branding, cache gambar/CDN, halaman 404 khusus.

## Next tasks
1. Ganti email kontak seed (`delivered@resend.dev`) dengan email asli pengurus.
2. Tentukan Super Admin utama + penggantinya, lalu buat akunnya di /admin/akun.
3. Putuskan apakah jumlah KK/jiwa tampil publik (toggle sudah tersedia di Pengaturan).
