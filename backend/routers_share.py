import io
import os
import textwrap
from html import escape

from fastapi import APIRouter, HTTPException, Response
from PIL import Image, ImageDraw, ImageFont

from core import db

router = APIRouter(tags=["share"])

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-{style}.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans{dash}{style}.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans{style}.ttf",
]

THEMES = {
    "netral": ("#1A2F24", "#C85A40"),
    "idul_fitri": ("#0C231A", "#D4A017"),
    "idul_adha": ("#2A1D12", "#C8A46A"),
    "kemerdekaan": ("#221414", "#C1121F"),
    # legacy keys
    "lebaran": ("#0C231A", "#D4A017"),
    "agustus17": ("#221414", "#C1121F"),
}


def _font(size: int, bold: bool = False):
    for tpl in FONT_CANDIDATES:
        path = tpl.format(style="Bold" if bold else "Regular", dash="-" if bold else "")
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
        alt = tpl.format(style="Bold" if bold else "", dash="-" if bold else "")
        if os.path.exists(alt):
            return ImageFont.truetype(alt, size)
    return ImageFont.load_default()


def rupiah(n: int) -> str:
    return "Rp " + f"{int(n or 0):,}".replace(",", ".")


async def _brand():
    settings = await db.settings.find_one({"key": "site"}) or {}
    theme = settings.get("season_theme", "netral")
    bg, accent = THEMES.get(theme, THEMES["netral"])
    return settings.get("site_name", "Portal Desa Digital"), bg, accent


def _render_card(site_name: str, bg: str, accent: str, label: str, title: str, rows) -> bytes:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 14, H], fill=accent)

    d.text((70, 62), site_name.upper()[:48], font=_font(24, True), fill="#FFFFFFAA")
    d.text((70, 104), label.upper(), font=_font(22, True), fill=accent)

    y = 168
    title_font = _font(58, True)
    for line in textwrap.wrap(title, width=30)[:4]:
        d.text((70, y), line, font=title_font, fill="#FFFFFF")
        y += 72

    if rows:
        y = max(y + 24, 420)
        d.line([(70, y - 28), (W - 70, y - 28)], fill="#FFFFFF33", width=2)
        col_w = (W - 140) // max(len(rows), 1)
        for i, (label_txt, value_txt, highlight) in enumerate(rows):
            x = 70 + i * col_w
            d.text((x, y), label_txt.upper(), font=_font(22, True), fill="#FFFFFF99")
            d.text((x, y + 36), value_txt, font=_font(40, True), fill=accent if highlight else "#FFFFFF")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _png(data: bytes) -> Response:
    return Response(content=data, media_type="image/png",
                    headers={"Cache-Control": "public, max-age=3600"})


@router.get("/og/news/{slug}.png")
async def og_news(slug: str):
    item = await db.news.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Berita tidak ditemukan")
    site_name, bg, accent = await _brand()
    label = "Kegiatan" if item.get("category") == "kegiatan" else "Berita"
    rows = [("Tanggal", item.get("event_date") or "-", False)]
    return _png(_render_card(site_name, bg, accent, label, item["title_id"], rows))


@router.get("/og/finance/{report_id}.png")
async def og_finance(report_id: str):
    r = await db.finance.find_one({"id": report_id, "status": "terbit"}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    site_name, bg, accent = await _brand()
    rows = [
        ("Total Masuk", rupiah(r.get("total_in")), False),
        ("Total Keluar", rupiah(r.get("total_out")), False),
        ("Saldo", rupiah(r.get("balance")), True),
    ]
    return _png(_render_card(site_name, bg, accent, "Laporan Keuangan", r["title_id"], rows))


def _landing(title: str, description: str, image_url: str, target_url: str) -> Response:
    html = f"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"/>
<title>{escape(title)}</title>
<meta name="description" content="{escape(description)}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="{escape(title)}"/>
<meta property="og:description" content="{escape(description)}"/>
<meta property="og:image" content="{escape(image_url)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="{escape(target_url)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta http-equiv="refresh" content="0;url={escape(target_url)}"/>
</head><body style="font-family:sans-serif;padding:32px">
<p>Membuka halaman… <a href="{escape(target_url)}">{escape(title)}</a></p>
</body></html>"""
    return Response(content=html, media_type="text/html",
                    headers={"Cache-Control": "public, max-age=600"})


def _base() -> str:
    return os.environ.get("FRONTEND_URL", "").rstrip("/")


def _api_base() -> str:
    return f"{_base()}/api"


@router.get("/share/berita/{slug}")
async def share_news(slug: str):
    item = await db.news.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Berita tidak ditemukan")
    desc = (item.get("excerpt_id") or item.get("body_id") or "")[:180]
    return _landing(item["title_id"], desc, f"{_api_base()}/og/news/{slug}.png",
                    f"{_base()}/berita/{slug}")


@router.get("/share/keuangan/{report_id}")
async def share_finance(report_id: str):
    r = await db.finance.find_one({"id": report_id, "status": "terbit"}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    desc = (f"Total masuk {rupiah(r.get('total_in'))} · total keluar {rupiah(r.get('total_out'))} · "
            f"saldo {rupiah(r.get('balance'))}.")
    return _landing(r["title_id"], desc, f"{_api_base()}/og/finance/{report_id}.png",
                    f"{_base()}/keuangan/{report_id}")
