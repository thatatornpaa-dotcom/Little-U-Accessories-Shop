# k6 Test Results

> วันที่รัน: 2026-11-09
> Environment: local backend (`http://localhost:8000`) + Neon PostgreSQL (remote)
> k6: v2.3.0 (windows/amd64)

## 1) Smoke Test — `smoke.js`

| Metric | Result |
|---|---|
| Checks | **18/18 ผ่าน (100%)** |
| HTTP failed | **0%** |
| Requests | 11 |
| Avg duration | 403.72 ms |
| p95 | 1.11 s (รวม cold start ของ Neon) |
| Thresholds | ✅ checks 100%, ✅ failed 0% |

## 2) Public Load Test — `load-public.js`

| Metric | Result |
|---|---|
| VUs | ramp 0 → 10 → 0 (40s) |
| Iterations | 206 |
| Checks | **1,236/1,236 ผ่าน (100%)** |
| HTTP failed | **0%** |
| Requests | 619 |
| Avg duration | 501.68 ms |
| p95 / p99 | **953.29 ms / 1.07 s** |
| Thresholds | ✅ checks >99%, ✅ failed <1%, ✅ p95 <1000ms, ✅ p99 <2000ms |

## 3) Authenticated Load Test — `load-auth.js`

| Metric | Result |
|---|---|
| VUs | ramp 0 → 6 → 0 (40s) |
| Iterations | 86 |
| Checks | **688/688 ผ่าน (100%)** |
| HTTP failed | **0%** |
| Requests | 346 |
| Avg duration | 248.94 ms |
| p95 / p99 | **496.32 ms / 895.56 ms** |
| Thresholds | ✅ checks >99%, ✅ failed <1%, ✅ p95 <1200ms, ✅ p99 <2500ms |

## สรุป

- ระบบรองรับ load ระดับ 10 VUs สำหรับ public catalog และ 6 VUs สำหรับ authenticated flow ได้โดยไม่มี error
- Endpoint ที่แตะ DB ผ่าน Neon มี latency ค่อนข้างสูง (p95 ~950ms ที่ 10 VUs) แต่ยังอยู่ใน threshold
- หากต้องการ stress test เพิ่ม แนะนำเพิ่ม stages ใน `load-public.js` ทีละ 5 VUs และเฝ้า p95/failed rate
- จุดที่ควร optimize ต่อ: query public catalog (drizzle/prisma include), index `Product.shopId`/`isActive`, caching รายการสินค้า
