// app.js
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import flash from 'connect-flash';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Database
import sequelize from './config/database.js';   // ✅ use your database.js
import './models/index.js';                     // ✅ ensure models are registered

// Models
import User from './models/User.js';
import Student from './models/Student.js';
import School from './models/School.js';

// Sync database
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .then(() => sequelize.sync()) // ✅ sync all models in one go
  .then(() => console.log('✅ Models synced'))
  .catch(err => console.error('❌ DB error:', err));

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// __dirname replacement for ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

// Session & Flash
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());

// Passport config
import configurePassport from './config/passport.js';
configurePassport(passport);

app.use(passport.initialize());
app.use(passport.session());

// Locals
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.messages = req.flash();
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import studentRoutes from './routes/studentRoutes.js';
import dashboardRoutes from './routes/dashboard.js';
// import resultsRoutes from './routes/results.js';

app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/payment', paymentRoutes);
app.use('/admin/students', studentRoutes);
app.use('/students', studentRoutes);
app.use('/dashboard', dashboardRoutes);
// app.use('/admin/results', resultsRoutes);

// Debug route list
app._router.stack.forEach(r => {
  if (r.route && r.route.path) console.log(r.route.path);
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
