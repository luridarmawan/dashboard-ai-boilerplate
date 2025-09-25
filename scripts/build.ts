import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Build script that updates the VITE_BUILD_DATE environment variable
 * to the current timestamp in ISO format
 */
function updateBuildDate(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envFilePath = path.join(__dirname, '..', '.env');

  try {
    // Read the .env file
    let envContent = fs.readFileSync(envFilePath, 'utf8');

    // Get current timestamp in ISO format
    const now = new Date();
    const currentTimestamp = now.toISOString();

    // Update VITE_BUILD_DATE line
    const buildDateRegex = /^VITE_BUILD_DATE=".*?"$/m;
    const newBuildDateLine = `VITE_BUILD_DATE="${currentTimestamp}"`;

    if (buildDateRegex.test(envContent)) {
      // Replace existing VITE_BUILD_DATE line
      envContent = envContent.replace(buildDateRegex, newBuildDateLine);
    } else {
      // Add VITE_BUILD_DATE line if it doesn't exist
      envContent += `\n${newBuildDateLine}`;
    }

    // Write updated content back to .env file
    fs.writeFileSync(envFilePath, envContent, 'utf8');

    console.log(`✅ Build date updated to: ${currentTimestamp}`);
    console.log('Build script completed successfully');

  } catch (error) {
    console.error('❌ Error updating build date:', error);
    process.exit(1);
  }
}

// Run the build script
updateBuildDate();
