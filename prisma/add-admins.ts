import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off script to add/reset the pilot admin accounts. Edit the list below
// before running against a new environment. Passwords are never hardcoded here:
// each account reads its password from an env var, falling back to a random
// generated one printed once at creation time (same pattern as prisma/seed.ts).
const NEW_ADMINS = [
  { username: "admin1", name: "Admin User 1", envVar: "ADMIN1_PASSWORD" },
  { username: "admin2", name: "Admin User 2", envVar: "ADMIN2_PASSWORD" },
] as const;

async function main() {
  for (const { username, name, envVar } of NEW_ADMINS) {
    const fromEnv = process.env[envVar];
    const password = fromEnv ?? crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);
    const note = fromEnv ? `(password taken from ${envVar})` : `/ ${password} (generated — save this now, it will not be shown again)`;

    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      await prisma.adminUser.update({ where: { username }, data: { passwordHash, name } });
      console.log(`Updated admin user: ${username} ${note}`);
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

    console.log(`Created admin user: ${username} ${note}`);
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
