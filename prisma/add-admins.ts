import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off script to add/reset the pilot admin accounts. Edit the list below
// before running against a new environment.
const NEW_ADMINS = [
  { username: "admin1", name: "Admin User 1", password: "csmadmin1" },
  { username: "admin2", name: "Admin User 2", password: "csmadmin2" },
] as const;

async function main() {
  for (const { username, name, password } of NEW_ADMINS) {
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      await prisma.adminUser.update({ where: { username }, data: { passwordHash, name } });
      console.log(`Updated admin user: ${username} / ${password}`);
      continue;
    }

    await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        name,
        role: "ADMIN",
      },
    });

    console.log(`Created admin user: ${username} / ${password}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
