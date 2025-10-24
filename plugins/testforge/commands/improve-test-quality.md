---
description: Analyze and improve existing test quality with better assertions, coverage, and maintainability
argument-hint: [test-file-path]
model: inherit
---

# Test Quality Improvement Command

You are tasked with analyzing existing test files and improving their quality. Good tests are clear, comprehensive, maintainable, and reliable. This command identifies issues and makes concrete improvements.

## Step 1: Identify Target Test Files

**If the user provided a test file path:**
- Read and analyze the specified test file(s)
- If a directory is provided, analyze all test files within it

**If no specific target is provided:**
- Ask the user which test file they want to improve
- Suggest recently modified test files
- Show test files with known issues (flaky, commented, skipped)

## Step 2: Analyze Current Test Quality

Perform a comprehensive quality assessment:

### Test Structure Analysis
- **Organization**: Are tests logically grouped?
- **Naming**: Are test names descriptive and consistent?
- **Setup/Teardown**: Is setup code properly organized?
- **Independence**: Do tests depend on each other?
- **Length**: Are tests too long or too short?

### Coverage Analysis
- **Happy Paths**: Are normal scenarios tested?
- **Edge Cases**: Are boundary conditions tested?
- **Error Paths**: Are error scenarios tested?
- **All Code Paths**: Are all branches covered?

### Assertion Quality
- **Specificity**: Are assertions precise?
- **Completeness**: Are all important aspects verified?
- **Error Messages**: Are assertion messages clear?
- **Assertion Count**: Too few or too many?

### Code Quality Issues
- **Duplication**: Repeated setup or test code
- **Magic Values**: Hardcoded values without context
- **Unclear Intent**: Tests that are hard to understand
- **Flakiness**: Tests with timing issues or randomness
- **Commented Code**: Disabled or commented tests

### Mock/Stub Quality
- **Proper Isolation**: Are dependencies properly mocked?
- **Realistic Mocks**: Do mocks represent real behavior?
- **Mock Verification**: Are mock calls verified?
- **Mock Cleanup**: Are mocks reset between tests?

## Step 3: Identify Specific Issues

Create a detailed list of problems:

### Critical Issues (Must Fix)
- Tests that always pass (no assertions)
- Tests that are skipped or commented out
- Tests with race conditions or flakiness
- Tests modifying global state
- Tests depending on execution order
- Tests hitting real external services

### High Priority Issues
- Missing error case tests
- Weak or generic assertions
- Missing edge case tests
- Poor test names
- Large amounts of duplicated code
- Missing mock verifications

### Medium Priority Issues
- Tests that are too long
- Missing test documentation
- Inconsistent naming conventions
- Setup code that could be refactored
- Magic numbers or strings
- Missing arrange-act-assert separation

### Low Priority Issues
- Minor naming improvements
- Opportunities for test helper functions
- Documentation that could be enhanced

## Step 4: Generate Improvement Recommendations

For each issue, provide:

### Problem Description
- What is wrong
- Why it's a problem
- Impact on test quality

### Recommended Solution
- Specific code changes
- Best practice to follow
- Example of improved code

### Before/After Examples
Show the improvement clearly

## Step 5: Improve Test Structure

### Organize Tests with Describe Blocks

**Before:**
```javascript
test('user creation works', () => {});
test('user creation fails with invalid email', () => {});
test('user update works', () => {});
test('user deletion works', () => {});
```

**After:**
```javascript
describe('User Management', () => {
  describe('create', () => {
    it('should create user with valid data', () => {});
    it('should reject invalid email', () => {});
    it('should reject duplicate email', () => {});
  });

  describe('update', () => {
    it('should update user properties', () => {});
    it('should reject invalid updates', () => {});
  });

  describe('delete', () => {
    it('should delete existing user', () => {});
    it('should handle non-existent user gracefully', () => {});
  });
});
```

### Extract Common Setup

**Before:**
```javascript
test('should calculate total', () => {
  const user = { id: '1', name: 'Test' };
  const cart = { items: [{ price: 10 }, { price: 20 }] };
  // test code
});

test('should apply discount', () => {
  const user = { id: '1', name: 'Test' };
  const cart = { items: [{ price: 10 }, { price: 20 }] };
  // test code
});
```

**After:**
```javascript
describe('Cart Calculations', () => {
  let testUser;
  let testCart;

  beforeEach(() => {
    testUser = createMockUser();
    testCart = createMockCart({ items: [
      { price: 10 },
      { price: 20 }
    ]});
  });

  it('should calculate total correctly', () => {
    // test code
  });

  it('should apply discount properly', () => {
    // test code
  });
});
```

