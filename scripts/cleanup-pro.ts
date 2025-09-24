import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

/**
 * Cleanup script to remove YOUR MODULE sections from App.tsx
 * Replaces module sections with "place your module here" comment
 */
function cleanupAppTsx(): void {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const appTsxPath = path.join(__dirname, '..', 'src', 'App.tsx');

  try {
    // Read the App.tsx file
    let content = fs.readFileSync(appTsxPath, 'utf8');

    console.log('Reading App.tsx file...');

    // Remove content between // YOUR MODULE // and // /YOUR MODULE //
    const yourModulePattern = /\/\/ YOUR MODULE \/\/[\s\S]*?\/\/ \/YOUR MODULE \/\//g;
    content = content.replace(yourModulePattern, '// PLACE YOUR MODULE HERE');

    // Remove content between {/* === YOUR MODULE === */} and {/* === /YOUR MODULE === */}
    const jsxYourModulePattern = /\{\/\* === YOUR MODULE === \*\/\}[\s\S]*?\{\/\* === \/YOUR MODULE === \*\/\}/g;
    content = content.replace(jsxYourModulePattern, '{/*  PLACE YOUR MODULE HERE */}');

    // Write the cleaned content back to the file
    fs.writeFileSync(appTsxPath, content, 'utf8');

    console.log('Successfully cleaned up App.tsx file');
  } catch (error) {
    console.error('Error cleaning up App.tsx file:', error);
    process.exit(1);
  }
}

// Run the cleanup function
cleanupAppTsx();
