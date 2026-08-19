import logging
import os

from fastapi import APIRouter, FastAPI, Response
from starlette.middleware.cors import CORSMiddleware

from core import (db, hash_password, verify_password, new_id, now_iso, ROLE_ADMIN, ROLE_SUPER)
import routers_auth
import routers_content
import routers_finance
import routers_misc
from storage import init_storage

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Portal Desa Digital API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Portal Desa Digital API"}


api_router.include_router(routers_auth.router)
api_router.include_router(routers_content.router)
api_router.include_router(routers_finance.router)
api_router.include_router(routers_misc.router)
app.include_router(api_router)

origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/sitemap.xml")
async def sitemap():
    base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    urls = ["/", "/berita", "/galeri", "/keuangan", "/tentang", "/struktur", "/rw-rt", "/kontak"]
    news = await db.news.find({"published": True}, {"_id": 0, "slug": 1}).to_list(500)
    urls += [f"/berita/{n['slug']}" for n in news]
    body = "".join(f"<url><loc>{base}{u}</loc></url>" for u in urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'
    return Response(content=xml, media_type="application/xml")


async def seed_user(email_key: str, pwd_key: str, name: str, role: str):
    email = (os.environ.get(email_key) or "").lower()
    password = os.environ.get(pwd_key)
    if not email or not password:
        return
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({"id": new_id(), "email": email, "name": name,
                                   "password_hash": hash_password(password), "role": role,
                                   "active": True, "created_at": now_iso()})
        logger.info(f"Seeded {role}: {email}")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email},
                                  {"$set": {"password_hash": hash_password(password),
                                            "role": role, "active": True}})


