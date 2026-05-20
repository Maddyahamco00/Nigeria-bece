# API GATEWAY DESIGN — Nigeria BECE Enterprise Platform

---

## 1. Gateway Technology Choice

**Primary:** Kong Gateway (open-source)
**Alternative:** Nginx + custom middleware (simpler, lower ops overhead)
**Recommendation:** Start with Nginx for simplicity; migrate to Kong when plugin ecosystem is needed.

---

## 2. Gateway Responsibilities

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway                                  │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ SSL/TLS     │  │ JWT         │  │ Rate        │                 │
│  │ Termination │  │ Validation  │  │ Limiting    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Request     │  │ Route       │  │ Load        │                 │
│  │ Logging     │  │ Matching    │  │ Balancing   │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ CORS        │  │ API         │  │ Circuit     │                 │
│  │ Handling    │  │ Versioning  │  │ Breaking    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Authentication Flow

### JWT Validation at Gateway

```
Client Request
     │
     ▼
API Gateway
  1. Extract Authorization: Bearer <token>
  2. Verify JWT signature (RS256, public key)
  3. Check token expiry (exp claim)
  4. Check token blacklist in Redis
     Key: blacklist:{jti}
  5. Extract claims: { sub, role, permissions, iat, exp, jti }
  6. Inject headers for downstream services:
     X-User-Id: <sub>
     X-User-Role: <role>
     X-User-Permissions: <permissions_json>
     X-Request-Id: <generated uuid>
  7. Forward to upstream service
     │
     ▼
  Upstream Service
  (trusts gateway — no re-validation needed)
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "bece-2024-01"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "admin@bece.gov.ng",
    "role": "admin",
    "permissions": {
      "students": ["read", "update"],
      "schools": ["read"],
      "results": ["create", "read", "update"]
    },
    "type": "access",
    "iat": 1705312200,
    "exp": 1705313100,
    "jti": "unique-token-id"
  }
}
```

### Token Lifecycle

```
Access Token:
  TTL: 15 minutes
  Storage: Memory only (never localStorage)
  Rotation: On every refresh

Refresh Token:
  TTL: 7 days
  Storage: HttpOnly cookie (SameSite=Strict)
  Rotation: On every use (refresh token rotation)
  Revocation: Stored in Redis with TTL

Token Refresh Flow:
  1. Client detects 401 response
  2. Client sends POST /api/v1/auth/refresh
     Cookie: refresh_token=<token>
  3. auth-service validates refresh token
  4. Issues new access token + new refresh token
  5. Old refresh token invalidated in Redis
  6. New refresh token set as HttpOnly cookie
```

---

## 4. Route Configuration

### Route Table

```nginx
# Nginx upstream configuration

upstream auth_service {
  server auth-service:3001;
  keepalive 32;
}

upstream student_service {
  server student-service:3002;
  keepalive 32;
}

upstream school_service {
  server school-service:3003;
  keepalive 32;
}

upstream payment_service {
  server payment-service:3004;
  keepalive 32;
}

upstream exam_service {
  server exam-service:3005;
  keepalive 32;
}

upstream reporting_service {
  server reporting-service:3007;
  keepalive 32;
}

# Route definitions
location /api/v1/auth/ {
  proxy_pass http://auth_service;
  # No JWT required for login/register
}

location /api/v1/students/ {
  include /etc/nginx/jwt_validation.conf;
  proxy_pass http://student_service;
}

location /api/v1/schools/ {
  include /etc/nginx/jwt_validation.conf;
  proxy_pass http://school_service;
}

location /api/v1/payments/ {
  include /etc/nginx/jwt_validation.conf;
  proxy_pass http://payment_service;
}

location /api/v1/payments/webhook {
  # Webhook: no JWT, but Paystack signature required
  proxy_pass http://payment_service;
}

location /api/v1/exam/ {
  include /etc/nginx/jwt_validation.conf;
  proxy_pass http://exam_service;
}

location /api/v1/reports/ {
  include /etc/nginx/jwt_validation.conf;
  proxy_pass http://reporting_service;
}
```

### Public Routes (No Auth Required)

```
GET  /api/v1/auth/admin/login
POST /api/v1/auth/admin/login
POST /api/v1/auth/student/login
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password/:token
GET  /api/v1/schools                    ← public school list
GET  /api/v1/states                     ← public states list
GET  /api/v1/states/:id/lgas            ← public LGA list
GET  /api/v1/lgas/:id/schools           ← public school list by LGA
POST /api/v1/payments/webhook           ← Paystack webhook (signature auth)
GET  /health                            ← health check
```

