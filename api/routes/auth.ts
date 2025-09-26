import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateUUIDv7 } from '../utils/uuid';
import { prisma } from '../database/init';
import { generateCSRFToken, storeCSRFToken } from '../middleware/csrf';
import emailService from '../services/email/emailService';
import { loginLimiter } from '../middleware/security';

const router = express.Router();

/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, phone, password, and personal information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !phone || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        email: email
      }
    });

  if (existingUser) {
    // If user exists but is not verified (status_id = 2), we can resend verification email
    if (existingUser.status_id === 2) {
      // Update verification token and expiration
      const verificationToken = generateUUIDv7();
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.users.update({
        where: {
          id: existingUser.id
        },
        data: {
          verification_token: verificationToken,
          verification_token_expires: verificationTokenExpires
        }
      });

      // Resend verification email
      try {
        const verificationLink = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/email-verification?token=${verificationToken}`;
        await emailService.sendTemplate(
          email,
          'Verify Your Email Address',
          'user-verification.html',
          {
            firstName: existingUser.first_name,
            verificationLink: verificationLink
          },
          {
            user_id: existingUser.id
          }
        );

        return res.status(200).json({
          success: true,
          message: 'User already exists but email is not verified. A new verification email has been sent.',
          data: {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              phone: existingUser.phone,
              firstName: existingUser.first_name,
              lastName: existingUser.last_name,
              alias: existingUser.alias,
              description: existingUser.description,
              createdAt: existingUser.created_at
            },
          }
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'User already exists but email is not verified. Failed to send verification email.',
          data: {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              phone: existingUser.phone,
              firstName: existingUser.first_name,
              lastName: existingUser.last_name,
              alias: existingUser.alias,
              description: existingUser.description,
              createdAt: existingUser.created_at
            },
          }
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Forgot your password? <b><a href="/forgot-password">Reset it here!</a></b>',
        data: {
          user: {
            id: existingUser.id,
            email: existingUser.email,
            phone: existingUser.phone,
            firstName: existingUser.first_name,
            lastName: existingUser.last_name,
            alias: existingUser.alias,
            description: existingUser.description,
            createdAt: existingUser.created_at
          },
        }

      });
    }
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(email+password, saltRounds);

  // Generate UUIDv7 for user ID
  const userId = generateUUIDv7();

  // Generate client ID
  const defaultClient = await prisma.clients.findFirst({
    where: {
      status_id: 0
    },
    orderBy: {
      id: 'asc'
    }
  });
  const clientId = defaultClient?.id;

  // Generate verification token
  const verificationToken = generateUUIDv7();
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user with status_id = 2 (waiting for email verification)
  const user = await prisma.users.create({
    data: {
      id: userId,
      client_id: clientId,
      email: email,
      phone: phone,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      status_id: 2, // Waiting for email verification
      verification_token: verificationToken,
      verification_token_expires: verificationTokenExpires
    },
    select: {
      id: true,
      email: true,
      phone: true,
      first_name: true,
      last_name: true,
      created_at: true,
      alias: true,
      description: true,
    }
  });

  // Send verification email
  try {
    const verificationLink = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/email-verification?token=${verificationToken}`;
    await emailService.sendTemplate(
      email,
      'Verify Your Email Address',
      'user-verification.html',
      {
        firstName: firstName,
        verificationLink: verificationLink
      },
      {
        user_id: userId
      }
    );
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Don't fail registration if email sending fails, but log the error
  }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          alias: user.alias,
          description: user.description,
          createdAt: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login', loginLimiter,  async (req, res) => {
  try {
    const { email, password, lat, lon } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with status_id 0 (active) or 2 (waiting for email verification)
    const user = await prisma.users.findUnique({
      where: {
        email: email,
        status_id: {
          in: [0, 2]
        }
      },
      select: {
        id: true,
        client_id: true,
        email: true,
        phone: true,
        password_hash: true,
        first_name: true,
        last_name: true,
        alias: true,
        description: true,
        status_id: true,
      }
    });

    // Check if user exists and has status_id = 2 (waiting for email verification)
    if (user && user.status_id === 2) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isValidPassword = await bcrypt.compare(email+password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' } // TODO: configurable JWT token expiry duration
    );

    // Save login information to sessions table
    try {
      // Get client_id from user (assuming user has client_id, if not we can get it from client_user_maps or set default)
      let clientId = user.client_id;

      // If user doesn't have client_id, try to get it from client_user_maps
      if (!clientId) {
        const clientUserMap = await prisma.client_user_maps.findFirst({
          where: {
            user_id: user.id,
            status_id: 1
          },
          select: {
            client_id: true
          }
        });
        clientId = clientUserMap?.client_id || null;
      }

      // Detect device information from User-Agent
      const userAgent = req.get('User-Agent') || '';
      let device = 'Unknown';

      if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        if (userAgent.includes('Android')) {
          device = 'Mobile - Android';
        } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
          device = 'Mobile - iOS';
        } else {
          device = 'Mobile - Other';
        }
      } else {
        // Browser detection
        const browserMatches = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i);
        const osMatches = userAgent.match(/(Windows|Mac|Linux)/i);

        const browser = browserMatches ? browserMatches[1] : 'Unknown Browser';
        const os = osMatches ? osMatches[1] : 'Unknown OS';

        device = `Browser - ${browser} (${os})`;
      }

      // Get IP address (handle proxies)
      const ip = req.ip ||
                 req.connection.remoteAddress ||
                 req.socket.remoteAddress ||
                 (req.connection as any).socket?.remoteAddress ||
                 'Unknown';

      // Clean IP if it's IPv6 localhost
      const cleanIp = ip === '::1' ? '127.0.0.1' : ip.replace(/^::ffff:/, '');

      // Create session record
      await prisma.sessions.create({
        data: {
          id: generateUUIDv7(),
          client_id: clientId,
          user_id: user.id,
          token: token,
          device: device,
          login_at: new Date(),
          last_seen: new Date(),
          ip: cleanIp,
          lat: lat ? Number(lat) : null,
          lon: lon ? Number(lon) : null,
          status_id: 0
        }
      });
    } catch (sessionError) {
      console.error('Failed to save session:', sessionError);
      // Don't fail login if session saving fails, just log the error
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          alias: user.alias,
          description: user.description,
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/auth/csrf-token:
 *   get:
 *     summary: Get CSRF token
 *     description: Generate and retrieve a CSRF token for secure form submissions
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     csrfToken:
 *                       type: string
 *                       example: abc123def456
 *                     sessionId:
 *                       type: string
 *                       example: sess_789xyz
 */
router.get('/csrf-token', (req, res) => {
  // Generate a new CSRF token
  const csrfToken = generateCSRFToken();

  // Generate a session ID
  const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Store the token
  storeCSRFToken(sessionId, csrfToken);

  // Send the token and session ID in the response
  res.json({
    success: true,
    data: {
      csrfToken,
      sessionId
    }
  });
});

/**
 * @swagger
 * /v1/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     description: Verify the validity of a JWT token and return user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 01234567-89ab-cdef-0123-456789abcdef
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         firstName:
 *                           type: string
 *                           example: John
 *                         lastName:
 *                           type: string
 *                           example: Doe
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get user data
    const user = await prisma.users.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        description: true,
        alias: true,
        avatar: true,
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
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          description: user.description,
          alias: user.alias,
          avatar: user.avatar,
        }
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

/**
 * @swagger
 * /v1/auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     description: Verify user email using the verification token sent to their email
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                   example: Email verified successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    // Validate input
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with the verification token
    const user = await prisma.users.findFirst({
      where: {
        verification_token: token,
        verification_token_expires: {
          gt: new Date()
        },
        status_id: 2 // Only verify users with status_id = 2 (waiting for email verification)
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user status to active (status_id = 0)
    await prisma.users.update({
      where: {
        id: user.id
      },
      data: {
        status_id: 0,
        verification_token: null,
        verification_token_expires: null
      }
    });

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /v1/auth/google-login:
 *   post:
 *     summary: Google OAuth login
 *     description: Authenticate user with Google OAuth credential
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Base64 encoded Google user info
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;

    // Validate input
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Decode the credential (base64 encoded user info)
    let userInfo;
    try {
      userInfo = JSON.parse(atob(credential));
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential format'
      });
    }

    const { email, name, given_name, family_name, picture, sub } = userInfo;

    if (!email || !sub) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google user data'
      });
    }

    // Check if user already exists
    let user = await prisma.users.findUnique({
      where: {
        email: email
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        alias: true,
        description: true,
        status_id: true,
        google_id: true,
        avatar: true
      }
    });

    if (user) {
      // User exists, update Google ID if not set and ensure user is active
      if (!user.google_id) {
        await prisma.users.update({
          where: {
            id: user.id
          },
          data: {
            google_id: sub,
            status_id: 0, // Activate user if not already active
            avatar: picture || user.avatar // Update avatar if available
          }
        });
      }

      // Check if user is active
      // if (user.status_id !== 0) {
      //   await prisma.users.update({
      //     where: {
      //       id: user.id
      //     },
      //     data: {
      //       status_id: 0 // Activate user
      //     }
      //   });
      // }
    } else {

      const isAutoCreateAccount = process.env.VITE_SIGNUP_ENABLE === 'true';
      if (!isAutoCreateAccount) {
        return res.status(400).json({
          success: false,
          message: "We couldn’t find an account matching your details.\nPlease make sure your account is registered and still active."
        });
      }

      // Create new user
      const userId = generateUUIDv7();
      const clientId = generateUUIDv7();

      user = await prisma.users.create({
        data: {
          id: userId,
          client_id: clientId,
          email: email,
          phone: '', // Google doesn't always provide phone
          password_hash: '', // No password for Google users
          first_name: given_name || name?.split(' ')[0] || 'User',
          last_name: family_name || name?.split(' ').slice(1).join(' ') || '',
          status_id: 0, // Active
          google_id: sub,
          avatar: picture || null
        },
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          alias: true,
          description: true,
          status_id: true,
          google_id: true,
          avatar: true
        }
      });
    }

    // Check if user was created/found successfully
    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create or find user account'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          alias: user.alias,
          description: user.description,
        },
        token
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
