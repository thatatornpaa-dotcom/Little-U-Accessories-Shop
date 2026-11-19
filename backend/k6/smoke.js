/**
 * k6 Smoke Test
 * ตรวจว่า endpoint หลักทั้งหมดตอบ 200 และข้อมูลสำคัญถูกต้อง
 * ใช้ 1 VU / 1 iteration เหมาะสำหรับรันก่อน deploy หรือหลัง restart backend
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8000";
const EMAIL = __ENV.EMAIL || "seller@bareandbold.test";
const PASSWORD = __ENV.PASSWORD || "password";
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "admin@gmail.com";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
  },
};

export function setup() {
  const login = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS },
  );
  const sellerBody = login.json();
  const token = sellerBody?.token || null;

  const adminLogin = http.post(
    `${BASE}/api/auth/backoffice/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS },
  );
  const adminToken = adminLogin.json()?.token || null;

  const products = http.get(`${BASE}/api/products`);
  const productList = products.json()?.products || [];
  const productId = productList[0]?.id || null;

  return { token, adminToken, productId, productCount: productList.length };
}

export default function (data) {
  const health = http.get(`${BASE}/`);
  check(health, {
    "health 200": (r) => r.status === 200,
    "health body": (r) => String(r.body).includes("API Server is running"),
  });

  const products = http.get(`${BASE}/api/products`);
  check(products, {
    "products 200": (r) => r.status === 200,
    "products not empty": (r) => (r.json()?.products || []).length > 0,
  });

  if (data.productId) {
    const detail = http.get(`${BASE}/api/products/${data.productId}`);
    check(detail, {
      "product detail 200": (r) => r.status === 200,
      "product detail has shop": (r) => !!r.json()?.product?.shop,
    });
  }

  const shop = http.get(`${BASE}/api/shops/crystal-charms`);
  check(shop, {
    "shop page 200": (r) => r.status === 200,
    "shop page approved": (r) => r.json()?.shop?.status === "APPROVED",
  });

  check(data, {
    "seller login succeeded": (d) => !!d.token,
    "admin login succeeded": (d) => !!d.adminToken,
  });

  if (data.token) {
    const profile = http.get(`${BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    check(profile, {
      "profile 200": (r) => r.status === 200,
      "profile role SELLER": (r) => r.json()?.role === "SELLER",
    });

    const sellerProducts = http.get(`${BASE}/api/seller/products`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    check(sellerProducts, {
      "seller products 200": (r) => r.status === 200,
      "seller products array": (r) => Array.isArray(r.json()?.products),
    });

    const dashboard = http.get(`${BASE}/api/seller/dashboard`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    check(dashboard, {
      "seller dashboard 200": (r) => r.status === 200,
      "dashboard has productCount": (r) =>
        typeof r.json()?.dashboard?.productCount === "number",
    });
  }

  if (data.adminToken) {
    const adminShops = http.get(`${BASE}/api/admin/shops`, {
      headers: { Authorization: `Bearer ${data.adminToken}` },
    });
    check(adminShops, {
      "admin shops 200": (r) => r.status === 200,
      "admin shops array": (r) => Array.isArray(r.json()?.shops),
    });
  }

  sleep(0.2);
}
