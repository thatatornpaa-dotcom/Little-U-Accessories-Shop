import { prisma } from "./src/lib/db.js";

async function main() {
  const email = "folk@gmail.com";
  const password = "password";

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Customer already exists!");
    return;
  }

  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const customer = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: "Folk",
      lastName: "Panupat",
    },
  });

  console.log("Customer seeded successfully:", customer.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
