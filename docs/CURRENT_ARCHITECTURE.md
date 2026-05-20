# Current Architecture — Nigeria BECE Monolith

## Runtime Overview

| Property | Value |
|---|---|
| Runtime | Node.js 18+ (ESM modules) |
| Framework | Express.js 4.x |
| Database | MySQL via Sequelize ORM |
| Cache | Redis (ioredis / redis v4) — optional, gracefully degrades |
| Auth | Passport.js (local-admin + local-student strategies) |
| Session | express-session (cookie-based, 24h TTL) |
| View Engine | EJS + express-ejs-layouts |
| Email | Nodemailer (SMTP) + EJS templates |
| SMS | Termii API (smsService.js) |
| Payments | Paystack (REST via fetch/axios) |
| Entry Point | `app.js` (ESM) |

---

## Module Map

```
app.js
├── config/
│   ├── database.js       — Sequelize instance (MySQL, 3 env branches)
│   ├── index.js          — Re-exports sequelize + PAYSTACK_CONFIG
│   ├── passport.js       — local-admin + local-student strategies
│   ├── constants.js      — APP_CONFIG (limits, routes, messages, roles)
│   ├── redis.js          — Redis client (optional)
│   └── states.js         — Static states array (legacy)
│
├── models/
│   ├── index.js          — Loads all models + defines all associations
│   ├── User.js           — Admin users (bcrypt hooks, RBAC roles)
│   ├── Student.js        — Student records
│   ├── School.js         — Schools
│   ├── State.js          — Nigerian states
│   ├── LGA.js            — Local Government Areas
│   ├── Subject.js        — Exam subjects
│   ├── Payment.js        — Payment records (Paystack)
│   ├── Result.js         — Exam results
│   ├── ExamTimetable.js  — Timetable entries
│   ├── ExamCenter.js     — Exam centers
│   └── Certificate.js    — Digital certificates
│
├── middleware/
│   ├── auth.js           — isAuthenticated, isAdmin, ensureStudent
│   ├── roleMiddleware.js — requireRole, requireAdmin, requireSuperAdmin, checkPermission
│   ├── security.js       — helmet, rate-limit, XSS sanitize
│   ├── validationMiddleware.js — express-validator schemas
│   └── errorMiddleware.js — (exists but not wired in app.js)
│
├── controllers/
│   ├── adminController.js   — getDashboard, getUsers, createUser, exportData
│   ├── authController.js    — register, login, forgotPassword, resetPassword, logout
│   ├── paymentController.js — renderPaymentPage, initializePayment, verifyPayment, renderSuccessPage
│   ├── studentController.js — full student lifecycle (register, login, dashboard, profile, results)
│   ├── schoolController.js  — CRUD for schools (API only)
│   ├── publicController.js  — getHome (landing page)
│   ├── gazetteController.js — generateGazette (CSV/JSON), getGazetteStats
│   └── roleController.js    — (exists, not analyzed — likely role management)
│
├── routes/
│   ├── admin.js          — ALL admin routes inline (700+ lines, no controller delegation)
│   ├── auth.js           — Admin + student auth routes (inline logic)
│   ├── studentRoutes.js  — Student routes (mix of controller + inline logic)
│   ├── payment.js        — Payment routes (inline logic, Paystack integration)
│   ├── apiRoutes.js      — Public API: /states, /lgas/:id, /schools/:id
│   ├── schoolRoutes.js   — School CRUD API (delegates to schoolController)
│   ├── public.js         — Landing page
│   └── webhook.js        — Paystack webhook handler
│
├── services/
│   ├── paymentService.js — handleSuccessfulPayment (business logic)
│   ├── cacheService.js   — Redis wrapper (get/set/del + domain methods)
│   └── smsService.js     — Termii SMS wrapper
│
├── utils/
│   ├── sendEmail.js      — Nodemailer + EJS template email
│   ├── grade.js          — getGrade, getGradeBadge, getGradeRemark
│   └── generateStudentCode.js — BECE reg number generator
│
└── views/
    ├── admin/            — 24 EJS templates
    ├── auth/             — 9 EJS templates
    ├── students/         — 12 EJS templates
    ├── public/           — 2 EJS templates
    ├── emails/           — 7 EJS email templates
    ├── partials/         — 8 shared partials
    └── layout/main.ejs   — Base layout
```

