import express from 'express';
import { execSync } from 'child_process';

const router = express.Router();

/**
 * Get the latest git commit hash
 */
function getGitCommitHash(): string {
  try {
    // Get the short commit hash (7 characters)
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return commitHash;
  } catch (error) {
    console.warn('Could not get git commit hash:', error);
    return 'unknown';
  }
}

/**
 * @swagger
 * /v1/version:
 *   get:
 *     summary: Get application version information
 *     description: Returns application name, version, build date, and git commit hash
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Application version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 app:
 *                   type: string
 *                   description: Application name from environment
 *                   example: "AI-Powered Dashboard"
 *                 version:
 *                   type: string
 *                   description: Application version from environment
 *                   example: "8.17.0"
 *                 build_date:
 *                   type: string
 *                   format: date-time
 *                   description: Build timestamp
 *                   example: "2025-08-17T10:10:10Z"
 *                 build_version:
 *                   type: string
 *                   description: Git commit hash
 *                   example: "1xqw461"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/', (req, res) => {
  try {
    const appName = process.env.VITE_APP_NAME || 'Unknown App';
    const appVersion = process.env.VITE_APP_VERSION || '0.0.0';
    const buildDate = process.env.VITE_BUILD_DATE || '';
    const buildVersion = getGitCommitHash();

    const responseData = {
      app: appName,
      version: appVersion,
      build_date: buildDate,
      build_version: buildVersion
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Version endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;