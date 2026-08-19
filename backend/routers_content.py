import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from core import db, require_admin, audit, new_id, now_iso

router = APIRouter(tags=["konten"])


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:70] or new_id()[:8]


class NewsBody(BaseModel):
    title_id: str = Field(min_length=3, max_length=180)
    title_en: Optional[str] = None
    excerpt_id: Optional[str] = None
    excerpt_en: Optional[str] = None
    body_id: str = Field(min_length=10)
    body_en: Optional[str] = None
    category: str = "berita"
    event_date: Optional[str] = None
    cover_file_id: Optional[str] = None
    published: bool = True


class MemberBody(BaseModel):
    name: str = Field(min_length=2, max_length=90)
    position_id: str = Field(min_length=2, max_length=90)
    position_en: Optional[str] = None
    period: Optional[str] = None
    order: int = 0
    photo_file_id: Optional[str] = None


class RwRtBody(BaseModel):
    rw: str = Field(min_length=1, max_length=10)
    rt: str = Field(min_length=1, max_length=10)
    head_name: str = Field(min_length=2, max_length=90)
    phone: Optional[str] = None
    families: Optional[int] = None
    residents: Optional[int] = None
    note_id: Optional[str] = None
    note_en: Optional[str] = None


class AlbumBody(BaseModel):
    title_id: str = Field(min_length=3, max_length=140)
    title_en: Optional[str] = None
    event_date: Optional[str] = None
    description_id: Optional[str] = None
    description_en: Optional[str] = None
    cover_file_id: Optional[str] = None
    published: bool = True


class FaqBody(BaseModel):
    question_id: str
    question_en: Optional[str] = None
    answer_id: str
    answer_en: Optional[str] = None
    order: int = 0


# ---------- Berita / Kegiatan ----------
@router.get("/news")
async def list_news(q: Optional[str] = None, year: Optional[int] = None,
                    category: Optional[str] = None, include_draft: bool = False,
                    limit: int = Query(50, le=200)):
    query = {} if include_draft else {"published": True}
    if category:
        query["category"] = category
    if year:
        query["year"] = year
    if q:
        query["$or"] = [{"title_id": {"$regex": q, "$options": "i"}},
                        {"title_en": {"$regex": q, "$options": "i"}},
                        {"body_id": {"$regex": q, "$options": "i"}}]
    items = await db.news.find(query, {"_id": 0}).sort("date_sort", -1).to_list(limit)
    return items


@router.get("/news/years")
async def news_years():
    years = await db.news.distinct("year", {"published": True})
    return sorted([y for y in years if y], reverse=True)


@router.get("/news/{slug}")
async def get_news(slug: str):
    item = await db.news.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Berita tidak ditemukan")
    return item


