import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User } from '../models';
import bcrypt from 'bcryptjs';

describe('Authentication System', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await User.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        })
        .expect(302); // Redirect after successful login

      expect(response.headers.location).toContain('/admin/dashboard');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpass123'
        })
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });

  describe('Role-based Access Control', () => {
    let agent: request.SuperAgentTest;

    beforeEach(async () => {
      agent = request.agent(app);

      // Create and login as admin
      const hashedPassword = await bcrypt.hash('adminpass123', 10);
      await User.create({
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });

      await agent
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'adminpass123'
        });
    });

    it('should allow admin to access dashboard', async () => {
      const response = await agent
        .get('/admin/dashboard')
        .expect(200);

      expect(response.text).toContain('Admin Dashboard');
    });

    it('should deny access to super admin routes', async () => {
      const response = await agent
        .get('/admin/users')
        .expect(302); // Redirect due to insufficient permissions

      expect(response.headers.location).toContain('/admin/dashboard');
    });
  });
});

describe('Student Management', () => {
  let agent: request.SuperAgentTest;
  let authToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user and get token
    const hashedPassword = await bcrypt.hash('adminpass123', 10);
    const admin = await User.create({
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    // Mock JWT token generation
    authToken = 'mock-jwt-token';
  });

  describe('GET /api/students', () => {
    it('should return paginated students list', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter students by school', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ schoolId: '1', limit: 10 })
        .expect(200);

      expect(response.body.data.every((student: any) => student.schoolId === 1)).toBe(true);
    });
  });
});

describe('Payment Processing', () => {
  it('should handle successful payment webhook', async () => {
    const paymentData = {
      reference: 'test-ref-123',
      amount: 500000, // 5000 NGN
      status: 'success',
      customer: {
        email: 'student@example.com'
      }
    };

    const response = await request(app)
      .post('/webhook/paystack')
      .set('x-paystack-signature', 'valid-signature')
      .send(paymentData)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
  });

  it('should reject invalid webhook signature', async () => {
    const response = await request(app)
      .post('/webhook/paystack')
      .set('x-paystack-signature', 'invalid-signature')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Error Handling', () => {
  it('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.text).toContain('Page Not Found');
  });

  it('should handle server errors gracefully', async () => {
    // Mock a route that throws an error
    const response = await request(app)
      .get('/test/error')
      .expect(500);

    expect(response.text).toContain('Server Error');
  });
});

describe('Security Features', () => {
  it('should implement rate limiting', async () => {
    const requests = Array(101).fill(null).map(() =>
      request(app).get('/api/health')
    );

    const responses = await Promise.all(requests);

    const tooManyRequests = responses.some((res: any) => res.status === 429);
    expect(tooManyRequests).toBe(true);
  });

  it('should set security headers', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
    expect(response.headers).toHaveProperty('x-xss-protection');
  });
});