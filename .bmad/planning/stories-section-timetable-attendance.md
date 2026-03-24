# Story Breakdown: Section-Based Timetable and Attendance

## Status: PROPOSED

---

## Epic: SECTION-TIMETABLE -- Migrate timetable and attendance from class-based to section-based architecture

### Dependency Graph

```
STORY-001 (Schema) ──┬──> STORY-002 (Algorithm)
                      |         |
                      |         v
                      |    STORY-003 (Timetable Actions)
                      |         |
                      |         v
                      |    STORY-004 (Timetable UI)
                      |
                      └──> STORY-005 (Attendance Core)
                                |
                                v
                           STORY-006 (Attendance UI + Submodules)
                                |
                                v
                           STORY-007 (Tests + Docs)
```

---

## STORY-001: Schema Migration -- Add sectionId/subjectId to Timetable and Attendance

**As a** developer
**I want** the Prisma schema updated with section-based fields
**So that** timetable and attendance can reference sections instead of (or alongside) classes

**Acceptance Criteria:**

- Given the Timetable model, when migration runs, then `sectionId String?` and `subjectId String?` columns exist
- Given the Timetable model, when migration runs, then `classId` is nullable (was required)
- Given the Attendance model, when migration runs, then `sectionId String?` column exists
- Given the Attendance model, when migration runs, then `classId` is nullable (was required)
- Given the Section model, when queried, then reverse relations `timetables` and `attendances` resolve
- Given the CatalogSubject model, when queried, then reverse relation `timetableSlots` resolves
- Given existing 750 timetable rows, when migration completes, then all rows have their original `classId` intact and `sectionId` is null
- Given `pnpm prisma generate`, when run after schema changes, then no TypeScript errors
- Given `pnpm tsc --noEmit`, when run, then zero type errors

**Files to change:**

| File                              | Change                                                                                                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/models/timetable.prisma`  | Add `sectionId`, `subjectId` (nullable), make `classId` nullable, add Section/CatalogSubject relations, add `@@unique` and `@@index` for sectionId                                            |
| `prisma/models/classrooms.prisma` | Add `timetables Timetable[]` and `attendances Attendance[]` reverse relations to Section                                                                                                      |
| `prisma/models/attendance.prisma` | Add `sectionId` (nullable) to Attendance, make `classId` nullable, add Section relation, add `@@unique` and `@@index` for sectionId; optionally add `sectionId` to QRCodeSession and HallPass |
| `prisma/models/catalog.prisma`    | Add `timetableSlots Timetable[]` reverse relation to CatalogSubject                                                                                                                           |

**Neon safety:** Create Neon branch before applying. Test migration on branch first.

**Estimate:** 2-4 hours

---

## STORY-002: Algorithm -- Section-First Timetable Generation

**As a** school admin
**I want** the timetable generation algorithm to schedule by section
**So that** each section (Grade 1-A) gets a complete weekly schedule with all its subjects

**Acceptance Criteria:**

- Given sections with enrolled students, when algorithm runs, then output slots have `sectionId` and `subjectId`
- Given a section with 6 subjects, when algorithm runs, then all 6 subjects are distributed across the week
- Given two sections in the same grade, when algorithm runs, then they do not share the same teacher in the same period
- Given a section, when algorithm runs, then the section is never double-booked (two slots same period)
- Given the section's homeroom classroom, when a regular subject is placed, then the homeroom is used; when a lab subject is placed, then the lab room is used
- Given no qualified teacher for a subject, when algorithm runs, then the slot is placed with `teacherId: null` and a warning is emitted
- Given the `__testing` export, when helper functions are called, then `isSectionScheduled` correctly prevents double-booking

**Files to change:**

| File                                                              | Change                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/school-dashboard/timetable/generate/algorithm.ts` | Replace `ClassRequirement` with `SectionRequirement`, add `SubjectAllocation` type, add `sectionSchedule` to `AlgorithmState`, update `GeneratedSlot` to include `sectionId`/`subjectId`, rewrite `placeClassGreedy` to `placeSubjectForSection`, update conflict detection for section double-booking, keep old types as deprecated aliases |

**Estimate:** 4-6 hours

---

