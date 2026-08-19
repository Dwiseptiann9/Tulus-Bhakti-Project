from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core import db, require_admin, require_super, audit, new_id, now_iso

router = APIRouter(tags=["keuangan"])

DRAFT, PENDING, PUBLISHED = "draft", "menunggu_persetujuan", "terbit"


class ItemBody(BaseModel):
    type: str = Field(pattern="^(masuk|keluar)$")
    description: str = Field(min_length=2, max_length=200)
    amount: int = Field(gt=0)
    date: Optional[str] = None
    receipt_file_id: Optional[str] = None
    receipt_public: bool = True


class ReportBody(BaseModel):
    title_id: str = Field(min_length=3, max_length=160)
    title_en: Optional[str] = None
    event_date: Optional[str] = None
    description_id: Optional[str] = None
    description_en: Optional[str] = None
    items: List[ItemBody] = []
    revision_reason: Optional[str] = None


def recompute(doc: dict) -> dict:
    total_in = sum(i["amount"] for i in doc.get("items", []) if i["type"] == "masuk")
    total_out = sum(i["amount"] for i in doc.get("items", []) if i["type"] == "keluar")
    doc["total_in"] = total_in
    doc["total_out"] = total_out
    doc["balance"] = total_in - total_out
    return doc


def strip_private(doc: dict) -> dict:
    for item in doc.get("items", []):
        if not item.get("receipt_public", True):
            item["receipt_file_id"] = None
            item["receipt_hidden"] = True
    return doc


@router.get("/finance")
async def list_reports():
    reports = await db.finance.find({"status": PUBLISHED},
                                    {"_id": 0, "items": 0}).sort("event_date", -1).to_list(200)
    return reports


@router.get("/finance/{report_id}")
async def get_report(report_id: str):
    doc = await db.finance.find_one({"id": report_id, "status": PUBLISHED}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan atau belum terbit")
    return strip_private(doc)


@router.get("/admin/finance")
async def admin_list_reports(user: dict = Depends(require_admin)):
    return await db.finance.find({}, {"_id": 0}).sort("updated_at", -1).to_list(300)


@router.get("/admin/finance/{report_id}")
async def admin_get_report(report_id: str, user: dict = Depends(require_admin)):
    doc = await db.finance.find_one({"id": report_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return doc


@router.post("/admin/finance")
async def create_report(body: ReportBody, user: dict = Depends(require_admin)):
    doc = body.model_dump(exclude={"revision_reason"})
    doc.update({"id": new_id(), "status": DRAFT, "created_by": user["name"],
                "created_at": now_iso(), "updated_at": now_iso(),
                "published_at": None, "revisions": []})
    recompute(doc)
    await db.finance.insert_one(doc)
    await audit(user, "buat_laporan_keuangan", doc["id"], body.title_id)
    doc.pop("_id", None)
    return doc


@router.put("/admin/finance/{report_id}")
async def update_report(report_id: str, body: ReportBody, user: dict = Depends(require_admin)):
    doc = await db.finance.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    if doc["status"] == PUBLISHED and not (body.revision_reason or "").strip():
        raise HTTPException(status_code=400,
                            detail="Alasan revisi wajib diisi untuk laporan yang sudah terbit")
    updates = body.model_dump(exclude={"revision_reason"})
    updates["updated_at"] = now_iso()
    recompute(updates)
    ops = {"$set": updates}
    if doc["status"] == PUBLISHED:
        await db.finance_versions.insert_one({
            "id": new_id(), "report_id": report_id, "snapshot":
                {k: v for k, v in doc.items() if k != "_id"}, "at": now_iso(),
            "by": user["name"], "reason": body.revision_reason})
        ops["$push"] = {"revisions": {"at": now_iso(), "by": user["name"],
                                      "reason": body.revision_reason.strip()}}
    await db.finance.update_one({"id": report_id}, ops)
    await audit(user, "ubah_laporan_keuangan", report_id, body.revision_reason or body.title_id)
    return await db.finance.find_one({"id": report_id}, {"_id": 0})


@router.delete("/admin/finance/{report_id}")
async def delete_report(report_id: str, user: dict = Depends(require_super)):
    await db.finance.delete_one({"id": report_id})
    await audit(user, "hapus_laporan_keuangan", report_id)
    return {"ok": True}


@router.post("/admin/finance/{report_id}/submit")
async def submit_report(report_id: str, user: dict = Depends(require_admin)):
    doc = await db.finance.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    if not doc.get("items"):
        raise HTTPException(status_code=400, detail="Laporan kosong tidak dapat diajukan")
    await db.finance.update_one({"id": report_id}, {"$set": {
        "status": PENDING, "submitted_at": now_iso(), "submitted_by": user["name"],
        "updated_at": now_iso()}})
    await audit(user, "ajukan_laporan", report_id, doc["title_id"])
    return await db.finance.find_one({"id": report_id}, {"_id": 0})


@router.post("/admin/finance/{report_id}/approve")
async def approve_report(report_id: str, user: dict = Depends(require_super)):
    doc = await db.finance.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    if doc["status"] != PENDING:
        raise HTTPException(status_code=400, detail="Hanya laporan yang diajukan dapat disetujui")
    await db.finance.update_one({"id": report_id}, {"$set": {
        "status": PUBLISHED, "published_at": now_iso(), "approved_by": user["name"],
        "updated_at": now_iso()}})
    await audit(user, "setujui_dan_terbitkan_laporan", report_id, doc["title_id"])
    return await db.finance.find_one({"id": report_id}, {"_id": 0})


class RejectBody(BaseModel):
    reason: str = Field(min_length=3, max_length=300)


@router.post("/admin/finance/{report_id}/reject")
async def reject_report(report_id: str, body: RejectBody, user: dict = Depends(require_super)):
    doc = await db.finance.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    await db.finance.update_one({"id": report_id}, {"$set": {
        "status": DRAFT, "reject_reason": body.reason, "updated_at": now_iso()}})
    await audit(user, "tolak_laporan", report_id, body.reason)
    return await db.finance.find_one({"id": report_id}, {"_id": 0})


@router.post("/admin/finance/{report_id}/unpublish")
async def unpublish_report(report_id: str, body: RejectBody, user: dict = Depends(require_super)):
    doc = await db.finance.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    await db.finance.update_one({"id": report_id}, {"$set": {
        "status": DRAFT, "unpublish_reason": body.reason, "updated_at": now_iso()}})
    await audit(user, "tarik_laporan", report_id, body.reason)
    return await db.finance.find_one({"id": report_id}, {"_id": 0})


class ReceiptVisibilityBody(BaseModel):
    receipt_public: bool


@router.put("/admin/finance/{report_id}/items/{item_index}/receipt")
async def set_receipt_visibility(report_id: str, item_index: int, body: ReceiptVisibilityBody,
                                 user: dict = Depends(require_super)):
    doc = await db.finance.find_one({"id": report_id})
    if not doc or item_index >= len(doc.get("items", [])):
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")
    await db.finance.update_one({"id": report_id}, {"$set": {
        f"items.{item_index}.receipt_public": body.receipt_public, "updated_at": now_iso()}})
    await audit(user, "ubah_visibilitas_nota", report_id,
                f"item {item_index} -> {'publik' if body.receipt_public else 'disembunyikan'}")
    return await db.finance.find_one({"id": report_id}, {"_id": 0})


@router.get("/finance/{report_id}/versions")
async def report_versions(report_id: str):
    versions = await db.finance_versions.find({"report_id": report_id},
                                              {"_id": 0}).sort("at", -1).to_list(50)
    return versions