@router.post("/admin/news")
async def create_news(body: NewsBody, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    date_sort = body.event_date or now_iso()[:10]
    doc.update({"id": new_id(), "slug": f"{slugify(body.title_id)}-{new_id()[:6]}",
                "date_sort": date_sort, "year": int(date_sort[:4]),
                "created_at": now_iso(), "updated_at": now_iso(),
                "author": user["name"]})
    await db.news.insert_one(doc)
    await audit(user, "buat_berita", doc["id"], body.title_id)
    doc.pop("_id", None)
    return doc


@router.put("/admin/news/{news_id}")
async def update_news(news_id: str, body: NewsBody, user: dict = Depends(require_admin)):
    updates = body.model_dump()
    date_sort = body.event_date or now_iso()[:10]
    updates.update({"date_sort": date_sort, "year": int(date_sort[:4]), "updated_at": now_iso()})
    res = await db.news.update_one({"id": news_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Berita tidak ditemukan")
    await audit(user, "ubah_berita", news_id, body.title_id)
    return await db.news.find_one({"id": news_id}, {"_id": 0})


@router.delete("/admin/news/{news_id}")
async def delete_news(news_id: str, user: dict = Depends(require_admin)):
    await db.news.delete_one({"id": news_id})
    await audit(user, "hapus_berita", news_id)
    return {"ok": True}


# ---------- Galeri ----------
@router.get("/albums")
async def list_albums(include_draft: bool = False):
    query = {} if include_draft else {"published": True}
    albums = await db.albums.find(query, {"_id": 0}).sort("event_date", -1).to_list(200)
    for a in albums:
        a["photo_count"] = await db.photos.count_documents({"album_id": a["id"]})
    return albums


@router.get("/albums/{album_id}")
async def get_album(album_id: str):
    album = await db.albums.find_one({"id": album_id}, {"_id": 0})
    if not album:
        raise HTTPException(status_code=404, detail="Album tidak ditemukan")
    album["photos"] = await db.photos.find({"album_id": album_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return album


@router.post("/admin/albums")
async def create_album(body: AlbumBody, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "created_at": now_iso(), "updated_at": now_iso()})
    await db.albums.insert_one(doc)
    await audit(user, "buat_album", doc["id"], body.title_id)
    doc.pop("_id", None)
    return doc


@router.put("/admin/albums/{album_id}")
async def update_album(album_id: str, body: AlbumBody, user: dict = Depends(require_admin)):
    updates = body.model_dump()
    updates["updated_at"] = now_iso()
    res = await db.albums.update_one({"id": album_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Album tidak ditemukan")
    await audit(user, "ubah_album", album_id, body.title_id)
    return await db.albums.find_one({"id": album_id}, {"_id": 0})


@router.delete("/admin/albums/{album_id}")
async def delete_album(album_id: str, user: dict = Depends(require_admin)):
    await db.albums.delete_one({"id": album_id})
    await db.photos.delete_many({"album_id": album_id})
    await audit(user, "hapus_album", album_id)
    return {"ok": True}


class PhotoBody(BaseModel):
    album_id: str
    file_id: str
    caption_id: Optional[str] = None
    caption_en: Optional[str] = None


@router.post("/admin/photos")
async def add_photo(body: PhotoBody, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "created_at": now_iso()})
    await db.photos.insert_one(doc)
    await audit(user, "tambah_foto", doc["id"], body.album_id)
    doc.pop("_id", None)
    return doc


@router.delete("/admin/photos/{photo_id}")
async def delete_photo(photo_id: str, user: dict = Depends(require_admin)):
    await db.photos.delete_one({"id": photo_id})
    await audit(user, "hapus_foto", photo_id)
    return {"ok": True}


# ---------- Anggota Karang Taruna ----------
@router.get("/members")
async def list_members():
    return await db.members.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@router.post("/admin/members")
async def create_member(body: MemberBody, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "updated_at": now_iso()})
    await db.members.insert_one(doc)
    await db.meta.update_one({"key": "members"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    await audit(user, "buat_anggota", doc["id"], body.name)
    doc.pop("_id", None)
    return doc


@router.put("/admin/members/{member_id}")
async def update_member(member_id: str, body: MemberBody, user: dict = Depends(require_admin)):
    updates = body.model_dump()
    updates["updated_at"] = now_iso()
    res = await db.members.update_one({"id": member_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")
    await db.meta.update_one({"key": "members"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    await audit(user, "ubah_anggota", member_id, body.name)
    return await db.members.find_one({"id": member_id}, {"_id": 0})


@router.delete("/admin/members/{member_id}")
async def delete_member(member_id: str, user: dict = Depends(require_admin)):
    await db.members.delete_one({"id": member_id})
    await db.meta.update_one({"key": "members"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    await audit(user, "hapus_anggota", member_id)
    return {"ok": True}


# ---------- Data RW/RT ----------
@router.get("/rwrt")
async def list_rwrt():
    rows = await db.rwrt.find({}, {"_id": 0}).sort([("rw", 1), ("rt", 1)]).to_list(500)
    meta = await db.meta.find_one({"key": "rwrt"}, {"_id": 0})
    settings = await db.settings.find_one({"key": "site"}, {"_id": 0}) or {}
    show_population = settings.get("show_population", True)
    if not show_population:
        for r in rows:
            r.pop("families", None)
            r.pop("residents", None)
    return {"rows": rows, "updated_at": (meta or {}).get("updated_at"),
            "show_population": show_population}


@router.post("/admin/rwrt")
async def create_rwrt(body: RwRtBody, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "updated_at": now_iso()})
    await db.rwrt.insert_one(doc)
    await db.meta.update_one({"key": "rwrt"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    await audit(user, "buat_rwrt", doc["id"], f"RW {body.rw} RT {body.rt}")
    doc.pop("_id", None)
    return doc


@router.put("/admin/rwrt/{row_id}")
async def update_rwrt(row_id: str, body: RwRtBody, user: dict = Depends(require_admin)):
    updates = body.model_dump()
    updates["updated_at"] = now_iso()
    res = await db.rwrt.update_one({"id": row_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    await db.meta.update_one({"key": "rwrt"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    await audit(user, "ubah_rwrt", row_id, f"RW {body.rw} RT {body.rt}")
    return await db.rwrt.find_one({"id": row_id}, {"_id": 0})


@router.delete("/admin/rwrt/{row_id}")
async def delete_rwrt(row_id: str, user: dict = Depends(require_admin)):
    await db.rwrt.delete_one({"id": row_id})
    await db.meta.update_one({"key": "rwrt"}, {"$set": {"updated_at": now_iso()}}, upsert=True)
    await audit(user, "hapus_rwrt", row_id)
    return {"ok": True}


# ---------- FAQ ----------
@router.get("/faq")
async def list_faq():
    return await db.faq.find({}, {"_id": 0}).sort("order", 1).to_list(100)


@router.post("/admin/faq")
async def create_faq(body: FaqBody, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc.update({"id": new_id(), "updated_at": now_iso()})
    await db.faq.insert_one(doc)
    await audit(user, "buat_faq", doc["id"])
    doc.pop("_id", None)
    return doc


@router.put("/admin/faq/{faq_id}")
async def update_faq(faq_id: str, body: FaqBody, user: dict = Depends(require_admin)):
    updates = body.model_dump()
    updates["updated_at"] = now_iso()
    await db.faq.update_one({"id": faq_id}, {"$set": updates})
    await audit(user, "ubah_faq", faq_id)
    return await db.faq.find_one({"id": faq_id}, {"_id": 0})


@router.delete("/admin/faq/{faq_id}")
async def delete_faq(faq_id: str, user: dict = Depends(require_admin)):
    await db.faq.delete_one({"id": faq_id})
    await audit(user, "hapus_faq", faq_id)
    return {"ok": True}


# ---------- Profil / Tentang Kami ----------
class ProfileBody(BaseModel):
    about_id: str
    about_en: Optional[str] = None
    vision_id: Optional[str] = None
    vision_en: Optional[str] = None
    mission_id: Optional[List[str]] = None
    mission_en: Optional[List[str]] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


@router.get("/profile")
async def get_profile():
    doc = await db.pages.find_one({"key": "profile"}, {"_id": 0})
    return doc or {}


@router.put("/admin/profile")
async def update_profile(body: ProfileBody, user: dict = Depends(require_admin)):
    updates = body.model_dump()
    updates["updated_at"] = now_iso()
    await db.pages.update_one({"key": "profile"}, {"$set": updates}, upsert=True)
    await audit(user, "ubah_profil")
    return await db.pages.find_one({"key": "profile"}, {"_id": 0})