async def seed_content():
    if not await db.settings.find_one({"key": "site"}):
        await db.settings.insert_one({
            "key": "site", "site_name": "Karang Taruna & Forum Desa Sukamaju",
            "tagline_id": "Portal informasi, kegiatan, dan keuangan yang terbuka",
            "tagline_en": "Open portal for village news, activities and finances",
            "season_theme": "netral", "logo_file_ids": [],
            "org_names": ["Karang Taruna Sukamaju", "Forum Desa Sukamaju"],
            "show_population": True, "contact_email": "delivered@resend.dev",
            "contact_phone": "0812-0000-0000",
            "address": "Jl. Balai Desa No. 1, Sukamaju",
            "instagram": "karangtaruna.sukamaju", "whatsapp": "6281200000000",
            "updated_at": now_iso()})
    if not await db.pages.find_one({"key": "profile"}):
        await db.pages.insert_one({
            "key": "profile",
            "about_id": "Karang Taruna Sukamaju bersama Forum Desa adalah wadah kegiatan pemuda dan musyawarah warga. Kami mengelola kegiatan sosial, olahraga, keagamaan, dan pelaporan keuangan kegiatan secara terbuka.",
            "about_en": "Sukamaju Youth Organization together with the Village Forum is a place for youth activities and community deliberation. We run social, sports and religious activities with open financial reporting.",
            "vision_id": "Pemuda desa yang aktif, mandiri, dan dapat dipercaya.",
            "vision_en": "Active, independent and trustworthy village youth.",
            "mission_id": ["Menyelenggarakan kegiatan yang bermanfaat bagi warga",
                           "Mengelola dana kegiatan secara transparan dan dapat diaudit",
                           "Mendokumentasikan setiap kegiatan desa"],
            "mission_en": ["Run activities that benefit residents",
                           "Manage activity funds transparently and auditably",
                           "Document every village activity"],
            "address": "Jl. Balai Desa No. 1, Sukamaju",
            "email": "delivered@resend.dev", "phone": "0812-0000-0000",
            "updated_at": now_iso()})
    if await db.news.count_documents({}) == 0:
        samples = [
            {"title_id": "Kerja Bakti Bersih Desa Menyambut Musim Hujan",
             "title_en": "Community Clean-Up Ahead of the Rainy Season",
             "excerpt_id": "Warga dari 6 RW bergotong royong membersihkan saluran air.",
             "excerpt_en": "Residents from 6 neighbourhoods cleaned the drainage together.",
             "body_id": "Kegiatan kerja bakti dilaksanakan pada Sabtu pagi dan diikuti lebih dari 80 warga. Fokus utama adalah pembersihan saluran air di RW 02 dan RW 04 yang sering tersumbat saat hujan deras. Konsumsi disediakan oleh ibu-ibu PKK dan seluruh pengeluaran dicatat dalam laporan keuangan kegiatan.",
             "body_en": "The clean-up took place on Saturday morning with more than 80 residents. The focus was the drainage in RW 02 and RW 04 which often clogs during heavy rain. All expenses were recorded in the activity financial report.",
             "category": "kegiatan", "event_date": "2026-05-16"},
            {"title_id": "Turnamen Bola Voli Antar RT Resmi Dibuka",
             "title_en": "Inter-RT Volleyball Tournament Opens",
             "excerpt_id": "Dua belas tim RT berlaga selama dua pekan di lapangan desa.",
             "excerpt_en": "Twelve RT teams compete for two weeks at the village court.",
             "body_id": "Turnamen bola voli antar RT dibuka oleh Ketua Forum Desa. Sebanyak 12 tim mendaftar dan pertandingan digelar setiap sore. Biaya bola, net, dan hadiah didanai dari iuran peserta serta donasi warga, seluruhnya tercatat pada laporan keuangan.",
             "body_en": "The inter-RT volleyball tournament was opened by the head of the Village Forum. Twelve teams registered and matches are held every afternoon.",
             "category": "kegiatan", "event_date": "2026-06-20"},
            {"title_id": "Pendataan Ulang Data RW dan RT Tahun 2026",
             "excerpt_id": "Data pengurus RW/RT diperbarui agar warga mudah menghubungi.",
             "body_id": "Sekretariat Forum Desa memperbarui data pengurus RW dan RT. Setiap perubahan dicatat dengan tanggal pembaruan sehingga warga tahu kapan data terakhir diverifikasi. Warga dapat melaporkan koreksi melalui halaman Hubungi Kami.",
             "category": "berita", "event_date": "2026-04-02"},
        ]
        for s in samples:
            date_sort = s["event_date"]
            slug = routers_content.slugify(s["title_id"]) + "-" + new_id()[:6]
            await db.news.insert_one({**s, "id": new_id(), "slug": slug, "published": True,
                                      "cover_file_id": None, "date_sort": date_sort,
                                      "year": int(date_sort[:4]), "author": "Sekretariat",
                                      "created_at": now_iso(), "updated_at": now_iso()})
    if await db.members.count_documents({}) == 0:
        members = [("Rangga Prasetyo", "Ketua", "Chairperson", 1),
                   ("Dewi Lestari", "Sekretaris", "Secretary", 2),
                   ("Bagus Hartono", "Bendahara", "Treasurer", 3),
                   ("Nurul Aini", "Koordinator Acara", "Event Coordinator", 4),
                   ("Yoga Mahendra", "Koordinator Olahraga", "Sports Coordinator", 5)]
        for name, pos_id, pos_en, order in members:
            await db.members.insert_one({"id": new_id(), "name": name, "position_id": pos_id,
                                         "position_en": pos_en, "period": "2025-2028",
                                         "order": order, "photo_file_id": None,
                                         "updated_at": now_iso()})
        await db.meta.update_one({"key": "members"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    if await db.rwrt.count_documents({}) == 0:
        rows = [("01", "01", "Sutrisno", "0812-1111-0001", 62, 214),
                ("01", "02", "Marlina", "0812-1111-0002", 55, 190),
                ("02", "01", "Hadi Winarto", "0812-1111-0003", 71, 248),
                ("02", "02", "Sri Wahyuni", "0812-1111-0004", 48, 165),
                ("03", "01", "Bambang Setyo", "0812-1111-0005", 66, 233)]
        for rw, rt, head, phone, fam, res in rows:
            await db.rwrt.insert_one({"id": new_id(), "rw": rw, "rt": rt, "head_name": head,
                                      "phone": phone, "families": fam, "residents": res,
                                      "note_id": None, "note_en": None, "updated_at": now_iso()})
        await db.meta.update_one({"key": "rwrt"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    if await db.faq.count_documents({}) == 0:
        faqs = [("Bagaimana cara ikut kegiatan Karang Taruna?",
                 "How can I join the youth organization activities?",
                 "Hubungi pengurus melalui halaman Hubungi Kami atau datang ke sekretariat setiap Sabtu sore.",
                 "Contact us through the Contact page or visit the secretariat every Saturday afternoon.", 1),
                ("Apakah laporan keuangan kegiatan bisa dilihat warga?",
                 "Can residents see the activity financial reports?",
                 "Ya. Setiap laporan yang sudah disetujui Super Admin tampil publik lengkap dengan rincian dan nota.",
                 "Yes. Every report approved by the Super Admin is public with details and receipts.", 2)]
        for q_id, q_en, a_id, a_en, order in faqs:
            await db.faq.insert_one({"id": new_id(), "question_id": q_id, "question_en": q_en,
                                     "answer_id": a_id, "answer_en": a_en, "order": order,
                                     "updated_at": now_iso()})
    if await db.finance.count_documents({}) == 0:
        items = [{"type": "masuk", "description": "Iuran peserta turnamen (12 tim)", "amount": 3600000,
                  "date": "2026-06-10", "receipt_file_id": None, "receipt_public": True},
                 {"type": "masuk", "description": "Donasi warga RW 02", "amount": 1500000,
                  "date": "2026-06-12", "receipt_file_id": None, "receipt_public": True},
                 {"type": "keluar", "description": "Pembelian bola voli dan net", "amount": 1850000,
                  "date": "2026-06-14", "receipt_file_id": None, "receipt_public": True},
                 {"type": "keluar", "description": "Konsumsi panitia dan peserta", "amount": 1240000,
                  "date": "2026-06-20", "receipt_file_id": None, "receipt_public": True},
                 {"type": "keluar", "description": "Hadiah juara 1, 2, dan 3", "amount": 2000000,
                  "date": "2026-06-28", "receipt_file_id": None, "receipt_public": True}]
        doc = {"id": new_id(), "title_id": "Laporan Keuangan Turnamen Bola Voli Antar RT 2026",
               "title_en": "Financial Report: Inter-RT Volleyball Tournament 2026",
               "event_date": "2026-06-20",
               "description_id": "Rincian penerimaan dan pengeluaran turnamen bola voli antar RT.",
               "description_en": "Income and expense details of the inter-RT volleyball tournament.",
               "items": items, "status": "terbit", "created_by": "Bendahara",
               "approved_by": "Super Admin", "created_at": now_iso(), "updated_at": now_iso(),
               "published_at": now_iso(), "revisions": []}
        routers_finance.recompute(doc)
        await db.finance.insert_one(doc)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.news.create_index("slug", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.captchas.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await seed_user("SUPERADMIN_EMAIL", "SUPERADMIN_PASSWORD", "Super Admin", ROLE_SUPER)
    await seed_user("ADMIN_EMAIL", "ADMIN_PASSWORD", "Admin Konten", ROLE_ADMIN)
    await seed_content()
    try:
        init_storage()
        logger.info("Object storage siap")
    except Exception as e:
        logger.error(f"Storage init gagal: {e}")


@app.on_event("shutdown")
async def shutdown():
    pass
