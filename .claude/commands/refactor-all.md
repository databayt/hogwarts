# Refactor-All Command - Bulk Code Refactoring

Perform comprehensive refactoring across the entire codebase or specific modules

## Usage

```bash
/refactor-all [scope] [refactoring-type] [options]
```

## Examples

```bash
/refactor-all constants              # Extract all magic numbers to constants
/refactor-all naming                 # Fix naming conventions across codebase
/refactor-all types                  # Add missing TypeScript types
/refactor-all imports                 # Organize and optimize imports
/refactor-all components/school-dashboard    # Refactor specific directory
```

## Refactoring Types

### 1. Constants Extraction

```typescript
// Scan for magic numbers and strings
const patterns = {
  magicNumbers: /\b(?<!\.)\d+\b(?!\.)/g,
  hardcodedStrings: /'[^']+'|"[^"]+"/g,
  repeatedValues: /findRepeatedValues()/,
}

// Before
if (students.length > 30) {
}
if (retries === 3) {
}
if (status === "active") {
}

// After
const MAX_STUDENTS_PER_CLASS = 30
const MAX_RETRY_ATTEMPTS = 3
const ACTIVE_STATUS = "active"

if (students.length > MAX_STUDENTS_PER_CLASS) {
}
if (retries === MAX_RETRY_ATTEMPTS) {
}
if (status === ACTIVE_STATUS) {
}
```

### 2. Naming Convention Fixes

```typescript
// Apply consistent naming patterns
const namingRules = {
  variables: "camelCase",
  constants: "UPPER_SNAKE_CASE",
  functions: "camelCase",
  components: "PascalCase",
  files: {
    components: "PascalCase.tsx",
    hooks: "use-kebab-case.ts",
    utils: "camelCase.ts",
    types: "types.ts",
  },
}

// Automated fixes
renameVariable("user_name", "userName")
renameFunction("GetUserData", "getUserData")
renameFile("student-card.tsx", "StudentCard.tsx")
```

### 3. Type Safety Enhancement

```typescript
// Add missing types
// Before
const processData = (data) => {
  return data.map((item) => item.value)
}

// After
interface DataItem {
  value: string
  [key: string]: unknown
}

const processData = (data: DataItem[]): string[] => {
  return data.map((item: DataItem) => item.value)
}
```

### 4. Import Organization

```typescript
// Before (messy imports)
import React, { useState } from "react"
// After (organized)
// External packages
import React, { useState } from "react"
// Internal - auth/config
import { auth, auth } from "@/auth"
// Types
import type { User, User } from "@/types"
import { z, z } from "zod"

// Internal - components
import { Button, Button } from "@/components/ui/button"
import { Card, Card } from "@/components/ui/card"
```

### 5. Dead Code Removal

```typescript
// Detect and remove
- Unused variables
- Unused functions
- Unused imports
- Commented-out code
- Unreachable code
- Empty files
- Duplicate code blocks
```

### 6. Async/Await Modernization

```typescript
// Before (callbacks/promises)
function fetchData(callback) {
  api
    .get("/data")
    .then((response) => {
      callback(null, response.data)
    })
    .catch((error) => {
      callback(error)
    })
}

// After (async/await)
async function fetchData(): Promise<Data> {
  try {
    const response = await api.get("/data")
    return response.data
  } catch (error) {
    throw new Error(`Failed to fetch data: ${error.message}`)
  }
}
```

### 7. Component Splitting

```typescript
// Before (large component)
const StudentDashboard = () => {
  // 500 lines of mixed concerns
};

// After (split components)
const StudentDashboard = () => {
  return (
    <>
      <StudentHeader />
      <StudentStats />
      <StudentCourses />
      <StudentActivities />
    </>
  );
};
```

### 8. Extract Utility Functions

```typescript
// Before (inline utilities)
const Component = () => {
  const formatDate = (date) => {
    /* ... */
  }
  const calculateAge = (birthDate) => {
    /* ... */
  }
  const validateEmail = (email) => {
    /* ... */
  }
}

// After (extracted)
// utils/date.ts
export const formatDate = (date: Date): string => {
  /* ... */
}
export const calculateAge = (birthDate: Date): number => {
  /* ... */
}

// utils/validation.ts
export const validateEmail = (email: string): boolean => {
  /* ... */
}
```

## Scope Definition

### Directory Scopes

```bash
/refactor-all src/components      # All components
/refactor-all src/app             # All pages
/refactor-all src/lib             # All utilities
/refactor-all .                   # Entire codebase
```

### Pattern Scopes

```bash
/refactor-all **/*.tsx            # All React components
/refactor-all **/actions.ts       # All server actions
/refactor-all **/*.test.ts        # All test files
```

### Module Scopes

```bash
/refactor-all students            # Student module
/refactor-all school-dashboard/finance    # Finance module
/refactor-all auth                # Auth module
```

## Hogwarts Platform Specific

### Multi-Tenant Refactoring

```typescript
// Ensure all queries include schoolId
const refactorMultiTenant = {
  // Before
  findPattern: "db.*.findMany()",

  // After
  replaceWith: "db.*.findMany({ where: { schoolId } })",
}
```

