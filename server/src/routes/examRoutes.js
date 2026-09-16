const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticateUser, checkRole, recordAuditLog } = require('../middleware/authMiddleware');
const { getPaperObject } = require('../services/storageService');
const { decryptPaperBuffer, verifyPaperIntegrity } = require('../services/cryptoService');

const router = express.Router();

/**
 * GET /api/exams
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const sql = `SELECT e.*, p.title as paper_title, p.file_hash, p.status as paper_status, u.name as creator_name 
                 FROM vault_exams e 
                 LEFT JOIN vault_question_papers p ON e.question_paper_id = p.id 
                 LEFT JOIN vault_users u ON e.created_by = u.id 
                 ORDER BY e.start_time ASC`;

    const result = await query(sql);
    const now = new Date();

    const exams = result.rows.map(exam => {
      const start = new Date(exam.start_time);
      const end = new Date(exam.end_time);
      let calculatedStatus = exam.status;

      if (now < start) {
        calculatedStatus = 'SCHEDULED';
      } else if (now >= start && now <= end) {
        calculatedStatus = 'ACTIVE';
      } else if (now > end) {
        calculatedStatus = 'COMPLETED';
      }

      return {
        ...exam,
        calculatedStatus,
        isReleaseWindow: now >= start && now <= end
      };
    });

    res.json({ success: true, count: exams.length, exams });
  } catch (err) {
    console.error('[GET EXAMS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve scheduled exams.' });
  }
});

/**
 * POST /api/exams
 * Exam Controllers schedule exam release windows (Paper MUST be APPROVED)
 */
router.post('/', authenticateUser, checkRole('CONTROLLER', 'ADMIN'), async (req, res) => {
  const { exam_name, question_paper_id, exam_date, start_time, end_time } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!exam_name || !question_paper_id || !exam_date || !start_time || !end_time) {
    return res.status(400).json({ success: false, error: 'All exam fields (exam_name, paper_id, date, start_time, end_time) are required.' });
  }

  try {
    // 1. Verify Question Paper Exists & Status is APPROVED
    const paperRes = await query('SELECT * FROM vault_question_papers WHERE id = $1', [question_paper_id]);
    if (paperRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Selected question paper not found.' });
    }

    const paper = paperRes.rows[0];

    if (paper.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: `Cannot schedule exam: Question paper "${paper.title}" is in "${paper.status}" state. Paper MUST be APPROVED by Chief Reviewer first!`
      });
    }

    const examId = uuidv4();
    const startIso = new Date(`${exam_date}T${start_time}:00`).toISOString();
    const endIso = new Date(`${exam_date}T${end_time}:00`).toISOString();

    // 2. Insert Exam Record
    await query(
      `INSERT INTO vault_exams (id, exam_name, question_paper_id, exam_date, start_time, end_time, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED', $7)`,
      [examId, exam_name, question_paper_id, exam_date, startIso, endIso, req.user.id]
    );

    // 3. Update Paper Status to SCHEDULED
    await query("UPDATE vault_question_papers SET status = 'SCHEDULED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [question_paper_id]);

    // 4. Record Audit Log
    await recordAuditLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'PAPER_SCHEDULED',
      paperId: question_paper_id,
      ipAddress,
      result: 'SUCCESS',
      details: `Exam "${exam_name}" scheduled for date ${exam_date} (${start_time} - ${end_time}). Paper status locked to SCHEDULED.`
    });

    res.status(201).json({
      success: true,
      message: `Exam "${exam_name}" scheduled successfully. Server time-lock engine activated.`,
      exam: {
        id: examId,
        exam_name,
        question_paper_id,
        exam_date,
        start_time: startIso,
        end_time: endIso,
        status: 'SCHEDULED'
      }
    });

  } catch (err) {
    console.error('[CREATE EXAM ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to schedule examination.' });
  }
});

/**
 * GET /api/exams/:id/question-paper
 * CORE TIME-LOCK RELEASE API: Server verifies time window, decrypts paper, verifies SHA-256 integrity & streams PDF
 */
