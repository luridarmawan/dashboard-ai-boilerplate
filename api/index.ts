import express from 'express';
import cors from 'cors';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import authPublicRoutes from './routes/auth-public';
import userRoutes from './routes/user';
import clientsRoutes from './routes/clients';
import groupsRoutes from './routes/groups';
import groupPermissionsRoutes from './routes/group_permissions';
import groupMembersRoutes from './routes/group_members';
import configurationRoutes from './routes/configuration';
import menuRoutes from './routes/menu';
import moduleRoutes from './routes/modules';
import mcpRoutes from './routes/mcp';
import aiRoutes from './routes/ai';
import conversationsRoutes from './routes/conversations';
import messagesRoutes from './routes/messages';
import versionRoutes from './routes/version';
import { initializeDatabase } from './database/init';
import { csrfMiddleware, generateCSRFTokenMiddleware, mcpCSRFMiddleware } from './middleware/csrf';
import { userActivityMiddleware } from './middleware/userActivity';
import { securityMiddlewares } from './middleware/security';
import { getOpenAPISpec } from './utils/swagger';
import { getBaseUrl } from './utils/string';
import logs from './utils/logs';

dotenv.config();

const app = express();
const PORT = process.env.VITE_API_PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = path.join(__dirname, '..', process.env.VITE_MODULES_DIR || '');

// Middleware
// Apply security middlewares (helmet, cors, hpp, rate limiting, upload size)
securityMiddlewares.forEach(middleware => app.use(middleware));
app.use(userActivityMiddleware);

// Routes with specific middleware
app.use(`${process.env.VITE_API_PREFIX}/auth`, csrfMiddleware, authRoutes);
app.use(`${process.env.VITE_API_PREFIX}/auth-public`, authPublicRoutes); // Public routes without CSRF protection
app.use(`${process.env.VITE_API_PREFIX}/user`, csrfMiddleware, userRoutes);
app.use(`${process.env.VITE_API_PREFIX}/client`, csrfMiddleware, clientsRoutes);
app.use(`${process.env.VITE_API_PREFIX}/group-members`, csrfMiddleware, groupMembersRoutes);
app.use(`${process.env.VITE_API_PREFIX}/group-permissions`, csrfMiddleware, groupPermissionsRoutes);
app.use(`${process.env.VITE_API_PREFIX}/groups`, csrfMiddleware, groupsRoutes);
app.use(`${process.env.VITE_API_PREFIX}/configuration`, csrfMiddleware, configurationRoutes);
app.use(`${process.env.VITE_API_PREFIX}/ai`, aiRoutes);
app.use(`${process.env.VITE_API_PREFIX}/mcp`, mcpCSRFMiddleware, mcpRoutes);
app.use(`${process.env.VITE_API_PREFIX}/conversations`, conversationsRoutes); // CSRF protection disabled
app.use(`${process.env.VITE_API_PREFIX}/messages`, messagesRoutes); // CSRF protection disabled
app.use(`${process.env.VITE_API_PREFIX}/module`, moduleRoutes);
app.use(`${process.env.VITE_API_PREFIX}/menu`, menuRoutes);
app.use(`${process.env.VITE_API_PREFIX}/version`, versionRoutes); // Public endpoint

// Initializing module index
console.log(``);
console.log(`🗂  Initializing modules ...`);
const indexFiles = glob.sync('**/api/index.ts', {
  cwd: MODULES_DIR,
  absolute: true
});
console.log(`   Modules directory: ${MODULES_DIR}`);

if (indexFiles.length > 0) {
  for (const indexFile of indexFiles) {
    const moduleName = indexFile.split(path.sep).slice(-3)[0];
    const indexPath = pathToFileURL(indexFile).href;
    console.log(`🔧 Initializing module: ${moduleName}`);

    try {
      const moduleIndex = await import(indexPath);
      // fleksibel: dukung export bernama `init` atau default function
      const fn = typeof moduleIndex.init === 'function' ? moduleIndex.init
        : typeof moduleIndex.default === 'function' ? moduleIndex.default
          : null;

      if (!fn) {
        console.log(`  ⚠️ Module "${moduleName}" does not export a init function`);
        continue;
      }

      const result = await fn(app);

    } catch (error) {
      console.error(`  ❌ Error initializing module ${moduleName}:`, error);
    }

    console.log(`   📗 Done: ${moduleName}`)
  }
}
// /Initializing module index

// Examples
// app.use(`${process.env.VITE_API_PREFIX}/examples`, csrfMiddleware, exampleRoutes);


/**
 * @swagger
 * /v1/health:
 *   get:
 *     summary: Health check
 *     description: Check if the server is running and healthy
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Server is running
 */
app.get(`${process.env.VITE_API_PREFIX}/health`, (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// // OpenAPI JSON endpoint
// app.get(`${process.env.VITE_API_PREFIX}/openapi.json`, (req, res) => {
//   const hiddenTags = new Set(
//     (process.env.VITE_API_HIDDEN_TAGS || '')
//       .split(',')
//       .map(ht => ht.toLowerCase())
//   );

//   try {
//     const openApiSpec = getOpenAPISpec();

//     // Filter out endpoints that have tags matching hiddenTags
//     if (openApiSpec.paths) {
//       Object.keys(openApiSpec.paths).forEach(path => {
//         const pathItem = openApiSpec.paths[path];
//         if (pathItem) {
//           Object.keys(pathItem).forEach(method => {
//             const operation = pathItem[method];
//             if (operation && operation.tags) {
//               const hasHiddenTag = operation.tags.some(
//                 (tag: string) => hiddenTags.has(tag.toLowerCase())
//               );
//               if (hasHiddenTag) {
//                 delete pathItem[method];
//               }
//             }
//           });

//           // Remove the entire path if no methods remain
//           if (Object.keys(pathItem).length === 0) {
//             delete openApiSpec.paths[path];
//           }
//         }
//       });
//     }

//     res.json(openApiSpec);
//   } catch (error) {
//     console.error('Error generating OpenAPI spec:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to generate OpenAPI specification'
//     });
//   }
// });

// OpenAPI JSON endpoint
app.get(`${process.env.VITE_API_PREFIX}/openapi.json`, (req, res) => {
  res.sendFile('openapi.json', {
    root: './public/api-docs',
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

// Redirect /docs/openapi.json to /api/openapi.json for Scalar compatibility
app.get('/docs/openapi.json', (req, res) => {
  res.redirect(`${process.env.VITE_API_PREFIX}/openapi.json`);
});

// API Documentation endpoint - serves the Scalar HTML file
// app.get(`${process.env.VITE_API_PREFIX}/docs`, (req, res) => {
//   res.sendFile('scalar.html', {
//     root: './public/api-docs',
//     headers: {
//       'Content-Type': 'text/html'
//     }
//   });
// });

// API Documentation endpoint - serves the Scalar HTML file
app.get(`/docs`, (req, res) => {
  res.sendFile('scalar.html', {
    root: './public/api-docs',
    headers: {
      'Content-Type': 'text/html'
    }
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${process.env.VITE_API_PREFIX}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();