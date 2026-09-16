const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pgPool = null;
let sqliteDb = null;
let isPg = false;

// Initialize Database connection
async function initDb() {
  // 1. Try PostgreSQL connection if configured (via DATABASE_URL or DB parameters)
  try {
    const connectionString = process.env.DATABASE_URL;
    const poolConfig = connectionString ? {
      connectionString,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    } : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'secure_exam_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      connectionTimeoutMillis: 3000,
    };

    const pool = new Pool(poolConfig);

    const client = await pool.connect();
    client.release();

    // Auto-create PostgreSQL database tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
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

      CREATE TABLE IF NOT EXISTS question_papers (
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

      CREATE TABLE IF NOT EXISTS exams (
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

      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        question_paper_id TEXT,
        reviewer_id TEXT,
        decision TEXT NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
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

      CREATE TABLE IF NOT EXISTS access_attempts (
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
    console.log('[DB] Connected to PostgreSQL Database & initialized schema successfully.');

    // Auto-seed default accounts if database is empty
    try {
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCountRes.rows[0].count) === 0) {
        console.log('[DB] Database is empty. Seeding initial accounts...');
        const seed = require('./seed');
        await seed();
      }
    } catch (seedErr) {
      console.error('[DB] Auto-seeding check failed:', seedErr.message);
    }

    return;
  } catch (err) {
    console.log('[DB] PostgreSQL connection failed or not configured. Initializing local SQLite security database fallback:', err.message);
  }

  // 2. Local SQLite Fallback Setup (/tmp in Vercel serverless environment)
  const dbPath = process.env.VERCEL
    ? path.join('/tmp', 'local_dev_security.db')
    : path.join(__dirname, '../../local_dev_security.db');

  sqliteDb = new sqlite3.Database(dbPath);

  // Helper to run sqlite query as promise
  const sqliteRun = (sql, params = []) => new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  // Convert postgres syntax to sqlite schema
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
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

    CREATE TABLE IF NOT EXISTS question_papers (
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

    CREATE TABLE IF NOT EXISTS exams (
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

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      question_paper_id TEXT,
      reviewer_id TEXT,
      decision TEXT NOT NULL,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
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

    CREATE TABLE IF NOT EXISTS access_attempts (
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
  getIsPg: () => isPg
};
