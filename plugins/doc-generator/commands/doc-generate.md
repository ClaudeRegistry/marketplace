---
description: Generate comprehensive documentation for code files, functions, classes, or modules with natural language explanations
argument-hint: [file-path or function-name]
model: inherit
---

# Documentation Generation Command

You are tasked with generating high-quality, comprehensive documentation for the specified code. Follow these steps precisely:

## Step 1: Identify Target Code

**If the user provided a file path or function name:**
- Locate and read the specified file(s) or function(s)
- If a directory is specified, recursively find all code files within it

**If no specific target is provided:**
- Ask the user which file, function, class, or module they want documented
- Provide a list of recently modified files as suggestions

## Step 2: Analyze the Code

For each target file or function, perform a thorough analysis:

### Code Structure Analysis
- Identify the programming language and framework
- Determine the purpose and responsibility of the code
- Map out all public APIs, functions, classes, and methods
- Identify dependencies and imported modules
- Detect design patterns used
- Understand the data flow and control flow

### Function/Method Analysis
For each function or method:
- **Purpose**: What problem does it solve?
- **Parameters**: Document each parameter with type, description, default values, constraints
- **Return Values**: Document return type, possible return values, and what they represent
- **Side Effects**: Any state changes, I/O operations, or mutations
- **Exceptions**: What errors can be thrown and under what conditions
- **Complexity**: Time and space complexity if applicable
- **Examples**: Common use cases

### Class Analysis
For each class:
- **Purpose**: What does this class represent or encapsulate?
- **Properties/Attributes**: Document all public and protected properties
- **Methods**: Document all public and protected methods
- **Inheritance**: Parent classes and interfaces implemented
- **Design Patterns**: Observer, Factory, Singleton, etc.
- **State Management**: How state is maintained and modified
- **Usage Examples**: How to instantiate and use the class

## Step 3: Generate Documentation

Create documentation in the appropriate format for the language:

### For JavaScript/TypeScript (JSDoc format):
```javascript
/**
 * Brief one-line description of what the function does.
 *
 * More detailed explanation if needed. Describe the algorithm,
 * business logic, or any important implementation details.
 *
 * @param {Type} paramName - Description of the parameter
 * @param {Type} [optionalParam=defaultValue] - Description of optional parameter
 * @returns {ReturnType} Description of what is returned
 * @throws {ErrorType} Description of when this error occurs
 *
 * @example
 * // Example usage:
 * const result = functionName(arg1, arg2);
 * console.log(result); // Expected output
 *
 * @see {@link RelatedFunction} for related functionality
 * @since 1.0.0
 */
```

### For Python (Google style docstrings):
```python
"""Brief one-line description.

Detailed description of the function, class, or module.
Explain the purpose, algorithm, and any important details.

Args:
    param_name (type): Description of the parameter.
    optional_param (type, optional): Description. Defaults to None.

Returns:
    return_type: Description of the return value.

Raises:
    ErrorType: Description of when this error occurs.

Example:
    >>> result = function_name(arg1, arg2)
    >>> print(result)
    expected_output

Note:
    Additional notes, warnings, or important information.

See Also:
    related_function: Description of relationship.
"""
```

### For Java (Javadoc format):
```java
/**
 * Brief one-line description.
 * <p>
 * Detailed description of the method or class.
 * Explain the purpose and important implementation details.
 * </p>
 *
 * @param paramName Description of the parameter
 * @param optionalParam Description of optional parameter
 * @return Description of the return value
 * @throws ExceptionType Description of when this exception occurs
 *
 * @see RelatedClass
 * @since 1.0.0
 * @author Author Name
 *
 * <pre>
 * Example usage:
 * ReturnType result = methodName(arg1, arg2);
 * System.out.println(result);
 * </pre>
 */
```

### For Go:
```go
// FunctionName performs [brief description].
//
// Detailed description of what the function does,
// including algorithm details and important notes.
//
// Parameters:
//   - paramName: Description of the parameter
//   - optionalParam: Description of optional parameter
//
// Returns:
//   - returnType: Description of what is returned
//   - error: Description of error conditions
//
// Example:
//   result, err := FunctionName(arg1, arg2)
//   if err != nil {
//       log.Fatal(err)
//   }
//   fmt.Println(result)
```