## STORY-003: Timetable Server Actions -- Section-Based Data Flow

**As a** school admin
**I want** timetable server actions to work with section-based data
**So that** generated timetables are stored and queried by section

**Acceptance Criteria:**

- Given `generateTimetablePreview`, when called, then it queries sections (not classes) and builds `SectionRequirement[]`
- Given `applyGeneratedTimetable`, when called with section-based slots, then timetable rows are created with `sectionId` and `subjectId`
- Given `getWeeklyTimetable`, when called, then response includes section name and subject name for section-based slots
- Given `getWeeklyTimetable`, when called for legacy data, then response still shows class name (backward compat)
- Given `upsertTimetableSlot`, when called with `sectionId` + `subjectId`, then slot is created correctly
- Given `detectTimetableConflicts`, when two slots for the same section overlap, then a section conflict is detected
- Given `suggestFreeSlots`, when called with a sectionId, then free periods for that section are returned
- Given a new `getSectionsForSelection` action, when called, then sections are returned ordered by name with student count
- Given a TEACHER role, when calling `getSectionsForSelection`, then only sections where teacher has slots or is homeroom teacher are returned

**Files to change:**

| File                                                       | Change                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/school-dashboard/timetable/actions.ts`     | Update `generateTimetablePreview` (query sections), `applyGeneratedTimetable` (include sectionId/subjectId), `getWeeklyTimetable` (include section/subject in select), `upsertTimetableSlot` (accept sectionId), `detectTimetableConflicts` (add section conflict type), `suggestFreeSlots` (section-based), add `getSectionsForSelection` |
| `src/components/school-dashboard/timetable/types.ts`       | Add `sectionId`, `subjectId` to `TimetableSlot`, add `SectionInfo` type, update `ClassInfo` to optional                                                                                                                                                                                                                                    |
| `src/components/school-dashboard/timetable/validation.ts`  | Update `upsertTimetableSlotSchema` (make classId optional, add sectionId/subjectId, add union refinement)                                                                                                                                                                                                                                  |
| `src/components/school-dashboard/timetable/permissions.ts` | Update `filterTimetableByRole` to handle section-based filtering                                                                                                                                                                                                                                                                           |

**Estimate:** 4-6 hours

---

## STORY-004: Timetable UI Components -- Section Display

**As a** school admin or teacher
**I want** the timetable UI to show section-based schedules
**So that** I can view and edit "Grade 1-A's schedule" instead of individual subject classes

**Acceptance Criteria:**

- Given the admin view, when "By Section" tab is selected, then a section dropdown appears and the grid shows that section's weekly schedule
- Given a timetable cell, when the slot has `sectionId`, then it displays `sectionName + subjectName`; when it has only `classId`, then it displays `className` (backward compat)
- Given the generate preview, when results are shown, then columns include Section, Subject, Teacher, Room, Score
- Given the slot editor dialog, when opened, then section and subject dropdowns are available alongside (or replacing) the class dropdown
- Given the student view, when a student views their timetable, then it queries by their `sectionId`
- Given the teacher view, when a teacher views their timetable, then sections are shown alongside subjects

**Files to change:**

| File                                                                    | Change                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/components/school-dashboard/timetable/views/admin-view.tsx`        | Add "By Section" tab, call `getSectionsForSelection`, render section dropdown |
| `src/components/school-dashboard/timetable/by-class/content.tsx`        | Duplicate as `by-section/content.tsx` with section-based logic                |
| `src/components/school-dashboard/timetable/timetable-cell.tsx`          | Display section name + subject if sectionId present                           |
| `src/components/school-dashboard/timetable/timetable-grid-enhanced.tsx` | Handle section data in grid rendering                                         |
| `src/components/school-dashboard/timetable/slot-editor.tsx`             | Add section + subject fields                                                  |
| `src/components/school-dashboard/timetable/slot-editor-dialog.tsx`      | Pass section/subject props                                                    |
| `src/components/school-dashboard/timetable/generate/content.tsx`        | Show Section/Subject in preview table                                         |
| `src/components/school-dashboard/timetable/views/student-view.tsx`      | Query by student's sectionId                                                  |
| `src/components/school-dashboard/timetable/views/teacher-view.tsx`      | Show section info in teacher slots                                            |
| `src/components/school-dashboard/timetable/by-teacher/content.tsx`      | Display section name in slot data                                             |
| `src/components/school-dashboard/timetable/by-room/content.tsx`         | Display section name in slot data                                             |
| `src/components/school-dashboard/timetable/timetable-header.tsx`        | Support section name in header                                                |
| `src/components/school-dashboard/timetable/views/guardian-view.tsx`     | Show section-based schedule                                                   |
| `src/components/school-dashboard/timetable/import-export.tsx`           | Support sectionId in import format                                            |
| `src/components/school-dashboard/timetable/visual-builder.tsx`          | Section-based drag-and-drop                                                   |
| `src/components/school-dashboard/timetable/analytics-reports.tsx`       | Section utilization metrics                                                   |
| `src/components/school-dashboard/timetable/seed-utils.ts`               | Generate section-based test data                                              |
| `src/components/school-dashboard/timetable/conflicts/content.tsx`       | Show section info in conflicts                                                |

