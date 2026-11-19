/**
 * k6 Public Load Test
 * ยิง endpoint ที่ไม่ต้อง login: catalog, product detail, shop profile
 * Ramp 0 → 10 VUs ใน 40 วินาที (ปรับ stages ได้ตามต้องการ)
 *
 * Thresholds:
 * - checks ต้องผ่าน > 99%
 * - request fail < 1%
 * - p95 < 1000ms, p99 < 2000ms
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8000";

export const options = {
  scenarios: {
    public_catalog: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 5 },
        { duration: "20s", target: 10 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
  },
};

export function setup() {
  const products = http.get(`${BASE}/api/products`);
  const list = products.json()?.products || [];
  return { productId: list[0]?.id || null };
}

export default function (data) {
  const responses = http.batch([
    ["GET", `${BASE}/api/products`],
    ["GET", `${BASE}/api/shops/crystal-charms`],
    ...(data.productId
      ? [["GET", `${BASE}/api/products/${data.productId}`]]
      : []),
  ]);

  const [products, shop, detail] = responses;

  check(products, {
    "catalog 200": (r) => r.status === 200,
    "catalog has data": (r) => (r.json()?.products || []).length > 0,
  });

  check(shop, {
    "shop 200": (r) => r.status === 200,
    "shop approved": (r) => r.json()?.shop?.status === "APPROVED",
  });

  if (detail) {
    check(detail, {
      "detail 200": (r) => r.status === 200,
      "detail includes shop": (r) => !!r.json()?.product?.shop,
    });
  }

  sleep(0.5);
}
