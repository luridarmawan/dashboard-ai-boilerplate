import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Interface untuk input
interface ModuleInput {
  moduleName: string;
  tableName: string;
  installInMainApp: boolean;
}

// Fungsi untuk membuat direktori jika belum ada
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Fungsi untuk mengambil input dari user
async function getInput(): Promise<ModuleInput> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  const moduleName = await question('🔍 Module Name: ');
  const tableName = await question('🔍 Table name: ');
  const installResponse = await question('❓ Install in main app? (y/n): ');
  const installInMainApp = installResponse.toLowerCase() === 'y' || installResponse.toLowerCase() === 'yes';

  if (!moduleName || !tableName) {
    console.log('❌ Module name and table name cannot be empty.');
    rl.close();
    process.exit();
  }

  rl.close();

  return { moduleName, tableName, installInMainApp };
}

// Template untuk file-file yang akan dibuat
function generateTemplates(moduleName: string, tableName: string) {
  const moduleNameLower = moduleName.toLowerCase();
  const tableNameLower = tableName.toLowerCase();
  
  return {
    // README.md
    readme: `# ${moduleName} Module

A module for managing ${tableName} data.

## Features
- CRUD operations for ${tableName}
- Frontend interface
- Database seeding
- API endpoints

## Structure
- \`api/\` - Backend API routes and logic
- \`frontend/\` - React components
- \`prisma/\` - Database schema and migrations
`,

    // version.json
    version: JSON.stringify({
      "module": moduleName,
      "name": `${moduleName} Module`,
      "description": `A module for managing ${tableName} data`,
      "version": "1.0.0",
      "author": "Generated",
      "license": "MIT"
    }, null, 2),

    // prisma.config.ts
    prismaConfig: `/**
 * npm exec prisma -- --config ./modules/${moduleName}/prisma.config.ts migrate dev --name init_${moduleNameLower}
 */

import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema"),
  migrations: { 
    path: path.join(__dirname, "prisma", "migrations")
  },
  experimental: { externalTables: true },
  tables: {
    external: [
      "public.app_users",
      "public.app_password_reset_tokens",
    ],
  },
});
`,

    // api/index.ts
    apiIndex: `
import { Express } from 'express';
import ${moduleNameLower}Route from './routes/${moduleNameLower}'

export const init = (app: Express) => {
  console.log('    Initializing ${moduleNameLower} module with app instance');

  app.use(\`\${process.env.VITE_API_PREFIX}/${moduleNameLower}\`, ${moduleNameLower}Route);
}
`,

    // api/menu.ts
    apiMenu: `
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, icon?: React.ReactNode; target?: string }[];
  pro?: boolean;
};

const menuItems: NavItem[] = [
  {
    name: "${moduleName}",
    icon: "bookmark",
    subItems: [
      { name: "${moduleName} Page", path: "/${moduleNameLower}", icon: "info" },
    ],
  },
];

const getMenu = async (_client_id: string): Promise<object> => {
  return menuItems
}

export default getMenu;
`,

    // api/seed.ts
    apiSeed: `import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { generateUUIDv7 } from '../../../api/utils';
import { readFile, seedConfiguration } from '../../../api/utils';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ${moduleNameLower}DataFile = '${tableNameLower}.json';
const configurationDataFile = 'configuration.json';

interface Default${moduleName} {
  id: string;
  client_id: string;
  parent_id: string | null;
  name: string;
  description: string;
  status_id: number;
}

const seedData = async (client_id: string): Promise<void> => {
  try {
    const dataPath = path.join(__dirname, '..', 'prisma', ${moduleNameLower}DataFile);
    let data = readFile(dataPath, true, []);

    for (const item of data) {
      const existingItem = await prisma.${tableNameLower}.findFirst({
        where: { name: item.name }
      });

      if (existingItem) {
        console.log(\`    🎈 Item with name "\${item.name}" already exists, skipping...\`);
        continue;
      }

      item.id = generateUUIDv7();
      item.client_id = client_id;
      await prisma.${tableNameLower}.create({
        data: item
      });
    }

  } catch (error) {
    console.log(\`❌ Error seeding ${moduleNameLower} module: \${error}\`);
  }
}

export const seed = async (client_id: string): Promise<string> => {
  const configurationPath = path.join(__dirname, '..', 'prisma', configurationDataFile);

  console.log('   - Seeding ${moduleName}...');
  await seedData(client_id);
  await seedConfiguration(client_id, configurationPath, true);

  return \`Seeding ${moduleNameLower} module done\`;
}
`,
  };
}

