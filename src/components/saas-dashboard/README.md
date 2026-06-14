## SaaS Dashboard — Platform Operator Control Center

### Overview

The saas-dashboard block provides platform-level management tools for operating the multi-tenant Hogwarts SaaS system. It enables DEVELOPER-role users to manage schools (tenants), domains, billing, catalog content, observability, and high-level product configuration across all tenants. This is separate from the school-dashboard, which manages individual school operations.

### Capabilities by Role

- **Developer (Platform Operator)**: Full access to tenant management, billing, domains, observability, catalog, analytics, user management, sales, and product configuration

### Routes

| Route                                       | Page                                                      | Status      |
| ------------------------------------------- | --------------------------------------------------------- | ----------- |
| `/{lang}/(saas-dashboard)/dashboard`        | Operator overview with KPI metrics                        | Ready       |
| `/{lang}/(saas-dashboard)/tenants`          | Tenant management table                                   | Ready       |
| `/{lang}/(saas-dashboard)/tenants/analysis` | Tenant analytics                                          | Ready       |
| `/{lang}/(saas-dashboard)/billing`          | Invoice management                                        | Ready       |
| `/{lang}/(saas-dashboard)/billing/receipts` | Receipt review workflow                                   | Ready       |
| `/{lang}/(saas-dashboard)/domains`          | Domain request management                                 | Ready       |
| `/{lang}/(saas-dashboard)/observability`    | Audit logs and monitoring                                 | Ready       |
| `/{lang}/(saas-dashboard)/analytics`        | MRR, churn, revenue analytics                             | Ready       |
| `/{lang}/(saas-dashboard)/sales`            | Sales management                                          | Ready       |
| `/{lang}/(saas-dashboard)/sales/analytics`  | Sales analytics                                           | Ready       |
| `/{lang}/(saas-dashboard)/sales/import`     | Sales data import                                         | Ready       |
| `/{lang}/(saas-dashboard)/users`            | User management                                           | Ready       |
| `/{lang}/(saas-dashboard)/users/analysis`   | User analytics                                            | Ready       |
| `/{lang}/(saas-dashboard)/product`          | Product configuration                                     | Ready       |
| `/{lang}/(saas-dashboard)/catalog/*`        | Subject, book, material, question catalog (10 sub-routes) | Ready       |
| `/{lang}/(saas-dashboard)/kanban`           | Kanban board                                              | In Progress |

### File Structure

```
src/components/saas-dashboard/
+-- nav-main.tsx                 # Main navigation
+-- nav-user.tsx                 # User menu
+-- breadcrumbs.tsx              # Breadcrumb navigation
+-- breadcrumb-title.tsx         # Dynamic titles
+-- search-input.tsx             # Global search
+-- impersonation-banner.tsx     # Impersonation indicator
+-- user-avatar-profile.tsx      # User avatar
+-- types/                       # Shared type definitions
+-- auth/                        # Operator auth guard
+-- hooks/                       # Shared hooks
+-- lib/                         # Shared utilities
+-- common/                      # Shared components
+-- dashboard/                   # Operator overview (metrics, charts)
+-- tenants/                     # Tenant CRUD, stats, analysis
+-- billing/                     # Invoices, receipts, stats
+-- domains/                     # Domain requests, DNS config
+-- observability/               # Audit logs, filtering
+-- analytics/                   # MRR, churn, revenue trends
+-- catalog/                     # Subject, book, material, question, assignment catalog
+-- sales/                       # Sales tracking
+-- users/                       # User management
+-- product/                     # Product configuration
+-- products/                    # Product listing components
+-- kanban/                      # Kanban board
```

### Status

**Completion:** 84% | **Blockers:** None | **Last optimization pass:** 2026-06-14

Core SaaS features are production-ready: tenants, billing, domains, observability, analytics, and dashboard. Catalog management is functional with subjects, books, materials, questions, assignments, and approvals. Kanban and product areas are demo-level (now hidden from operator nav). File storage integration for receipt uploads is pending.

> **2026-06-14:** A full audit (181 findings) fixed all 6 P0s + ~24 P1/P2 — notably the
> systemic `planType` case bug that zeroed MRR, and the operator dashboard's fabricated
> data (now wired to real platform metrics). Remaining work and the canonical finding list
> are tracked in `OPTIMIZATION_BACKLOG.md` (+ `.audit-findings.json`).

### Integration Points

- [School Dashboard](../school-dashboard/README.md) -- Manages individual schools that this block oversees
- [Onboarding](../onboarding/) -- New school creation flow
- [Auth](../auth/) -- Operator auth guard and impersonation
