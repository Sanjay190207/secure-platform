const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb, query } = require('./index');

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
      console.log(`[SEED] Created ${user.role} user: ${user.email}`);
    } else {
      await query(
        "UPDATE users SET role = $1, status = 'ACTIVE', failed_attempts = 0, locked_until = NULL, password_hash = $2 WHERE email = $3",
        [user.role, hashedPassword, user.email]
      );
      console.log(`[SEED] Reset default ${user.role} account: ${user.email}`);
    }
  }

  // Create initial audit log entry
  await query(
    `INSERT INTO audit_logs (id, user_id, role, action, ip_address, result, details) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), 'SYSTEM', 'SYSTEM', 'SYSTEM_INITIALIZED', '127.0.0.1', 'SUCCESS', 'Database seeded with default role accounts']
  );

  console.log('[SEED] Database seeding complete successfully.');
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
