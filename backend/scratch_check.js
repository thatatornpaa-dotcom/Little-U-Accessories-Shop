import "dotenv/config";
import { prisma } from "./src/lib/db";

async function main() {
  const productId = "dc6ea417-5aed-4c22-8b16-c5e0f010b7f1";
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      accessories: {
        include: {
          accessory: true
        }
      }
    }
  });

  console.log("=== PRODUCT DETAILS ===");
  console.log(JSON.stringify(product, null, 2));

  const allProductAccessories = await prisma.productAccessory.findMany({
    where: { productId }
  });
  console.log("=== ALL PRODUCT ACCESSORIES ===");
  console.log(allProductAccessories);
}

main().catch(console.error).finally(() => prisma.$disconnect());
