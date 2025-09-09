# Claude Code Configuration Guide for Tech Teams

## 🎯 Purpose
This guide establishes systematic practices for using Claude Code in our development workflow, ensuring consistency, quality, and efficiency across all team members.

## 📋 Table of Contents
1. [Git & GitHub Automation](#git--github-automation)
2. [Architecture Patterns](#architecture-patterns)
3. [Development Standards](#development-standards)
4. [Multi-Tenant Considerations](#multi-tenant-considerations)
5. [Testing & Quality](#testing--quality)
6. [Team Onboarding](#team-onboarding)

---

## 🔄 Git & GitHub Automation

### Branch Management Strategy

```bash
# Feature Development Flow
main → feature/[task-id]-description → PR → main

# Hotfix Flow
main → hotfix/[issue-id]-description → PR → main

# Release Flow
main → release/v[version] → PR → main
```

### Automated Git Commands

#### 1. Starting New Work
```bash
# Always start from updated main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/HMS-123-add-attendance-api

# Or for hotfixes
git checkout -b hotfix/BUG-456-fix-login-redirect
```

#### 2. Committing Changes
```bash
# Stage changes selectively
git add -p  # Interactive staging
git status  # Verify staged files

# Commit with conventional format
git commit -m "feat(attendance): add bulk marking endpoint

- Implement POST /api/attendance/bulk
- Add validation for student IDs
- Include timezone handling

HMS-123"
```

#### 3. Creating Pull Requests
```bash
# Push branch
git push -u origin feature/HMS-123-add-attendance-api

# Create PR using GitHub CLI
gh pr create \
  --title "feat(attendance): Add bulk marking API endpoint" \
  --body "## Summary
- Implements bulk attendance marking
- Adds proper validation
- Includes timezone support

## Testing
- [x] Unit tests added
- [x] Manual testing completed
- [x] No console errors

## Screenshots
[If applicable]

Closes HMS-123" \
  --base main \
  --assignee @me \
  --label "enhancement,backend"
```

#### 4. Post-Merge Cleanup
```bash
# After PR is merged
git checkout main
git pull origin main
git branch -d feature/HMS-123-add-attendance-api
git remote prune origin
```

### Commit Message Convention

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or fixes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat(auth): add OAuth2 integration with Google
fix(table): resolve pagination state sync issue
docs(api): update endpoint documentation
refactor(components): extract shared form logic
```

---

## 🏗️ Architecture Patterns

### Component Hierarchy (Bottom-Up)

```
1. UI (shadcn/ui)
   ↓
2. Atoms (2+ UI primitives)
   ↓
3. Templates (layouts)
   ↓
4. Blocks (+ client logic)
   ↓
5. Micro (+ backend)
   ↓
6. Apps (multiple Micros)
```

### Mirror Pattern (Mandatory)

```
src/
├── app/
│   └── students/
│       ├── page.tsx        # imports StudentsContent
│       └── layout.tsx
└── components/
    └── students/
        ├── content.tsx      # Main composition
        ├── actions.ts       # Server actions
        ├── validation.ts    # Zod schemas
        ├── type.ts         # TypeScript types
        ├── form.tsx        # Form components
        ├── column.tsx      # Table columns
        └── use-students.ts  # Custom hooks
```

### File Creation Rules

1. **NEVER create files unless absolutely necessary**
2. **ALWAYS prefer editing existing files**
3. **NEVER create documentation files proactively**
4. **Follow the mirror pattern strictly**

---

## 📐 Development Standards

### TypeScript Configuration

```typescript
// ALWAYS use strict typing
interface StudentData {
  id: string
  name: string
  schoolId: string  // ALWAYS include for multi-tenant
}

// NEVER use 'any'
// ❌ Bad
const processData = (data: any) => {}

// ✅ Good
const processData = (data: StudentData) => {}

// Use Zod inference
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})
type FormData = z.infer<typeof schema>
```

### Server Actions Pattern

```typescript
// actions.ts
"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createStudent(data: FormData) {
  // 1. Get session and schoolId
  const session = await auth()
  const schoolId = session?.user?.schoolId
  
  if (!schoolId) {
    throw new Error("Unauthorized")
  }
  
  // 2. Validate with Zod
  const validated = studentSchema.parse(data)
  
  // 3. Execute with tenant scope
  const student = await db.student.create({
    data: {
      ...validated,
      schoolId  // ALWAYS include
    }
  })
  
  // 4. Revalidate
  revalidatePath('/students')
  
  return { success: true, data: student }
}
```

### Form & Validation Pattern

```typescript
// validation.ts
export const studentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  grade: z.string(),
  dateOfBirth: z.date()
})

// form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema } from "./validation"

export function StudentForm() {
  const form = useForm({
    resolver: zodResolver(studentSchema)
  })
  
  // Implementation
}
```

### Component Standards

```typescript
// Use cn() for className merging
import { cn } from "@/lib/utils"

// ✅ Good
<div className={cn("flex gap-2", className)}>

// ❌ Bad
<div className={`flex gap-2 ${className}`}>

// Use shadcn/ui primitives
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Compose into atoms
export function SearchInput({ className, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2 top-2.5 h-4 w-4" />
      <Input className="pl-8" {...props} />
    </div>
  )
}
```

---

## 🏢 Multi-Tenant Considerations

### Database Queries (Critical)

```typescript
// ALWAYS scope by schoolId
// ✅ Good
const students = await db.student.findMany({
  where: {
    schoolId: session.user.schoolId,
    grade: filter.grade
  }
})

// ❌ Bad - Missing schoolId
const students = await db.student.findMany({
  where: {
    grade: filter.grade
  }
})
```

### Prisma Schema Pattern

```prisma
model Student {
  id        String   @id @default(cuid())
  schoolId  String   // Required
  name      String
  email     String
  
  school    School   @relation(fields: [schoolId], references: [id])
  
  @@unique([schoolId, email])  // Unique within tenant
  @@index([schoolId])          // Performance
}
```

---

## 🧪 Testing & Quality

### Pre-Commit Checklist

```bash
# 1. Run linting
pnpm lint

# 2. Run type checking
pnpm tsc --noEmit

# 3. Run tests
pnpm test

# 4. Format code
pnpm prettier --write .

# 5. Check for console.logs
git diff --cached | grep -i "console.log"
```

### Test Structure

```typescript
// component.test.tsx
import { render, screen } from '@testing-library/react'
import { StudentCard } from './student-card'

describe('StudentCard', () => {
  it('displays student information', () => {
    render(<StudentCard student={mockStudent} />)
    expect(screen.getByText(mockStudent.name)).toBeInTheDocument()
  })
  
  it('handles tenant context correctly', () => {
    // Test multi-tenant isolation
  })
})
```

---

## 👥 Team Onboarding

### Setting Up Claude Code

1. **Install Claude Desktop App**
   - Download from claude.ai/download
   - Sign in with company account

2. **Configure Project Context**
   - Open project folder in Claude Code
   - Ensure CLAUDE.md is present in root
   - Review architecture docs in `/docs`

3. **Essential Commands to Remember**

```bash
# Development
pnpm dev            # Start development server
pnpm build          # Build for production
pnpm lint           # Check code quality
pnpm test           # Run tests

# Database
pnpm prisma generate  # Generate Prisma client
pnpm db:seed         # Seed test data
```

### Best Practices for Claude Code

1. **Be Specific with Instructions**
   ```
   ❌ "Add a student form"
   ✅ "Add a student registration form in /components/students/form.tsx 
       following our validation pattern with name, email, and grade fields"
   ```

2. **Provide Context**
   ```
   ❌ "Fix the bug"
   ✅ "Fix the pagination bug in /components/table/hooks/use-data-table.ts 
       where page state doesn't sync with URL params"
   ```

3. **Use File References**
   ```
   ❌ "Update the config"
   ✅ "Update the table config in @src/components/table/config/data-table.ts 
       to add date range operators"
   ```

### Common Workflows

#### Adding a New Feature

1. Create branch following naming convention
2. Implement using mirror pattern
3. Include all required files (actions, validation, types)
4. Test with multi-tenant scope
5. Create PR with detailed description

#### Fixing a Bug

1. Create hotfix branch
2. Write failing test first
3. Implement fix
4. Verify all tests pass
5. Update related documentation if needed

#### Code Review with Claude

Ask Claude to:
- Review for multi-tenant safety
- Check TypeScript strict compliance
- Verify server action patterns
- Ensure proper validation
- Check for performance issues

---

## 📚 Quick Reference

### Import Aliases
```typescript
@/components/*   // Components
@/lib/*         // Utilities
@/app/*         // App routes
```

### Key Utilities
```typescript
cn()            // Merge Tailwind classes
auth()          // Get session
db              // Prisma client
```

### Environment Variables
```bash
DATABASE_URL    # Neon PostgreSQL
AUTH_SECRET     # NextAuth secret
NEXTAUTH_URL    # Auth callback URL
```

### Deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Linting clean
- [ ] Multi-tenant scope verified
- [ ] Migrations ready
- [ ] Environment variables set
- [ ] PR approved by 2 reviewers

---

## 🚨 Critical Rules

1. **NEVER** expose schoolId in URLs or client state
2. **ALWAYS** validate on both client and server
3. **NEVER** use `any` type
4. **ALWAYS** include schoolId in queries
5. **NEVER** create files unless necessary
6. **ALWAYS** follow the mirror pattern
7. **NEVER** commit directly to main
8. **ALWAYS** write tests for new features

---

## 📝 Template Responses for Claude Code

### Creating a New Feature
```
Create a [feature name] feature following our architecture:
- Mirror pattern: /app/[feature] and /components/[feature]
- Include: actions.ts, validation.ts, type.ts, form.tsx, content.tsx
- Multi-tenant: scope all queries by schoolId
- Use existing UI components from /components/ui
```

### Fixing Issues
```
Fix [issue description] in [file path]:
- Maintain existing patterns
- Add tests for the fix
- Preserve multi-tenant isolation
- Update related documentation if needed
```

### Code Review Request
```
Review this code for:
- Multi-tenant safety (schoolId scoping)
- TypeScript strict compliance
- Server action patterns
- Validation completeness
- Performance considerations
```

---

*Last Updated: [Current Date]*
*Version: 1.0.0*