const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pgPool = null;
let sqliteDb = null;
let isPg = false;
let pgErrorMsg = null;

// Initialize Database connection
async function initDb() {
  if (pgPool && isPg) {
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
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10
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
      console.error('[CRITICAL DB ERROR] PostgreSQL connection failed:', err.message);
    }
  }

  // 2. Local SQLite Fallback Setup (/tmp in Vercel serverless environment)
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

  return new Promise((resolve, reject) => {
    sqliteDb.exec(schemaSql, (err) => {
      if (err) {
        console.error('[DB] SQLite Schema Error:', err);
        reject(err);
      } else {
        console.log('[DB] Local SQLite Security Database initialized.');
        resolve();
      }
    });
  });
}

/**
 * Execute parameterized database query (supports PostgreSQL $1, $2 and converts to SQLite ? if needed)
 */
async function query(text, params = []) {
  if (isPg) {
    return pgPool.query(text, params);
  }

  // Convert $1, $2 parameter placeholders to ? for SQLite
  let paramIndex = 1;
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

module.exports = {
  initDb,
  query,
  getIsPg: () => isPg,
  getPgErrorMsg: () => pgErrorMsg
};
