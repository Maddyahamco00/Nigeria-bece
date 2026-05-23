# Phase 4 - Student Module Enterprise Refactor (Monolith)

## Steps
- [ ] Gather remaining student-module dependencies (middleware, validation style, error handling patterns)
- [ ] Create `src/student-module/` folder structure
- [ ] Add DTO schemas + validators for student registration, biodata, subjects, confirmation, login, profile update, password change, and `/api/lgas/:stateId`
- [ ] Implement repositories for Student/Reference/Result/Payment/pre_reg_payments linking
- [ ] Implement `StudentService` with business logic moved from `controllers/studentController.js`
- [ ] Implement student controllers (thin) calling `StudentService`
- [ ] Wire `routes/studentRoutes.js` to use the new thin controllers without changing outward routes
- [ ] Add caching-prep wrapper for student lookups (Redis-ready, pass-through for now)
- [ ] Add security hardening: RBAC/authorization checks where applicable, secure upload handling if present (no functional changes)
- [ ] Add unit/service tests for registration/login/profile/password + validation
- [ ] Add route tests (smoke) for critical endpoints
- [ ] Generate required documentation files
- [ ] Run `npm test` and a dev-start smoke check
- [ ] Final verification: student routes + auth/session + DB compatibility

