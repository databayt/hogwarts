## Unified Dashboard: Role‑Aware Multi‑Tenant Console

This document proposes a unified, role‑aware dashboard for the School Automation SaaS. It consolidates the existing operator/admin/school experiences into a single, consistent dashboard shell with a shared header and sidebar, while keeping data strictly tenant‑scoped and routes clean.

### Goals

- **One dashboard** with a single chrome (header + sidebar), **role‑aware navigation**, and clean URLs
- **Minimize duplication** (e.g., unify settings under `/settings`)
- **Mirror rule** across `app/` and `components/` and follow shadcn/ui naming and file placement
- **Multi‑tenant safety**: every query and write includes `schoolId`
- **Typed, small server actions** and Zod validation co‑located with each feature
- **Incremental migration** with redirects; keep the app shippable at each step

### References and Constraints

- Use `pnpm` for all commands (`pnpm install`, `pnpm dev`, `pnpm build`)
- UI: shadcn/ui (+ Radix + Tailwind). Base primitives in `src/components/ui/*`
- Mirror pattern (mandatory): each route mirrors feature code under `src/components/<segment>` and page imports `{FolderName}Content`
- Server Actions use the "use server" directive; revalidate or redirect on success
- Auth: NextAuth v5 (Auth.js). Respect session shape in `src/auth.ts`. Keep callbacks pure and typed
- Multi‑tenant: include `schoolId` in every DB query and write


## Roles and Access Model

We assume roles from session (`src/auth.ts`):

- OPERATOR (SaaS owner/platform ops)
- OWNER (School owner/principal)
- ADMIN (School admin)
- ACCOUNTANT
- TEACHER
- STUDENT
- PARENT

Use a typed role enum and guard utilities at route boundaries and inside server actions.


## Route Topology (New)

Two route groups under `/(platform)`:

- `/(platform)/dashboard/*` → operator‑focused suite (SaaS/platform scope)
- `/(platform)/*` → school operational features (tenant scope)

The unified shell (header + sidebar) lives at `src/app/(platform)/layout.tsx` and wraps both areas, ensuring one consistent dashboard feel.

```text
/(platform)
  ├─ layout.tsx                # shared chrome: header + sidebar (role‑aware nav)
  ├─ settings/                 # unified route; role‑aware (school/platform)
  │   └─ page.tsx
  ├─ dashboard/                # operator (SaaS) area
  │   ├─ page.tsx              # overview
  │   ├─ billing/page.tsx
  │   ├─ charts/page.tsx
  │   ├─ domains/page.tsx
  │   ├─ kanban/page.tsx
  │   ├─ observability/page.tsx
  │   ├─ product/page.tsx
  │   ├─ profile/page.tsx
  │   └─ tenants/page.tsx
  ├─ announcements/page.tsx
  ├─ attendance/page.tsx
  ├─ classes/page.tsx
  ├─ orders/page.tsx
  ├─ profile/page.tsx
  ├─ students/page.tsx
  ├─ teachers/page.tsx
  └─ timetable/page.tsx
```

Legacy `/(school)` and `/(platform)/operator` routes will be redirected to the new layout during migration.


## Components Mirror (New)

Every route mirrors feature code under `src/components/platform/<feature>/*`, following the standardized file set.

```text
src/components/platform/
  dashboard/
    header.tsx
    sidebar.tsx
    nav.ts
    content.tsx
    type.ts
    use-dashboard.ts
  settings/
    content.tsx            # role‑aware wrapper
    platform/
      content.tsx
      actions.ts
      validation.ts
      type.ts
    school/
      content.tsx
      actions.ts
      validation.ts
      type.ts
  announcements/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  attendance/
    content.tsx
    actions.ts
    validation.ts
    type.ts
    reports/content.tsx
  classes/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  students/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  teachers/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  timetable/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  orders/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  billing/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  charts/
    content.tsx
    type.ts
  domains/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  kanban/
    content.tsx
    type.ts
  observability/
    content.tsx
    type.ts
  product/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  profile/
    content.tsx
    actions.ts
    validation.ts
    type.ts
  tenants/
    content.tsx
    actions.ts
    validation.ts
    type.ts
```

