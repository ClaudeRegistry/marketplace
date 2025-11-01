# LogicScope

Extract and understand business logic from legacy codebases without documentation or handover. Perfect for inherited projects, legacy systems, or undocumented code.

## Purpose

LogicScope solves the critical problem of understanding legacy code when you have:
- No developer handover
- No product owner to explain requirements
- No documentation
- Complex business logic buried in code
- Hidden dependencies and implicit contracts

This plugin helps you reverse-engineer the business logic, discover what the system actually does, and understand hidden rules and workflows that aren't obvious from reading code.

## The Problem

You inherit a codebase and need to answer:
- What does this system actually do?
- What are the business rules?
- What workflows exist?
- What are the hidden dependencies?
- Where is critical business logic?
- How does data flow through the system?

Traditional documentation tools won't help because there's no documentation to maintain. You need to extract knowledge from the code itself.

## Features

- **Business Logic Mapping**: Extract all business rules, validations, calculations, and workflows
- **Domain Discovery**: Rapidly identify business domains, entities, and relationships
- **Workflow Tracing**: Follow complete end-to-end workflows through all code layers
- **Hidden Dependencies**: Uncover implicit contracts, magic values, and non-obvious couplings
- **Data Flow Analysis**: Trace how data moves and transforms through the system
- **Plain Business Language**: Everything explained in terms business people can understand

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install LogicScope:

```bash
/plugin install logicscope
```

Or use the interactive browser:

```bash
/plugin
```

## Commands

### /business-logic-map

Extract and map all business logic, rules, and workflows from the codebase.

```
/business-logic-map
```

**Perfect for:**
- Understanding what business rules are implemented
- Finding hidden logic buried in code
- Identifying all validations, calculations, and workflows
- Creating a comprehensive business logic inventory

**What you get:**
- Complete catalog of all business rules by type (validation, calculation, authorization, etc.)
- Hidden logic detection (magic numbers, implicit rules, side effects)
- Business workflow documentation
- Data transformation logic
- Integration and external system mapping
- Undocumented logic flagged for review

**Use this when:**
- You're new to a codebase and need to understand what it does
- Business rules aren't documented
- You need to modify logic but don't want to break things
- Compliance audit requires documenting business rules

### /domain-discovery

Discover and map business domains, entities, and their relationships.

```
/domain-discovery
```

**Perfect for:**
- Quick orientation in an unfamiliar codebase
- Understanding the business model
- Identifying core entities and how they relate
- Creating a business glossary

**What you get:**
- All business entities identified and described
- Entity relationships mapped with diagrams
- Business domains and their boundaries
- API surface inventory
- Entity lifecycle and state machines
- Business terminology glossary
- Architecture pattern detection

**Use this when:**
- You need a high-level overview of what the system does
- Starting to work on a new domain
- Need to explain the system to others
- Planning architectural changes

### /workflow-tracer

Trace complete workflows and user journeys through the codebase.

```
/workflow-tracer [workflow-name]
```

**Perfect for:**
- Understanding how a specific feature works
- Following user journeys step-by-step
- Debugging complex workflows
- Impact analysis before making changes

**What you get:**
- Step-by-step execution flow with code references
- Data transformations at each step
- Decision points and branching logic
- Side effects and cascading actions
- Error handling and failure paths
- Performance analysis and bottlenecks
- Complete sequence diagrams

**Use this when:**
- Need to understand a specific feature
- Debugging a workflow issue
- Planning to modify a process
- Need to estimate change impact

**Example usage:**
```
/workflow-tracer user registration
/workflow-tracer checkout process
/workflow-tracer order approval
```

### /hidden-dependencies

Discover hidden dependencies, implicit contracts, and non-obvious couplings.

```
/hidden-dependencies
```

**Perfect for:**
- Finding why things break unexpectedly
- Understanding change risk
- Identifying refactoring opportunities
- Reducing technical debt

**What you get:**
- Global state dependencies
- Implicit data contracts
- Ordering and temporal dependencies
- Magic values and configuration dependencies
- Database schema assumptions
- External system contracts
- Transitive dependencies
- Shared mutable data analysis

