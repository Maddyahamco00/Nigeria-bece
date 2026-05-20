# DEVOPS PLAN — Nigeria BECE Enterprise Platform

---

## 1. Monorepo Structure

```
nigeria-bece/                          ← Git monorepo root
│
├── apps/
│   ├── web/                           ← Next.js student/public portal
│   │   ├── src/
│   │   │   ├── app/                   ← Next.js 14 App Router
│   │   │   │   ├── (public)/          ← Landing, payment pages
│   │   │   │   ├── (auth)/            ← Login, register pages
│   │   │   │   ├── (student)/         ← Student dashboard, results
│   │   │   │   └── (admin)/           ← Admin portal
│   │   │   ├── components/
│   │   │   │   ├── ui/                ← shadcn/ui base components
│   │   │   │   ├── forms/             ← React Hook Form components
│   │   │   │   ├── charts/            ← Recharts wrappers
│   │   │   │   └── layout/            ← Header, sidebar, footer
│   │   │   ├── hooks/                 ← Custom React hooks
│   │   │   ├── lib/
│   │   │   │   ├── api/               ← API client (axios/fetch wrappers)
│   │   │   │   ├── auth/              ← Auth utilities, token management
│   │   │   │   └── utils/             ← Shared utilities
│   │   │   ├── store/                 ← Zustand state stores
│   │   │   ├── types/                 ← TypeScript type definitions
│   │   │   └── middleware.ts          ← Next.js middleware (route protection)
│   │   ├── public/
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── legacy/                        ← Current monolith (kept running during migration)
│       ├── app.js
│       ├── controllers/
│       ├── routes/
│       ├── models/
│       ├── views/
│       └── package.json
│
├── services/
│   ├── auth-service/                  ← Node.js + TypeScript
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── validators/
│   │   │   ├── events/
│   │   │   ├── types/
│   │   │   └── app.ts
│   │   ├── migrations/
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── student-service/               ← Node.js + TypeScript (same structure)
│   ├── school-service/                ← Node.js + TypeScript (same structure)
│   ├── payment-service/               ← Node.js + TypeScript (same structure)
│   ├── notification-service/          ← Node.js + TypeScript (same structure)
│   │
│   ├── exam-service/                  ← Golang
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── config/
│   │   │   ├── handlers/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── queue/
│   │   │   ├── validator/
│   │   │   └── utils/
│   │   ├── migrations/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── go.mod
│   │
│   └── reporting-service/             ← Golang (same structure as exam-service)
│
├── packages/                          ← Shared libraries (npm workspaces)
│   ├── shared-types/                  ← TypeScript interfaces shared across services
│   │   ├── src/
│   │   │   ├── events.ts              ← Event payload types
│   │   │   ├── api.ts                 ← API request/response types
│   │   │   └── models.ts              ← Shared model types
│   │   └── package.json
│   │
│   ├── shared-validators/             ← Joi/Zod schemas shared across services
│   │   ├── src/
│   │   │   ├── student.ts
│   │   │   ├── payment.ts
│   │   │   └── auth.ts
│   │   └── package.json
│   │
│   └── shared-utils/                  ← Common utilities
│       ├── src/
│       │   ├── logger.ts
│       │   ├── errors.ts
│       │   └── pagination.ts
│       └── package.json
│
├── proto/                             ← gRPC Protocol Buffer definitions
│   ├── auth.proto
│   ├── student.proto
│   ├── school.proto
│   ├── exam.proto
│   └── payment.proto
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml         ← Full stack local development
│   │   ├── docker-compose.dev.yml     ← Development overrides
│   │   └── docker-compose.test.yml    ← Test environment
│   │
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   │   ├── production.yaml
│   │   │   └── staging.yaml
│   │   ├── services/
│   │   │   ├── auth-service/
│   │   │   │   ├── deployment.yaml
│   │   │   │   ├── service.yaml
│   │   │   │   ├── hpa.yaml           ← Horizontal Pod Autoscaler
│   │   │   │   └── configmap.yaml
│   │   │   ├── student-service/
│   │   │   ├── school-service/
│   │   │   ├── payment-service/
│   │   │   ├── exam-service/
│   │   │   ├── notification-service/
│   │   │   └── reporting-service/
│   │   ├── gateway/
│   │   │   ├── nginx-deployment.yaml
│   │   │   ├── nginx-configmap.yaml
│   │   │   └── ingress.yaml
│   │   ├── databases/
│   │   │   ├── postgres-statefulset.yaml
│   │   │   └── redis-statefulset.yaml
│   │   ├── messaging/
│   │   │   └── rabbitmq-statefulset.yaml
│   │   └── monitoring/
│   │       ├── prometheus/
│   │       ├── grafana/
│   │       └── jaeger/
│   │
│   ├── terraform/                     ← Cloud infrastructure as code
│   │   ├── modules/
│   │   │   ├── eks/                   ← AWS EKS cluster
│   │   │   ├── rds/                   ← AWS RDS PostgreSQL
│   │   │   ├── elasticache/           ← AWS ElastiCache Redis
│   │   │   └── vpc/                   ← Network configuration
│   │   ├── environments/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── main.tf
│   │
│   └── scripts/
│       ├── setup-local.sh
│       ├── run-migrations.sh
│       └── seed-dev-data.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml                     ← Test + lint on every PR
│       ├── cd-staging.yml             ← Deploy to staging on merge to main
│       └── cd-production.yml          ← Deploy to production on release tag
│
├── docs/                              ← Architecture documentation (Phase 1 + 2)
├── .env.example
├── turbo.json                         ← Turborepo build orchestration
└── package.json                       ← Root workspace package.json
```