---

## Authentication Flow

```
Admin Login:
  POST /auth/admin  →  passport.authenticate('local-admin')
                    →  User.findOne({ email })
                    →  bcrypt.compare(password, hash)
                    →  req.logIn(user)  →  redirect /admin/dashboard

Student Login:
  POST /auth/student/login  →  passport.authenticate('local-student')
                            →  Student.findOne({ regNumber OR email })
                            →  bcrypt.compare
                            →  req.logIn(student)  →  redirect /students/dashboard
  Also: POST /students/login  →  manual session (req.session.student)

Session:
  passport.serializeUser  →  { id, role }
  passport.deserializeUser →  User.findByPk OR Student.findByPk
  Session store: in-memory (express-session default)
```

## Payment Flow

```
1. Student visits /payment/pay  (GET)
2. POST /payment/init  →  Paystack initialize API  →  returns authorization_url
3. Student redirected to Paystack hosted page
4. Paystack redirects to GET /payment/callback?reference=xxx
5. Callback verifies with Paystack API
6. Payment.update({ status: 'success' })
7. pre_reg_payments table updated (raw SQL)
8. Student redirected to /students/register?payment_ref=xxx
9. POST /payment/verify  (client-side inline popup alternative)
```

## Student Registration Flow

```
Multi-step:
  GET  /students/register/biodata   →  renderBiodataForm
  POST /students/register/biodata   →  handleBiodata  →  Student.create  →  session.studentId
  GET  /students/register/subjects  →  renderSubjectsForm
  POST /students/register/subjects  →  handleSubjects  →  session.selectedSubjects
  GET  /students/register/payment   →  renderPaymentPage
  GET  /students/register/confirmation  →  renderConfirmationPage

Single-step (also exists):
  GET  /students/register           →  full form
  POST /students/register           →  registerStudent (studentController)

Auth route also:
  GET  /auth/student/register       →  student-registration.ejs
  POST /auth/student/register       →  inline registration logic (DUPLICATE)
```

## Result Processing Flow

```
Admin uploads result:
  GET  /admin/results/new  →  form with students list
  POST /admin/results      →  Result.create (inline in admin.js)

Student views result:
  GET  /students/results   →  Result.findAll({ studentId })
  GET  /admin/results/:id  →  view-result.ejs with getGrade utility

Analytics:
  GET  /admin/analytics    →  complex Promise.all with 12 parallel queries
```

## Admin Flow

```
/admin/dashboard     — analytics overview
/admin/students      — list, view, edit students
/admin/schools       — list, add, view, edit schools
/admin/results       — list, add results
/admin/payments      — list payments
/admin/users         — user management (super_admin only)
/admin/subjects      — subject management
/admin/timetable     — exam timetable
/admin/centers       — exam centers
/admin/analytics     — detailed analytics
/admin/gazette       — gazette generation
/admin/certificates  — digital certificates
/admin/publish       — publications
/admin/settings      — system settings
```

---

## Database Schema (Sequelize Models)

| Model | Table | Key Fields |
|---|---|---|
| User | users | name, email, password(hashed), role, stateId, schoolId, isActive, permissions(JSON) |
| Student | students | name, email, password(hashed), regNumber, studentCode, gender, dob, guardianPhone, paymentStatus, schoolId, stateId, lgaId |
| School | schools | name, address, stateId, lgaId, schoolSerial, stateCode |
| State | states | name |
| LGA | lgas | name, stateId |
| Subject | subjects | name |
| Payment | payments | email, amount, reference, transactionReference, code, status, schoolId, studentId |
| Result | results | studentId, schoolId, score, grade, subjectId |
| ExamTimetable | exam_timetables | examYear, subjectId, examDate, startTime, endTime, duration, paperType |
| ExamCenter | exam_centers | name, code, address, stateId, lgaId, capacity |
| Certificate | certificates | studentId |

## Key Associations

- State → LGA → School → Student (cascade)
- Student → Payment, Result, Certificate
- Subject ↔ Result (M:M via ResultSubjects)
- Subject → ExamTimetable
- State/LGA → ExamCenter
