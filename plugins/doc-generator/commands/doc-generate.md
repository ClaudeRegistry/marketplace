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

## Step 3: Generate Language-Appropriate Documentation

Generate documentation using the standard format for the detected language:
- **JavaScript/TypeScript**: JSDoc format with @param, @returns, @throws, @example tags
- **Python**: Google-style docstrings with Args, Returns, Raises, Example sections
- **Java**: Javadoc format with @param, @return, @throws, @since tags
- **Go**: Doc comments starting with the function name as complete sentences
- **Other languages**: Adapt to the language's standard documentation conventions

For every documented element, include:
1. Brief summary (1-2 sentences)
2. Detailed description where warranted
3. All parameters with types and descriptions
4. Return values with types
5. At least one practical, runnable example
6. Side effects, exceptions, and performance notes where applicable

Write in clear, direct language using active voice. Document ALL public APIs.
Do not skip "obvious" parameters. Include edge cases and special behaviors.

## Step 4: Add Documentation to Code

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

## Step 5: Generate Separate Documentation Files (Optional)

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

## Step 6: Summary Report

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
- Use the doc-reviewer agent to identify any remaining undocumented code
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
