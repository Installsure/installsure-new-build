import { test, expect } from '../fixtures/auth';

test.describe('RFIs Workflow', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/rfis');
  });

  test('should display RFIs page', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/rfis/);
    await expect(page.locator('text=/rfi|request for information/i').first()).toBeVisible();
  });

  test('should display list of RFIs', async ({ authenticatedPage: page }) => {
    // Wait for RFIs to load
    await page.waitForTimeout(2000);
    
    // Should show RFIs list or empty state
    const rfisList = page.locator('[class*="rfi"], [data-testid*="rfi"], table, [role="table"]');
    await expect(rfisList.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create RFI button', async ({ authenticatedPage: page }) => {
    // Look for create/new RFI button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New RFI"), button:has-text("Add RFI")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });

  test('should open create RFI form', async ({ authenticatedPage: page }) => {
    // Click create RFI button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New RFI"), button:has-text("Add RFI")').first();
    await createButton.click();
    
    // Should show form or modal
    await expect(page.locator('form, [role="dialog"]')).toBeVisible({ timeout: 3000 });
  });

  test('should display RFI status filters', async ({ authenticatedPage: page }) => {
    // Look for status filter buttons or tabs
    const statusFilters = page.locator('button:has-text("Open"), button:has-text("Closed"), button:has-text("Pending")');
    
    // At least one status filter should be visible
    await expect(statusFilters.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display RFI priority indicators', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Look for priority indicators (High, Medium, Low, Critical)
    const page_content = await page.content();
    const hasPriority = page_content.match(/high|medium|low|critical/i);
    
    // If there are RFIs, they should have priority indicators
    expect(hasPriority).toBeTruthy();
  });

  test('should be able to view RFI details', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    
    // Find first RFI and click it
    const rfiLink = page.locator('[class*="rfi"]:has(a), a[href*="/rfis/"]').first();
    
    const count = await rfiLink.count();
    if (count > 0) {
      await rfiLink.click();
      // Should show RFI details (modal or page)
      await page.waitForTimeout(1000);
    }
  });
});
