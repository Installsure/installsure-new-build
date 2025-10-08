import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Health API', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      uptime: expect.any(Number),
      version: expect.any(String),
      timestamp: expect.any(String),
      environment: expect.any(String),
    });
  });

  it('should return liveness status', async () => {
    const response = await request(app).get('/api/health/live').expect(200);

    expect(response.body).toMatchObject({
      status: 'alive',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    });
  });

  it('should return readiness status', async () => {
    const response = await request(app).get('/api/health/ready').expect(200);

    expect(response.body).toMatchObject({
      status: 'ready',
      timestamp: expect.any(String),
      checks: {
        database: {
          status: 'healthy',
        },
        queue: {
          status: 'healthy',
        },
      },
    });
  });
});



