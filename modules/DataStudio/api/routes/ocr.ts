import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Router, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../../../../api/middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from '../../../../api/middleware/permission';
import { permissionClientCheck } from '../../../../api/middleware/clientCheck';
import { getConfiguration } from '../../../../api/utils/configuration';

// Extend Request interface to include file
declare global {
  namespace Express {
    interface Request {
      file?: multer.File;
    }
  }
}

const ModuleName = 'Explorer';
const router = Router();
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads with disk storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const clientId = req.headers['x-client-id'] as string;
      const storagePath = path.join(__dirname, '..', '..', '..', '..', 'storage', 'uploads', 'ocr', clientId);
      fs.mkdirSync(storagePath, { recursive: true });
      cb(null, storagePath);
    },
    filename: (req: any, file: any, cb: any) => {
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

router.use(authenticateToken);
router.use(permissionMiddleware);
router.use(permissionClientCheck);

router.post('/', upload.single('file'), requirePermission(ModuleName, PermissionAction.CREATE), async (req, res) => {
  const clientId = req.headers['x-client-id'] as string;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    // Log file information for debugging
    // console.log('File uploaded:', {
    //   filename: req.file.originalname,
    //   size: req.file.size,
    //   mimetype: req.file.mimetype,
    //   clientId: clientId
    // });

    // Get configuration values
    const url = await getConfiguration('ocr.api_baseurl', clientId, false, true);
    const token = await getConfiguration('ocr.token', clientId, false, true);

    if (!url) {
      return res.status(500).json({
        success: false,
        message: 'OCR API configuration not found'
      });
    }

    console.log(`OCR API base URL: ${url}, ${token}`);

    // Detect MIME type of file
    const mime = req.file.mimetype;

    // Encode file as base64 data URI
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Data = fileBuffer.toString('base64');
    const dataUri = `data:${mime};base64,${base64Data}`;

    // Get additional configuration
    const async = await getConfiguration('ocr.async', clientId, false, false) || 'false';
    const webhook = await getConfiguration('ocr.webhook', clientId, false, false) || '';

    const payload = {
      async: async === 'true',
      data: dataUri,
      type: req.body.doc_type || 'receipt', // Use doc_type from request body or default to 'receipt'
      webhook: webhook
    };

    console.log('Sending OCR request with payload:', {
      filename: req.file.originalname,
      type: payload.type,
      // async: payload.async,
      // webhook: payload.webhook,
      // dataLength: dataUri.length
    });

    try {
      // Use fetch to make HTTP request to OCR API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000) // 120 seconds timeout
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
      }

      return res.status(200).json({
        success: true,
        message: 'OCR processing completed',
        data: {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
          ocr_result: responseData
        }
      });

    } catch (fetchError) {
      console.error('Error calling OCR API:', fetchError);
      throw fetchError;
    }

  } catch (error) {
    console.error('Error processing OCR file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      message: `Internal server error: ${errorMessage}`
    });
  }
})



export default router;