**Estimate:** 4-6 hours

---

## STORY-005: Attendance Core -- Section-Based Roster and Marking

**As a** teacher
**I want** to take attendance by selecting my section (Grade 1-A)
**So that** I see the correct 30 students from my homeroom without needing to know which subject class they belong to

**Acceptance Criteria:**

- Given a new `getSectionsForSelection` action (attendance context), when called, then sections are returned with student count and homeroom teacher
- Given `getAttendanceList` with `sectionId`, when called, then student roster comes from `Student WHERE sectionId = X` (not StudentClass)
- Given `getAttendanceList` with `classId` (legacy), when called, then student roster comes from StudentClass (backward compat)
- Given `markAttendance` with `sectionId`, when called, then Attendance records are created with `sectionId` populated
- Given `quickMarkAllPresent` with `sectionId`, when called, then all students in the section are marked present
- Given existing attendance records with `classId`, when queried, then they still display correctly

**Files to change:**

| File                                                         | Change                                                                                                                                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/school-dashboard/attendance/actions/core.ts` | Add `getSectionsForSelection`, update `getAttendanceList` (dual path: sectionId or classId), update `markAttendance` (accept sectionId), update `markSingleAttendance`, update `quickMarkAllPresent`, update `bulkCheckOut` |

**Estimate:** 3-4 hours

---

## STORY-006: Attendance UI and Submodules -- Section Dropdowns Everywhere

**As a** teacher or admin
**I want** all attendance UI components to show section selectors
**So that** attendance flows consistently use sections throughout the system

**Acceptance Criteria:**

- Given the main attendance content, when loaded, then the dropdown shows sections (not subject classes)
- Given the smart auto-select feature, when the current timetable period has a section, then that section is auto-selected
- Given the analytics page, when section filter is used, then stats are scoped by section
- Given the early warning page, when loaded, then class filter is replaced with section filter
- Given the kiosk check-in, when a student scans, then their section is resolved from `Student.sectionId`
- Given the dashboard today view, when loaded, then section names appear instead of class names
- Given the intervention tracker, when displaying student info, then it shows `student.section.name` instead of `studentClasses[0]?.class.name`

**Files to change:**

| File                                                                   | Change                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/components/school-dashboard/attendance/content.tsx`               | Replace class dropdown with section dropdown, use `getSectionsForSelection`, pass sectionId to actions |
| `src/components/school-dashboard/attendance/recent/content.tsx`        | Replace `getClassesForSelection` with `getSectionsForSelection`                                        |
| `src/components/school-dashboard/attendance/reports/content.tsx`       | Same                                                                                                   |
| `src/components/school-dashboard/attendance/early-warning/content.tsx` | Same                                                                                                   |
| `src/components/school-dashboard/attendance/analytics/content.tsx`     | Same                                                                                                   |
| `src/components/school-dashboard/attendance/bulk-upload/content.tsx`   | Same                                                                                                   |
| `src/components/school-dashboard/attendance/actions/analytics.ts`      | Query by sectionId instead of studentClasses                                                           |
| `src/components/school-dashboard/attendance/actions/dashboard.ts`      | Use section.name instead of studentClasses[0]?.class.name                                              |
| `src/components/school-dashboard/attendance/actions/master.ts`         | Query Student.sectionId instead of StudentClass                                                        |
| `src/components/school-dashboard/attendance/actions/periods.ts`        | Add section-based period queries                                                                       |
| `src/components/school-dashboard/attendance/actions/records.ts`        | Include section in student queries                                                                     |
| `src/components/school-dashboard/attendance/actions/compliance.ts`     | Group by sectionId                                                                                     |
| `src/components/school-dashboard/attendance/actions/bulk.ts`           | Accept sectionId                                                                                       |
| `src/components/school-dashboard/attendance/actions/interventions.ts`  | Display student.section.name                                                                           |
| `src/components/school-dashboard/attendance/attendance-stats.ts`       | Query by sectionId instead of StudentClass                                                             |
| `src/components/school-dashboard/attendance/gamification/actions.ts`   | Section-based competition                                                                              |
| `src/components/school-dashboard/attendance/geofencee/geo-service.ts`  | Use Student.sectionId                                                                                  |
| `src/components/school-dashboard/attendance/kiosk/actions.ts`          | Use student.sectionId                                                                                  |
| `src/components/school-dashboard/attendance/letters/actions.ts`        | Use student.section?.name                                                                              |
| `src/components/school-dashboard/attendance/overview/content.tsx`      | Check for class references, update to section                                                          |

