# SYSTEM ARCHITECTURE — Nigeria BECE Enterprise Platform
# Phase 2: Target Architecture Blueprint

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                        │
│                                                                               │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│   │  Next.js Web    │   │  Mobile (Future) │   │  Admin Portal   │           │
│   │ (Student/Public)│   │  React Native    │   │  Next.js        │           │
│   └────────┬────────┘   └────────┬─────────┘   └────────┬────────┘           │
└────────────┼────────────────────┼─────────────────────┼────────────────────┘
             │                    │                       │
             └────────────────────┼───────────────────────┘
                                  │  HTTPS / TLS 1.3
┌─────────────────────────────────▼───────────────────────────────────────────┐
│                          API GATEWAY LAYER                                   │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Kong API Gateway / Nginx                          │   │
│   │   • JWT Validation    • Rate Limiting    • Request Logging           │   │
│   │   • Route Matching    • Load Balancing   • API Versioning            │   │
│   │   • CORS Handling     • SSL Termination  • Circuit Breaking          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
             │              │              │              │              │
             ▼              ▼              ▼              ▼              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        MICROSERVICES LAYER                                  │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Auth    │  │ Student  │  │  School  │  │ Payment  │  │  Exam    │    │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │    │
│  │ Node.js  │  │ Node.js  │  │ Node.js  │  │ Node.js  │  │ Golang   │    │
│  │ :3001    │  │ :3002    │  │ :3003    │  │ :3004    │  │ :3005    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                                              │
│  ┌──────────┐  ┌──────────┐                                                │
│  │Notif.    │  │Reporting │                                                │
│  │ Service  │  │ Service  │                                                │
│  │ Node.js  │  │ Golang   │                                                │
│  │ :3006    │  │ :3007    │                                                │
│  └──────────┘  └──────────┘                                                │
└────────────────────────────────────────────────────────────────────────────┘
             │              │              │              │
             ▼              ▼              ▼              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     MESSAGING & CACHE LAYER                                 │
│                                                                              │
│   ┌──────────────────────┐        ┌──────────────────────┐                 │
│   │   RabbitMQ Cluster   │        │    Redis Cluster      │                 │
│   │   (Event Bus)        │        │    (Cache + Sessions) │                 │
│   │   • Exchanges        │        │    • Session Store    │                 │
│   │   • Dead Letter Q    │        │    • Rate Limit Store │                 │
│   │   • Retry Policies   │        │    • Analytics Cache  │                 │
│   └──────────────────────┘        └──────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────────┘
             │              │              │              │
             ▼              ▼              ▼              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                           │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ auth_db  │  │student_db│  │school_db │  │payment_db│  │  exam_db │   │
│  │PostgreSQL│  │PostgreSQL│  │PostgreSQL│  │PostgreSQL│  │PostgreSQL│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              reporting_db (Read Replica / Analytics)                  │  │
│  │              PostgreSQL + TimescaleDB extension                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY LAYER                                     │
│                                                                              │
│   Prometheus + Grafana    ELK Stack (Logs)    Jaeger (Tracing)             │
│   AlertManager            Kibana Dashboard    OpenTelemetry                 │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Inventory

| Service | Language | Port | Database | Scaling Priority |
|---|---|---|---|---|
| auth-service | Node.js + TypeScript | 3001 | auth_db | High |
| student-service | Node.js + TypeScript | 3002 | student_db | Critical |
| school-service | Node.js + TypeScript | 3003 | school_db | Low |
| payment-service | Node.js + TypeScript | 3004 | payment_db | High |
| exam-service | Golang | 3005 | exam_db | Medium |
| notification-service | Node.js + TypeScript | 3006 | (stateless) | Medium |
| reporting-service | Golang | 3007 | reporting_db | Low |
| api-gateway | Kong / Nginx | 80/443 | (stateless) | Critical |

---

## 3. Communication Matrix

