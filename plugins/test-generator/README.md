# TestForge

Comprehensive test generation and analysis plugin for Claude Code that automates test creation, identifies coverage gaps, and improves test quality across your entire codebase.

## Purpose

TestForge solves the critical testing challenges developers face: writing comprehensive tests is time-consuming, coverage gaps are hard to identify, and test quality varies significantly. Research shows that projects with good test coverage have 40% fewer production bugs and 60% faster debugging cycles. TestForge automates test creation, ensures comprehensive coverage, and maintains high test quality standards.

## Features

- **Smart Unit Test Generation**: Auto-generate unit tests with comprehensive edge cases for any function or class
- **E2E Test Scenarios**: Create end-to-end test workflows that mirror real user journeys
- **Test Gap Analysis**: Identify untested code paths and missing test coverage
- **Test Data Factory**: Generate realistic test data, fixtures, and mocks
- **Test Quality Improvement**: Analyze and enhance existing tests with better assertions and coverage
- **Multi-Framework Support**: Works with Jest, Pytest, JUnit, Go testing, RSpec, and more
- **Edge Case Detection**: Automatically identifies and tests boundary conditions

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install TestForge:

```bash
/plugin install testforge
```

Or use the interactive browser:

```bash
/plugin
```

## Commands

Once installed, you can use the following slash commands in any Claude Code session:

### /generate-unit-tests

Generate comprehensive unit tests for functions, classes, or modules.

```
/generate-unit-tests src/utils/validation.ts
```

**What it does:**
- Analyzes function signatures and implementation logic
- Generates tests for happy paths and edge cases
- Creates test fixtures and mocks for dependencies
- Tests boundary conditions and error cases
- Generates tests in the appropriate framework (Jest, Pytest, JUnit, etc.)
- Includes descriptive test names and documentation

**Best for:**
- New code without tests
- Functions with complex logic requiring thorough testing
- Increasing test coverage quickly
- Ensuring edge cases are covered

**Example output:**
```javascript
// validation.test.ts
describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should return false for emails without @ symbol', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('should handle null and undefined inputs', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });

  // ... more test cases
});
```

### /generate-e2e-tests

Create end-to-end test scenarios for complete user workflows.

```
/generate-e2e-tests user registration flow
```

**What it does:**
- Maps out complete user journeys through the application
- Generates test scenarios covering all workflow steps
- Creates setup and teardown logic
- Tests success paths and failure scenarios
- Includes assertions for UI state, data persistence, and side effects
- Supports Playwright, Cypress, Selenium, and other E2E frameworks

**Best for:**
- Testing critical user flows
- Integration testing across multiple components
- Validating complete features
- Regression testing for major workflows

**Example usage:**
```
/generate-e2e-tests checkout process
/generate-e2e-tests user login and authentication
/generate-e2e-tests order management workflow
```

### /test-gap-analysis

Identify untested code paths and missing test coverage.

```
/test-gap-analysis
```

**What it does:**
- Scans codebase to identify all testable units
- Analyzes existing test files to determine coverage
- Identifies functions and classes without tests
- Detects untested error handling and edge cases
- Calculates coverage metrics by file and module
- Provides prioritized recommendations for test additions

**Best for:**
- Auditing test coverage quality
- Finding critical untested code
- Planning test improvement efforts
- Meeting coverage requirements
- Identifying testing blind spots

**Output includes:**
```
Test Coverage Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Coverage: 67%
Files Analyzed: 145
Functions Tested: 312 / 467

High Priority Gaps (0% coverage):
  ❌ src/payment/processor.ts (0/15 functions tested)
  ❌ src/auth/session-manager.ts (0/8 functions tested)

Medium Priority Gaps (<50% coverage):
  ⚠️  src/user/profile-service.ts (3/12 functions tested)
  ⚠️  src/cart/calculator.ts (5/11 functions tested)

Recommendations:
1. Add tests for payment processing logic (HIGH RISK)
2. Test authentication flows thoroughly
3. Increase coverage for business logic in profile service
```

### /test-data-factory

Generate realistic test data, fixtures, and mocks.

```
/test-data-factory User Order
```

**What it does:**
- Analyzes data models and schemas
- Generates realistic test data matching your domain
- Creates factory functions for generating test instances
- Builds mock data for API responses
- Generates fixtures for database seeding
- Creates test builders with fluent APIs

