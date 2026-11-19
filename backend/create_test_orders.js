import { prisma } from "./src/lib/db.js";

async function main() {
  console.log("Seeding test orders for Backoffice demo...");

  // 1. Find or create user
  let user = await prisma.user.findFirst();
  if (!user) {
    const hashedPassword = await Bun.password.hash("password123", { algorithm: "bcrypt", cost: 10 });
    user = await prisma.user.create({
      data: {
        email: "somchai@example.com",
        password: hashedPassword,
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "0812345678",
        address: "99/99 อาคารปาร์คเวนเชอร์ ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
      },
    });
  }

  // 2. Find or create products
  let product1 = await prisma.product.findFirst({ where: { name: "กำไลข้อมือสายถักแฮนด์เมด" } });
  if (!product1) {
    product1 = await prisma.product.create({
      data: {
        name: "กำไลข้อมือสายถักแฮนด์เมด",
        description: "กำไลข้อมือสายถักงานแฮนด์เมดประณีต ประดับด้วยหินนำโชค",
        price: 890,
        originalPrice: 1090,
        type: "READY_TO_SHIP",
        category: "BRACELET",
        stock: 50,
      },
    });
  }

  let product2 = await prisma.product.findFirst({ where: { name: "กำไลข้อเท้าหยกขาวมงคล" } });
  if (!product2) {
    product2 = await prisma.product.create({
      data: {
        name: "กำไลข้อเท้าหยกขาวมงคล",
        description: "กำไลข้อเท้าหยกขาวแท้ 100% สายปรับระดับได้",
        price: 1590,
        originalPrice: 1890,
        type: "READY_TO_SHIP",
        category: "ANKLET",
        stock: 30,
      },
    });
  }

  // 3. Create Sample Order 1 (PAID)
  const order1 = await prisma.order.create({
    data: {
      userId: user.id,
      status: "PAID",
      totalPrice: 2480.00,
      shippingAddress: "99/99 อาคารปาร์คเวนเชอร์ ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
      recipientName: `${user.firstName} ${user.lastName}`,
      recipientPhone: user.phone || "0812345678",
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            price: product1.price,
            customDetails: [{ option: "Wrist Size", value: "16 cm" }],
          },
          {
            productId: product2.id,
            quantity: 1,
            price: product2.price,
          },
        ],
      },
      payment: {
        create: {
          amount: 2480.00,
          paymentMethod: "PROMPTPAY",
          status: "SUCCESS",
          omiseChargeId: "chrg_test_99881122",
          paidAt: new Date(),
        },
      },
      shipping: {
        create: {
          status: "PENDING",
          carrier: "Flash Express",
        },
      },
    },
  });

  // 4. Create Sample Order 2 (SHIPPED)
  const order2 = await prisma.order.create({
    data: {
      userId: user.id,
      status: "SHIPPED",
      totalPrice: 890.00,
      shippingAddress: "555/12 คอนโดไอดีโอ สุขุมวิท แขวงบางนา เขตบางนา กรุงเทพฯ 10260",
      recipientName: "สมหญิง รักเรียน",
      recipientPhone: "0898765432",
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            price: product1.price,
          },
        ],
      },
      payment: {
        create: {
          amount: 890.00,
          paymentMethod: "CREDIT_CARD",
          status: "SUCCESS",
          omiseChargeId: "chrg_test_33445566",
          paidAt: new Date(),
        },
      },
      shipping: {
        create: {
          status: "IN_TRANSIT",
          carrier: "Flash Express",
          trackingNumber: "TH0199283746",
          shippedAt: new Date(),
        },
      },
    },
  });

  console.log("Successfully created test orders!");
  console.log("Order 1 ID:", order1.id, "| Status: PAID");
  console.log("Order 2 ID:", order2.id, "| Status: SHIPPED");
}

main()
  .catch((e) => {
    console.error("Error seeding test orders:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
