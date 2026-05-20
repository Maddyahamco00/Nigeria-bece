# MICROSERVICES PLAN — Nigeria BECE Enterprise Platform

---

## Service 1: auth-service

### Technology
- Node.js 20 + TypeScript
- Framework: Fastify (performance over Express for auth hot path)
- Database: PostgreSQL `auth_db`
- Cache: Redis (token blacklist, rate limit counters)

### Responsibilities
- Admin user registration and login
- Student authentication (regNumber + password)
- JWT access token issuance (15 min TTL)
- Refresh token management (7 day TTL, stored in Redis)
- Password reset flow (token generation + validation)
- Token introspection endpoint (for other services)
- RBAC role and permission management
- Account activation / deactivation

### Boundaries — Owns
- `users` table (admin accounts)
- `refresh_tokens` table
- `password_reset_tokens` table
- Role and permission definitions

### Boundaries — Does NOT Own
- Student profile data (owned by student-service)
- Student credentials are validated here but profile lives in student-service

### API Endpoints
```
POST   /api/v1/auth/admin/login
POST   /api/v1/auth/admin/register
POST   /api/v1/auth/student/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password/:token
GET    /api/v1/auth/introspect          ← used by other services
GET    /api/v1/auth/me
PUT    /api/v1/auth/users/:id/toggle
DELETE /api/v1/auth/users/:id
```

### gRPC Interface
```protobuf
service AuthService {
  rpc IntrospectToken(IntrospectRequest) returns (IntrospectResponse);
  rpc ValidatePermission(PermissionRequest) returns (PermissionResponse);
}
```

### Events Published
```
auth.password_reset_requested  → notification-service
auth.admin_created             → notification-service
```

### Scalability
- Stateless — scale horizontally freely
- Redis for token blacklist (logout invalidation)
- Rate limit: 20 req/15min on login endpoints
- Target: 500 req/sec per pod