// Template untuk api/routes/[moduleName].ts
function generateApiRoute(moduleName: string, tableName: string): string {
  const moduleNameLower = moduleName.toLowerCase();
  const tableNameLower = tableName.toLowerCase();
  
  return `import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../../api/middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../../../../api/middleware/permission';
import { permissionClientCheck } from '../../../../api/middleware/clientCheck';
import { getPermission } from '../../../../api/utils/permission';
import { ucwords } from '../../../../api/utils/string';
import { generateUUIDv7, isValidUUIDv7 } from '../../../../api/utils/uuid';

const ModuleName = '${moduleName}';
const router = Router();
const prisma = new PrismaClient();

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

/**
 * @swagger
 * /v1/${moduleNameLower}:
 *   get:
 *     summary: Get ${moduleNameLower} list
 *     description: Retrieve a list of ${moduleNameLower} with optional search functionality.
 *     tags:
 *       - ${moduleName}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-client-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID for multi-tenant access
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term to filter by name or description
 *     responses:
 *       200:
 *         description: Successfully retrieved ${moduleNameLower} list
 */
router.get('/', requirePermission(ModuleName, PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  const { q } = req.query;

  const whereClause: any = {
    client_id: clientId,
    status_id: {
      not: 1
    }
  };

  if (q && typeof q === 'string' && q.trim()) {
    const searchTerm = q.trim();
    whereClause.OR = [
      {
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      }
    ];
  }

  try {
    const ${moduleNameLower}Data = await prisma.${tableNameLower}.findMany({
      select: {
        id: true,
        client_id: true,
        parent_id: true,
        name: true,
        description: true,
        status_id: true,
      },
      where: whereClause,
      orderBy: [
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      message: \`\${ucwords(ModuleName)} retrieved successfully\`,
      data: {
        ${moduleNameLower}: ${moduleNameLower}Data,
        permissions: await getPermission(req, ModuleName)
      }
    });

  } catch (error) {
    console.error(\`Error fetching \${ucwords(ModuleName)}:\`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/${moduleNameLower}/{id}:
 *   get:
 *     summary: Get ${moduleNameLower} detail by ID
 *     description: Retrieve detailed information of a specific ${moduleNameLower} by its ID.
 *     tags:
 *       - ${moduleName}
 */
router.get('/:id', requirePermission(ModuleName, PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { id } = req.params;

    if (!isValidUUIDv7(id)) {
      return res.status(400).json({
        success: false,
        message: \`Invalid ID format: \${id}\`
      });
    }

    const existingData = await prisma.${tableNameLower}.findUnique({
      where: {
        id,
        client_id: clientId,
        status_id: {
          not: 1
        }
      }
    });

    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: \`\${ucwords(ModuleName)} not found\`
      });
    }

    res.json({
      success: true,
      message: \`\${ucwords(ModuleName)} retrieved successfully\`,
      data: existingData
    });
  } catch (error) {
    console.error(\`Error fetching \${ucwords(ModuleName)}:\`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/${moduleNameLower}:
 *   post:
 *     summary: Create a new ${moduleNameLower}
 *     description: Create a new ${moduleNameLower} with the provided data.
 *     tags:
 *       - ${moduleName}
 */
router.post('/', requirePermission(ModuleName, PermissionAction.CREATE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const existingData = await prisma.${tableNameLower}.findFirst({
      where: {
        name,
        client_id: clientId || null,
        status_id: 0
      }
    });

    if (existingData) {
      return res.status(409).json({
        success: false,
        message: \`\${ucwords(ModuleName)} with this name "\${name}" already exists\`
      });
    }

    const newId = generateUUIDv7();

    const newData = await prisma.${tableNameLower}.create({
      data: {
        id: newId,
        name,
        description,
        client_id: clientId,
        status_id: 0
      }
    });

    res.status(201).json({
      success: true,
      message: \`\${ucwords(ModuleName)} created successfully\`,
      data: newData
    });
  } catch (error) {
    console.error(\`Error creating \${ucwords(ModuleName)}:\`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/${moduleNameLower}/{id}:
 *   put:
 *     summary: Update an existing ${moduleNameLower}
 *     description: Update an existing ${moduleNameLower} with the provided data.
 *     tags:
 *       - ${moduleName}
 */
router.put('/:id', requirePermission(ModuleName, PermissionAction.EDIT), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { id } = req.params;
    const { name, description, status_id } = req.body;

    const existingData = await prisma.${tableNameLower}.findUnique({
      where: {
        id,
        client_id: clientId,
      }
    });

    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: \`\${ucwords(ModuleName)} not found\`
      });
    }

    if (name && name !== existingData.name) {
      const duplicateData = await prisma.${tableNameLower}.findFirst({
        where: {
          name,
          client_id: clientId,
          status_id: 0,
          id: { not: id }
        }
      });

      if (duplicateData) {
        return res.status(409).json({
          success: false,
          message: \`\${ucwords(ModuleName)} with this name "\${name}" already exists\`
        });
      }
    }

    const updatedData = await prisma.${tableNameLower}.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status_id !== undefined && { status_id }),
      }
    });

    res.json({
      success: true,
      message: \`\${ucwords(ModuleName)} updated successfully\`,
      data: updatedData
    });
  } catch (error) {
    console.error(\`Error updating \${ucwords(ModuleName)}:\`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/${moduleNameLower}/{id}:
 *   delete:
 *     summary: Delete a ${moduleNameLower} (soft delete)
 *     description: Soft delete a ${moduleNameLower} by setting its status_id to 1.
 *     tags:
 *       - ${moduleName}
 */
router.delete('/:id', requirePermission(ModuleName, PermissionAction.MANAGE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    const { id } = req.params;

    const existingData = await prisma.${tableNameLower}.findUnique({
      where: {
        id,
        client_id: clientId,
      }
    });

    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: \`\${ucwords(ModuleName)} not found\`
      });
    }

    await prisma.${tableNameLower}.update({
      where: { id },
      data: { status_id: 1 }
    });

    res.json({
      success: true,
      message: \`\${ucwords(ModuleName)} deleted successfully\`
    });
  } catch (error) {
    console.error(\`Error deleting \${ucwords(ModuleName)}:\`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
`;
}

