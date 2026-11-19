import "dotenv/config";
import { prisma } from "./src/lib/db.js";

/**
 * Seed บัญชีทดสอบตาม role
 * - buyer: ซื้อของอย่างเดียว
 * - seller: มีร้าน APPROVED + สินค้าตัวอย่าง
 * - pending: มีร้าน PENDING (ยังไม่มีสิทธิ์ seller)
 * - admin/staff: ใช้บัญชีเดิมจาก seed หลัก (admin@gmail.com / staff@gmail.com)
 *
 * รัน: bun run seed_roles.js
 */
const PASSWORD = "password";

async function hashPassword() {
  return Bun.password.hash(PASSWORD, { algorithm: "bcrypt", cost: 10 });
}

async function main() {
  console.log("🌱 Seeding role-based test accounts...");
  const password = await hashPassword();

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@bareandbold.test" },
    update: { role: "BUYER", password },
    create: {
      email: "buyer@bareandbold.test",
      password,
      firstName: "บุญซื้อ",
      lastName: "ทดสอบ",
      role: "BUYER",
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@bareandbold.test" },
    update: { role: "SELLER", password },
    create: {
      email: "seller@bareandbold.test",
      password,
      firstName: "สมชาย",
      lastName: "ขายดี",
      role: "SELLER",
    },
  });

  const pendingSeller = await prisma.user.upsert({
    where: { email: "pending@bareandbold.test" },
    update: { role: "BUYER", password },
    create: {
      email: "pending@bareandbold.test",
      password,
      firstName: "รออนุมัติ",
      lastName: "ทดสอบ",
      role: "BUYER",
    },
  });

  const approvedShop = await prisma.shop.upsert({
    where: { ownerId: seller.id },
    update: {
      name: "Crystal Charms",
      slug: "crystal-charms",
      status: "APPROVED",
      description: "กำไลข้อมือและเครื่องประดับหินมงคล handmade",
      taxId: "1234567890123",
      idCardUrl: "https://example.com/id-card.jpg",
      bankName: "กสิกรไทย",
      bankAccountNumber: "1234567890",
      bankAccountName: "สมชาย ขายดี",
      rejectionReason: null,
    },
    create: {
      ownerId: seller.id,
      name: "Crystal Charms",
      slug: "crystal-charms",
      status: "APPROVED",
      description: "กำไลข้อมือและเครื่องประดับหินมงคล handmade",
      taxId: "1234567890123",
      idCardUrl: "https://example.com/id-card.jpg",
      bankName: "กสิกรไทย",
      bankAccountNumber: "1234567890",
      bankAccountName: "สมชาย ขายดี",
    },
  });

  await prisma.shop.upsert({
    where: { ownerId: pendingSeller.id },
    update: {
      name: "Pending Gems",
      slug: "pending-gems",
      status: "PENDING",
      description: "ร้านทดสอบสถานะรออนุมัติ",
      taxId: "9876543210987",
      idCardUrl: "https://example.com/id-card-2.jpg",
      bankName: "ไทยพาณิชย์",
      bankAccountNumber: "0987654321",
      bankAccountName: "รออนุมัติ ทดสอบ",
      rejectionReason: null,
    },
    create: {
      ownerId: pendingSeller.id,
      name: "Pending Gems",
      slug: "pending-gems",
      status: "PENDING",
      description: "ร้านทดสอบสถานะรออนุมัติ",
      taxId: "9876543210987",
      idCardUrl: "https://example.com/id-card-2.jpg",
      bankName: "ไทยพาณิชย์",
      bankAccountNumber: "0987654321",
      bankAccountName: "รออนุมัติ ทดสอบ",
    },
  });

  const productCount = await prisma.product.count({
    where: { shopId: approvedShop.id },
  });

  if (productCount === 0) {
    await prisma.product.create({
      data: {
        shopId: approvedShop.id,
        name: "กำไลข้อมือหินโรสควอตซ์",
        description: "กำไลหินโรสควอตซ์แท้ เสริมความรักและเมตตา",
        price: 890,
        originalPrice: 1290,
        type: "READY_TO_SHIP",
        category: "BRACELET",
        stock: 10,
        wristSizeMin: 14,
        wristSizeMax: 18,
        customOptions: {
          create: [
            {
              name: "ขนาดข้อมือ",
              isRequired: true,
              values: {
                create: [
                  { value: "15 cm", priceAdjustment: 0 },
                  { value: "16 cm", priceAdjustment: 0 },
                  { value: "17 cm", priceAdjustment: 50 },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.product.create({
      data: {
        shopId: approvedShop.id,
        name: "กำไลข้อเท้าซิทรินสั่งทำ",
        description: "งานสั่งทำ 7 วัน หินซิทรินเสริมการเงิน",
        price: 1190,
        type: "MADE_TO_ORDER",
        category: "ANKLET",
        leadTimeDays: 7,
        stock: 0,
        wristSizeMin: 20,
        wristSizeMax: 25,
      },
    });
  }

  console.log("✅ Test accounts ready (password: %s)", PASSWORD);
  console.table([
    { role: "BUYER", email: buyer.email, shop: "—" },
    { role: "SELLER", email: seller.email, shop: "crystal-charms (APPROVED)" },
    { role: "BUYER/PENDING", email: pendingSeller.email, shop: "pending-gems (PENDING)" },
    { role: "ADMIN", email: "admin@gmail.com", shop: "—" },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
