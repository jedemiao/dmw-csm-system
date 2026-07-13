import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Division } from "../lib/constants/divisions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off script to add/reset admin accounts. Edit the list below before
// running against a new environment. Passwords are never hardcoded here: each
// account reads its password from an env var, falling back to a random
// generated one printed once at creation time (same pattern as prisma/seed.ts).
// `division: null` means an oversight admin who sees/manages all 4 divisions;
// each division account below is scoped to only that division's data.
const NEW_ADMINS: Array<{ username: string; name: string; envVar: string; division: Division | null }> = [
  { username: "admin", name: "Oversight Admin", envVar: "ADMIN_PASSWORD", division: null },
  { username: "fad", name: "FAD Admin", envVar: "FAD_PASSWORD", division: "FAD" },
  { username: "mwptd", name: "MWPtD Admin", envVar: "MWPTD_PASSWORD", division: "MWPTD" },
  { username: "mwpsd", name: "MWPsD Admin", envVar: "MWPSD_PASSWORD", division: "MWPSD" },
  { username: "wrsd", name: "WRSD Admin", envVar: "WRSD_PASSWORD", division: "WRSD" },
];

async function main() {
  for (const { username, name, envVar, division } of NEW_ADMINS) {
    const fromEnv = process.env[envVar];
    const password = fromEnv ?? crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);
    const note = fromEnv ? `(password taken from ${envVar})` : `/ ${password} (generated — save this now, it will not be shown again)`;

    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      await prisma.adminUser.update({ where: { username }, data: { passwordHash, name, division } });
      console.log(`Updated admin user: ${username} ${note}`);
      continue;
    }

    await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        name,
        role: "ADMIN",
        division,
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