---

## 2. Docker Strategy

### Per-Service Dockerfile Pattern (Node.js)
```dockerfile
# Multi-stage build
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
RUN addgroup -g 1001 -S nodejs && adduser -S bece -u 1001
COPY --from=build --chown=bece:nodejs /app/dist ./dist
COPY --from=deps --chown=bece:nodejs /app/node_modules ./node_modules
COPY --chown=bece:nodejs package*.json ./
USER bece
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
```

### Per-Service Dockerfile Pattern (Golang)
```dockerfile
FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

FROM gcr.io/distroless/static-debian12 AS production
COPY --from=build /app/server /server
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["/server", "-health-check"]
ENTRYPOINT ["/server"]
```

### Local Development (docker-compose.yml)
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: devpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/docker/init-dbs.sql:/docker-entrypoint-initdb.d/init.sql
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports: ["6379:6379"]

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: bece
      RABBITMQ_DEFAULT_PASS: devpassword
    ports: ["5672:5672", "15672:15672"]

  legacy-app:
    build: ./apps/legacy
    ports: ["3000:3000"]
    environment:
      NODE_ENV: development
      DB_HOST: postgres
    depends_on: [postgres, redis]

  auth-service:
    build: ./services/auth-service
    ports: ["3001:3001"]
    depends_on: [postgres, redis, rabbitmq]

  # ... other services
```

---

## 3. Kubernetes Structure

### Namespace Strategy
```
bece-production    ← production workloads
bece-staging       ← staging workloads
bece-monitoring    ← Prometheus, Grafana, Jaeger
bece-infra         ← RabbitMQ, Redis (if not managed)
```

### Deployment Pattern (per service)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: bece-production
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: auth-service
  template:
    spec:
      containers:
      - name: auth-service
        image: bece/auth-service:${GIT_SHA}
        ports: [{containerPort: 3001}]
        resources:
          requests: {cpu: "100m", memory: "128Mi"}
          limits:   {cpu: "500m", memory: "512Mi"}
        livenessProbe:
          httpGet: {path: /health, port: 3001}
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet: {path: /ready, port: 3001}
          initialDelaySeconds: 5
          periodSeconds: 10
        envFrom:
        - secretRef: {name: auth-service-secrets}
        - configMapRef: {name: auth-service-config}
```

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: student-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: student-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 4. CI/CD Pipelines

### ci.yml — Pull Request Checks
```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: {node-version: '20'}
    - run: npm ci
    - run: npm run lint
    - run: npm run type-check
    - run: npm run test:coverage
    - run: npm run security:audit

  docker-build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: docker build -t bece/auth-service:test ./services/auth-service
    - run: docker run --rm bece/auth-service:test node -e "console.log('OK')"
```

### cd-staging.yml — Staging Deployment
```yaml
name: Deploy to Staging
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Build and push images
      run: |
        docker build -t bece/auth-service:${{ github.sha }} ./services/auth-service
        docker push bece/auth-service:${{ github.sha }}
    - name: Run migrations
      run: kubectl exec -n bece-staging deploy/auth-service -- npm run migrate
    - name: Deploy
      run: |
        kubectl set image deployment/auth-service \
          auth-service=bece/auth-service:${{ github.sha }} \
          -n bece-staging
        kubectl rollout status deployment/auth-service -n bece-staging
```

### cd-production.yml — Production Deployment
```yaml
name: Deploy to Production
on:
  push:
    tags: ['v*']
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval
    steps:
    - name: Deploy with blue/green (payment-service)
      run: |
        # payment-service uses blue/green
        kubectl apply -f k8s/payment-service/deployment-green.yaml
        kubectl rollout status deployment/payment-service-green
        kubectl patch service payment-service -p '{"spec":{"selector":{"slot":"green"}}}'
    - name: Rolling deploy (other services)
      run: |
        kubectl set image deployment/auth-service \
          auth-service=bece/auth-service:${{ github.ref_name }}
```

