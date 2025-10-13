import { test, expect } from '../fixtures/auth';

test.describe('Dashboard Workflow', () => {
  test('should display dashboard after login', async ({ authenticatedPage: page }) => {
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Should display dashboard elements
    await expect(page.locator('text=/dashboard/i').first()).toBeVisible();
  });

  test('should display project statistics', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    
    // Look for common dashboard elements like project count, stats cards
    const statsCards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have working navigation links', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    
    // Check that navigation/sidebar is visible
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    await expect(sidebar).toBeVisible();
    
    // Verify key navigation links exist
    await expect(page.locator('a[href="/projects"], text=/projects/i').first()).toBeVisible();
    await expect(page.locator('a[href="/tasks"], text=/tasks/i').first()).toBeVisible();
  });

  test('should navigate to projects from dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    
    // Click on projects link
    await page.locator('a[href="/projects"]').first().click();
    
    // Should navigate to projects page
    await expect(page).toHaveURL(/\/projects/);
  });

  test('should display recent activity or projects', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    
    // Dashboard should show some content (projects, tasks, or activity)
    const content = page.locator('main, [role="main"], .main-content').first();
    await expect(content).not.toBeEmpty();
  });
});
