---
description: Generate end-to-end test scenarios for complete user workflows and features
argument-hint: [workflow-name or feature]
model: inherit
---

# End-to-End Test Generation Command

You are tasked with generating comprehensive end-to-end (E2E) tests for complete user workflows. These tests should simulate real user interactions and verify that the entire system works correctly from start to finish.

## Step 1: Identify the Workflow

**If the user provided a workflow name or feature:**
- Understand the complete user journey
- Identify all steps in the workflow
- Map out the UI interactions, API calls, and data changes

**If no specific workflow is provided:**
- Ask the user which workflow or feature they want to test
- Suggest critical workflows: authentication, checkout, user registration, data submission, etc.
- Provide examples from the codebase if identifiable

**Common workflows to consider:**
- User registration and onboarding
- Login and authentication
- Shopping cart and checkout
- Content creation and publishing
- Search and filtering
- Form submission
- Multi-step wizards
- CRUD operations (Create, Read, Update, Delete)

## Step 2: Detect E2E Testing Framework

Identify the E2E testing framework from the project:

### JavaScript/TypeScript
- **Playwright**: Modern, cross-browser testing (check for @playwright/test)
- **Cypress**: Developer-friendly E2E framework (check for cypress)
- **Selenium WebDriver**: Classic browser automation
- **Puppeteer**: Chrome-specific automation
- **TestCafe**: No WebDriver browser testing

### Python
- **Playwright for Python**: Cross-browser testing
- **Selenium**: Standard browser automation
- **Behave**: BDD-style testing

### Java
- **Selenium WebDriver**: Browser automation
- **Selenide**: Simplified Selenium wrapper

### Check project files:
- `package.json`, `requirements.txt`, `pom.xml`, `build.gradle`
- Existing test directories and test files
- Default to Playwright if not specified (modern standard)

## Step 3: Map the Complete Workflow

For the identified workflow, document:

### User Journey Steps
1. **Starting Point**: Where does the user begin?
2. **Actions**: What does the user do at each step?
3. **Navigation**: How do they move between pages/screens?
4. **Inputs**: What data do they enter?
5. **Validations**: What feedback do they receive?
6. **Completion**: What is the success state?

### System Interactions
- API calls triggered by user actions
- Database changes
- State updates
- Side effects (emails, notifications, etc.)
- External service calls

### Success Criteria
- What indicates successful completion?
- What data should exist after completion?
- What UI changes should occur?

## Step 4: Identify Test Scenarios

Generate E2E tests for these scenarios:

### Happy Path Scenarios
- Complete workflow with valid inputs
- Typical user behavior
- Most common path through the system

### Alternative Paths
- Different ways to complete the same workflow
- Optional steps or features
- Various input combinations

### Error Scenarios
- Invalid inputs at each step
- Network failures
- Server errors (400, 500 responses)
- Timeout scenarios
- Permission denied cases

### Edge Cases
- Minimum/maximum input values
- Special characters in inputs
- Very long or short inputs
- Concurrent user actions
- Browser back/forward navigation

### State Verification
- Verify data persistence after each step
- Check UI state updates
- Confirm side effects occurred
- Validate navigation history

## Step 5: Generate E2E Test Structure

Create comprehensive E2E tests following best practices:

### For Playwright:

