# k6 Load Tests — Bare & Bold API

## Requirements

- k6 v0.49+ (tested with v2.3.0)
- Backend running at `http://localhost:8000`
- Seed data (seller / admin accounts)

Windows path in this machine: `C:\Program Files\k6\k6.exe`

## Run

```powershell
# 1) Smoke test (1 iteration) — ตรวจว่า endpoint หลักทั้งหมดทำงาน
& "C:\Program Files\k6\k6.exe" run bareandbold_backend/k6/smoke.js

# 2) Public catalog load test (~40s, ramp 0→10 VUs)
& "C:\Program Files\k6\k6.exe" run bareandbold_backend/k6/load-public.js

# 3) Authenticated seller/admin load test (~40s, ramp 0→6 VUs)
& "C:\Program Files\k6\k6.exe" run bareandbold_backend/k6/load-auth.js
```

## Environment variables

| Variable | Default | Use |
|---|---|---|
| `BASE_URL` | `http://localhost:8000` | API base URL |
| `EMAIL` / `SELLER_EMAIL` | `seller@bareandbold.test` | Seller login |
| `ADMIN_EMAIL` | `admin@gmail.com` | Admin login |
| `PASSWORD` | `password` | Shared test password |

Example:

```powershell
& "C:\Program Files\k6\k6.exe" run -e BASE_URL=http://localhost:8000 -e SELLER_EMAIL=seller@bareandbold.test bareandbold_backend/k6/load-auth.js
```

## Thresholds

| Script | Check | Threshold |
|---|---|---|
| smoke | checks | 100% |
| smoke | http_req_failed | 0% |
| load-public | checks | >99% |
| load-public | http_req_failed | <1% |
| load-public | p95 / p99 | <1000ms / <2000ms |
| load-auth | checks | >99% |
| load-auth | http_req_failed | <1% |
| load-auth | p95 / p99 | <1200ms / <2500ms |

## Notes

- Tests are read-heavy by design; they do not create/update/delete data.
- Login happens once in `setup()` and the token is reused by VUs.
- Keep VUs modest because the database is Neon (remote). Increase stages gradually if needed.
- For a stress test, copy `load-public.js` and raise targets (e.g. 20–50 VUs) after confirming baseline latency.
