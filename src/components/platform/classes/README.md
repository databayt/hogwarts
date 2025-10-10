# Classes Component

This component manages academic classes for the school management system, following the same pattern as the Students, Teachers, Parents, Announcements, and Subjects components.

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the classes table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing classes
- `information.tsx` - First step form for basic information
- `schedule.tsx` - Second step form for schedule and location
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Basic Information (class name, subject, teacher)
- **Step 2**: Schedule & Location (term, start/end periods, classroom)

### Data Management
- Create new classes
- Edit existing classes
- Delete classes
- View class details
- Search and filter by name, subject, teacher, and term

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

Classes are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `name` - Class name
- `subjectId` - Associated subject
- `teacherId` - Assigned teacher
- `termId` - Academic term
- `startPeriodId` - Start period
- `endPeriodId` - End period
- `classroomId` - Physical classroom
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/classes` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Multi-step form navigation

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations
