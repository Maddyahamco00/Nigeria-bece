# EVENT-DRIVEN ARCHITECTURE — Nigeria BECE Enterprise Platform

---

## 1. Message Broker: RabbitMQ

### Why RabbitMQ over Kafka
- Message volume is moderate (not millions/sec)
- Complex routing patterns needed (topic exchanges, fanout)
- Per-message acknowledgment is critical for financial events
- Dead-letter queues with retry policies are first-class features
- Simpler operational model for this scale

### Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RabbitMQ Cluster                              │
│                                                                       │
│  Exchanges (Topic):                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  student.events  │  │  payment.events  │  │   exam.events    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                      │             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   auth.events    │  │  school.events   │  │  system.events   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                      │             │
│  Dead Letter Exchange:                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    dlx.bece.events                            │   │
│  │  → dlq.failed_notifications                                   │   │
│  │  → dlq.failed_student_updates                                 │   │
│  │  → dlq.failed_payment_updates                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Event Catalog

### student.events Exchange

#### STUDENT_REGISTERED
```json
{
  "event_id": "uuid-v4",
  "event_type": "student.registered",
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "producer": "student-service",
  "payload": {
    "student_id": "uuid",
    "name": "Amina Bello",
    "email": "amina@example.com",
    "reg_number": "BECE2401010010001",
    "guardian_phone": "+2348012345678",
    "school_id": "uuid",
    "school_name": "Government Secondary School Kano",
    "state_id": "uuid",
    "state_name": "Kano",
    "lga_id": "uuid",
    "lga_name": "Kano Municipal"
  }
}
```
**Producers:** student-service
**Consumers:**
- notification-service → send welcome email + SMS
- exam-service → create result placeholder record

---

#### STUDENT_PROFILE_UPDATED
```json
{
  "event_id": "uuid-v4",
  "event_type": "student.profile_updated",
  "version": "1.0",
  "timestamp": "2024-01-15T11:00:00Z",
  "producer": "student-service",
  "payload": {
    "student_id": "uuid",
    "updated_fields": ["name", "guardian_phone"],
    "updated_by": "admin_user_id",
    "student_email": "amina@example.com"
  }
}
```
**Consumers:** notification-service → send profile update notification

---

#### STUDENT_PAYMENT_STATUS_CHANGED
```json
{
  "event_id": "uuid-v4",
  "event_type": "student.payment_status_changed",
  "version": "1.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "producer": "student-service",
  "payload": {
    "student_id": "uuid",
    "old_status": "pending",
    "new_status": "paid",
    "payment_reference": "PAY_xxx"
  }
}
```
**Consumers:** exam-service → unlock result access

---

### payment.events Exchange

#### PAYMENT_INITIALIZED
```json
{
  "event_id": "uuid-v4",
  "event_type": "payment.initialized",
  "version": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "producer": "payment-service",
  "payload": {
    "payment_id": "uuid",
    "reference": "PAY_xxx",
    "email": "amina@example.com",
    "amount": 5000.00,
    "school_id": "uuid"
  }
}
```
**Consumers:** (internal audit only)

---

#### PAYMENT_COMPLETED
```json
{
  "event_id": "uuid-v4",
  "event_type": "payment.completed",
  "version": "1.0",
  "timestamp": "2024-01-15T10:05:00Z",
  "producer": "payment-service",
  "payload": {
    "payment_id": "uuid",
    "reference": "PAY_xxx",
    "transaction_reference": "TXN_xxx",
    "email": "amina@example.com",
    "amount": 5000.00,
    "student_id": "uuid",
    "school_id": "uuid",
    "bece_code": "BECE2401010010001"
  }
}
```
**Producers:** payment-service
**Consumers:**
- student-service → update payment_status to 'paid'
- notification-service → send payment confirmation email + SMS

---

#### PAYMENT_FAILED
```json
{
  "event_id": "uuid-v4",
  "event_type": "payment.failed",
  "version": "1.0",
  "timestamp": "2024-01-15T10:05:00Z",
  "producer": "payment-service",
  "payload": {
    "payment_id": "uuid",
    "reference": "PAY_xxx",
    "email": "amina@example.com",
    "amount": 5000.00,
    "failure_reason": "Insufficient funds"
  }
}
```
**Consumers:** notification-service → send failure notification

---

### exam.events Exchange

#### RESULT_PUBLISHED
```json
{
  "event_id": "uuid-v4",
  "event_type": "exam.result_published",
  "version": "1.0",
  "timestamp": "2024-06-01T08:00:00Z",
  "producer": "exam-service",
  "payload": {
    "exam_year": "2024",
    "published_by": "admin_user_id",
    "total_students": 45230,
    "states_included": ["Kano", "Lagos", "Abuja"],
    "publication_id": "uuid"
  }
}
```
**Consumers:**
- notification-service → broadcast result available notification
- student-service → invalidate result cache for all students

---

#### GAZETTE_GENERATED
```json
{
  "event_id": "uuid-v4",
  "event_type": "exam.gazette_generated",
  "version": "1.0",
  "timestamp": "2024-06-01T09:30:00Z",
  "producer": "exam-service",
  "payload": {
    "job_id": "uuid",
    "exam_year": "2024",
    "format": "csv",
    "download_url": "https://storage.bece.gov.ng/gazette/2024.csv",
    "expires_at": "2024-06-08T09:30:00Z",
    "total_records": 45230,
    "requested_by": "admin_user_id"
  }
}
```
**Consumers:** notification-service → notify admin gazette is ready

---

