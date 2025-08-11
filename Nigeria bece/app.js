const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const mysql = require('mysql2');
const flash = require('connect-flash');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

const app = express();

// ✅ Load environment variables
require('dotenv').config();

// ✅ Import Sequelize instance
const sequelize = require('./models/db');

// ✅ Test database connection
//sequelize.authenticate()
  //.then(() => console.log('✅ Database connected'))
  //.catch(err => console.error('❌ Connection error:', err));

// ✅ Import User model
const User = require('./models/User'); // Add this below sequelize

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    
    // Sync the model here
    return User.sync();
  })
  .then(() => console.log('✅ User table synced'))
  .catch(err => console.error('❌ Sync error:', err));

 







// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Flash messages
app.use(flash());

// Passport initialization
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Locals middleware (AFTER session and flash!)
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.messages = req.flash();
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
}); 

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const paymentRoutes = require('./routes/payment');

// After other routes
app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/payment', paymentRoutes);

// NEW route
app.get('/public/payment', (req, res) => {
  res.send('Payment Page');
});

// Error handling
app.use(errorHandler);


// Log all registered routes (for debugging)
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(r.route.path)
    }
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});