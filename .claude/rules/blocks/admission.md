---
paths:
  - "src/components/school-dashboard/admission/**"
  - "src/components/school-marketing/admission/**"
  - "src/components/school-marketing/application/**"
  - "src/app/**/admission/**"
  - "src/app/**/apply/**"
  - "prisma/models/admission.prisma"
---

# Admission Pipeline (Cross-Block Rule)

The admission feature spans two sides that share a Prisma model (`prisma/models/admission.prisma`):

- **Dashboard side** (`src/components/school-dashboard/admission/`): Admin review, merit lists, enrollment confirmation
- **Marketing side** (`src/components/school-marketing/admission/` + `application/`): Public application form, status tracking, tour booking

Changes on one side often require changes on the other. When modifying:

- Prisma model fields → check both dashboard and marketing components
- Application status transitions → verify both admin actions and applicant-facing status display
- Validation schemas → marketing `validation.ts` and dashboard `validation.ts` may need sync
- i18n keys → check `school-ar.json` and `school-en.json` for admission-related entries

Read both block CLAUDE.md files for side-specific context.
