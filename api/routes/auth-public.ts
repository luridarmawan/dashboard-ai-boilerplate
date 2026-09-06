import express from 'express';
import bcrypt from 'bcryptjs';
import emailService from '../services/email/emailService';
import { generateUUIDv7 } from '../utils/uuid';
import { prisma } from '../database/init';

const router = express.Router();

/**
 * @swagger
 * /v1/auth-public/reset-password/request:
 *   post:
 *     summary: Request password reset
 *     description: Request a password reset link for a user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset request processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: If the email address you provided matches a registered account, we will send instructions to reset your password.
 */
router.post('/reset-password/request', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: {
        email: email,
        status_id: 0
      }
    });

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If the email address you provided matches a registered account, we will send instructions to reset your password.'
    };

    if (!user) {
      // Don't reveal if user exists or not
      return res.json(successResponse);
    }

    // Generate reset token
    const token = generateUUIDv7();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Store token in database
    await prisma.password_reset_tokens.create({
      data: {
        user_id: user.id,
        token: token,
        expires_at: expiresAt
      }
    });

    // Generate reset link
    const resetLink = `${process.env.VITE_APP_URL}/reset-password?token=${token}`;

    // Send email with reset link using template - no await
    try {
      console.log('Reset link to', email, resetLink)
      /* await */ emailService.sendTemplate(
        email,
        'Password Reset Request',
        'user-password-reset.html',
        {
          firstName: user.first_name,
          resetLink: resetLink
        },
        {
          user_id: user.id
        }
      );
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email sending fails
    }

    res.json(successResponse);
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/auth-public/reset-password/validate-token:
 *   post:
 *     summary: Validate password reset token
 *     description: Validate a password reset token without resetting the password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token is valid
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/reset-password/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Find valid token
    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: {
        token: token
      }
    });

    // Check if token exists and is valid
    if (!resetToken || resetToken.used || resetToken.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user associated with the token
    const user = await prisma.users.findUnique({
      where: {
        id: resetToken.user_id
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/auth-public/reset-password/confirm:
 *   post:
 *     summary: Confirm password reset
 *     description: Reset user password using a valid reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate input
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find valid token
    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: {
        token: token
      }
    });

    // Check if token exists and is valid
    if (!resetToken || resetToken.used || resetToken.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user associated with the token
    const user = await prisma.users.findUnique({
      where: {
        id: resetToken.user_id
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(user.email + password, saltRounds);

    // Update user password
    await prisma.users.update({
      where: {
        id: resetToken.user_id
      },
      data: {
        password_hash: passwordHash
      }
    });

    // Mark token as used
    await prisma.password_reset_tokens.update({
      where: {
        id: resetToken.id
      },
      data: {
        used: true
      }
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;