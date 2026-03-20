## School Dashboard — Multi-Tenant School Management Platform

### Overview

The school-dashboard block is the admin control center for individual schools within the Hogwarts multi-tenant platform. It provides comprehensive tools for managing students, teachers, classes, schedules, exams, attendance, finance, and all academic operations. Each school operates in full tenant isolation via `schoolId` scoping.

### Capabilities by Role

- **Admin**: Full CRUD on all entities, school configuration, user/role management, reports, billing, import/export
- **Teacher**: View assigned classes/students, mark attendance, create/grade assignments, enter exam marks, post class announcements
- **Student**: View personal timetable, assignments, grades, attendance, announcements (read-only)
- **Guardian**: View linked children's data, attendance, grades, announcements (read-only)
- **Staff**: View school data, basic CRUD on assigned entities
- **Accountant**: Access billing, invoices, fee management, student/parent accounts (no academic data)

### Routes

| Route                                                        | Page                                           | Status |
| ------------------------------------------------------------ | ---------------------------------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/dashboard`         | Role-based dashboard                           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/*`       | Admission management                           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/attendance/*`      | Attendance tracking (15 sub-routes)            | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/*`           | Exams, templates, marks, results, certificates | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable`         | Weekly schedule builder                        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/settings`          | School configuration                           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/profile/[[...id]]` | User profile management                        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/messages`          | Messaging                                      | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/library/*`         | Library management                             | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/stream/*`          | LMS / course streaming                         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/lab`               | Experimental features                          | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/*`      | Students, teachers, classes, subjects, etc.    | Ready  |

### File Structure

```
src/components/school-dashboard/
+-- config.ts                    # Sidebar navigation config
+-- loading.tsx                  # Global loading skeleton
+-- force-change-password-modal.tsx
+-- dashboard/                   # Role-based home pages (97 files)
+-- listings/                    # CRUD for core entities
|   +-- students/                #   Student management
|   +-- teachers/                #   Teacher management
|   +-- classes/                 #   Class/section management
|   +-- subjects/                #   Subject catalog
|   +-- grades/                  #   Grade levels
|   +-- parents/                 #   Guardian accounts
|   +-- staff/                   #   Staff management
|   +-- announcements/           #   Broadcasts
|   +-- events/                  #   School calendar
|   +-- assignments/             #   Homework/projects
|   +-- classrooms/              #   Physical rooms
+-- attendance/                  # Attendance tracking system
+-- timetable/                   # Weekly schedule builder
+-- exams/                       # Exam generation, marking, results
+-- admission/                   # Application processing
+-- finance/                     # Fees, salary, expenses, banking, payroll
+-- fees/                        # Fee collection
+-- billing/                     # Billing management
+-- settings/                    # School configuration
+-- profile/                     # User profile
+-- messaging/                   # Communication
+-- notifications/               # Alert system
+-- reports/                     # Report generation
+-- parent-portal/               # Guardian read-only view
+-- import/                      # CSV import/export
+-- school/                      # School entity management
+-- library/                     # Library system
+-- lab/                         # Experimental features
+-- shared/                      # Shared utilities
+-- context/                     # React contexts
```

### Status

**Completion:** 85% | **Blockers:** None

Core CRUD for all listing entities (students, teachers, classes, subjects, grades, parents, staff, announcements, events, assignments, classrooms) is production-ready. Dashboard, attendance, timetable, exams, and admission features are functional. Remaining work is polish: mobile responsiveness audit, accessibility improvements, report card PDF generation.

### Integration Points

- [Dashboard](./dashboard/README.md) -- Role-based landing pages
- [Listings](./listings/) -- Core entity CRUD (students, teachers, classes, etc.)
- [Attendance](./attendance/README.md) -- Daily/period tracking
- [Timetable](./timetable/README.md) -- Schedule builder
- [Exams](./exams/) -- Assessment system
- [Admission](./admission/) -- Application processing
- [Finance](./finance/) -- Fee collection, payroll, banking
- [Settings](./settings/README.md) -- School configuration
- [Parent Portal](./parent-portal/README.md) -- Guardian view
- [Import](./import/README.md) -- CSV bulk operations
