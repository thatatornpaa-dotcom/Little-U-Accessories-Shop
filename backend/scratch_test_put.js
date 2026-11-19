import "dotenv/config";
import { prisma } from "./src/lib/db";

async function main() {
  const productId = "dc6ea417-5aed-4c22-8b16-c5e0f010b7f1";
  
  // Find some accessories
  const accessories = await prisma.accessory.findMany({ take: 3 });
  console.log("Available accessories in DB:", accessories.map(a => ({ id: a.id, name: a.name })));
  
  if (accessories.length === 0) {
    console.log("No accessories in DB. Please run seed first.");
    return;
  }

  const selectedIds = accessories.slice(1).map(a => a.id);

  console.log("Sending PUT request to local backend...");
  const res = await fetch(`http://localhost:8000/api/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Hematite Energy Anklet",
      price: 199,
      type: "MADE_TO_ORDER",
      category: "BRACELET",
      stock: 0,
      accessories: selectedIds,
      customOptions: [
        {
          name: "ขนาดข้อมือ (Wrist Size)",
          required: true,
          values: [
            { name: "14 cm", priceAdjustment: 0 },
            { name: "15 cm", priceAdjustment: 0 }
          ]
        }
      ]
    })
  });

  const data = await res.json();
  console.log("Response status:", res.status);
  console.log("Response body:", JSON.stringify(data, null, 2));

  // Verify DB
  const updatedProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      accessories: {
        include: {
          accessory: true
        }
      }
    }
  });
  console.log("Updated product in DB:", JSON.stringify(updatedProduct, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
