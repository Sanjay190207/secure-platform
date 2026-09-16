const express = require('express');
const { query } = require('../db');
const { authenticateUser, checkRole, recordAuditLog } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce ADMIN role on all /api/admin routes
router.use(authenticateUser, checkRole('ADMIN'));

/**
 * GET /api/admin/users
 */
router.get('/users', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, status, failed_attempts, locked_until, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (err) {
    console.error('[ADMIN GET USERS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve user directory.' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 */
router.put('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const validRoles = ['ADMIN', 'SETTER', 'REVIEWER', 'CONTROLLER', 'CANDIDATE'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role specified.' });
  }

  try {
    const prev = await query('SELECT role, email FROM users WHERE id = $1', [id]);
    if (prev.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);

    await recordAuditLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'ROLE_CHANGED',
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Admin changed role of ${prev.rows[0].email} from ${prev.rows[0].role} to ${role}`
    });

    res.json({ success: true, message: `User role updated to ${role} successfully.` });
  } catch (err) {
    console.error('[ADMIN ROLE UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update user role.' });
  }
});

/**
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['ACTIVE', 'LOCKED', 'DISABLED'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status specified.' });
  }

  try {
    let extraFields = '';
    let params = [status, id];

    if (status === 'ACTIVE') {
      extraFields = ', failed_attempts = 0, locked_until = NULL';
    }

    await query(`UPDATE users SET status = $1 ${extraFields} WHERE id = $2`, params);

    await recordAuditLog({
      userId: req.user.id,
      role: req.user.role,
      action: status === 'DISABLED' ? 'ACCOUNT_DISABLED' : 'ACCOUNT_ACTIVATED',
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Admin set status of user ID ${id} to ${status}`
    });

    res.json({ success: true, message: `User account status changed to ${status}.` });
  } catch (err) {
    console.error('[ADMIN STATUS UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update user status.' });
  }
});

/**
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const usersCount = await query('SELECT COUNT(*) as total FROM users');
    const papersCount = await query('SELECT COUNT(*) as total FROM question_papers');
    const pendingApprovals = await query("SELECT COUNT(*) as total FROM question_papers WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')");
    const scheduledExams = await query("SELECT COUNT(*) as total FROM exams WHERE status = 'SCHEDULED'");
    const failedLogins = await query("SELECT COUNT(*) as total FROM audit_logs WHERE action IN ('LOGIN_FAILED', 'LOGIN_LOCKED_ACCOUNT_ATTEMPT')");
    const integrityFailures = await query("SELECT COUNT(*) as total FROM audit_logs WHERE result = 'TAMPERING_DETECTED'");

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].total || '0'),
        totalPapers: parseInt(papersCount.rows[0].total || '0'),
        pendingApprovals: parseInt(pendingApprovals.rows[0].total || '0'),
        scheduledExams: parseInt(scheduledExams.rows[0].total || '0'),
        failedLogins: parseInt(failedLogins.rows[0].total || '0'),
        integrityFailures: parseInt(integrityFailures.rows[0].total || '0')
      }
    });
  } catch (err) {
    console.error('[ADMIN STATS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to compute security stats.' });
  }
});

module.exports = router;
