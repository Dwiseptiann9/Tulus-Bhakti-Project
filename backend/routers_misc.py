import random
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import (APIRouter, Depends, File, Form, HTTPException, Query, Request,
                     Response, UploadFile)
from pydantic import BaseModel, EmailStr, Field

from core import (db, require_admin, require_super, audit, new_id, now_iso, client_ip)
from mailer import send_new_message_notice
from storage import APP_NAME, put_object, get_object, to_webp

router = APIRouter(tags=["umum"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
# Logo & sponsor harus tetap transparan (tanpa latar hitam), banner dibiarkan besar.
ALPHA_KINDS = {"logo", "sponsor", "support"}
BIG_KINDS = {"banner"}


# ---------- Upload & serve berkas ----------
@router.post("/admin/upload")
async def upload_file(file: UploadFile = File(...), kind: str = Form("umum"),
                      censored: bool = Form(False), user: dict = Depends(require_admin)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Hanya gambar JPG/PNG/WEBP yang diizinkan")
    raw = await file.read()
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran berkas maksimal 12MB")
    if kind == "nota" and not censored:
        raise HTTPException(status_code=400,
                            detail="Nota harus disensor dan dikonfirmasi sebelum diunggah")
    try:
        keep_alpha = kind in ALPHA_KINDS
        if kind in BIG_KINDS:
            data = to_webp(raw, max_side=2200, target_kb=550)
        else:
            data = to_webp(raw, keep_alpha=keep_alpha)
    except Exception:
        raise HTTPException(status_code=400, detail="Gambar tidak dapat diproses")
    file_id = new_id()
    path = f"{APP_NAME}/uploads/{kind}/{file_id}.webp"
    try:
        result = put_object(path, data, "image/webp")
    except Exception:
        raise HTTPException(status_code=502, detail="Gagal mengunggah ke penyimpanan. Coba lagi.")
    doc = {"id": file_id, "storage_path": result["path"], "kind": kind,
           "original_filename": file.filename, "content_type": "image/webp",
           "size": len(data), "censored": censored, "is_deleted": False,
           "uploaded_by": user["name"], "created_at": now_iso()}
    await db.files.insert_one(doc)
    await audit(user, "unggah_berkas", file_id, f"{kind} / {file.filename}")
    return {"file_id": file_id, "size": len(data), "kind": kind}


@router.get("/files/{file_id}")
async def serve_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Berkas tidak ditemukan")
    try:
        data, content_type = get_object(record["storage_path"])
    except Exception:
        raise HTTPException(status_code=404, detail="Berkas tidak tersedia")
    return Response(content=data, media_type=record.get("content_type", content_type),
                    headers={"Cache-Control": "public, max-age=86400"})


# ---------- Pengaturan situs ----------
class SettingsBody(BaseModel):
    site_name: str = Field(min_length=2, max_length=90)
    tagline_id: Optional[str] = None
    tagline_en: Optional[str] = None
    season_theme: str = Field(default="netral", pattern="^(netral|idul_fitri|idul_adha|kemerdekaan)$")
    logo_file_ids: list[str] = []
    banner_file_ids: list[str] = []
    banner_interval: int = Field(default=6, ge=3, le=60)
    org_names: list[str] = []
    show_population: bool = True
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    instagram: Optional[str] = None
    tiktok: Optional[str] = None
    youtube: Optional[str] = None
    whatsapp: Optional[str] = None


LEGACY_THEMES = {"lebaran": "idul_fitri", "agustus17": "kemerdekaan"}


@router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"key": "site"}, {"_id": 0})
    if not doc:
        return {"key": "site", "site_name": "Portal Desa Digital", "season_theme": "netral"}
    doc["season_theme"] = LEGACY_THEMES.get(doc.get("season_theme"), doc.get("season_theme") or "netral")
    return doc


@router.put("/admin/settings")
async def update_settings(body: SettingsBody, user: dict = Depends(require_super)):
    updates = body.model_dump()
    updates["updated_at"] = now_iso()
    await db.settings.update_one({"key": "site"}, {"$set": updates}, upsert=True)
    await audit(user, "ubah_pengaturan", "site", body.season_theme)
    return await db.settings.find_one({"key": "site"}, {"_id": 0})


# ---------- Sponsor & Dukungan ----------
class PartnerBody(BaseModel):
    name: str = Field(min_length=2, max_length=90)
    type: str = Field(pattern="^(sponsor|support)$")
    logo_file_id: Optional[str] = None
    url: Optional[str] = None
    note_id: Optional[str] = None
    note_en: Optional[str] = None
    order: int = 0


@router.get("/partners")
async def list_partners():
    return await db.partners.find({}, {"_id": 0}).sort([("type", 1), ("order", 1)]).to_list(200)


@router.post("/admin/partners")
async def create_partner(body: PartnerBody, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "updated_at": now_iso()})
    await db.partners.insert_one(doc)
    await audit(user, "buat_partner", doc["id"], f"{body.type} / {body.name}")
    doc.pop("_id", None)
    return doc