```javascript
import { test, expect } from '@playwright/test';

test.describe('User Registration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to starting point
    await page.goto('/register');

    // Clear any existing state
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete registration with valid information', async ({ page }) => {
    // Step 1: Fill registration form
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');

    // Step 2: Accept terms
    await page.check('[name="acceptTerms"]');

    // Step 3: Submit form
    await page.click('button[type="submit"]');

    // Step 4: Wait for navigation to confirmation page
    await expect(page).toHaveURL(/.*\/registration-success/);

    // Step 5: Verify success message
    await expect(page.locator('text=Welcome, John!')).toBeVisible();

    // Step 6: Verify email confirmation message
    await expect(page.locator('text=confirmation email')).toBeVisible();

    // Step 7: Verify user can access their account
    await page.goto('/profile');
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('John Doe');
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Should show error and stay on page
    await expect(page.locator('text=valid email address')).toBeVisible();
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('should prevent submission without accepting terms', async ({ page }) => {
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    // Don't check terms
    await page.click('button[type="submit"]');

    await expect(page.locator('text=accept terms')).toBeVisible();
  });

  test('should handle server error gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/register', route =>
      route.fulfill({ status: 500, body: 'Server Error' })
    );

    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Something went wrong')).toBeVisible();
  });
});

test.describe('Shopping Cart Checkout Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login and add items to cart
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.goto('/products');
    await page.click('[data-testid="add-to-cart-1"]');
    await page.click('[data-testid="add-to-cart-2"]');
  });

  test('should complete checkout process', async ({ page }) => {
    // Step 1: Navigate to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL(/.*\/cart/);

    // Step 2: Verify cart items
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);

    // Step 3: Proceed to checkout
    await page.click('button:has-text("Checkout")');

    // Step 4: Fill shipping information
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="city"]', 'San Francisco');
    await page.fill('[name="zipCode"]', '94102');
    await page.click('button:has-text("Continue")');

    // Step 5: Fill payment information
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvv"]', '123');

    // Step 6: Review and place order
    await page.click('button:has-text("Place Order")');

    // Step 7: Verify order confirmation
    await expect(page).toHaveURL(/.*\/order-confirmation/);
    await expect(page.locator('text=Order Placed Successfully')).toBeVisible();

    // Step 8: Verify order number is displayed
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
    expect(orderNumber).toMatch(/^ORD-\d+$/);

    // Step 9: Verify cart is now empty
    await page.goto('/cart');
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });

  test('should save cart state on page refresh', async ({ page }) => {
    await page.goto('/cart');
    const itemCount = await page.locator('[data-testid="cart-item"]').count();

    await page.reload();

    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(itemCount);
  });
});
```

### For Cypress:

```javascript
describe('User Login Workflow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should login successfully with valid credentials', () => {
    // Step 1: Enter credentials
    cy.get('[name="email"]').type('user@example.com');
    cy.get('[name="password"]').type('SecurePass123!');

    // Step 2: Submit form
    cy.get('button[type="submit"]').click();

    // Step 3: Verify redirect to dashboard
    cy.url().should('include', '/dashboard');

    // Step 4: Verify user is logged in
    cy.get('[data-testid="user-menu"]').should('contain', 'user@example.com');

    // Step 5: Verify auth token is stored
    cy.window().its('localStorage.authToken').should('exist');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[name="email"]').type('user@example.com');
    cy.get('[name="password"]').type('WrongPassword');
    cy.get('button[type="submit"]').click();

    cy.get('.error-message').should('be.visible')
      .and('contain', 'Invalid credentials');
    cy.url().should('include', '/login');
  });

  it('should persist login state after page refresh', () => {
    // Login
    cy.get('[name="email"]').type('user@example.com');
    cy.get('[name="password"]').type('SecurePass123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // Refresh page
    cy.reload();

    // Should still be logged in
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
});
```

### For Python/Playwright:

```python
import pytest
from playwright.sync_api import Page, expect

def test_user_registration_workflow(page: Page):
    """Should complete user registration successfully."""
    # Step 1: Navigate to registration page
    page.goto('/register')

    # Step 2: Fill registration form
    page.fill('[name="email"]', 'user@example.com')
    page.fill('[name="password"]', 'SecurePass123!')
    page.fill('[name="confirmPassword"]', 'SecurePass123!')
    page.fill('[name="firstName"]', 'John')
    page.fill('[name="lastName"]', 'Doe')

    # Step 3: Accept terms
    page.check('[name="acceptTerms"]')

    # Step 4: Submit form
    page.click('button[type="submit"]')

    # Step 5: Verify success
    expect(page).to_have_url(re.compile(r'.*/registration-success'))
    expect(page.locator('text=Welcome, John!')).to_be_visible()

def test_checkout_workflow(page: Page):
    """Should complete checkout process successfully."""
    # Setup: Login and add items
    login(page)
    add_items_to_cart(page, item_ids=['1', '2'])

    # Navigate to cart
    page.click('[data-testid="cart-icon"]')
    expect(page).to_have_url(re.compile(r'.*/cart'))

    # Proceed through checkout
    page.click('button:has-text("Checkout")')

    # Fill shipping info
    page.fill('[name="address"]', '123 Main St')
    page.fill('[name="city"]', 'San Francisco')
    page.click('button:has-text("Continue")')

    # Fill payment info
    page.fill('[name="cardNumber"]', '4242424242424242')
    page.click('button:has-text("Place Order")')

    # Verify order confirmation
    expect(page.locator('text=Order Placed Successfully')).to_be_visible()

# Helper functions
def login(page: Page, email='test@example.com', password='TestPass123!'):
    """Helper to login user."""
    page.goto('/login')
    page.fill('[name="email"]', email)
    page.fill('[name="password"]', password)
    page.click('button[type="submit"]')

def add_items_to_cart(page: Page, item_ids):
    """Helper to add items to cart."""
    page.goto('/products')
    for item_id in item_ids:
        page.click(f'[data-testid="add-to-cart-{item_id}"]')
```