// Template untuk frontend/[ModuleName]Main.tsx
function generateFrontendMain(moduleName: string, tableName: string): string {
  const moduleNameLower = moduleName.toLowerCase();
  const tableNameLower = tableName.toLowerCase();
  
  return `
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import PageMeta from "../../../src/components/common/PageMeta";
import { UniversalPage } from "../../../src/components/universal/UniversalPage";
import { ActionButton } from "../../../src/components/common/ActionButton";
import MarkdownDiv from "../../../src/components/common/MarkdownDiv";

import { FieldConfig } from "../../../src/types/form";
import { buildColumns } from "../../../src/utils/form";

import { useState, useEffect } from "react";
import { useI18n } from "../../../src/context/I18nContext";
import { useAuth } from "../../../src/context/AuthContext";
import { useClient } from "../../../src/context/ClientContext";

import { getConfiguration } from "../../../src/utils/";

import { ${moduleName}Type } from "./types/${moduleNameLower}";

const API_BASE_URL = import.meta.env.VITE_API_URL || \`http://localhost:\${import.meta.env.VITE_API_PORT}/api\`;
const columnHelper = createColumnHelper<${moduleName}Type>();

export default function ${moduleName}Main() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  const [${moduleNameLower}, set${moduleName}] = useState<${moduleName}Type[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [pageTitle, setPageTitle] = useState('${moduleName} page');
  const [footerInfo, setFooterInfo] = useState('');

  const fields = [
    {
      key: 'name',
      labelKey: 'Name',
      dataType: 'string',
      required: true,
    },
    {
      key: 'description',
      labelKey: 'Description',
      dataType: 'text',
      required: true,
      table: { noWrap: false },
    },
  ] as const satisfies ReadonlyArray<FieldConfig<${moduleName}Type>>;

  const columns = [
    ...buildColumns<${moduleName}Type>(fields as unknown as FieldConfig<${moduleName}Type>[], columnHelper, t),

    columnHelper.display({
      id: 'actions',
      header: 'Action',
      size: 80,
      minSize: 80,
      cell: (info) => {
        const rowData = info.row.original;

        const handleEdit = () => {
          const editFunction = (window as any).${moduleNameLower}_editDataModal;
          if (editFunction) editFunction(rowData);
        };
        const handleDelete = () => {
          if (!confirm(t('${moduleNameLower}.deleteConfirm'))) return;
          const deleteFunction = (window as any).${moduleNameLower}_deleteData;
          if (deleteFunction) deleteFunction(rowData);
        };

        return (
          <div className="flex items-center gap-2">
            {permissions.canEdit && (
              <ActionButton onClick={handleEdit} variant="edit" title={\`Edit \${rowData.name}\`} />
            )}
            {permissions.canManage && (
              <ActionButton onClick={handleDelete} variant="delete" title={\`Delete \${rowData.name}\`} />
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: ${moduleNameLower},
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const prepare${moduleName} = async () => {
    if (selectedClient) {
      setFooterInfo(await getConfiguration('${moduleNameLower}.footerinfo', 'Oops! If you’re seeing this, it means the "${moduleNameLower}" configuration didn’t quite make it through.', token));
      setPageTitle(await getConfiguration('${moduleNameLower}.title', '${moduleName} page', token));
    }
  }

  useEffect(() => {
    if (selectedClient && selectedClient.id && isAuthenticated && token) {
      prepare${moduleName}();
    }
  }, [token, isAuthenticated, selectedClient])

  return (
    <div>
      <PageMeta
        title="${moduleName} Page | AI-Powered Admin Dashboard"
        description="This is ${moduleName} Page by AI-Powered Admin Dashboard"
      />

      <UniversalPage<${moduleName}Type>
        module="${moduleNameLower}"
        endpoint={\`\${API_BASE_URL}/${moduleNameLower}\`}
        title={pageTitle}
        fields={fields}
        table={table}
        data={${moduleNameLower}}
        setData={set${moduleName}}
        modalDescription="${moduleNameLower} information form"
        dataKey="data.${moduleNameLower}"
        loading={loading}
        setLoading={setLoading}
        skipCSRF={true}
        onPermissionsChange={setPermissions}
      >
        <div className="text-sm text-gray-500">
          <MarkdownDiv markdown={footerInfo} />
          <br />Source code: <code>modules/${moduleName}/frontend/${moduleName}Main.tsx</code>
        </div>
      </UniversalPage>
    </div>
  );
}
`;
}

