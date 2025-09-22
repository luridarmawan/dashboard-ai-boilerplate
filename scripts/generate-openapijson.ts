import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getOpenAPISpec } from '../api/utils/swagger';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'public', 'api-docs', 'openapi.json');

async function generateOpenAPIJson() {
  try {
    console.log('🔧 Generating OpenAPI JSON specification...');
    
    // Get the OpenAPI specification
    const openApiSpec = getOpenAPISpec();
    
    // Apply hidden tags filter (same logic as in server/index.ts)
    const hiddenTags = new Set(
      (process.env.VITE_API_HIDDEN_TAGS || '')
        .split(',')
        .map(ht => ht.toLowerCase())
    );

    // Filter out endpoints that have tags matching hiddenTags
    if (openApiSpec.paths) {
      Object.keys(openApiSpec.paths).forEach(pathKey => {
        const pathItem = openApiSpec.paths[pathKey];
        if (pathItem) {
          Object.keys(pathItem).forEach(method => {
            const operation = pathItem[method];
            if (operation && operation.tags) {
              const hasHiddenTag = operation.tags.some(
                (tag: string) => hiddenTags.has(tag.toLowerCase())
              );
              if (hasHiddenTag) {
                delete pathItem[method];
              }
            }
          });

          // Remove the entire path if no methods remain
          if (Object.keys(pathItem).length === 0) {
            delete openApiSpec.paths[pathKey];
          }
        }
      });
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }

    // Write the OpenAPI JSON file
    fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));
    
    console.log(`✅ OpenAPI JSON generated successfully!`);
    console.log(`📄 File saved to: ${outputPath}`);
    console.log(`📊 Total paths: ${Object.keys(openApiSpec.paths || {}).length}`);
    
    // Show some stats
    if (openApiSpec.paths) {
      let totalEndpoints = 0;
      Object.values(openApiSpec.paths).forEach(pathItem => {
        if (pathItem) {
          totalEndpoints += Object.keys(pathItem).length;
        }
      });
      console.log(`🔗 Total endpoints: ${totalEndpoints}`);
    }

  } catch (error) {
    console.error('❌ Error generating OpenAPI JSON:', error);
    process.exit(1);
  }
}

// Run the generator
generateOpenAPIJson();