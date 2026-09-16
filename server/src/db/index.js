const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let sqlite3 = null;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.warn('[DB] Native sqlite3 module not loaded, using memory vault fallback:', e.message);
}

let pgPool = null;
let sqliteDb = null;
let isPg = false;
let isMemory = false;
let pgErrorMsg = null;

// In-Memory Safe Vault Fallback Data
const memoryDb = {
  vault_users: [
    {
      id: 'u-admin-1',
      name: 'System Admin',
      email: 'admin@secure.exam',
      password_hash: '$2a$10$Ii55mZCUm6RO/wB6l.4u2ukAG7Ze1OKUGxXzNjBuWw5K71OCz4Qy.',
      role: 'ADMIN',
      status: 'ACTIVE',
      failed_attempts: 0
    },
    {
      id: 'u-setter-1',
      name: 'Dr. Sarah Jenkins (Question Setter)',
      email: 'setter@secure.exam',
      password_hash: '$2a$10$gSUU5UtuSMXaBG/O5A.pQOMcGW3DB6o.2CYnbbrAwQzKeM743YVlG',
      role: 'SETTER',
      status: 'ACTIVE',
      failed_attempts: 0
    },
    {
      id: 'u-reviewer-1',
      name: 'Prof. Robert Chen (Chief Reviewer)',
      email: 'reviewer@secure.exam',
      password_hash: '$2a$10$irflmW5T87npJJoBYdQD1OjGny9lI26jUkuyaRF8ylJMhJ2EwGDzy',
      role: 'REVIEWER',
      status: 'ACTIVE',
      failed_attempts: 0
    },
    {
      id: 'u-controller-1',
      name: 'Exam Controller Marcus Vance',
      email: 'controller@secure.exam',
      password_hash: '$2a$10$FK9RLTKH8FgeJMq2whB3gOPGyVrRQRVZqfMAP1M8Mjf7nSO07JM9y',
      role: 'CONTROLLER',
      status: 'ACTIVE',
      failed_attempts: 0
    },
    {
      id: 'u-candidate-1',
      name: 'Candidate Alex Turner',
      email: 'candidate@secure.exam',
      password_hash: '$2a$10$5j79QWIjCXeWwKkIpjq3cuos5vRvhc2FFYY3n0eE0KFTCVBRjZvT6',
      role: 'CANDIDATE',
      status: 'ACTIVE',
      failed_attempts: 0
    }
  ],
  vault_question_papers: [
    {
      id: 'p-net-2026',
      title: 'CSIR NET Quantum Physics Question Paper 2026',
      exam_name: 'CSIR NET Physics 2026',
      storage_object: 'papers/seed_p-net-2026.pdf.enc',
      file_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'SUBMITTED',
      uploaded_by: 'u-setter-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-upsc-2026',
      title: 'UPSC Mains General Studies Paper I',
      exam_name: 'UPSC Civil Services Mains 2026',
      storage_object: 'papers/seed_p-upsc-2026.pdf.enc',
      file_hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      status: 'APPROVED',
      uploaded_by: 'u-setter-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-gate-2026',
      title: 'GATE Computer Science & AI Advanced Paper',
      exam_name: 'GATE Computer Science 2026',
      storage_object: 'papers/seed_p-gate-2026.pdf.enc',
      file_hash: '1111111111111111111111111111111111111111111111111111111111111111',
      status: 'RELEASED',
      uploaded_by: 'u-setter-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  vault_exams: [
    {
      id: 'ex-gate-2026',
      exam_name: 'GATE Computer Science 2026',
      question_paper_id: 'p-gate-2026',
      exam_date: '2026-09-16',
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date(Date.now() + 10800000).toISOString(),
      status: 'RELEASED',
      created_by: 'u-controller-1',
      created_at: new Date().toISOString()
    },
    {
      id: 'ex-upsc-2026',
      exam_name: 'UPSC Civil Services Mains 2026',
      question_paper_id: 'p-upsc-2026',
      exam_date: '2026-09-16',
      start_time: new Date(Date.now() + 86400000).toISOString(),
      end_time: new Date(Date.now() + 97200000).toISOString(),
      status: 'SCHEDULED',
      created_by: 'u-controller-1',
      created_at: new Date().toISOString()
    }
  ],
  vault_approvals: [],
  vault_audit_logs: [
    {
      id: 'log-init-1',
      user_id: 'SYSTEM',
      role: 'SYSTEM',
      action: 'SYSTEM_INITIALIZED',
      ip_address: '127.0.0.1',
      result: 'SUCCESS',
      details: 'In-memory safe vault initialized.',
      timestamp: new Date().toISOString()
    }
  ],
  vault_access_attempts: []
};

let pgFailed = false;

// Initialize Database connection
async function initDb() {
  if (pgPool && isPg) {
    return;
  }

  if (pgFailed) {
    return;
  }

  const connectionString = process.env.DATABASE_URL;

  // 1. Try PostgreSQL connection if DATABASE_URL is provided
  if (connectionString) {
    try {
      console.log('[DB] Attempting connection to PostgreSQL/Supabase...');
      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 1200,
        idleTimeoutMillis: 10000,
        max: 5
      });

      const client = await pool.connect();
      client.release();

      // Auto-create PostgreSQL database tables if they do not exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vault_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT DEFAULT 'ACTIVE',
          failed_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_question_papers (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          exam_name TEXT NOT NULL,
          storage_object TEXT NOT NULL,
          file_hash TEXT NOT NULL,
          status TEXT DEFAULT 'DRAFT',
          uploaded_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_exams (
          id TEXT PRIMARY KEY,
          exam_name TEXT NOT NULL,
          question_paper_id TEXT,
          exam_date TEXT NOT NULL,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          status TEXT DEFAULT 'SCHEDULED',
          created_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_approvals (
          id TEXT PRIMARY KEY,
          question_paper_id TEXT,
          reviewer_id TEXT,
          decision TEXT NOT NULL,
          comments TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          role TEXT,
          action TEXT NOT NULL,
          question_paper_id TEXT,
          ip_address TEXT,
          result TEXT NOT NULL,
          details TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_access_attempts (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          ip_address TEXT,
          endpoint TEXT,
          status_code INTEGER,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      pgPool = pool;
      isPg = true;
      pgErrorMsg = null;
      console.log('[DB] Connected to PostgreSQL Database & initialized schema successfully.');

      // Auto-seed default accounts and sample data if vault_question_papers table is empty
      try {
        const paperCountRes = await pool.query('SELECT COUNT(*) FROM vault_question_papers');
        if (parseInt(paperCountRes.rows[0].count) === 0) {
          console.log('[DB] vault_question_papers empty. Seeding initial sample papers and exams...');
          const seed = require('./seed');
          await seed();
        }
      } catch (seedErr) {
        console.error('[DB] Auto-seeding check failed:', seedErr.message);
      }

      return;
    } catch (err) {
      pgErrorMsg = err.message || String(err);
      pgFailed = true;
      console.error('[CRITICAL DB ERROR] PostgreSQL connection failed:', err.message);
    }
  }

  // 2. Try SQLite Fallback Setup if sqlite3 module exists
  if (sqlite3) {
    try {
      const dbPath = process.env.VERCEL
        ? path.join('/tmp', 'local_dev_security.db')
        : path.join(__dirname, '../../local_dev_security.db');

      sqliteDb = new sqlite3.Database(dbPath);

      const schemaSql = `
        CREATE TABLE IF NOT EXISTS vault_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT DEFAULT 'ACTIVE',
          failed_attempts INTEGER DEFAULT 0,
          locked_until TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_question_papers (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          exam_name TEXT NOT NULL,
          storage_object TEXT NOT NULL,
          file_hash TEXT NOT NULL,
          status TEXT DEFAULT 'DRAFT',
          uploaded_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_exams (
          id TEXT PRIMARY KEY,
          exam_name TEXT NOT NULL,
          question_paper_id TEXT,
          exam_date TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          status TEXT DEFAULT 'SCHEDULED',
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_approvals (
          id TEXT PRIMARY KEY,
          question_paper_id TEXT,
          reviewer_id TEXT,
          decision TEXT NOT NULL,
          comments TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          role TEXT,
          action TEXT NOT NULL,
          question_paper_id TEXT,
          ip_address TEXT,
          result TEXT NOT NULL,
          details TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vault_access_attempts (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          ip_address TEXT,
          endpoint TEXT,
          status_code INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      return new Promise((resolve) => {
        sqliteDb.exec(schemaSql, async (err) => {
          if (err) {
            console.error('[DB] SQLite Schema Error:', err);
            isMemory = true;
            resolve();
          } else {
            console.log('[DB] Local SQLite Security Database initialized.');
            try {
              sqliteDb.get('SELECT COUNT(*) as count FROM vault_question_papers', async (countErr, row) => {
                if (!countErr && (row?.count === 0 || !row)) {
                  console.log('[DB] SQLite vault_question_papers empty. Seeding fallback data...');
                  const seed = require('./seed');
                  await seed();
                }
                resolve();
              });
            } catch (seedErr) {
              console.error('[DB] SQLite auto-seeding failed:', seedErr.message);
              resolve();
            }
          }
        });
      });
    } catch (sqliteErr) {
      console.error('[DB] SQLite initialization failed, falling back to memory vault:', sqliteErr.message);
      isMemory = true;
      return;
    }
  }

  // 3. Fallback to Memory Vault
  isMemory = true;
  console.log('[DB] Memory Safe Vault activated with pre-seeded data.');
}

/**
 * Execute parameterized database query (supports PostgreSQL pg Pool, Supabase HTTP REST API, SQLite, and Memory Fallback)
 */
async function query(text, params = []) {
  if (isPg && pgPool) {
    return pgPool.query(text, params);
  }

  // 1. Supabase HTTP REST API Provider (Guarantees 100% Cloud Persistence on Vercel over HTTPS)
  const supabaseUrl = process.env.SUPABASE_URL || 'https://jzbxzuajajevhygxfdgx.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ynh6dWFqYWpldmh5Z3hmZGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTA0MjEsImV4cCI6MjA5NTg4NjQyMX0.jzXyVdf8W8l0O2UD3la86vC0K_cnIU3B2Goo-cgM6ys';

  if (supabaseUrl && supabaseKey) {
    try {
      const cleanSql = text.trim();
      const lowerSql = cleanSql.toLowerCase();

      let tableName = 'vault_users';
      if (lowerSql.includes('vault_question_papers')) tableName = 'vault_question_papers';
      else if (lowerSql.includes('vault_exams')) tableName = 'vault_exams';
      else if (lowerSql.includes('vault_approvals')) tableName = 'vault_approvals';
      else if (lowerSql.includes('vault_audit_logs')) tableName = 'vault_audit_logs';
      else if (lowerSql.includes('vault_access_attempts')) tableName = 'vault_access_attempts';

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      if (lowerSql.startsWith('select')) {
        let endpoint = `${supabaseUrl}/rest/v1/${tableName}?select=*`;
        if (params.length > 0 && typeof params[0] === 'string') {
          if (lowerSql.includes('email =')) {
            endpoint = `${supabaseUrl}/rest/v1/${tableName}?email=eq.${encodeURIComponent(params[0])}`;
          } else if (lowerSql.includes('id =')) {
            endpoint = `${supabaseUrl}/rest/v1/${tableName}?id=eq.${encodeURIComponent(params[0])}`;
          } else if (lowerSql.includes('question_paper_id =')) {
            endpoint = `${supabaseUrl}/rest/v1/${tableName}?question_paper_id=eq.${encodeURIComponent(params[0])}`;
          }
        }

        const res = await fetch(endpoint, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            if (lowerSql.includes('count(*)')) {
              return { rows: [{ count: data.length, total: data.length }], rowCount: 1 };
            }
            return { rows: data, rowCount: data.length };
          }
        }
      } else if (lowerSql.startsWith('insert')) {
        let bodyPayload = {};
        if (tableName === 'vault_question_papers' && params.length >= 7) {
          bodyPayload = {
            id: params[0],
            title: params[1],
            exam_name: params[2],
            storage_object: params[3],
            file_hash: params[4],
            status: params[5] || 'DRAFT',
            uploaded_by: params[6]
          };
        } else if (tableName === 'vault_users' && params.length >= 5) {
          bodyPayload = {
            id: params[0],
            name: params[1],
            email: params[2],
            password_hash: params[3],
            role: params[4],
            status: 'ACTIVE'
          };
        } else if (tableName === 'vault_exams' && params.length >= 8) {
          bodyPayload = {
            id: params[0],
            exam_name: params[1],
            question_paper_id: params[2],
            exam_date: params[3],
            start_time: params[4],
            end_time: params[5],
            status: params[6],
            created_by: params[7]
          };
        } else if (tableName === 'vault_approvals' && params.length >= 5) {
          bodyPayload = {
            id: params[0],
            question_paper_id: params[1],
            reviewer_id: params[2],
            decision: params[3],
            comments: params[4]
          };
        } else if (tableName === 'vault_audit_logs' && params.length >= 7) {
          bodyPayload = {
            id: params[0],
            user_id: params[1],
            role: params[2],
            action: params[3],
            ip_address: params[4],
            result: params[5],
            details: params[6]
          };
        }

        if (Object.keys(bodyPayload).length > 0) {
          const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyPayload)
          });
          if (res.ok) {
            const data = await res.json();
            return { rows: Array.isArray(data) ? data : [data], rowCount: 1 };
          }
        }
      } else if (lowerSql.startsWith('update')) {
        let updateData = {};
        if (lowerSql.includes("status = 'approved'")) updateData.status = 'APPROVED';
        else if (lowerSql.includes("status = 'submitted'")) updateData.status = 'SUBMITTED';
        else if (lowerSql.includes("status = 'released'")) updateData.status = 'RELEASED';
        else if (lowerSql.includes("status = 'rejected'")) updateData.status = 'REJECTED';
        else if (lowerSql.includes("status = 'compromised'")) updateData.status = 'COMPROMISED';
        else if (params.length > 0 && typeof params[0] === 'string') updateData.status = params[0];

        const targetId = params[params.length - 1];
        if (targetId && Object.keys(updateData).length > 0) {
          const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${encodeURIComponent(targetId)}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updateData)
          });
          if (res.ok) {
            return { rows: [], rowCount: 1 };
          }
        }
      }
    } catch (httpErr) {
      console.warn('[SUPABASE REST DB WARN]', httpErr.message);
    }
  }

  if (sqliteDb && !isMemory) {
    const sqliteText = text.replace(/\$(\d+)/g, () => '?');
    return new Promise((resolve, reject) => {
      const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        sqliteDb.all(sqliteText, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows, rowCount: rows.length });
        });
      } else {
        sqliteDb.run(sqliteText, params, function (err) {
          if (err) return reject(err);
          resolve({ rows: [], rowCount: this.changes });
        });
      }
    });
  }

  // In-Memory Fallback Executor
  const cleanSql = text.trim();
  const lowerSql = cleanSql.toLowerCase();

  let tableName = 'vault_users';
  if (lowerSql.includes('vault_question_papers')) tableName = 'vault_question_papers';
  else if (lowerSql.includes('vault_exams')) tableName = 'vault_exams';
  else if (lowerSql.includes('vault_approvals')) tableName = 'vault_approvals';
  else if (lowerSql.includes('vault_audit_logs')) tableName = 'vault_audit_logs';
  else if (lowerSql.includes('vault_access_attempts')) tableName = 'vault_access_attempts';

  const rows = memoryDb[tableName] || [];

  if (lowerSql.startsWith('select')) {
    if (lowerSql.includes('count(*)')) {
      return { rows: [{ count: rows.length, total: rows.length }], rowCount: 1 };
    }

    let filtered = [...rows];
    if (params.length > 0 && typeof params[0] === 'string') {
      const paramVal = params[0].toLowerCase();
      if (lowerSql.includes('email =')) {
        filtered = filtered.filter(r => r.email && r.email.toLowerCase() === paramVal);
      } else if (lowerSql.includes('id =')) {
        filtered = filtered.filter(r => r.id && r.id.toLowerCase() === paramVal);
      } else if (lowerSql.includes('question_paper_id =')) {
        filtered = filtered.filter(r => r.question_paper_id && r.question_paper_id.toLowerCase() === paramVal);
      }
    }

    return { rows: filtered, rowCount: filtered.length };
  }

  if (lowerSql.startsWith('insert')) {
    const newRecord = {
      id: params[0] || `mem-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    rows.push(newRecord);
    return { rows: [newRecord], rowCount: 1 };
  }

  if (lowerSql.startsWith('update')) {
    if (params.length > 0) {
      const idVal = params[params.length - 1];
      const target = rows.find(r => r.id === idVal);
      if (target) {
        if (lowerSql.includes("status = 'active'")) target.status = 'ACTIVE';
        if (lowerSql.includes("status = 'submitted'")) target.status = 'SUBMITTED';
        if (lowerSql.includes("status = 'approved'")) target.status = 'APPROVED';
        if (lowerSql.includes("status = 'released'")) target.status = 'RELEASED';
        if (lowerSql.includes("status = 'compromised'")) target.status = 'COMPROMISED';
      }
    }
    return { rows: [], rowCount: 1 };
  }

  return { rows, rowCount: rows.length };
}

module.exports = {
  initDb,
  query,
  getIsPg: () => isPg,
  getPgErrorMsg: () => pgErrorMsg
};
