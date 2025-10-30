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

// ------------------------------
// Route Imports
// ------------------------------
import publicRoutes from './routes/public.js';
import apiRoutes from './routes/apiRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';

// Admin route group (single consolidated router)
import adminRoutes from './routes/admin.js';

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

sequelize
  .sync({ alter: false })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });
