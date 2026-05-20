# DATABASE STRATEGY — Nigeria BECE Enterprise Platform

---

## 1. Database-per-Service Ownership

Each microservice owns its database exclusively.
No service may query another service's database directly.
Cross-service data access happens only through APIs or gRPC.

```
┌─────────────────┬──────────────────┬────────────────────────────────────┐
│ Service         │ Database         │ Tables Owned                        │
├─────────────────┼──────────────────┼────────────────────────────────────┤
│ auth-service    │ auth_db          │ users, refresh_tokens,              │
│                 │                  │ password_reset_tokens               │
├─────────────────┼──────────────────┼────────────────────────────────────┤
│ student-service │ student_db       │ students, student_subjects,         │
│                 │                  │ states*, lgas* (replicated)         │
├─────────────────┼──────────────────┼────────────────────────────────────┤
│ school-service  │ school_db        │ schools, states, lgas,              │
│                 │                  │ exam_centers                        │
├─────────────────┼──────────────────┼────────────────────────────────────┤
│ payment-service │ payment_db       │ payments, pre_reg_payments,         │
│                 │                  │ payment_webhooks                    │
├─────────────────┼──────────────────┼────────────────────────────────────┤
│ exam-service    │ exam_db          │ results, subjects, exam_timetables, │
│                 │                  │ certificates, result_subjects       │
├─────────────────┼──────────────────┼────────────────────────────────────┤
│ reporting-svc   │ reporting_db     │ Materialized views (read-only)      │
│                 │ (read replica)   │ Aggregated from all service DBs     │
└─────────────────┴──────────────────┴────────────────────────────────────┘

* states and lgas are mastered in school_db and replicated to student_db
  via RabbitMQ events (school.state_updated, school.lga_updated)
```

---

## 2. PostgreSQL Migration from MySQL

### Step-by-Step Migration Plan

```
Step 1: Schema Conversion
  • Export MySQL schema: mysqldump --no-data nigeria_bece_db > schema.sql
  • Convert with pgloader: pgloader mysql://... postgresql://...
  • Manual fixes:
    - AUTO_INCREMENT → SERIAL / BIGSERIAL
    - INT primary keys → UUID (gen_random_uuid())
    - ENUM → PostgreSQL native ENUM or VARCHAR + CHECK constraint
    - JSON → JSONB
    - FLOAT (amounts) → DECIMAL(12,2)
    - DATETIME → TIMESTAMPTZ
    - Remove SET FOREIGN_KEY_CHECKS

Step 2: Data Migration (parallel run)
  • Run MySQL and PostgreSQL simultaneously
  • Dual-write period: monolith writes to both
  • Validate row counts and checksums
  • Switch reads to PostgreSQL
  • Stop MySQL writes
  • Decommission MySQL

Step 3: Service-by-Service Cutover
  • school-service migrates first (lowest risk)
  • auth-service second
  • payment-service third (with extra validation)
  • student-service last (highest volume)
```

### Key Type Changes

| MySQL Type | PostgreSQL Type | Notes |
|---|---|---|
| INT AUTO_INCREMENT | UUID DEFAULT gen_random_uuid() | Better for distributed systems |
| ENUM('a','b') | VARCHAR(50) + CHECK constraint | More flexible |
| JSON | JSONB | Better indexing with GIN |
| FLOAT | DECIMAL(12,2) | Exact arithmetic for money |
| DATETIME | TIMESTAMPTZ | Timezone-aware |
| TINYINT(1) | BOOLEAN | Native boolean |
| TEXT | TEXT | Same |

---

## 3. Indexing Strategy

### auth_db
```sql
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens(token_hash)
  WHERE used_at IS NULL;
```

### student_db
```sql
CREATE INDEX idx_students_email ON students(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_reg_number ON students(reg_number);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_state_id ON students(state_id);
CREATE INDEX idx_students_payment_status ON students(payment_status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_students_created_at ON students(created_at DESC);
-- Full-text search on student name
CREATE INDEX idx_students_name_fts ON students
  USING GIN(to_tsvector('english', name));
```

### payment_db
```sql
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_email ON payments(email);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_school_id ON payments(school_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
-- Partial index for pending payments (most queried subset)
CREATE INDEX idx_payments_pending ON payments(created_at)
  WHERE status = 'pending';
CREATE UNIQUE INDEX idx_webhooks_event_id ON payment_webhooks(event_id);
```

### exam_db
```sql
CREATE INDEX idx_results_student_id ON results(student_id);
CREATE INDEX idx_results_school_id ON results(school_id);
CREATE INDEX idx_results_subject_id ON results(subject_id);
CREATE INDEX idx_results_published ON results(published_at)
  WHERE published_at IS NOT NULL;
CREATE INDEX idx_timetable_exam_date ON exam_timetables(exam_date);
CREATE INDEX idx_timetable_subject ON exam_timetables(subject_id);
```

### reporting_db (Materialized Views)
```sql
-- Refresh every 5 minutes via pg_cron
CREATE MATERIALIZED VIEW mv_dashboard_counters AS
SELECT
  (SELECT COUNT(*) FROM student_db.students WHERE deleted_at IS NULL) AS total_students,
  (SELECT COUNT(*) FROM school_db.schools WHERE deleted_at IS NULL) AS total_schools,
  (SELECT COUNT(*) FROM payment_db.payments WHERE status = 'success') AS total_payments,
  (SELECT SUM(amount) FROM payment_db.payments WHERE status = 'success') AS total_revenue;

CREATE UNIQUE INDEX ON mv_dashboard_counters (total_students);

-- Monthly revenue view
CREATE MATERIALIZED VIEW mv_monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(amount) AS revenue,
  COUNT(*) AS payment_count
FROM payment_db.payments
WHERE status = 'success'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## 4. Migration Strategy (Schema Changes)

### Expand/Contract Pattern (Zero Downtime)

```
Phase 1 — EXPAND:
  Add new column as nullable
  Deploy new code that writes to both old and new column
  Backfill existing rows

Phase 2 — CONTRACT:
  Make new column NOT NULL (after backfill complete)
  Deploy code that reads only from new column
  Drop old column in next release

Example: Renaming paymentStatus → payment_status
  Step 1: ALTER TABLE students ADD COLUMN payment_status VARCHAR(20);
  Step 2: UPDATE students SET payment_status = LOWER(paymentStatus);
  Step 3: Deploy code reading payment_status
  Step 4: ALTER TABLE students DROP COLUMN paymentStatus;
```

### Migration Tool: golang-migrate
```
Each service has its own migrations directory:
  services/auth-service/migrations/
  services/student-service/migrations/
  services/payment-service/migrations/
  ...

Migration files:
  000001_initial_schema.up.sql
  000001_initial_schema.down.sql
  000002_add_indexes.up.sql
  000002_add_indexes.down.sql

Run on service startup (with lock to prevent concurrent runs):
  migrate -path ./migrations -database $DATABASE_URL up
```

---

## 5. Transaction Handling

### Within a Single Service
```
Use database transactions for multi-table operations within the same service.

Example (payment-service):
  BEGIN;
    INSERT INTO payments (...) VALUES (...);
    INSERT INTO payment_webhooks (...) VALUES (...);
    UPDATE pre_reg_payments SET payment_status = 'paid' WHERE ...;
  COMMIT;
```

### Across Services (Saga Pattern)
```
Cross-service transactions use the Saga pattern via RabbitMQ.

Example: Student Registration + Payment Confirmation
  1. payment-service: marks payment as 'success' (local transaction)
  2. payment-service: publishes payment.completed event
  3. student-service: consumes event, updates payment_status = 'paid'
  4. notification-service: consumes event, sends confirmation email

