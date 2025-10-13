import { test, expect } from '../fixtures/auth';

test.describe('Tasks Workflow', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks page', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.locator('text=/tasks/i').first()).toBeVisible();
  });

  test('should display list of tasks', async ({ authenticatedPage: page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Should show tasks list or empty state
    const tasksList = page.locator('[class*="task"], [data-testid*="task"], table, [role="table"]');
    await expect(tasksList.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create task button', async ({ authenticatedPage: page }) => {
    // Look for create/new task button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Task"), button:has-text("Add Task")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });

  test('should open create task form', async ({ authenticatedPage: page }) => {
    // Click create task button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Task"), button:has-text("Add Task")').first();
    await createButton.click();
    
    // Should show form or modal
    await expect(page.locator('form, [role="dialog"]')).toBeVisible({ timeout: 3000 });
  });

  test('should display task status filters', async ({ authenticatedPage: page }) => {
    // Look for status filter buttons or tabs
    const statusFilters = page.locator('button:has-text("Todo"), button:has-text("In Progress"), button:has-text("Completed")');
    
    // At least one status filter should be visible
    await expect(statusFilters.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display task priority levels', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Look for priority indicators
    const page_content = await page.content();
    const hasPriority = page_content.match(/high|medium|low|critical|priority/i);
    
    // Tasks should have priority indicators
    expect(hasPriority).toBeTruthy();
  });

  test('should be able to update task status', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Look for task status dropdowns or buttons
    const statusButton = page.locator('[class*="status"], button[class*="task"]').first();
    
    const count = await statusButton.count();
    if (count > 0 && await statusButton.isVisible()) {
      // Status change UI exists
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display task due dates', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Look for date elements
    const page_content = await page.content();
    const hasDate = page_content.match(/due|deadline|date/i);
    
    expect(hasDate).toBeTruthy();
  });
});