### For Other Languages:
Adapt the documentation format to match the language's standard conventions (e.g., Rustdoc for Rust, XML comments for C#, RDoc for Ruby, etc.).

## Step 4: Include Comprehensive Information

Ensure every piece of documentation includes:

### Required Sections:
1. **Brief Summary** (1-2 sentences) - What does this do?
2. **Detailed Description** (1-3 paragraphs) - How and why?
3. **Parameters/Arguments** - Complete list with types and descriptions
4. **Return Values** - What does it return and what do the values mean?
5. **Examples** - At least one practical example showing real usage
6. **Side Effects** - Any state changes, I/O, or external impacts

### Optional but Recommended Sections:
7. **Exceptions/Errors** - What can go wrong?
8. **Performance Notes** - Time/space complexity, bottlenecks
9. **See Also** - Related functions or documentation
10. **Notes/Warnings** - Important caveats or gotchas
11. **Since/Version** - When was this introduced?
12. **Deprecated** - If applicable, what to use instead

## Step 5: Write Clear, Developer-Friendly Documentation

Follow these writing principles:

### Clarity:
- Use simple, direct language
- Avoid jargon unless it's standard for the domain
- Define acronyms on first use
- Use active voice ("Returns the user object" not "The user object is returned")

### Completeness:
- Document ALL public APIs
- Don't skip "obvious" parameters
- Include edge cases and special behaviors
- Explain non-obvious implementation choices

### Examples:
- Provide realistic, practical examples
- Show common use cases first
- Include edge cases in examples
- Make examples runnable if possible

### Consistency:
- Use the same terminology throughout
- Follow the project's documentation style
- Maintain consistent formatting
- Use consistent parameter order in descriptions

## Step 6: Add Documentation to Code

After generating documentation:

1. **Read the target file** using the Read tool
2. **Locate the exact position** where documentation should be inserted
3. **Add the documentation** using the Edit tool, placing it immediately before:
   - Function declarations
   - Class declarations
   - Method declarations
   - Module exports
4. **Preserve existing code formatting** and indentation
5. **Do not modify** the actual code logic

## Step 7: Generate Separate Documentation Files (Optional)

If the codebase uses separate documentation files (like Markdown docs), also generate:

### API Reference Document (Markdown):
```markdown
# [Module/Class Name]

## Overview
[Description of the module/class]

## Installation
[If applicable]

## Usage
[High-level usage patterns]

## API Reference

### FunctionName
**Signature:** `functionName(param1: Type1, param2: Type2): ReturnType`

**Description:** [What it does]

**Parameters:**
- `param1` (Type1): [Description]
- `param2` (Type2): [Description]

**Returns:** [Return type and description]

**Example:**
```language
[Code example]
```

**See Also:** [Related functions]
```

## Step 8: Summary Report

After generating all documentation, provide a summary:

```
📚 Documentation Generation Complete

Files Documented: [count]
Functions Documented: [count]
Classes Documented: [count]
Total Lines of Documentation Added: [count]

Files Modified:
- [file1.ext] - [X functions/classes documented]
- [file2.ext] - [X functions/classes documented]

Documentation Quality Checklist:
✅ All public APIs documented
✅ Parameters and return values specified
✅ Examples provided
✅ Exceptions/errors documented
✅ Code follows language conventions

Next Steps:
- Review the generated documentation for accuracy
- Run /doc-sync-check to identify any remaining undocumented code
- Consider generating API documentation with /api-docs
```

## Important Guidelines:

- **DO NOT** modify the actual code logic or implementation
- **DO** match the existing code style and formatting
- **DO** use the language's standard documentation format
- **DO** include practical, realistic examples
- **DO** document edge cases and error conditions
- **DO NOT** generate generic or placeholder documentation
- **DO** be specific about types, constraints, and behaviors
- **DO** explain the "why" not just the "what"

## Error Handling:

If you encounter issues:
- **File not found**: Ask user to provide correct path or select from available files
- **No public APIs**: Inform user and ask if they want internal functions documented
- **Complex code**: Break down into sections and document thoroughly
- **Missing type information**: Infer types from usage or ask user for clarification

---

Begin by identifying what needs to be documented and proceed systematically through each step.
