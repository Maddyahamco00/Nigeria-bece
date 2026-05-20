# Technical Debt Register — Nigeria BECE Portal

Severity: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 CRITICAL — Security

### TD-001: Hardcoded credentials in app.js
- **File:** `app.js` lines ~100–120
- **Issue:** `/create-admin-now` endpoint creates a super admin with hardcoded email `maddyahamco00@gmail.com` and password `123456` — accessible by anyone with the URL.
- **Risk:** Full admin takeover by any unauthenticated user.
- **Fix:** Remove this endpoint entirely. Use `scripts/createSuperAdmin.js` instead.

### TD-002: Hardcoded super admin email in routes/admin.js
- **File:** `routes/admin.js` — `initializeSuperAdmins()`
- **Issue:** Personal email `maddyahamco00@gmail.com` hardcoded in production code.
- **Fix:** Move to `SUPER_ADMIN_EMAIL` environment variable.

### TD-003: Raw SQL with string interpolation in routes/payment.js
- **File:** `routes/payment.js` — `/callback` and `/verify` handlers
- **Issue:** `db.query(INSERT INTO pre_reg_payments ... VALUES (?, ...))` uses parameterized queries (safe), but the table `pre_reg_payments` is not a Sequelize model — bypasses ORM protections and schema validation.
- **Fix:** Create a proper `PreRegPayment` Sequelize model.

### TD-004: Raw SQL in gazetteController.js
- **File:** `controllers/gazetteController.js` — `getGazetteStats()`
- **Issue:** Direct `db.query()` with raw SQL strings. No input sanitization on the query itself.
- **Fix:** Replace with Sequelize query builder.

### TD-005: Session secret fallback
- **File:** `app.js` line ~55
- **Issue:** `secret: process.env.SESSION_SECRET || 'fallback-secret-key'` — if env var is missing in production, sessions are signed with a known public string.
- **Fix:** Throw an error on startup if `SESSION_SECRET` is not set in production.

### TD-006: School API routes have no authentication
- **File:** `routes/schoolRoutes.js` → `schoolController.js`
- **Issue:** `POST /api/schools`, `PUT /api/schools/:id`, `DELETE /api/schools/:id` have no auth middleware.
- **Fix:** Add `requireAdmin` middleware to all mutating school API routes.

### TD-007: Payment routes have no authentication
- **File:** `routes/payment.js`
- **Issue:** `/payment/init` and `/payment/verify` accept any request without rate limiting beyond the global 10/15min limit. No CSRF protection on state-changing POST routes.
- **Fix:** Add CSRF tokens to payment forms or use SameSite cookie + origin check.

---

## 🟠 HIGH — Architecture & Coupling

### TD-008: Business logic inside route files
- **File:** `routes/admin.js` (~700 lines), `routes/auth.js` (~350 lines), `routes/payment.js` (~250 lines), `routes/studentRoutes.js` (~200 lines)
- **Issue:** Database queries, email sending, SMS sending, and business rules are written directly inside route handlers. This makes testing impossible and violates separation of concerns.
- **Fix:** Extract to service layer (Phase 2).

### TD-009: Duplicate registration logic
- **Files:** `routes/auth.js` POST `/auth/student/register` AND `routes/studentRoutes.js` POST `/students/register` AND `controllers/studentController.js` `registerStudent()`
- **Issue:** Three separate code paths for student registration with slightly different behavior (different reg number formats, different session handling).
- **Risk:** Inconsistent data, bugs when one path is updated but not others.
- **Fix:** Consolidate to a single `StudentService.register()` method.

### TD-010: Duplicate login logic
- **Files:** `routes/auth.js` POST `/auth/student/login` (Passport) AND `controllers/studentController.js` `loginStudent()` (manual session)
- **Issue:** Two login mechanisms for students — one uses Passport, one manually queries DB and sets `req.session.student`. Both are active.
- **Risk:** Session inconsistency, auth bypass edge cases.

### TD-011: Duplicate dashboard route
- **File:** `routes/studentRoutes.js`
- **Issue:** `GET /students/profile` and `POST /students/profile` are registered TWICE (lines ~80 and ~130).
- **Fix:** Remove duplicate registrations.

### TD-012: adminController.js is unused
- **File:** `controllers/adminController.js`
- **Issue:** `getDashboard`, `getUsers`, `createUser`, `exportData` are defined but `routes/admin.js` does NOT import or use this controller — all logic is re-implemented inline in the route file.
- **Fix:** Either wire the controller or remove it to avoid confusion.

### TD-013: Mixed ORM and raw SQL
- **Files:** `routes/admin.js` (uses `db.sequelize.fn`), `routes/payment.js` (raw `db.query`), `controllers/gazetteController.js` (raw `db.query`)
- **Issue:** Inconsistent data access patterns make it hard to switch databases later.

### TD-014: `sequelize` imported from two different paths
- **Files:** Multiple files import from `'../config/database.js'` directly AND from `'../config/index.js'`
- **Issue:** Both export the same instance but creates confusion and potential circular dependency risk.

### TD-015: `errorMiddleware.js` exists but is not wired
- **File:** `middleware/errorMiddleware.js`
- **Issue:** The file exists but is never imported in `app.js`. The app uses inline error handlers instead.

### TD-016: `passport.js` initialized twice
- **Files:** `app.js` calls `initializePassport(passport)` AND `middleware/auth.js` also calls `initializePassport(passport)` at module load time.
- **Issue:** Passport strategies are registered twice, which can cause unexpected behavior.

---

## 🟡 MEDIUM — Code Quality

