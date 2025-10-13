import { test as base, expect } from '@playwright/test';

export type AuthFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in login credentials (using demo credentials from README)
    await page.fill('input[type="email"]', 'owner@example.com');
    await page.fill('input[type="password"]', 'demo123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Use the authenticated page
    await use(page);
  },
});

export { expect };
