# Banking Module TypeScript Architecture

## Overview
This directory contains comprehensive TypeScript type definitions for the banking module, following TypeScript 5.x best practices with zero `any` usage and strict typing throughout.

## File Structure

### 📁 `bank.types.ts`
Core domain models and business logic types:
- **Domain Models**: `BankAccount`, `Transaction`, `Transfer`
- **Enums**: Type-safe constants for account types, transaction types, statuses
- **Aggregated Types**: Combined types like `BankAccountWithTransactions`
- **Type Guards**: Runtime type checking functions
- **Branded Types**: Domain-specific type safety with branded primitives

### 📁 `actions.types.ts`
Server action type definitions:
- **Result Types**: Discriminated union `ActionResult<T>` for better error handling
- **Action Parameters**: Typed input parameters for all server actions
- **Action Results**: Typed return values with proper serialization
- **Error Types**: Structured error handling with `ActionError`

### 📁 `component.types.ts`
React component prop types following the 'Props' naming pattern:
- **Component Props**: All component interfaces use the `Props` suffix
- **Dictionary Types**: Internationalization support with `BankingDictionary`
- **Common Types**: Shared types like `User`, loading states, pagination
- **Layout Props**: Types for page layouts and wrappers

### 📁 `utils.types.ts`
Advanced TypeScript utility types:
- **Discriminated Unions**: `LoadingState`, `FormState`, `PlaidConnectionState`
- **Generic Utilities**: `DeepPartial`, `DeepReadonly`, type modifiers
- **Template Literal Types**: Type-safe string patterns
- **Conditional Types**: Advanced type inference and manipulation
- **Builder Patterns**: Progressive typing for fluent interfaces

### 📁 `index.ts`
Central export point for all types.

## Key Features

### 1. Zero `any` Usage
All types are strictly defined with no `any` types, ensuring complete type safety.

### 2. Discriminated Unions
Used extensively for state management and error handling:
```typescript
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

### 3. Result Pattern for Actions
All server actions return a discriminated union result:
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError }
```

### 4. Branded Types
Domain-specific type safety:
```typescript
type AccountId = string & { readonly __brand: 'AccountId' }
type UserId = string & { readonly __brand: 'UserId' }
```

### 5. Type Guards
Runtime type checking with TypeScript narrowing:
```typescript
function isBankAccount(value: unknown): value is BankAccount
function isActionSuccess<T>(result: ActionResult<T>): result is { success: true; data: T }
```

### 6. Decimal Serialization
Proper handling of Prisma Decimal fields:
```typescript
type SerializedBankAccount = Omit<PrismaBankAccount, 'currentBalance' | 'availableBalance'> & {
  currentBalance: number
  availableBalance: number
}
```

## Usage Examples

### Import Types
```typescript
// Import specific types
import type { BankAccount, Transaction, ActionResult } from '@/components/banking/types'

// Import component props
import type { DashboardHeaderProps } from '@/components/banking/types'

// Import utility types
import type { LoadingState, FormState } from '@/components/banking/types'
```

### Use in Components
```typescript
// Component with typed props
export function BankCard({ account, userName, showBalance = true }: BankCardProps) {
  // Component implementation
}

// Server action with typed result
const result = await getAccounts({ userId })
if (isActionSuccess(result)) {
  console.log(result.data.totalBanks)
} else {
  console.error(result.error.message)
}
```

### Type-Safe Form Handling
```typescript
// Zod schema to TypeScript type
import { TransferSchema } from '../lib/validations'
import type { InferSchema } from '../types'

type TransferFormData = InferSchema<typeof TransferSchema>
```

## Best Practices

1. **Always use type imports**: `import type { ... }`
2. **Prefer interfaces over types for component props**
3. **Use discriminated unions for state management**
4. **Implement type guards for runtime safety**
5. **Leverage branded types for domain modeling**
6. **Serialize Decimal fields properly from Prisma**
7. **Use the Result pattern for error handling**
8. **Export types from the index file**

## Migration Guide

### Before (with `any`)
```typescript
interface DashboardHeaderProps {
  user: any
  accounts: any[]
  dictionary: any
}
```

### After (type-safe)
```typescript
import type { DashboardHeaderProps } from '../types'
// Already typed with User, BankAccountWithTransactions[], and BankingDictionary
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Performance Considerations

1. **Type-only imports** reduce bundle size
2. **Discriminated unions** enable efficient type narrowing
3. **Branded types** have zero runtime overhead
4. **Type guards** provide runtime safety with minimal cost
5. **Generic constraints** improve type inference performance