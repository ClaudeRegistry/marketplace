---
description: Generate comprehensive unit tests for functions, classes, or modules with edge cases and realistic test data
argument-hint: [file-path or function-name]
model: inherit
---

# Unit Test Generation Command

You are tasked with generating comprehensive, production-quality unit tests for the specified code. Follow these steps precisely to create thorough test coverage:

## Step 1: Identify Target Code

**If the user provided a file path or function name:**
- Locate and read the specified file(s) or function(s)
- If a directory is specified, recursively find all testable code files within it
- Identify all public functions, classes, and methods that need testing

**If no specific target is provided:**
- Ask the user which file, function, or class they want tested
- Provide a list of recently modified files as suggestions
- Show files with low or no test coverage if available

## Step 2: Analyze the Code

For each target function or class, perform thorough analysis:

### Function Analysis
- **Purpose**: What does this function do?
- **Input Parameters**: Types, valid ranges, constraints, optional vs required
- **Return Values**: What does it return? What are possible return values?
- **Side Effects**: Does it modify state, make API calls, write to DB, etc.?
- **Dependencies**: What external modules or services does it depend on?
- **Error Conditions**: What errors can it throw? Under what conditions?
- **Edge Cases**: Boundary values, null/undefined, empty collections, special characters
- **Business Logic**: What business rules does it implement?

### Class Analysis
- **Responsibilities**: What is this class responsible for?
- **Public Methods**: All methods that need testing
- **State Management**: How does internal state change?
- **Dependencies**: What dependencies are injected or used?
- **Lifecycle**: Constructor, initialization, cleanup
- **Inheritance**: Parent classes and their behavior

## Step 3: Detect Testing Framework

Automatically detect the testing framework from the project:

### JavaScript/TypeScript
- Check `package.json` for: jest, vitest, mocha, jasmine
- Default to Jest if not specified
- Check for existing test files to match their style

### Python
- Check for: pytest, unittest, nose2
- Look at existing test files
- Default to pytest (modern standard)

### Java
- Check `pom.xml` or `build.gradle` for: JUnit 5, JUnit 4, TestNG
- Default to JUnit 5

### Go
- Use standard `testing` package
- Check for testify for enhanced assertions

### Other Languages
- Detect from project files and conventions
- Use language-standard testing frameworks

## Step 4: Identify Test Cases

Generate tests for ALL of these categories:

### Happy Path Tests
- Normal, expected usage
- Valid inputs producing expected outputs
- Typical scenarios users will encounter

### Edge Case Tests
- **Boundary Values**: Min/max values, empty collections, zero, negative numbers
- **Null/Undefined/None**: How does the code handle missing values?
- **Empty Inputs**: Empty strings, empty arrays, empty objects
- **Large Inputs**: Very long strings, large arrays, big numbers
- **Special Characters**: Unicode, symbols, whitespace in strings

### Error Condition Tests
- Invalid input types
- Out-of-range values
- Missing required parameters
- Failed dependency calls (API errors, DB errors)
- Network timeouts
- Permission denied scenarios

### State Tests (for classes)
- Initial state after construction
- State changes after method calls
- State persistence across multiple operations
- Invalid state transitions

### Integration Points
- Mocking external dependencies
- Testing interactions with databases
- Testing API calls
- Testing file system operations
- Testing event emissions

## Step 5: Generate Test Structure

Create well-structured test files following these patterns:

### For Jest/JavaScript/TypeScript:

