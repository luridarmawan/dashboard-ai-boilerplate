import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { Router, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../../api/middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../../../../api/middleware/permission';
import { permissionClientCheck } from '../../../../api/middleware/clientCheck';
import { getPermission } from '../../../../api/utils/permission';
import { ucwords } from '../../../../api/utils/string';
import { generateUUIDv7, isValidUUIDv7 } from '../../../../api/utils/uuid';
import { getConfiguration } from '../../../../api/utils/configuration';
import { errorMonitor } from 'nodemailer/lib/xoauth2';

const ModuleName = 'Explorer';
const router = Router();
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads with disk storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const clientId = req.headers['x-client-id'] as string;
      const storagePath = path.join(__dirname, '..', '..', '..', '..', 'storage', 'uploads', 'explorer', clientId);
      fs.mkdirSync(storagePath, { recursive: true });
      cb(null, storagePath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename to avoid conflicts
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const basename = path.basename(file.originalname, extension);
      cb(null, `${basename}-${uniqueSuffix}${extension}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Apply authentication and permission middleware to all routes in this router
router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

router.get('/', requirePermission(ModuleName, PermissionAction.READ), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  const { q } = req.query;
  let responseText = '';

  let url = await getConfiguration('explorer.url', clientId, false, true);
  const token = await getConfiguration('explorer.token', clientId, false, true);
  const driveId = await getConfiguration('explorer.folder_id', clientId, false, true);
  if (url == null || url == '') {
    return res.status(400).json({
      success: false,
      message: 'Explorer URL not found'
    });
  }
  if (driveId == null || driveId == '') {
    return res.status(400).json({
      success: false,
      message: 'DriveID not found'
    });
  }
  url += '/files';
  if (driveId !== null || driveId !== '') url += `?id=${driveId}`;

  try {

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response){
      return res.status(400).json({
        success: false,
        message: 'Explorer URL not found',
      });
    }
    responseText = await response.text()

    const responseJson = await JSON.parse(responseText)
    res.status(response.status).json(responseJson);

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Internal error: ${responseText}`
    });
  }

});

router.post('/upload', upload.single('file'), requirePermission(ModuleName, PermissionAction.CREATE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    // Get configuration values
    const url = await getConfiguration('explorer.url', clientId, false, true);
    const token = await getConfiguration('explorer.token', clientId, false, true);
    const driveId = await getConfiguration('explorer.folder_id', clientId, false, true);

    // Validate required configurations
    if (url == null || url == '') {
      return res.status(400).json({
        success: false,
        message: 'Explorer URL not found'
      });
    }

    if (token == null || token == '') {
      return res.status(400).json({
        success: false,
        message: 'Explorer token not found'
      });
    }

    if (driveId == null || driveId == '') {
      return res.status(400).json({
        success: false,
        message: 'DriveID not found'
      });
    }

    // Check if file is provided
    if (!(req as any).file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // File is already saved to storage by multer disk storage
    const savedFilePath = (req as any).file.path;
    // console.log(`File saved to: ${savedFilePath}`);

    // Construct the upload URL
    const uploadUrl = `${url}/file`;

    // Read the file and forward it to the external service with additional metadata
    const fileBuffer = fs.readFileSync(savedFilePath);
    const originalFileName = (req as any).file.originalname;

    // Create FormData to include file and metadata
    const formData = new FormData();
    formData.append('data', new Blob([fileBuffer]), originalFileName);
    formData.append('clientId', clientId);
    formData.append('driveId', driveId);
    formData.append('filename', originalFileName);
    formData.append('fileSize', fileBuffer.length.toString());
    formData.append('uploadSource', 'datastudio-explorer');

    console.log(`Uploading file: ${originalFileName} (${fileBuffer.length} bytes) for client: ${clientId}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `Upload failed: ${errorText}`
      });
    }

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { message: responseText };
    }

    res.status(response.status).json({
      success: true,
      message: 'File uploaded successfully',
      data: responseData,
      filePath: savedFilePath
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${errorMessage}`
    });
  }
});

router.delete('/file/:fileId', requirePermission(ModuleName, PermissionAction.CREATE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  try {
    // Get configuration values
    const url = await getConfiguration('explorer.url', clientId, false, true);
    const token = await getConfiguration('explorer.token', clientId, false, true);
    const driveId = await getConfiguration('explorer.folder_id', clientId, false, true);

    // Validate required configurations
    if (url == null || url == '') {
      return res.status(400).json({
        success: false,
        message: 'Explorer URL not found'
      });
    }

    if (token == null || token == '') {
      return res.status(400).json({
        success: false,
        message: 'Explorer token not found'
      });
    }

    if (driveId == null || driveId == '') {
      return res.status(400).json({
        success: false,
        message: 'DriveID not found'
      });
    }

    const deleteURL = `${url}/file?id=${req.params.fileId}`;
    const response = await fetch(deleteURL, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `Delete failed: ${errorText}`
      });
    }

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { message: responseText };
    }

    res.status(response.status).json({
      success: true,
      message: 'File deleted successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${errorMessage}`
    });
  }
});

router.post('/build', requirePermission(ModuleName, PermissionAction.MANAGE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;
  const { q } = req.query;
  let responseText = '';

  const existingClient = await prisma.clients.findFirst({
    where: { 
      id: clientId,
      status_id: { not: 1 } // Exclude deleted clients
    }
  });
  if (!existingClient) {
    return res.status(400).json({
      success: false,
      message: 'Client not found',
    });
  }

  let tenantName = existingClient.name;
  tenantName = tenantName || 'global';
  tenantName = tenantName.toLowerCase();
  tenantName = tenantName.replace(/\s+/g, '_');

  const token = await getConfiguration('explorer.token', clientId, false, true);
  const driveId = await getConfiguration('explorer.folder_id', clientId, false, true);
  let url = await getConfiguration('explorer.url', clientId, false, true);
  if (url == null || url == '') {
    return res.status(400).json({
      success: false,
      message: 'Explorer URL not found'
    });
  }
  if (driveId == null || driveId == '') {
    return res.status(400).json({
      success: false,
      message: 'DriveID not found'
    });
  }
  url += '/build';
  if (driveId !== null || driveId !== '') url += `?id=${driveId}`;
  let requestBody = {
    id: driveId,
    tenant: tenantName,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (!response){
      return res.status(400).json({
        success: false,
        message: 'Explorer URL not found',
      });
    }
    responseText = await response.text()

    const responseJson = await JSON.parse(responseText)
    res.status(response.status).json(responseJson);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Internal error: ${responseText}`
    });
  }

});

export default router;