**Best for:**
- Setting up test data quickly
- Creating consistent test fixtures
- Mocking API responses
- Database seeding for tests
- Generating edge case data

**Example usage:**
```
/test-data-factory User
/test-data-factory Product Inventory
/test-data-factory Payment Transaction
```

**Example output:**
```typescript
// factories/user.factory.ts
export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  createdAt: faker.date.past(),
  ...overrides,
});

export const createUsers = (count: number) =>
  Array.from({ length: count }, () => createMockUser());
```

### /improve-test-quality

Analyze and improve existing tests with better assertions and coverage.

```
/improve-test-quality tests/services/user-service.test.ts
```

**What it does:**
- Reviews existing test files for quality issues
- Identifies weak or missing assertions
- Suggests additional test cases for edge conditions
- Improves test naming and organization
- Adds missing setup/teardown logic
- Refactors duplicate test code
- Ensures proper use of mocks and spies

**Best for:**
- Enhancing existing test suites
- Fixing flaky tests
- Improving test maintainability
- Strengthening assertions
- Code review preparation

**What it detects:**
- Missing or weak assertions
- Untested edge cases
- Poor test naming
- Duplicate test setup code
- Missing error case tests
- Improper mock usage
- Test interdependencies

## Typical Workflow

### For New Projects:

1. **Set up test data factories**:
   ```
   /test-data-factory User Product Order
   ```

2. **Generate unit tests for core logic**:
   ```
   /generate-unit-tests src/services/
   ```

3. **Create E2E tests for critical flows**:
   ```
   /generate-e2e-tests user registration
   /generate-e2e-tests checkout process
   ```

4. **Verify coverage**:
   ```
   /test-gap-analysis
   ```

### For Existing Projects:

1. **Audit current test coverage**:
   ```
   /test-gap-analysis
   ```

2. **Generate tests for high-priority gaps**:
   ```
   /generate-unit-tests src/payment/processor.ts
   ```

3. **Improve existing test quality**:
   ```
   /improve-test-quality tests/services/user-service.test.ts
   ```

4. **Add E2E tests for critical workflows**:
   ```
   /generate-e2e-tests checkout flow
   ```

### Regular Maintenance:

Run weekly or before major releases:

```
/test-gap-analysis
```

This identifies new untested code and provides a prioritized list of test additions needed.

## Framework Support

TestForge automatically detects and generates tests for:

### JavaScript/TypeScript
- **Jest** - Full support with mocks, spies, and snapshots
- **Vitest** - Modern, fast unit testing
- **Mocha** - Flexible testing framework
- **Jasmine** - BDD-style testing
- **Playwright** - E2E testing
- **Cypress** - Modern E2E testing

### Python
- **pytest** - Modern Python testing with fixtures
- **unittest** - Standard library testing
- **nose2** - Extended unit testing

### Java
- **JUnit 5** - Modern Java testing
- **JUnit 4** - Legacy support
- **TestNG** - Advanced testing framework
- **Mockito** - Mocking framework

### Go
- **testing** - Standard library testing
- **testify** - Extended assertions and mocks

### Ruby
- **RSpec** - BDD-style testing
- **Minitest** - Ruby standard testing

### Other Languages
- **C#**: xUnit, NUnit, MSTest
- **PHP**: PHPUnit
- **Rust**: Built-in test framework
- **Swift**: XCTest

## Testing Best Practices

TestForge follows industry best practices:

- **AAA Pattern**: Arrange, Act, Assert structure
- **Descriptive Names**: Clear test names that explain what is being tested
- **Edge Cases**: Comprehensive boundary condition testing
- **Error Handling**: Tests for failure scenarios
- **Independence**: Tests don't depend on each other
- **Fast Execution**: Efficient tests that run quickly
- **Maintainability**: DRY principles with shared fixtures

## Plugin Structure