**Estimate:** 4-6 hours

---

## STORY-007: Tests, Documentation, and Cleanup

**As a** developer
**I want** tests and documentation updated for the section-based architecture
**So that** future development follows the new patterns and regressions are caught

**Acceptance Criteria:**

- Given the algorithm test suite, when run, then section-based generation tests pass
- Given the validation test suite, when run, then sectionId/classId union rules are tested
- Given the attendance test suite, when run, then section-based roster tests pass alongside legacy class-based tests
- Given the timetable CLAUDE.md (block docs), when read, then it documents the section-based architecture
- Given the attendance CLAUDE.md, when read, then it documents section-based attendance
- Given `pnpm tsc --noEmit`, when run at the end, then zero errors

**Files to change:**

| File                                                                               | Change                              |
| ---------------------------------------------------------------------------------- | ----------------------------------- |
| `src/components/school-dashboard/timetable/__tests__/actions.test.ts`              | Add section-based test cases        |
| `src/components/school-dashboard/timetable/__tests__/validation.test.ts`           | Test new schema union rules         |
| `src/components/school-dashboard/timetable/__tests__/production-readiness.test.ts` | Verify backward compat              |
| `src/components/school-dashboard/attendance/__tests__/actions.test.ts`             | Add section-based attendance tests  |
| `src/components/school-dashboard/attendance/__tests__/multi-tenant.test.ts`        | Section queries include schoolId    |
| `src/components/school-dashboard/timetable/README.md`                              | Document section-based architecture |
| `src/components/school-dashboard/timetable/FEATURES.md`                            | Update feature list                 |

**Estimate:** 2-3 hours

---

## Summary

| Story                                 | Files         | Estimate    | Priority      |
| ------------------------------------- | ------------- | ----------- | ------------- |
| STORY-001: Schema Migration           | 4             | 2-4h        | P0 (blocking) |
| STORY-002: Algorithm                  | 1             | 4-6h        | P0 (blocking) |
| STORY-003: Timetable Actions          | 4             | 4-6h        | P0            |
| STORY-004: Timetable UI               | 18            | 4-6h        | P1            |
| STORY-005: Attendance Core            | 1             | 3-4h        | P0            |
| STORY-006: Attendance UI + Submodules | 20            | 4-6h        | P1            |
| STORY-007: Tests + Docs               | 7             | 2-3h        | P2            |
| **Total**                             | **~55 files** | **~24-35h** |               |

### Implementation Order

1. STORY-001 first (all other stories depend on schema)
2. STORY-002 + STORY-005 in parallel (algorithm and attendance core are independent)
3. STORY-003 after STORY-002 (actions depend on algorithm types)
4. STORY-004 + STORY-006 in parallel (UI changes are independent of each other)
5. STORY-007 last (tests verify everything)
