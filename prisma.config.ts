// prisma.config.ts
import path from "node:path";
import "dotenv/config";              // <-- .env TIDAK otomatis diload tanpa ini
import { defineConfig } from "prisma/config";

export default defineConfig({
  // arahkan ke file schema kamu saat ini
  schema: path.join("prisma", "generated-schema.prisma"),
  // opsional: atur lokasi migrations & seed
  migrations: {
    path: path.join("prisma", "migrations"),
    // seed: "tsx prisma/seed.ts",
  },
});
