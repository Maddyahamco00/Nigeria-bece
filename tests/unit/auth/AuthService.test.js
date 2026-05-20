// tests/unit/auth/AuthService.test.js
// Tests AuthService in isolation — repository and email are mocked.

import { jest } from '@jest/globals';

// ── Mock the repository before importing the service ────────────────────────
const mockRepo = {
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  findStudentByEmail: jest.fn(),
  findStudentByRegNumberOrEmail: jest.fn(),
  findUserByResetToken: jest.fn(),
  findStudentByResetToken: jest.fn(),
  createUser: jest.fn(),
  saveUserResetToken: jest.fn(),
  saveStudentResetToken: jest.fn(),
  setUserPassword: jest.fn(),
  setStudentPassword: jest.fn(),
  toggleUserActive: jest.fn(),
  deleteUser: jest.fn(),
  findAllUsers: jest.fn(),
};

jest.unstable_mockModule(
  '../../../src/auth/repositories/AuthRepository.js',
  () => mockRepo
);

// Mock sendEmail — no real SMTP calls
jest.unstable_mockModule('../../../utils/sendEmail.js', () => ({
  default: jest.fn().mockResolvedValue(true),
}));

// Mock logger — suppress output during tests
jest.unstable_mockModule('../../../utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ── Dynamic imports AFTER all mocks are registered ───────────────────────────
const { default: bcrypt } = await import('bcryptjs');
const AuthService = await import('../../../src/auth/services/AuthService.js');
const {
  AuthenticationError,
  ConflictError,
  TokenInvalidError,
} = await import('../../../src/errors/AppError.js');

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = (overrides = {}) => ({
  id: 1,
  email: 'admin@bece.gov.ng',
  name: 'Test Admin',
  role: 'admin',
  isActive: true,
  password: bcrypt.hashSync('secret123', 10),
  ...overrides,
});

const makeStudent = (overrides = {}) => ({
  id: 10,
  email: 'student@example.com',
  regNumber: 'BECE2401010010001',
  password: bcrypt.hashSync('pass123', 10),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ── registerAdmin ─────────────────────────────────────────────────────────────
describe('AuthService.registerAdmin', () => {
  test('creates user when email is not taken', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(null);
    mockRepo.createUser.mockResolvedValue(makeUser());

    const result = await AuthService.registerAdmin({
      name: 'Test Admin',
      email: 'admin@bece.gov.ng',
      password: 'secret123',
      role: 'admin',
    });

    expect(mockRepo.findUserByEmail).toHaveBeenCalledWith('admin@bece.gov.ng');
    expect(mockRepo.createUser).toHaveBeenCalledTimes(1);
    expect(result.email).toBe('admin@bece.gov.ng');
  });

  test('throws ConflictError when email already exists', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(makeUser());

    await expect(
      AuthService.registerAdmin({ name: 'X', email: 'admin@bece.gov.ng', password: 'x' })
    ).rejects.toThrow(ConflictError);
  });
});

// ── validateAdminCredentials ──────────────────────────────────────────────────
describe('AuthService.validateAdminCredentials', () => {
  test('returns user on valid credentials', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(makeUser());
    const result = await AuthService.validateAdminCredentials('admin@bece.gov.ng', 'secret123');
    expect(result.id).toBe(1);
  });

  test('throws AuthenticationError when user not found', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(null);
    await expect(
      AuthService.validateAdminCredentials('nobody@x.com', 'pass')
    ).rejects.toThrow(AuthenticationError);
  });

  test('throws AuthenticationError when password is wrong', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(makeUser());
    await expect(
      AuthService.validateAdminCredentials('admin@bece.gov.ng', 'wrongpass')
    ).rejects.toThrow(AuthenticationError);
  });

  test('throws AuthenticationError when account is deactivated', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(makeUser({ isActive: false }));
    await expect(
      AuthService.validateAdminCredentials('admin@bece.gov.ng', 'secret123')
    ).rejects.toThrow(AuthenticationError);
  });

  test('throws AuthenticationError for non-admin role', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(makeUser({ role: 'student' }));
    await expect(
      AuthService.validateAdminCredentials('admin@bece.gov.ng', 'secret123')
    ).rejects.toThrow(AuthenticationError);
  });
});

// ── validateStudentCredentials ────────────────────────────────────────────────
describe('AuthService.validateStudentCredentials', () => {
  test('returns student on valid credentials', async () => {
    mockRepo.findStudentByRegNumberOrEmail.mockResolvedValue(makeStudent());
    const result = await AuthService.validateStudentCredentials('BECE2401010010001', 'pass123');
    expect(result.id).toBe(10);
  });

  test('throws AuthenticationError when student not found', async () => {
    mockRepo.findStudentByRegNumberOrEmail.mockResolvedValue(null);
    await expect(
      AuthService.validateStudentCredentials('UNKNOWN', 'pass')
    ).rejects.toThrow(AuthenticationError);
  });

  test('throws AuthenticationError on wrong password', async () => {
    mockRepo.findStudentByRegNumberOrEmail.mockResolvedValue(makeStudent());
    await expect(
      AuthService.validateStudentCredentials('BECE2401010010001', 'wrongpass')
    ).rejects.toThrow(AuthenticationError);
  });
});

// ── initiatePasswordReset ─────────────────────────────────────────────────────
describe('AuthService.initiatePasswordReset', () => {
  test('saves reset token for admin', async () => {
    const user = makeUser();
    mockRepo.findUserByEmail.mockResolvedValue(user);
    mockRepo.saveUserResetToken.mockResolvedValue(user);

    await AuthService.initiatePasswordReset('admin@bece.gov.ng', 'admin');

    expect(mockRepo.saveUserResetToken).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
      expect.any(Date)
    );
  });

  test('silently returns when email not found (prevents user enumeration)', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(null);
    await expect(
      AuthService.initiatePasswordReset('nobody@x.com', 'admin')
    ).resolves.toBeUndefined();
  });
});

// ── validateResetToken ────────────────────────────────────────────────────────
describe('AuthService.validateResetToken', () => {
  test('returns account when token is valid', async () => {
    mockRepo.findUserByResetToken.mockResolvedValue(makeUser());
    const result = await AuthService.validateResetToken('validtoken', 'admin');
    expect(result.id).toBe(1);
  });

  test('throws TokenInvalidError when token not found', async () => {
    mockRepo.findUserByResetToken.mockResolvedValue(null);
    await expect(
      AuthService.validateResetToken('badtoken', 'admin')
    ).rejects.toThrow(TokenInvalidError);
  });
});

// ── completePasswordReset ─────────────────────────────────────────────────────
describe('AuthService.completePasswordReset', () => {
  test('hashes password and returns admin redirect path', async () => {
    const user = makeUser();
    mockRepo.findUserByResetToken.mockResolvedValue(user);
    mockRepo.setUserPassword.mockResolvedValue(user);

    const redirectPath = await AuthService.completePasswordReset(
      'validtoken',
      'newpassword123',
      'admin'
    );

    expect(mockRepo.setUserPassword).toHaveBeenCalledWith(
      user.id,
      expect.stringMatching(/^\$2[ab]\$/)
    );
    expect(redirectPath).toBe('/auth/admin');
  });

  test('returns student login path for student reset', async () => {
    const student = makeStudent();
    mockRepo.findStudentByResetToken.mockResolvedValue(student);
    mockRepo.setStudentPassword.mockResolvedValue(student);

    const redirectPath = await AuthService.completePasswordReset(
      'validtoken',
      'newpassword123',
      'student'
    );
    expect(redirectPath).toBe('/auth/student/login');
  });
});
