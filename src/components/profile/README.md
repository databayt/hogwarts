# Profile System

This directory contains a reusable GitHub-like profile UI system that can be used across different user roles in the school management system.

## Components

### Core Components

- **`content.tsx`** - Main profile content component that orchestrates all other components
- **`profile-sidebar.tsx`** - Left sidebar with profile image, basic info, and stats
- **`profile-header.tsx`** - Main header section with role-specific content and subjects

### Role-Specific Dashboards

- **`student.tsx`** - Student-specific dashboard with assignments, GPA, and attendance
- **`teacher.tsx`** - Teacher-specific dashboard with classes, grades, and student count
- **`staff.tsx`** - Staff-specific dashboard with tasks, requests, and department info
- **`parent.tsx`** - Parent-specific dashboard with children, notifications, and meetings

### Shared Components

- **`activity-graph.tsx`** - GitHub-style activity heatmap
- **`activity-overview.tsx`** - Activity summary and contribution overview

## Usage

### Basic Usage

```tsx
import ProfileContent from "@/components/profile/content";

// For students
<ProfileContent role="student" data={studentData} />

// For teachers
<ProfileContent role="teacher" data={teacherData} />

// For staff
<ProfileContent role="staff" data={staffData} />

// For parents
<ProfileContent role="parent" data={parentData} />
```

### Data Structure

Each role expects a `data` object with at least these fields:
- `id` - Unique identifier
- `givenName` - First name
- `surname` - Last name
- `gender` - Gender (optional)
- `emailAddress` - Email address (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Example Implementation

```tsx
// In a page component
export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { schoolId } = await getTenantContext();
  
  const student = await db.student.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      // ... other fields
    },
  });
  
  if (!student) return notFound();
  
  return <ProfileContent role="student" data={student} />;
}
```

## Features

- **Responsive Design** - Works on all screen sizes
- **Role-Based Content** - Different dashboards for different user types
- **GitHub-Style UI** - Dark theme with modern design patterns
- **Reusable Components** - Easy to extend and customize
- **TypeScript Support** - Full type safety and IntelliSense

## Customization

### Adding New Roles

1. Create a new dashboard component (e.g., `admin.tsx`)
2. Add the role to the `ProfileContentProps` interface
3. Update the `getRoleDashboard()` function in `content.tsx`
4. Add role-specific content in `profile-sidebar.tsx` and `profile-header.tsx`

### Styling

The system uses Tailwind CSS with a custom dark theme. Colors are defined using CSS variables and can be easily customized in the global CSS file.

### Data Integration

Each dashboard component receives a `data` prop that can be used to display real-time information from your database. The components are designed to gracefully handle missing data.