## Step 6: Improve Test Names

### Make Names Descriptive and Consistent

**Before:**
```javascript
test('test1', () => {});
test('it works', () => {});
test('edge case', () => {});
test('should validate', () => {});
```

**After:**
```javascript
describe('EmailValidator', () => {
  it('should return true for valid email addresses', () => {});
  it('should return false for emails without @ symbol', () => {});
  it('should handle empty string input', () => {});
  it('should reject emails with invalid domain', () => {});
});
```

### Follow Naming Convention
- Use "should" for behavior: "should return true when..."
- Be specific about condition: "when input is null"
- Include expected outcome: "should throw ValidationError"

## Step 7: Enhance Assertions

### Replace Weak Assertions

**Before:**
```javascript
test('should return data', () => {
  const result = fetchUser(1);
  expect(result).toBeTruthy();  // Too generic
});
```

**After:**
```javascript
test('should return user with correct structure', () => {
  const result = fetchUser(1);

  expect(result).toEqual({
    id: 1,
    name: expect.any(String),
    email: expect.stringContaining('@'),
    createdAt: expect.any(Date),
  });
});
```

### Add Missing Assertions

**Before:**
```javascript
test('should save user', () => {
  saveUser(user);
  // No assertions!
});
```

**After:**
```javascript
test('should save user and return saved instance', () => {
  const user = createMockUser();

  const result = saveUser(user);

  expect(result).toBeDefined();
  expect(result.id).toBeTruthy();
  expect(result.createdAt).toBeInstanceOf(Date);
  expect(mockRepository.save).toHaveBeenCalledWith(user);
});
```

### Use Specific Matchers

**Before:**
```javascript
expect(array.length === 3).toBe(true);
expect(result !== undefined).toBe(true);
expect(typeof value === 'string').toBe(true);
```

**After:**
```javascript
expect(array).toHaveLength(3);
expect(result).toBeDefined();
expect(value).toBeTypeOf('string');
// or
expect(typeof value).toBe('string');
```

## Step 8: Add Missing Test Cases

### Add Edge Cases

**Before:**
```javascript
describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });
});
```

**After:**
```javascript
describe('divide', () => {
  it('should divide two positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(10, -2)).toBe(-5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
  });

  it('should handle decimal results', () => {
    expect(divide(10, 3)).toBeCloseTo(3.33, 2);
  });

  it('should handle zero numerator', () => {
    expect(divide(0, 5)).toBe(0);
  });
});
```

### Add Error Case Tests

**Before:**
```javascript
describe('validateEmail', () => {
  it('should validate correct emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
});
```

**After:**
```javascript
describe('validateEmail', () => {
  describe('valid emails', () => {
    it('should accept standard email format', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('should accept email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should reject email without @ symbol', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });
});
```

## Step 9: Improve Mock Usage

### Properly Isolate Dependencies

**Before:**
```javascript
test('should fetch user data', async () => {
  // Hitting real API!
  const user = await api.getUser(1);
  expect(user.name).toBe('John');
});
```

**After:**
```javascript
describe('UserService', () => {
  let mockApi;
  let userService;

  beforeEach(() => {
    mockApi = {
      getUser: jest.fn(),
    };
    userService = new UserService(mockApi);
  });

  it('should fetch user data from API', async () => {
    const mockUser = { id: 1, name: 'John' };
    mockApi.getUser.mockResolvedValue(mockUser);

    const user = await userService.getUser(1);

    expect(user).toEqual(mockUser);
    expect(mockApi.getUser).toHaveBeenCalledWith(1);
    expect(mockApi.getUser).toHaveBeenCalledTimes(1);
  });
});
```

### Verify Mock Interactions

**Before:**
```javascript
test('should save user', () => {
  const mockSave = jest.fn();
  service.repository.save = mockSave;

  service.createUser(userData);
  // No verification of mock!
});
```

**After:**
```javascript
test('should save user with repository', () => {
  const mockSave = jest.fn().mockResolvedValue(savedUser);
  service.repository.save = mockSave;

  const result = service.createUser(userData);

  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({
      name: userData.name,
      email: userData.email,
    })
  );
  expect(result).toEqual(savedUser);
});
```

## Step 10: Remove Test Smells

### Fix Flaky Tests

**Before:**
```javascript
test('should process in order', async () => {
  processAsync();
  // Race condition!
  expect(result).toBe('done');
});

test('should generate unique id', () => {
  const id = generateId(); // Uses Math.random()
  expect(id).toBe(12345); // Will randomly fail!
});
```

