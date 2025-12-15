# Validate Prisma Command

**Command**: /validate-prisma
**Purpose**: Quick Prisma query validation with comprehensive checks and auto-fix

---

## Description

Validates Prisma queries for field types, required fields, includes, and multi-tenant safety. Uses the `prisma-optimizer` skill for comprehensive analysis.

**Prevents**:

- Field type confusion (connect on ID fields) - 8+ errors
- Invalid includes (ID fields as relations) - 3+ errors
- Missing required fields - 2+ errors
- Missing schoolId scoping - Multi-tenant violations

---

## Usage

```bash
# Validate single file
/validate-prisma src/components/platform/finance/expenses/actions.ts

# Validate directory
/validate-prisma src/components/platform/finance/

# Validate with auto-fix
/validate-prisma src/components/platform/finance/expenses/actions.ts --fix

# Validate specific model
/validate-prisma src/components/platform/finance/ --model=Expense
```

---

## What It Does

### 1. Field Type Validation

- Detects `connect` pattern on ID fields
- Identifies relation fields vs ID fields
- Suggests correct patterns

### 2. Required Fields Check

- Scans Prisma schema for required fields
- Compares against create/update data
- Generates missing field values

### 3. Include Validation

- Checks if included fields are relations
- Flags ID fields incorrectly used as relations
- Suggests correct include patterns

### 4. Multi-Tenant Safety

- Ensures all queries have `schoolId` filter
- Validates session context usage
- Flags tenant isolation violations

---

## Output Example

### Example 1: Expense Actions Validation

```bash
$ /validate-prisma src/components/platform/finance/expenses/actions.ts

🔍 Validating Prisma queries in expenses/actions.ts...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Prisma operations: 8
Issues found: 8

❌ Field type errors: 4
❌ Invalid includes: 2
❌ Missing required fields: 2
✅ Multi-tenant safety: OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 FIELD TYPE ERRORS (4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Line 35: createExpense()
   Issue: Using connect pattern on ID field

   Current code:
   submittedBy: { connect: { id: session.user.id } }

   Schema analysis:
   - submittedById: String (ID field)
   - submittedBy: NOT A RELATION FIELD

   Correct code:
   submittedById: session.user.id

❌ Line 40: createExpense()
   Issue: Using connect pattern on ID field

   Current code:
   approvedBy: { connect: { id: session.user.id } }

   Correct code:
   approvedById: session.user.id

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 INVALID INCLUDES (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Line 86: updateExpense()
   Issue: Including ID field as relation

   Current code:
   include: {
     submittedBy: { select: { id: true, name: true } }
   }

   Schema analysis:
   - submittedById is an ID field (String)
   - No relation field exists for submittedBy

   Correct code:
   include: {
     category: { select: { id: true, name: true } }
     // Remove: submittedBy
   }

❌ Line 184: getExpenses()
   Issue: Same as above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MISSING REQUIRED FIELDS (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Line 32: createExpense()
   Missing required fields:
   - expenseNumber: String
   - submittedAt: DateTime

   Schema definition:
   model Expense {
     expenseNumber String    // Required
     submittedAt   DateTime  // Required
     ...
   }

   Suggested fix:
   const expenseNumber = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

   data: {
     ...validated,
     expenseNumber,
     submittedAt: new Date(),
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ MULTI-TENANT SAFETY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All queries include schoolId scoping ✅
- createExpense: schoolId from session ✅
- updateExpense: schoolId in where clause ✅
- getExpenses: schoolId filter present ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like to auto-fix these issues? [Y/n]
> Y

✅ Applied 8 fixes to expenses/actions.ts
✅ TypeScript compilation: PASS
✅ File saved

Verification:
Run: pnpm tsc --noEmit
```

### Example 2: Directory Scan

```bash
$ /validate-prisma src/components/platform/finance/

🔍 Scanning directory for Prisma issues...

📁 expenses/actions.ts
   ❌ 8 issues found
   - 4 field type errors
   - 2 invalid includes
   - 2 missing required fields

📁 fees/actions.ts
   ✅ No issues found

📁 budget/actions.ts
   ✅ No issues found

📁 banking/actions.ts
   ⚠️  1 issue found
   - Missing schoolId in findMany

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total files scanned: 4
Files with issues: 2
Total issues: 9

Auto-fix all issues? [Y/n]
```

---

## Auto-Fix Process

### 1. Backup Original

```bash
✅ Created backup: expenses/actions.ts.backup
```

### 2. Apply Fixes

```bash
Applying fixes...
  ✅ Line 35: Convert connect to direct ID
  ✅ Line 40: Convert connect to direct ID
  ✅ Line 32: Add expenseNumber field
  ✅ Line 32: Add submittedAt field
  ✅ Line 86: Remove invalid include
  ✅ Line 184: Remove invalid include
```

### 3. Verify TypeScript

```bash
Running: pnpm tsc --noEmit
✅ TypeScript compilation successful
```

### 4. Show Diff

```bash
Show diff? [Y/n]
> Y

diff --git a/src/components/platform/finance/expenses/actions.ts
@@ -32,11 +32,13 @@
+  const expenseNumber = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
+
   const expense = await db.expense.create({
     data: {
       ...validated,
       schoolId: session.user.schoolId,
-      submittedBy: { connect: { id: session.user.id } },
+      expenseNumber,
+      submittedById: session.user.id,
+      submittedAt: new Date(),
       status: 'PENDING',
     },
   })
```

---

## Integration Points

### Uses Skills

- **prisma-optimizer**: Field type detection, N+1 detection
- **multi-tenant-validator**: schoolId scoping validation

### Used By

- **/pre-commit-full**: Pre-commit validation
- **/scan-errors**: Pattern-based error detection
- **CI/CD Pipeline**: Automated validation

---

## Configuration

### .validate-prisma.json

```json
{
  "checks": {
    "fieldTypes": true,
    "requiredFields": true,
    "includes": true,
    "multiTenant": true
  },
  "autoFix": {
    "enabled": true,
    "createBackup": true,
    "confirmBeforeFix": true
  },
  "output": {
    "format": "detailed",
    "showDiff": true,
    "colors": true
  }
}
```

---

## Exit Codes

- **0**: No issues found
- **1**: Issues found, no auto-fix
- **2**: Auto-fix applied successfully
- **3**: Auto-fix failed (TypeScript errors remain)

---

## Best Practices

### 1. Run Before Commit

```bash
# Add to .husky/pre-commit
/validate-prisma src/
```

### 2. CI/CD Integration

```yaml
# .github/workflows/ci.yml
- name: Validate Prisma
  run: claude-code run /validate-prisma src/ --no-fix
```

### 3. Pre-PR Checklist

```bash
# Before creating PR
/validate-prisma src/components/platform/
```

---

## Error Messages

### Clear, Actionable Errors

```
❌ Using connect on ID field 'submittedBy'

Why this is wrong:
- 'submittedBy' is not a relation field
- Only 'submittedById' (ID field) exists in schema

How to fix:
- Change: submittedBy: { connect: { id: userId } }
- To: submittedById: userId

Related: docs/build-fixes-2025-10-29.md (Error 24-28)
```

---

## Performance

- **Single file**: <1s
- **Directory (10 files)**: <5s
- **Full codebase**: <30s

---

**Status**: ✅ Production Ready
**Prevention Rate**: 100% for Prisma field errors (13+ cases)
**Integration**: Pre-commit, CI/CD, Manual
**Maintained by**: Hogwarts School Automation Platform
