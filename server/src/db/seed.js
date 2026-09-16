const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb, query } = require('./index');
const { savePaperObject } = require('../services/storageService');
const { computeSha256, encryptPaperBuffer } = require('../services/cryptoService');

const usersToSeed = [
  {
    name: 'System Admin',
    email: 'admin@secure.exam',
    password: 'AdminPassword123!',
    role: 'ADMIN'
  },
  {
    name: 'Dr. Sarah Jenkins (Question Setter)',
    email: 'setter@secure.exam',
    password: 'SetterPassword123!',
    role: 'SETTER'
  },
  {
    name: 'Prof. Robert Chen (Chief Reviewer)',
    email: 'reviewer@secure.exam',
    password: 'ReviewerPassword123!',
    role: 'REVIEWER'
  },
  {
    name: 'Exam Controller Marcus Vance',
    email: 'controller@secure.exam',
    password: 'ControllerPassword123!',
    role: 'CONTROLLER'
  },
  {
    name: 'Candidate Alex Turner',
    email: 'candidate@secure.exam',
    password: 'CandidatePassword123!',
    role: 'CANDIDATE'
  }
];

async function seed() {
  console.log('[SEED] Initializing seed script...');
  await initDb();

  const userIds = {};

  for (const user of usersToSeed) {
    const existing = await query('SELECT * FROM users WHERE email = $1', [user.email]);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    if (existing.rows.length === 0) {
      const userId = uuidv4();
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, status, failed_attempts) 
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 0)`,
        [userId, user.name, user.email, hashedPassword, user.role]
      );
      userIds[user.role] = userId;
      console.log(`[SEED] Created ${user.role} user: ${user.email}`);
    } else {
      userIds[user.role] = existing.rows[0].id;
      await query(
        "UPDATE users SET role = $1, status = 'ACTIVE', failed_attempts = 0, locked_until = NULL, password_hash = $2 WHERE email = $3",
        [user.role, hashedPassword, user.email]
      );
      console.log(`[SEED] Reset default ${user.role} account: ${user.email}`);
    }
  }

  // Seed Sample Question Papers if table is empty
  const paperCountRes = await query('SELECT COUNT(*) FROM question_papers');
  if (parseInt(paperCountRes.rows[0].count) === 0) {
    console.log('[SEED] Seeding sample question papers...');

    const samplePapers = [
      {
        title: 'CSIR NET Quantum Physics Question Paper 2026',
        examName: 'CSIR NET Physics 2026',
        status: 'SUBMITTED'
      },
      {
        title: 'UPSC Mains General Studies Paper I',
        examName: 'UPSC Civil Services Mains 2026',
        status: 'APPROVED'
      },
      {
        title: 'GATE Computer Science & AI Advanced Paper',
        examName: 'GATE Computer Science 2026',
        status: 'RELEASED'
      }
    ];

    for (const paper of samplePapers) {
      const paperId = uuidv4();
      const pdfContent = `%PDF-1.4\n% Secure Question Paper Vault\nTitle: ${paper.title}\nExam: ${paper.examName}\nEncrypted AES-256 Payload Buffer\n%%EOF`;
      const pdfBuffer = Buffer.from(pdfContent);
      const fileHash = computeSha256(pdfBuffer);
      const encryptedPackedBuffer = encryptPaperBuffer(pdfBuffer);

      const storageObjName = `papers/seed_${paperId.slice(0, 8)}.pdf.enc`;
      await savePaperObject(storageObjName, encryptedPackedBuffer);

      await query(
        `INSERT INTO question_papers (id, title, exam_name, storage_object, file_hash, status, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [paperId, paper.title, paper.examName, storageObjName, fileHash, paper.status, userIds['SETTER']]
      );

      // Seed Exam Schedule for released paper
      if (paper.status === 'RELEASED' || paper.status === 'APPROVED') {
        const examId = uuidv4();
        const startTime = new Date(Date.now() - 3600000).toISOString();
        const endTime = new Date(Date.now() + 10800000).toISOString();
        await query(
          `INSERT INTO exams (id, exam_name, question_paper_id, exam_date, start_time, end_time, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [examId, paper.examName, paperId, '2026-09-16', startTime, endTime, paper.status === 'RELEASED' ? 'RELEASED' : 'SCHEDULED', userIds['CONTROLLER']]
        );
      }
    }
  }

  // Create initial audit log entry
  await query(
    `INSERT INTO audit_logs (id, user_id, role, action, ip_address, result, details) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), 'SYSTEM', 'SYSTEM', 'SYSTEM_INITIALIZED', '127.0.0.1', 'SUCCESS', 'Database seeded with default accounts, question papers, and exam schedules']
  );

  console.log('[SEED] Database seeding completed successfully.');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Error seeding database:', err);
      process.exit(1);
    });
}

module.exports = seed;