```
testforge/
├── commands/
│   ├── generate-unit-tests.md      # Generate unit tests
│   ├── generate-e2e-tests.md       # Generate E2E tests
│   ├── test-gap-analysis.md        # Identify coverage gaps
│   ├── test-data-factory.md        # Generate test data
│   └── improve-test-quality.md     # Improve existing tests
└── README.md                        # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins feature
- Testing framework installed in your project (Jest, Pytest, etc.)

## Best Practices

### When to Use Each Command:

- **Starting a new feature**: `/generate-unit-tests` as you write code
- **Building a new workflow**: `/generate-e2e-tests` for the complete flow
- **Before a release**: `/test-gap-analysis` to ensure coverage
- **Need test data**: `/test-data-factory` for models and fixtures
- **Code review prep**: `/improve-test-quality` on modified tests
- **Legacy code**: `/test-gap-analysis` → `/generate-unit-tests` for gaps

### Testing Tips:

1. **Test as you code**: Generate tests immediately after writing functions
2. **Cover edge cases**: Don't just test happy paths
3. **Use realistic data**: Generate test data that matches production
4. **Keep tests fast**: Mock external dependencies
5. **Run tests frequently**: Integrate with CI/CD
6. **Maintain test quality**: Regularly run `/improve-test-quality`

## Real-World Scenarios

### Scenario 1: "We need to increase test coverage before the release"

**Problem**: Coverage is at 45%, need to reach 80% quickly.

**Solution**:
```
/test-gap-analysis
/generate-unit-tests [high-priority-files]
```

**Result**: Systematic identification and testing of gaps, reaching coverage goals efficiently.

---

### Scenario 2: "I wrote a complex validation function and need comprehensive tests"

**Problem**: Need to test all edge cases and error conditions.

**Solution**:
```
/generate-unit-tests src/utils/validator.ts
```

**Result**: Complete test suite covering happy paths, edge cases, and error conditions.

---

### Scenario 3: "Our tests are flaky and hard to maintain"

**Problem**: Existing tests fail intermittently and have poor assertions.

**Solution**:
```
/improve-test-quality tests/services/
```

**Result**: Refactored tests with better assertions, proper mocks, and improved reliability.

---

### Scenario 4: "Need to test the entire checkout workflow"

**Problem**: Complex multi-step process needs end-to-end testing.

**Solution**:
```
/generate-e2e-tests checkout workflow
```

**Result**: Complete E2E test suite covering all checkout scenarios and edge cases.

---

### Scenario 5: "Setting up test data is tedious and time-consuming"

**Problem**: Manually creating test fixtures for every test.

**Solution**:
```
/test-data-factory User Order Product
```

**Result**: Reusable factories that generate realistic test data instantly.

## What Makes TestForge Different

### vs. Manual Testing
- **Manual**: Hours to write comprehensive tests
- **TestForge**: Minutes to generate complete test suites

### vs. Code Coverage Tools
- **Coverage Tools**: Tell you what's not tested
- **TestForge**: Identifies gaps AND generates the missing tests

### vs. AI Copilots
- **Copilots**: Suggest individual tests as you type
- **TestForge**: Analyzes entire codebase and generates comprehensive test strategies

### vs. Test Generators
- **Basic Generators**: Create simple test stubs
- **TestForge**: Generates complete tests with edge cases, mocks, and realistic data

## Troubleshooting

### "Generated tests don't match my testing framework"
TestForge auto-detects frameworks from package.json, go.mod, requirements.txt, etc. Ensure your testing framework is properly configured in your project.

### "Tests are too basic"
Use `/improve-test-quality` to enhance generated tests, or provide specific requirements when generating.

### "Missing edge cases"
Review the generated tests and run `/generate-unit-tests` with specific edge cases mentioned.

### "Test data doesn't match my domain"
Edit the generated factories to match your domain requirements. TestForge provides a starting point.

## Contributing

Contributions are welcome! To improve TestForge:

1. Fork the repository
2. Create a feature branch
3. Make your changes to command files in `commands/`
4. Test with various testing frameworks
5. Submit a pull request

### Command Development:

Commands are markdown files with:
- **Frontmatter**: Metadata (description, arguments)
- **Instructions**: Detailed prompt for Claude Code to execute

See existing commands for examples.

## License

MIT

## Version

1.0.0

## Acknowledgments

Built for developers who value comprehensive testing but find test writing time-consuming. Inspired by the common challenge that testing takes 40-60% of development time, yet many projects have insufficient coverage.

---

**Stop writing tests manually. Let TestForge automate it.**

Made with precision for the Claude Code community
