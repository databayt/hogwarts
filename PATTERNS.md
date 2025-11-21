# Hogwarts Pattern Guide

This document defines the authoritative patterns and conventions for the Hogwarts codebase, following shadcn/ui v4 and Next.js 15 best practices.

## Table of Contents

- [Core Principles](#core-principles)
- [Component Patterns](#component-patterns)
- [Server Actions](#server-actions)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Multi-Tenant Patterns](#multi-tenant-patterns)
- [UI Components](#ui-components)
- [Forms & Validation](#forms--validation)
- [Data Tables](#data-tables)
- [Typography System](#typography-system)
- [Import Organization](#import-organization)

## Core Principles

1. **Copy-paste architecture** - Components are copied, not installed
2. **Composition over inheritance** - Build from primitives
3. **Server-first rendering** - Default to Server Components
4. **Type safety** - TypeScript strict mode everywhere
5. **Multi-tenant isolation** - Every query scoped by schoolId
6. **Semantic HTML** - Never use divs for text
7. **Semantic tokens** - Never hardcode colors
8. **Mirror pattern** - Routes mirror component folders

## Component Patterns

### Directory Structure (Mirror Pattern)

Every feature follows this structure:

```
src/
  app/[lang]/s/[subdomain]/(platform)/<feature>/
    page.tsx                 # Imports <Feature>Content
    layout.tsx              # Optional layout
    loading.tsx             # Loading state
    error.tsx              # Error boundary

  components/platform/<feature>/
    content.tsx            # Main server component
    actions.ts            # Server actions ("use server")
    validation.ts         # Zod schemas
    types.ts             # TypeScript types
    form.tsx            # Form component (client)
    table.tsx           # Data table (client)
    columns.tsx         # Column definitions
    list-params.ts      # Query parameters
    [sub-feature]/      # Nested features
```

### Server Component (content.tsx)

```tsx
// Server Component - Fetches data and renders UI
import { FeatureTable } from './table'
import { getFeatureData } from './actions'
import { getTenantContext } from '@/lib/tenant-context'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary?: Dictionary;
}

export default async function FeatureContent({
  searchParams,
  dictionary
}: Props) {
  // Get tenant context
  const { schoolId } = await getTenantContext()

  // Parse search params
  const params = await featureSearchParams.parse(await searchParams)

  // Fetch data with schoolId scope
  const data = await getFeatureData({
    schoolId,
    ...params
  })

  // Render client components with data
  return (
    <FeatureTable
      initialData={data}
      dictionary={dictionary}
    />
  )
}
```

### Client Component Pattern

```tsx
"use client"

import { useState, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"

export function FeatureTable({
  initialData,
  dictionary
}: {
  initialData: FeatureItem[];
  dictionary?: Dictionary;
}) {
  const [data, setData] = useState(initialData)

  // Generate columns in client component
  const columns = useMemo(
    () => getColumns(dictionary),
    [dictionary]
  )

  return (
    <DataTable
      columns={columns}
      data={data}
    />
  )
}
```

## Server Actions

### Basic Pattern

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";

// CREATE
export async function createItem(input: unknown) {
  // 1. Tenant validation (CRITICAL)
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Unauthorized");

  // 2. Input validation
  const parsed = createSchema.parse(input);

  // 3. Database operation with schoolId
  const item = await db.item.create({
    data: {
      ...parsed,
      schoolId, // ALWAYS include
    },
  });

  // 4. Cache revalidation
  revalidatePath("/items");

  // 5. Return typed result
  return { success: true as const, data: item };
}

// UPDATE (use updateMany for tenant safety)
export async function updateItem(input: unknown) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Unauthorized");

  const parsed = updateSchema.parse(input);
  const { id, ...data } = parsed;

  // updateMany ensures schoolId scope
  const result = await db.item.updateMany({
    where: { id, schoolId },
    data,
  });

  revalidatePath("/items");
  return { success: true as const };
}

// DELETE (use deleteMany for tenant safety)
export async function deleteItem(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Unauthorized");

  const { id } = z.object({ id: z.string() }).parse(input);

  // deleteMany ensures schoolId scope
  await db.item.deleteMany({
    where: { id, schoolId },
  });

  revalidatePath("/items");
  return { success: true as const };
}

// READ
export async function getItems(filters?: ItemFilters) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) return [];

  return db.item.findMany({
    where: {
      schoolId, // ALWAYS first
      ...filters,
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

### Error Handling Pattern

```typescript
export async function safeAction(input: unknown) {
  try {
    const parsed = schema.parse(input);
    const result = await operation(parsed);
    return { success: true as const, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: "Validation failed",
        issues: error.issues,
      };
    }
    console.error("Action failed:", error);
    return {
      success: false as const,
      error: "Operation failed",
    };
  }
}
```

## File Organization

### Feature Module Structure

```
components/platform/students/
  # Core files
  content.tsx          # Main server component
  actions.ts          # Server actions
  validation.ts       # Zod schemas
  types.ts           # TypeScript types

  # UI Components
  form.tsx           # Create/edit form
  table.tsx          # Data table
  columns.tsx        # Table columns
  card.tsx          # Card display

  # Sub-features
  enrollment/        # Enrollment feature
    content.tsx
    actions.ts
    form.tsx

  grades/           # Grades feature
    content.tsx
    actions.ts
    table.tsx

  # Configuration
  list-params.ts    # Query params
  config.ts        # Feature config
```

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StudentCard.tsx` |
| Server Actions | camelCase | `actions.ts` |
| Utilities | kebab-case | `get-tenant-context.ts` |
| Types | kebab-case | `types.ts` |
| Validation | kebab-case | `validation.ts` |
| Hooks | kebab-case | `use-student.ts` |
| Config | kebab-case | `config.ts` |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `function StudentCard() {}` |
| Functions | camelCase | `function getStudent() {}` |
| Variables | camelCase | `const studentName = ""` |
| Constants | UPPER_SNAKE | `const MAX_ITEMS = 100` |
| Types | PascalCase | `type StudentData = {}` |
| Interfaces | PascalCase + Props | `interface StudentCardProps {}` |
| Enums | PascalCase | `enum UserRole {}` |
| Hooks | camelCase + use | `function useStudent() {}` |

### Database & API

| Type | Convention | Example |
|------|------------|---------|
| Table names | PascalCase | `Student` |
| Column names | camelCase | `firstName` |
| Relations | camelCase | `students` |
| API routes | kebab-case | `/api/get-students` |
| Query params | camelCase | `?studentId=123` |

## Multi-Tenant Patterns

### Always Include schoolId

```typescript
// ❌ WRONG - No tenant isolation
const students = await db.student.findMany({
  where: { status: 'active' }
})

// ✅ CORRECT - Tenant isolated
const { schoolId } = await getTenantContext()
const students = await db.student.findMany({
  where: { schoolId, status: 'active' }
})
```

### Use Safe Update/Delete Methods

```typescript
// ❌ RISKY - Could affect other tenants
await db.student.update({
  where: { id },
  data: updates
})

// ✅ SAFE - Scoped to tenant
await db.student.updateMany({
  where: { id, schoolId },
  data: updates
})
```

### Unique Constraints

```prisma
model Student {
  id        String @id @default(cuid())
  email     String
  schoolId  String

  // Email unique per school, not globally
  @@unique([email, schoolId])
  @@index([schoolId])
}
```

## UI Components

### shadcn/ui Component Pattern

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        secondary: "secondary-classes",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ComponentProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof componentVariants> {
  asChild?: boolean;
}

const Component = React.forwardRef<
  HTMLDivElement,
  ComponentProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-slot="component"
      className={cn(componentVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Component.displayName = "Component"

export { Component, componentVariants }
```

### Semantic Token Usage

```tsx
// ❌ WRONG - Hardcoded colors
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// ✅ CORRECT - Semantic tokens
<div className="bg-background text-foreground">

// Token categories:
// Backgrounds: bg-background, bg-card, bg-muted, bg-accent
// Text: text-foreground, text-muted-foreground
// Borders: border-border, border-input
// Interactive: bg-primary, bg-secondary, bg-destructive
```

## Forms & Validation

### Validation Schema Pattern

```typescript
// validation.ts
import { z } from "zod"
import { getValidationMessages } from "@/components/internationalization/helpers"

// Factory function for i18n
export function createStudentSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    givenName: z.string().min(1, v.required()),
    surname: z.string().min(1, v.required()),
    email: z.string().email(v.email()),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, v.date()),
    gender: z.enum(["male", "female", "other"]),
  });
}

// Legacy schema for compatibility
export const studentSchema = z.object({
  givenName: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  dateOfBirth: z.string(),
  gender: z.enum(["male", "female", "other"]),
});

export type StudentFormData = z.infer<typeof studentSchema>;
```

### Form Component Pattern

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export function StudentForm({
  onSubmit,
  defaultValues,
  dictionary,
}: {
  onSubmit: (data: StudentFormData) => Promise<void>;
  defaultValues?: Partial<StudentFormData>;
  dictionary?: Dictionary;
}) {
  const schema = dictionary
    ? createStudentSchema(dictionary)
    : studentSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      givenName: "",
      surname: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="givenName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dictionary?.form?.givenName || "Given Name"}
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {dictionary?.form?.submit || "Submit"}
        </Button>
      </form>
    </Form>
  );
}
```

## Data Tables

### Column Definition Pattern

```tsx
// columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

export function getColumns(dictionary?: Dictionary): ColumnDef<StudentRow>[] {
  return [
    {
      accessorKey: "name",
      header: dictionary?.table?.name || "Name",
    },
    {
      accessorKey: "email",
      header: dictionary?.table?.email || "Email",
    },
    {
      accessorKey: "status",
      header: dictionary?.table?.status || "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
```

### Table Component Pattern

```tsx
// table.tsx
"use client"

import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"
import { useMemo } from "react"

export function StudentsTable({
  initialData,
  total,
  dictionary,
}: {
  initialData: StudentRow[];
  total: number;
  dictionary?: Dictionary;
}) {
  // Generate columns in client component
  const columns = useMemo(
    () => getColumns(dictionary),
    [dictionary]
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={initialData}
        total={total}
      />
    </div>
  );
}
```

## Typography System

### Semantic HTML Rules

```tsx
// ❌ WRONG - Never use divs for text
<div className="text-3xl font-bold">Page Title</div>
<div className="text-xl font-semibold">Section Title</div>
<div className="text-sm text-muted-foreground">Description</div>

// ✅ CORRECT - Use semantic HTML
<h1>Page Title</h1>
<h2>Section Title</h2>
<p className="muted">Description</p>

// Typography mapping:
// h1-h6: Headings (styled via typography.css)
// p: Paragraphs
// p.lead: Lead paragraphs
// p.muted: Muted text
// small: Small text
// strong: Bold text
// em: Italic text
```

## Import Organization

Standard import order:

```typescript
// 1. React/Next.js imports
import * as React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

// 2. External packages
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// 3. UI components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// 4. Internal components
import { StudentCard } from "@/components/platform/students/card"
import { StudentForm } from "@/components/platform/students/form"

// 5. Actions and utilities
import { createStudent } from "@/components/platform/students/actions"
import { cn } from "@/lib/utils"
import { db } from "@/lib/db"

// 6. Types and schemas
import type { Student } from "@/types/student"
import { studentSchema } from "@/components/platform/students/validation"

// 7. Styles (if needed)
import styles from "./styles.module.css"
```

## Query Parameters

### List Parameters Pattern

```typescript
// list-params.ts
import {
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  createSearchParamsCache
} from 'nuqs/server'

export const studentsSearchParams = createSearchParamsCache({
  // Pagination
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),

  // Filters
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault("all"),
  yearLevel: parseAsString,

  // Sorting
  sortBy: parseAsString.withDefault("createdAt"),
  sortOrder: parseAsString.withDefault("desc"),
})
```

## Component Composition

### Building from Primitives

```tsx
// Compose complex components from UI primitives
export function StudentCard({ student }: { student: Student }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{student.name}</CardTitle>
          <Badge>{student.status}</Badge>
        </div>
        <CardDescription>{student.email}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="text-sm">{student.enrollmentDate}</span>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">
            View Profile
          </Button>
          <Button variant="default" size="sm">
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Testing Patterns

### Component Testing

```tsx
// __tests__/student-card.test.tsx
import { render, screen } from '@testing-library/react'
import { StudentCard } from '../student-card'

describe('StudentCard', () => {
  const mockStudent = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
  }

  it('renders student information', () => {
    render(<StudentCard student={mockStudent} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })
})
```

### Server Action Testing

```typescript
// __tests__/actions.test.ts
import { createStudent } from '../actions'
import { db } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('@/lib/tenant-context', () => ({
  getTenantContext: () => ({ schoolId: 'school-123' })
}))

describe('createStudent', () => {
  it('creates student with schoolId', async () => {
    const input = {
      givenName: 'John',
      surname: 'Doe',
      email: 'john@example.com',
    }

    await createStudent(input)

    expect(db.student.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...input,
        schoolId: 'school-123',
      }),
    })
  })
})
```

## Performance Patterns

### Lazy Loading

```tsx
// Lazy load heavy components
const HeavyChart = lazy(() => import('./heavy-chart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### Memoization

```tsx
// Memoize expensive computations
const expensiveColumns = useMemo(
  () => getColumns(dictionary, permissions),
  [dictionary, permissions]
)

// Memoize components
const MemoizedCard = memo(StudentCard)
```

### Data Fetching

```tsx
// Parallel data fetching
const [students, teachers, classes] = await Promise.all([
  getStudents({ schoolId }),
  getTeachers({ schoolId }),
  getClasses({ schoolId }),
])
```

## Security Patterns

### Input Validation

```typescript
// Always validate on server
export async function createStudent(input: unknown) {
  // Parse and validate input
  const parsed = studentSchema.parse(input)

  // Additional business validation
  if (await isEmailTaken(parsed.email)) {
    throw new Error("Email already in use")
  }

  // Proceed with creation
  return db.student.create({ data: parsed })
}
```

### SQL Injection Prevention

```typescript
// ✅ SAFE - Parameterized queries
const students = await db.$queryRaw`
  SELECT * FROM Student
  WHERE schoolId = ${schoolId}
  AND name LIKE ${`%${search}%`}
`

// ❌ UNSAFE - String concatenation
const students = await db.$queryRawUnsafe(
  `SELECT * FROM Student WHERE name LIKE '%${search}%'`
)
```

## References

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Radix UI Primitives](https://radix-ui.com)
- [CVA Documentation](https://cva.style)
- [Zod Documentation](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)

## Pattern Enforcement

Use the pattern agent to enforce these conventions:

```bash
# Review patterns
/agents/pattern "review this component"

# Generate pattern-compliant code
/agents/pattern "create a teacher management feature"

# Convert to patterns
/agents/pattern "refactor to follow patterns"
```