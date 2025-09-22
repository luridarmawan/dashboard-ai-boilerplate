// scripts/cleanup.ts
// Delete all folders matching a given pattern inside prisma/migrations
// and remove files matching prisma/schema/<pattern>_*.prisma
// Usage examples:
//   tsx scripts/cleanup.ts
//   tsx scripts/cleanup.ts --pattern tmp
//   tsx scripts/cleanup.ts --dry-run
//   tsx scripts/cleanup.ts --pattern foo --dry-run
//
//   npm run cleanup -- --pattern tmp
//   
//   # Dry run (no deletion, just preview)
//   npm run cleanup -- --dry-run
//   # Custom + dry run
//   npm run cleanup -- --pattern foo --dry-run

import { promises as fs } from "fs";
import path from "path";

// Default values
let PATTERN = "mod";
let DRY_RUN = false;

// Simple CLI args parsing
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--pattern" && args[i + 1]) {
    PATTERN = args[i + 1];
    i++;
  } else if (args[i] === "--dry-run") {
    DRY_RUN = true;
  }
}

const MIGRATIONS_DIR = path.join("prisma", "migrations");
const SCHEMA_DIR = path.join("prisma", "schema");

async function deleteDirectory(targetDir: string) {
  if (DRY_RUN) {
    console.log(`🔍 [dry-run] Would delete folder: ${targetDir}`);
    return;
  }
  try {
    await fs.rm(targetDir, { recursive: true, force: true });
    console.log(`🗑️  Deleted folder: ${targetDir}`);
  } catch (err) {
    console.error(`❌ Failed to delete folder: ${targetDir}`, err);
  }
}

async function traverseAndDeleteDirs(root: string) {
  try {
    // If the folder itself matches the pattern, delete it
    if (path.basename(root).includes(PATTERN)) {
      await deleteDirectory(root);
      return;
    }

    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(root, entry.name);

      if (entry.name.includes(PATTERN)) {
        await deleteDirectory(full);
      } else {
        await traverseAndDeleteDirs(full);
      }
    }
  } catch (err: any) {
    if (err?.code === "ENOENT") return; // folder does not exist, ignore
    console.error(`❌ Error while traversing: ${root}`, err);
  }
}

async function deleteSchemaFiles(schemaDir: string) {
  try {
    const entries = await fs.readdir(schemaDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith(`${PATTERN}_`) && entry.name.endsWith(".prisma")) {
        const full = path.join(schemaDir, entry.name);
        if (DRY_RUN) {
          console.log(`🔍 [dry-run] Would delete file: ${full}`);
          continue;
        }
        try {
          await fs.rm(full, { force: true });
          console.log(`🗑️  Deleted file: ${full}`);
        } catch (err) {
          console.error(`❌ Failed to delete file: ${full}`, err);
        }
      }
    }
  } catch (err: any) {
    if (err?.code === "ENOENT") return; // folder does not exist, ignore
    console.error(`❌ Error reading schema dir: ${schemaDir}`, err);
  }
}

async function main() {
  console.log(`🔍 Looking for folders with *${PATTERN}* in ${MIGRATIONS_DIR}...`);
  await traverseAndDeleteDirs(MIGRATIONS_DIR);
  await deleteSchemaFiles(SCHEMA_DIR);
  console.log(DRY_RUN ? "✅ Dry-run finished!" : "✅ Cleanup finished!");
}

main().catch((e) => {
  console.error("❌ Unexpected error:", e);
  process.exitCode = 1;
});
