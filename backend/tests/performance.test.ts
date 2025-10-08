import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Performance Tests', () => {
  beforeAll(async () => {
    // Warm up the application
    await request(app).get('/api/health');
  });

  it('should handle concurrent project requests efficiently', async () => {
    const concurrentRequests = 10;
    const startTime = Date.now();

    const promises = Array(concurrentRequests)
      .fill(null)
      .map(() => request(app).get('/api/projects').expect(200));

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Concurrent requests (${concurrentRequests}) completed in ${duration}ms`);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle health check under load', async () => {
    const requests = 50;
    const startTime = Date.now();

    const promises = Array(requests)
      .fill(null)
      .map(() => request(app).get('/api/health'));

    const responses = await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });

    console.log(`Health check load test (${requests} requests) completed in ${duration}ms`);
    expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
  });

  it('should handle file upload stress test', async () => {
    const testFiles = 5;
    const startTime = Date.now();

    // Create mock file buffers
    const mockFile = Buffer.from('Mock BIM file content for testing');

    const promises = Array(testFiles)
      .fill(null)
      .map((_, index) => {
        return request(app)
          .post('/api/files/upload')
          .attach('file', mockFile, `test-model-${index}.ifc`)
          .expect(201);
      });

    const responses = await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // All uploads should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
    });

    console.log(`File upload stress test (${testFiles} files) completed in ${duration}ms`);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  it('should maintain response times under concurrent load', async () => {
    const testDuration = 5000; // 5 seconds
    const requestsPerSecond = 10;
    const startTime = Date.now();
    const responseTimes: number[] = [];

    const makeRequest = async () => {
      const requestStart = Date.now();
      const response = await request(app).get('/api/health');
      const requestEnd = Date.now();

      responseTimes.push(requestEnd - requestStart);
      return response;
    };

    // Run requests continuously for the test duration
    const promises: Promise<any>[] = [];
    let requestCount = 0;

    const interval = setInterval(() => {
      for (let i = 0; i < requestsPerSecond; i++) {
        promises.push(makeRequest());
        requestCount++;
      }
    }, 1000);

    // Wait for test duration
    await new Promise((resolve) => setTimeout(resolve, testDuration));
    clearInterval(interval);

    // Wait for all pending requests to complete
    await Promise.all(promises);

    // Calculate statistics
    const totalRequests = responseTimes.length;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / totalRequests;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    console.log(`Load test results:`);
    console.log(`- Total requests: ${totalRequests}`);
    console.log(`- Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`- Max response time: ${maxResponseTime}ms`);
    console.log(`- Min response time: ${minResponseTime}ms`);

    // Performance assertions
    expect(avgResponseTime).toBeLessThan(1000); // Average should be under 1 second
    expect(maxResponseTime).toBeLessThan(5000); // Max should be under 5 seconds
    expect(totalRequests).toBeGreaterThan(30); // Should handle at least 30 requests
  });
});



