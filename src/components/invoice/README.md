# Invoice Component

This component provides a complete invoice management system with search, filtering, and CRUD operations.

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