Compensating transactions on failure:
  If student-service fails to update:
    → Retry 3 times with exponential backoff
    → Dead-letter queue after 3 failures
    → Alert admin for manual resolution
```

### Idempotency
```
All event consumers must be idempotent.
Use event_id as deduplication key stored in Redis (TTL 24h).

Pattern:
  1. Receive event with event_id
  2. Check Redis: SET NX event_processed:{event_id} 1 EX 86400
  3. If key already exists → skip (already processed)
  4. If key set successfully → process event
```

---

## 6. Redis Caching Strategy

### Cache Layers

```
Layer 1 — Session Store (auth-service)
  Key:    session:{session_id}
  TTL:    24 hours (rolling)
  Value:  { userId, role, permissions }

Layer 2 — Token Blacklist (auth-service)
  Key:    blacklist:{jti}
  TTL:    matches token expiry
  Value:  1 (presence = blacklisted)

Layer 3 — Rate Limiting (api-gateway)
  Key:    ratelimit:{ip}:{endpoint}
  TTL:    15 minutes
  Value:  request count

Layer 4 — Reference Data (school-service)
  Key:    states:all
  TTL:    24 hours
  Value:  JSON array of all states

  Key:    lgas:state:{stateId}
  TTL:    24 hours
  Value:  JSON array of LGAs for state

  Key:    schools:lga:{lgaId}
  TTL:    1 hour
  Value:  JSON array of schools for LGA

Layer 5 — Student Profile (student-service)
  Key:    student:{studentId}
  TTL:    5 minutes
  Value:  Student profile JSON
  Invalidate on: profile update, payment status change

Layer 6 — Dashboard Counters (reporting-service)
  Key:    dashboard:counters
  TTL:    30 seconds
  Value:  { totalStudents, totalSchools, totalPayments, monthlyRevenue }

Layer 7 — Analytics Charts (reporting-service)
  Key:    analytics:monthly_revenue
  TTL:    5 minutes
  Value:  Chart data JSON

Layer 8 — Idempotency Keys (payment-service)
  Key:    idempotency:{key}
  TTL:    24 hours
  Value:  Cached response JSON

Layer 9 — Event Deduplication (all consumers)
  Key:    event_processed:{event_id}
  TTL:    24 hours
  Value:  1
```

### Cache Invalidation Rules
```
When school is updated:
  → DELETE schools:lga:{lgaId}
  → DELETE schools:all (if exists)
  → Publish school.updated event → student-service clears its school cache

When student profile is updated:
  → DELETE student:{studentId}

When result is published:
  → DELETE student_results:{studentId}
  → Publish exam.result_published event
```

---

## 7. Backup Strategy

```
Automated Backups:
  • Full backup: daily at 02:00 UTC
  • Incremental WAL archiving: continuous (point-in-time recovery)
  • Retention: 30 days full, 7 days WAL
  • Storage: S3-compatible (AWS S3 or MinIO)

Backup Verification:
  • Weekly automated restore test to staging environment
  • Alert if restore fails

Tools:
  • pg_dump for logical backups
  • pgBackRest for physical backups + WAL archiving
  • Barman for backup management

Recovery Time Objectives:
  • RTO: < 1 hour
  • RPO: < 5 minutes (WAL archiving)
```

---

## 8. What Stays Relational vs What Gets Cached

### Stays Relational (PostgreSQL)
- All financial records (payments) — audit trail required
- Student records — regulatory compliance
- Exam results — official records
- User accounts — security-sensitive
- School registrations — official records

### Gets Cached (Redis)
- Reference data (states, LGAs, schools) — rarely changes
- Dashboard counters — approximate is acceptable
- Student session data — temporary
- Rate limit counters — ephemeral
- Analytics chart data — stale-ok for 5 minutes
- JWT blacklist — must be fast

### Gets Pre-computed (Materialized Views)
- Monthly revenue totals
- Student count by state/LGA
- Payment success rates
- Grade distribution statistics
