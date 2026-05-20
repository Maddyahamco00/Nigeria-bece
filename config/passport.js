// config/passport.js
// Passport strategies now delegate credential validation to AuthService.
// No business logic lives here — just wiring.

import { Strategy as LocalStrategy } from 'passport-local';
import { User, Student } from '../models/index.js';
import * as AuthService from '../src/auth/services/AuthService.js';
import logger from '../utils/logger.js';

export default function initialize(passport) {

  // ── Admin strategy ──────────────────────────────────────────────────────
  passport.use(
    'local-admin',
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await AuthService.validateAdminCredentials(email, password);
        return done(null, user);
      } catch (err) {
        // AuthenticationError → return false with message (not a system error)
        if (err.name === 'AuthenticationError') {
          return done(null, false, { message: err.message });
        }
        logger.error('Passport admin strategy error', { error: err.message });
        return done(err);
      }
    })
  );

  // ── Student strategy ────────────────────────────────────────────────────
  passport.use(
    'local-student',
    new LocalStrategy({ usernameField: 'regNumber' }, async (identifier, password, done) => {
      try {
        const student = await AuthService.validateStudentCredentials(identifier, password);
        return done(null, student);
      } catch (err) {
        if (err.name === 'AuthenticationError') {
          return done(null, false, { message: err.message });
        }
        logger.error('Passport student strategy error', { error: err.message });
        return done(err);
      }
    })
  );

  // ── Serialize / Deserialize ─────────────────────────────────────────────
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role || 'student' });
  });

  passport.deserializeUser(async ({ id, role }, done) => {
    try {
      if (role === 'student') {
        const student = await Student.findByPk(id);
        return done(null, student || false);
      }
      const user = await User.findByPk(id);
      return done(null, user || false);
    } catch (err) {
      logger.error('Passport deserialize error', { error: err.message });
      done(err);
    }
  });
}