// Template untuk frontend/types/[moduleName].ts
function generateFrontendTypes(moduleName: string): string {
  return `export type ${moduleName}Type = {
  id: string;
  client_id: string;
  name: string;
  description: string;
};
`;
}

// Template untuk prisma/schema/schema.prisma
function generatePrismaSchema(tableName: string, moduleName: string = ''): string {
  const tableNameLower = tableName.toLowerCase();
  
  return `
// Model ${moduleName}

//datasource db {
//  provider = "postgresql"
//  url      = env("DATABASE_URL")
//}
model ${tableNameLower} {
  id            String    @id @default(uuid()) @db.Uuid
  client_id     String?   @db.Uuid
  parent_id     String?   @db.Uuid
  name          String
  description   String?
  metadata      Json?
  updated_at    DateTime  @default(now()) @db.Timestamptz
  created_at    DateTime  @default(now()) @db.Timestamptz
  status_id     Int       @default(1) @db.SmallInt

  @@map("\${TABLE_PREFIX}${tableNameLower}")
}
`;
}

// Template untuk prisma/db.sql
function generateDbSql(tableName: string): string {
  const tableNameLower = tableName.toLowerCase();
  
  return `
-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."\${TABLE_PREFIX}${tableNameLower}" (
    "id" UUID NOT NULL PRIMARY KEY,
    "client_id" UUID,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1
);
`;
}

