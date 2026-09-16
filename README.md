# 🛡️ Secure Cloud-Based Examination Question Paper Management System

A zero-trust, end-to-end encrypted cloud portal designed for competitive examination boards, university testing bodies, and certification authorities. This platform safeguards sensitive question papers across their entire lifecycle—from initial drafting and peer review to exam scheduling, distribution, and tamper-proof audit logging.

---

## 📖 Project Overview

Managing high-stakes competitive examination question papers requires strict confidentiality, tamper prevention, and fine-grained access control. This system replaces paper-based or unencrypted workflows with a security-hardened digital vault. 

It provides tailored workflows for five distinct organizational roles:
- **Question Setter:** Drafts and encrypts question papers using AES-256 before submitting them to the vault.
- **Chief Reviewer:** Inspects submitted papers, verifies SHA-256 cryptographic signatures, and approves or rejects content.
- **Exam Controller:** Schedules examination timetables, links approved question papers, and unlocks papers only during official testing windows.
- **Candidate:** Securely views authorized question papers during active exam time windows.
- **System Admin:** Manages user accounts, enforces security policies, and monitors immutable system audit logs.

---

## 🧰 Technologies & Tools Used

### **Frontend**
- **React.js (Vite):** Lightweight, fast single-page application framework.
- **Vanilla CSS Design System:** Custom dark-mode UI featuring glassmorphism, responsive dynamic layouts, and modern typography.
- **Lucide React:** Icon library for visual feedback and role branding.
- **Axios:** HTTP client with automatic JWT bearer token interceptors.

### **Backend**
- **Node.js & Express.js:** Modular REST API architecture handling authentication, RBAC, and paper operations.
- **JSON Web Tokens (JWT):** Statereadable token authentication for stateless authorization.
- **Bcrypt.js:** Password hashing with salting to protect user credentials.
- **Multer:** Secure multi-part file upload processing.

### **Security & Cryptography**
- **AES-256-GCM Envelope Encryption:** Protects paper documents before cloud storage.
- **SHA-256 Hashing:** Generates unique file signatures to detect paper tampering or unauthorized modifications.

### **Database & Hosting**
- **Supabase (PostgreSQL):** Primary cloud database for persistent storage.
- **Multi-Tier Database Driver:** Hybrid fallback architecture supporting PostgreSQL connection pooling, Supabase HTTPS REST API, SQLite, and an in-memory safe vault.
- **Vercel:** Cloud serverless deployment.

---

## 🚀 Installation & Setup Guide

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (Node Package Manager)

### **Step 1: Clone the Repository**
bash
git clone https://github.com/Sanjay190207/secure-platform.git
cd secure-platform

### **Step 2: Install Dependencies**
Install dependencies for the root, backend server, and frontend client:
bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

### **Step 3: Configure Environment Variables**
Create a `.env` file inside the `server/` directory:
env
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-key-secure-exam-2026-sha256-kms-key
JWT_EXPIRES_IN=8h

# Supabase PostgreSQL Database URL
DATABASE_URL=postgresql://postgres.jzbxzuajajevhygxfdgx:Mass_123S19@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase REST API Credentials
SUPABASE_URL=https://jzbxzuajajevhygxfdgx.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

### **Step 4: Seed the Database**
Run the automated seed script to populate default demo accounts and sample question papers:
bash
cd server
node src/db/seed.js
cd ..

### **Step 5: Run the Project Locally**
Start both backend and frontend development servers concurrently:
bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 3000)
npm run dev:client

Open your browser and navigate to **`http://localhost:3000`**.

---

## 📁 Project Structure & Modules

secure-platform/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components & Role Switcher Bar
│   │   ├── context/            # AuthContext provider & JWT state management
│   │   ├── pages/              # Role-specific dashboard pages
│   │   │   ├── SetterDashboard.jsx       # Question paper creation & upload
│   │   │   ├── ReviewerDashboard.jsx     # Paper verification & approval
│   │   │   ├── ControllerDashboard.jsx   # Exam scheduling & paper release
│   │   │   ├── CandidateDashboard.jsx    # Candidate paper access during exams
│   │   │   ├── AdminDashboard.jsx        # User management & audit log monitoring
│   │   │   └── Login.jsx                 # Secure login page
│   │   ├── services/           # Axios HTTP client configuration
│   │   ├── App.jsx             # React router & protected routes
│   │   └── index.css           # Global design system & theme variables
│   └── package.json
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── db/                 # Database layer & multi-tier fallback engine
│   │   │   ├── index.js        # PostgreSQL / Supabase REST / SQLite driver
│   │   │   └── seed.js         # Default account & sample data seeder
│   │   ├── middleware/         # Security & authentication middleware
│   │   │   └── authMiddleware.js # JWT verification & RBAC check
│   │   ├── routes/             # REST API endpoint handlers
│   │   │   ├── authRoutes.js   # Login, registration, & demo role switching
│   │   │   ├── paperRoutes.js  # Paper upload, status update, & decryption
│   │   │   ├── examRoutes.js   # Exam timetable scheduling & paper release
│   │   │   ├── adminRoutes.js  # User administration & statistics
│   │   │   └── auditRoutes.js  # Security audit log queries
│   │   ├── services/           # Core encryption & file storage services
│   │   │   ├── cryptoService.js  # AES-256 encryption & SHA-256 hash verify
│   │   │   └── storageService.js # Secure object storage vault
│   │   └── server.js           # Express app entrypoint & route registration
│   └── package.json
│
├── supabase_schema_and_seed.sql # Complete Supabase SQL Editor schema script
├── vercel.json                  # Serverless deployment configuration
└── README.md                    # Project documentation

