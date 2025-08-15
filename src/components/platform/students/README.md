### Students block

Typed, multi-tenant Students listing with server-driven pagination/sort/filter and a modal create form. Mirrors the route at `src/app/(platform)/students/page.tsx` per the mirror pattern.

### Files and responsibilities
- `content.tsx`: RSC that reads `studentsSearchParams` and fetches rows from `db.student` scoped by `schoolId`. Passes data to the client table.
- `table.tsx`: Client wrapper using `useDataTable` with URL-synced state and the shared toolbar. Injects a Create button and mounts the modal.
- `columns.tsx`: Column defs with `meta` for filters and headers via `DataTableColumnHeader`. Enable filters by setting `enableColumnFilter: true` and `meta.variant`.
- `list-params.ts`: `nuqs` cache for `page`, `perPage`, `name`, `status`, `className`, `sort`.
- `validation.ts`: Zod schemas. Client form and server actions both parse with the same schema.
- `actions.ts`: Server actions for create/update/delete/get/list. All queries include `schoolId` from `getTenantContext()` and call `revalidatePath` on success.
- `form.tsx`: Client create form using `react-hook-form` + `zodResolver`. Opens in `@/components/atom/modal/modal` and submits to `createStudent`.
- `types.ts`: Transport types (`StudentDTO`, `StudentRow`).

### Data flow (server-source-of-truth)
1) URL state → `studentsSearchParams` → `content.tsx` → Prisma where/order/skip/take
2) Server returns rows + total → `StudentsTable` → `useDataTable`
3) Filters in the toolbar update URL via `useDataTable`; server re-fetches on navigation
4) Mutations (`createStudent`, etc.) parse with Zod, scope by `schoolId`, then `revalidatePath("/dashboard/students")`

### Current behavior
- Search by name: partial, case-insensitive match on `givenName` and `surname`.
- Columns: `name`, `className`, `status`, `createdAt`.
- Filters: `name`, `status` enabled. `status` is server‑side filtered and derived from `userId` presence (`active` when `userId` exists; `inactive` otherwise). `className` UI is wired for future mapping.
- Actions:
  - View: navigates to `/students/[id]` and preserves query string (e.g. `?x-school=...` for dev tenant context). The breadcrumb shows the student name instead of the raw id.
  - Edit: opens the same modal as Create with fields prefilled.
  - Delete: shows a shadcn/ui Dialog confirmation (no native confirm). On success, a red "Deleted" toast appears.
- Create: toolbar "Create" button opens a full‑screen modal with `StudentCreateForm`; on success it closes and refreshes the page. Gender is restricted to `male`/`female` via Select.
- Toolbar layout: left‑aligned row → search, status, column visibility ("View"), then a circular outline Create icon button.
- Table styling: outline borders removed for a softer look (muted backgrounds retained by the container route; see table primitives).

### Implementation notes
- Multi-tenant: every query/mutation includes `schoolId` from `getTenantContext()`; dev can pass `?x-school=<domain>` which middleware forwards via `x-subdomain`.
- Validation: parse on client in `form.tsx`, and parse again on server in `actions.ts`.
- Toolbar filters: driven by column `meta` and `enableColumnFilter`; values sync to URL via `useDataTable`.
- Modal: provided by `@/components/atom/modal` and already mounted at `src/app/(platform)/layout.tsx`.
- Breadcrumb: client hook resolves name on `/students/[id]` via `/api/students/[id]` and swaps the last crumb’s label to the student’s name (URL remains id).

### Progress checklist (applied so far)
- [x] Mirror pattern in route and feature (`src/app/(platform)/students/page.tsx` → `src/components/platform/students/content.tsx`).
- [x] URL-synced table state with filters/pagination (`useDataTable`, toolbar).
- [x] Search by name via `name` filter and column meta.
- [x] Create flow using `@/components/atom/modal` and `StudentCreateForm` wired to `createStudent`.
- [x] Server actions parse with Zod and call `revalidatePath`.
- [x] Status filter wired on server (`active`/`inactive`).
- [x] Row actions: View/Edit/Delete (Dialog confirm + red "Deleted" toast).
- [x] Breadcrumb shows student name on `/students/[id]`.

### One-by-one plan (next fixes)
Follow this order to reach production-ready quality in line with `src/app/docs/*`:
1) Data model: add missing fields/relations used by filters.
2) Server mapping: wire `className` filter in `content.tsx` → Prisma `where`.
3) UX polish: loading/empty states.
4) AuthZ + multi-tenant hardening; typed action results.
5) Observability: log `requestId` + `schoolId` in actions.
6) Performance: indexes, avoid N+1 for class relations.

### Production-ready checklist
- Schema & data
  - [ ] Ensure `prisma/models/students.prisma` (or unified `schema.prisma`) includes required fields. Add `status` and class relationship if needed. Scope uniqueness by `{ schoolId, <field> }`.
  - [ ] Add proper indexes for `{ schoolId, createdAt }` and search fields used by filters.
  - [ ] Run migrations and seed representative data (`prisma/generator/seed.ts`).

- Server actions
  - [ ] All actions parse inputs with Zod and include `{ schoolId }` in `where`/`data`.
  - [ ] Return typed results and user-facing errors; never throw raw Prisma errors.
  - [ ] Call `revalidatePath("/dashboard/students")` (already present) or redirect as per docs.

- Filters, sort, pagination
  - [ ] Map `status` and `className` from URL to Prisma `where` in `content.tsx` (currently only `name` is mapped).
  - [ ] Provide stable default sort (createdAt desc) and verify `count` matches filters.
  - [ ] For select filters, define `options` in column `meta` (already done for `status`).

- UI/UX
  - [ ] Empty state and loading skeleton for the table.
  - [ ] Error toasts on failed actions; success toasts on create/update/delete.
  - [ ] Confirm dialog for destructive delete.
  - [ ] Form field hints and accessible labels; date pickers if preferred.

- AuthN/Z & multi-tenant
  - [ ] Respect session shape in `src/auth.ts`; protect actions behind Auth.js.
  - [ ] Never return or mutate across tenants; validate `schoolId` is present.

- Observability & reliability
  - [ ] Log `requestId` and `schoolId` on server actions per docs.
  - [ ] Handle edge cases: invalid dates, duplicate users, missing class links.

- Performance
  - [ ] Avoid N+1 on class relations; use `include` or batch queries where needed.
  - [ ] Cap `perPage` (already enforced via Zod) and use appropriate indexes.

- Docs alignment (see `src/app/docs/*`)
  - [ ] Patterns: `docs/pattern/page.mdx` (mirror, actions, validation).
  - [ ] Table: `docs/table/page.mdx` (URL sync, filters, columns meta).
  - [ ] Architecture: `docs/architecture/*` (directory, standardized files).
  - [ ] Requirements: `docs/requeriments/page.mdx` (consistency and guardrails).

### Extending filters (example)
To add a new filter:
1) Add a column or update `meta` in `columns.tsx` (e.g., `variant: "select"`, `options: [...]`, `enableColumnFilter: true`).
2) Add a key to `studentsSearchParams` in `list-params.ts`.
3) Map the key in the Prisma `where` clause in `content.tsx`.

### Route usage
`src/app/(platform)/students/page.tsx` simply re-exports `default` from `content.tsx`, matching the project’s mirror pattern.


