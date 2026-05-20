# API Map — Nigeria BECE Portal

## Public Routes

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/` | publicController.getHome | None | Landing page |
| GET | `/health` | inline (app.js) | None | Health check (DB ping) |

---

## Auth Routes (`/auth`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/auth/login` | inline | None | Login selection page |
| GET | `/auth/admin` | inline | None | Admin login page |
| POST | `/auth/admin` | passport local-admin | None | Admin login handler |
| GET | `/auth/admin/register` | inline | None | Admin registration page |
| POST | `/auth/admin/register` | inline | None | Admin registration handler |
| POST | `/auth/login` | passport local-admin | None | Shared login handler |
| GET | `/auth/student/login` | inline | None | Student login page |
| POST | `/auth/student/login` | passport local-student | None | Student login handler |
| GET | `/auth/student/register` | inline | None | Student registration page |
| POST | `/auth/student/register` | inline | None | Student registration handler |
| GET | `/auth/register` | redirect | None | Redirects to /students/register/biodata |
| GET | `/auth/forgot-password` | inline | None | Forgot password page |
| POST | `/auth/forgot-password` | inline | None | Send reset link |
| GET | `/auth/reset-password/:token` | inline | None | Reset password page |
| POST | `/auth/reset-password/:token` | inline | None | Reset password handler |
| GET | `/auth/logout` | inline | None | Logout (destroys session) |

---

## Student Routes (`/students`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/students/` | inline | None | Students home |
| GET | `/students/register` | inline | None | Single-step registration form |
| POST | `/students/register` | studentController.registerStudent | None | Single-step registration handler |
| GET | `/students/register/biodata` | studentController.renderBiodataForm | None | Multi-step: biodata form |
| POST | `/students/register/biodata` | studentController.handleBiodata | None | Multi-step: biodata submit |
| GET | `/students/register/subjects` | studentController.renderSubjectsForm | None | Multi-step: subject selection |
| POST | `/students/register/subjects` | studentController.handleSubjects | None | Multi-step: subject submit |
| GET | `/students/register/payment` | studentController.renderPaymentPage | None | Multi-step: payment page |
| GET | `/students/register/confirmation` | studentController.renderConfirmationPage | None | Multi-step: confirmation |
| GET | `/students/login` | studentController.renderLogin | None | Student login page |
| POST | `/students/login` | studentController.loginStudent | None | Student login handler |
| GET | `/students/dashboard` | studentController.renderDashboard | requireStudent | Student dashboard |
| GET | `/students/dashboard/full` | inline | requireStudent | Dashboard with full data |
| GET | `/students/profile` | studentController.renderProfile | requireStudent | Student profile |
| POST | `/students/profile` | studentController.updateProfile | requireStudent | Update profile |
| POST | `/students/change-password` | studentController.changePassword | requireStudent | Change password |
| GET | `/students/results` | inline | requireStudent | View results |
| GET | `/students/payments` | inline | requireStudent | View payments |
| POST | `/students/payment/simulate` | inline | requireStudent | Simulate payment (dev) |
| GET | `/students/api/lgas/:stateId` | inline | None | AJAX: LGAs by state |
| GET | `/students/logout` | inline | None | Student logout |

---

## Payment Routes (`/payment`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/payment/pay` | inline | None | Demo payment page |
| POST | `/payment/pay` | inline | None | Demo payment handler |
| POST | `/payment/init` | inline | None | Initialize Paystack transaction |
| GET | `/payment/callback` | inline | None | Paystack redirect callback |
| GET | `/payment/complete` | inline | None | Payment complete page |
| POST | `/payment/verify` | inline | None | Client-side verify endpoint |

---

## Admin Routes (`/admin`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/admin/dashboard` | inline | requireAdmin | Main dashboard |
| GET | `/admin/dashboard/live/counters` | inline | requireAdmin | Live counter data (AJAX) |
| GET | `/admin/dashboard/live/recent` | inline | requireAdmin | Live recent data (AJAX) |
| GET | `/admin/dashboard/stats` | inline | requireAdmin | Chart stats (AJAX) |
| GET | `/admin/students` | inline | requireAdmin | Students list |
| GET | `/admin/students/:id` | inline | requireAdmin | View student |
| GET | `/admin/students/:id/edit` | inline | requireAdmin | Edit student form |
| POST | `/admin/students/:id` | inline | requireAdmin | Update student |
| GET | `/admin/schools` | inline | requireAdmin | Schools list |
| POST | `/admin/schools` | inline | requireAdmin | Add school |
| GET | `/admin/schools/:id` | inline | requireAdmin | View school |
| GET | `/admin/schools/:id/edit` | inline | requireAdmin | Edit school form |
| POST | `/admin/schools/edit/:id` | inline | requireAdmin | Update school |
| GET | `/admin/results` | inline | requireAdmin | Results list |
| GET | `/admin/results/new` | inline | requireAdmin | Add result form |
| GET | `/admin/payments` | inline | requireAdmin | Payments list |
| GET | `/admin/users` | inline | requireSuperAdmin | Users list |
| GET | `/admin/users/new` | inline | requireSuperAdmin | Add user form |
| POST | `/admin/users` | inline | requireSuperAdmin | Create user |
| POST | `/admin/users/:id/toggle` | inline | requireSuperAdmin | Toggle user active |
| DELETE | `/admin/users/:id` | inline | requireSuperAdmin | Delete user |
| GET | `/admin/subjects` | inline | requireAdmin | Subjects list |
| POST | `/admin/subjects` | inline | requireAdmin | Add subject |
| DELETE | `/admin/subjects/:id` | inline | requireAdmin | Delete subject |
| GET | `/admin/timetable` | inline | requireAdmin | Timetable |
| POST | `/admin/timetable` | inline | requireAdmin | Add timetable entry |
| GET | `/admin/timetable/export` | inline | requireAdmin | Export timetable CSV |
| GET | `/admin/centers` | inline | requireAdmin | Exam centers |
| POST | `/admin/centers` | inline | requireAdmin | Add exam center |
| GET | `/admin/certificates` | inline | requireAdmin | Certificates |
| GET | `/admin/gazette` | inline | requireAdmin | Gazette page |
| GET | `/admin/publish` | inline | requireAdmin | Publications |
| GET | `/admin/analytics` | inline | requireAdmin | Analytics dashboard |
| GET | `/admin/settings` | inline | requireAdmin | Settings |

---

## Public API Routes (`/api`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/states` | inline | None | All states |
| GET | `/api/lgas/:stateId` | inline | None | LGAs by state |
| GET | `/api/schools/:lgaId` | inline | None | Schools by LGA |
| POST | `/api/schools` | schoolController.createSchool | None | Create school |
| GET | `/api/schools` | schoolController.getSchools | None | All schools |
| GET | `/api/schools/:id` | schoolController.getSchool | None | Single school |
| PUT | `/api/schools/:id` | schoolController.updateSchool | None | Update school |
| DELETE | `/api/schools/:id` | schoolController.deleteSchool | None | Delete school |

> ⚠️ Note: `/api/schools/:lgaId` (apiRoutes) and `/api/schools/:id` (schoolRoutes) share the same path pattern — potential conflict.

---

## Webhook Routes (`/webhook`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/webhook` | webhook.js | Paystack signature | Paystack event webhook |

---

## Emergency / Debug Routes (app.js)

| Method | Path | Description | Risk |
|---|---|---|---|
| GET | `/create-admin-now` | Creates hardcoded super admin | 🔴 CRITICAL — must be removed |
