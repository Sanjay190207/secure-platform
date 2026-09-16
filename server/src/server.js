const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { initDb } = require('./db');
const authRoutes = require('./routes/authRoutes');
const paperRoutes = require('./routes/paperRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditRoutes = require('./routes/auditRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Security Rate Limiter (Max 100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many security requests from this IP address, please try again later.'
  }
});
app.use('/api/', apiLimiter);

// Specific Auth Limiter (Max 15 login attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }
});
app.use('/api/auth/login', authLimiter);

// Middleware to ensure DB is initialized in serverless environment
let dbInitialized = false;
let dbInitPromise = null;

app.use(async (req, res, next) => {
  if (!dbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDb().then(() => {
        dbInitialized = true;
      }).catch(err => {
        console.error('[DB] Lazy initialization failed:', err);
        dbInitPromise = null;
      });
    }
    await dbInitPromise;
  }
  next();
});

// Route Declarations
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/security', auditRoutes);

// System Health Status Endpoint
app.get('/api/health', (req, res) => {
  const { getIsPg, getPgErrorMsg } = require('./db');
  res.json({
    status: 'ONLINE',
    system: 'Secure Question Paper Management System API',
    timestamp: new Date().toISOString(),
    security_mode: 'ENFORCED',
    platform: process.env.VERCEL ? 'VERCEL_SERVERLESS' : 'NODE_STANDALONE',
    database_connected: getIsPg() ? 'POSTGRESQL_SUPABASE' : 'SQLITE_FALLBACK',
    has_database_url: !!process.env.DATABASE_URL,
    postgres_error: getPgErrorMsg()
  });
});

// Start Server & Database for standalone Node environment
if (require.main === module || !process.env.VERCEL) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` SECURE EXAM PAPER MANAGEMENT BACKEND IS RUNNING        `);
      console.log(` Port: http://localhost:${PORT}                          `);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}  `);
      console.log(`=======================================================`);
    });
  }).catch(err => {
    console.error('[CRITICAL] Database initialization failed:', err);
  });
}

module.exports = app;
