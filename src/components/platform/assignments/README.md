# Assignments Component

This component manages academic assignments for the school management system, following the same pattern as the Students, Teachers, Parents, Announcements, Subjects, and Classes components.

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the assignments table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `constants.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing assignments
- `information.tsx` - First step form for basic information
- `details.tsx` - Second step form for details and settings
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Basic Information (title, description, class)
- **Step 2**: Details & Settings (type, points, weight, due date, instructions)

### Data Management
- Create new assignments
- Edit existing assignments
- Delete assignments
- View assignment details
- Search and filter by title, type, and class

### Validation
- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping
- Date validation (due date cannot be in the past)

### Table Features
- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Delete)

## Database Schema

Assignments are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `title` - Assignment title
- `description` - Assignment description
- `classId` - Associated class
- `type` - Assignment type (HOMEWORK, QUIZ, TEST, etc.)
- `totalPoints` - Total possible points
- `weight` - Weight percentage for grading
- `dueDate` - Assignment due date
- `instructions` - Assignment instructions
- `status` - Assignment status (DRAFT, PUBLISHED, etc.)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Assignment Types

The component supports the following assignment types:
- Homework
- Quiz
- Test
- Midterm
- Final Exam
- Project
- Lab Report
- Essay
- Presentation

## Usage

The component is used in the platform dashboard at `/dashboard/assignments` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Multi-step form navigation
- Date picker for due dates
- Numeric input validation for points and weight

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations
- date-fns for date formatting
