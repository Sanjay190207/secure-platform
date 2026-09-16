const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticateUser, recordAuditLog } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-secure-exam-2026-sha256-kms-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    // 1. Fetch user record
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      await recordAuditLog({
        action: 'LOGIN_FAILED',
        ipAddress,
        result: 'FAILED',
        details: `Invalid login attempt for non-existent email: ${email}`
      });

      return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
    }

    const user = result.rows[0];

    // 2. Check if account is administratively disabled
    if (user.status === 'DISABLED') {
      await recordAuditLog({
        userId: user.id,
        role: user.role,
        action: 'LOGIN_DISABLED_ATTEMPT',
        ipAddress,
        result: 'DENIED',
        details: 'Attempted login to disabled account'
      });
      return res.status(403).json({ success: false, error: 'Account is administratively disabled. Contact System Administrator.' });
    }

    // 3. Check temporary lock status
    if (user.status === 'LOCKED') {
      const now = new Date();
      if (user.locked_until && new Date(user.locked_until) > now) {
        const remainingMins = Math.ceil((new Date(user.locked_until) - now) / (60 * 1000));
        await recordAuditLog({
          userId: user.id,
          role: user.role,
          action: 'LOGIN_LOCKED_ACCOUNT_ATTEMPT',
          ipAddress,
          result: 'DENIED',
          details: `Attempted login during account lock period. ${remainingMins} mins remaining.`
        });
        return res.status(403).json({
          success: false,
          error: `Account is locked due to repeated failed logins. Try again in ${remainingMins} minute(s).`
        });
      } else {
        // Lock window expired, reactivate account
        await query("UPDATE users SET status = 'ACTIVE', failed_attempts = 0, locked_until = NULL WHERE id = $1", [user.id]);
        user.status = 'ACTIVE';
        user.failed_attempts = 0;
      }
    }

    // 4. Verify Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const newFailedCount = (user.failed_attempts || 0) + 1;

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
        await query(
          "UPDATE users SET status = 'LOCKED', failed_attempts = $1, locked_until = $2 WHERE id = $3",
          [newFailedCount, lockUntil.toISOString(), user.id]
        );

        await recordAuditLog({
          userId: user.id,
          role: user.role,
          action: 'ACCOUNT_LOCKED',
          ipAddress,
          result: 'FAILED',
          details: `Account locked after ${MAX_FAILED_ATTEMPTS} consecutive failed password attempts.`
        });

        return res.status(403).json({
          success: false,
          error: `Account locked due to ${MAX_FAILED_ATTEMPTS} consecutive failed attempts. Please try again after 15 minutes.`
        });
      } else {
        await query("UPDATE users SET failed_attempts = $1 WHERE id = $2", [newFailedCount, user.id]);

        await recordAuditLog({
          userId: user.id,
          role: user.role,
          action: 'LOGIN_FAILED',
          ipAddress,
          result: 'FAILED',
          details: `Incorrect password. Failed attempt ${newFailedCount} of ${MAX_FAILED_ATTEMPTS}`
        });

        return res.status(401).json({
          success: false,
          error: `Invalid email or password credentials. (${MAX_FAILED_ATTEMPTS - newFailedCount} attempt(s) remaining before account lockout)`
        });
      }
    }

    // 5. Login Successful: Reset failed attempts & generate JWT
    await query("UPDATE users SET failed_attempts = 0, locked_until = NULL, status = 'ACTIVE' WHERE id = $1", [user.id]);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await recordAuditLog({
      userId: user.id,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      ipAddress,
      result: 'SUCCESS',
      details: `User logged in successfully with role ${user.role}`
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return res.status(500).json({ success: false, error: 'Internal security server error during authentication.' });
  }
});

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  const { name, email, password, role: requestedRole } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName = name.trim();

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  const validRoles = ['ADMIN', 'SETTER', 'REVIEWER', 'CONTROLLER', 'CANDIDATE'];
  const role = requestedRole && validRoles.includes(requestedRole.toUpperCase()) ? requestedRole.toUpperCase() : 'CANDIDATE';

  try {
    // 1. Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email address is already registered. Please sign in.' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert new user record
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, status, failed_attempts)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 0)`,
      [userId, trimmedName, normalizedEmail, hashedPassword, role]
    );

    // 4. Record audit log
    await recordAuditLog({
      userId,
      role,
      action: 'USER_REGISTERED',
      ipAddress,
      result: 'SUCCESS',
      details: `New account registered for ${normalizedEmail} with role ${role}`
    });

    // 5. Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: normalizedEmail,
        role,
        name: trimmedName
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: userId,
        name: trimmedName,
        email: normalizedEmail,
        role,
        status: 'ACTIVE'
      }
    });

  } catch (err) {
    console.error('[AUTH REGISTER ERROR]', err);
    return res.status(500).json({ success: false, error: 'Internal security server error during account registration.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/demo-switch
 * Instant role switching for evaluation / presentation demos
 */
router.post('/demo-switch', async (req, res) => {
  const { role } = req.body;
  const validRoles = ['ADMIN', 'SETTER', 'REVIEWER', 'CONTROLLER', 'CANDIDATE'];
  const targetRole = role ? role.toUpperCase() : 'ADMIN';

  if (!validRoles.includes(targetRole)) {
    return res.status(400).json({ success: false, error: 'Invalid role.' });
  }

  try {
    // Find or create demo user for requested role
    const email = `demo.${targetRole.toLowerCase()}@examvault.sec`;
    let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userResult.rows.length === 0) {
      const userId = uuidv4();
      const name = `Demo ${targetRole.charAt(0) + targetRole.slice(1).toLowerCase()} Officer`;
      const hash = await bcrypt.hash('DemoPass123!', 10);
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
        [userId, name, email, hash, targetRole]
      );
      user = { id: userId, name, email, role: targetRole, status: 'ACTIVE' };
    } else {
      user = userResult.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('[DEMO SWITCH ERROR]', err);
    return res.status(500).json({ success: false, error: 'Failed to switch demo role.' });
  }
});

module.exports = router;