Standardized files per feature:

- `content.tsx` (UI composition)
- `actions.ts` (server actions; "use server"; typed inputs/outputs)
- `validation.ts` (Zod schema; types inferred)
- `type.ts` (public interfaces/types)
- Optional: `column.tsx`, `use-<feature>.ts` for data‑table blocks


## Unified Dashboard Shell

Shared chrome at `src/app/(platform)/layout.tsx` applies across all dashboard pages.

```tsx
// src/app/(platform)/layout.tsx
import { ReactNode } from "react";
import { getSession } from "@/auth"; // NextAuth v5 wrapper, typed
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { DashboardSidebar } from "@/components/platform/dashboard/sidebar";
import { getNavItems } from "@/components/platform/dashboard/nav";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const nav = getNavItems({ role: session?.user.role, schoolId: session?.user.schoolId });

  return (
    <div className="min-h-screen w-full flex">
      <DashboardSidebar items={nav} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

Navigation config is centralized and filtered by role.

```ts
// src/components/platform/dashboard/type.ts
export type Role =
  | "OPERATOR"
  | "OWNER"
  | "ADMIN"
  | "ACCOUNTANT"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  roles: Role[];
  children?: NavItem[];
  exact?: boolean;
};
```

```ts
// src/components/platform/dashboard/nav.ts
import { NavItem, Role } from "./type";

const items: NavItem[] = [
  // Operator (SaaS) area
  { label: "Overview", href: "/dashboard", icon: "home", roles: ["OPERATOR"] },
  { label: "Tenants", href: "/dashboard/tenants", icon: "building", roles: ["OPERATOR"] },
  { label: "Domains", href: "/dashboard/domains", icon: "globe", roles: ["OPERATOR", "OWNER"] },
  { label: "Observability", href: "/dashboard/observability", icon: "activity", roles: ["OPERATOR"] },
  { label: "Product", href: "/dashboard/product", icon: "package", roles: ["OPERATOR"] },
  { label: "Kanban", href: "/dashboard/kanban", icon: "kanban", roles: ["OPERATOR"] },
  { label: "Charts", href: "/dashboard/charts", icon: "bar-chart-3", roles: ["OPERATOR", "OWNER", "ADMIN"] },
  { label: "Billing", href: "/dashboard/billing", icon: "credit-card", roles: ["OPERATOR", "OWNER", "ACCOUNTANT"] },

  // School operations (tenant‑scoped)
  { label: "Announcements", href: "/announcements", icon: "megaphone", roles: ["OWNER","ADMIN","TEACHER"] },
  { label: "Attendance", href: "/attendance", icon: "check-square", roles: ["OWNER","ADMIN","TEACHER"] },
  { label: "Classes", href: "/classes", icon: "layers", roles: ["OWNER","ADMIN","TEACHER"] },
  { label: "Students", href: "/students", icon: "users", roles: ["OWNER","ADMIN","TEACHER"] },
  { label: "Teachers", href: "/teachers", icon: "user-check", roles: ["OWNER","ADMIN"] },
  { label: "Timetable", href: "/timetable", icon: "calendar", roles: ["OWNER","ADMIN","TEACHER","STUDENT","PARENT"] },
  { label: "Orders", href: "/orders", icon: "receipt", roles: ["OWNER","ADMIN","ACCOUNTANT"] },

  // Shared
  { label: "Settings", href: "/settings", icon: "settings", roles: ["OPERATOR","OWNER","ADMIN","ACCOUNTANT","TEACHER","STUDENT","PARENT"] },
  { label: "Profile", href: "/dashboard/profile", icon: "user", roles: ["OPERATOR","OWNER","ADMIN","ACCOUNTANT","TEACHER","STUDENT","PARENT"] },
];

