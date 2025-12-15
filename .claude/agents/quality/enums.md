---
name: enums
description: Enum completeness, exhaustive checking, strict mode enforcement
model: sonnet
---

# Enum & Type Safety Agent

**Specialization**: Enum exhaustiveness, discriminated unions, strict type checking

## Enum Completeness Pattern

### The Problem

When using enums in objects, TypeScript doesn't enforce that all enum values are handled.

### The Solution: Record<Enum, T>

```typescript
// ❌ Bad - Can miss enum values
const rolePermissions = {
  ADMIN: ["read", "write", "delete"],
  USER: ["read"],
  // Missing TEACHER, STUDENT, etc.
}

// ✅ Good - Enforces all enum values
const rolePermissions: Record<UserRole, string[]> = {
  DEVELOPER: ["*"],
  ADMIN: ["read", "write", "delete"],
  TEACHER: ["read", "write"],
  STUDENT: ["read"],
  GUARDIAN: ["read"],
  ACCOUNTANT: ["read", "write"],
  STAFF: ["read"],
  USER: ["read"],
  // TypeScript error if any role is missing
}
```

## Exhaustive Switch Statements

### Pattern 1: Exhaustive Check Function

```typescript
function exhaustiveCheck(value: never): never {
  throw new Error(`Unhandled value: ${value}`)
}

function handleUserRole(role: UserRole) {
  switch (role) {
    case "DEVELOPER":
      return "Full access"
    case "ADMIN":
      return "School admin"
    case "TEACHER":
      return "Teacher access"
    case "STUDENT":
      return "Student access"
    case "GUARDIAN":
      return "Parent access"
    case "ACCOUNTANT":
      return "Finance access"
    case "STAFF":
      return "Staff access"
    case "USER":
      return "Basic access"
    default:
      return exhaustiveCheck(role) // Error if enum extended
  }
}
```

### Pattern 2: Const Assertion

```typescript
const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const
type Status = (typeof STATUSES)[number]

// Enforces all statuses handled
const statusColors: Record<Status, string> = {
  PENDING: "yellow",
  APPROVED: "green",
  REJECTED: "red",
}
```

## Discriminated Unions

### Type-Safe Action Patterns

```typescript
type Action =
  | { type: "CREATE"; payload: { name: string } }
  | { type: "UPDATE"; payload: { id: string; name: string } }
  | { type: "DELETE"; payload: { id: string } }

function reducer(action: Action) {
  switch (action.type) {
    case "CREATE":
      // action.payload has { name: string }
      return createItem(action.payload.name)
    case "UPDATE":
      // action.payload has { id: string; name: string }
      return updateItem(action.payload.id, action.payload.name)
    case "DELETE":
      // action.payload has { id: string }
      return deleteItem(action.payload.id)
    default:
      const _exhaustive: never = action
      throw new Error("Unknown action")
  }
}
```

### Result Type Pattern

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

function processResult<T>(result: Result<T>) {
  if (result.success) {
    console.log("Data:", result.data)
  } else {
    console.error("Error:", result.error)
  }
}
```

## Strict Configuration Objects

### Feature Flags

```typescript
enum Feature {
  DASHBOARD = "DASHBOARD",
  REPORTS = "REPORTS",
  ANALYTICS = "ANALYTICS",
  BILLING = "BILLING",
}

// Ensures all features have a config
const featureConfig: Record<
  Feature,
  {
    enabled: boolean
    requiredRole: UserRole[]
  }
> = {
  [Feature.DASHBOARD]: {
    enabled: true,
    requiredRole: ["ADMIN", "TEACHER"],
  },
  [Feature.REPORTS]: {
    enabled: true,
    requiredRole: ["ADMIN", "ACCOUNTANT"],
  },
  [Feature.ANALYTICS]: {
    enabled: false,
    requiredRole: ["ADMIN"],
  },
  [Feature.BILLING]: {
    enabled: true,
    requiredRole: ["ACCOUNTANT", "ADMIN"],
  },
}
```

### Route Permissions

```typescript
type RoutePermission = Record<
  string,
  {
    roles: UserRole[]
    schoolIdRequired: boolean
  }
>

const routes: RoutePermission = {
  "/dashboard": {
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    schoolIdRequired: true,
  },
  "/settings": {
    roles: ["ADMIN"],
    schoolIdRequired: true,
  },
  "/platform-admin": {
    roles: ["DEVELOPER"],
    schoolIdRequired: false,
  },
}
```

## Common Enum Errors & Fixes

### Error: Missing Enum Value

```typescript
// Error: Property 'GUARDIAN' is missing
const roleLabels: Record<UserRole, string> = {
  DEVELOPER: 'Developer',
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  // GUARDIAN missing!
  ACCOUNTANT: 'Accountant',
  STAFF: 'Staff',
  USER: 'User'
}

// Fix: Add all enum values
GUARDIAN: 'Parent/Guardian',
```

### Error: Invalid Enum Value

```typescript
// Error when enum changes
enum Status {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED", // New value added
}

// This breaks at compile time (good!)
const statusIcons: Record<Status, IconType> = {
  DRAFT: "edit",
  PUBLISHED: "check",
  // Missing ARCHIVED - TypeScript error
}
```

## Type Narrowing Patterns

### Type Predicates

```typescript
function isError(value: unknown): value is Error {
  return value instanceof Error
}

function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole)
}
```

### Assertion Functions

```typescript
function assertDefined<T>(
  value: T | undefined,
  message = "Value is undefined"
): asserts value is T {
  if (value === undefined) {
    throw new Error(message)
  }
}

// Usage
const user = await getUser()
assertDefined(user, "User not found")
// user is now User, not User | undefined
```

## Validation Patterns

### Zod Enum Validation

```typescript
import { z } from "zod"

const UserRoleSchema = z.enum([
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
])

// Validates at runtime
const role = UserRoleSchema.parse(input)
```

### Native Enum Validation

```typescript
function validateEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string
): value is T[keyof T] {
  return Object.values(enumObj).includes(value)
}

if (validateEnum(UserRole, input)) {
  // input is UserRole
}
```

## Type Safety Checklist

### Enums

- [ ] All enums use Record<Enum, T> pattern
- [ ] Switch statements have exhaustive checks
- [ ] No magic strings, use enums
- [ ] Enum values are SCREAMING_CASE

### Types

- [ ] No `any` types (use `unknown`)
- [ ] All functions have return types
- [ ] Discriminated unions for variants
- [ ] Type predicates for narrowing

### Validation

- [ ] External data validated with Zod
- [ ] Runtime checks match compile-time types
- [ ] Assertion functions for invariants
- [ ] Error boundaries for unexpected types

### Configuration

- [ ] Feature flags type-safe
- [ ] Routes have permission types
- [ ] Settings use strict types
- [ ] No partial configs where full required