// Template untuk prisma/[tableName].json
function generateTableJson(tableName: string): string {
  return JSON.stringify([
    {
      "client_id": "",
      "parent_id": null,
      "name": `Sample ${tableName} 1`,
      "description": `Sample ${tableName} Description`,
      "status_id": 0
    },
    {
      "client_id": "",
      "parent_id": null,
      "name": `Sample ${tableName} 2`,
      "description": `Another ${tableName} Description`,
      "status_id": 0
    }
  ], null, 2);
}

// Template untuk prisma/configuration.json
function generateConfigurationJson(moduleName: string): string {
  const moduleNameLower = moduleName.toLowerCase();
  
  return JSON.stringify([
    {
      "section": moduleName,
      "key": `${moduleNameLower}.title`,
      "value": `${moduleName} Page`,
      "type": "string",
      "title": `${moduleName} Page Title`,
      "order": 1,
      "note": "",
      "public": true
    },
    {
      "section": moduleName,
      "key": `${moduleNameLower}.footerinfo`,
      "value": `You can customize page title and this text anytime through the **[configuration](/configuration#${moduleNameLower})**.\nFor the very first setup, just edit it directly in the \`modules/${moduleName}/prisma/configuration.json\` file.`,
      "type": "text",
      "title": `${moduleName} Page Footer Info`,
      "note": `This string will appear at the bottom of the [${moduleName} page](/${moduleNameLower}).\nCheck it out in: \`modules/${moduleName}/frontend/${moduleName}Main.tsx\``,
      "order": 2,
      "public": true
    }
  ], null, 2);
}

// Fungsi untuk menambahkan module ke App.tsx
function addModuleToApp(moduleName: string): void {
  const appPath = 'src/App.tsx';
  const moduleNameLower = moduleName.toLowerCase();
  
  if (!fs.existsSync(appPath)) {
    console.log(`⚠️  Warning: ${appPath} not found. Skipping main app installation.`);
    return;
  }

  let appContent = fs.readFileSync(appPath, 'utf8');
  
  // Add import statement
  const importStatement = `const ${moduleName}Main = React.lazy(() => import("../modules/${moduleName}/frontend/${moduleName}Main"));`;
  const importMarker = '// /YOUR MODULE //';
  
  if (appContent.includes(importStatement)) {
    console.log(`⚠️  Import for ${moduleName}Main already exists in App.tsx`);
  } else {
    appContent = appContent.replace(importMarker, `${importStatement}\n${importMarker}`);
    console.log(`✓ Added import for ${moduleName}Main to App.tsx`);
  }
  
  // Add route
  const routeStatement = `<Route path="/${moduleNameLower}" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <${moduleName}Main />
                        </Suspense>
                      } />`;
  
  const routeMarker = '{/* === /YOUR MODULE === */}';
  
  if (appContent.includes(`<${moduleName}Main />`)) {
    console.log(`⚠️  Route for ${moduleName}Main already exists in App.tsx`);
  } else {
    appContent = appContent.replace(routeMarker, `${routeStatement}\n\n                      ${routeMarker}`);
    console.log(`✓ Added route for /${moduleNameLower} to App.tsx`);
  }
  
  // Write back to file
  fs.writeFileSync(appPath, appContent);
}

