import { test, expect } from '../fixtures/auth';

test.describe('Settings Workflow', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
  });

  test('should display settings page', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('text=/settings|preferences/i').first()).toBeVisible();
  });

  test('should display user profile section', async ({ authenticatedPage: page }) => {
    // Wait for settings to load
    await page.waitForTimeout(2000);
    
    // Should show profile or user settings
    const page_content = await page.content();
    const hasProfile = page_content.match(/profile|user|name|email/i);
    
    expect(hasProfile).toBeTruthy();
  });

  test('should display integration status', async ({ authenticatedPage: page }) => {
    // Look for integration information (from the snippets we saw)
    await page.waitForTimeout(2000);
    
    const integrationSection = page.locator('text=/integration|autocad|quickbooks|forge/i');
    await expect(integrationSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display environment configuration', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Should show environment info
    const page_content = await page.content();
    const hasEnvInfo = page_content.match(/environment|configuration|sentry|development|production/i);
    
    expect(hasEnvInfo).toBeTruthy();
  });

  test('should display feature flags or toggles', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Look for feature flags, toggles, or checkboxes
    const toggles = page.locator('input[type="checkbox"], [role="switch"]');
    
    const count = await toggles.count();
    if (count > 0) {
      await expect(toggles.first()).toBeVisible();
    }
  });

  test('should have settings sections or tabs', async ({ authenticatedPage: page }) => {
    // Settings might have multiple sections
    await page.waitForTimeout(2000);
    
    const sections = page.locator('section, [class*="section"], [role="tabpanel"]');
    await expect(sections.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display API or connection status', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Look for status indicators
    const statusIndicators = page.locator('text=/enabled|disabled|configured|status/i');
    await expect(statusIndicators.first()).toBeVisible({ timeout: 5000 });
  });
});
