# Announcements Component

This component manages announcement data for the school management system, following the same pattern as the Students, Teachers, and Parents components.

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the announcements table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing announcements
- `information.tsx` - First step form for basic information
- `scope.tsx` - Second step form for scope and publishing settings
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Basic Information (title, body)
- **Step 2**: Scope & Publishing (scope, class/role selection, publish status)

### Data Management
- Create new announcements
- Edit existing announcements
- Delete announcements
- View announcement details
- Toggle publish/unpublish status
- Search and filter by title, scope, and publish status

### Validation
- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping
- Conditional validation for scope-specific fields

### Table Features
- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Publish/Unpublish, Delete)

## Database Schema

Announcements are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `title` - Announcement title
- `body` - Announcement content
- `scope` - Target scope (school, class, or role)
- `classId` - Associated class (when scope is class)
- `role` - Target role (when scope is role)
- `published` - Publication status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/announcements` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Dynamic form fields based on scope selection

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations
