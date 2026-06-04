## Parent Portal — Family Access Dashboard

### Overview

Guardian-facing dashboard giving parents secure read access to each child's academic life — grades, downloadable PDF report cards, attendance (with excuse submission), timetable, assignments — plus deep-links into the shared messaging surface and a read-only fee view. Guardians authenticate via NextAuth; every action is scoped through `StudentGuardian` and `schoolId` for tenant isolation.

**Aldar epic-4 status:** SHIPPED. See [`ISSUE.md`](./ISSUE.md) and tracker [hogwarts#4](https://github.com/databayt/hogwarts/issues/4).

### Routes

All under the `(school-dashboard)` route group at `src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/*` — URL stays `/parent/...`, the route group just inherits the dashboard chrome (PlatformSidebar, dictionary, school context).

```
parent/
├── page.tsx                                  # Landing — children grid
├── children/[id]/
│   ├── layout.tsx                            # Tab navigation
│   ├── page.tsx                              # Overview (Recharts-style cards + recent exams)
│   ├── grades/page.tsx                       # Mounts <ChildGradesView>
│   ├── report-cards/page.tsx                 # Mounts <ParentReportCardsContent>
│   ├── attendance/page.tsx                   # Mounts <ParentAttendanceContent> + <ExcuseForm>
│   ├── timetable/page.tsx                    # Mounts <ChildTimetableView>
│   └── assignments/page.tsx                  # Mounts <ChildAssignmentsView>
├── announcements/page.tsx                    # Wraps <ParentAnnouncementsContent>
├── events/page.tsx                           # Wraps <ParentEventsContent>
├── messages/page.tsx                         # Redirects to /messages (shared UI)
└── fees/page.tsx                             # Redirects to /my-fees (existing read-only)
```

Public, no-auth surface (added in Phase 5):

```
verify/transcript/[code]/page.tsx            # Public transcript verification
```

### File Structure

```
src/components/school-dashboard/parent-portal/
├── actions.ts                                # getMyChildren, getChildOverview, getChildGrades, getChildAssignments, getChildTimetable (all relationship-checked via getPolicyContext)
├── landing/
│   ├── content.tsx                           # ParentLandingContent — landing + "Message teachers" CTA
│   └── children-grid.tsx                     # ChildrenGrid (reuses getMyChildren)
├── child/
│   ├── tabs.tsx                              # ChildTabs — client component, usePathname for active highlight
│   └── overview-content.tsx                  # ChildOverviewContent — server, header + "Message teacher" CTA + cards + recent exams
├── child-grades-view.tsx                     # Orphan-now-mounted (grades/page.tsx)
├── child-assignments-view.tsx                # Orphan-now-mounted
├── child-timetable-view.tsx                  # Orphan-now-mounted
├── attendance/
│   ├── content.tsx                           # ParentAttendanceContent — full guardian + children + attendance load
│   ├── view.tsx                              # <AttendanceView> client widget
│   └── excuse-form.tsx                       # <ExcuseForm>, <ExcuseStatusBadge>, <UnexcusedAbsenceCard>
├── announcements/{content,actions}.ts
├── events/{content,actions}.ts
├── report-cards/
│   └── content.tsx                           # ParentReportCardsContent — list + download button (never forwards raw pdfUrl)
├── README.md
└── ISSUE.md
```

### Integration Points

- **Auth**: GUARDIAN role gate via `src/routes.ts` (`/parent` + `/parent/*` → `["GUARDIAN", "DEVELOPER"]`); per-action relationship verification via `getPolicyContext` (`actions.ts`) or `canAccessStudent` (`src/app/api/mobile/lib/student-access.ts`)
- **Sidebar**: `template/platform-sidebar/config.ts` exposes a `parentPortal` entry (icon: `user`, roles: GUARDIAN+DEVELOPER) so guardians discover the portal naturally
- **Notifications**: `report_ready` / `grade_posted` / `attendance_alert` fan out via `dispatchTemplated` (per-channel preference + locale-aware NotificationTemplate lookup); deep-link `hogwarts://parent/children/{id}/...` in metadata for mobile tap-to-open
- **PDFs**: rendered out-of-band by `/api/cron/process-report-card-pdfs` (and `/api/cron/process-transcript-pdfs`), served via signed URL through `/api/parent/report-cards/[id]/download` — raw `pdfUrl` never reaches client HTML
- **Messaging**: deep-links to `/messages`; existing GUARDIAN role-dispatch already filters to `my_children_teachers + admin`
- **Mobile**: `/api/mobile/guardian/children/*`, `/api/mobile/report-cards/*` (relationship-guarded), `/api/mobile/grades/student/[studentId]` (relationship-guarded), `/api/mobile/notifications/preferences` (WhatsApp toggle now exposed)

### What's deferred

See [`ISSUE.md`](./ISSUE.md) for the full deferred list. Highlights: full dictionary-key migration, per-teacher pre-selection on Message-teacher CTAs, FCM SDK install, bulk-entry mount, RTL Playwright pass.
