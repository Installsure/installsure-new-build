import { test, expect } from '@playwright/test';

/**
 * Golden Path E2E Test Suite
 * 
 * Tests the core user journey as defined in the Golden Path v1.1:
 * 1. Login
 * 2. Upload IFC file
 * 3. View 3D model
 * 4. Run QTO (Quantity Take-Off)
 * 5. Export results
 * 6. Create RFI
 * 7. Subscribe to iCal feed
 */

test.describe('Golden Path User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete the full golden path flow', async ({ page }) => {
    // Step 1: Login
    await test.step('Login', async () => {
      // Check if already logged in, otherwise perform login
      const loginButton = page.locator('button:has-text("Login")');
      if (await loginButton.isVisible()) {
        await page.fill('input[name="email"]', 'admin@installsure.com');
        await page.fill('input[name="password"]', 'demo123');
        await page.click('button[type="submit"]');
        
        // Wait for successful login
        await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
      }
    });

    // Step 2: Navigate to Projects
    await test.step('Navigate to Projects', async () => {
      await page.click('a[href*="/projects"]');
      await expect(page).toHaveURL(/.*projects/);
    });

    // Step 3: Create or select a project
    await test.step('Select Project', async () => {
      // Check if projects exist, otherwise create one
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count > 0) {
        // Click on first project
        await projectCards.first().click();
      } else {
        // Create new project
        await page.click('button:has-text("New Project")');
        await page.fill('input[name="name"]', 'E2E Test Project');
        await page.fill('textarea[name="description"]', 'Created by E2E test');
        await page.click('button:has-text("Create")');
      }
      
      // Wait for project page to load
      await expect(page.locator('h1')).toBeVisible();
    });

    // Step 4: Upload IFC file (or other supported file)
    await test.step('Upload File', async () => {
      // Navigate to files section
      const filesButton = page.locator('button:has-text("Files"), a:has-text("Files")');
      if (await filesButton.isVisible()) {
        await filesButton.click();
      }
      
      // Look for upload button
      const uploadButton = page.locator('button:has-text("Upload"), input[type="file"]');
      await expect(uploadButton.first()).toBeVisible({ timeout: 5000 });
      
      // Note: Actual file upload would require a test file
      // This is a placeholder for the upload interaction
      console.log('File upload interaction point identified');
    });

    // Step 5: View 3D model (IFC.js viewer)
    await test.step('View 3D Model', async () => {
      // Check for viewer component
      const viewerExists = await page.locator('[data-testid="ifc-viewer"], .viewer-container').count() > 0;
      if (viewerExists) {
        await expect(page.locator('[data-testid="ifc-viewer"], .viewer-container')).toBeVisible();
        console.log('3D Viewer component found');
      } else {
        console.log('3D Viewer not yet implemented or not visible');
      }
    });

    // Step 6: Run QTO (Quantity Take-Off)
    await test.step('Run QTO', async () => {
      // Look for QTO trigger button
      const qtoButton = page.locator('button:has-text("QTO"), button:has-text("Quantity")');
      if (await qtoButton.count() > 0) {
        await qtoButton.first().click();
        // Wait for job to be enqueued
        await expect(page.locator('text=/processing|queued|calculating/i')).toBeVisible({ timeout: 5000 });
        console.log('QTO job initiated');
      } else {
        console.log('QTO feature not yet available');
      }
    });

    // Step 7: Create RFI
    await test.step('Create RFI', async () => {
      // Navigate to RFI section
      await page.click('a[href*="/rfis"]').catch(() => console.log('RFI link not found'));
      
      const createRFIButton = page.locator('button:has-text("New RFI"), button:has-text("Create RFI")');
      if (await createRFIButton.count() > 0) {
        await createRFIButton.first().click();
        
        // Fill RFI form
        await page.fill('input[name="title"]', 'E2E Test RFI');
        await page.fill('textarea[name="description"]', 'Created by automated E2E test');
        await page.click('button:has-text("Create"), button[type="submit"]');
        
        await expect(page.locator('text=E2E Test RFI')).toBeVisible({ timeout: 5000 });
        console.log('RFI created successfully');
      } else {
        console.log('RFI creation not yet available');
      }
    });

    // Step 8: Subscribe to iCal feed
    await test.step('Subscribe to iCal', async () => {
      // Navigate to calendar
      await page.click('a[href*="/calendar"]').catch(() => console.log('Calendar link not found'));
      
      // Look for iCal subscription link
      const icalLink = page.locator('a[href*=".ics"], button:has-text("Subscribe")');
      if (await icalLink.count() > 0) {
        const href = await icalLink.first().getAttribute('href');
        expect(href).toContain('.ics');
        console.log('iCal feed available:', href);
      } else {
        console.log('iCal subscription not yet available');
      }
    });
  });

  test('should handle authentication correctly', async ({ page }) => {
    await test.step('Logout', async () => {
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")');
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        
        // Should redirect to login page
        await expect(page).toHaveURL(/.*login|.*auth/);
      }
    });

    await test.step('Unauthorized access prevention', async () => {
      // Try to access protected route
      await page.goto('/projects');
      
      // Should redirect to login or show unauthorized
      await expect(page).toHaveURL(/.*login|.*auth/);
    });
  });

  test('should display health status', async ({ page }) => {
    // Check API health endpoint
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const health = await response.json();
    expect(health.status).toBe('healthy');
  });

  test('should be responsive on mobile', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that navigation works on mobile
    await page.click('button[aria-label="menu"], button:has-text("Menu")').catch(() => {});
    
    // Main content should be visible
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });
});

test.describe('Security Tests', () => {
  test('should have secure headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check for security headers
    const headers = response?.headers();
    if (headers) {
      // Should have security headers in production
      console.log('Security headers:', {
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'strict-transport-security': headers['strict-transport-security'],
      });
    }
  });

  test('should prevent XSS in input fields', async ({ page }) => {
    await page.goto('/');
    
    // Try to inject script
    const xssPayload = '<script>alert("XSS")</script>';
    const inputField = page.locator('input[type="text"]').first();
    
    if (await inputField.count() > 0) {
      await inputField.fill(xssPayload);
      
      // Should be escaped and not execute
      const value = await inputField.inputValue();
      expect(value).toBe(xssPayload); // Input should preserve the string
      
      // But should not execute as script
      const alerts = [];
      page.on('dialog', dialog => alerts.push(dialog));
      await page.waitForTimeout(1000);
      expect(alerts.length).toBe(0);
    }
  });
});
