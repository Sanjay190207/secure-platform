const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-secure-exam-2026-sha256-kms-key';

/**
 * Audit Logger Helper
 */
async function recordAuditLog({ userId = null, role = 'GUEST', action, paperId = null, ipAddress, result, details = '' }) {
  try {
    await query(
      `INSERT INTO vault_audit_logs (id, user_id, role, action, question_paper_id, ip_address, result, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), userId, role, action, paperId, ipAddress || '127.0.0.1', result, details]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
}

/**
 * Authenticate User via JWT Header
 */
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await recordAuditLog({
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      ipAddress,
      result: 'DENIED',
      details: 'Missing or malformed Authorization header'
    });
    return res.status(401).json({ success: false, error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from DB or fallback to token decoded info
    let user = null;
    try {
      const result = await query('SELECT id, name, email, role, status, locked_until FROM vault_users WHERE id = $1 OR email = $2', [decoded.id, decoded.email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbErr) {
      console.warn('[AUTH MIDDLEWARE DB WARN]', dbErr.message);
    }

    if (!user) {
      user = {
        id: decoded.id || 'u-demo-1',
        name: decoded.name || 'Demo User',
        email: decoded.email || 'demo@secure.exam',
        role: decoded.role || 'SETTER',
        status: 'ACTIVE'
      };
    }

    // Check account status
    if (user.status === 'DISABLED') {
      await recordAuditLog({
        userId: user.id,
        role: user.role,
        action: 'DISABLED_ACCOUNT_ACCESS_ATTEMPT',
        ipAddress,
        result: 'DENIED',
        details: 'User account is administratively disabled.'
      });
      return res.status(403).json({ success: false, error: 'Account has been disabled by security administrator.' });
    }

    if (user.status === 'LOCKED') {
      const now = new Date();
      if (user.locked_until && new Date(user.locked_until) > now) {
        return res.status(403).json({
          success: false,
          error: `Account is temporarily locked due to multiple failed login attempts. Try again after ${new Date(user.locked_until).toLocaleTimeString()}.`
        });
      } else {
        // Lock expired, reset status
        await query("UPDATE vault_users SET status = 'ACTIVE', failed_attempts = 0, locked_until = NULL WHERE id = $1", [user.id]);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    await recordAuditLog({
      action: 'INVALID_TOKEN_ATTEMPT',
      ipAddress,
      result: 'DENIED',
      details: err.message
    });
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Check User Role Authorization (RBAC)
 */
function checkRole(...allowedRoles) {
  return async (req, res, next) => {
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Flatten and normalize allowedRoles to uppercase trimmed strings
    const rolesList = allowedRoles.flat().map(r => String(r).toUpperCase().trim());
    const userRole = (req.user && req.user.role) ? String(req.user.role).toUpperCase().trim() : 'GUEST';

    console.log('[DEBUG checkRole]', { userRole, rolesList, isAllowed: rolesList.includes(userRole) });

    if (!req.user || !rolesList.includes(userRole)) {
      await recordAuditLog({
        userId: req.user ? req.user.id : null,
        role: req.user ? req.user.role : 'GUEST',
        action: 'ROLE_AUTHORIZATION_FAILED',
        ipAddress,
        result: 'DENIED',
        details: `Role "${userRole}" tried to access resource requiring [${rolesList.join(', ')}]`
      });

      return res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted to [${rolesList.join(', ')}] roles.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateUser,
  checkRole,
  recordAuditLog
};
