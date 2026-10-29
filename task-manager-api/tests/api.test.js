const request = require('supertest');
const app = require('../server');

describe('Task Management API Test Suite (CI/CD Pipeline)', () => {
  let authToken = '';
  const testUser = {
    email: `ci_test_${Date.now()}@charusat.edu.in`,
    password: 'Password123!'
  };

  // Test 1: Unauthenticated request should be rejected (Practical 7)
  test('GET /tasks returns 401 Unauthorized when missing JWT token', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  // Test 2: User registration returns valid token
  test('POST /register successfully creates account and returns JWT token', async () => {
    const res = await request(app)
      .post('/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email.toLowerCase());
    authToken = res.body.token;
  });

  // Test 3: Authenticated task creation returns 201 Created
  test('POST /tasks creates a new task document for authenticated user', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'CI Automated Pipeline Verification Task',
        description: 'Verifying automated testing in GitHub Actions CI pipeline',
        priority: 'high'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('CI Automated Pipeline Verification Task');
    expect(res.body.priority).toBe('high');
  });

  // Test 4: Authenticated tasks query returns 200 OK (Practical 4/6/7)
  test('GET /tasks returns 200 OK with list of tasks for authenticated user', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Test 5 (Supplementary): Cache telemetry endpoint check (Practical 9)
  test('GET /cache-stats returns 200 OK with cache telemetry data', async () => {
    const res = await request(app).get('/cache-stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('stdTTL', 60);
    expect(res.body.data).toHaveProperty('hits');
    expect(res.body.data).toHaveProperty('misses');
  });

  // Test 6: AI API endpoint rejects request without title (Practical 13)
  test('POST /api/ai/generate-description returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('x-bypass-ratelimit', 'true')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation Error');
  });

  // Test 7: AI API handles failure/unavailable keys gracefully with fallback response (Practical 13)
  test('POST /api/ai/generate-description returns 200 with fallback description on unconfigured key', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('x-bypass-ratelimit', 'true')
      .send({ title: 'Configure GitHub Actions CI/CD Pipeline' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('description');
    expect(typeof res.body.description).toBe('string');
    expect(res.body.description.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('fallback', true);
    expect(res.body).toHaveProperty('disclaimer');
  });

  // Test 8: AI API enforces rate limiting on rapid requests (Practical 13)
  test('POST /api/ai/generate-description enforces rate limiting on rapid calls', async () => {
    // First call consumes the slot
    await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Initial Rate Limit Warmup' });

    // Immediate second call should receive 429 Too Many Requests
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Second Rapid Call' });

    expect(res.statusCode).toBe(429);
    expect(res.body).toHaveProperty('error', 'Too Many Requests');
  });
});
