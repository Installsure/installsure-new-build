import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/InstallSure/i);
});

test('redirects to login page when not authenticated', async ({ page }) => {
  await page.goto('/');
  
  // Should redirect to /login since user is not authenticated
  await expect(page).toHaveURL(/.*login/);
});

test('login page has form elements', async ({ page }) => {
  await page.goto('/login');
  
  // Check for login form elements
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
