# PRD: Section-Based Timetable and Attendance Architecture

## Status: PROPOSED

## Executive Summary

Restructure the timetable and attendance systems from a subject-class-centric model (`classId` on `Timetable`, `StudentClass` roster for attendance) to a section-centric model (`sectionId` on `Timetable`, `Student.sectionId` roster for attendance). Sections (Grade 1-A, Grade 7-B) become the operational unit for scheduling and daily attendance, aligning the data model with how real schools operate.

## Problem Statement

**Current state:**

- Timetable slots are anchored to `Class` (a subject offering like "Math Grade 1") via `classId`
- Attendance resolves student rosters by querying `StudentClass` join table
- The `Class` model is subject-based: 240 classes = 20 subjects x 12 grades
- `StudentClass` is empty -- no students are enrolled in any subject classes
- Timetable generation produces `classId`-based slots that represent "which subject is taught" but not "which group of students attends"

**Why this fails:**

- A section of 30 students attends the same schedule all day. The timetable should say "Grade 1-A has Science in Period 2 in the Lab" -- not "Science Grade 1 happens in Period 2"
- Attendance teachers open a section (their homeroom), not a subject class
- Common classrooms (lab, gym) are just locations -- they do not have separate rosters
- The `StudentClass` join table is empty and not the natural enrollment model; `Student.sectionId` already exists and is populated

**Target state:**

- Timetable slots have `sectionId` (which section) + `subjectId` (which subject) + `classroomId` (where) + `teacherId` (who)
- Attendance queries `section.students` (via `Student.sectionId`) instead of `StudentClass`
- Generation algorithm iterates over sections, assigning subjects to time slots
- `classId` is retained but made optional for backward compatibility with 750 existing production slots

## Success Metrics

1. Timetable generation produces section-based schedules
2. Attendance loads student roster from `Student.sectionId`
3. Existing 750 timetable slots (with `classId`, without `sectionId`) continue to render
4. Zero cross-tenant data leaks (all queries retain `schoolId`)
5. No data loss during migration (additive schema changes only)

## Constraints

- **Backward compatibility**: `classId` stays optional on Timetable, not removed
- **Production safety**: 750 existing slots have `classId` but no `sectionId`; migration must handle gracefully
- **Additive-only migrations**: New columns, new indexes -- no drops, no renames
- **Multi-tenant**: Every new query must include `schoolId`
- **i18n**: Section names stored in single language with `lang` field, translated on demand

---

## Timeline Estimate

| Phase                   | Duration  | Dependency |
| ----------------------- | --------- | ---------- |
| 1. Schema               | 2-4 hours | None       |
| 2. Algorithm            | 4-6 hours | Phase 1    |
| 3. Timetable UI/Actions | 4-6 hours | Phase 2    |
| 4. Attendance System    | 4-6 hours | Phase 1    |
| 5. Documentation        | 1-2 hours | Phase 3-4  |

**Total estimate: 2-3 days** (Complexity Level 3)
