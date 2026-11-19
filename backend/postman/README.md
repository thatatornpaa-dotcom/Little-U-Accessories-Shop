# Postman Collection — Bare & Bold Marketplace API

สร้างจาก route ที่มีจริงใน backend ตอนนี้ (`10 พ.ย. 2026`)

## ไฟล์

- `BareAndBold.postman_collection.json` — collection หลัก
- `BareAndBold.postman_environment.json` — environment `Bare & Bold Local`

## วิธีใช้

1. เปิด Postman → **Import** → เลือกทั้ง 2 ไฟล์
2. เลือก Environment: **Bare & Bold Local**
3. ตรวจ `baseUrl` ให้เป็น `http://localhost:8000`
4. รันตามลำดับ folder:
   - `00 · Health`
   - `01 · Auth — Buyer` → เก็บ `buyerToken`
   - `02 · Auth — Backoffice` → เก็บ `adminToken`, `staffToken`, `pendingToken`
   - `03 · Public Catalog` → เก็บ `productId`, `shopSlug`, `categoryId`, `accessoryId`
   - `04 · Buyer — Cart / Wishlist / Address / Orders` → เก็บ `addressId`, `orderId`, `chargeId`
   - `05 · Seller` → เก็บ `sellerToken`, `shopId`, `sellerProductId`
   - `06 · Admin Backoffice` → เก็บ `adminShopId`, `userId`, `employeeId`
   - `07 · Upload` → เลือกไฟล์รูปเองก่อน Send
   - `08 · Payment Webhook`
   - `09 · Permission Tests` → ตรวจ 401/403

## Test script ที่ใส่ไว้

- Login buyer/admin/staff/pending → บันทึก token ลง collection variables
- `GET /api/products` → บันทึก `productId`, `shopSlug`
- `GET /api/categories` → บันทึก `categoryId`
- `GET /api/accessories` → บันทึก `accessoryId`
- `GET /api/addresses` → บันทึก `addressId`
- `POST /api/orders` → บันทึก `orderId`
- `POST /api/payments/checkout` → บันทึก `chargeId`
- `POST /api/seller/products` → บันทึก `sellerProductId`
- `GET /api/admin/shops` → บันทึก `adminShopId`
- `GET /api/users` → บันทึก `userId`
- `POST /api/employees` → บันทึก `employeeId`
- `POST /api/upload` → บันทึก `uploadedUrl`

## บัญชีทดสอบ

| Role | Email | Password |
|---|---|---|
| Buyer | `buyer@bareandbold.test` | `password` |
| Seller (APPROVED) | `seller@bareandbold.test` | `password` |
| Seller (PENDING) | `pending@bareandbold.test` | `password` |
| Admin | `admin@gmail.com` | `password` |
| Staff | `staff@gmail.com` | `password` |

## ข้อควรระวัง

- **Approve / Reject shop เปลี่ยนข้อมูลจริง** — ใช้กับร้านทดสอบเท่านั้น
- **Upload** ต้องเลือกไฟล์รูปใน Postman ก่อนกด Send
- **Create order** ต้องมีสินค้าในตะกร้าก่อน (folder Buyer รัน Add item to cart ให้แล้ว)
- **Payment** ถ้าไม่มี `OMISE_SECRET_KEY` จะใช้ mock flow และได้ QR จำลอง
- **Register buyer/employee** ใช้อีเมลสุ่มอัตโนมัติ จึงรันซ้ำได้
- ถ้า `buyer@bareandbold.test` มีร้านแล้ว `POST /api/shops/apply` จะได้ 409 (ปกติ)
- รัน `09 · Permission Tests` หลัง login ทุก role แล้วเท่านั้น

## จำนวน request

| Folder | Requests |
|---|---:|
| Health | 1 |
| Auth Buyer | 5 |
| Auth Backoffice | 5 |
| Public Catalog | 10 |
| Buyer Flow | 18 |
| Seller | 11 |
| Admin | 12 |
| Upload | 2 |
| Payment Webhook | 1 |
| Permission Tests | 7 |
| **รวม** | **72** |
