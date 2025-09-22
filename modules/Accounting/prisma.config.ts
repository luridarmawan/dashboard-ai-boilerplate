/**
 * npm exec prisma -- --config ./api/modules/example/prisma.config.ts migrate dev --name init_example
 */

import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema"),
  migrations: { 
    path: path.join(__dirname, "prisma", "migrations")
    // (opsional) seed modul ini
    // seed: "tsx modules/example/prisma/seed.ts",
    // (opsional) bantu shadow DB memahami struktur eksternal
    // initShadowDb: `CREATE TABLE public.users (id uuid primary key);`
  },
  // Abaikan tabel modul lain (opsional, aktifkan experimental externalTables)
  experimental: { externalTables: true },
  tables: {
    external: [
      "public.app_users",          // contoh: tabel lain yang tidak dimigrasikan modul ini
      "public.app_password_reset_tokens",             // contoh kalau modul MCP pakai schema "mcp"
    ],
  },
});
