# Subjects Component

This component manages academic subjects for the school management system, following the same pattern as the Students, Teachers, Parents, and Announcements components.

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the subjects table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `constants.ts` - Constants and configuration
- `form.tsx` - Single-step form for creating/editing subjects
- `information.tsx` - Form step for basic information
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Single-step Form
- **Step 1**: Basic Information (subject name, department)

### Data Management
- Create new subjects
- Edit existing subjects
- Delete subjects
- View subject details
- Search and filter by subject name and department

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

Subjects are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `departmentId` - Associated department
- `subjectName` - Name of the subject
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/subjects` and automatically handles:

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
