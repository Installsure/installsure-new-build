# Quick Guide: Running E2E Tests

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **Backend and Database** running (for full integration tests)
3. **Demo data seeded** in the database

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Install Playwright Browsers
```bash
# Install all browsers (Chromium, Firefox, WebKit)
npx playwright install

# OR install only Chromium for faster setup
npx playwright install chromium
```

### 3. Run Tests

#### Option A: Run All Tests (Default)
```bash
npm run test:e2e
```

#### Option B: Run Tests in UI Mode (Recommended for Development)
```bash
npx playwright test --ui
```
This opens an interactive UI where you can:
- Select which tests to run
- Watch tests execute in real-time
- See detailed step-by-step execution
- Debug failing tests

#### Option C: Run Tests in Headed Mode (See the Browser)
```bash
npx playwright test --headed
```

#### Option D: Run Specific Test File
```bash
# Authentication tests only
npx playwright test tests/e2e/auth.spec.ts

# Projects workflow tests only
npx playwright test tests/e2e/projects.spec.ts

# Navigation tests only
npx playwright test tests/e2e/navigation.spec.ts
```

#### Option E: Run Tests on Specific Browser
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit only
npx playwright test --project=webkit
```

### 4. View Test Results
```bash
# View the HTML report
npx playwright show-report
```

## Using the Complete Test Script

The `scripts/test.ps1` script runs all tests (backend, BIM, frontend, E2E):

```powershell
# Windows PowerShell
.\scripts\test.ps1
```

This will:
1. ✅ Test backend (unit, integration, API tests)
2. ✅ Test BIM service (Python tests)
3. ✅ Install Playwright browsers
4. ✅ Test frontend (component tests)
5. ✅ Run E2E tests (all workflows)
6. ✅ Generate coverage reports

## Common Commands

```bash
# Debug a specific test
npx playwright test --debug tests/e2e/auth.spec.ts

# Run tests in parallel on multiple workers
npx playwright test --workers=4

# Run tests with full trace (for debugging)
npx playwright test --trace on

# Update snapshots (if using visual regression)
npx playwright test --update-snapshots

# Show browser DevTools during test
npx playwright test --headed --debug

# Run only failed tests from last run
npx playwright test --last-failed

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests with a specific timeout
npx playwright test --timeout=60000
```

## Debugging Failed Tests

### 1. View Failure Details
After test failures, check the HTML report:
```bash
npx playwright show-report
```

### 2. View Screenshots
Failed tests automatically capture screenshots:
```
test-results/<test-name>/test-failed-1.png
```

### 3. View Traces
Traces are captured on first retry:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### 4. Run in Debug Mode
```bash
npx playwright test --debug tests/e2e/auth.spec.ts
```
This opens Playwright Inspector where you can:
- Step through each action
- Inspect element selectors
- View console logs
- Pause and resume execution

## Test Environment Setup

### Required Services
Ensure these services are running before tests:

1. **Backend API** (Port 8080)
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend Dev Server** (Port 5173)
   - Automatically started by Playwright if not running
   - Or start manually:
     ```bash
     cd frontend
     npm run dev
     ```

3. **Database** (PostgreSQL)
   - Should be running and seeded with demo data
   - Run migration and seed:
     ```bash
     cd backend
     npx prisma migrate dev
     npx prisma db seed
     ```

4. **Redis** (Optional, for BIM caching)

### Demo Account
Tests use this account (must exist in database):
- Email: `owner@example.com`
- Password: `demo123`

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Install Playwright browsers
        run: |
          cd frontend
          npx playwright install --with-deps chromium
      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Troubleshooting

### Tests Timeout
**Problem**: Tests fail with timeout errors
**Solution**: 
- Increase timeout in `playwright.config.ts`
- Check that backend services are running
- Ensure database is accessible

### Cannot Find Elements
**Problem**: Element selectors not working
**Solution**:
- Run in debug mode: `npx playwright test --debug`
- Use Playwright Inspector to check selectors
- Update selectors to match actual DOM

### Authentication Fails
**Problem**: Login tests fail
**Solution**:
- Verify backend is running and accessible
- Check database has demo user seeded
- Verify credentials: `owner@example.com` / `demo123`
- Check backend logs for errors

### Browser Not Installed
**Problem**: "Executable doesn't exist" error
**Solution**:
```bash
npx playwright install chromium
```

### Port Already in Use
**Problem**: Port 5173 already in use
**Solution**:
- Stop other Vite dev servers
- Or change port in `playwright.config.ts`:
  ```typescript
  baseURL: 'http://localhost:3000',
  webServer: {
    command: 'npm run dev -- --port 3000',
    url: 'http://localhost:3000',
  }
  ```

## Best Practices

1. **Run tests frequently** during development
2. **Use UI mode** for debugging and test development
3. **Keep tests independent** - each test should work in isolation
4. **Use data-testid** attributes for reliable selectors
5. **Avoid hard-coded waits** - use `waitForSelector` instead
6. **Check test reports** after failures for screenshots and traces
7. **Run full suite** before committing changes

## Performance Tips

1. **Run specific tests** during development
2. **Use chromium only** for faster feedback
3. **Disable parallel execution** if needed:
   ```bash
   npx playwright test --workers=1
   ```
4. **Skip expensive tests** during development:
   ```typescript
   test.skip('expensive test', async ({ page }) => {
     // Test code
   });
   ```

## Need Help?

- 📚 [Playwright Documentation](https://playwright.dev/docs/intro)
- 📖 [E2E Test README](frontend/tests/e2e/README.md)
- 📋 [Test Summary](E2E_TEST_SUMMARY.md)
- 🐛 [Report Issues](https://github.com/Installsure/installsure-new-build/issues)
