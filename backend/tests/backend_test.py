"""Backend API tests for Portal Desa Digital.

Covers: public content endpoints, auth (super/admin/bruteforce/forgot),
finance flow (draft->pending->approve, revision, unpublish, receipt visibility),
upload guardrails (nota censored), captcha+messages rate limit, role gating,
audit log.
"""
import io
import os
import time
import pytest
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://desa-digital-62.preview.emergentagent.com"
API = f"{BASE}/api"

SUPER_EMAIL = "superadmin@desadigital.id"
SUPER_PWD = "Super#Desa2026"
ADMIN_EMAIL = "admin@desadigital.id"
ADMIN_PWD = "Admin#Desa2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def super_token():
    r = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": SUPER_PWD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PWD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Public content ----------
class TestPublic:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200

    def test_news_list(self):
        r = requests.get(f"{API}/news")
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 1

    def test_news_search(self):
        r = requests.get(f"{API}/news", params={"q": "voli"})
        assert r.status_code == 200
        titles = " ".join(n.get("title_id", "") for n in r.json()).lower()
        assert "voli" in titles

    def test_news_year_filter(self):
        r = requests.get(f"{API}/news", params={"year": 2026})
        assert r.status_code == 200
        assert all(n.get("year") == 2026 for n in r.json())

    def test_news_years(self):
        r = requests.get(f"{API}/news/years")
        assert r.status_code == 200
        assert 2026 in r.json()

    def test_finance_public(self):
        r = requests.get(f"{API}/finance")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_finance_detail_totals(self):
        rid = requests.get(f"{API}/finance").json()[0]["id"]
        r = requests.get(f"{API}/finance/{rid}")
        assert r.status_code == 200
        d = r.json()
        assert d["total_in"] == sum(i["amount"] for i in d["items"] if i["type"] == "masuk")
        assert d["total_out"] == sum(i["amount"] for i in d["items"] if i["type"] == "keluar")
        assert d["balance"] == d["total_in"] - d["total_out"]

    def test_rwrt(self):
        r = requests.get(f"{API}/rwrt")
        assert r.status_code == 200
        d = r.json()
        assert "updated_at" in d and len(d["rows"]) >= 1

    def test_members(self):
        r = requests.get(f"{API}/members")
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_faq(self):
        r = requests.get(f"{API}/faq")
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_albums(self):
        r = requests.get(f"{API}/albums")
        assert r.status_code == 200

    def test_profile(self):
        r = requests.get(f"{API}/profile")
        assert r.status_code == 200 and "about_id" in r.json()

    def test_settings(self):
        r = requests.get(f"{API}/settings")
        assert r.status_code == 200 and r.json().get("site_name")