**Use this when:**
- Changes in one area break another unexpectedly
- Code is hard to test
- Planning major refactoring
- Assessing risk before changes

### /data-flow-analysis

Trace how data flows through the system from input to output.

```
/data-flow-analysis [entity-name]
```

**Perfect for:**
- Understanding data pipelines
- Tracking data transformations
- Ensuring data quality
- Compliance and audit requirements

**What you get:**
- All data entry points
- Complete transformation pipeline
- Storage locations and schemas
- Access patterns and queries
- Data mutations and lifecycle
- Output destinations
- Data quality validation
- Dependency analysis

**Use this when:**
- Need to understand data transformations
- Debugging data issues
- Compliance requirements (GDPR, etc.)
- Optimizing data flow

**Example usage:**
```
/data-flow-analysis User
/data-flow-analysis Order
/data-flow-analysis Payment
```

## Typical Workflow

### Day 1: Inheriting a Legacy Codebase

You just inherited a codebase with zero documentation. Here's how to get oriented:

**1. Start with Domain Discovery** (15-30 minutes)
```
/domain-discovery
```
This gives you the 10,000-foot view: what business domains exist, what entities the system manages, and how they relate.

**2. Deep Dive into Business Logic** (1-2 hours)
```
/business-logic-map
```
Now understand what business rules are actually implemented. This reveals the "what" and "why" of the system.

**3. Trace Critical Workflows** (30 minutes each)
```
/workflow-tracer checkout process
/workflow-tracer order fulfillment
```
Pick 2-3 critical workflows and trace them end-to-end to understand how the system actually works.

### Week 1: Before Making Changes

**1. Identify Hidden Dependencies**
```
/hidden-dependencies
```
Before changing anything, understand what depends on what. This prevents "I changed X and Y broke" scenarios.

**2. Trace Data Flow for Affected Entities**
```
/data-flow-analysis User
```
If your change affects specific data, understand its complete journey through the system.

### Ongoing: Maintenance and Enhancement

- Run `/domain-discovery` when entering a new area of the codebase
- Run `/workflow-tracer` before modifying any workflow
- Run `/hidden-dependencies` before major refactoring
- Run `/data-flow-analysis` when debugging data issues

## Real-World Scenarios

### Scenario 1: "Fix this bug in the checkout process"

**Problem**: You need to fix a checkout bug but don't understand the checkout logic.

**Solution**:
```
/workflow-tracer checkout process
```

**Result**: Complete step-by-step understanding of checkout, including all business rules, validations, and side effects. You can confidently make the fix without breaking other parts.

---

### Scenario 2: "The system is doing something, but we don't know what business rules it's enforcing"

**Problem**: Need to document business rules for compliance audit.

**Solution**:
```
/business-logic-map
```

**Result**: Comprehensive catalog of all business rules, validations, calculations, and workflows. Perfect for audit documentation.

---

### Scenario 3: "I changed the User model and now Orders are broken"

**Problem**: Hidden dependencies aren't obvious.

**Solution**:
```
/hidden-dependencies
```

**Result**: Clear mapping of all implicit dependencies, showing exactly how User changes affect Orders and what else might break.

---

### Scenario 4: "Customer data is wrong, but we don't know where it's being modified"

**Problem**: Data is being transformed somewhere, but you don't know where.

**Solution**:
```
/data-flow-analysis Customer
```

**Result**: Complete trace of Customer data from entry to storage to output, showing all transformations and modifications.

---

### Scenario 5: "New team member needs to understand the system"

**Problem**: Onboarding without documentation.

**Solution**:
```
/domain-discovery
/business-logic-map
```

**Result**: New team member gets comprehensive overview of business domains and logic, equivalent to weeks of code reading.

## What Makes LogicScope Different

### vs. Code Documentation Tools
- **Documentation tools** maintain existing docs
- **LogicScope** extracts knowledge from code when no docs exist

### vs. Code Search/Grep
- **Search tools** find code
- **LogicScope** explains business logic in plain language

### vs. Architecture Diagrams
- **Architecture tools** show structure
- **LogicScope** reveals business rules and workflows

### vs. Static Analysis
- **Static analysis** finds bugs
- **LogicScope** explains what the business logic does and why

## Plugin Structure

```
logicscope/
├── commands/
│   ├── business-logic-map.md       # Extract all business logic
│   ├── domain-discovery.md         # Discover domains and entities
│   ├── workflow-tracer.md          # Trace workflows step-by-step
│   ├── hidden-dependencies.md      # Find implicit dependencies
│   └── data-flow-analysis.md       # Trace data through system
└── README.md                        # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins feature
- Access to the codebase you want to analyze

## Best Practices

### Start Broad, Then Go Deep
1. `/domain-discovery` - Understand what domains exist
2. `/business-logic-map` - Learn what rules are implemented
3. `/workflow-tracer` - Deep dive into specific workflows

### Before Every Change
- Run `/hidden-dependencies` to understand risk
- Run `/workflow-tracer` for workflows you'll modify
- Run `/data-flow-analysis` for data you'll change

### For Team Knowledge Sharing
- Run commands and save output as documentation
- Use the generated Mermaid diagrams in wikis
- Share business logic maps with product team
- Use for onboarding new developers

### For Legacy System Modernization
1. Map all business logic first
2. Identify domain boundaries
3. Trace critical workflows
4. Find hidden dependencies
5. Plan migration with full understanding

## Command Comparison

| Command | Time to Run | Best For | Output Type |
|---------|-------------|----------|-------------|
| `/domain-discovery` | 15-30 min | High-level overview | Entities, relationships, domains |
| `/business-logic-map` | 1-2 hours | Complete business rule catalog | Rules by category, workflows |
| `/workflow-tracer` | 30-60 min | Understanding specific feature | Step-by-step flow, diagrams |
| `/hidden-dependencies` | 1-2 hours | Risk assessment | Dependency types, impact map |
| `/data-flow-analysis` | 30-60 min | Data pipeline understanding | Transformations, storage, access |

## Success Stories

### E-commerce Platform Migration
**Challenge**: 10-year-old Rails app with zero documentation, original developers gone.

**Solution**: Used LogicScope to map all business logic before migration.

**Result**:
- Discovered 47 business rules not mentioned in requirements
- Found 12 hidden dependencies that would have broken in migration
- Completed migration with zero business logic bugs

### Financial System Audit
**Challenge**: Compliance audit required documenting all business rules.

**Solution**: `/business-logic-map` to extract and document all rules.

**Result**:
- Generated complete business rule catalog in 2 hours
- Found 5 undocumented validation rules
- Passed audit with comprehensive documentation

### New Team Onboarding
**Challenge**: 3 new developers needed to understand complex domain quickly.

**Solution**: `/domain-discovery` + `/workflow-tracer` for critical flows.

**Result**:
- Developers productive in days instead of weeks
- Avoided common pitfalls from hidden dependencies
- Confident making changes after 1 week

## Troubleshooting

### "Command takes too long to run"
LogicScope commands analyze entire codebases, which takes time. Start with smaller scopes:
- Use `/workflow-tracer` for specific workflows
- Use `/data-flow-analysis` for specific entities
- Run `/domain-discovery` first to identify areas to focus on

### "Output is overwhelming"
- Start with `/domain-discovery` for overview
- Then use specific commands for areas you need to understand
- Focus on one domain at a time

### "Can't find specific business logic"
- Check if logic is in frontend vs backend
- Look for business rules in configuration
- Check database constraints and triggers

## Contributing

Contributions are welcome! To improve LogicScope:

1. Fork the repository
2. Create a feature branch
3. Make your changes to command files in `commands/`
4. Test with various legacy codebases
5. Submit a pull request

### Command Development

Commands are markdown files with:
- **Frontmatter**: Metadata (description, arguments)
- **Instructions**: Detailed prompt for Claude Code to execute

See existing commands for examples.

## Version

1.0.0

## License

MIT

## Acknowledgments

Built for developers who inherit legacy code without documentation. Inspired by the common scenario of "the original developer is gone and nobody knows what this does."

---

**Stop guessing what legacy code does. Use LogicScope to extract the knowledge.**

Made with understanding for the Claude Code community
