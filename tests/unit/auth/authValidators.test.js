// tests/unit/auth/authValidators.test.js
import {
  adminLoginSchema,
  adminRegisterSchema,
  studentLoginSchema,
  studentRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../../src/auth/validators/authValidators.js';

// Helper: validate and return { error, value }
const validate = (schema, data) =>
  schema.validate(data, { abortEarly: true, stripUnknown: true });

// ── adminLoginSchema ─────────────────────────────────────────────────────────
describe('adminLoginSchema', () => {
  test('passes with valid email and password', () => {
    const { error } = validate(adminLoginSchema, {
      email: 'admin@bece.gov.ng',
      password: 'secret123',
    });
    expect(error).toBeUndefined();
  });

  test('fails with invalid email', () => {
    const { error } = validate(adminLoginSchema, { email: 'not-an-email', password: 'secret123' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/valid email/i);
  });

  test('fails with short password', () => {
    const { error } = validate(adminLoginSchema, { email: 'admin@bece.gov.ng', password: '123' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/6 characters/i);
  });

  test('fails when email is missing', () => {
    const { error } = validate(adminLoginSchema, { password: 'secret123' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/required/i);
  });
});

// ── adminRegisterSchema ──────────────────────────────────────────────────────
describe('adminRegisterSchema', () => {
  const valid = {
    name: 'Test Admin',
    email: 'admin@bece.gov.ng',
    password: 'secret123',
    confirmPassword: 'secret123',
    role: 'admin',
  };

  test('passes with valid data', () => {
    const { error } = validate(adminRegisterSchema, valid);
    expect(error).toBeUndefined();
  });

  test('fails when passwords do not match', () => {
    const { error } = validate(adminRegisterSchema, { ...valid, confirmPassword: 'different' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/do not match/i);
  });

  test('fails with invalid role', () => {
    const { error } = validate(adminRegisterSchema, { ...valid, role: 'hacker' });
    expect(error).toBeDefined();
  });

  test('defaults role to admin when omitted', () => {
    const { value } = validate(adminRegisterSchema, { ...valid, role: undefined });
    expect(value.role).toBe('admin');
  });
});

// ── studentLoginSchema ───────────────────────────────────────────────────────
describe('studentLoginSchema', () => {
  test('passes with regNumber and password', () => {
    const { error } = validate(studentLoginSchema, {
      regNumber: 'BECE2401010010001',
      password: 'mypassword',
    });
    expect(error).toBeUndefined();
  });

  test('fails when regNumber is missing', () => {
    const { error } = validate(studentLoginSchema, { password: 'mypassword' });
    expect(error).toBeDefined();
  });
});

// ── studentRegisterSchema ────────────────────────────────────────────────────
describe('studentRegisterSchema', () => {
  const valid = {
    name: 'Amina Bello',
    email: 'amina@example.com',
    password: 'pass123',
    confirmPassword: 'pass123',
    stateId: 1,
    lgaId: 2,
    schoolId: 3,
  };

  test('passes with valid data', () => {
    const { error } = validate(studentRegisterSchema, valid);
    expect(error).toBeUndefined();
  });

  test('fails with invalid Nigerian phone', () => {
    const { error } = validate(studentRegisterSchema, {
      ...valid,
      guardianPhone: '12345',
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Nigerian/i);
  });

  test('passes with valid Nigerian phone +234 format', () => {
    const { error } = validate(studentRegisterSchema, {
      ...valid,
      guardianPhone: '+2348012345678',
    });
    expect(error).toBeUndefined();
  });

  test('passes with valid Nigerian phone 080 format', () => {
    const { error } = validate(studentRegisterSchema, {
      ...valid,
      guardianPhone: '08012345678',
    });
    expect(error).toBeUndefined();
  });

  test('fails when stateId is missing', () => {
    const { error } = validate(studentRegisterSchema, { ...valid, stateId: undefined });
    expect(error).toBeDefined();
  });
});

// ── forgotPasswordSchema ─────────────────────────────────────────────────────
describe('forgotPasswordSchema', () => {
  test('passes with valid email', () => {
    const { error } = validate(forgotPasswordSchema, { email: 'user@example.com' });
    expect(error).toBeUndefined();
  });

  test('defaults userType to student', () => {
    const { value } = validate(forgotPasswordSchema, { email: 'user@example.com' });
    expect(value.userType).toBe('student');
  });

  test('fails with invalid email', () => {
    const { error } = validate(forgotPasswordSchema, { email: 'bad' });
    expect(error).toBeDefined();
  });
});

// ── resetPasswordSchema ──────────────────────────────────────────────────────
describe('resetPasswordSchema', () => {
  test('passes with matching passwords', () => {
    const { error } = validate(resetPasswordSchema, {
      password: 'newpass123',
      confirmPassword: 'newpass123',
    });
    expect(error).toBeUndefined();
  });

  test('fails when passwords do not match', () => {
    const { error } = validate(resetPasswordSchema, {
      password: 'newpass123',
      confirmPassword: 'different',
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/do not match/i);
  });

  test('fails with short password', () => {
    const { error } = validate(resetPasswordSchema, {
      password: '123',
      confirmPassword: '123',
    });
    expect(error).toBeDefined();
  });
});
