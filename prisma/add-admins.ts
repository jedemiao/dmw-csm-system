import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off script to add the two additional admin accounts. Edit the list
// below with real usernames/names before running, or run as-is to get
// placeholder accounts you can rename later.
const NEW_ADMINS = [
  { username: "admin2", name: "Admin User 2" },
  { username: "admin3", name: "Admin User 3" },
] as const;

async function main() {
  for (const { username, name } of NEW_ADMINS) {
    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      console.log(`Admin user "${username}" already exists, skipping.`);
      continue;
    }

    const password = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        name,
        role: "ADMIN",
      },
    });

    console.log(`Created admin user: ${username} / ${password} (save this now, it will not be shown again)`);
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
