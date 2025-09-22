import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import dotenv from 'dotenv';

dotenv.config();

const TABLE_PREFIX = process.env.TABLE_PREFIX || '';
const LINE = '\n// ====================================================================================';

// Get current directory equivalent for ES modules
import { fileURLToPath } from 'url';
import Module from 'module';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODULES_DIR = path.join(__dirname, '..', process.env.VITE_MODULES_DIR);

// Read the base schema template
// const schemaTemplatePath = path.join(__dirname, '..', 'prisma', 'schema.template.prisma');
const schemaMasterPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaOutputPath = path.join(__dirname, '..', 'prisma', 'generated-schema.prisma');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema');

// Create base schema content with only generator and datasource
let baseSchemaContent = `
// ⚡️ Auto-generated Prisma schema - hands off!
// This beauty was crafted by our schema generator ✨
// Want changes? Work your magic in: "scripts/generate-schema.js"
// Please edit original file "prisma/schema.prisma"

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

// Combine prisma schema files
console.log(`👉 Modules directory:`, MODULES_DIR);
const schemaFiles = glob.sync('**/schema.prisma', {
  cwd: MODULES_DIR,
  absolute: true
});
if (schemaFiles.length === 0) {
  console.log('⚠️  No schema.prisma file found in module directory');
}

// Replace TABLE_PREFIX placeholder with actual prefix
baseSchemaContent = baseSchemaContent.replace(/\$\{TABLE_PREFIX\}/g, TABLE_PREFIX);

console.log(``);
console.log(`👉 Generating Prisma schema with TABLE_PREFIX: "${TABLE_PREFIX}"`);

// checkpoint 1
// Combine all schema files from prisma/schema directory
const schemaDir = path.join(__dirname, '..', 'prisma', 'schema');
const allSchemaFiles = glob.sync('*.prisma', {
  cwd: schemaDir,
  absolute: true
});

let combinedSchemaContent = baseSchemaContent;

// Add content from all schema files except base.prisma (already included in baseSchemaContent)
for (const schemaFile of allSchemaFiles) {
  const fileName = path.basename(schemaFile);
  if (fileName !== 'base.prisma') {
    let schemaContent = fs.readFileSync(schemaFile, 'utf8');
    schemaContent = schemaContent.replace(/\$\{TABLE_PREFIX\}/g, TABLE_PREFIX);
    combinedSchemaContent += '\n\n' + schemaContent;
  }
}
// checkpoint 1 end

for (const schemaFile of schemaFiles) {
  const modulePath = path.dirname(schemaFile);
  // const moduleName = modulePath.split(path.sep).pop();
  const moduleName = modulePath.split(path.sep).slice(-3)[0];
  const modSchemaOutputPath = path.join(__dirname, '..', 'prisma', 'schema', 'mod_' + moduleName + '.prisma');

  let schemaContent = LINE;
  schemaContent += `\n// ${moduleName}`;
  schemaContent += LINE;
  schemaContent += '\n' + fs.readFileSync(schemaFile, 'utf8');
  schemaContent = schemaContent.replace(/\$\{TABLE_PREFIX\}/g, TABLE_PREFIX);
  schemaContent = schemaContent.replace(/\$\{MODULE_NAME\}/g, moduleName);

  combinedSchemaContent += '\n' + schemaContent;

  // fs.writeFileSync(modSchemaOutputPath, schemaContent);
  console.log(`   ✅ Module Schema Added: ${moduleName}`);
}

// Write the generated schema
fs.writeFileSync(schemaOutputPath, combinedSchemaContent);

console.log('   🆗 Prisma schema generated successfully!');
console.log(`   📁 Schema written to: ${schemaOutputPath}`);
console.log(``);