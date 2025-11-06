---
description: Automated documentation generation system
---

# Auto-Documentation System

Comprehensive system for automatically generating and maintaining documentation across the codebase.

## Components

### 1. API Documentation Generator
Automatically generates API documentation from server actions and route handlers.

```typescript
// Extracts from actions.ts files:
- Function signatures
- Parameter types (from Zod schemas)
- Return types
- Error handling
- Multi-tenant requirements
```

### 2. Component Documentation
Generates documentation for React components:

```typescript
// Extracts from components:
- Props interfaces
- Component purpose (from comments)
- Usage examples
- Dependencies
- State management
```

### 3. README Generator
Maintains feature-specific README files:

```markdown
# Feature: Student Management

## Overview
[Auto-generated from content.tsx header comments]

## API Endpoints
[Generated from actions.ts]

## Components
[Component hierarchy and relationships]

## Database Schema
[Relevant Prisma models]

## Testing
[Test coverage and important tests]
```

### 4. Changelog Automation
Tracks changes automatically:

```markdown
## [2024-01-15] - abc123
### Added
- Student search functionality (STORY-005)
### Changed
- Improved query performance
### Fixed
- Multi-tenant scoping issue
```

## Triggers

### On File Change
When specific files change, regenerate docs:

```javascript
const docTriggers = {
  'actions.ts': 'api-docs',
  'content.tsx': 'component-docs',
  'validation.ts': 'schema-docs',
  'schema.prisma': 'database-docs',
  '*.test.tsx': 'test-docs'
}
```

### On Commit
Post-commit hook updates:
- Changelog
- Coverage reports
- Metrics dashboard

### On Build
Pre-build documentation validation:
- Check for missing docs
- Verify examples compile
- Update API references

## Documentation Structure

```
docs/
├── api/                 # API documentation
│   ├── students.md
│   ├── attendance.md
│   └── ...
├── components/          # Component docs
│   ├── platform/
│   └── ui/
├── database/           # Schema documentation
│   ├── models.md
│   └── migrations.md
├── architecture/       # System design docs
│   ├── multi-tenant.md
│   └── patterns.md
├── guides/            # User guides
│   ├── getting-started.md
│   └── deployment.md
└── reference/         # Reference docs
    ├── commands.md
    └── agents.md
```

## Template System

### API Template
```markdown
# {{endpoint}}

## Method: {{method}}

### Description
{{description}}

### Parameters
{{#parameters}}
- `{{name}}`: {{type}} - {{description}}
{{/parameters}}

### Returns
```typescript
{{returnType}}
```

### Example
```typescript
{{example}}
```

### Multi-Tenant Requirements
- Requires `schoolId` in context
- Scoped to current tenant

### Error Handling
{{errorCases}}
```

### Component Template
```markdown
# {{componentName}}

## Purpose
{{purpose}}

## Props
```typescript
{{propsInterface}}
```

## Usage
```tsx
{{usageExample}}
```

## Dependencies
{{dependencies}}

## Test Coverage
{{coverage}}%
```

## Generation Process

### 1. Parse Source Files
```typescript
async function parseSourceFile(file: string) {
  const ast = parse(file)
  return {
    functions: extractFunctions(ast),
    types: extractTypes(ast),
    comments: extractComments(ast)
  }
}
```

### 2. Extract Metadata
```typescript
function extractMetadata(parsed) {
  return {
    description: parsed.comments.header,
    parameters: parsed.functions.map(f => f.params),
    returns: parsed.functions.map(f => f.returnType),
    examples: parsed.comments.examples
  }
}
```

### 3. Generate Documentation
```typescript
function generateDocs(metadata, template) {
  return template.render(metadata)
}
```

### 4. Write Documentation
```typescript
async function writeDocs(content, path) {
  await fs.writeFile(path, content)
  await updateIndex(path)
  await validateLinks(path)
}
```

## Validation

### Documentation Linting
- Check for broken links
- Verify code examples compile
- Ensure consistent formatting
- Validate API signatures

### Coverage Requirements
- All public APIs documented
- All components have usage examples
- All features have README files
- All commands have help text

## Integration Points

### VS Code Extension
- IntelliSense for documented APIs
- Hover documentation
- Go to documentation

### CI/CD Pipeline
- Documentation generation on push
- Documentation deployment to docs site
- Breaking change detection

### Search Index
- Auto-index all documentation
- Full-text search capability
- Tag-based navigation

## Metrics

Track documentation health:
```json
{
  "coverage": {
    "apis": 98,
    "components": 95,
    "features": 100
  },
  "quality": {
    "brokenLinks": 0,
    "outOfDate": 3,
    "missingExamples": 5
  },
  "usage": {
    "searches": 1234,
    "views": 5678,
    "helpful": 89
  }
}
```

## Commands

### Generate All Docs
```bash
/docs generate-all
```

### Update Specific Feature
```bash
/docs update students
```

### Validate Documentation
```bash
/docs validate
```

### Build Search Index
```bash
/docs index-rebuild
```

## Best Practices

1. **Keep docs close to code** - Documentation in same directory as code
2. **Use JSDoc comments** - Extract documentation from code comments
3. **Automate everything** - No manual documentation updates
4. **Version control** - Track documentation changes with code
5. **Test examples** - Ensure all examples actually work
6. **Link everything** - Cross-reference related documentation
7. **Stay DRY** - Single source of truth for each piece of information

## Output Formats

### Markdown (Default)
For GitHub, documentation sites

### JSON
For API consumers, search indexes

### HTML
For static documentation sites

### PDF
For offline documentation

## Configuration

```json
{
  "autoDoc": {
    "enabled": true,
    "triggers": ["commit", "build", "save"],
    "formats": ["markdown", "json"],
    "templates": ".claude/documentation/templates/",
    "output": "docs/",
    "validation": {
      "requireExamples": true,
      "checkLinks": true,
      "enforceStyle": true
    }
  }
}
```