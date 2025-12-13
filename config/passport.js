// config/passport.js
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { User, Student } from '../models/index.js';
import { Op } from 'sequelize';

export default function initialize(passport) {

  // -----------------------------
  // Admin login
  // -----------------------------
  passport.use('local-admin', new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        console.log(`🔍 Looking for admin user: ${email}`);
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
          console.log(`❌ User not found: ${email}`);
          return done(null, false, { message: 'Email address not found. Please check your email and try again.' });
        }
        
        console.log(`✅ User found: ${email}, Role: ${user.role}`);
        
        if (!(user.role === 'admin' || user.role === 'super_admin' || user.role === 'superadmin')) {
          console.log(`❌ Access denied for role: ${user.role}`);
          return done(null, false, { message: 'Access denied. This account does not have admin privileges.' });
        }

        console.log(`🔐 Comparing password for: ${email}`);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`🔍 Password match result: ${isMatch}`);
        
        if (!isMatch) return done(null, false, { message: 'Incorrect password. Please check your password and try again.' });

        console.log(`✅ Login successful for: ${email}`);
        return done(null, user);
      } catch (err) {
        console.error('Admin authentication error:', err.message);
        return done(null, false, { message: 'Database connection error. Please try again.' });
      }
    }
  ));

  // -----------------------------
  // Student login
  // -----------------------------
  // Student login: allow login via registration number or email.
  passport.use('local-student', new LocalStrategy(
    { usernameField: 'regNumber' },
    async (username, password, done) => {
      try {
        const student = await Student.findOne({
          where: {
            [Op.or]: [
              { regNumber: username },
              { email: username }
            ]
          }
        });

        if (!student) return done(null, false, { message: 'Registration number or email not found. Please check your details and try again.' });

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password. Please check your password and try again.' });

        return done(null, student);
      } catch (err) {
        console.error('Student authentication error:', err.message);
        return done(null, false, { message: 'Database connection error. Please try again.' });
      }
    }
  ));

  // -----------------------------
  // Serialize & Deserialize
  // -----------------------------
  passport.serializeUser((user, done) => {
    // store both id and role
    done(null, { id: user.id, role: user.role || 'student' });
  });

  passport.deserializeUser(async (obj, done) => {
    try {
      if (obj.role === 'student') {
        const student = await Student.findByPk(obj.id);
        return done(null, student);
      } else {
        const user = await User.findByPk(obj.id);
        return done(null, user);
      }
    } catch (err) {
      done(err);
    }
  });
}
