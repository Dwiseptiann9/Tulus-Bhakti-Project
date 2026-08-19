import os
import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field

from core import (db, hash_password, verify_password, create_access_token, create_refresh_token,
                  set_auth_cookies, get_current_user, require_super, audit, new_id, now_iso,
                  client_ip, ROLE_ADMIN, ROLE_SUPER)
from mailer import send_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_ATTEMPTS = 5
LOCK_MINUTES = 15


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    token: str
    password: str = Field(min_length=8)


class UserCreateBody(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8)
    role: str = ROLE_ADMIN


class UserUpdateBody(BaseModel):
    name: str | None = None
    role: str | None = None
    active: bool | None = None
    password: str | None = None


def public_user(u: dict) -> dict:
    return {"id": u["id"], "email": u["email"], "name": u["name"], "role": u["role"],
            "active": u.get("active", True), "created_at": u.get("created_at")}


@router.post("/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower()
    # Per-IP and per-email counters: the ingress rewrites x-forwarded-for, so the
    # per-email counter is the one that reliably stops brute force.
    identifiers = [f"{client_ip(request)}:{email}", f"email:{email}"]
    async for rec in db.login_attempts.find({"identifier": {"$in": identifiers}}):
        if rec.get("count", 0) < MAX_ATTEMPTS:
            continue
        locked_until = datetime.fromisoformat(rec["last_at"]) + timedelta(minutes=LOCK_MINUTES)
        if datetime.now(timezone.utc) < locked_until:
            raise HTTPException(status_code=429, detail="Terlalu banyak percobaan. Coba lagi dalam 15 menit.")
        await db.login_attempts.delete_one({"identifier": rec["identifier"]})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]) or not user.get("active", True):
        for ident in identifiers:
            await db.login_attempts.update_one(
                {"identifier": ident},
                {"$inc": {"count": 1}, "$set": {"last_at": now_iso()}}, upsert=True)
        raise HTTPException(status_code=401, detail="Email atau kata sandi salah")

    await db.login_attempts.delete_many({"identifier": {"$in": identifiers}})
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    await audit(user, "login")
    return {"user": public_user(user), "access_token": access}


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@router.post("/forgot-password")
async def forgot_password(body: ForgotBody):
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": user["id"], "used": False,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)})
        base = os.environ.get("FRONTEND_URL", "").rstrip("/")
        link = f"{base}/admin/reset-password?token={token}"
        try:
            await send_reset_email(user["email"], user["name"], link)
        except HTTPException:
            pass
    return {"ok": True, "message": "Jika email terdaftar, tautan telah dikirim."}


@router.post("/reset-password")
async def reset_password(body: ResetBody):
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Token tidak valid atau sudah dipakai")
    expires = rec["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Token kedaluwarsa")
    await db.users.update_one({"id": rec["user_id"]},
                              {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"ok": True}


@router.get("/users")
async def list_users(user: dict = Depends(require_super)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users


@router.post("/users")
async def create_user(body: UserCreateBody, user: dict = Depends(require_super)):
    if body.role not in (ROLE_ADMIN, ROLE_SUPER):
        raise HTTPException(status_code=400, detail="Peran tidak valid")
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    doc = {"id": new_id(), "email": body.email.lower(), "name": body.name,
           "password_hash": hash_password(body.password), "role": body.role,
           "active": True, "created_at": now_iso()}
    await db.users.insert_one(doc)
    await audit(user, "buat_akun", doc["id"], body.email.lower())
    return public_user(doc)


@router.put("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdateBody, user: dict = Depends(require_super)):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")
    updates = {}
    if body.name:
        updates["name"] = body.name
    if body.role in (ROLE_ADMIN, ROLE_SUPER):
        updates["role"] = body.role
    if body.active is not None:
        if target["id"] == user["id"] and body.active is False:
            raise HTTPException(status_code=400, detail="Tidak bisa menonaktifkan akun sendiri")
        updates["active"] = body.active
    if body.password:
        if len(body.password) < 8:
            raise HTTPException(status_code=400, detail="Kata sandi minimal 8 karakter")
        updates["password_hash"] = hash_password(body.password)
    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})
        await audit(user, "ubah_akun", user_id, ",".join(updates.keys()))
    fresh = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return fresh
