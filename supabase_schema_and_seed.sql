-- ============================================================
-- SECURE EXAMINATION QUESTION PAPER VAULT
-- SUPABASE DATABASE SCHEMA & INITIAL SEED DATA
-- ============================================================
-- Run this entire script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Create Tables with 'vault_' prefix to isolate from other apps
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

-- 2. Insert Default Accounts for All 5 Roles (with pre-hashed bcrypt passwords)
INSERT INTO vault_users (id, name, email, password_hash, role, status, failed_attempts)
VALUES 
  ('u-admin-1', 'System Admin', 'admin@secure.exam', '$2a$10$Ii55mZCUm6RO/wB6l.4u2ukAG7Ze1OKUGxXzNjBuWw5K71OCz4Qy.', 'ADMIN', 'ACTIVE', 0),
  ('u-setter-1', 'Dr. Sarah Jenkins (Question Setter)', 'setter@secure.exam', '$2a$10$gSUU5UtuSMXaBG/O5A.pQOMcGW3DB6o.2CYnbbrAwQzKeM743YVlG', 'SETTER', 'ACTIVE', 0),
  ('u-reviewer-1', 'Prof. Robert Chen (Chief Reviewer)', 'reviewer@secure.exam', '$2a$10$irflmW5T87npJJoBYdQD1OjGny9lI26jUkuyaRF8ylJMhJ2EwGDzy', 'REVIEWER', 'ACTIVE', 0),
  ('u-controller-1', 'Exam Controller Marcus Vance', 'controller@secure.exam', '$2a$10$FK9RLTKH8FgeJMq2whB3gOPGyVrRQRVZqfMAP1M8Mjf7nSO07JM9y', 'CONTROLLER', 'ACTIVE', 0),
  ('u-candidate-1', 'Candidate Alex Turner', 'candidate@secure.exam', '$2a$10$5j79QWIjCXeWwKkIpjq3cuos5vRvhc2FFYY3n0eE0KFTCVBRjZvT6', 'CANDIDATE', 'ACTIVE', 0)
ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash,
  status = 'ACTIVE',
  failed_attempts = 0;

-- 3. Insert Sample Question Papers across different workflow states
INSERT INTO vault_question_papers (id, title, exam_name, storage_object, file_hash, status, uploaded_by)
VALUES
  ('p-net-2026', 'CSIR NET Quantum Physics Question Paper 2026', 'CSIR NET Physics 2026', 'papers/seed_p-net-2026.pdf.enc', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'SUBMITTED', 'u-setter-1'),
  ('p-upsc-2026', 'UPSC Mains General Studies Paper I', 'UPSC Civil Services Mains 2026', 'papers/seed_p-upsc-2026.pdf.enc', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 'APPROVED', 'u-setter-1'),
  ('p-gate-2026', 'GATE Computer Science & AI Advanced Paper', 'GATE Computer Science 2026', 'papers/seed_p-gate-2026.pdf.enc', '1111111111111111111111111111111111111111111111111111111111111111', 'RELEASED', 'u-setter-1')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Active Exam Schedules
INSERT INTO vault_exams (id, exam_name, question_paper_id, exam_date, start_time, end_time, status, created_by)
VALUES
  ('ex-gate-2026', 'GATE Computer Science 2026', 'p-gate-2026', '2026-09-16', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '3 hours', 'RELEASED', 'u-controller-1'),
  ('ex-upsc-2026', 'UPSC Civil Services Mains 2026', 'p-upsc-2026', '2026-09-16', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 3 hours', 'SCHEDULED', 'u-controller-1')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Initial Audit Log Entry
INSERT INTO vault_audit_logs (id, user_id, role, action, ip_address, result, details)
VALUES
  ('log-init-1', 'SYSTEM', 'SYSTEM', 'SYSTEM_INITIALIZED', '127.0.0.1', 'SUCCESS', 'Database schema created and initial sample question papers seeded in Supabase.')
ON CONFLICT (id) DO NOTHING;
