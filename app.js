// app.js
// Main entry point for the BECE Portal application

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import { sequelize } from './config/index.js';
import cacheService from './services/cacheService.js';
import { securityHeaders, sanitizeInput, createRateLimit } from './middleware/security.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// ------------------------------
// Route Imports
// ------------------------------
import publicRoutes from './routes/public.js';
import apiRoutes from './routes/apiRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import webhookRoutes from './routes/webhook.js';

// Admin route group (single consolidated router)
import adminRoutes, { initializeSuperAdmins } from './routes/admin.js';

process.removeAllListeners('warning');

const app = express();

// ------------------------------
// Resolve __dirname (ESM fix)
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// Security Middleware
// ------------------------------
app.use(securityHeaders);
app.use(sanitizeInput);
app.use('/api/', createRateLimit(15 * 60 * 1000, 100)); // API rate limiting
app.use('/auth/', createRateLimit(15 * 60 * 1000, 20)); // Auth rate limiting
app.use('/payment/', createRateLimit(15 * 60 * 1000, 10)); // Payment rate limiting

// ------------------------------
// Core Middleware
// ------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------
// Session + Passport + Flash
// ------------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('SESSION_SECRET must be set in production'); })() : 'dev-session-secret'),
    resave: false,
    saveUninitialized: false,
    name: 'bece.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    },
    rolling: true // Reset expiry on activity
  })
);

// Passport setup
import initializePassport from './config/passport.js';
initializePassport(passport);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables (available in EJS)
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.user = req.user || null;
  res.locals.title = 'Nigeria BECE Portal';
  // expose current path for active link highlighting in templates
  res.locals.currentPath = req.path || req.originalUrl || '';
  next();
});

// ------------------------------
// EJS View Engine Setup
// ------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout/main');

// ------------------------------
// Request Logging Middleware
// ------------------------------
app.use((req, res, next) => {
  logger.debug(`[${req.method}] ${req.originalUrl}`);
  next();
});

// ------------------------------
// Routes
// ------------------------------
app.use('/', publicRoutes);
app.use('/students', studentRoutes);
app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api', apiRoutes);
app.use('/api', schoolRoutes);

// Admin Routes (single consolidated router)
app.use('/admin', adminRoutes);

// ------------------------------
// Health Check
// ------------------------------
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ------------------------------
// Error Handling (must be last)
// ------------------------------
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ------------------------------
// Server + DB Connection
// ------------------------------
const PORT = process.env.PORT || 3000;

// Start server immediately for Render port detection
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`, { port: PORT, env: process.env.NODE_ENV });
});

// Initialize database in background
sequelize
  .authenticate()
  .then(async () => {
    logger.info('Database connected successfully');
    
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await sequelize.sync({ force: false });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      logger.info('Tables synced successfully');
      
      // Seed states and LGAs (only if needed)
      const State = (await import('./models/State.js')).default;
      const existingStates = await State.count();
      if (existingStates === 0) {
        const seedStatesAndLGAs = (await import('./scripts/seedStatesAndLGAs.js')).default;
        await seedStatesAndLGAs();
      } else {
        logger.info('States already exist, skipping seeding');
      }
      
      // Initialize admins
      await initializeSuperAdmins();
      
    } catch (syncErr) {
      logger.error('Table sync failed', { error: syncErr.message });
    }
  })
  .catch((err) => {
    logger.error('Database connection failed', { error: err.message });
  });






  