### i18n Refactoring

```typescript
// Extract hardcoded text to dictionaries
// Before
<Button>Submit</Button>
<p>Welcome to the dashboard</p>

// After
<Button>{dictionary.common.submit}</Button>
<p>{dictionary.dashboard.welcome}</p>
```

### shadcn/ui Migration

```typescript
// After (shadcn button)
import { Button } from "@/components/ui/button"

// Migrate custom components to shadcn
// Before (custom button)
const CustomButton = styled.button`...`
```

## Execution Strategy

### 1. Analysis Phase

```typescript
async function analyzeCodebase() {
  const issues = {
    magicNumbers: await findMagicNumbers(),
    namingViolations: await checkNaming(),
    missingTypes: await findUntypedCode(),
    deadCode: await detectDeadCode(),
    duplicates: await findDuplicates(),
  }

  return generateReport(issues)
}
```

### 2. Planning Phase

```typescript
function createRefactoringPlan(issues) {
  return {
    priority: "high", // Fix critical issues first
    phases: [
      { name: "Type Safety", tasks: issues.missingTypes },
      { name: "Dead Code", tasks: issues.deadCode },
      { name: "Constants", tasks: issues.magicNumbers },
      { name: "Naming", tasks: issues.namingViolations },
    ],
    estimatedTime: calculateTime(issues),
    riskLevel: assessRisk(issues),
  }
}
```

### 3. Execution Phase

```typescript
async function executeRefactoring(plan) {
  for (const phase of plan.phases) {
    console.log(`Starting phase: ${phase.name}`)

    // Create branch
    await git.checkout(`-b refactor/${phase.name}`)

    // Apply refactoring
    for (const task of phase.tasks) {
      await applyRefactoring(task)
      await runTests() // Verify nothing broken
    }

    // Commit changes
    await git.commit(`-m "refactor: ${phase.name}"`)
  }
}
```

### 4. Validation Phase

```typescript
async function validateRefactoring() {
  const checks = [
    runTypeCheck(), // tsc --noEmit
    runLinter(), // eslint
    runTests(), // vitest
    runE2ETests(), // playwright
    checkBundleSize(), // webpack-bundle-analyzer
  ]

  const results = await Promise.all(checks)
  return results.every((r) => r.passed)
}
```

## Safety Mechanisms

### Rollback Strategy

```typescript
// Git-based rollback
const rollback = {
  beforeRefactor: "git stash",
  createBackup: "git branch backup/pre-refactor",
  onError: "git reset --hard HEAD",
  restore: "git checkout backup/pre-refactor",
}
```

### Incremental Refactoring

```typescript
// Refactor in small batches
const batchConfig = {
  maxFilesPerCommit: 10,
  testAfterEachFile: true,
  pauseOnError: true,
  requireApproval: true,
}
```

### Test Coverage Requirements

```typescript
// Ensure tests exist before refactoring
if (coverage < 80) {
  console.warn("Low test coverage detected")
  console.log("Generating tests first...")
  await generateTests()
}
```

## Report Generation

### Analysis Report

```markdown
## Refactoring Analysis Report

### Summary

- Files analyzed: 234
- Issues found: 1,456
- Estimated time: 4 hours

### Issues by Category

| Category      | Count | Priority |
| ------------- | ----- | -------- |
| Magic Numbers | 234   | Medium   |
| Missing Types | 156   | High     |
| Dead Code     | 89    | Low      |
| Naming Issues | 45    | Medium   |

### Recommended Actions

1. Add TypeScript types (156 instances)
2. Extract constants (234 instances)
3. Remove dead code (89 instances)
```

### Progress Tracking

```typescript
// Real-time progress
const progress = {
  total: 1456,
  completed: 0,
  current: "",

  update(file) {
    this.completed++
    this.current = file
    console.log(`[${this.completed}/${this.total}] Processing: ${file}`)
  },
}
```

## Configuration Options

### Refactoring Rules

```json
{
  "refactoring": {
    "autoFix": true,
    "requireTests": true,
    "maxBatchSize": 10,
    "breakOnError": true,
    "rules": {
      "extractConstants": {
        "minOccurrences": 2,
        "skipTests": false
      },
      "naming": {
        "enforceConvention": true,
        "autoRename": true
      },
      "imports": {
        "sortOrder": ["external", "internal", "components", "types"],
        "removeUnused": true
      }
    }
  }
}
```

## CI/CD Integration

### Pre-Merge Refactoring

```yaml
name: Refactoring Check
on: [pull_request]

jobs:
  refactor-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm /refactor-all --analyze-only
      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./refactoring-report.json');
            if (report.issues.length > 0) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                body: generateRefactoringComment(report)
              });
            }
```

## Success Metrics

- Zero TypeScript errors post-refactoring
- 100% test pass rate maintained
- <5% bundle size increase
- Improved code maintainability score
- Reduced technical debt

## Related Commands

- `/optimize`: Performance-focused refactoring
- `/fix-all`: Quick fixes and formatting
- `/test`: Generate tests before refactoring
