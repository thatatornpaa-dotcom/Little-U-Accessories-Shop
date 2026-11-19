import "dotenv/config";
import { prisma } from "./src/lib/db";

const PRODUCTS_DATA = [
  // BRACELETS (15 items)
  {
    name: "Classic Black Onyx Bracelet",
    description: "สร้อยข้อมือหินนิลดำผิวมันวาว ช่วยเสริมความมุ่งมั่นและป้องกันพลังงานลบ เหมาะสำหรับใส่ได้ในทุกๆ วัน",
    price: 890.00,
    originalPrice: 1290.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Turquoise Bead Bracelet",
    description: "สร้อยข้อมือหินเทอร์ควอยส์สีฟ้าสดใส เสริมพลังด้านการเจรจา การปกป้องคุ้มครองระหว่างการเดินทาง",
    price: 950.00,
    originalPrice: null,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Custom Minimalist Wax Cord",
    description: "สร้อยข้อมือเชือกเทียนถักสไตล์มินิมอล สามารถเลือกสีเชือกและจี้ตกแต่งในแบบที่คุณต้องการได้เอง",
    price: 350.00,
    originalPrice: 450.00,
    type: "MADE_TO_ORDER",
    category: "BRACELET",
    stock: 0,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Rose Quartz Love Bracelet",
    description: "หินโรสควอตซ์สีชมพูพาสเทล หินแห่งความรักและการให้อภัย ช่วยปลอบประโลมจิตใจและเสริมเสน่ห์",
    price: 790.00,
    originalPrice: 990.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Lava Stone Aromatherapy Bracelet",
    description: "สร้อยข้อมือหินลาวาผิวด้านสีดำเข้มขรึม สามารถหยดน้ำมันหอมระเหยเพื่อให้กลิ่นหอมผ่อนคลายตลอดวัน",
    price: 690.00,
    originalPrice: null,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Tiger's Eye Protection Bracelet",
    description: "หินไทเกอร์อายลายไม้สวยงาม เสริมความกล้าหาญ ป้องกันภัยอันตราย และช่วยกระตุ้นการตัดสินใจที่เฉียบคม",
    price: 890.00,
    originalPrice: 1190.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Amethyst Spiritual Charm",
    description: "หินอเมทิสต์สีม่วงเข้ม นำพาความสงบในจิตใจ ช่วยลดความเครียดและเพิ่มสมาธิในการทำงาน",
    price: 990.00,
    originalPrice: 1390.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Custom double-row Leather Bracelet",
    description: "สร้อยข้อมือหนังแท้ถักสองเส้นคู่ลุคเท่ๆ สไตล์โบฮีเมียน สามารถเลือกสลักชื่อหรือคำพิเศษบนแผ่นโลหะได้",
    price: 1290.00,
    originalPrice: 1590.00,
    type: "MADE_TO_ORDER",
    category: "BRACELET",
    stock: 0,
    imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Hematite Grounding Bracelet",
    description: "หินเฮมาไทต์สีเงินวาวเมทัลลิก ช่วยปรับสมดุลพลังงานในร่างกาย เพิ่มความมั่นคงทางอารมณ์และลดความเหนื่อยล้า",
    price: 590.00,
    originalPrice: null,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Lapis Lazuli Wisdom Bracelet",
    description: "หินลาพิสลาซูลีสีน้ำเงินเข้มปนทอง เสริมสร้างสติปัญญา ความคิดสร้างสรรค์ และความจริงใจในการสื่อสาร",
    price: 1150.00,
    originalPrice: 1450.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Malachite Growth Bracelet",
    description: "หินมาลาไคต์สีเขียวลายริ้วสวยแปลกตา หินแห่งการเปลี่ยนผ่านและการเติบโต ช่วยขจัดพลังงานด้านลบ",
    price: 1390.00,
    originalPrice: 1890.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Custom Macrame Bead Bracelet",
    description: "สร้อยข้อมือเชือกถักสไตล์ถักปมโบราณ ผสมผสานหินมงคลที่คุณชื่นชอบ เลือกจำนวนเม็ดหินและสีเชือกได้ตามใจ",
    price: 490.00,
    originalPrice: null,
    type: "MADE_TO_ORDER",
    category: "BRACELET",
    stock: 0,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "White Howlite Peace Bracelet",
    description: "หินฮาวไลต์สีขาวลายเทา ช่วยระงับความโกรธ ความฟุ้งซ่าน ทำให้จิตใจสงบเยือกเย็นและหลับสนิทขึ้น",
    price: 750.00,
    originalPrice: 950.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Citrine Wealth Bracelet",
    description: "หินซิทรินสีเหลืองน้ำผึ้งใสสะอาด หินแห่งความมั่งคั่งและโชคลาภ ช่วยดึงดูดความสำเร็จและพลังบวก",
    price: 1250.00,
    originalPrice: 1650.00,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Carnelian Vitality Bracelet",
    description: "หินคาร์เนเลียนสีส้มแสดประกายแสงแดด ช่วยเพิ่มพูนความมั่นใจ พลังกาย พลังใจ และแรงผลักดันในการทำงาน",
    price: 850.00,
    originalPrice: null,
    type: "READY_TO_SHIP",
    category: "BRACELET",
    stock: 19,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600&auto=format&fit=crop"
  },

  // ANKLETS (10 items)
  {
    name: "Minimalist Silver Anklet",
    description: "สร้อยข้อเท้าเงินแท้ดีไซน์มินิมอล เส้นเรียบหรูทนทาน ใส่ลุยน้ำลุยทะเลได้สบายๆ",
    price: 490.00,
    originalPrice: 690.00,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Freshwater Pearl Anklet",
    description: "สร้อยข้อเท้าไข่มุกน้ำจืดแท้ เสริมลุคหวานละมุนสายธรรมชาติ มุกกลมเงางาม",
    price: 790.00,
    originalPrice: null,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Custom Shell Anklet",
    description: "สร้อยข้อเท้าเชือกถักตกแต่งด้วยเปลือกหอยเบี้ยธรรมชาติตามสไตล์โบฮีเมียน สามารถปรับขนาดได้เอง",
    price: 320.00,
    originalPrice: 420.00,
    type: "MADE_TO_ORDER",
    category: "ANKLET",
    stock: 0,
    imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Lucky Turquoise Anklet",
    description: "สร้อยข้อเท้าหินนำโชคเทอร์ควอยส์สีฟ้าคราม สลับลูกปัดเงินแท้ เสริมพลังบวกความโชคดีและมั่นใจ",
    price: 650.00,
    originalPrice: 850.00,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Red Coral Protection Anklet",
    description: "สร้อยข้อเท้าหินปะการังสีแดงสดสะดุดตา ช่วยปกป้องภัยอันตรายและเสริมการไหลเวียนพลังงานที่ดี",
    price: 720.00,
    originalPrice: null,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Gold Plated Bell Anklet",
    description: "สร้อยข้อเท้าชุบทองคำแท้ประดับกระดิ่งจิ๋วเสียงใสมีเสน่ห์ ลายสร้อยละเอียดเรียบร้อย",
    price: 890.00,
    originalPrice: 1190.00,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Hematite Energy Anklet",
    description: "สร้อยข้อเท้าหินเฮมาไทต์ ช่วยฟื้นฟูความเหนื่อยล้าของเรียวขาและปรับสมดุลธาตุในร่างกาย",
    price: 550.00,
    originalPrice: 750.00,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Custom Leather Cord Anklet",
    description: "สร้อยข้อเท้าสายหนังถักสองชั้นสีน้ำตาลเข้ม ลุคเท่สไตล์สปอร์ต เลือกใส่จี้สลักแผ่นเงินได้",
    price: 450.00,
    originalPrice: null,
    type: "MADE_TO_ORDER",
    category: "ANKLET",
    stock: 0,
    imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Rose Quartz Romance Anklet",
    description: "สร้อยข้อเท้าหินโรสควอตซ์สีชมพูละมุน ช่วยเยียวยาอารมณ์และเสริมเสน่ห์ความรักอันอ่อนโยน",
    price: 690.00,
    originalPrice: 890.00,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Sodalite Clarity Anklet",
    description: "สร้อยข้อเท้าหินโซดาไลต์สีน้ำเงินลายเมฆขาว นำพาความคิดสร้างสรรค์และความคิดที่เป็นระเบียบสงบ",
    price: 590.00,
    originalPrice: null,
    type: "READY_TO_SHIP",
    category: "ANKLET",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop"
  }
];

async function main() {
  console.log("🧹 Clearing old products...");
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});

  console.log("🌱 Seeding 25 products (15 Bracelets, 10 Anklets)...");

  for (const item of PRODUCTS_DATA) {
    const { name, description, price, originalPrice, type, category, stock, imageUrl } = item;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        originalPrice,
        type,
        category,
        stock,
        images: {
          create: [
            {
              url: imageUrl,
              position: 0
            }
          ]
        }
      }
    });

    console.log(`✅ Created ${product.category} product: ${product.name}`);
  }

  console.log("🎉 Seeding products completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding products failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
