# Refactoring Recommendations — Nigeria BECE Portal

## Phase Roadmap

```
Phase 1 (NOW)    — Analysis, documentation, safe structural fixes
Phase 2 (NEXT)   — Service layer extraction, consolidate duplicates
Phase 3          — Repository pattern, validators, centralized error handling
Phase 4          — PostgreSQL migration, Redis session store
Phase 5          — Microservice extraction (auth, payment, student, school)
Phase 6          — Golang services (exam processing, gazette generation)
Phase 7          — Next.js frontend, GraphQL API gateway
Phase 8          — Kubernetes deployment, full observability
```

---

## Phase 1 Completed — Safe Fixes Applied

The following were addressed in this phase without breaking functionality:

1. Documentation generated (this file + CURRENT_ARCHITECTURE.md, API_MAP.md, TECHNICAL_DEBT.md, DATABASE_ANALYSIS.md)
2. `config/env.js` — centralized environment validation
3. `utils/logger.js` — structured logger (replaces console.log)
4. `middleware/errorHandler.js` — centralized error handler (wired in app.js)

---

## Phase 2 — Service Layer Extraction (Recommended Next Step)

**Goal:** Extract business logic from route files into service classes. Zero API changes.

### Priority order:

#### 2a. Create `services/StudentService.js`
Consolidate the 3 duplicate registration paths:
```
StudentService.register(data)     ← from registerStudent, handleBiodata, /auth/student/register
StudentService.login(regNumber, password)
StudentService.updateProfile(id, data)
StudentService.changePassword(id, current, new)
StudentService.getWithRelations(id)
```

#### 2b. Create `services/AuthService.js`
```
AuthService.forgotPassword(email, userType)
AuthService.resetPassword(token, password, userType)
AuthService.validateResetToken(token, userType)
```

#### 2c. Create `services/PaymentService.js` (extend existing)
The existing `services/paymentService.js` is a good start. Extend it:
```
PaymentService.initialize(email, amount, metadata)
PaymentService.verify(reference)
PaymentService.handleCallback(txData)
PaymentService.getByReference(reference)
```

#### 2d. Create `services/AdminService.js`
```
AdminService.getDashboardAnalytics()   ← fix N+1 query
AdminService.getAnalytics()            ← add caching
AdminService.exportData(type)
AdminService.createUser(data)
```

---

## Phase 3 — Repository Pattern

**Goal:** Decouple services from Sequelize. Makes PostgreSQL migration and testing easier.

```
repositories/
├── UserRepository.js
├── StudentRepository.js
├── SchoolRepository.js
├── PaymentRepository.js
└── ResultRepository.js
```

Each repository wraps Sequelize calls. Services call repositories, not models directly.

---

## Phase 4 — Database Migration

### MySQL → PostgreSQL steps:
1. Export schema with `mysqldump --no-data`
2. Convert to PostgreSQL DDL (pgloader or manual)
3. Fix ENUM types, JSON → JSONB, FLOAT → DECIMAL
4. Add missing indexes (see DATABASE_ANALYSIS.md DB-006)
5. Replace `sequelize.sync()` with proper migrations
6. Add `paranoid: true` to User, Student, School models
7. Switch Sequelize dialect from `mysql` to `postgres`
8. Test all queries

### Add Redis session store:
```js
import connectRedis from 'connect-redis';
const RedisStore = connectRedis(session);
app.use(session({ store: new RedisStore({ client: redisClient }), ... }));
```

---

## Microservice Extraction Plan

### Services that should become independent microservices:

| Service | Technology | Reason |
|---|---|---|
| **auth-service** | Node.js | Stateless JWT auth, high request volume, independent scaling |
| **payment-service** | Node.js | Isolated Paystack integration, financial audit trail |
| **student-service** | Node.js | Core domain, high write volume during registration periods |
| **school-service** | Node.js | Low-change reference data, cacheable |
| **exam-service** | Golang | CPU-intensive result processing, gazette generation, PDF creation |
| **notification-service** | Node.js | Email + SMS, async queue-based, independent failure domain |

### Services that should stay together (initially):

| Module | Reason |
|---|---|
| Admin dashboard | Tightly coupled to all domains; extract last |
| Analytics | Depends on all data; use read replica instead |
| Certificate generation | Low volume; can stay in exam-service |

### Services that are performance bottlenecks:

| Module | Bottleneck | Solution |
|---|---|---|
| Admin analytics | 12 DB queries per page load | Cache with Redis (5 min TTL) |
| Student registration | Sequential DB writes | Queue with Bull |
| Gazette generation | Full table scan | Background job + pre-computed |
| Payment callback | Synchronous email + SMS | Move to notification queue |

---

## Immediate Safe Fixes (Do Now, No Risk)

These can be done without touching any business logic:

### Fix 1: Remove `/create-admin-now` endpoint
```js
// DELETE these lines from app.js (~line 100-120):
app.get('/create-admin-now', async (req, res) => { ... });
```

### Fix 2: Fix duplicate /health route
```js
// Remove the first simple /health handler, keep only the DB-checking one
```

### Fix 3: Fix duplicate profile routes in studentRoutes.js
```js
// Remove the second registration of:
router.get('/profile', requireStudent, renderProfile);
router.post('/profile', requireStudent, updateProfile);
```

### Fix 4: Fix npm start script
```json
// package.json
"start": "node app.js",
"dev": "nodemon app.js"
```

### Fix 5: Fix authController.js missing sendEmail import
```js
// controllers/authController.js — change:
import { sendTemplateEmail } from '../utils/sendEmail.js';
// to:
import sendEmail, { sendTemplateEmail } from '../utils/sendEmail.js';
```

### Fix 6: Add missing Payment model columns
```js
// models/Payment.js — add:
schoolId: { type: DataTypes.INTEGER, allowNull: true },
studentId: { type: DataTypes.INTEGER, allowNull: true },
paymentMethod: { type: DataTypes.STRING, allowNull: true }
```

### Fix 7: Normalize paymentStatus ENUM
```js
// Standardize to lowercase 'pending' | 'paid' everywhere
// Search and replace 'Paid' → 'paid', 'Pending' → 'pending' in all controllers/routes
```

---

## Dangerous Areas — Do Not Touch Without Tests

| Area | Risk | Reason |
|---|---|---|
| `models/index.js` associations | 🔴 High | Changing association order can drop FK columns |
| `config/passport.js` serialize/deserialize | 🔴 High | Breaking this logs out all users |
| `app.js` middleware order | 🟠 Medium | Security middleware must come before routes |
| `routes/payment.js` callback handler | 🟠 Medium | Paystack webhook timing is sensitive |
| `sequelize.sync()` in app.js | 🟠 Medium | Can alter production tables |
| Student registration flow | 🟡 Medium | 3 duplicate paths — fix one at a time |

---

## Suggested Next Step (Phase 2 Start)

The single safest and highest-value next action is:

**Extract `services/StudentService.js` and consolidate the 3 registration paths.**

Steps:
1. Write `StudentService.register(data)` that contains the logic from `registerStudent` in `studentController.js`
2. Update `POST /students/register` to call `StudentService.register()`
3. Update `POST /auth/student/register` to call `StudentService.register()`
4. Delete the duplicate logic from `handleBiodata` (or keep multi-step as a thin wrapper)
5. Write unit tests for `StudentService.register()`
6. Verify all 3 registration paths still work

This alone eliminates TD-009, reduces TD-010, and makes the registration flow testable.