### TD-017: Excessive console.log in production code
- **Files:** `controllers/studentController.js` (30+ console.log calls), `routes/auth.js`, `routes/admin.js`
- **Issue:** Debug logs expose internal data structures and slow down I/O in production.
- **Fix:** Replace with structured logger (winston is already installed).

### TD-018: No centralized logger
- **Issue:** `winston` is in `package.json` and `src/utils/logger.ts` exists but is never used in the main app. All logging is `console.log/error`.
- **Fix:** Wire `src/utils/logger.ts` (or create `utils/logger.js`) and replace console calls.

### TD-019: N+1 query in admin dashboard
- **File:** `routes/admin.js` — `/dashboard` and `/dashboard/live/recent`
- **Issue:** For each recent student, a separate `Payment.findOne()` is executed inside `Promise.all(recentStudents.map(...))`. With 10 students = 11 queries.
- **Fix:** Use a single JOIN query or subquery.

### TD-020: N+1 query in analytics route
- **File:** `routes/admin.js` — `/analytics`
- **Issue:** 12 parallel queries including complex aggregations. No caching applied despite `cacheService` being available.
- **Fix:** Cache analytics results for 5 minutes (APP_CONFIG.CACHE.STATS = 300).

### TD-021: `generateStudentCode` uses last student ID as sequence
- **File:** `utils/generateStudentCode.js`
- **Issue:** `sequence = lastStudent.id + 1` — uses database auto-increment ID as sequence number. If a student is deleted, the sequence can produce duplicate codes.
- **Fix:** Use `Student.count({ where: { schoolId } }) + 1` or a dedicated sequence table.

### TD-022: Payment model missing `schoolId` and `studentId` in definition
- **File:** `models/Payment.js`
- **Issue:** `schoolId` and `studentId` are used in associations (`models/index.js`) but not defined as explicit columns in the Payment model definition. Sequelize adds them implicitly but this is fragile.
- **Fix:** Add explicit column definitions.

### TD-023: `config/states.js` is a static array (legacy)
- **File:** `config/states.js`
- **Issue:** States are stored both in the database (State model) and as a static JS array. `publicController.js` uses the static array.
- **Fix:** Remove static array; always query from DB (with caching).

### TD-024: `package.json` main points to `dist/app.js` but app runs from `app.js`
- **File:** `package.json`
- **Issue:** `"main": "dist/app.js"` and `"start": "node dist/app.js"` but there is no TypeScript build that produces `dist/app.js` from the root `app.js`. The `dev` script runs `tsx watch src/app.ts` which doesn't exist. The actual app is `app.js` (ESM).
- **Risk:** `npm start` will fail in production if `dist/` doesn't exist.
- **Fix:** Fix scripts to `"start": "node app.js"` and `"dev": "nodemon app.js"`.

### TD-025: `src/` directory is a ghost
- **File:** `src/` directory
- **Issue:** Contains `config/swagger.ts`, `graphql/schema.ts`, `utils/logger.ts`, `types/modules.d.ts` — none of these are imported by the running application. They appear to be aspirational scaffolding.

### TD-026: `services/` directory has two layers
- **Issue:** `services/paymentService.js`, `services/cacheService.js`, `services/smsService.js` are the real services used by the app. The `services/auth-service/`, `services/payment-service/`, etc. subdirectories are separate microservice scaffolding that is NOT connected to the running app.
- **Risk:** Confusion about what is actually running.

### TD-027: `shared/` directory is unused
- **Issue:** `shared/constants/`, `shared/database/`, `shared/middleware/`, etc. exist but nothing in the main app imports from them.

### TD-028: `gateway/` directory is unused
- **Issue:** Kong/nginx gateway config exists but is not connected to the running app.

---

## 🟢 LOW — Minor Issues

### TD-029: `routes/payment.js` imports `DataTypes` and defines a model inline
- **File:** `routes/payment.js` — POST `/payment/pay`
- **Issue:** `sequelize.define('PreRegPayment', ...)` is called inside a route handler on every request. This re-defines the model on every POST.

### TD-030: `authController.js` calls `sendEmail` but it's not imported
- **File:** `controllers/authController.js`
- **Issue:** `sendEmail(...)` is called in `forgotPassword` and `resetPassword` but only `sendTemplateEmail` is imported. `sendEmail` is the default export — the import line is `import { sendTemplateEmail } from '../utils/sendEmail.js'` which misses the default.
- **Risk:** Runtime error when password reset is triggered.

### TD-031: Duplicate `/health` route
- **File:** `app.js`
- **Issue:** `/health` is registered twice — once as a simple OK response and once as a full DB health check. Express uses the first match, so the DB check is never reached.

### TD-032: `routes/payment.js` — `/payment/complete` handler is empty
- **File:** `routes/payment.js`
- **Issue:** `router.get('/complete', ...)` has all logic commented out and does nothing. Requests to this route get no response (hang).

### TD-033: `middleware/auth.js` re-initializes Passport
- **File:** `middleware/auth.js`
- **Issue:** Calls `initializePassport(passport)` at module load time, which is also called in `app.js`. Strategies are registered twice.

### TD-034: No input validation on admin result creation
- **File:** `routes/admin.js` — POST `/admin/results` (if it exists)
- **Issue:** No validation middleware on result upload endpoint.

### TD-035: `scripts/` directory has 16 utility scripts with no documentation
- **Issue:** Scripts like `fixAdmin.js`, `fixPaymentStatus.js`, `addKadunaSchool.js` suggest past data fixes were done manually. No runbook exists.