## Step 6: Add Test Utilities and Helpers

Create reusable helper functions:

```javascript
// test-helpers.js
export async function loginAs(page, role = 'user') {
  const credentials = {
    user: { email: 'user@test.com', password: 'UserPass123!' },
    admin: { email: 'admin@test.com', password: 'AdminPass123!' }
  };

  await page.goto('/login');
  await page.fill('[name="email"]', credentials[role].email);
  await page.fill('[name="password"]', credentials[role].password);
  await page.click('button[type="submit"]');
}

export async function addToCart(page, productId) {
  await page.goto(`/product/${productId}`);
  await page.click('[data-testid="add-to-cart"]');
}

export async function fillShippingAddress(page, address) {
  await page.fill('[name="address"]', address.street);
  await page.fill('[name="city"]', address.city);
  await page.fill('[name="zipCode"]', address.zipCode);
  await page.selectOption('[name="country"]', address.country);
}
```

## Step 7: Add Visual and Accessibility Testing

Include visual regression and accessibility checks:

```javascript
test('should render checkout page correctly', async ({ page }) => {
  await page.goto('/checkout');

  // Visual regression test (if configured)
  await expect(page).toHaveScreenshot('checkout-page.png');

  // Accessibility test
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Step 8: Add API Response Validation

Verify API calls made during the workflow:

```javascript
test('should make correct API calls during checkout', async ({ page }) => {
  // Intercept API calls
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON()
      });
    }
  });

  // Perform checkout
  await performCheckout(page);

  // Verify API calls
  expect(apiCalls).toContainEqual(
    expect.objectContaining({
      url: expect.stringContaining('/api/orders'),
      method: 'POST'
    })
  );
});
```

## Step 9: Create Test Configuration

Generate appropriate test configuration:

### Playwright Config:
```javascript
// playwright.config.js
export default {
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],
};
```

## Step 10: Summary Report

Provide a comprehensive summary:

```
🎭 E2E Test Generation Complete

Workflow: [workflow name]
Framework: [Playwright/Cypress/Selenium]
Test File: [path to test file]

Test Scenarios Generated: [count]
├─ Happy Path: [count]
├─ Error Scenarios: [count]
├─ Edge Cases: [count]
└─ Alternative Paths: [count]

Workflow Coverage:
✅ Complete user journey tested
✅ All UI interactions covered
✅ Form validations verified
✅ API calls validated
✅ State persistence tested
✅ Error handling verified

Test Files Created:
- [test-file.spec.ts] - Main workflow tests
- [test-helpers.ts] - Reusable utilities

Next Steps:
1. Run tests: [command to run tests]
2. Run in different browsers if needed
3. Add visual regression if desired
4. Integrate with CI/CD pipeline
```

## Important Guidelines

### DO:
- Test complete user journeys from start to finish
- Verify both UI state and data persistence
- Test error scenarios and edge cases
- Create reusable helper functions
- Use descriptive test names
- Add waits for async operations
- Clean up state between tests
- Test across different browsers/devices

### DON'T:
- Don't test implementation details
- Don't create overly long tests (split complex workflows)
- Don't hardcode timing waits (use proper waiting strategies)
- Don't skip error scenario testing
- Don't forget to clean up test data
- Don't test unit logic in E2E tests
- Don't make tests dependent on each other

## Error Handling

If you encounter issues:

- **Workflow unclear**: Ask user to describe the step-by-step process
- **No E2E framework**: Suggest installing Playwright (modern standard)
- **Complex workflow**: Break into multiple test files
- **Authentication required**: Create helper functions for login/setup

---

Begin by understanding the complete user workflow and systematically generating comprehensive E2E test coverage.