#### CERTIFICATE_ISSUED
```json
{
  "event_id": "uuid-v4",
  "event_type": "exam.certificate_issued",
  "version": "1.0",
  "timestamp": "2024-06-15T10:00:00Z",
  "producer": "exam-service",
  "payload": {
    "certificate_id": "uuid",
    "student_id": "uuid",
    "student_name": "Amina Bello",
    "student_email": "amina@example.com",
    "reg_number": "BECE2401010010001",
    "exam_year": "2024",
    "download_url": "https://storage.bece.gov.ng/certs/uuid.pdf"
  }
}
```
**Consumers:** notification-service → send certificate ready email

---

### auth.events Exchange

#### PASSWORD_RESET_REQUESTED
```json
{
  "event_id": "uuid-v4",
  "event_type": "auth.password_reset_requested",
  "version": "1.0",
  "timestamp": "2024-01-15T14:00:00Z",
  "producer": "auth-service",
  "payload": {
    "user_id": "uuid",
    "user_type": "student",
    "email": "amina@example.com",
    "reset_url": "https://bece.gov.ng/auth/reset-password/TOKEN",
    "expires_at": "2024-01-15T15:00:00Z"
  }
}
```
**Consumers:** notification-service → send password reset email

---

### school.events Exchange

#### SCHOOL_APPROVED
```json
{
  "event_id": "uuid-v4",
  "event_type": "school.approved",
  "version": "1.0",
  "timestamp": "2024-01-10T09:00:00Z",
  "producer": "school-service",
  "payload": {
    "school_id": "uuid",
    "school_name": "Government Secondary School Kano",
    "state_id": "uuid",
    "lga_id": "uuid",
    "approved_by": "admin_user_id"
  }
}
```
**Consumers:**
- notification-service → notify school admin
- student-service → invalidate school cache

---

## 3. Queue Configuration

### RabbitMQ Queue Definitions

```yaml
# notification-service queues
queue: q.notifications.email
  exchange: student.events, payment.events, exam.events, auth.events, school.events
  routing_keys: ["*.registered", "*.completed", "*.published", "*.reset_requested", "*.approved", "*.issued"]
  durable: true
  dead_letter_exchange: dlx.bece.events
  dead_letter_routing_key: dlq.failed_notifications
  message_ttl: 86400000  # 24 hours

queue: q.notifications.sms
  exchange: student.events, payment.events
  routing_keys: ["student.registered", "payment.completed", "payment.failed"]
  durable: true
  dead_letter_exchange: dlx.bece.events

# student-service queues
queue: q.student.payment_updates
  exchange: payment.events
  routing_keys: ["payment.completed"]
  durable: true
  dead_letter_exchange: dlx.bece.events
  dead_letter_routing_key: dlq.failed_student_updates

# exam-service queues
queue: q.exam.student_events
  exchange: student.events, payment.events
  routing_keys: ["student.registered", "payment.completed"]
  durable: true
  dead_letter_exchange: dlx.bece.events
```

---

## 4. Retry and Dead-Letter Strategy

### Retry Policy
```
Attempt 1: immediate (on message receipt)
Attempt 2: 30 seconds delay (x-delay header)
Attempt 3: 5 minutes delay
Attempt 4: 30 minutes delay
Attempt 5: move to dead-letter queue

Implementation:
  Use RabbitMQ delayed message plugin for retry delays.
  Each retry increments x-retry-count header.
  Consumer checks header before processing.
```

### Dead-Letter Queue Processing
```
Dead-letter queues are monitored by an admin dashboard widget.
Alerts sent to admin email when DLQ depth > 10 messages.
Manual replay available via admin API:
  POST /api/v1/admin/dlq/:queue/replay
  POST /api/v1/admin/dlq/:queue/discard
```

### Idempotency Pattern (All Consumers)
```typescript
async function processEvent(event: BECEEvent): Promise<void> {
  const dedupeKey = `event_processed:${event.event_id}`;
  
  // Atomic check-and-set
  const alreadyProcessed = await redis.set(dedupeKey, '1', {
    NX: true,      // Only set if not exists
    EX: 86400      // Expire after 24 hours
  });
  
  if (!alreadyProcessed) {
    logger.info('Duplicate event skipped', { event_id: event.event_id });
    return; // Acknowledge without processing
  }
  
  await handleEvent(event);
}
```

---

## 5. Event Versioning

```
All events include a "version" field.
Consumers must handle multiple versions gracefully.

Version upgrade strategy:
  1. Publish new version alongside old version (dual publish)
  2. Update all consumers to handle new version
  3. Stop publishing old version
  4. Remove old version handling after 2 sprints

Example:
  v1.0: { student_id: "int" }
  v2.0: { student_id: "uuid" }  ← breaking change
  
  During migration: publish both v1.0 and v2.0
  Consumers check version field and handle accordingly
```

---

## 6. Event Flow Diagrams

### Student Registration Flow
```
Student submits form
       │
       ▼
student-service
  → INSERT students
  → Generate reg_number
  → PUBLISH student.registered
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
notification-service              exam-service
  → Render welcome email template    → Create result placeholder
  → Send email via SMTP              → ACK message
  → Send SMS via Termii
  → ACK message
```

### Payment Completion Flow
```
Paystack webhook POST /payment/webhook
       │
       ▼
payment-service
  → Verify Paystack signature
  → Deduplicate by event_id
  → UPDATE payments SET status='success'
  → PUBLISH payment.completed
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
student-service                   notification-service
  → UPDATE students                  → Send payment confirmation
    SET payment_status='paid'          email + SMS
  → Invalidate Redis cache           → ACK message
  → ACK message
```

### Result Publication Flow
```
Admin clicks "Publish Results"
       │
       ▼
exam-service
  → UPDATE results SET published_at = NOW()
  → PUBLISH exam.result_published
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
notification-service              student-service
  → Send bulk notification           → Invalidate result cache
    (queued, rate-limited)             for all students
  → ACK message                      → ACK message
```