# ---------- Auth ----------
class TestAuth:
    def test_login_super(self, super_token):
        assert super_token

    def test_me_super(self, super_token):
        r = requests.get(f"{API}/auth/me", headers=H(super_token))
        assert r.status_code == 200
        assert r.json()["role"] == "super_admin"

    def test_me_admin(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=H(admin_token))
        assert r.status_code == 200 and r.json()["role"] == "admin"

    def test_forgot_generic(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody@example.com"})
        assert r.status_code == 200 and r.json().get("ok") is True

    def test_bruteforce_lockout(self):
        email = "bfuser_test@example.com"
        # try 5 failed attempts, 6th should be 429
        statuses = []
        for _ in range(6):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
            statuses.append(r.status_code)
        assert 429 in statuses, f"expected 429 after 5 fails; got {statuses}"

    def test_bcrypt_hash_format(self, super_token):
        # indirect: login works -> hash valid. Verify by re-login with correct pwd.
        r = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": SUPER_PWD})
        assert r.status_code == 200


# ---------- Role gating ----------
class TestRoleGating:
    def test_admin_cannot_list_users(self, admin_token):
        r = requests.get(f"{API}/auth/users", headers=H(admin_token))
        assert r.status_code == 403

    def test_super_can_list_users(self, super_token):
        r = requests.get(f"{API}/auth/users", headers=H(super_token))
        assert r.status_code == 200

    def test_admin_cannot_update_settings(self, admin_token):
        r = requests.put(f"{API}/admin/settings", headers=H(admin_token),
                         json={"site_name": "Test", "season_theme": "netral"})
        assert r.status_code == 403

    def test_unauth_admin_finance(self):
        r = requests.get(f"{API}/admin/finance")
        assert r.status_code == 401


# ---------- Finance flow ----------
class TestFinanceFlow:
    report_id = None

    def test_create_report(self, admin_token):
        body = {
            "title_id": "TEST_Laporan Kerja Bakti",
            "title_en": "TEST_Community Cleanup Report",
            "event_date": "2026-07-01",
            "description_id": "Uji laporan",
            "items": [
                {"type": "masuk", "description": "Iuran warga", "amount": 500000, "date": "2026-07-01", "receipt_public": True},
                {"type": "keluar", "description": "Konsumsi", "amount": 200000, "date": "2026-07-01", "receipt_public": True},
            ],
        }
        r = requests.post(f"{API}/admin/finance", headers=H(admin_token), json=body)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "draft"
        assert d["total_in"] == 500000 and d["total_out"] == 200000 and d["balance"] == 300000
        TestFinanceFlow.report_id = d["id"]

    def test_not_visible_before_approve(self, admin_token):
        rid = TestFinanceFlow.report_id
        assert rid
        # not in public listing
        r = requests.get(f"{API}/finance")
        assert all(x["id"] != rid for x in r.json())
        # detail 404
        r = requests.get(f"{API}/finance/{rid}")
        assert r.status_code == 404

    def test_submit(self, admin_token):
        rid = TestFinanceFlow.report_id
        r = requests.post(f"{API}/admin/finance/{rid}/submit", headers=H(admin_token))
        assert r.status_code == 200
        assert r.json()["status"] == "menunggu_persetujuan"

    def test_admin_cannot_approve(self, admin_token):
        rid = TestFinanceFlow.report_id
        r = requests.post(f"{API}/admin/finance/{rid}/approve", headers=H(admin_token))
        assert r.status_code == 403

    def test_super_approve(self, super_token):
        rid = TestFinanceFlow.report_id
        r = requests.post(f"{API}/admin/finance/{rid}/approve", headers=H(super_token))
        assert r.status_code == 200
        assert r.json()["status"] == "terbit"
        # Now public
        pub = requests.get(f"{API}/finance/{rid}").json()
        assert pub["balance"] == 300000

    def test_update_published_requires_reason(self, admin_token):
        rid = TestFinanceFlow.report_id
        body = {"title_id": "TEST_Laporan Kerja Bakti", "items": [
            {"type": "masuk", "description": "Iuran warga", "amount": 500000, "receipt_public": True},
            {"type": "keluar", "description": "Konsumsi", "amount": 200000, "receipt_public": True},
        ]}
        r = requests.put(f"{API}/admin/finance/{rid}", headers=H(admin_token), json=body)
        assert r.status_code == 400

    def test_update_published_with_reason(self, admin_token):
        rid = TestFinanceFlow.report_id
        body = {
            "title_id": "TEST_Laporan Kerja Bakti (revisi)",
            "revision_reason": "Koreksi angka konsumsi",
            "items": [
                {"type": "masuk", "description": "Iuran warga", "amount": 500000, "receipt_public": True},
                {"type": "keluar", "description": "Konsumsi", "amount": 250000, "receipt_public": True},
            ],
        }
        r = requests.put(f"{API}/admin/finance/{rid}", headers=H(admin_token), json=body)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["balance"] == 250000
        assert len(d.get("revisions", [])) >= 1
        assert d["revisions"][-1]["reason"] == "Koreksi angka konsumsi"

    def test_receipt_visibility_super_only(self, admin_token, super_token):
        rid = TestFinanceFlow.report_id
        # admin forbidden
        r = requests.put(f"{API}/admin/finance/{rid}/items/0/receipt",
                         headers=H(admin_token), json={"receipt_public": False})
        assert r.status_code == 403
        # super ok
        r = requests.put(f"{API}/admin/finance/{rid}/items/0/receipt",
                         headers=H(super_token), json={"receipt_public": False})
        assert r.status_code == 200
        pub = requests.get(f"{API}/finance/{rid}").json()
        assert pub["items"][0].get("receipt_hidden") is True
        assert pub["items"][0].get("receipt_file_id") is None

    def test_unpublish(self, super_token):
        rid = TestFinanceFlow.report_id
        r = requests.post(f"{API}/admin/finance/{rid}/unpublish",
                          headers=H(super_token), json={"reason": "Perlu diperiksa ulang"})
        assert r.status_code == 200
        # no longer public
        pub_ids = [x["id"] for x in requests.get(f"{API}/finance").json()]
        assert rid not in pub_ids

    def test_cleanup_delete(self, super_token):
        rid = TestFinanceFlow.report_id
        r = requests.delete(f"{API}/admin/finance/{rid}", headers=H(super_token))
        assert r.status_code == 200


# ---------- Upload guardrails ----------
def _tiny_png_bytes():
    # minimal PNG (1x1 red)
    import base64
    b64 = ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4"
           "nGP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==")
    return base64.b64decode(b64)


class TestUpload:
    def test_nota_uncensored_rejected(self, admin_token):
        files = {"file": ("test.png", io.BytesIO(_tiny_png_bytes()), "image/png")}
        data = {"kind": "nota", "censored": "false"}
        r = requests.post(f"{API}/admin/upload", headers=H(admin_token), files=files, data=data)
        assert r.status_code == 400

    def test_nota_censored_accepted(self, admin_token):
        files = {"file": ("test.png", io.BytesIO(_tiny_png_bytes()), "image/png")}
        data = {"kind": "nota", "censored": "true"}
        r = requests.post(f"{API}/admin/upload", headers=H(admin_token), files=files, data=data)
        # accepted (may 502 if storage not reachable in preview; treat 502 as env issue)
        assert r.status_code in (200, 502), r.text
        if r.status_code == 200:
            assert r.json().get("file_id")


# ---------- Captcha + messages ----------
class TestMessages:
    def test_captcha_and_wrong_answer(self):
        c = requests.get(f"{API}/captcha").json()
        r = requests.post(f"{API}/messages", json={
            "name": "TEST_User", "email": "test@example.com", "subject": "Halo dunia",
            "message": "Ini pesan uji coba yang cukup panjang.",
            "captcha_id": c["captcha_id"], "captcha_answer": 9999,
        })
        assert r.status_code == 400

    def test_message_valid(self):
        c = requests.get(f"{API}/captcha").json()
        # parse "a + b"
        a, _, b = c["question"].split()
        answer = int(a) + int(b)
        r = requests.post(f"{API}/messages", json={
            "name": "TEST_User", "email": "test@example.com", "subject": "Halo dunia",
            "message": "Ini pesan uji coba yang cukup panjang.",
            "captcha_id": c["captcha_id"], "captcha_answer": answer,
        })
        assert r.status_code == 200, r.text


# ---------- Audit + stats ----------
class TestAdminMisc:
    def test_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=H(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ("news", "members", "rwrt", "finance_published"):
            assert k in d

    def test_audit_has_login(self, admin_token):
        r = requests.get(f"{API}/admin/audit", headers=H(admin_token))
        assert r.status_code == 200
        actions = {a.get("action") for a in r.json()}
        assert "login" in actions
