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

## Backlog
- P0: tidak ada yang terbuka.
- P1: pengujian UI mendalam (CRUD via UI, lightbox, submit form kontak), unggah nota dengan blur (bukan hanya blok hitam), pagination berita bila konten bertambah.
- P2: notifikasi email ke semua admin (bukan hanya satu contact_email), ekspor PDF server-side ber-branding, cache gambar/CDN, halaman 404 khusus.

## Next tasks
1. Ganti email kontak seed (`delivered@resend.dev`) dengan email asli pengurus.
2. Tentukan Super Admin utama + penggantinya, lalu buat akunnya di /admin/akun.
3. Putuskan apakah jumlah KK/jiwa tampil publik (toggle sudah tersedia di Pengaturan).
