import base64, hmac, os, subprocess
from datetime import datetime, timezone
from typing import Set, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

# --- DB connection (to the postgres service in your compose network)
PGHOST = os.getenv("PGHOST", "db")
PGPORT = os.getenv("PGPORT", "5432")
PGUSER = os.getenv("PGUSER", "postgres")
PGPASSWORD = os.getenv("PGPASSWORD", "postgres")

# --- Security options
ALLOWED_DBS: Set[str] = {s.strip() for s in os.getenv("ALLOWED_DBS", "").split(",") if s.strip()}
BACKUP_TOKEN = os.getenv("BACKUP_TOKEN", "")  # send in header: X-Backup-Token
BASIC_USER = os.getenv("BACKUP_USER", "")     # HTTP Basic user
BASIC_PASS = os.getenv("BACKUP_PASS", "")     # HTTP Basic pass
REQUIRE_BOTH = os.getenv("REQUIRE_BOTH", "false").lower() == "true"  # require BOTH token & basic
ALLOW_IPS = {s.strip() for s in os.getenv("ALLOW_IPS", "").split(",") if s.strip()}  # e.g. "1.2.3.4,5.6.7.8"

app = FastAPI(title="db-backup", version="1.1.0")

def _const_eq(a: str, b: str) -> bool:
    try:
        return hmac.compare_digest(a, b)
    except Exception:
        return False

def _basic_ok(auth_header: Optional[str]) -> bool:
    if not BASIC_USER or not BASIC_PASS:
        return False
    if not auth_header or not auth_header.startswith("Basic "):
        return False
    try:
        raw = base64.b64decode(auth_header.split(" ", 1)[1]).decode("utf-8", "ignore")
        user, pw = raw.split(":", 1)
        return _const_eq(user, BASIC_USER) and _const_eq(pw, BASIC_PASS)
    except Exception:
        return False

def _token_ok(token_header: Optional[str]) -> bool:
    if not BACKUP_TOKEN:
        return False
    return _const_eq(token_header or "", BACKUP_TOKEN)

def _ip_ok(ip: str) -> bool:
    if not ALLOW_IPS:
        return True
    return ip in ALLOW_IPS

def _require_auth(request: Request):
    # IP allow-list first
    client_ip = request.client.host if request.client else ""
    if not _ip_ok(client_ip):
        raise HTTPException(status_code=403, detail="IP not allowed")

    # Which methods are configured?
    methods_cfg = {
        "basic": bool(BASIC_USER and BASIC_PASS),
        "token": bool(BACKUP_TOKEN),
    }
    if not any(methods_cfg.values()):
        # No auth configured = block everything to be safe
        raise HTTPException(status_code=401, detail="Auth not configured")

    have_basic = _basic_ok(request.headers.get("authorization"))
    have_token = _token_ok(request.headers.get("x-backup-token"))

    if REQUIRE_BOTH:
        if not (have_basic and have_token):
            raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        # Either method that is configured can pass
        ok = (methods_cfg["basic"] and have_basic) or (methods_cfg["token"] and have_token)
        if not ok:
            raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/healthz")
def healthz(request: Request):
    try:
        _require_auth(request)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"ok": False, "error": e.detail})
    return {"ok": True, "allowed_dbs": sorted(list(ALLOWED_DBS))}

@app.get("/backup")
def backup(request: Request, db: str):
    _require_auth(request)

    if not db or db not in ALLOWED_DBS:
        raise HTTPException(status_code=400, detail="db not allowed")

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    filename = f"{db}_{ts}.dump"  # pg_dump custom format

    env = os.environ.copy()
    env["PGPASSWORD"] = PGPASSWORD

    cmd = [
        "pg_dump",
        "-h", PGHOST,
        "-p", PGPORT,
        "-U", PGUSER,
        "-d", db,
        "-Fc",     # custom (binary) format
        "-Z", "9"  # max compression
    ]

    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, bufsize=1024 * 1024
    )
    if not proc.stdout:
        raise HTTPException(status_code=500, detail="Failed to start pg_dump")

    def stream():
        try:
            for chunk in iter(lambda: proc.stdout.read(8192), b""):
                yield chunk
        finally:
            try:
                proc.stdout.close()
            except Exception:
                pass

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(stream(), media_type="application/octet-stream", headers=headers)
