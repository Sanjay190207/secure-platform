const express = require('express');
const { query } = require('../db');
const { authenticateUser, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Restrict audit endpoints to ADMIN and CONTROLLER roles
router.use(authenticateUser);
router.use(checkRole('ADMIN', 'CONTROLLER'));

/**
 * GET /api/audit
 * Query filters: action, result, search, limit
 */
router.get('/', async (req, res) => {
  const { action, result: resultFilter, search, limit = 100 } = req.query;

  try {
    let sql = `SELECT a.*, u.name as user_name, u.email as user_email 
               FROM vault_audit_logs a 
               LEFT JOIN vault_users u ON a.user_id = u.id 
               WHERE 1=1`;
    const params = [];

    if (action) {
      params.push(action);
      sql += ` AND a.action = $${params.length}`;
    }

    if (resultFilter) {
      params.push(resultFilter);
      sql += ` AND a.result = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (a.details LIKE $${params.length} OR a.ip_address LIKE $${params.length} OR u.email LIKE $${params.length})`;
    }

    params.push(parseInt(limit));
    sql += ` ORDER BY a.timestamp DESC LIMIT $${params.length}`;

    const resDb = await query(sql, params);
    res.json({
      success: true,
      count: resDb.rows.length,
      auditLogs: resDb.rows
    });
  } catch (err) {
    console.error('[GET SIEM AUDIT LOGS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve SIEM audit logs.' });
  }
});

/**
 * GET /api/security/events
 * High-severity security events summary
 */
router.get('/events', async (req, res) => {
  try {
    const criticalEvents = await query(
      `SELECT a.*, u.name as user_name, u.email as user_email 
       FROM vault_audit_logs a 
       LEFT JOIN vault_users u ON a.user_id = u.id 
       WHERE a.result IN ('DENIED', 'TAMPERING_DETECTED', 'FAILED') OR a.action IN ('ACCOUNT_LOCKED', 'INTEGRITY_FAILURE') 
       ORDER BY a.timestamp DESC LIMIT 50`
    );

    res.json({
      success: true,
      count: criticalEvents.rows.length,
      criticalEvents: criticalEvents.rows
    });
  } catch (err) {
    console.error('[GET SECURITY EVENTS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve security incident events.' });
  }
});

module.exports = router;
