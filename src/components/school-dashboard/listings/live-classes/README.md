# Live Classes

A DB-backed listings feature for scheduling external-meeting-link live classes
(Google Meet / Zoom / Teams). Admins and teachers schedule a session (title,
teacher, optional subject/section, date range + start/end time, external meeting
URL); it persists to `LiveClassSession` scoped by `schoolId`.

## Pattern

This block follows the **announcements triplet** pattern with an
**admission-campaign-style** modal form:

- `content.tsx` — server component: `getTenantContext()` → `getLiveClassesList()`
  → on-demand title translation via `getDisplayText()` → renders the table.
- `table.tsx` — client: `usePlatformData` (optimistic delete), `usePlatformView`
  (table/grid toggle), `PlatformToolbar` with `onCreate={() => openModal()}`, and
  a bottom-mounted `<Modal hideClose content={<LiveClassForm />} />`. `openModal(id)`
  opens the modal in edit mode.
- `columns.tsx` — `getLiveClassColumns(dictionary, locale, { onEdit, onDelete })`.
  Columns: title, teacher, subject/grade, date (range), time, status badge, and an
  actions menu (Join → opens `meetingUrl` in a new tab, Edit → `openModal(id)`,
  Delete). Exports the `LiveClassRow` type.
- `form.tsx` — mirrors `admission/campaign-form.tsx`: the `Popover` +
  `Calendar mode="range"` wired to RHF `startDate`/`endDate`, plus `startTime`/
  `endTime` (`<Input type="time">`), `meetingUrl`, `meetingProvider`, and the
  teacher/subject/section selects. On submit it combines
  `scheduledStart = startDate@startTime`, `scheduledEnd = endDate@endTime`, sets
  `provider="external"` and `status="scheduled"`. Edit mode loads via `getLiveClass`.
- `actions.ts` — `createLiveClass`, `updateLiveClass`, `deleteLiveClass`,
  `getLiveClass`, `getLiveClasses`, and `getLiveClassFormData` (dropdown data).
  Every action: `auth()` → `getTenantContext()` → permission gate → Zod parse →
  scoped `db.liveClassSession` op (`updateMany`/`create` with `schoolId`) →
  `revalidatePath("/live-classes")` → `ActionResponse`.
- `queries.ts` — `getLiveClassesList` / `getLiveClassDetail`; every where clause
  includes `schoolId` and `deletedAt: null`.
- `validation.ts` — dictionary-factory `createLiveClassSchema(v)` (title, teacherId
  required; subject/section optional; meetingUrl as URL; date-range via
  `z.coerce.date()`; `HH:mm` times; `.refine(endDate >= startDate)`).
- `list-params.ts` — `createSearchParamsCache` (page, perPage, title, status, sort).
- `permissions.ts` — `getUIConfigForRole(role)` + `canManageLiveClasses` /
  `canDeleteLiveClasses`. ADMIN/DEVELOPER full (incl. delete); STAFF/TEACHER
  create+edit; everyone else read-only.

## Field → column mapping (create / update)

| Form field        | Persisted column                                |
| ----------------- | ----------------------------------------------- |
| `title`           | `title` (+ `lang` from `detectLanguage(title)`) |
| `teacherId`       | `teacherId` (required, verified in-tenant)      |
| `subjectId`       | `subjectId` (`null` if empty)                   |
| `sectionId`       | `sectionId` (`null` if empty)                   |
| `meetingUrl`      | `meetingUrl`                                    |
| `meetingProvider` | `meetingProvider` (`null` if empty)             |
| `startDate` + `startTime` | `scheduledStart` (date@time)            |
| `endDate` + `endTime`     | `scheduledEnd` (date@time)              |
| `status`          | `status` (default `scheduled`)                  |
| `description`     | `description`                                   |
| (always)          | `provider = "external"`                          |

## Multi-tenant safety

Every read filters `schoolId` + `deletedAt: null`. Writes use
`updateMany`/`create` scoped by `{ id, schoolId }`. Delete is **soft**
(`deletedAt = now()`). The teacher FK is verified to belong to the school before
create/update.

## Path reconciliation follow-up (feat/live-classes)

This listing lives at `(listings)/live-classes/` and is **external-provider
only** (video rooms / LiveKit deferred). The full LiveKit feature on branch
`feat/live-classes` uses `(school-dashboard)/live-classes/`. When that lands, the
team picks one home and merges the two. Until then, this block writes
`provider: "external"` on every create and never touches `roomName`/`roomSid`.

## i18n

All visible strings come from `dictionary.school.liveClasses` (added to
`school-en.json` / `school-ar.json` as a sibling of `announcements`). Validation
messages flow through the `createLiveClassSchema(dictionary.validation)` factory.
Zero hardcoded strings; no inline RTL/LTR ternaries.