@router.put("/admin/partners/{partner_id}")
async def update_partner(partner_id: str, body: PartnerBody, user: dict = Depends(require_admin)):
    updates = body.model_dump()
    updates["updated_at"] = now_iso()
    res = await db.partners.update_one({"id": partner_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    await audit(user, "ubah_partner", partner_id, body.name)
    return await db.partners.find_one({"id": partner_id}, {"_id": 0})


@router.delete("/admin/partners/{partner_id}")
async def delete_partner(partner_id: str, user: dict = Depends(require_admin)):
    await db.partners.delete_one({"id": partner_id})
    await audit(user, "hapus_partner", partner_id)
    return {"ok": True}


# ---------- Captcha + Hubungi Kami ----------
@router.get("/captcha")
async def get_captcha():
    a, b = random.randint(2, 9), random.randint(2, 9)
    cid = new_id()
    await db.captchas.insert_one({"id": cid, "answer": a + b,
                                  "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15)})
    return {"captcha_id": cid, "question": f"{a} + {b}"}


class MessageBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=25)
    subject: str = Field(min_length=3, max_length=140)
    message: str = Field(min_length=10, max_length=2000)
    captcha_id: str
    captcha_answer: int


@router.post("/messages")
async def create_message(body: MessageBody, request: Request):
    ip = client_ip(request)
    since = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    recent = await db.messages.count_documents({"ip": ip, "created_at": {"$gte": since}})
    if recent >= 5:
        raise HTTPException(status_code=429,
                            detail="Terlalu banyak pesan dari perangkat ini. Coba lagi nanti.")
    captcha = await db.captchas.find_one({"id": body.captcha_id})
    if not captcha or captcha["answer"] != body.captcha_answer:
        raise HTTPException(status_code=400, detail="Jawaban captcha salah")
    await db.captchas.delete_one({"id": body.captcha_id})
    doc = body.model_dump(exclude={"captcha_id", "captcha_answer"})
    doc.update({"id": new_id(), "ip": ip, "read": False, "created_at": now_iso()})
    await db.messages.insert_one(doc)
    settings = await db.settings.find_one({"key": "site"}) or {}
    notify_to = settings.get("contact_email")
    if notify_to:
        try:
            await send_new_message_notice(notify_to, body.name, body.subject)
        except HTTPException:
            pass
    return {"ok": True, "message": "Pesan Anda telah dikirim."}


@router.get("/admin/messages")
async def list_messages(user: dict = Depends(require_admin)):
    return await db.messages.find({}, {"_id": 0, "ip": 0}).sort("created_at", -1).to_list(300)


@router.put("/admin/messages/{message_id}/read")
async def mark_read(message_id: str, user: dict = Depends(require_admin)):
    await db.messages.update_one({"id": message_id}, {"$set": {"read": True}})
    return {"ok": True}


@router.delete("/admin/messages/{message_id}")
async def delete_message(message_id: str, user: dict = Depends(require_admin)):
    await db.messages.delete_one({"id": message_id})
    await audit(user, "hapus_pesan", message_id)
    return {"ok": True}


# ---------- Audit log & dashboard ----------
@router.get("/admin/audit")
async def list_audit(limit: int = Query(100, le=500), user: dict = Depends(require_admin)):
    return await db.audit_logs.find({}, {"_id": 0}).sort("at", -1).to_list(limit)


@router.get("/admin/stats")
async def dashboard_stats(user: dict = Depends(require_admin)):
    return {
        "news": await db.news.count_documents({}),
        "news_published": await db.news.count_documents({"published": True}),
        "albums": await db.albums.count_documents({}),
        "photos": await db.photos.count_documents({}),
        "members": await db.members.count_documents({}),
        "rwrt": await db.rwrt.count_documents({}),
        "finance_draft": await db.finance.count_documents({"status": "draft"}),
        "finance_pending": await db.finance.count_documents({"status": "menunggu_persetujuan"}),
        "finance_published": await db.finance.count_documents({"status": "terbit"}),
        "messages_unread": await db.messages.count_documents({"read": False}),
    }
