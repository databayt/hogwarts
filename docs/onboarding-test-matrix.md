# Onboarding Test Matrix — All Scenarios & Expected Auto-Configurations

## Test Workflow

1. Reset: `pnpm db:reset-test-user`
2. Login as `user@databayt.org` (password: `1234`)
3. Start onboarding with scenario parameters
4. Complete all 15 steps through legal → congratulations
5. Run verification query
6. Compare counts against expected table
7. Cleanup school + reset user
8. Repeat with next scenario

## Compact Summary Table

| #   | Country | Type    | Level     | Curriculum        | Subjects | Levels | Grades | Streams | Timetable      | Periods | Classrooms (×2 sect) |
| --- | ------- | ------- | --------- | ----------------- | -------- | ------ | ------ | ------- | -------------- | ------- | -------------------- |
| 1   | US      | intl    | primary   | us-k12 (direct)   | ~108     | 1      | 6      | 0       | us-standard    | 9       | 12                   |
| 2   | US      | public  | secondary | us-k12 (direct)   | ~132     | 2      | 6      | 6       | us-standard    | 9       | 12                   |
| 3   | US      | private | both      | us-k12 (direct)   | ~240     | 3      | 12     | 6       | us-standard    | 9       | 24                   |
| 4   | SD      | public  | primary   | national→fallback | ~108     | 1      | 6      | 0       | sd-gov-default | 10      | 12                   |
| 5   | SD      | private | secondary | national→fallback | ~132     | 2      | 6      | 6       | sd-private     | 9       | 12                   |
| 6   | SD      | intl    | both      | us-k12 (direct!)  | ~240     | 3      | 12     | 6       | sd-british     | 8       | 24                   |
| 7   | SA      | private | primary   | national→fallback | ~108     | 1      | 6      | 0       | gulf-private   | 9       | 12                   |
| 8   | EG      | public  | both      | national→fallback | ~240     | 3      | 12     | 6       | mena-standard  | 9       | 24                   |
| 9   | GB      | intl    | secondary | us-k12 (direct!)  | ~132     | 2      | 6      | 6       | intl-default   | 8       | 12                   |

## Detailed Expected Counts Per Scenario

### All scenarios share:

- Departments: 6
- ScoreRanges: 9
- SchoolYear: 1
- Terms: 2
- ClassroomType: 1

### Variable counts:

| #   | YearLevels | AcadLevels | AcadGrades | Streams | Subjects | Periods | Classrooms | Sections |
| --- | ---------- | ---------- | ---------- | ------- | -------- | ------- | ---------- | -------- |
| 1   | 8          | 1          | 6          | 0       | ~108     | 9       | 12         | 12       |
| 2   | 6          | 2          | 6          | 6       | ~132     | 9       | 12         | 12       |
| 3   | 14         | 3          | 12         | 6       | ~240     | 9       | 36         | 36       |
| 4   | 8          | 1          | 6          | 0       | ~108     | 10      | 12         | 12       |
| 5   | 6          | 2          | 6          | 6       | ~132     | 9       | 12         | 12       |
| 6   | 14         | 3          | 12         | 6       | ~240     | 8       | 24         | 24       |
| 7   | 8          | 1          | 6          | 0       | ~108     | 9       | 12         | 12       |
| 8   | 14         | 3          | 12         | 6       | ~240     | 9       | 24         | 24       |
| 9   | 6          | 2          | 6          | 6       | ~132     | 8       | 12         | 12       |

Note: Scenario 3 has sectionsPerGrade=3, so classrooms = 12×3 = 36.

## Verification Query

```sql
SELECT 'year_levels' as resource, count(*) FROM year_levels WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'departments', count(*) FROM departments WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'score_ranges', count(*) FROM score_ranges WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'academic_levels', count(*) FROM academic_levels WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'academic_grades', count(*) FROM academic_grades WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'academic_streams', count(*) FROM academic_streams WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'subject_selections', count(*) FROM school_subject_selections WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'school_years', count(*) FROM school_years WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'terms', count(*) FROM terms WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'periods', count(*) FROM periods WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'classroom_types', count(*) FROM classroom_types WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'classrooms', count(*) FROM classrooms WHERE "schoolId" = 'SCHOOL_ID'
UNION ALL SELECT 'sections', count(*) FROM sections WHERE "schoolId" = 'SCHOOL_ID';
```

## Cleanup Between Tests

```sql
DELETE FROM sections WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM classrooms WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM classroom_types WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM periods WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM terms WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM school_years WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM school_week_configs WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM school_subject_selections WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM school_content_overrides WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM academic_streams WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM academic_grades WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM academic_levels WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM score_ranges WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM departments WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM year_levels WHERE "schoolId" = 'SCHOOL_ID';
DELETE FROM schools WHERE id = 'SCHOOL_ID';
```