// Fungsi utama untuk membuat module
async function createModule(moduleName: string, tableName: string, installInMainApp: boolean = false): Promise<void> {
  const moduleNameLower = moduleName.toLowerCase();
  const tableNameLower = tableName.toLowerCase();
  const basePath = `modules/${moduleName}`;

  console.log(``);
  console.log(`🔧 Creating module: ${moduleName}`);
  console.log(`📋 Table name: ${tableName}`);

  // Deteksi basePath dan tanya jika sudah ada
  if (fs.existsSync(basePath)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    console.log(``);
    console.log(`⚠️ Folder ${basePath} already exists!`);
    const overwriteResponse = await question('❓ Do you want to overwrite it? (y/n): ');
    rl.close();

    if (overwriteResponse.toLowerCase() !== 'y' && overwriteResponse.toLowerCase() !== 'yes') {
      console.log('❌ Module creation cancelled.');
      return;
    }

    // Hapus folder dan isinya
    fs.rmSync(basePath, { recursive: true, force: true });
    console.log(`✓ Deleted existing folder: ${basePath}`);
  }

  // Buat struktur direktori
  const directories = [
    basePath,
    `${basePath}/api`,
    `${basePath}/api/routes`,
    `${basePath}/frontend`,
    `${basePath}/frontend/types`,
    `${basePath}/prisma`,
    `${basePath}/prisma/migrations`,
    `${basePath}/prisma/schema`
  ];

  directories.forEach(dir => {
    ensureDirectoryExists(dir);
    console.log(` ✓ Created directory: ${dir}`);
  });

  const templates = generateTemplates(moduleName, tableName);

  // Buat file-file
  const files = [
    // Root files
    { path: `${basePath}/README.md`, content: templates.readme },
    { path: `${basePath}/version.json`, content: templates.version },
    { path: `${basePath}/prisma.config.ts`, content: templates.prismaConfig },
    
    // API files
    { path: `${basePath}/api/index.ts`, content: templates.apiIndex },
    { path: `${basePath}/api/menu.ts`, content: templates.apiMenu },
    { path: `${basePath}/api/seed.ts`, content: templates.apiSeed },
    { path: `${basePath}/api/routes/${moduleNameLower}.ts`, content: generateApiRoute(moduleName, tableName) },
    
    // Frontend files
    { path: `${basePath}/frontend/${moduleName}Main.tsx`, content: generateFrontendMain(moduleName, tableName) },
    { path: `${basePath}/frontend/types/${moduleNameLower}.ts`, content: generateFrontendTypes(moduleName) },
    
    // Prisma files
    { path: `${basePath}/prisma/schema/schema.prisma`, content: generatePrismaSchema(tableName, moduleName) },
    { path: `${basePath}/prisma/db.sql`, content: generateDbSql(tableName) },
    { path: `${basePath}/prisma/${tableNameLower}.json`, content: generateTableJson(tableName) },
    { path: `${basePath}/prisma/configuration.json`, content: generateConfigurationJson(moduleName) },
    
    // Migration placeholder
    { path: `${basePath}/prisma/migrations/.migrations`, content: '# Migration files will be generated here' }
  ];

  files.forEach(file => {
    fs.writeFileSync(file.path, file.content);
    console.log(` ✓ Created file: ${file.path}`);
  });

  // Install in main app if requested
  if (installInMainApp) {
    console.log(`\n📦 Installing module in main app...`);
    addModuleToApp(moduleName);
  }

  console.log(`\n🎉 Module "${moduleName}" created successfully!`);
  console.log(`\n✅ Next steps:`);
  console.log(` 1. Review the generated files in modules/${moduleName}/`);
  console.log(` 2. Run database migration: npm exec prisma -- --config ./modules/${moduleName}/prisma.config.ts migrate dev --name init_${moduleNameLower}`);
  if (!installInMainApp) {
    console.log(` 3. Add the module to your main application manually`);
  } else {
    console.log(` 3. Module has been automatically added to App.tsx`);
    console.log(` 4. Access your module at: /${moduleNameLower}`);
  }
}

// Main function
async function main(): Promise<void> {
  try {
    console.log('=== 🔧 Module Generator ===\n');
    
    const input = await getInput();
    
    if (!input.moduleName || !input.tableName) {
      console.error('❌ Module name and table name are required!');
      process.exit(1);
    }

    await createModule(input.moduleName, input.tableName, input.installInMainApp);
    
  } catch (error) {
    console.error('❌ Error creating module:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Error running module generator:', error);
  process.exit(1);
});

export { createModule, getInput };