### Protected Routes (JWT Required)

```
All /api/v1/students/* except registration and login
All /api/v1/payments/* except /webhook
All /api/v1/exam/*
All /api/v1/reports/*
Admin-only: POST/PUT/DELETE on schools, students, results
```

---

## 5. Rate Limiting Strategy

```nginx
# Rate limit zones (stored in Redis)

# Global rate limit
limit_req_zone $binary_remote_addr zone=global:10m rate=100r/m;

# Auth endpoints (strict)
limit_req_zone $binary_remote_addr zone=auth:10m rate=20r/15m;

# Payment endpoints (strict)
limit_req_zone $binary_remote_addr zone=payment:10m rate=10r/15m;

# Student registration
limit_req_zone $binary_remote_addr zone=registration:10m rate=5r/m;

# API endpoints (per authenticated user)
limit_req_zone $http_x_user_id zone=api_user:10m rate=200r/m;

# Webhook (Paystack IPs only)
limit_req_zone $binary_remote_addr zone=webhook:10m rate=100r/m;
```

### Rate Limit Headers Returned
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705313100
Retry-After: 60  (on 429 response)
```

---

## 6. API Versioning Strategy

```
URL-based versioning: /api/v1/, /api/v2/

Rules:
  • v1 is the current stable version
  • v2 is introduced only for breaking changes
  • Both versions run simultaneously during transition
  • v1 deprecated with 6-month notice
  • Deprecation header added: Deprecation: true, Sunset: <date>

Version lifecycle:
  v1 → active
  v2 → active (when introduced)
  v1 → deprecated (6 months after v2 launch)
  v1 → sunset (removed)

Gateway handles version routing:
  /api/v1/* → current services
  /api/v2/* → new service versions (when available)
```

---

## 7. Request/Response Logging

### Log Format (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "request_id": "uuid-v4",
  "method": "POST",
  "path": "/api/v1/payments/initialize",
  "status": 200,
  "duration_ms": 245,
  "user_id": "uuid",
  "user_role": "student",
  "ip": "197.210.x.x",
  "user_agent": "Mozilla/5.0...",
  "upstream": "payment-service",
  "upstream_duration_ms": 230
}
```

### What Gets Logged
- All requests (method, path, status, duration)
- User identity (user_id, role) — no PII
- Upstream service and latency
- Error details on 4xx/5xx

### What Never Gets Logged
- Passwords
- JWT tokens
- Payment card data
- Guardian phone numbers (PII)
- Email addresses in request bodies

---

## 8. Circuit Breaker Configuration

```
Per upstream service:
  Threshold: 5 failures in 10 seconds → open circuit
  Half-open: 1 probe request after 30 seconds
  Recovery: 3 consecutive successes → close circuit

Fallback responses:
  auth-service down:    503 { "error": "Authentication service unavailable" }
  payment-service down: 503 { "error": "Payment service temporarily unavailable" }
  student-service down: 503 { "error": "Service temporarily unavailable" }
  exam-service down:    503 { "error": "Exam service temporarily unavailable" }
```

---

## 9. CORS Configuration

```
Allowed origins (production):
  https://bece.gov.ng
  https://admin.bece.gov.ng
  https://student.bece.gov.ng

Allowed origins (staging):
  https://staging.bece.gov.ng
  https://staging-admin.bece.gov.ng

Allowed methods: GET, POST, PUT, DELETE, OPTIONS
Allowed headers: Authorization, Content-Type, X-Request-Id
Exposed headers: X-RateLimit-Limit, X-RateLimit-Remaining
Max age: 86400 (24 hours preflight cache)
Credentials: true (for cookie-based refresh tokens)
```

---

## 10. Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self' https://js.paystack.co
```

---

## 11. Service-to-Service Authentication (mTLS)

```
Internal service calls (gRPC) use mutual TLS:
  • Each service has a client certificate issued by internal CA
  • Services verify each other's certificates
  • Certificates rotated every 90 days via cert-manager (Kubernetes)

Internal REST calls (if any) use:
  • Shared secret header: X-Internal-Secret: <secret>
  • Secret stored in Kubernetes Secret
  • Rotated monthly

Gateway strips all X-Internal-* headers from external requests
to prevent header injection attacks.
```
