import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection: `migrate deploy` uses advisory
    // locks that a pgbouncer transaction-pooling connection (our runtime DATABASE_URL)
    // can't support and will hang on indefinitely instead of erroring. The running app
    // still connects via DATABASE_URL (see lib/db.ts) — only the CLI uses DIRECT_URL.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