### Database Schema (auth_db)
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL CHECK (role IN (
                  'super_admin','admin','state_admin',
                  'school_admin','exam_admin','feedback_admin')),
  state_id      UUID REFERENCES states(id),
  school_id     UUID REFERENCES schools(id),
  is_active     BOOLEAN DEFAULT true,
  permissions   JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  student_id UUID,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  user_type  VARCHAR(20) NOT NULL CHECK (user_type IN ('admin','student')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Service 2: student-service

### Technology
- Node.js 20 + TypeScript
- Framework: Fastify
- Database: PostgreSQL `student_db`
- Cache: Redis (student profile cache, registration session)

### Responsibilities
- Student registration (single source of truth)
- Student profile management (biodata, subjects)
- Student dashboard data aggregation
- Registration number generation
- Student search and filtering
- Student payment status tracking
- Student result viewing (reads from exam-service via gRPC)
- CSV export of student data

### Boundaries — Owns
- `students` table
- `student_subjects` table (subject selections)
- `states` table (reference data, replicated)
- `lgas` table (reference data, replicated)

### Boundaries — Does NOT Own
- Payment records (owned by payment-service)
- Exam results (owned by exam-service)
- School data (owned by school-service, referenced by FK)

### API Endpoints
```
POST   /api/v1/students/register
POST   /api/v1/students/login
GET    /api/v1/students/:id
GET    /api/v1/students/:id/dashboard
PUT    /api/v1/students/:id/profile
PUT    /api/v1/students/:id/password
GET    /api/v1/students/:id/results
GET    /api/v1/students/:id/payments
GET    /api/v1/students                ← admin only, paginated
GET    /api/v1/students/export         ← admin only, CSV
GET    /api/v1/states
GET    /api/v1/states/:id/lgas
```

### gRPC Interface
```protobuf
service StudentService {
  rpc GetStudent(GetStudentRequest) returns (StudentResponse);
  rpc GetStudentByEmail(GetByEmailRequest) returns (StudentResponse);
  rpc UpdatePaymentStatus(UpdatePaymentStatusRequest) returns (StatusResponse);
  rpc ValidateStudent(ValidateStudentRequest) returns (ValidationResponse);
}
```

### Events Published
```
student.registered          → notification-service, exam-service
student.profile_updated     → notification-service
student.payment_status_changed → (internal state update)
```

### Events Consumed
```
payment.completed           → update student paymentStatus to 'paid'
exam.result_published       → invalidate student result cache
```

### Scalability
- High write volume during registration periods (exam season)
- Horizontal pod autoscaling: scale on CPU > 70%
- Registration queue: Bull queue for async reg number generation
- Redis cache: student profile (TTL 5 min), states/LGAs (TTL 24h)

### Database Schema (student_db)
```sql
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE,
  reg_number      VARCHAR(50) UNIQUE,
  student_code    VARCHAR(50) UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  gender          VARCHAR(10) CHECK (gender IN ('Male','Female')),
  date_of_birth   DATE,
  guardian_phone  VARCHAR(20),
  payment_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (payment_status IN ('pending','paid')),
  school_id       UUID NOT NULL,
  state_id        UUID NOT NULL,
  lga_id          UUID NOT NULL,
  reset_token     VARCHAR(255),
  reset_token_exp TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE student_subjects (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, subject_id)
);

-- Replicated reference tables (read-only, synced from school-service)
CREATE TABLE states (
  id   UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE lgas (
  id       UUID PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  state_id UUID REFERENCES states(id)
);

-- Indexes
CREATE INDEX idx_students_email ON students(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_reg_number ON students(reg_number);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_payment_status ON students(payment_status);
CREATE INDEX idx_students_created_at ON students(created_at DESC);
```

---

## Service 3: school-service

### Technology
- Node.js 20 + TypeScript
- Framework: Fastify
- Database: PostgreSQL `school_db`
- Cache: Redis (school list by LGA — TTL 1h, states/LGAs — TTL 24h)

### Responsibilities
- School CRUD management
- State and LGA management
- School approval workflow
- School statistics (student count, payment count)
- School search and filtering
- Reference data API (states, LGAs) for other services

### Boundaries — Owns
- `schools` table
- `states` table (master copy)
- `lgas` table (master copy)
- `exam_centers` table

### API Endpoints
```
GET    /api/v1/schools
GET    /api/v1/schools/:id
POST   /api/v1/schools              ← admin only
PUT    /api/v1/schools/:id          ← admin only
DELETE /api/v1/schools/:id          ← super_admin only
GET    /api/v1/schools/:id/students ← admin only
GET    /api/v1/states
GET    /api/v1/states/:id/lgas
GET    /api/v1/lgas/:id/schools
GET    /api/v1/exam-centers
POST   /api/v1/exam-centers         ← admin only
```

### gRPC Interface
```protobuf
service SchoolService {
  rpc GetSchool(GetSchoolRequest) returns (SchoolResponse);
  rpc GetSchoolsByLGA(GetByLGARequest) returns (SchoolListResponse);
  rpc GetState(GetStateRequest) returns (StateResponse);
  rpc GetLGA(GetLGARequest) returns (LGAResponse);
  rpc ValidateSchool(ValidateSchoolRequest) returns (ValidationResponse);
}
```

### Events Published
```
school.created    → notification-service
school.approved   → notification-service
school.updated    → student-service (invalidate cache)
```

### Scalability
- Low write volume — mostly reads
- Aggressive Redis caching (school list rarely changes)
- Single replica sufficient; scale only during admin bulk imports

---

## Service 4: payment-service

### Technology
- Node.js 20 + TypeScript
- Framework: Fastify
- Database: PostgreSQL `payment_db`
- Cache: Redis (payment status cache, idempotency keys)

### Responsibilities
- Paystack transaction initialization
- Payment verification (callback + webhook)
- Idempotency enforcement (prevent duplicate payments)
- Payment record management
- Pre-registration payment tracking
- Payment reconciliation
- Refund handling (future)
- Financial reporting data

### Boundaries — Owns
- `payments` table
- `pre_reg_payments` table (migrated from raw SQL)
- `payment_webhooks` table (webhook event log)

### Boundaries — Does NOT Own
- Student records (notifies student-service via event)
- School records (reads via gRPC from school-service)

### API Endpoints
```
POST   /api/v1/payments/initialize
POST   /api/v1/payments/verify
GET    /api/v1/payments/callback        ← Paystack redirect
POST   /api/v1/payments/webhook         ← Paystack webhook
GET    /api/v1/payments/:reference
GET    /api/v1/payments                 ← admin only, paginated
GET    /api/v1/payments/export          ← admin only, CSV
GET    /api/v1/payments/stats           ← admin only
```

### Events Published
```
payment.initialized   → (internal)
payment.completed     → student-service, notification-service
payment.failed        → notification-service
payment.webhook_received → (internal audit log)
```

### Critical Design: Idempotency
```
Every payment initialization stores an idempotency key in Redis (TTL 24h).
Duplicate requests with same key return the cached response.
Webhook events are deduplicated by Paystack event ID.
```

### Scalability
- Financial service — correctness over speed
- Blue/green deployments only (zero downtime)
- Webhook endpoint must be highly available
- Separate rate limits: 10 req/15min for /initialize

### Database Schema (payment_db)
```sql
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) NOT NULL,
  amount                DECIMAL(12,2) NOT NULL,
  reference             VARCHAR(100) UNIQUE NOT NULL,
  transaction_reference VARCHAR(100),
  paystack_code         VARCHAR(100),
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','success','failed','refunded')),
  payment_method        VARCHAR(50),
  school_id             UUID,
  student_id            UUID,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pre_reg_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255),
  email             VARCHAR(255) NOT NULL,
  guardian_number   VARCHAR(20),
  amount            DECIMAL(12,2) NOT NULL,
  payment_reference VARCHAR(100) UNIQUE NOT NULL,
  payment_status    VARCHAR(20) NOT NULL DEFAULT 'pending',
  student_id        UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     VARCHAR(100) UNIQUE NOT NULL,
  event_type   VARCHAR(100) NOT NULL,
  payload      JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_email ON payments(email);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```

---

## Service 5: exam-service

### Technology
- Golang 1.22
- Framework: Gin / Chi
- Database: PostgreSQL `exam_db`
- Cache: Redis (published results cache)

### Responsibilities
- Exam result upload and management
- Result processing and grade calculation
- Gazette generation (CSV/PDF) — streaming, no memory bloat
- Exam timetable management
- Certificate generation
- Result publication workflow
- Subject management
- Bulk result import (CSV upload)

### Why Golang
- Gazette generation requires streaming large datasets (100k+ students)
- PDF generation is CPU-intensive
- Grade calculation across thousands of records
- Golang's goroutines handle concurrent processing efficiently
- 10x lower memory footprint vs Node.js for bulk operations

### Boundaries — Owns
- `results` table
- `subjects` table
- `exam_timetables` table
- `certificates` table
- `result_subjects` junction table

### API Endpoints
```
GET    /api/v1/exam/results
GET    /api/v1/exam/results/:id
POST   /api/v1/exam/results              ← admin only
PUT    /api/v1/exam/results/:id          ← admin only
POST   /api/v1/exam/results/bulk-upload  ← admin only, CSV
POST   /api/v1/exam/results/publish      ← admin only
GET    /api/v1/exam/results/student/:studentId
GET    /api/v1/exam/gazette              ← admin only, async job
GET    /api/v1/exam/gazette/download/:jobId
GET    /api/v1/exam/subjects
POST   /api/v1/exam/subjects             ← admin only
GET    /api/v1/exam/timetable
POST   /api/v1/exam/timetable            ← admin only
GET    /api/v1/exam/certificates/:studentId
POST   /api/v1/exam/certificates/generate ← admin only
```

### gRPC Interface
```protobuf
service ExamService {
  rpc GetStudentResults(GetResultsRequest) returns (ResultsResponse);
  rpc GetSubjects(GetSubjectsRequest) returns (SubjectsResponse);
  rpc CheckResultPublished(CheckResultRequest) returns (PublishedResponse);
}
```

### Events Published
```
exam.result_published   → notification-service, student-service
exam.gazette_generated  → notification-service
exam.certificate_issued → notification-service, student-service
```

### Events Consumed
```
student.registered      → create default result record placeholder
payment.completed       → unlock result viewing for student
```

### Gazette Generation Design
```
1. Admin triggers POST /api/v1/exam/gazette
2. exam-service creates a background job (job_id returned immediately)
3. Goroutine streams students from DB in batches of 1000
4. CSV/PDF written to S3-compatible storage
5. Job status updated in Redis
6. Notification sent when complete
7. Admin downloads via GET /api/v1/exam/gazette/download/:jobId
```

---

## Service 6: notification-service

### Technology
- Node.js 20 + TypeScript
- Framework: Fastify
- Database: None (stateless consumer)
- Queue: RabbitMQ consumer

### Responsibilities
- Email delivery (Nodemailer + SMTP)
- SMS delivery (Termii API)
- Notification template rendering (EJS/Handlebars)
- Delivery retry with exponential backoff
- Notification delivery log (writes to shared audit log)
- Unsubscribe handling (future)

### Boundaries — Owns
- No database ownership
- Reads templates from filesystem / S3

### Communication
- Pure RabbitMQ consumer — no REST API exposed
- Internal health check endpoint only: GET /health

### Events Consumed
```
student.registered          → send welcome email + SMS
payment.completed           → send payment confirmation email + SMS
exam.result_published       → send result notification email
auth.password_reset_requested → send reset link email
school.approved             → send approval email to school admin
exam.certificate_issued     → send certificate ready email
```

### Retry Strategy
```
Attempt 1: immediate
Attempt 2: 30 seconds
Attempt 3: 5 minutes
Attempt 4: 30 minutes
Attempt 5: dead-letter queue → alert admin
```

### Scalability
- Scale consumers independently based on queue depth
- Email and SMS workers can be separate consumer instances
- No shared state — safe to run N instances

---

## Service 7: reporting-service

### Technology
- Golang 1.22
- Framework: Gin
- Database: PostgreSQL `reporting_db` (read replica + materialized views)
- Cache: Redis (dashboard counters, chart data)

### Responsibilities
- Admin dashboard analytics
- Payment revenue reports
- Student registration trends
- School performance reports
- State/LGA breakdown reports
- Export generation (CSV, Excel, PDF)
- Pre-computed materialized views (refreshed every 5 min)

### Why Golang
- Complex aggregation queries benefit from Golang's efficient execution
- Report generation (Excel/PDF) is CPU-intensive
- Streaming large exports without memory pressure

### Boundaries — Owns
- `reporting_db` — read replica of all service databases
- Materialized views for dashboard counters
- No writes to any service database

### API Endpoints
```
GET    /api/v1/reports/dashboard
GET    /api/v1/reports/analytics
GET    /api/v1/reports/payments/summary
GET    /api/v1/reports/students/trends
GET    /api/v1/reports/schools/performance
GET    /api/v1/reports/export/:type        ← async, returns job_id
GET    /api/v1/reports/export/download/:jobId
```

### Scalability
- Read-only — zero risk to production data
- Materialized views eliminate N+1 query problem
- Redis cache for dashboard counters (TTL 30s for live counters, 5min for charts)
