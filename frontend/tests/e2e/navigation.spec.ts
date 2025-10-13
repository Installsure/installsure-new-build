import { test, expect } from '../fixtures/auth';

test.describe('Navigation Workflow', () => {
  test('should navigate to all main pages from dashboard', async ({ authenticatedPage: page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Projects
    await page.locator('a[href="/projects"]').first().click();
    await expect(page).toHaveURL(/\/projects/);

    // Navigate to RFIs
    await page.locator('a[href="/rfis"]').first().click();
    await expect(page).toHaveURL(/\/rfis/);

    // Navigate to Tasks
    await page.locator('a[href="/tasks"]').first().click();
    await expect(page).toHaveURL(/\/tasks/);

    // Navigate to Calendar
    await page.locator('a[href="/calendar"]').first().click();
    await expect(page).toHaveURL(/\/calendar/);

    // Navigate to Files
    await page.locator('a[href="/files"]').first().click();
    await expect(page).toHaveURL(/\/files/);

    // Navigate to Settings
    await page.locator('a[href="/settings"]').first().click();
    await expect(page).toHaveURL(/\/settings/);

    // Navigate back to Dashboard
    await page.locator('a[href="/dashboard"]').first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should have consistent navigation bar across pages', async ({ authenticatedPage: page }) => {
    const pages = ['/dashboard', '/projects', '/rfis', '/tasks', '/calendar', '/files', '/settings'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check that navbar/sidebar exists
      const nav = page.locator('nav, aside, [role="navigation"]').first();
      await expect(nav).toBeVisible();
    }
  });

  test('should display user info in navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    
    // User email or name should be visible somewhere
    const userInfo = page.locator('text=/owner@example.com|owner/i');
    await expect(userInfo.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have working breadcrumbs or page titles', async ({ authenticatedPage: page }) => {
    const pages = [
      { path: '/dashboard', title: /dashboard/i },
      { path: '/projects', title: /projects/i },
      { path: '/rfis', title: /rfis|request for information/i },
      { path: '/tasks', title: /tasks/i },
      { path: '/calendar', title: /calendar/i },
      { path: '/files', title: /files|documents/i },
      { path: '/settings', title: /settings|preferences/i },
    ];

    for (const { path, title } of pages) {
      await page.goto(path);
      await expect(page.locator(`text=${title}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle direct URL navigation', async ({ authenticatedPage: page }) => {
    // Directly navigate to various pages
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/projects/);

    await page.goto('/rfis');
    await expect(page).toHaveURL(/\/rfis/);

    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/tasks/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
  });
});
