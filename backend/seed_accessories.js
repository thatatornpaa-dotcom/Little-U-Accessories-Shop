import "dotenv/config";
import { prisma } from "./src/lib/db";

async function main() {
  console.log("🧹 Clearing old categories and accessories...");
  // Cascade delete will clean up related records
  await prisma.category.deleteMany({});
  await prisma.accessory.deleteMany({});
  await prisma.productAccessory.deleteMany({});
  await prisma.customOption.deleteMany({});
  await prisma.customOptionValue.deleteMany({});

  console.log("🌱 Seeding Categories...");
  const categories = [
    { name: "CHARM", description: "จี้ประดับตกแต่งเสริมมงคลและสไตล์เฉพาะบุคคล" },
    { name: "BEAD", description: "ลูกปัดหินนำโชค หินสีธรรมชาติเพื่อความเป็นสิริมงคล" },
    { name: "CORD", description: "เชือกถัก เชือกเทียน หรือสายหนังถักสำหรับขึ้นโครงสร้อย" },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const createdCat = await prisma.category.create({ data: cat });
    categoryMap[cat.name] = createdCat.id;
    console.log(`✅ Created Category: ${createdCat.name}`);
  }

  console.log("🌱 Seeding Accessories with images...");
  const accessoriesData = [
    // CHARM Category
    {
      name: "จี้แมวกวักนำโชค (Lucky Cat)",
      description: "จี้แมวกวักเซรามิกญี่ปุ่น นำโชคลาภ การเงิน และความมั่งคั่ง",
      price: 120.00,
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-159643478518-a784e5dc4c8f?q=80&w=300",
      categoryName: "CHARM"
    },
    {
      name: "จี้รูปหัวใจเงินแท้ (Silver Heart)",
      description: "จี้รูปหัวใจทำจากเงินแท้ 925 เสริมเสน่ห์ความรักอันบริสุทธิ์",
      price: 150.00,
      stock: 80,
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=300",
      categoryName: "CHARM"
    },
    {
      name: "จี้รูปดาวทองคำ (Golden Star)",
      description: "จี้ดาวชุบทองคำแท้ 18K นำทางความสำเร็จและความสมหวัง",
      price: 180.00,
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300",
      categoryName: "CHARM"
    },

    // BEAD Category
    {
      name: "หินนิลดำ (Black Onyx)",
      description: "หินนำโชคสีดำวาว ช่วยปกป้องคุ้มครองและเสริมความมุ่งมั่นสะกดอารมณ์",
      price: 50.00,
      stock: 200,
      imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=300",
      categoryName: "BEAD"
    },
    {
      name: "หินโรสควอตซ์ (Rose Quartz)",
      description: "หินสีชมพูละมุน หินแห่งความรัก การให้อภัย และเสน่ห์อ่อนหวาน",
      price: 60.00,
      stock: 150,
      imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300",
      categoryName: "BEAD"
    },
    {
      name: "หินเทอร์ควอยส์ (Turquoise)",
      description: "หินสีฟ้าสดใส เสริมการสื่อสาร การเจรจาธุรกิจ และความปลอดภัยการเดินทาง",
      price: 70.00,
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300",
      categoryName: "BEAD"
    },

    // CORD Category
    {
      name: "เชือกถักสีดำ (Black Wax Cord)",
      description: "เชือกเทียนสีดำสนิท มีความเหนียวทนทาน กันน้ำได้ดี",
      price: 80.00,
      stock: 150,
      imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=300",
      categoryName: "CORD"
    },
    {
      name: "เชือกถักสีแดงมงคล (Red Wax Cord)",
      description: "เชือกเทียนถักสีแดงสด เสริมพลังบวก โชคลาภ และความรักสมหวัง",
      price: 80.00,
      stock: 120,
      imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=300",
      categoryName: "CORD"
    },
    {
      name: "หนังถักสีน้ำตาล (Brown Leather Cord)",
      description: "หนังถักแท้สีน้ำตาลพรีเมียม ลุคเท่สปอร์ต คลาสสิกมีสไตล์",
      price: 150.00,
      stock: 60,
      imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=300",
      categoryName: "CORD"
    }
  ];

  const createdAccessories = [];
  for (const acc of accessoriesData) {
    const { categoryName, ...rest } = acc;
    const createdAcc = await prisma.accessory.create({
      data: {
        ...rest,
        categoryId: categoryMap[categoryName]
      }
    });
    createdAccessories.push(createdAcc);
    console.log(`✅ Created Accessory: ${createdAcc.name} in Category ${categoryName}`);
  }

  console.log("🌱 Fetching MADE_TO_ORDER Products to link options & accessories...");
  const customProducts = await prisma.product.findMany({
    where: { type: "MADE_TO_ORDER" }
  });

  if (customProducts.length === 0) {
    console.log("⚠️ No MADE_TO_ORDER products found. Please run seed_products.js first.");
  } else {
    for (const prod of customProducts) {
      // 1. Create Custom Options based on Bracelet vs Anklet category (Sizes)
      if (prod.category === "BRACELET") {
        const option = await prisma.customOption.create({
          data: {
            productId: prod.id,
            name: "ขนาดข้อมือ (Wrist Size)",
            isRequired: true
          }
        });

        // Add size values without images (text option only)
        const sizes = [
          { value: "14 cm", priceAdjustment: 0.00 },
          { value: "15 cm", priceAdjustment: 0.00 },
          { value: "16 cm", priceAdjustment: 0.00 },
          { value: "17 cm", priceAdjustment: 10.00 },
          { value: "18 cm", priceAdjustment: 20.00 }
        ];

        for (const size of sizes) {
          await prisma.customOptionValue.create({
            data: {
              optionId: option.id,
              value: size.value,
              priceAdjustment: size.priceAdjustment
            }
          });
        }
        console.log(`✅ Seeded Wrist Sizes for product: ${prod.name}`);

        // Add Material Option
        const matOption = await prisma.customOption.create({
          data: {
            productId: prod.id,
            name: "วัสดุสายรัด (Material)",
            isRequired: true
          }
        });

        const materials = [
          { value: "เชือกถักธรรมดา", priceAdjustment: 0.00 },
          { value: "หนังแท้พรีเมียม", priceAdjustment: 50.00 }
        ];

        for (const mat of materials) {
          await prisma.customOptionValue.create({
            data: {
              optionId: matOption.id,
              value: mat.value,
              priceAdjustment: mat.priceAdjustment
            }
          });
        }
        console.log(`✅ Seeded Material options for product: ${prod.name}`);

      } else if (prod.category === "ANKLET") {
        const option = await prisma.customOption.create({
          data: {
            productId: prod.id,
            name: "ขนาดข้อเท้า (Ankle Size)",
            isRequired: true
          }
        });

        // Add size values without images
        const sizes = [
          { value: "20 cm", priceAdjustment: 0.00 },
          { value: "21 cm", priceAdjustment: 0.00 },
          { value: "22 cm", priceAdjustment: 0.00 },
          { value: "23 cm", priceAdjustment: 15.00 },
          { value: "24 cm", priceAdjustment: 30.00 }
        ];

        for (const size of sizes) {
          await prisma.customOptionValue.create({
            data: {
              optionId: option.id,
              value: size.value,
              priceAdjustment: size.priceAdjustment
            }
          });
        }
        console.log(`✅ Seeded Ankle Sizes for product: ${prod.name}`);
      }

      // 2. Link all accessories as permitted for this product (ProductAccessory mapping)
      for (const acc of createdAccessories) {
        await prisma.productAccessory.create({
          data: {
            productId: prod.id,
            accessoryId: acc.id
          }
        });
      }
      console.log(`✅ Permitted all ${createdAccessories.length} accessories for product: ${prod.name}`);
    }
  }

  console.log("🎉 Database seeding for Accessories & Categories completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
