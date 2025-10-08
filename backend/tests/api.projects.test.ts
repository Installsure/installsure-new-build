import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Projects API', () => {
  let projectId: number;

  it('should create a new project', async () => {
    const projectData = {
      name: 'Test Project',
      description: 'A test project for API testing',
    };

    const response = await request(app).post('/api/projects').send(projectData).expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      name: projectData.name,
      description: projectData.description,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });

    projectId = response.body.id;
  });

  it('should get all projects', async () => {
    const response = await request(app).get('/api/projects').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should get project by ID', async () => {
    const response = await request(app).get(`/api/projects/${projectId}`).expect(200);

    expect(response.body).toMatchObject({
      id: projectId,
      name: 'Test Project',
      description: 'A test project for API testing',
    });
  });

  it('should update project', async () => {
    const updateData = {
      name: 'Updated Test Project',
      description: 'An updated test project',
    };

    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      id: projectId,
      name: updateData.name,
      description: updateData.description,
    });
  });

  it('should delete project', async () => {
    await request(app).delete(`/api/projects/${projectId}`).expect(204);
  });

  it('should return 404 for non-existent project', async () => {
    await request(app).get('/api/projects/99999').expect(404);
  });

  it('should validate project creation data', async () => {
    const invalidData = {
      // Missing required name field
      description: 'Invalid project',
    };

    await request(app).post('/api/projects').send(invalidData).expect(400);
  });
});



