# Parents Component

This component manages parent/guardian data for the school management system, following the same pattern as the Students and Teachers components.

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the parents table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `constants.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing parents
- `information.tsx` - First step form for basic information
- `contact.tsx` - Second step form for contact details
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Basic Information (names)
- **Step 2**: Contact Details (email address, user ID)

### Data Management
- Create new parents/guardians
- Edit existing parents/guardians
- Delete parents/guardians
- View parent/guardian details
- Search and filter by name, email, and status

### Validation
- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping

### Table Features
- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Delete)

## Database Schema

Parents/Guardians are stored with the following fields (using the `guardian` table):
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `givenName` - First name
- `surname` - Last name
- `emailAddress` - Email address (optional, unique per school)
- `teacherId` - Link to teacher if guardian is also a teacher (optional)
- `userId` - Associated user account (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/parents` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations
