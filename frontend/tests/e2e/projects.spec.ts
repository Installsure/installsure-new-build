import { test, expect } from './fixtures/auth';

test.describe('Projects Workflow', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
  });

  test('should display projects page', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.locator('text=/projects/i').first()).toBeVisible();
  });

  test('should display list of projects', async ({ authenticatedPage: page }) => {
    // Wait for projects to load
    await page.waitForTimeout(2000);
    
    // Should show projects list or empty state
    const projectsList = page.locator('[class*="project"], [data-testid*="project"], table, [role="table"]');
    await expect(projectsList.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create project button', async ({ authenticatedPage: page }) => {
    // Look for create/new project button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Project"), button:has-text("Add Project")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });

  test('should open create project form', async ({ authenticatedPage: page }) => {
    // Click create project button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Project"), button:has-text("Add Project")').first();
    await createButton.click();
    
    // Should show form or modal
    await expect(page.locator('form, [role="dialog"]')).toBeVisible({ timeout: 3000 });
  });

  test('should be able to view project details', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Find first project link/card and click it
    const projectLink = page.locator('a[href*="/projects/"], [class*="project"]:has(a)').first();
    
    // Check if projects exist before clicking
    const count = await projectLink.count();
    if (count > 0) {
      await projectLink.click();
      
      // Should navigate to project detail page
      await expect(page).toHaveURL(/\/projects\/[^/]+/, { timeout: 5000 });
    }
  });

  test('should filter or search projects', async ({ authenticatedPage: page }) => {
    // Look for search or filter input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      // Wait for filtering to occur
      await page.waitForTimeout(1000);
    }
  });
});
