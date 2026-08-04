# Data Converter

[![Verified by ClaudeRegistry](https://clauderegistry.com/badge/data-converter.svg)](https://clauderegistry.com/plugin/data-converter)

Advanced data transformation and processing plugin for Claude Code that provides powerful querying, filtering, validation, and conversion capabilities for JSON, CSV, XML, YAML, and other data formats.

## Purpose

Data Converter solves the common challenge developers face when working with data files: transforming, validating, converting, and analyzing data across different formats. Inspired by powerful CLI tools like `jq`, `csvkit`, and modern data processing utilities, Data Converter brings enterprise-grade data manipulation directly into your Claude Code workflow.

## Why Data Converter?

**Common Developer Pain Points:**
- "I need to extract specific fields from this huge JSON file"
- "How do I convert this CSV to JSON for my API?"
- "I need to validate this data against a schema before importing"
- "Can I generate TypeScript types from this API response?"
- "I need to filter 10,000 rows by multiple conditions"

**Data Converter Makes It Easy:**
- Query and transform data with natural language
- Convert between formats seamlessly
- Validate data quality and schema compliance
- Generate schemas and type definitions automatically
- Process large files efficiently

## Features

### 🔍 JSON Query & Transformation
- Extract nested fields with jq-style operations
- Filter arrays by complex conditions
- Reshape and restructure data
- Aggregate and compute statistics
- Merge and combine JSON files

### 📊 CSV Processing
- Filter rows by multiple criteria
- Select and rename columns
- Sort, group, and aggregate data
- Merge multiple CSV files
- Clean and normalize data
- Handle large datasets efficiently

### 🔄 Format Conversion
- **JSON** ↔ CSV, YAML, XML, TOML, Excel
- **CSV** ↔ JSON, YAML, Excel, Markdown
- **YAML** ↔ JSON, TOML
- **XML** ↔ JSON
- Smart type preservation during conversion
- Bidirectional transformations

### ✅ Data Validation
- Validate against JSON Schema
- Type checking and format validation
- Detect missing values and duplicates
- Find outliers and anomalies
- Check referential integrity
- Custom business rule validation

### 🏗️ Schema Generation
- Generate JSON Schema from data
- Create TypeScript interfaces
- Generate SQL DDL (CREATE TABLE)
- Build Zod/Yup validators
- Create OpenAPI specifications
- GraphQL schema generation

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install Data Converter:

```bash
/plugin install data-converter@clauderegistry
```

Or use the interactive browser:

```bash
/plugin
```

## Commands

Once installed, you can use the following slash commands in any Claude Code session:

### /json-query

Query, filter, and transform JSON data with powerful operations.

```
/json-query
```

**What it does:**
- Extract specific fields from nested JSON
- Filter arrays by conditions
- Navigate complex data structures
- Reshape and transform data
- Aggregate values (sum, count, average)
- Remove null/undefined values
- Pretty-print or minify JSON

**Example usage:**
```
/json-query
→ "Extract all user emails from users.json"
→ "Get orders where total > 100 from orders.json"
→ "Flatten the nested products array"
→ "Group sales by category and sum amounts"
```

**Common operations:**
- Extract fields: `users.map(u => u.email)`
- Filter data: `users.filter(u => u.age > 18)`
- Nested navigation: `orders.flatMap(o => o.items)`
- Aggregation: `sales.reduce((sum, s) => sum + s.amount)`

### /csv-transform

Process CSV/TSV files with filtering, sorting, and transformation.

```
/csv-transform
```

**What it does:**
- Select specific columns
- Filter rows by conditions
- Sort by single or multiple columns
- Group and aggregate data
- Merge multiple CSV files
- Clean and normalize data
- Handle missing values
- Convert delimiters (CSV ↔ TSV)

**Example usage:**
```
/csv-transform
→ "Get all rows where age > 18 from users.csv"
→ "Select only name, email, and score columns"
→ "Sort by score descending"
→ "Calculate average revenue by category"
→ "Merge customers.csv and orders.csv on customer_id"
```

**Best for:**
- Data cleaning and preprocessing
- Filtering large datasets
- Preparing data for import
- Combining multiple data sources
- Quick data exploration

### /format-converter

Convert between different data formats seamlessly.

```
/format-converter
```

**What it does:**
- Convert JSON to CSV, YAML, XML, TOML, Excel
- Convert CSV to JSON, YAML, Excel, Markdown
- Convert YAML to JSON, TOML
- Convert XML to JSON
- Convert Excel to CSV, JSON
- Preserve data types during conversion
- Handle nested structures intelligently

**Example usage:**
```
/format-converter
→ "Convert users.json to CSV"
→ "Convert config.yaml to JSON"
→ "Convert sales.csv to Excel with formatting"
→ "Convert API response XML to JSON"
→ "Convert data.json to YAML with comments"
```

**Supported formats:**
- JSON (standard, JSONL)
- CSV/TSV
- YAML
- XML
- TOML
- Excel (XLSX)
- Markdown tables

**Smart features:**
- Flattens nested JSON for CSV export
- Infers types when converting to JSON
- Preserves arrays and objects
- Handles special characters and escaping

### /data-validator

Validate data files against schemas and quality rules.

```
/data-validator
```

**What it does:**
- Validate JSON against JSON Schema
- Check CSV column types and constraints
- Detect missing/null values
- Find duplicate records
- Identify outliers and anomalies
- Validate business rules
- Check referential integrity
- Generate validation reports

**Example usage:**
```
/data-validator
→ "Validate users.json against schema.json"
→ "Check if customers.csv is ready for database import"
→ "Find duplicate email addresses in users.csv"
→ "Detect outliers in sales data"
→ "Validate that all order IDs exist in orders table"
```

**Validation types:**
- **Schema validation**: JSON Schema compliance
- **Type checking**: Ensure correct data types
- **Format validation**: Email, URL, date formats
- **Range validation**: Min/max values
- **Required fields**: Check for missing data
- **Duplicates**: Find duplicate records
- **Outliers**: Statistical anomaly detection
- **Business rules**: Custom validation logic

**Report includes:**
- Error count by severity
- Detailed error messages with row numbers
- Data quality metrics
- Missing value analysis
- Format inconsistencies
- Actionable suggestions for fixes

### /schema-generator

Generate schemas and type definitions from data files.

```
/schema-generator
```

**What it does:**
- Generate JSON Schema from JSON data
- Create TypeScript interfaces
- Generate SQL DDL (CREATE TABLE statements)
- Build Zod validators for runtime validation
- Create Yup schemas
- Generate OpenAPI/Swagger specifications
- Infer types from multiple records

**Example usage:**
```
/schema-generator
→ "Generate TypeScript interface from users.json"
→ "Create SQL schema from customers.csv"
→ "Generate JSON Schema from API response"
→ "Create Zod validator from data.json"
→ "Generate OpenAPI spec from API examples"
```

**Smart inference:**
- Analyzes multiple records for accuracy
- Detects optional vs required fields
- Infers formats (email, URL, date)
- Determines min/max constraints
- Identifies enum values
- Suggests validation rules

**Output formats:**
- JSON Schema (draft-07)
- TypeScript interfaces
- SQL DDL (PostgreSQL, MySQL)
- Zod schemas
- Yup schemas
- OpenAPI 3.0 specs
- GraphQL schemas

## Typical Workflows

### Workflow 1: API Integration
**Scenario**: Working with a new API and need to understand and type the data

```
1. Fetch API response and save to response.json
2. /json-query → Explore structure and extract needed fields
3. /schema-generator → Generate TypeScript interfaces
4. /data-validator → Create validation schema
5. Use generated types in your application
```

### Workflow 2: Data Import Preparation
**Scenario**: Preparing CSV data for database import

```
1. /csv-transform → Clean and filter data
2. /data-validator → Check data quality and find issues
3. /csv-transform → Fix identified issues
4. /schema-generator → Generate CREATE TABLE statement
5. /format-converter → Convert to SQL INSERT statements
6. Import to database
```

### Workflow 3: Data Migration
**Scenario**: Migrating data between systems

```
1. Export from source system (CSV/JSON)
2. /data-validator → Validate source data
3. /format-converter → Convert to target format
4. /csv-transform → Transform to match target schema
5. /data-validator → Validate transformed data
6. Import to target system
```

### Workflow 4: Configuration Management
**Scenario**: Converting and validating configuration files

```
1. /format-converter → Convert YAML config to JSON
2. /schema-generator → Generate JSON Schema
3. /data-validator → Validate all environment configs
4. /format-converter → Convert back to YAML if needed
```

### Workflow 5: Data Analysis
**Scenario**: Quick analysis of CSV/JSON data

```
1. /json-query or /csv-transform → Filter to relevant subset
2. /csv-transform → Group and aggregate by dimensions
3. /format-converter → Convert to Excel for stakeholders
4. /data-validator → Check for data quality issues
```

## Real-World Use Cases

### Use Case 1: "Extract User Emails from Nested JSON"
**Problem**: API returns deeply nested user objects, need just emails.

**Solution**:
```
/json-query
→ "Extract all user emails from api-response.json"

Result: Clean array of email addresses ready to use
```

---

### Use Case 2: "CSV Data Cleaning Before Import"
**Problem**: CSV has duplicates, missing values, wrong types.

**Solution**:
```
/data-validator
→ Check data quality, find issues

/csv-transform
→ Remove duplicates, fill missing values, fix types

/data-validator
→ Verify data is clean

/format-converter
→ Convert to JSON for API import
```

---

### Use Case 3: "Generate Types from API Response"
**Problem**: Need TypeScript types for new API endpoint.

**Solution**:
```
/schema-generator
→ "Generate TypeScript interface from response.json"

Result: Complete, accurate TypeScript interface ready to use
```

---

### Use Case 4: "Merge Customer and Order Data"
**Problem**: Need to join two CSV files for analysis.

**Solution**:
```
/csv-transform
→ "Merge customers.csv and orders.csv on customer_id"

Result: Combined dataset with customer info and orders
```

---

### Use Case 5: "Convert Excel to JSON API Format"
**Problem**: Business team provides Excel, need JSON for API.

**Solution**:
```
/format-converter
→ "Convert products.xlsx to JSON"

/json-query
→ Reshape to match API structure

/data-validator
→ Validate against API schema
```

## What Makes Data Converter Different

### vs. Manual Processing
- **Manual**: Write custom scripts for each transformation
- **Data Converter**: Natural language commands, instant results

### vs. jq/csvkit
- **CLI Tools**: Requires learning complex syntax
- **Data Converter**: Conversational interface, more accessible

### vs. Excel/Google Sheets
- **Spreadsheets**: Manual point-and-click, limited automation
- **Data Converter**: Scriptable, reproducible, handles larger files

### vs. Python Pandas
- **Pandas**: Write code, set up environment, debug
- **Data Converter**: Describe what you want, get results immediately

### vs. Online Converters
- **Online Tools**: Upload sensitive data, limited features
- **Data Converter**: Local processing, comprehensive capabilities

## Performance & Limits

### File Size Handling
- **Small files** (<1MB): Instant processing
- **Medium files** (1-100MB): Efficient in-memory processing
- **Large files** (>100MB): Streaming support for CSV/JSON
- **Very large files** (>1GB): Chunked processing with progress

### Best Practices
- For very large JSON files, use /json-query to filter first
- CSV files with millions of rows process via streaming
- Large transformations auto-save intermediate results
- Memory usage warnings for files >500MB

## Plugin Structure

```
data-converter/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── commands/
│   ├── json-query.md            # JSON transformation
│   ├── csv-transform.md         # CSV processing
│   ├── format-converter.md      # Format conversion
│   ├── data-validator.md        # Data validation
│   └── schema-generator.md      # Schema generation
└── README.md                     # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins feature
- Node.js recommended for optimal performance (auto-detected)

## Supported Data Formats

| Format | Read | Write | Query | Validate | Convert From | Convert To |
|--------|------|-------|-------|----------|--------------|------------|
| JSON   | ✓    | ✓     | ✓     | ✓        | All          | All        |
| CSV    | ✓    | ✓     | ✓     | ✓        | JSON, Excel  | All        |
| YAML   | ✓    | ✓     | ✓     | ✓        | JSON, TOML   | JSON, TOML |
| XML    | ✓    | ✓     | ✗     | ✓        | JSON         | JSON       |
| TOML   | ✓    | ✓     | ✗     | ✓        | JSON, YAML   | JSON, YAML |
| Excel  | ✓    | ✓     | ✗     | ✗        | CSV, JSON    | CSV, JSON  |
| JSONL  | ✓    | ✓     | ✓     | ✓        | JSON         | JSON       |

## Common Questions

### "Can I process multiple files at once?"
Yes! Commands can process multiple files, merge them, or batch convert.

### "Does it handle large files?"
Yes, files up to several GB are supported via streaming for CSV/JSONL.

### "Is my data sent anywhere?"
No, all processing happens locally in your environment.

### "Can I automate repetitive transformations?"
Yes, all commands are scriptable and can be chained together.

### "What if I don't know the data structure?"
Use /json-query or /csv-transform to explore and preview first.

### "Can it handle malformed data?"
Yes, validation reports issues and suggests fixes.

## Tips & Tricks

### Quick Exploration
```
/json-query → "Show me the structure of data.json"
/csv-transform → "Preview first 10 rows of data.csv"
```

### Chaining Operations
```
/json-query → Extract and filter
/data-validator → Check quality
/format-converter → Convert to needed format
```

### Type Safety Workflow
```
/schema-generator → Generate TypeScript types
/data-validator → Create runtime validator
Use both in your application
```

### Migration Checklist
```
1. /data-validator → Validate source
2. /format-converter → Convert format
3. /csv-transform → Transform structure
4. /data-validator → Validate target
5. Import
```

## Managing the Plugin

To disable the plugin temporarily:
```bash
/plugin disable data-converter
```

To enable it again:
```bash
/plugin enable data-converter
```

To uninstall completely:
```bash
/plugin uninstall data-converter
```

## Contributing

Contributions are welcome! To improve Data Converter:

1. Fork the repository
2. Create a feature branch
3. Make your changes to command files in `commands/`
4. Test with various data formats and sizes
5. Submit a pull request

### Ideas for Contributions:
- Add new data format support (Parquet, Avro, Protocol Buffers)
- Enhance validation rules
- Add more transformation patterns
- Improve performance for large files
- Add visualization capabilities

## License

MIT

## Version

1.0.0

## Acknowledgments

Inspired by powerful CLI data tools:
- **jq** - JSON query and transformation
- **csvkit** - CSV processing suite
- **yq** - YAML/XML query tool
- **miller** - Name-indexed data processing

Built for developers who work with data every day and need fast, reliable transformations without leaving their development environment.

---

**Stop wrestling with data formats. Let Data Converter handle it.**

Made with precision for the Claude Code community 🔧
