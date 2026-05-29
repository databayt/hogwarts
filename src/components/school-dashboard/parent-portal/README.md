## Parent Portal — Family Access Dashboard

### Overview

Guardian-facing dashboard providing secure read-only access to children's academic performance, attendance records, assignments, timetables, school announcements, and events. Parents authenticate via NextAuth, and all data is scoped through student-guardian relationships with `schoolId` isolation.

### File Structure

```
src/components/school-dashboard/parent-portal/
├── actions.ts                      # Server actions (getMyChildren, getChildGrades, etc.)
├── child-grades-view.tsx           # Tabbed view for exam results and class scores
├── child-assignments-view.tsx      # Assignments table with submission status
├── child-timetable-view.tsx        # Weekly timetable grouped by day
├── attendance/
│   ├── content.tsx                 # Attendance records view
│   ├── view.tsx                    # Detailed attendance display
│   └── excuse-form.tsx             # Absence excuse submission
├── announcements/
│   ├── content.tsx                 # School announcements
│   └── actions.ts                  # Announcement actions
├── events/
│   ├── content.tsx                 # School events view
│   └── actions.ts                  # Event actions
├── README.md
└── ISSUE.md
```

### Status

**Completion:** 70% | **Blockers:** None

Core views (grades, assignments, timetable, attendance, announcements, events) implemented. Report card download, teacher messaging, fee status, and profile update still planned.

### Integration Points

- **Routes**: `src/app/[lang]/s/[subdomain]/(school-dashboard)/parent-portal/`
- **Auth**: Guardian role required, student-guardian relationship verified per action
- **Students**: Data fetched via student ID with guardian authorization
- **Attendance**: Links to attendance module for records
- **Results**: Links to exam results for grades
