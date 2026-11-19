import "dotenv/config";
import { prisma } from "./src/lib/db";

async function main() {
  const id = "dc6ea417-5aed-4c22-8b16-c5e0f010b7f1";
  
  // Let's find accessories
  const accessories = await prisma.accessory.findMany({ take: 3 });
  const selectedIds = accessories.map(a => a.id);
  console.log("Selected Accessory IDs to link:", selectedIds);

  const images = [
    "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
  ];

  const cleanedData = {
    name: "Hematite Energy Anklet",
    description: "สร้อยข้อเท้าหินเฮมาไทต์ ช่วยฟื้นฟูความเหนื่อยล้าของเรียวขาและปรับสมดุลธาตุในร่างกาย",
    price: 199,
    originalPrice: null,
    type: "MADE_TO_ORDER",
    category: "BRACELET",
    stock: 0
  };

  try {
    console.log("Starting Prisma Transaction...");
    const updated = await prisma.$transaction(async (tx) => {
      console.log("Deleting old images...");
      await tx.productImage.deleteMany({ where: { productId: id } });

      console.log("Deleting old accessories...");
      await tx.productAccessory.deleteMany({ where: { productId: id } });
      
      console.log("Creating new accessories links...");
      if (selectedIds.length > 0) {
        const createdLinks = await tx.productAccessory.createMany({
          data: selectedIds.map(accId => ({
            productId: id,
            accessoryId: accId
          }))
        });
        console.log("Created links count:", createdLinks.count);
      }

      console.log("Updating product...");
      return await tx.product.update({
        where: { id },
        data: {
          ...cleanedData,
          images: {
            create: images.map((url, position) => ({
              url,
              position,
            }))
          }
        },
        include: { 
          images: true, 
          customOptions: { include: { values: true } }, 
          accessories: { include: { accessory: true } } 
        }
      });
    });

    console.log("Transaction SUCCEEDED!");
    console.log("Updated product accessories count in DB:", updated.accessories.length);
    console.log("Accessories details:", JSON.stringify(updated.accessories, null, 2));

  } catch (error) {
    console.error("Transaction FAILED with error:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