```javascript
import { functionName, ClassName } from './source-file';
import { mockDependency } from './dependencies';

// Mock external dependencies
jest.mock('./dependencies');

describe('functionName', () => {
  // Setup and teardown
  beforeEach(() => {
    // Reset mocks, clear state
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Happy Path', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const input = validInput;
      const expected = expectedOutput;

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      expect(() => functionName(null)).not.toThrow();
      // or
      expect(functionName(null)).toBe(defaultValue);
    });

    it('should handle empty array input', () => {
      const result = functionName([]);
      expect(result).toEqual(emptyResult);
    });

    it('should handle very large inputs', () => {
      const largeInput = Array(10000).fill(value);
      const result = functionName(largeInput);
      expect(result).toBeDefined();
    });
  });

  describe('Error Conditions', () => {
    it('should throw error for invalid input type', () => {
      expect(() => functionName('invalid')).toThrow('Expected number');
    });

    it('should handle dependency failure gracefully', () => {
      mockDependency.mockRejectedValueOnce(new Error('API Error'));
      expect(functionName(input)).rejects.toThrow();
    });
  });
});

describe('ClassName', () => {
  let instance;

  beforeEach(() => {
    instance = new ClassName(dependencies);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(instance.property).toBe(defaultValue);
    });
  });

  describe('methodName', () => {
    it('should [expected behavior]', () => {
      const result = instance.methodName(input);
      expect(result).toBe(expected);
    });
  });
});
```

### For Pytest/Python:

```python
import pytest
from unittest.mock import Mock, patch
from module import function_name, ClassName

@pytest.fixture
def sample_data():
    """Fixture providing test data."""
    return {
        'key': 'value',
        'count': 10
    }

@pytest.fixture
def mock_dependency():
    """Fixture providing mocked dependency."""
    with patch('module.dependency') as mock:
        yield mock

class TestFunctionName:
    """Test suite for function_name."""

    def test_happy_path_basic_usage(self, sample_data):
        """Should return expected result for valid input."""
        # Arrange
        input_data = sample_data
        expected = expected_output

        # Act
        result = function_name(input_data)

        # Assert
        assert result == expected

    def test_edge_case_empty_input(self):
        """Should handle empty input gracefully."""
        result = function_name([])
        assert result == default_value

    def test_edge_case_none_input(self):
        """Should handle None input appropriately."""
        result = function_name(None)
        assert result is not None

    def test_error_invalid_type(self):
        """Should raise TypeError for invalid input type."""
        with pytest.raises(TypeError, match="Expected dict"):
            function_name("invalid")

    def test_with_mocked_dependency(self, mock_dependency):
        """Should handle dependency correctly."""
        mock_dependency.return_value = mock_value
        result = function_name(input_data)
        assert result == expected
        mock_dependency.assert_called_once_with(expected_args)

class TestClassName:
    """Test suite for ClassName."""

    @pytest.fixture
    def instance(self):
        """Create instance for testing."""
        return ClassName(dependencies)

    def test_initialization(self, instance):
        """Should initialize with correct defaults."""
        assert instance.property == default_value

    def test_method_name(self, instance):
        """Should perform expected behavior."""
        result = instance.method_name(input_data)
        assert result == expected
```

### For JUnit/Java:

```java
import org.junit.jupiter.api.*;
import org.mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ClassNameTest {

    @Mock
    private Dependency mockDependency;

    @InjectMocks
    private ClassName instance;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should return expected result for valid input")
    void testHappyPath() {
        // Arrange
        Input input = new Input(validData);
        Output expected = new Output(expectedData);

        // Act
        Output result = instance.methodName(input);

        // Assert
        assertEquals(expected, result);
    }

    @Test
    @DisplayName("Should handle null input gracefully")
    void testNullInput() {
        assertThrows(IllegalArgumentException.class, () -> {
            instance.methodName(null);
        });
    }

    @Test
    @DisplayName("Should interact with dependency correctly")
    void testWithMockedDependency() {
        // Arrange
        when(mockDependency.getData()).thenReturn(mockData);

        // Act
        Result result = instance.methodName(input);

        // Assert
        assertNotNull(result);
        verify(mockDependency, times(1)).getData();
    }
}
```

## Step 6: Create Mocks and Test Data

Generate appropriate mocks and test data:

### Mocking Guidelines
- Mock external API calls
- Mock database connections
- Mock file system operations
- Mock time/date functions for deterministic tests
- Use spy when you need to verify calls but keep real implementation

### Test Data
- Create realistic test data that matches production scenarios
- Generate edge case data (empty, null, boundary values)
- Create invalid data for error testing
- Use factories or builders for complex objects

## Step 7: Write Descriptive Test Names

Follow naming conventions:

### Jest/JavaScript Pattern:
```javascript
it('should [expected result] when [condition]', () => {
  // test
});
```

### Pytest Pattern:
```python
def test_[function]_[condition]_[expected_result](self):
    """Docstring explaining what is tested."""
```

### JUnit Pattern:
```java
@Test
@DisplayName("Should [expected result] when [condition]")
void test[Function][Condition][ExpectedResult]() {
}
```

### Good Test Names Examples:
- `should return empty array when input is empty`
- `should throw ValidationError when email is invalid`
- `should call API once with correct parameters`
- `should update state after successful save`
- `should handle concurrent requests without data corruption`

## Step 8: Add Comprehensive Assertions

Use appropriate assertions:

### Value Assertions
- Exact equality: `expect(result).toBe(expected)`
- Deep equality: `expect(result).toEqual(expected)`
- Truthiness: `expect(result).toBeTruthy()`

### Collection Assertions
- Array contains: `expect(array).toContain(item)`
- Array length: `expect(array).toHaveLength(3)`
- Object properties: `expect(obj).toHaveProperty('key', value)`

### Error Assertions
- Throws error: `expect(() => fn()).toThrow(ErrorType)`
- Error message: `expect(() => fn()).toThrow('specific message')`

### Mock Assertions
- Called once: `expect(mock).toHaveBeenCalledTimes(1)`
- Called with args: `expect(mock).toHaveBeenCalledWith(arg1, arg2)`
- Not called: `expect(mock).not.toHaveBeenCalled()`

## Step 9: Create Test File

After generating tests:

1. **Determine test file location** based on project conventions:
   - Same directory as source: `file.test.ts` or `file_test.go`
   - Separate test directory: `tests/file.test.ts` or `test/file_test.py`
   - Mirror source structure: `src/module.ts` → `tests/module.test.ts`

2. **Check for existing test file** and merge if necessary

3. **Write the test file** using the Write tool

4. **Preserve any existing tests** if file already exists

## Step 10: Summary Report

Provide a comprehensive summary:

```
🧪 Unit Test Generation Complete

Target: [file or function name]
Framework: [Jest/Pytest/JUnit/etc]
Test File: [path to test file]

Tests Generated: [count]
├─ Happy Path Tests: [count]
├─ Edge Case Tests: [count]
├─ Error Condition Tests: [count]
└─ Integration Tests: [count]

Coverage:
✅ All public functions tested
✅ Edge cases covered
✅ Error conditions tested
✅ Dependencies mocked
✅ Assertions comprehensive

Test Breakdown:
- [FunctionName]: [X] tests (happy path + edge cases + errors)
- [ClassName.methodName]: [X] tests (state + behavior)

Next Steps:
1. Run the tests: [command to run tests]
2. Check coverage: [command for coverage]
3. Review and adjust test data if needed
4. Run /test-gap-analysis to verify coverage
```

## Important Guidelines

### DO:
- Generate comprehensive tests covering all scenarios
- Use descriptive test names that explain what is tested
- Mock external dependencies properly
- Test edge cases and error conditions thoroughly
- Follow AAA pattern (Arrange, Act, Assert)
- Make tests independent and idempotent
- Use realistic test data
- Add comments explaining complex test setups

### DON'T:
- Don't test private methods directly
- Don't create tests that depend on each other
- Don't use real external services (APIs, DBs)
- Don't hardcode environment-specific values
- Don't create flaky tests with random values
- Don't skip error case testing
- Don't generate minimal or placeholder tests

## Error Handling

If you encounter issues:

- **File not found**: Ask user for correct path or show available files
- **No testable functions**: Explain what makes code testable and ask for clarification
- **Framework unclear**: List detected dependencies and ask user to confirm
- **Complex dependencies**: Create comprehensive mocks and fixtures
- **Existing tests**: Merge new tests with existing ones carefully

---

Begin by analyzing the target code and systematically generating comprehensive test coverage.