**After:**
```javascript
test('should process in order', async () => {
  await processAsync();
  expect(result).toBe('done');
});

test('should generate unique id', () => {
  // Mock random or test properties
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const id = generateId();
  expect(id).toMatch(/^\d+$/);
  expect(id.length).toBeGreaterThan(0);
});
```

### Enable Skipped Tests

**Before:**
```javascript
it.skip('should handle edge case', () => {
  // Test is skipped
});

// test('old test', () => {
//   // Commented out test
// });
```

**After:**
```javascript
it('should handle edge case', () => {
  // Fixed and enabled test
  const result = handleEdgeCase(input);
  expect(result).toBe(expected);
});

// Removed commented code
```

## Step 11: Add Test Documentation

**Before:**
```javascript
test('test user creation', () => {
  // Complex test without context
});
```

**After:**
```javascript
/**
 * Tests that user creation validates email format before saving.
 * This is critical because invalid emails cause downstream issues
 * in the notification system.
 */
test('should validate email format before creating user', () => {
  // Given: An invalid email
  const invalidUser = { email: 'not-an-email' };

  // When: Attempting to create user
  const result = () => createUser(invalidUser);

  // Then: Should throw validation error
  expect(result).toThrow(ValidationError);
  expect(result).toThrow('Invalid email format');
});
```

## Step 12: Summary Report

Generate a comprehensive improvement report:

```
🔧 Test Quality Improvement Report

Test File: tests/user-service.test.ts
Framework: Jest
Initial Quality Score: 45/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 IMPROVEMENTS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Structure Improvements:
   - Organized tests into describe blocks (5 groups)
   - Extracted common setup to beforeEach
   - Removed test duplication (3 instances)

✅ Naming Improvements:
   - Renamed 8 tests with descriptive names
   - Applied consistent naming convention
   - Added context to test names

✅ Assertion Improvements:
   - Replaced 6 weak assertions with specific matchers
   - Added 4 missing assertions
   - Enhanced error messages

✅ Coverage Improvements:
   - Added 5 edge case tests
   - Added 3 error scenario tests
   - Added null/undefined handling tests

✅ Mock Improvements:
   - Properly isolated 4 external dependencies
   - Added mock verification (7 cases)
   - Fixed mock cleanup issues

✅ Code Quality:
   - Fixed 2 flaky tests
   - Enabled 3 skipped tests
   - Removed magic values (replaced with constants)
   - Added test documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tests: 12 → 23 (+11 new tests)
Test Coverage: 60% → 85% (+25%)
Average Test Quality: ⭐⭐⭐ → ⭐⭐⭐⭐⭐

Before:
├─ Unclear test names: 8
├─ Weak assertions: 6
├─ Missing edge cases: 5
├─ Skipped tests: 3
└─ Flaky tests: 2

After:
├─ Unclear test names: 0 ✅
├─ Weak assertions: 0 ✅
├─ Missing edge cases: 0 ✅
├─ Skipped tests: 0 ✅
└─ Flaky tests: 0 ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CHANGES MADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Reorganized into logical describe blocks
2. Extracted common setup (30 lines → 5 lines)
3. Renamed all tests with "should" convention
4. Added comprehensive edge case tests
5. Improved assertions with specific matchers
6. Added proper mock isolation and verification
7. Fixed flaky tests with proper async handling
8. Enabled and fixed skipped tests
9. Added documentation for complex tests
10. Removed all magic values

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Run tests: npm test user-service.test.ts
2. Verify all tests pass
3. Check coverage: npm run test:coverage
4. Review changes and adjust if needed
5. Apply similar improvements to other test files

Final Quality Score: 92/100 ⭐⭐⭐⭐⭐
```

## Important Guidelines

### DO:
- Make specific, actionable improvements
- Maintain existing test functionality
- Add comprehensive edge case tests
- Improve assertion specificity
- Fix flaky and brittle tests
- Organize tests logically
- Document complex test scenarios
- Remove code duplication

### DON'T:
- Don't change test behavior without understanding it
- Don't remove tests without good reason
- Don't add tests that don't add value
- Don't create overly complex test setups
- Don't ignore flaky tests
- Don't leave commented code
- Don't use unclear test names

## Error Handling

If you encounter issues:

- **Test file not found**: Ask for correct path
- **Unclear test intent**: Ask user to clarify before changing
- **Framework unfamiliar**: Adapt improvements to framework patterns
- **Complex test suite**: Break improvements into phases

---

Begin by thoroughly analyzing the test file and systematically improving test quality across all dimensions.
