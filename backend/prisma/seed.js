import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("🌱 Starting Database Seed for Bracelet Marketplace...");

  // 1. Clean existing records in correct order
  console.log("🧹 Cleaning up old database records...");
  await prisma.reviewImage.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.refundRequest.deleteMany({});
  await prisma.orderItemAccessory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.subOrder.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.shipping.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItemAccessory.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.productAccessory.deleteMany({});
  await prisma.customOptionValue.deleteMany({});
  await prisma.customOption.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.accessory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.shopTransaction.deleteMany({});
  await prisma.payoutRequest.deleteMany({});
  await prisma.shop.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.employee.deleteMany({});

  const defaultPassword = await Bun.password.hash("password", { algorithm: "bcrypt", cost: 10 });

  // 2. Seed Employees (Backoffice Admin & Staff)
  console.log("👤 Seeding Employees (Backoffice)...");
  const adminEmp = await prisma.employee.create({
    data: {
      email: "admin@gmail.com",
      password: defaultPassword,
      firstName: "Admin",
      lastName: "Platform",
      role: "admin",
    },
  });

  const staffEmp = await prisma.employee.create({
    data: {
      email: "staff@gmail.com",
      password: defaultPassword,
      firstName: "Staff",
      lastName: "Operations",
      role: "staff",
    },
  });

  // 3. Seed Users (Buyers & Sellers)
  console.log("👥 Seeding Users (Buyers & Sellers)...");
  const buyerUser1 = await prisma.user.create({
    data: {
      email: "folk@gmail.com",
      password: defaultPassword,
      firstName: "ภานุพัตถ์",
      lastName: "ใจดี",
      phone: "0812345678",
      role: "BUYER",
      addresses: {
        create: [
          {
            label: "ที่บ้าน",
            recipientName: "ภานุพัตถ์ ใจดี",
            phone: "0812345678",
            province: "กรุงเทพมหานคร",
            amphoe: "คลองเตย",
            tambon: "คลองเตย",
            addressLine: "123/45 สุขุมวิท 22",
            postalCode: "10110",
            isDefault: true,
            note: "ฝากไว้ที่ป้อม รปภ. ได้เลยครับ",
          },
          {
            label: "ที่ทำงาน",
            recipientName: "ภานุพัตถ์ ใจดี (Office)",
            phone: "0812345678",
            province: "กรุงเทพมหานคร",
            amphoe: "วัฒนา",
            tambon: "คลองเตยเหนือ",
            addressLine: "อาคารอินเตอร์เชนจ์ 21 ชั้น 18 ถนนอโศกมนตรี",
            postalCode: "10110",
            isDefault: false,
          },
        ],
      },
    },
  });

  const buyerUser2 = await prisma.user.create({
    data: {
      email: "alice@gmail.com",
      password: defaultPassword,
      firstName: "อลิสา",
      lastName: "สมหวัง",
      phone: "0899887766",
      role: "BUYER",
      addresses: {
        create: [
          {
            label: "คอนโด",
            recipientName: "อลิสา สมหวัง",
            phone: "0899887766",
            province: "นนทบุรี",
            amphoe: "เมืองนนทบุรี",
            tambon: "บางกระสอ",
            addressLine: "99/111 คอนโดริเวอร์วิว ถนนรัตนาธิเบศร์",
            postalCode: "11000",
            isDefault: true,
          },
        ],
      },
    },
  });

  // Seller Users
  const sellerUser1 = await prisma.user.create({
    data: {
      email: "seller1@gmail.com",
      password: defaultPassword,
      firstName: "ธนวัฒน์",
      lastName: "ศิลปะช่าง",
      phone: "0823334455",
      role: "SELLER",
    },
  });

  const sellerUser2 = await prisma.user.create({
    data: {
      email: "seller2@gmail.com",
      password: defaultPassword,
      firstName: "วารินทร์",
      lastName: "หินนำโชค",
      phone: "0845556677",
      role: "SELLER",
    },
  });

  const sellerUser3 = await prisma.user.create({
    data: {
      email: "seller3@gmail.com",
      password: defaultPassword,
      firstName: "นภัสสร",
      lastName: "ข้อเท้างาม",
      phone: "0867778899",
      role: "SELLER",
    },
  });

  const sellerUserPending = await prisma.user.create({
    data: {
      email: "seller_pending@gmail.com",
      password: defaultPassword,
      firstName: "พิทยา",
      lastName: "สร้อยลูกปัด",
      phone: "0891112233",
      role: "BUYER", // Still pending approval
    },
  });

  // 4. Seed Shops (Marketplace Partner Shops)
  console.log("🏪 Seeding Shops (Multi-Vendor)...");
  const shop1 = await prisma.shop.create({
    data: {
      ownerId: sellerUser1.id,
      name: "Bare & Bold Official",
      slug: "bare-and-bold",
      description: "สตูดิโอเครื่องประดับกำไลข้อมือเงินแท้ 925 และงานแฮนด์เมดเชือกถักมินิมอลยอดนิยม",
      logoUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=300",
      bannerUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200",
      taxId: "0105561234567",
      bankName: "ธนาคารกสิกรไทย",
      bankAccountNumber: "012-3-45678-9",
      bankAccountName: "นายธนวัฒน์ ศิลปะช่าง",
      status: "APPROVED",
      balance: 14500.00,
    },
  });

  const shop2 = await prisma.shop.create({
    data: {
      ownerId: sellerUser2.id,
      name: "Crystal & Craft Studio",
      slug: "crystal-craft",
      description: "กำไลหินมงคลแท้ 100% คัดเกรดพรีเมียม เสริมดวงความรัก การเงิน การงาน ตามหลักราศี",
      logoUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300",
      bannerUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200",
      taxId: "0105569876543",
      bankName: "ธนาคารไทยพาณิชย์",
      bankAccountNumber: "405-1-23456-7",
      bankAccountName: "นางสาววารินทร์ หินนำโชค",
      status: "APPROVED",
      balance: 8900.00,
    },
  });

  const shop3 = await prisma.shop.create({
    data: {
      ownerId: sellerUser3.id,
      name: "Boho Anklet & Co.",
      slug: "boho-anklet",
      description: "สร้อยข้อเท้าสไตล์โบฮีเมียน สายลุยทะเล เปลือกหอยเบี้ย เชือกเทียนกันน้ำทนทาน",
      logoUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=300",
      bannerUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200",
      taxId: "0105564567890",
      bankName: "ธนาคารกรุงเทพ",
      bankAccountNumber: "123-4-56789-0",
      bankAccountName: "นางสาวนภัสสร ข้อเท้างาม",
      status: "APPROVED",
      balance: 3200.00,
    },
  });

  const shopPending = await prisma.shop.create({
    data: {
      ownerId: sellerUserPending.id,
      name: "Pattaya Beads & Charms",
      slug: "pattaya-beads",
      description: "ร้านงานลูกปัดแฮนด์เมดสีสันสดใสจากพัทยา (รอการตรวจสอบอนุมัติ)",
      logoUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=300",
      taxId: "0105561122334",
      bankName: "ธนาคารกสิกรไทย",
      bankAccountNumber: "789-0-12345-6",
      bankAccountName: "นายพิทยา สร้อยลูกปัด",
      status: "PENDING", // สำหรับทดสอบ Backoffice Approve Shop
      balance: 0.00,
    },
  });

  // 5. Seed Categories & Accessories
  console.log("💎 Seeding Categories & Accessories...");
  const catCharm = await prisma.category.create({
    data: { name: "CHARM", description: "จี้ประดับตกแต่งเสริมมงคลและสไตล์เฉพาะบุคคล" },
  });
  const catBead = await prisma.category.create({
    data: { name: "BEAD", description: "ลูกปัดหินนำโชค หินสีธรรมชาติเพื่อความเป็นสิริมงคล" },
  });
  const catCord = await prisma.category.create({
    data: { name: "CORD", description: "เชือกถัก เชือกเทียน หรือสายหนังถักสำหรับขึ้นโครงสร้อย" },
  });
  const catStone = await prisma.category.create({
    data: { name: "STONE", description: "หินมงคลเกรดอัญมณีแท้ เจียระไนทรงกลมและทรงเหลี่ยม" },
  });

  const accLuckyCat = await prisma.accessory.create({
    data: {
      name: "จี้แมวกวักนำโชค (Lucky Cat)",
      description: "จี้แมวกวักเซรามิกญี่ปุ่น นำโชคลาภ การเงิน และความมั่งคั่ง",
      price: 120.00,
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-159643478518-a784e5dc4c8f?q=80&w=400",
      categoryId: catCharm.id,
    },
  });

  const accSilverHeart = await prisma.accessory.create({
    data: {
      name: "จี้รูปหัวใจเงินแท้ (Silver Heart 925)",
      description: "จี้รูปหัวใจทำจากเงินแท้ 925 เสริมเสน่ห์ความรักอันบริสุทธิ์",
      price: 150.00,
      stock: 80,
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=400",
      categoryId: catCharm.id,
    },
  });

  const accRoseQuartzBead = await prisma.accessory.create({
    data: {
      name: "หินโรสควอตซ์แท้ (Rose Quartz 8mm)",
      description: "หินสีชมพูละมุน หินแห่งความรัก การให้อภัย และเสน่ห์อ่อนหวาน",
      price: 60.00,
      stock: 150,
      imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=400",
      categoryId: catBead.id,
    },
  });

  const accBlackOnyxBead = await prisma.accessory.create({
    data: {
      name: "หินนิลดำผิวมัน (Black Onyx 8mm)",
      description: "หินนำโชคสีดำวาว ช่วยปกป้องคุ้มครองและเสริมความมุ่งมั่นสะกดอารมณ์",
      price: 50.00,
      stock: 200,
      imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=400",
      categoryId: catBead.id,
    },
  });

  const accBlackCord = await prisma.accessory.create({
    data: {
      name: "เชือกเทียนถักสีดำ (Black Wax Cord)",
      description: "เชือกเทียนสีดำสนิท มีความเหนียวทนทาน กันน้ำได้ดี เหมาะกับทุกลุค",
      price: 80.00,
      stock: 150,
      imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=400",
      categoryId: catCord.id,
    },
  });

  const accRedCord = await prisma.accessory.create({
    data: {
      name: "เชือกเทียนถักสีแดงมงคล (Red Lucky Cord)",
      description: "เชือกเทียนถักสีแดงสด เสริมพลังบวก โชคลาภ และด้ายแดงแห่งรัก",
      price: 80.00,
      stock: 120,
      imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=400",
      categoryId: catCord.id,
    },
  });

  // 6. Seed Products (Bracelets & Anklets for each Shop)
  console.log("💍 Seeding Products (Bracelets & Anklets)...");

  // Product 1: Classic Black Onyx (Ready to ship - Shop 1)
  const prod1 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: "Classic Black Onyx Bracelet",
      description: "สร้อยข้อมือหินนิลดำผิวมันวาว ช่วยเสริมความมุ่งมั่นและป้องกันพลังงานลบ เหมาะสำหรับใส่ได้ในทุกๆ วัน ทนทานลุยน้ำได้",
      price: 890.00,
      originalPrice: 1290.00,
      type: "READY_TO_SHIP",
      leadTimeDays: 0,
      category: "BRACELET",
      stock: 25,
      wristSizeMin: 14.0,
      wristSizeMax: 19.0,
      rating: 4.9,
      reviewCount: 14,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600", position: 0 },
          { url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600", position: 1 },
        ],
      },
    },
  });

  // Product 2: Custom Minimalist Wax Cord (Made to order - Shop 1)
  const prod2 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: "Custom Minimalist Wax Cord Bracelet",
      description: "สร้อยข้อมือเชือกเทียนถักสไตล์มินิมอล ออกแบบสั่งทำพิเศษ สามารถเลือกขนาดข้อมือ สีเชือก และจี้ตกแต่งในแบบที่คุณต้องการได้เอง",
      price: 350.00,
      originalPrice: 450.00,
      type: "MADE_TO_ORDER",
      leadTimeDays: 3,
      category: "BRACELET",
      stock: 0,
      wristSizeMin: 13.0,
      wristSizeMax: 21.0,
      rating: 4.8,
      reviewCount: 9,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600", position: 0 },
          { url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600", position: 1 },
        ],
      },
      customOptions: {
        create: [
          {
            name: "ขนาดข้อมือ (Wrist Size)",
            isRequired: true,
            values: {
              create: [
                { value: "14 cm", priceAdjustment: 0.00 },
                { value: "15 cm", priceAdjustment: 0.00 },
                { value: "16 cm", priceAdjustment: 0.00 },
                { value: "17 cm", priceAdjustment: 0.00 },
                { value: "18 cm", priceAdjustment: 0.00 },
                { value: "19 cm (+20 บาท)", priceAdjustment: 20.00 },
                { value: "20 cm (+20 บาท)", priceAdjustment: 20.00 },
              ],
            },
          },
          {
            name: "สีเชือกถัก (Cord Color)",
            isRequired: true,
            values: {
              create: [
                { value: "สีดำมินิมอล (Classic Black)", priceAdjustment: 0.00 },
                { value: "สีแดงมงคล (Lucky Red)", priceAdjustment: 0.00 },
                { value: "สีน้ำตาลเอิร์ธโทน (Earth Brown)", priceAdjustment: 0.00 },
                { value: "สีกรมท่า (Deep Navy)", priceAdjustment: 0.00 },
              ],
            },
          },
        ],
      },
      accessories: {
        create: [
          { accessoryId: accLuckyCat.id },
          { accessoryId: accSilverHeart.id },
          { accessoryId: accRoseQuartzBead.id },
          { accessoryId: accBlackOnyxBead.id },
        ],
      },
    },
  });

  // Product 3: Rose Quartz Love Bracelet (Ready to ship - Shop 2)
  const prod3 = await prisma.product.create({
    data: {
      shopId: shop2.id,
      name: "Rose Quartz Romance Gemstone Bracelet",
      description: "หินโรสควอตซ์สีชมพูพาสเทลแท้ 100% หินแห่งความรักและการให้อภัย ช่วยปลอบประโลมจิตใจ เสริมเสน่ห์ และดึงดูดพลังงานความสัมพันธ์ที่ดี",
      price: 790.00,
      originalPrice: 990.00,
      type: "READY_TO_SHIP",
      leadTimeDays: 0,
      category: "BRACELET",
      stock: 18,
      wristSizeMin: 14.5,
      wristSizeMax: 18.5,
      rating: 5.0,
      reviewCount: 21,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600", position: 0 },
        ],
      },
    },
  });

  // Product 4: Citrine Wealth & Prosperity (Ready to ship - Shop 2)
  const prod4 = await prisma.product.create({
    data: {
      shopId: shop2.id,
      name: "Citrine Golden Wealth Bracelet",
      description: "หินซิทรินสีเหลืองน้ำผึ้งธรรมชาติ หินแห่งความมั่งคั่งและโชคลาภทางการเงิน ดึงดูดความเจริญรุ่งเรือง เหมาะสำหรับผู้ค้าขายและนักลงทุน",
      price: 1250.00,
      originalPrice: 1650.00,
      type: "READY_TO_SHIP",
      leadTimeDays: 0,
      category: "BRACELET",
      stock: 10,
      wristSizeMin: 15.0,
      wristSizeMax: 19.0,
      rating: 4.9,
      reviewCount: 8,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600", position: 0 },
        ],
      },
    },
  });

  // Product 5: Minimalist Silver Anklet (Ready to ship - Shop 3)
  const prod5 = await prisma.product.create({
    data: {
      shopId: shop3.id,
      name: "Minimalist Silver Beach Anklet",
      description: "สร้อยข้อเท้าเงินแท้ดีไซน์มินิมอล เส้นเรียบหรูทนทาน ใส่ลุยน้ำลุยทะเลได้สบายๆ ไม่ลอกไม่ดำ",
      price: 490.00,
      originalPrice: 690.00,
      type: "READY_TO_SHIP",
      leadTimeDays: 0,
      category: "ANKLET",
      stock: 30,
      wristSizeMin: 20.0,
      wristSizeMax: 26.0,
      rating: 4.8,
      reviewCount: 12,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600", position: 0 },
        ],
      },
    },
  });

  // Product 6: Custom Shell Anklet (Made to order - Shop 3)
  const prod6 = await prisma.product.create({
    data: {
      shopId: shop3.id,
      name: "Custom Boho Shell & Bead Anklet",
      description: "สร้อยข้อเท้าเชือกถักตกแต่งด้วยเปลือกหอยเบี้ยธรรมชาติและลูกปัดสีคราม สไตล์โบฮีเมียน สามารถสั่งทำตามขนาดรอบข้อเท้าได้",
      price: 320.00,
      originalPrice: 420.00,
      type: "MADE_TO_ORDER",
      leadTimeDays: 5,
      category: "ANKLET",
      stock: 0,
      wristSizeMin: 19.0,
      wristSizeMax: 28.0,
      rating: 4.7,
      reviewCount: 15,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600", position: 0 },
        ],
      },
      customOptions: {
        create: [
          {
            name: "ขนาดรอบข้อเท้า (Anklet Size)",
            isRequired: true,
            values: {
              create: [
                { value: "21 cm", priceAdjustment: 0.00 },
                { value: "22 cm", priceAdjustment: 0.00 },
                { value: "23 cm", priceAdjustment: 0.00 },
                { value: "24 cm", priceAdjustment: 0.00 },
                { value: "25 cm", priceAdjustment: 0.00 },
              ],
            },
          },
        ],
      },
    },
  });

  // 7. Seed Sample Multi-Vendor Orders & SubOrders
  console.log("📦 Seeding Sample Orders & SubOrders (Split Order Workflow)...");

  // Order 1: Completed Multi-Vendor Order (Customer Folk bought from Shop 1 and Shop 2)
  const order1 = await prisma.order.create({
    data: {
      userId: buyerUser1.id,
      status: "COMPLETED",
      totalPrice: 1730.00, // 890 (prod1) + 790 (prod3) + 50 (shipping)
      shippingAddress: "123/45 สุขุมวิท 22 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
      recipientName: "ภานุพัตถ์ ใจดี",
      recipientPhone: "0812345678",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      payment: {
        create: {
          amount: 1730.00,
          paymentMethod: "PROMPTPAY",
          status: "SUCCESS",
          omiseChargeId: "chg_test_sample123",
          paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        },
      },
      shipping: {
        create: {
          carrier: "Flash Express",
          trackingNumber: "TH0123456789BKK",
          status: "DELIVERED",
          shippedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
          deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        },
      },
    },
  });

  // SubOrder 1 for Shop 1
  const subOrder1 = await prisma.subOrder.create({
    data: {
      orderId: order1.id,
      shopId: shop1.id,
      subOrderNumber: "SUB-" + order1.id.slice(0, 8) + "-01",
      status: "COMPLETED",
      subtotal: 890.00,
      shippingFee: 30.00,
      commissionRate: 0.05,
      commissionAmount: 44.50,
      netAmount: 875.50, // (890 - 44.5) + 30
      carrier: "Flash Express",
      trackingNumber: "TH0123456789BKK",
      shippedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    },
  });

  const orderItem1 = await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      subOrderId: subOrder1.id,
      productId: prod1.id,
      quantity: 1,
      price: 890.00,
      customDetails: [{ option: "Wrist Size", value: "16 cm" }],
    },
  });

  // SubOrder 2 for Shop 2
  const subOrder2 = await prisma.subOrder.create({
    data: {
      orderId: order1.id,
      shopId: shop2.id,
      subOrderNumber: "SUB-" + order1.id.slice(0, 8) + "-02",
      status: "COMPLETED",
      subtotal: 790.00,
      shippingFee: 20.00,
      commissionRate: 0.05,
      commissionAmount: 39.50,
      netAmount: 770.50,
      carrier: "ไปรษณีย์ไทย (EMS)",
      trackingNumber: "ED123456789TH",
      shippedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    },
  });

  const orderItem2 = await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      subOrderId: subOrder2.id,
      productId: prod3.id,
      quantity: 1,
      price: 790.00,
    },
  });

  // Order 2: In-Progress Order (Made-to-order being produced by Shop 1)
  const order2 = await prisma.order.create({
    data: {
      userId: buyerUser2.id,
      status: "PAID",
      totalPrice: 400.00,
      shippingAddress: "99/111 คอนโดริเวอร์วิว ถนนรัตนาธิเบศร์ นนทบุรี 11000",
      recipientName: "อลิสา สมหวัง",
      recipientPhone: "0899887766",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      payment: {
        create: {
          amount: 400.00,
          paymentMethod: "CREDIT_CARD",
          status: "SUCCESS",
          omiseChargeId: "chg_test_card999",
          paidAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        },
      },
    },
  });

  const subOrder3 = await prisma.subOrder.create({
    data: {
      orderId: order2.id,
      shopId: shop1.id,
      subOrderNumber: "SUB-" + order2.id.slice(0, 8) + "-01",
      status: "PRODUCING", // กำลังผลิตสินค้าสั่งทำ
      subtotal: 350.00,
      shippingFee: 50.00,
      commissionRate: 0.05,
      commissionAmount: 17.50,
      netAmount: 382.50,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      subOrderId: subOrder3.id,
      productId: prod2.id,
      quantity: 1,
      price: 350.00,
      customDetails: [
        { option: "ขนาดข้อมือ (Wrist Size)", value: "15 cm" },
        { option: "สีเชือกถัก (Cord Color)", value: "สีแดงมงคล (Lucky Red)" },
      ],
    },
  });

  // 8. Seed Reviews & Ratings
  console.log("⭐ Seeding Sample Reviews & Ratings...");
  await prisma.review.create({
    data: {
      userId: buyerUser1.id,
      productId: prod1.id,
      orderItemId: orderItem1.id,
      rating: 5,
      comment: "สวยมากครับ หินนิลดำของจริงเงาวับ น้ำหนักกำลังดี ใส่แล้วเท่มากๆ ส่งไวแพ็คมาอย่างดีเลยครับ ⭐⭐⭐⭐⭐",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=400" },
        ],
      },
    },
  });

  await prisma.review.create({
    data: {
      userId: buyerUser1.id,
      productId: prod3.id,
      orderItemId: orderItem2.id,
      rating: 5,
      comment: "หินโรสควอตซ์สีชมพูหวานละมุนมากกก ตรงปกสุดๆ แฟนชอบมากค่ะ แนะนำร้านนี้เลย คุ้มค่าราคามาก 💖",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=400" },
        ],
      },
    },
  });

  // 9. Seed Payout Requests & Shop Transactions
  console.log("💳 Seeding Payout Requests & Financial Ledgers...");
  await prisma.shopTransaction.create({
    data: {
      shopId: shop1.id,
      subOrderId: subOrder1.id,
      type: "SALE",
      amount: 875.50,
      description: `ยอดขายสุทธิจากคำสั่งซื้อ ${subOrder1.subOrderNumber} (หัก GP 5% แล้ว)`,
    },
  });

  await prisma.shopTransaction.create({
    data: {
      shopId: shop2.id,
      subOrderId: subOrder2.id,
      type: "SALE",
      amount: 770.50,
      description: `ยอดขายสุทธิจากคำสั่งซื้อ ${subOrder2.subOrderNumber} (หัก GP 5% แล้ว)`,
    },
  });

  // Payout request 1 (Transferred)
  await prisma.payoutRequest.create({
    data: {
      shopId: shop1.id,
      amount: 5000.00,
      fee: 0.00,
      netAmount: 5000.00,
      bankName: "ธนาคารกสิกรไทย",
      bankAccountNumber: "012-3-45678-9",
      bankAccountName: "นายธนวัฒน์ ศิลปะช่าง",
      status: "TRANSFERRED",
      proofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400",
      processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  });

  // Payout request 2 (Pending for Backoffice Testing!)
  await prisma.payoutRequest.create({
    data: {
      shopId: shop2.id,
      amount: 3000.00,
      fee: 0.00,
      netAmount: 3000.00,
      bankName: "ธนาคารไทยพาณิชย์",
      bankAccountNumber: "405-1-23456-7",
      bankAccountName: "นางสาววารินทร์ หินนำโชค",
      status: "PENDING", // สำหรับทดสอบหน้า Backoffice Approve Payout!
    },
  });

  console.log("🎉 Database Seed Completed Successfully!");
  console.log("-------------------------------------------------------");
  console.log("🔑 Demo Accounts:");
  console.log("  • Backoffice Admin: admin@gmail.com / password");
  console.log("  • Backoffice Staff: staff@gmail.com / password");
  console.log("  • Customer (Buyer): folk@gmail.com / password");
  console.log("  • Seller (Shop 1):  seller1@gmail.com / password");
  console.log("  • Seller (Shop 2):  seller2@gmail.com / password");
  console.log("  • Seller (Shop 3):  seller3@gmail.com / password");
  console.log("  • Pending Seller:   seller_pending@gmail.com / password");
  console.log("-------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

