# InstallSure E2E Tests

This directory contains end-to-end tests for all InstallSure workflows using Playwright.

## Test Coverage

The E2E test suite covers the following workflows:

### 1. Authentication (`auth.spec.ts`)
- Display login page
- Login with valid credentials
- Show error with invalid credentials
- Navigate to register page
- Display register page
- Logout successfully

### 2. Dashboard (`dashboard.spec.ts`)
- Display dashboard after login
- Display project statistics
- Working navigation links
- Navigate to projects from dashboard
- Display recent activity or projects

### 3. Projects (`projects.spec.ts`)
- Display projects page
- Display list of projects
- Create project button
- Open create project form
- View project details
- Filter or search projects

### 4. RFIs (`rfis.spec.ts`)
- Display RFIs page
- Display list of RFIs
- Create RFI button
- Open create RFI form
- Display RFI status filters
- Display RFI priority indicators
- View RFI details

### 5. Tasks (`tasks.spec.ts`)
- Display tasks page
- Display list of tasks
- Create task button
- Open create task form
- Display task status filters
- Display task priority levels
- Update task status
- Display task due dates

### 6. Calendar (`calendar.spec.ts`)
- Display calendar page
- Display calendar grid or view
- Create event button
- Display calendar navigation controls
- Display current month/date
- Calendar view options
- Click on calendar date

### 7. Files (`files.spec.ts`)
- Display files page
- Display files list or grid
- Upload button
- Display file types or categories
- Display file metadata
- Search or filter files
- File actions menu

### 8. Settings (`settings.spec.ts`)
- Display settings page
- Display user profile section
- Display integration status
- Display environment configuration
- Display feature flags or toggles
- Settings sections or tabs
- Display API or connection status

### 9. Navigation (`navigation.spec.ts`)
- Navigate to all main pages from dashboard
- Consistent navigation bar across pages
- Display user info in navigation
- Working breadcrumbs or page titles
- Handle direct URL navigation

## Running Tests

### Prerequisites
Make sure you have installed dependencies:
```bash
cd frontend
npm install
```

### Install Playwright Browsers
```bash
npx playwright install
```

Or install only Chromium for faster setup:
```bash
npx playwright install chromium
```

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Debug Tests
```bash
npx playwright test --debug
```

### View Test Report
After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Test Configuration

The test configuration is defined in `playwright.config.ts` at the project root. Key settings:

- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Web Server**: Automatically starts dev server before tests
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

## Writing New Tests

### Using Authentication Fixture

Most tests require authentication. Use the `authenticatedPage` fixture:

```typescript
import { test, expect } from '../fixtures/auth';

test('my test', async ({ authenticatedPage: page }) => {
  await page.goto('/my-page');
  // Your test code here
});
```

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('button.my-button');
    
    // Act
    await button.click();
    
    // Assert
    await expect(page).toHaveURL(/\/success/);
  });
});
```

## CI/CD Integration

The tests are integrated into the main test script (`scripts/test.ps1`) and will:
1. Install dependencies
2. Install Playwright browsers
3. Run component tests
4. Run E2E tests
5. Generate coverage reports

## Troubleshooting

### Tests Failing to Start
- Ensure dev server is not already running on port 5173
- Check that all dependencies are installed
- Verify Playwright browsers are installed

### Authentication Tests Failing
- Verify backend is running and seeded with demo data
- Check demo credentials: `owner@example.com` / `demo123`
- Ensure database is properly initialized

### Timeouts
- Increase timeout in test config if needed
- Check that services (backend, database) are running
- Verify network connectivity

## Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Wait for elements** before interacting with them
3. **Keep tests independent** - each test should work in isolation
4. **Use fixtures** for common setup (like authentication)
5. **Avoid hardcoded waits** - use `waitForSelector` instead of `waitForTimeout` when possible
6. **Clean up after tests** - though fixtures handle most cleanup automatically
