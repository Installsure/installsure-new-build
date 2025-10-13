import { test, expect } from '@playwright/test';

/**
 * Example E2E Tests Following Playwright Best Practices
 * 
 * Best Practices Demonstrated:
 * 1. Auto-wait: Playwright automatically waits for elements to be actionable
 * 2. expect() with built-in assertions
 * 3. Short, independent tests
 * 4. Page object pattern (recommended for larger test suites)
 * 5. Descriptive test names
 * 
 * Reference: https://playwright.dev/docs/best-practices
 */

test.describe('InstallSure Application', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Auto-wait: Playwright waits for the page to be ready
    // Expect the page title to contain "InstallSure"
    await expect(page).toHaveTitle(/InstallSure/i);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Auto-wait for the login button/link to be visible
    // Use locators with accessibility in mind
    const loginLink = page.getByRole('link', { name: /login/i });
    
    // Expect the login link to be visible
    await expect(loginLink).toBeVisible();
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login link
    await page.getByRole('link', { name: /login/i }).click();
    
    // Wait for navigation and verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
    
    // Verify login form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('displays error for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in the form with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit the form
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Expect an error message to appear
    // Auto-wait: Playwright waits for the error to appear
    await expect(page.getByText(/invalid|error|wrong/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Projects Page', () => {
  // This test assumes authentication is needed
  test('requires authentication', async ({ page }) => {
    // Try to access projects page directly
    await page.goto('/projects');
    
    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport works correctly', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Verify mobile navigation works
    const mobileMenu = page.getByRole('button', { name: /menu/i });
    await expect(mobileMenu).toBeVisible();
  });

  test('desktop viewport works correctly', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    
    // Verify desktop layout
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Accessibility', () => {
  test('main navigation is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible on navigation elements
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

/**
 * Page Object Model Example
 * For larger test suites, use page objects to encapsulate page interactions
 */
class LoginPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /sign in|login/i }).click();
  }

  async expectErrorMessage() {
    await expect(this.page.getByText(/invalid|error|wrong/i)).toBeVisible();
  }
}

test.describe('Page Object Pattern Example', () => {
  test('login with page object', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('test@example.com', 'wrongpassword');
    await loginPage.expectErrorMessage();
  });
});