---

## 📥 Sample Input & Output

### **Sample 1: Demo Role Switch**

#### **Request (Input)**
- **Endpoint:** `POST /api/auth/demo-switch`
- **Headers:** `Content-Type: application/json`
- **Body:**
json
{
  "role": "SETTER"
}

#### **Response (Output)**
json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUtc2V0dGVyLTEiLCJlbWFpbCI6InNldHRlckBzZWN1cmUuZXhhbSIsInJvbGUiOiJTRVRURVIiLCJuYW1lIjoiRHIuIFNhcmFoIEplbmtpbnMgKFF1ZXN0aW9uIFNldHRlcikiLCJpYXQiOjE3ODAzMTA0MjEsImV4cCI6MjA5NTg4NjQyMX0...",
  "user": {
    "id": "u-setter-1",
    "name": "Dr. Sarah Jenkins (Question Setter)",
    "email": "setter@secure.exam",
    "role": "SETTER",
    "status": "ACTIVE"
  }
}

---

### **Sample 2: Create & Encrypt Question Paper**

#### **Request (Input)**
- **Endpoint:** `POST /api/papers`
- **Headers:** `Authorization: Bearer <SETTER_JWT_TOKEN>`
- **Form-Data:**
  - `title`: `"GATE Computer Science & AI Advanced Paper 2026"`
  - `examName`: `"GATE 2026"`
  - `file`: `[binary PDF document upload]`

#### **Response (Output)**
json
{
  "success": true,
  "message": "Question paper encrypted and stored in secure vault successfully.",
  "paper": {
    "id": "p-gate-2026-c9a",
    "title": "GATE Computer Science & AI Advanced Paper 2026",
    "examName": "GATE 2026",
    "status": "SUBMITTED",
    "fileHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "storageObject": "papers/seed_p-gate-2026.pdf.enc",
    "uploadedBy": "u-setter-1",
    "createdAt": "2026-09-16T22:30:00.000Z"
  }
}

---

### **Sample 3: System Security Audit Log Inspection**

#### **Request (Input)**
- **Endpoint:** `GET /api/audit/logs`
- **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`

#### **Response (Output)**
json
{
  "success": true,
  "count": 3,
  "logs": [
    {
      "id": "log-init-1",
      "user_id": "u-setter-1",
      "role": "SETTER",
      "action": "PAPER_UPLOADED_AND_ENCRYPTED",
      "question_paper_id": "p-gate-2026-c9a",
      "ip_address": "127.0.0.1",
      "result": "SUCCESS",
      "details": "Encrypted with AES-256-GCM. SHA-256 signature verified.",
      "timestamp": "2026-09-16T22:30:01.000Z"
    }
  ]
}

---

## 👤 Default Demo User Credentials

For testing purposes, the following pre-configured demo user accounts are available:

| Role | Email | Password | Allowed Actions |
|---|---|---|---|
| **Question Setter** | `setter@secure.exam` | `SetterPassword123!` | Create, encrypt, and submit question papers |
| **Chief Reviewer** | `reviewer@secure.exam` | `ReviewerPassword123!` | Inspect encrypted papers, verify signatures, approve/reject |
| **Exam Controller** | `controller@secure.exam` | `ControllerPassword123!` | Schedule exam dates/times and release papers |
| **Candidate** | `candidate@secure.exam` | `CandidatePassword123!` | Access released papers during active exam window |
| **System Admin** | `admin@secure.exam` | `AdminPassword123!` | Manage users, view statistics, and inspect security audit logs |

---

## 📜 License & Compliance

This project is built for educational and enterprise evaluation purposes. All cryptographic algorithms follow standard NIST-approved recommendations for symmetric encryption (`AES-256-GCM`) and cryptographic hashing (`SHA-256`).