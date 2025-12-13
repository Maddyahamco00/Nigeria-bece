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
    secret: process.env.SESSION_SECRET || 'secret_key', // ⚠️ Change this in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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
// Debugging Middleware (optional)
// ------------------------------
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
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
// Error Handling
// ------------------------------
// 404 handler - log details to help diagnose missing routes/static files
app.use((req, res) => {
  const info = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: {
      host: req.headers.host,
      referer: req.headers.referer || req.headers.referrer || null,
      'user-agent': req.headers['user-agent']
    }
  };
  console.warn('⛔ 404 Not Found:', info);
  // Render the 404 page and include the requested URL so it's visible in the browser
  res.status(404).render('404', { title: 'Page Not Found', requested: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: err.message || 'Something went wrong',
  });
});

// ------------------------------
// Server + DB Connection
// ------------------------------
const PORT = process.env.PORT || 3000;

// Start server first, then try database connection
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Try database connection (non-blocking)
sequelize
  .authenticate()
  .then(async () => {
    console.log('✅ Database connected successfully');
    
    // Create tables in correct order to handle foreign keys
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await sequelize.sync({ force: false });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Tables synced successfully');
      
      // Seed states and LGAs
      const seedStatesAndLGAs = (await import('../scripts/seedStatesAndLGAs.js')).default;
      await seedStatesAndLGAs();
      
      await initializeSuperAdmins();
      console.log('⚠️ Running without Redis cache (using mock client)');
    } catch (syncErr) {
      console.error('❌ Table sync failed:', syncErr.message);
    }
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    console.log('🔄 Server will keep running, database will retry on requests');
  });






  