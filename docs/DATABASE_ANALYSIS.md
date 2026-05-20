# Database Analysis — Nigeria BECE Portal

## Current Database

| Property | Value |
|---|---|
| Engine | MySQL (via Sequelize ORM) |
| Target | PostgreSQL (future migration) |
| ORM | Sequelize 6.x |
| Connection Pool | max: 5, min: 0, acquire: 30s, idle: 10s |
| Sync Strategy | `sequelize.sync({ force: false })` on startup |

---

## Schema Overview

### `users` table
```
id            INT AUTO_INCREMENT PK
name          VARCHAR NOT NULL
email         VARCHAR UNIQUE NOT NULL
password      VARCHAR NOT NULL (bcrypt hash)
role          ENUM(super_admin, admin, state_admin, school_admin, exam_admin, feedback_admin)
stateId       INT FK → states.id (nullable)
schoolId      INT FK → schools.id (nullable)
createdBy     INT FK → users.id (nullable)
isActive      BOOLEAN DEFAULT true
permissions   JSON DEFAULT {}
resetToken    VARCHAR (nullable)
resetTokenExpiration  DATETIME (nullable)
createdAt     DATETIME
updatedAt     DATETIME
```

### `students` table
```
id            INT AUTO_INCREMENT PK
name          VARCHAR NOT NULL
email         VARCHAR UNIQUE (nullable)
regNumber     VARCHAR UNIQUE (nullable)
studentCode   VARCHAR UNIQUE (nullable)
password      VARCHAR NOT NULL (bcrypt hash)
gender        ENUM(Male, Female) (nullable)
dateOfBirth   DATE (nullable)
guardianPhone VARCHAR (nullable)
paymentStatus ENUM(pending, paid) NOT NULL DEFAULT pending
schoolId      INT FK → schools.id NOT NULL
stateId       INT FK → states.id NOT NULL
lgaId         INT FK → lgas.id NOT NULL
resetToken    VARCHAR (nullable)
resetTokenExpiration  DATETIME (nullable)
createdAt     DATETIME
updatedAt     DATETIME
```

### `schools` table
```
id            INT AUTO_INCREMENT PK
name          VARCHAR NOT NULL
address       VARCHAR
stateId       INT FK → states.id
lgaId         INT FK → lgas.id
schoolSerial  INT
stateCode     VARCHAR
createdAt     DATETIME
updatedAt     DATETIME
```

### `states` table
```
id    INT AUTO_INCREMENT PK
name  VARCHAR NOT NULL
```

### `lgas` table
```
id       INT AUTO_INCREMENT PK
name     VARCHAR NOT NULL
stateId  INT FK → states.id
```

### `subjects` table
```
id    INT AUTO_INCREMENT PK
name  VARCHAR NOT NULL
```

### `payments` table
```
id                   INT AUTO_INCREMENT PK
email                VARCHAR NOT NULL
amount               FLOAT NOT NULL
reference            VARCHAR UNIQUE NOT NULL
transactionReference VARCHAR (nullable)
code                 VARCHAR (nullable)
status               ENUM(pending, success, failed) DEFAULT pending
schoolId             INT FK → schools.id (implicit via association)
studentId            INT FK → students.id (implicit via association)
createdAt            DATETIME
updatedAt            DATETIME
```
> ⚠️ `schoolId` and `studentId` are NOT explicitly defined in `models/Payment.js` — they are added implicitly by Sequelize associations. This is fragile.

### `results` table
```
id         INT AUTO_INCREMENT PK
studentId  INT FK → students.id
schoolId   INT FK → schools.id
score      (type not analyzed — check Result.js)
grade      VARCHAR
createdAt  DATETIME
updatedAt  DATETIME
```

### `exam_timetables` table
```
id           INT AUTO_INCREMENT PK
examYear     VARCHAR/INT
subjectId    INT FK → subjects.id
examDate     DATE
startTime    TIME
endTime      TIME
duration     INT (minutes)
paperType    VARCHAR
instructions TEXT (nullable)
```

### `exam_centers` table
```
id            INT AUTO_INCREMENT PK
name          VARCHAR
code          VARCHAR
address       VARCHAR
stateId       INT FK → states.id
lgaId         INT FK → lgas.id
capacity      INT
facilities    TEXT (nullable)
contactPerson VARCHAR (nullable)
contactPhone  VARCHAR (nullable)
```

### `certificates` table
```
id         INT AUTO_INCREMENT PK
studentId  INT FK → students.id
```

