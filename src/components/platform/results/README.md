# Results Component

This component manages academic results and grades for the school management system, following the same pattern as the Students, Teachers, Parents, Announcements, Subjects, Classes, and Assignments components.

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the results table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing results
- `student-assignment.tsx` - First step form for student and assignment selection
- `grading.tsx` - Second step form for grading and feedback
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Student & Assignment Selection (student, assignment, class)
- **Step 2**: Grading & Feedback (score, max score, grade, feedback)

### Data Management
- Create new results
- Edit existing results
- Delete results
- View result details
- Search and filter by student, assignment, class, and grade

### Validation
- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping
- Custom validation ensuring score cannot exceed max score
- Auto-calculation of percentage based on score and max score

### Table Features
- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Delete)
- Percentage display with proper formatting

## Database Schema

Results are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `studentId` - Associated student
- `assignmentId` - Associated assignment
- `classId` - Associated class
- `score` - Student's score
- `maxScore` - Maximum possible score
- `percentage` - Calculated percentage (score/maxScore * 100)
- `grade` - Letter grade (A+, A, A-, B+, B, B-, etc.)
- `feedback` - Teacher feedback for the student
- `submittedAt` - When the assignment was submitted
- `gradedAt` - When the result was graded
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Grade Options

The component supports the following grade options:
- A+, A, A-
- B+, B, B-
- C+, C, C-
- D+, D, D-
- F

## Smart Features

### Auto-population
- `maxScore` is automatically populated from the selected assignment's total points
- `percentage` is automatically calculated when score or maxScore changes

### Data Integration
- Integrates with existing Students, Classes, and Assignments components
- Fetches related data for display in the table
- Maintains referential integrity across the system

## Usage

The component is used in the platform dashboard at `/dashboard/results` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Multi-step form navigation
- Automatic percentage calculation
- Grade assignment with predefined options

## Dependencies

- React Hook Form for form management
- Zod for validation with custom refinements
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations
- Integration with existing Students, Classes, and Assignments components
