import { test, expect } from '../fixtures/auth';

test.describe('Calendar Workflow', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/calendar');
  });

  test('should display calendar page', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/calendar/);
    await expect(page.locator('text=/calendar/i').first()).toBeVisible();
  });

  test('should display calendar grid or view', async ({ authenticatedPage: page }) => {
    // Wait for calendar to load
    await page.waitForTimeout(2000);
    
    // Calendar component should be visible
    const calendar = page.locator('[class*="calendar"], [class*="rbc-calendar"], [role="grid"]');
    await expect(calendar.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create event button', async ({ authenticatedPage: page }) => {
    // Look for create/new event button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Event"), button:has-text("Add Event")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });

  test('should display calendar navigation controls', async ({ authenticatedPage: page }) => {
    // Look for previous/next month buttons
    const navButtons = page.locator('button[class*="nav"], button:has-text("Previous"), button:has-text("Next")');
    await expect(navButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display current month/date', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(1000);
    
    // Should display current date/month somewhere
    const page_content = await page.content();
    const currentYear = new Date().getFullYear().toString();
    
    expect(page_content).toContain(currentYear);
  });

  test('should have calendar view options', async ({ authenticatedPage: page }) => {
    // Look for view toggle buttons (Month, Week, Day, Agenda)
    const viewButtons = page.locator('button:has-text("Month"), button:has-text("Week"), button:has-text("Day"), button:has-text("Agenda")');
    
    const count = await viewButtons.count();
    if (count > 0) {
      await expect(viewButtons.first()).toBeVisible();
    }
  });

  test('should be able to click on calendar date', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Find a date cell and click it
    const dateCell = page.locator('[class*="date"], [class*="day"], [role="gridcell"]').first();
    
    if (await dateCell.isVisible()) {
      await dateCell.click();
      await page.waitForTimeout(500);
    }
  });
});