### `pre_reg_payments` table (NOT a Sequelize model)
```
id                INT AUTO_INCREMENT PK
name              VARCHAR
email             VARCHAR
guardian_number   VARCHAR
amount            DECIMAL
payment_reference VARCHAR UNIQUE
payment_status    VARCHAR
created_at        DATETIME
```
> ⚠️ This table is managed via raw SQL in `routes/payment.js`. It is NOT defined as a Sequelize model.

### `ResultSubjects` table (junction — auto-created by Sequelize)
```
subjectId  INT FK → subjects.id
resultId   INT FK → results.id
```

---

## Association Map

```
State (1) ──── (N) LGA
State (1) ──── (N) School
State (1) ──── (N) Student
State (1) ──── (N) ExamCenter

LGA (1) ──── (N) School
LGA (1) ──── (N) Student
LGA (1) ──── (N) ExamCenter

School (1) ──── (N) Student
School (1) ──── (N) Payment
School (1) ──── (N) Result

Student (1) ──── (N) Payment
Student (1) ──── (N) Result
Student (1) ──── (N) Certificate

Subject (1) ──── (N) ExamTimetable
Subject (N) ──── (M) Result  [via ResultSubjects]
```

---

## Database Issues

### DB-001: `sequelize.sync({ force: false })` on every startup
- **Risk:** In production, `sync()` can alter tables unexpectedly. Should use migrations instead.
- **Fix:** Disable `sync()` in production; use `sequelize-cli` migrations.

### DB-002: `SET FOREIGN_KEY_CHECKS = 0` before sync
- **File:** `app.js`
- **Risk:** Disabling FK checks during sync can allow orphaned records to be created.
- **Fix:** Use proper migration ordering instead.

### DB-003: `pre_reg_payments` table has no Sequelize model
- **Risk:** Schema changes require manual SQL; no type safety; no ORM validation.
- **Fix:** Create `models/PreRegPayment.js`.

### DB-004: Payment model missing explicit FK columns
- **File:** `models/Payment.js`
- **Risk:** `schoolId` and `studentId` are implicit. If associations change, columns may be dropped or renamed unexpectedly.
- **Fix:** Add explicit `schoolId` and `studentId` DataTypes.INTEGER columns.

### DB-005: Student `paymentStatus` ENUM mismatch
- **File:** `models/Student.js` defines `ENUM('pending', 'paid')` (lowercase)
- **Issue:** Code in multiple places uses `'Paid'`, `'Pending'` (capitalized), and `'paid'`, `'pending'` (lowercase) inconsistently.
- **Risk:** Status checks fail silently; students appear unpaid when they are paid.

### DB-006: No database indexes defined
- **Issue:** No explicit indexes on frequently queried columns: `students.email`, `students.regNumber`, `payments.reference`, `payments.status`, `payments.email`.
- **Impact:** Full table scans on every login and payment lookup.
- **Fix:** Add indexes via migrations.

### DB-007: Connection pool too small
- **Issue:** `max: 5` connections. With 10,000 concurrent users (stated goal), this will cause connection timeouts.
- **Fix:** Increase to 20–50 for production; use PgBouncer when migrating to PostgreSQL.

### DB-008: No soft deletes
- **Issue:** `School.destroy()` and `User.destroy()` perform hard deletes. No audit trail.
- **Fix:** Add `paranoid: true` to critical models (User, Student, School) for soft deletes.

### DB-009: `Student.password` has no length validation
- **Issue:** Model allows any string as password. Minimum length is only checked in controller code, not at model level.
- **Fix:** Add `validate: { len: [6, 100] }` to Student and User password fields.

### DB-010: MySQL → PostgreSQL migration considerations
When migrating to PostgreSQL:
- `ENUM` types become PostgreSQL native enums or CHECK constraints
- `JSON` columns become `JSONB` (better indexing)
- `AUTO_INCREMENT` becomes `SERIAL` or `BIGSERIAL`
- `FLOAT` for amounts should become `DECIMAL(10,2)` to avoid floating point errors
- `SET FOREIGN_KEY_CHECKS` has no PostgreSQL equivalent — remove it
- TimescaleDB extension needed for time-series analytics queries

---

## Query Performance Hotspots

| Location | Issue | Impact |
|---|---|---|
| `routes/admin.js` /dashboard | N+1: Payment.findOne per student | High |
| `routes/admin.js` /analytics | 12 parallel aggregation queries, no cache | High |
| `routes/admin.js` /dashboard/stats | 6 monthly Payment.sum queries in loop | Medium |
| `controllers/adminController.js` getDashboard | 10 parallel queries including GROUP BY | Medium |
| `controllers/gazetteController.js` | Full table scan on students with 3 JOINs | Medium |
| `utils/generateStudentCode.js` | Student.findOne on every registration | Low |