```
Service          → Calls              → Method
─────────────────────────────────────────────────────────────────
api-gateway      → auth-service       → REST (JWT validation)
api-gateway      → all services       → REST (proxied requests)
student-service  → school-service     → gRPC (school validation)
student-service  → auth-service       → gRPC (token introspection)
payment-service  → student-service    → gRPC (student lookup)
payment-service  → school-service     → gRPC (school lookup)
exam-service     → student-service    → gRPC (student data)
exam-service     → school-service     → gRPC (school data)
reporting-service→ all services       → Read replica DB (no service calls)

Async Events (RabbitMQ):
student-service  → STUDENT_REGISTERED → notification-service, exam-service
payment-service  → PAYMENT_COMPLETED  → student-service, notification-service
exam-service     → RESULT_PUBLISHED   → notification-service, student-service
exam-service     → GAZETTE_GENERATED  → notification-service
auth-service     → PASSWORD_RESET     → notification-service
school-service   → SCHOOL_APPROVED    → notification-service
```

---

## 4. Migration Order (Safest to Riskiest)

```
Step 1: school-service     — lowest coupling, mostly reference data
Step 2: auth-service       — isolated, well-defined boundaries
Step 3: notification-service — pure consumer, no DB ownership
Step 4: payment-service    — isolated Paystack integration
Step 5: student-service    — core domain, extract last of the Node.js services
Step 6: exam-service       — Golang rewrite, most complex
Step 7: reporting-service  — Golang, read-only, safe to add anytime
Step 8: admin-portal       — Next.js, migrate after all APIs are stable
```

---

## 5. Highest-Risk Modules

| Module | Risk | Reason | Mitigation |
|---|---|---|---|
| Student registration | Critical | 3 duplicate paths, session coupling | Consolidate first (Phase 3) |
| Payment callback | Critical | Financial data, Paystack timing | Idempotency keys, dead-letter queue |
| Auth/session | High | All services depend on it | Extract first, keep backward compat |
| Gazette generation | High | Full table scan, no pagination | Golang rewrite with streaming |
| Admin analytics | Medium | N+1 queries, no caching | Redis cache before extraction |
| Result publishing | Medium | Triggers notifications + certificates | Event-driven, async |

---

## 6. Scalability Bottlenecks

| Bottleneck | Current State | Target Solution |
|---|---|---|
| Session storage | In-memory (single node) | Redis cluster session store |
| DB connections | Pool of 5 | PgBouncer + pool of 50 per service |
| Analytics queries | 12 queries per page load | Pre-computed, Redis cached |
| Gazette generation | Synchronous, blocks request | Async job + S3 download link |
| Email/SMS sending | Synchronous in request | RabbitMQ queue + notification-service |
| Student registration peak | Single process | Horizontal pod autoscaling |
| Payment verification | Synchronous Paystack call | Webhook-first, verify async |

---

## 7. Security Architecture

```
Layer 1 — Network:
  • TLS 1.3 everywhere
  • Private VPC for service-to-service
  • Public subnets only for API Gateway

Layer 2 — API Gateway:
  • JWT validation on every request
  • Rate limiting per IP and per user
  • Request size limits
  • IP allowlisting for admin routes

Layer 3 — Service:
  • mTLS for gRPC service-to-service
  • Service accounts (not shared credentials)
  • Input validation at every boundary
  • Parameterized queries only

Layer 4 — Data:
  • Encryption at rest (PostgreSQL TDE)
  • Encryption in transit (TLS)
  • Secrets in Kubernetes Secrets / Vault
  • No credentials in environment variables in production

Layer 5 — Application:
  • RBAC enforced at service level
  • Audit log for all mutations
  • PII fields encrypted (guardianPhone, email)
  • Password hashing: bcrypt cost 12
```

---

## 8. Deployment Strategy

```
Environment Progression:
  local → dev → staging → production

Deployment Method:
  • Docker images built in CI
  • Images pushed to ECR / Docker Hub
  • Kubernetes rolling deployments
  • Blue/green for payment-service (zero downtime)
  • Canary releases for student-service during exam periods

Rollback Strategy:
  • Every deployment tagged with git SHA
  • kubectl rollout undo available
  • Database migrations are backward compatible (expand/contract pattern)
  • Feature flags for risky changes
```
