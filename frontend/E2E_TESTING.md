# End-to-End Testing with Playwright

## Overview
This project uses Playwright for end-to-end (E2E) testing of the React frontend application.

## Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
cd frontend
npm install
```

### Browser Installation (Optional)
The Playwright configuration is set to use the system's Chrome browser, so installing Playwright browsers is optional. However, if you want to install them:

```bash
npx playwright install
```

**Note**: In some environments, `npx playwright install` may encounter download issues. The tests will work fine without it since we're using system Chrome.

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests with detailed output
```bash
npm run test:e2e -- --reporter=list
```

### Run tests in UI mode (interactive)
```bash
npx playwright test --ui
```

### Run specific test file
```bash
npx playwright test e2e/example.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

## Test Structure

### Test Files
- `e2e/example.spec.ts` - Basic tests for homepage and login functionality
- `e2e/navigation.spec.ts` - Navigation and authentication flow tests

### Configuration
- `playwright.config.ts` - Main Playwright configuration
  - Base URL: http://localhost:3000
  - Browser: Chromium (using system Chrome)
  - Test directory: `./e2e`
  - Automatic dev server startup

## Current Test Coverage

### Example Tests (example.spec.ts)
1. ✅ Homepage has title
2. ✅ Redirects to login page when not authenticated
3. ✅ Login page has form elements

### Navigation Tests (navigation.spec.ts)
1. ✅ Should have proper document structure
2. ✅ Should redirect to login for unauthenticated users
3. ✅ Should have accessible login form
4. ✅ Should have register link on login page

## Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('test description', async ({ page }) => {
  // Navigate to page
  await page.goto('/');
  
  // Perform actions and assertions
  await expect(page).toHaveTitle(/ExpectedTitle/);
});
```

### Test with Describe Block
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Test implementation
  });
  
  test('should do something else', async ({ page }) => {
    // Test implementation
  });
});
```

## Best Practices

1. **Use Descriptive Test Names**: Make test names clear and descriptive
2. **Wait for Elements**: Use `await expect(element).toBeVisible()` instead of arbitrary waits
3. **Use Page Object Model**: For complex pages, consider using the Page Object Model pattern
4. **Accessibility**: Use accessible selectors like `getByRole`, `getByLabel` when possible
5. **Cleanup**: Tests are isolated - each test starts with a fresh browser context

## Troubleshooting

### Tests Fail to Start Dev Server
- Ensure port 3000 is not already in use
- Check that `npm run dev` works standalone

### Browser Launch Issues
- The config uses system Chrome, ensure Chrome/Chromium is installed
- Try running `google-chrome --version` to verify

### Test Timeouts
- Increase timeout in playwright.config.ts if needed
- Use `page.waitForLoadState('networkidle')` for slow-loading pages

## CI/CD Integration

The configuration is set up for CI environments:
- Retries: 2 (in CI)
- Workers: 1 (in CI)
- forbidOnly: true (in CI)

For GitHub Actions or other CI systems, set the `CI` environment variable.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Test Generator](https://playwright.dev/docs/codegen)
