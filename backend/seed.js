import "dotenv/config";
import { prisma } from "./src/lib/db";


async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = await Bun.password.hash("password", {
    algorithm: "bcrypt",
    cost: 10,
  });

  const admin = await prisma.employee.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      password: adminPassword,
      firstName: "Admin",
      lastName: "System",
      role: "admin",
    },
    create: {
      email: "admin@gmail.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "System",
      role: "admin",
    },
  });

  const staffPassword = await Bun.password.hash("password", {
    algorithm: "bcrypt",
    cost: 10,
  });
  const staff = await prisma.employee.upsert({
    where: { email: "staff@gmail.com" },
    update: {
      password: staffPassword,
      firstName: "Staff",
      lastName: "One",
      role: "staff",
    },
    create: {
      email: "staff@gmail.com",
      password: staffPassword,
      firstName: "Staff",
      lastName: "One",
      role: "staff",
    },
  });

  console.log("✅ Seed completed:", { admin: admin.email, staff: staff.email });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
