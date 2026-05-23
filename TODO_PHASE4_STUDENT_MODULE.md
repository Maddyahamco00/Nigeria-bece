# TODO - Phase 4 (Student Module Enterprise Refactor)

## Step 0 — Safety decisions
- [x] Identified legacy student logic + active routes.
- [x] Confirmed `src/student-module/` controllers are stubs.
- [x] Chosen Strict safety approach (no active route wiring changes yet).

## Step 1 — Create enterprise layered folder structure
- [x] Add `src/student-module/controllers/`
- [x] Add `src/student-module/services/`
- [ ] Add `src/student-module/repositories/`

- [ ] Add `src/student-module/validators/`
- [ ] Add `src/student-module/dto/`
- [ ] Add `src/student-module/middleware/`
- [ ] Add `src/student-module/utils/`
- [ ] Add `src/student-module/cache/` (prepare Redis-ready layer)

## Step 2 — Implement services + repositories for parity with legacy behavior
- [ ] Biodata + registration flow
- [ ] Subjects selection → payment → confirmation flow
- [ ] Student login
- [ ] Dashboard (student + results)
- [ ] Profile render + update + email notification behavior
- [ ] Change password
- [ ] `/api/lgas/:stateId` lookup

## Step 3 — DTO validation + consistent error handling
- [ ] Add validation for registration, profile update, password change, biodata step
- [ ] Add validation for `/api/lgas/:stateId`
- [ ] Implement consistent operational errors (flash + JSON for XHR)
- [ ] Duplicate registration handling parity (email)

## Step 4 — Pagination/filtering support
- [ ] Add pagination/filter/sort utilities
- [ ] Only apply to endpoints that exist (do not add/replace routes yet)

## Step 5 — Tests
- [ ] Unit tests for services
- [ ] Route tests for core flows
- [ ] Filtering/pagination tests only where applicable

## Step 6 — Security improvements (scaffolding-safe)
- [ ] Student RBAC/authorization middleware
- [ ] Secure upload scaffolding (only if uploads exist in current student module)
- [ ] Input sanitization alignment

## Step 7 — Documentation (required)
- [ ] STUDENT_MODULE_ARCHITECTURE.md
- [ ] STUDENT_API.md
- [ ] STUDENT_VALIDATION_RULES.md
- [ ] PHASE4_REFACTOR_SUMMARY.md

## Step 8 — Verification before completion
- [ ] app still starts
- [ ] authentication still works
- [ ] student routes still work
- [ ] frontend compatibility preserved
- [ ] DB compatibility preserved