export function getNavItems({ role }: { role?: Role | null }) {
  if (!role) return [];
  return items.filter((i) => i.roles.includes(role));
}
```


## URL Plan and Path De‑duplication

Unify settings at `/(platform)/settings` (role‑aware). Keep short, tenant‑friendly paths for school features while keeping operator content within `/dashboard/*`.

### Legacy → New Mapping

| Legacy Route | New Route |
| --- | --- |
| `/(platform)/operator/overview` | `/(platform)/dashboard` |
| `/(platform)/operator/tenants` | `/(platform)/dashboard/tenants` |
| `/(platform)/operator/domains` | `/(platform)/dashboard/domains` |
| `/(platform)/operator/observability` | `/(platform)/dashboard/observability` |
| `/(platform)/operator/product` | `/(platform)/dashboard/product` |
| `/(platform)/operator/kanban` | `/(platform)/dashboard/kanban` |
| `/(platform)/operator/billing` | `/(platform)/dashboard/billing` |
| `/(school)/dashboard` | `/(platform)/dashboard` (role‑aware overview) |
| `/(school)/dashboard/billing` | `/(platform)/dashboard/billing` |
| `/(school)/dashboard/charts` | `/(platform)/dashboard/charts` |
| `/(school)/dashboard/settings` | `/(platform)/settings` |
| `/(school)/admin/orders` | `/(platform)/orders` |

During migration, add server redirects in legacy pages:

```tsx
// example: src/app/(school)/admin/orders/page.tsx
import { redirect } from "next/navigation";
export default function LegacyOrdersRedirect() {
  redirect("/orders");
}
```


## Unified Settings

Single route `/(platform)/settings` renders role‑appropriate content. Optional deep links under `/settings/school` and `/settings/platform` are supported.

```tsx
// src/app/(platform)/settings/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { SettingsContent } from "@/components/platform/settings/content";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <SettingsContent role={session.user.role} schoolId={session.user.schoolId} />
  );
}
```

```tsx
// src/components/platform/settings/content.tsx
"use client";
import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlatformSettingsContent from "./platform/content";
import SchoolSettingsContent from "./school/content";
import type { Role } from "@/components/platform/dashboard/type";

export function SettingsContent({ role, schoolId }: { role: Role; schoolId?: string }) {
  const canPlatform = role === "OPERATOR";
  const canSchool = ["OWNER","ADMIN","ACCOUNTANT"].includes(role);
  const defaultTab = useMemo(() => (canSchool ? "school" : "platform"), [canSchool]);
  return (
    <div>
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          {canSchool && <TabsTrigger value="school">School</TabsTrigger>}
          {canPlatform && <TabsTrigger value="platform">Platform</TabsTrigger>}
        </TabsList>
        {canSchool && (
          <TabsContent value="school">
            <SchoolSettingsContent schoolId={schoolId!} />
          </TabsContent>
        )}
        {canPlatform && (
          <TabsContent value="platform">
            <PlatformSettingsContent />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```


## Shared Feature Pages (SaaS and School)

For pages like billing and settings, keep a single route and render the correct view by role. There are two complementary approaches:

- Option A (tabs): Use tabs to show both scopes if the user has both privileges (already shown in Unified Settings).
- Option B (auto mode): Auto-pick the correct scope on the server and render only one sub-view.

### Option B: Role‑Aware View Resolver

Create a small helper that resolves a view context from the session.

```ts
// src/lib/view-context.ts
import { getSession } from "@/auth";

export type ViewContext =
  | { mode: "platform"; schoolId?: undefined }
  | { mode: "school"; schoolId: string };

export async function getViewContext(): Promise<ViewContext> {
  const session = await getSession();
  const role = session?.user.role;
  const schoolId = session?.user.schoolId;

  if (role === "OPERATOR") return { mode: "platform" };
  if (schoolId && ["OWNER","ADMIN","ACCOUNTANT","TEACHER","STUDENT","PARENT"].includes(role as string)) {
    return { mode: "school", schoolId };
  }
  throw new Error("Forbidden");
}
```

Use it in pages to pick the correct sub‑content.

```tsx
// src/app/(platform)/settings/page.tsx  (Option B implementation)
import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { getViewContext } from "@/lib/view-context";
import { SettingsContent } from "@/components/platform/settings/content.mode";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const context = await getViewContext();
  return <SettingsContent context={context} />;
}
```

```tsx
// src/components/platform/settings/content.mode.tsx  (Option B renderer)
"use client";
import type { ViewContext } from "@/lib/view-context";
import PlatformSettingsContent from "./platform/content";
import SchoolSettingsContent from "./school/content";

export function SettingsContent({ context }: { context: ViewContext }) {
  if (context.mode === "platform") return <PlatformSettingsContent />;
  return <SchoolSettingsContent schoolId={context.schoolId} />;
}
```

Apply the same pattern for billing.

```tsx
// src/app/(platform)/dashboard/billing/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { getViewContext } from "@/lib/view-context";
import { BillingContent } from "@/components/platform/billing/content.mode";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const context = await getViewContext();
  return <BillingContent context={context} />;
}
```

```tsx
// src/components/platform/billing/content.mode.tsx
"use client";
import type { ViewContext } from "@/lib/view-context";
import { PlatformBilling } from "./platform/content";
import { SchoolBilling } from "./school/content";

export function BillingContent({ context }: { context: ViewContext }) {
  if (context.mode === "platform") return <PlatformBilling />;
  return <SchoolBilling schoolId={context.schoolId} />;
}
```

Separate server actions by scope to keep guards simple and explicit.

```ts
// src/components/platform/billing/school/actions.ts
"use server";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { schoolBillingSchema } from "./validation";

export async function updateSchoolPlan(input: z.infer<typeof schoolBillingSchema>) {
  const parsed = schoolBillingSchema.parse(input);
  const schoolId = await requireTenant();
  return db.subscription.upsert({
    where: { schoolId },
    create: { schoolId, ...parsed },
    update: { ...parsed },
  });
}
```

```ts
// src/components/platform/billing/platform/actions.ts
"use server";
import { z } from "zod";
import { requireOperator } from "@/lib/require-operator";
import { db } from "@/lib/db";
import { platformBillingSchema } from "./validation";

export async function setPlanLimits(input: z.infer<typeof platformBillingSchema>) {
  await requireOperator();
  const parsed = platformBillingSchema.parse(input);
  return db.plan.update({ where: { id: parsed.planId }, data: parsed.data });
}
```


## Data Access and Tenant Scoping

- Every business query includes `{ schoolId }` from session/subdomain.
- Operator pages may aggregate across tenants but must not leak tenant data to tenant‑scoped contexts.
- Add `requireTenant()` helper for server actions.

```ts
// src/lib/tenant.ts
import { getSession } from "@/auth";

export async function requireTenant(): Promise<string> {
  const session = await getSession();
  const schoolId = session?.user.schoolId;
  if (!schoolId) throw new Error("Tenant missing");
  return schoolId;
}
```

Server action pattern:

```ts
// src/components/platform/announcements/actions.ts
"use server";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { announcementSchema } from "./validation";

export async function createAnnouncement(input: z.infer<typeof announcementSchema>) {
  const parsed = announcementSchema.parse(input);
  const schoolId = await requireTenant();
  const created = await db.announcement.create({
    data: { ...parsed, schoolId },
  });
  return created;
}
```


## Feature Mirrors and Data Table

- Use the shared Data Table block (TanStack Table + shadcn/ui)
- Define columns in `column.tsx` with `DataTableColumnHeader`
- State sync to URL (via `nuqs`) when relevant; server is source of truth for pagination/sort/filter


## Reusing Existing Code (`backup-thakm`)

Map and migrate into `src/components/platform/*`, aligning to naming and validation patterns:

- `backup-thakm/announcements/*` → `platform/announcements/*`
- `backup-thakm/attendance/*` → `platform/attendance/*`
- `backup-thakm/timetable/*` → `platform/timetable/*`
- `backup-thakm/students/*` → `platform/students/*`
- `backup-thakm/teachers/*` → `platform/teachers/*`
- `backup-thakm/classes/*` → `platform/classes/*`
- `backup-thakm/settings/*` → `platform/settings/school/*`
- `backup-thakm/profile/*` → `platform/profile/*`

Adjust imports to `@/components/...`, ensure Zod schemas live in `validation.ts`, and all server actions include `schoolId`.


## Migration Plan (Incremental)

1) Scaffold the unified chrome
- Add `src/app/(platform)/layout.tsx`
- Add `src/components/platform/dashboard/{header.tsx,sidebar.tsx,nav.ts,type.ts}`

2) Bootstrap operator routes under `/(platform)/dashboard/*`
- Move or re‑export existing operator pages into the new structure
- Lift view logic into `src/components/platform/*`

3) Bootstrap school routes under `/(platform)/*`
- Create `announcements`, `attendance`, `classes`, `students`, `teachers`, `timetable`, `orders`, `profile`
- Port content from `backup-thakm` into mirrored components

4) Unify settings
- Implement `/(platform)/settings` with role‑aware tabs
- Move `backup-thakm/settings` to `components/platform/settings/school`

5) Redirect legacy routes
- `/(school)/dashboard/*` → new counterparts
- `/(school)/admin/orders` → `/orders`
- `/(platform)/operator/*` → `/dashboard/*`

6) QA and remove deprecated pages
- Verify role nav visibility, access guards, and tenant scoping
- Remove legacy pages after verification


## Auth, Guards, and Errors

- NextAuth v5. Pure, typed callbacks. Session exposes `user.role` and `user.schoolId`
- Server guard helpers:
  - `requireOperator()` for operator‑only pages
  - `requireSchoolRole(allowed: Role[])` for tenant pages
  - `requireTenant()` as shown above
- Fail closed (redirect/login or 403), never leak cross‑tenant data


## UI and Styling

- shadcn/ui primitives in `src/components/ui/*`
- Tailwind utilities; use `cn` helper from `@/lib/utils`
- Keep components small and composable; avoid inline styles


## i18n and Accessibility

- Arabic‑first (RTL) with English (LTR). Ensure the dashboard shell mirrors correctly
- Tabs, menus, and dialogs must be keyboard accessible (WCAG AA)


## Observability and Performance

- Log `requestId` and `schoolId` for traceability
- Keep pages lightweight; prefer server components and streamed UI where useful


## Testing and QA Checklist

- Unit: nav filtering by role; settings tab visibility
- Integration: server actions enforce tenant scoping; role guards
- E2E: primary flows (attendance, announcements, orders), redirects from legacy routes
- i18n snapshots (ar/en); RTL/LTR layout checks


## Rollout Steps

1) Create the unified chrome and 2–3 example routes (overview, announcements, settings)
2) Port operator pages into `/dashboard/*`
3) Port `backup-thakm` features incrementally
4) Add redirects and perform QA
5) Remove deprecated routes

Commands:

```bash
pnpm install
pnpm dev
pnpm build
```


## Open Questions (Decide Early)

- Do we expose deep links for settings (`/settings/{school|platform}`) or keep tab‑only?
- Which personas see cross‑tenant charts (OWNER/ADMIN vs OPERATOR‑only)?
- Do we need feature flags for rollout, or can we ship behind route‑level redirects?


---

This plan aligns with the workspace standards (shadcn/ui, mirror pattern, server actions, tenant scoping) and consolidates operator/admin/school experiences under a single, role‑aware dashboard while minimizing duplication and risk during migration.