---

## 5. Environment Management

```
Environments:
  local     → docker-compose, .env file
  dev       → Kubernetes dev namespace, auto-deployed on feature branch
  staging   → Kubernetes staging namespace, auto-deployed on main merge
  production → Kubernetes production namespace, manual approval required

Secrets Management:
  local:      .env file (never committed)
  staging:    Kubernetes Secrets (base64 encoded)
  production: AWS Secrets Manager or HashiCorp Vault
              Injected into pods via External Secrets Operator

Config Management:
  Non-sensitive config: Kubernetes ConfigMaps
  Sensitive config: Kubernetes Secrets / Vault
  Feature flags: Environment variables (simple) or LaunchDarkly (advanced)
```

---

## 6. Monitoring Stack

### Metrics (Prometheus + Grafana)
```
Collected metrics per service:
  http_requests_total{method, path, status}
  http_request_duration_seconds{method, path}
  db_query_duration_seconds{query_type}
  rabbitmq_messages_consumed_total{queue}
  rabbitmq_messages_failed_total{queue}
  cache_hits_total{cache_type}
  cache_misses_total{cache_type}

Dashboards:
  - Service health overview
  - Request rate and latency (p50, p95, p99)
  - Error rate by service
  - Database connection pool usage
  - RabbitMQ queue depths
  - Redis hit/miss ratios
  - Payment success/failure rates
  - Student registration rate (exam season monitoring)
```

### Alerting Rules
```yaml
# Critical alerts (PagerDuty)
- alert: ServiceDown
  expr: up{job="bece-services"} == 0
  for: 1m

- alert: PaymentServiceErrorRate
  expr: rate(http_requests_total{service="payment-service",status=~"5.."}[5m]) > 0.01
  for: 2m

- alert: DatabaseConnectionPoolExhausted
  expr: db_pool_available_connections < 2
  for: 1m

# Warning alerts (Slack)
- alert: HighResponseLatency
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
  for: 5m

- alert: RabbitMQQueueDepthHigh
  expr: rabbitmq_queue_messages > 1000
  for: 5m
```

### Distributed Tracing (Jaeger + OpenTelemetry)
```
Every request gets a trace ID at the gateway.
Trace ID propagated via X-Trace-Id header.
Each service creates spans for:
  - HTTP handler execution
  - Database queries
  - Redis operations
  - RabbitMQ publish/consume
  - gRPC calls

Sampling rate:
  production: 10% (cost control)
  staging: 100%
  Error traces: always sampled
```

### Centralized Logging (ELK Stack)
```
Log pipeline:
  Service → Fluent Bit (sidecar) → Elasticsearch → Kibana

Log format: JSON (structured)
Log levels: error, warn, info, debug
Retention: 30 days hot, 90 days cold (S3)

Kibana dashboards:
  - Error log stream
  - Payment event log
  - Authentication failures
  - Student registration activity
  - Admin action audit log
```

---

## 7. Frontend Migration Path (EJS → Next.js)

### Migration Strategy: Strangler Fig Pattern
```
Phase A: Run both systems simultaneously
  - Legacy EJS app continues serving all routes
  - Next.js app deployed at new subdomain: app.bece.gov.ng
  - New features built in Next.js only

Phase B: Migrate route by route
  Order (lowest risk first):
  1. Public landing page (/)
  2. Student registration form
  3. Student login
  4. Student dashboard
  5. Payment flow
  6. Admin login
  7. Admin dashboard
  8. Admin management pages

Phase C: Decommission legacy frontend
  - All routes migrated to Next.js
  - EJS views archived
  - Legacy app becomes API-only (or decommissioned)
```

### Next.js Architecture
```
Authentication:
  - NextAuth.js for session management
  - JWT stored in HttpOnly cookie
  - Middleware.ts for route protection
  - Role-based route guards

State Management:
  - Zustand for global state (user session, notifications)
  - React Query (TanStack Query) for server state + caching
  - No Redux (overkill for this scale)

API Integration:
  - Centralized API client in lib/api/
  - Automatic token refresh on 401
  - Error boundary components

Folder Structure:
  app/(public)/page.tsx          ← Landing page
  app/(auth)/login/page.tsx      ← Login
  app/(auth)/register/page.tsx   ← Registration
  app/(student)/dashboard/page.tsx
  app/(student)/results/page.tsx
  app/(student)/payments/page.tsx
  app/(admin)/dashboard/page.tsx
  app/(admin)/students/page.tsx
  app/(admin)/schools/page.tsx
  app/(admin)/results/page.tsx
  app/(admin)/analytics/page.tsx
```
