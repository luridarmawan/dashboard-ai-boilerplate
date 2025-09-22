import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODULES_DIR = path.join(__dirname, '..', process.env.VITE_MODULES_DIR);

const LINE = '\n-- ====================================================================================';

const TABLE_PREFIX = process.env.TABLE_PREFIX || '';

// Path to the migration file
const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20250504050505_init', 'migration.sql');

// Path to the main SQL file
const mainSqlPath = path.join(__dirname, '..', 'prisma', 'db.sql');

console.log(``);
console.log(`Generating migration with TABLE_PREFIX: "${TABLE_PREFIX}"`);

// Read the base migration content from the main SQL file
let baseMigrationContent = fs.readFileSync(mainSqlPath, 'utf8');
// Replace the TABLE_PREFIX placeholder with the actual prefix
baseMigrationContent = baseMigrationContent.replace(/\$\{TABLE_PREFIX\}/g, TABLE_PREFIX);
// Write the generated migration
fs.writeFileSync(migrationPath, baseMigrationContent);

// Combine DB files
console.log(``);
console.log('👉 Combine DB files');
const dbFiles = glob.sync('**/db.sql', {
  cwd: MODULES_DIR,
  absolute: true
});
if (dbFiles.length === 0) {
  console.log('⚠️  No db.sql file found in module directory');
}
for (const dbFile of dbFiles) {
  const modulePath = path.dirname(dbFile);
  const moduleName = modulePath.split(path.sep).slice(-2)[0];
  const modMigrationPath = path.join(__dirname, '..', 'prisma', 'migrations', formatTimestamp() + '_mod_' + moduleName);
  const modMigrationFilePath = path.join(modMigrationPath, 'migration.sql');
  fs.mkdirSync(modMigrationPath, { recursive: true });

  let schemaContent = LINE;
  schemaContent += `\n-- Module: ${moduleName}`;
  schemaContent += `\n-- ${dbFile}`;
  schemaContent += LINE;
  const dbContent = fs.readFileSync(dbFile, 'utf8');
  schemaContent += `\n` + dbContent;
  schemaContent = schemaContent.replace(/\$\{TABLE_PREFIX\}/g, TABLE_PREFIX);
  fs.writeFileSync(modMigrationFilePath, schemaContent);

  console.log(`   ✅ DB File Added: ${moduleName}`);
}

console.log('');
console.log('🆗 Migration file updated successfully!');
console.log(`📁 Migration written to: ${migrationPath}`);


function formatTimestamp(date = new Date(), { utc = false } = {}) {
  const d = date;

  const get = utc
    ? {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        second: d.getUTCSeconds(),
        ms: d.getUTCMilliseconds(),
      }
    : {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
        ms: d.getMilliseconds(),
      };

  const p2 = (n) => String(n).padStart(2, "0");
  const p3 = (n) => String(n).padStart(3, "0");

  return `${get.year}${p2(get.month)}${p2(get.day)}${p2(get.hour)}${p2(get.minute)}${p2(get.second)}${p3(get.ms)}`;
}

