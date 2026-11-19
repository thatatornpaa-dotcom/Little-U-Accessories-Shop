/**
 * k6 Authenticated Load Test
 * Login ครั้งเดียวใน setup() แล้วใช้ token เดิมกับทุก VU
 * ทดสอบ: profile, seller products, seller dashboard, admin pending shops
 *
 * หมายเหตุ: ไม่ login ซ้ำใน loop เพราะ bcrypt ใช้ CPU สูง
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8000";
const SELLER_EMAIL = __ENV.SELLER_EMAIL || "seller@bareandbold.test";
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "admin@gmail.com";
const PASSWORD = __ENV.PASSWORD || "password";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const options = {
  scenarios: {
    authenticated: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 3 },
        { duration: "20s", target: 6 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1200", "p(99)<2500"],
  },
};

export function setup() {
  const sellerLogin = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: SELLER_EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS },
  );
  const sellerToken = sellerLogin.json()?.token || null;

  const adminLogin = http.post(
    `${BASE}/api/auth/backoffice/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS },
  );
  const adminToken = adminLogin.json()?.token || null;

  return { sellerToken, adminToken };
}

export default function (data) {
  const sellerHeaders = { Authorization: `Bearer ${data.sellerToken}` };
  const adminHeaders = { Authorization: `Bearer ${data.adminToken}` };

  const profile = http.get(`${BASE}/api/auth/profile`, {
    headers: sellerHeaders,
  });
  check(profile, {
    "profile 200": (r) => r.status === 200,
    "role SELLER": (r) => r.json()?.role === "SELLER",
  });

  const products = http.get(`${BASE}/api/seller/products`, {
    headers: sellerHeaders,
  });
  check(products, {
    "seller products 200": (r) => r.status === 200,
    "seller products array": (r) => Array.isArray(r.json()?.products),
  });

  const dashboard = http.get(`${BASE}/api/seller/dashboard`, {
    headers: sellerHeaders,
  });
  check(dashboard, {
    "dashboard 200": (r) => r.status === 200,
    "dashboard productCount": (r) =>
      typeof r.json()?.dashboard?.productCount === "number",
  });

  const pendingShops = http.get(`${BASE}/api/admin/shops?status=PENDING`, {
    headers: adminHeaders,
  });
  check(pendingShops, {
    "admin pending shops 200": (r) => r.status === 200,
    "admin pending shops array": (r) => Array.isArray(r.json()?.shops),
  });

  sleep(0.5);
}
