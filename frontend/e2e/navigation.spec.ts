import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have proper document structure', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page has proper HTML structure
    const html = page.locator('html');
    await expect(html).toBeVisible();
    
    // Check for the root element
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should redirect to login for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should have accessible login form', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility - form should have proper labels
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test('should have register link on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Look for a link to register page
    const registerLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await expect(registerLink).toBeVisible();
  });
});
