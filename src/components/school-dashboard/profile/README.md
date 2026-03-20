## Profile -- User Profile Management

### Overview

The Profile block provides user-facing profile pages with role-specific views, a GitHub-style contribution graph, activity feeds, pinned items, and editable personal information. Supports all school roles (student, teacher, parent, staff) with tailored profile layouts and a shared detail view for viewing other users' profiles.

### Capabilities by Role

- **Admin**: View any user's profile, edit role-specific data for any user
- **Teacher**: View/edit own profile, see teaching schedule and contribution data
- **Student**: View/edit own profile, see academic contribution graph and activity
- **Guardian**: View/edit own profile, view linked children's profiles
- **Staff**: View/edit own profile
- **All Roles**: Upload avatar, update bio, configure settings, manage pinned items, view contribution graph

### Routes

| Route                                                   | Page            | Status |
| ------------------------------------------------------- | --------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/profile`      | Own Profile     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/profile/[id]` | View Other User | Ready  |

Note: The route uses `[[...id]]` optional catch-all -- no ID shows own profile, with ID shows another user's profile.

### File Structure

```
src/components/school-dashboard/profile/
  actions.ts              # Server actions (17 functions: get/update profile, contributions, activity)
  types.ts                # TypeScript interfaces (ProfileRole, ActivityType, ContributionData)
  validation.ts           # Zod schemas (profile, bio, settings, pinned items, GitHub)
  client.tsx              # Client-side profile wrapper
  form.tsx                # Profile edit form
  sidebar.tsx             # Profile sidebar layout
  graph.tsx               # GitHub-style contribution graph
  activity.tsx            # Activity feed component
  pinned.tsx              # Pinned items display
  student.tsx             # Student-specific profile view
  teacher.tsx             # Teacher-specific profile view
  parent.tsx              # Parent/guardian-specific profile view
  staff.tsx               # Staff-specific profile view
  edit-role-data.tsx      # Role-specific data editor
  edit-role-actions.ts    # Server actions for role data editing
  detail/
    content.tsx           # Detail view for viewing other users
    actions.ts            # Detail-specific server actions
    permissions.ts        # Who can view whose profile
    types.ts              # Detail view types
  __tests__/
    actions.test.ts       # Server action tests
```

### Status

**Completion:** 85% | **Blockers:** None

### Integration Points

- **Authentication**: Profile data sourced from User model via NextAuth session
- **Students/Teachers/Staff**: Role-specific profile views pull from respective models
- **Attendance**: Contribution graph can reflect attendance patterns
- **Activity Log**: Tracks user actions across the platform
