# Invoice Components

## Overview
The invoice components provide a comprehensive invoicing and billing management system for the Hogwarts platform. This module handles invoice creation, management, payment tracking, and financial reporting with multi-tenant support.

## Features

- **Data Table**: Full-featured data table with sorting, pagination, and filtering
- **Search & Filter**: Search by invoice number, client name, and status
- **Add Button**: Quick access to create new invoices via modal
- **Actions**: View, edit, and delete invoices with confirmation dialogs
- **Status Management**: Visual status badges for different invoice states
- **Multi-tenant**: Secure data isolation by school ID

## Components

### `content.tsx`
Main content component that:
- Fetches invoice data with search parameters
- Handles authentication and school context
- Renders the invoice table with proper pagination

### `table.tsx`
Data table component featuring:
- Search and filter toolbar
- Add button for creating new invoices
- Modal integration for forms
- Responsive design with proper accessibility

### `columns.tsx`
Table column definitions with:
- Invoice number, client name, total, status, due date, created date
- Sortable and filterable columns
- Action menu with view, edit, delete options
- Status badges with color coding

### `actions.ts`
Server actions for:
- `getInvoicesWithFilters`: Fetch invoices with search/filter support
- `deleteInvoice`: Delete invoices with proper validation
- Full CRUD operations for invoice management

### `list-params.ts`
Search parameter configuration:
- Page and per-page pagination
- Invoice number, status, and client name filters
- Sorting state management

### `types.ts`
TypeScript types including:
- `InvoiceRow`: Data structure for table rows
- `Invoice`: Complete invoice model
- `Address` and `Item`: Supporting types

## Usage

The invoice component follows the established pattern used in the students component:

1. **Search Parameters**: Uses `nuqs` for URL-based state management
2. **Data Fetching**: Server-side data fetching with proper filtering
3. **Table Integration**: Uses the shared `DataTable` component with toolbar
4. **Modal System**: Integrates with the shared modal context for forms
5. **Toast Notifications**: Uses shared toast components for user feedback

## Search & Filter Capabilities

- **Invoice Number**: Text search with case-insensitive matching
- **Client Name**: Search by recipient/client name
- **Status**: Filter by invoice status (PAID, UNPAID, OVERDUE, CANCELLED)
- **Pagination**: Configurable page size and navigation
- **Sorting**: Sort by any column with proper state management

## Security Features

- Multi-tenant data isolation by `schoolId`
- User authentication validation
- Proper authorization checks for all operations
- Input validation with Zod schemas

## Integration

This component integrates with:
- Shared table components (`@/components/table/*`)
- Modal system (`@/components/atom/modal/*`)
- Toast notifications (`@/components/atom/toast`)
- Authentication system (`@/auth`)
- Database layer (Prisma with Neon Postgres)

## Architecture Status

### Current Structure
```
src/components/invoice/
├── dashboard/         # Invoice dashboard views
├── invoice/           # Invoice management features
├── onboarding/        # Invoice setup wizard
├── settings/          # Invoice settings
├── steps/             # Multi-step form components
├── actions/           # Server actions (legacy)
├── _component/        # Legacy components
├── actions.ts         # Main server actions
├── columns.tsx        # Table column definitions
├── content.tsx        # Main content component
├── form.tsx           # Invoice form components
├── table.tsx          # Data table implementation
├── types.ts           # TypeScript definitions
└── validation.ts      # Zod schemas
```

### Compliance Status
- ✅ **Server Actions**: Properly implemented with validation
- ✅ **Multi-tenant**: SchoolId scoping implemented
- ✅ **TypeScript**: Good type coverage
- ⚠️ **File Organization**: Mixed patterns and legacy folders
- ❌ **Standardization**: Inconsistent file structure
- ❌ **Testing**: No test coverage

## Critical Issues Found

### Code Organization Issues
- **Legacy folders**: `_component/` and `actions/` folders need cleanup
- **Duplicate logic**: Multiple invoice creation implementations
- **Mixed patterns**: Inconsistent between old and new approaches
- **File naming**: Not following kebab-case convention

### TypeScript Issues
- Some `any` type usage in actions
- Missing proper error types
- Incomplete type definitions for complex objects

### Performance Concerns
- Client-side filtering in some components
- Missing pagination optimization
- No caching strategy for frequently accessed data

## Technology Stack
- **Framework**: Next.js 15.4.4 App Router
- **UI**: ShadCN UI + Custom components
- **Forms**: React Hook Form + Zod
- **Tables**: @tanstack/react-table
- **Database**: Prisma ORM
- **Styling**: Tailwind CSS v4

## Development Guidelines

### Server Actions Pattern
```typescript
"use server"

import { auth } from "@/auth"
import { invoiceSchema } from "./validation"

export async function createInvoice(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  // Validate with Zod
  const validated = invoiceSchema.parse(Object.fromEntries(data))

  // Create with schoolId scope
  const invoice = await db.invoice.create({
    data: { ...validated, schoolId }
  })

  revalidatePath("/invoices")
  return { success: true, data: invoice }
}
```

### Form Implementation
```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { invoiceSchema } from "./validation"

export function InvoiceForm() {
  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      // Invoice defaults
    }
  })

  return (
    <Form {...form}>
      {/* Form fields */}
    </Form>
  )
}
```

### Multi-step Forms
The invoice module uses a multi-step form pattern:
1. Basic Information
2. Client & Items
3. Review & Submit

Each step validates independently before proceeding.

## Required Improvements

### Immediate Actions
1. Clean up legacy folders (`_component/`, `actions/`)
2. Standardize file naming to kebab-case
3. Consolidate duplicate implementations
4. Add comprehensive TypeScript types
5. Implement proper error handling

### Performance Optimizations
1. Move filtering to server-side
2. Implement data caching
3. Add optimistic UI updates
4. Optimize bundle size

### Testing Requirements
1. Unit tests for calculations
2. Integration tests for workflows
3. E2E tests for invoice creation
4. Validation tests for forms

## API Endpoints

### Server Actions
- `getInvoicesWithFilters` - Fetch with search/filter
- `createInvoice` - Create new invoice
- `updateInvoice` - Update existing invoice
- `deleteInvoice` - Delete invoice
- `sendInvoiceEmail` - Email invoice to client
- `updateInvoiceStatus` - Update payment status

## Database Schema

```prisma
model Invoice {
  id           String   @id @default(cuid())
  schoolId     String
  number       String
  clientName   String
  clientEmail  String?
  items        Json
  total        Decimal
  status       InvoiceStatus
  dueDate      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([schoolId])
  @@unique([schoolId, number])
}
```

## Related Documentation
- [CLAUDE.md](../../../CLAUDE.md) - Architecture guidelines
- [Platform README](../platform/README.md)
- [Table Components](../table/README.md)
- [Form Patterns](../../docs/forms.md)

## Maintainers
Finance and billing team responsible for invoice features.

## License
MIT
