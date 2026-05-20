# AUTH FLOW — Nigeria BECE Portal (Phase 3)

## Architecture Layers

```
HTTP Request
     │
     ▼
routes/auth.js              ← URL wiring only, no logic
     │
     ├── validateBody()     ← Joi schema validation (src/auth/validators/)
     │
     ▼
src/auth/controllers/AuthController.js
     │   ← receives req/res, calls service, returns response
     │   ← zero business logic
     ▼
src/auth/services/AuthService.js
     │   ← all business logic lives here
     │   ← throws AppError subclasses on failure
     │   ← no req/res/flash/redirect
     ▼
src/auth/repositories/AuthRepository.js
     │   ← all database access lives here
     │   ← wraps Sequelize calls
     │   ← throws NotFoundError when record missing
     ▼
models/User.js  /  models/Student.js
     │   ← Sequelize model definitions
     ▼
MySQL Database
```

---

## Admin Login Flow

```
1. GET  /auth/admin
       → AuthController.showAdminLoginPage()
       → renders auth/admin-login.ejs

2. POST /auth/admin
       → validateBody(adminLoginSchema)   [Joi: email required, password min 6]
       → AuthController.handleAdminLogin()
       → passport.authenticate('local-admin')
       → config/passport.js local-admin strategy
       → AuthService.validateAdminCredentials(email, password)
           → AuthRepository.findUserByEmail(email)
           → check role is in ADMIN_ROLES list
           → check isActive === true
           → bcrypt.compare(password, hash)
           → throws AuthenticationError on any failure
       → req.logIn(user)  →  session created
       → redirect /admin/dashboard

Failure path:
       → AuthenticationError caught in passport strategy
       → done(null, false, { message })
       → req.flash('error', message)
       → redirect /auth/admin
```

## Admin Registration Flow

```
1. GET  /auth/admin/register
       → AuthController.showAdminRegisterPage()
       → loads states + schools from DB
       → renders auth/admin-register.ejs

2. POST /auth/admin/register
       → validateBody(adminRegisterSchema)
           [name, email, password, confirmPassword, role, optional stateId/schoolId]
       → AuthController.handleAdminRegister()
       → AuthService.registerAdmin(data)
           → AuthRepository.findUserByEmail(email)  — check duplicate
           → throws ConflictError if exists
           → AuthRepository.createUser(data)
           → User model beforeCreate hook hashes password (bcrypt cost 10)
       → req.flash('success')
       → redirect /auth/admin
```

## Student Login Flow

```
1. GET  /auth/student/login
       → AuthController.showStudentLoginPage()
       → renders auth/student-login.ejs

2. POST /auth/student/login
       → passport.authenticate('local-student')
       → config/passport.js local-student strategy
       → AuthService.validateStudentCredentials(regNumber, password)
           → AuthRepository.findStudentByRegNumberOrEmail(identifier)
               [searches both regNumber and email columns]
           → bcrypt.compare(password, hash)
           → throws AuthenticationError on failure
       → req.logIn(student)  →  session created
       → redirect /students/dashboard

Failure path:
       → req.flash('error', message)
       → redirect /auth/student/login
```

## Password Reset Flow

```
1. GET  /auth/forgot-password
       → renders auth/forgot-password.ejs

2. POST /auth/forgot-password
       → validateBody(forgotPasswordSchema)  [email, userType: admin|student]
       → AuthController.handleForgotPassword()
       → AuthService.initiatePasswordReset(email, userType)
           → finds User or Student by email
           → if not found: silently returns (prevents user enumeration)
           → generates crypto.randomBytes(32) token
           → saves token + expiration (1 hour) to DB
           → fires sendEmail() — non-blocking (fire-and-forget)
       → req.flash('success', generic message)
       → redirect /auth/forgot-password

3. GET  /auth/reset-password/:token?type=admin|student
       → AuthController.showResetPasswordPage()
       → AuthService.validateResetToken(token, userType)
           → queries DB for token where expiration > NOW()
           → throws TokenInvalidError if not found
       → renders auth/reset-password.ejs

4. POST /auth/reset-password/:token
       → validateBody(resetPasswordSchema)  [password, confirmPassword, userType]
       → AuthController.handleResetPassword()
       → AuthService.completePasswordReset(token, password, userType)
           → validateResetToken() — re-validates
           → bcrypt.hash(password, 12)
           → AuthRepository.setUserPassword() or setStudentPassword()
               [saves hash, clears resetToken + resetTokenExpiration]
           → fires confirmation email — non-blocking
           → returns redirect path
       → req.flash('success')
       → redirect to login page
```

## Logout Flow

```
GET /auth/logout
    → AuthController.handleLogout()
    → req.logout()  [Passport clears req.user]
    → req.session.destroy()  [destroys session cookie]
    → redirect /auth/login?logged_out=1
```

## Session Serialization

```
passport.serializeUser:
    stores { id, role } in session

passport.deserializeUser:
    if role === 'student' → Student.findByPk(id)
    else                  → User.findByPk(id)
    result attached to req.user on every request
```

## Middleware Guards

```
requireAuthenticatedAdmin  (src/auth/middleware/authMiddleware.js)
    → checks req.isAuthenticated() && req.user
    → on failure: flash + redirect /auth/admin
    → used by: all /admin/* routes

requireAuthenticatedStudent
    → checks req.session.student
    → fallback: checks req.isAuthenticated() + req.user, populates session
    → on failure: flash + redirect /auth/student/login
    → used by: all protected /students/* routes

Backward-compatible aliases exported from middleware/auth.js:
    isAuthenticated  → requireAuthenticatedAdmin
    isAdmin          → requireAuthenticatedAdmin
    ensureStudent    → requireAuthenticatedStudent
```