router.get('/:id/question-paper', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    const examRes = await query(
      `SELECT e.*, p.title as paper_title, p.storage_object, p.file_hash, p.status as paper_status 
       FROM vault_exams e 
       JOIN vault_question_papers p ON e.question_paper_id = p.id 
       WHERE e.id = $1`,
      [id]
    );

    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Examination record not found.' });
    }

    const exam = examRes.rows[0];
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    // 1. SERVER-SIDE TIME LOCK VERIFICATION
    if (now < start) {
      await recordAuditLog({
        userId: req.user.id,
        role: req.user.role,
        action: 'PAPER_ACCESS_DENIED',
        paperId: exam.question_paper_id,
        ipAddress,
        result: 'DENIED',
        details: `PREMATURE ACCESS DENIED: User attempted to access paper before start time ${start.toLocaleTimeString()}`
      });

      return res.status(403).json({
        success: false,
        error: 'ACCESS DENIED: Question paper is LOCKED. It will be released automatically at the exact scheduled start time.',
        availableAt: start.toISOString(),
        status: 'LOCKED'
      });
    }

    if (now > end) {
      await recordAuditLog({
        userId: req.user.id,
        role: req.user.role,
        action: 'PAPER_ACCESS_DENIED',
        paperId: exam.question_paper_id,
        ipAddress,
        result: 'DENIED',
        details: `EXPIRED ACCESS DENIED: User attempted to access paper after exam end time ${end.toLocaleTimeString()}`
      });

      return res.status(403).json({
        success: false,
        error: 'EXAMINATION CLOSED: The examination window has expired. Paper access is no longer permitted.',
        status: 'CLOSED'
      });
    }

    // 2. TIME WINDOW IS ACTIVE (start <= now <= end)!
    // Check if paper compromised
    if (exam.paper_status === 'COMPROMISED') {
      await recordAuditLog({
        userId: req.user.id,
        role: req.user.role,
        action: 'RELEASE_BLOCKED_TAMPERED',
        paperId: exam.question_paper_id,
        ipAddress,
        result: 'TAMPERING_DETECTED',
        details: `CRITICAL ALERT: Blocked release of paper "${exam.paper_title}". File status is COMPROMISED!`
      });

      return res.status(400).json({
        success: false,
        error: 'CRITICAL SECURITY ALERT: Question paper release BLOCKED due to file tampering detection!',
        status: 'COMPROMISED'
      });
    }

    // 3. Fetch Encrypted Object from Private Storage Vault
    const encryptedBuffer = await getPaperObject(exam.storage_object);

    // 4. Decrypt AES-256-GCM Payload
    let decryptedPdfBuffer;
    try {
      decryptedPdfBuffer = decryptPaperBuffer(encryptedBuffer);
    } catch (e) {
      await query("UPDATE vault_question_papers SET status = 'COMPROMISED' WHERE id = $1", [exam.question_paper_id]);
      await recordAuditLog({
        userId: req.user.id,
        role: req.user.role,
        action: 'RELEASE_BLOCKED_DECRYPTION_FAILED',
        paperId: exam.question_paper_id,
        ipAddress,
        result: 'TAMPERING_DETECTED',
        details: `CRITICAL ALERT: Decryption failed during paper release stream.`
      });
      return res.status(400).json({
        success: false,
        error: 'CRITICAL SECURITY ALERT: Release blocked due to AES-256 authentication tag mismatch!'
      });
    }

    // 5. SHA-256 Pre-Release Integrity Verification
    const verification = verifyPaperIntegrity(decryptedPdfBuffer, exam.file_hash);
    if (!verification.verified) {
      await query("UPDATE vault_question_papers SET status = 'COMPROMISED' WHERE id = $1", [exam.question_paper_id]);
      await recordAuditLog({
        userId: req.user.id,
        role: req.user.role,
        action: 'RELEASE_BLOCKED_HASH_MISMATCH',
        paperId: exam.question_paper_id,
        ipAddress,
        result: 'TAMPERING_DETECTED',
        details: `CRITICAL ALERT: SHA-256 hash mismatch during paper release stream.`
      });
      return res.status(400).json({
        success: false,
        error: 'CRITICAL SECURITY ALERT: Release blocked due to SHA-256 hash mismatch!'
      });
    }

    // 6. Update Paper Status to RELEASED if not already
    await query("UPDATE vault_question_papers SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [exam.question_paper_id]);

    // 7. Audit Log
    await recordAuditLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'PAPER_RELEASED',
      paperId: exam.question_paper_id,
      ipAddress,
      result: 'SUCCESS',
      details: `Question paper "${exam.paper_title}" released securely to candidate during active exam window.`
    });

    // 8. Stream Secure PDF Response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${exam.paper_title}.pdf"`);
    res.send(decryptedPdfBuffer);

  } catch (err) {
    console.error('[RELEASE PAPER STREAM ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to release question paper stream.' });
  }
});

module.exports = router;
