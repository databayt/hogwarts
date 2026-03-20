## Grades — Report cards, transcripts, certificates, and student promotion

### Overview

Comprehensive grading system covering report card generation, transcript management, certificate PDF creation, and student promotion workflows. Features a composable certificate template system with regional presets (US Standard, Saudi National, Sudan National, MENA Private), configurable header/body/footer/signature sections, and batch PDF generation via `@react-pdf/renderer`.

### Capabilities by Role

- **ADMIN**: Full access -- generate report cards, manage transcripts, approve promotions, configure grade policies
- **TEACHER**: Generate report cards for their classes, view transcripts
- **STUDENT**: View own report cards and transcripts (via portal)
- **GUARDIAN**: View child report cards (via portal)

### Routes

| Route                                                                           | Page                | Status |
| ------------------------------------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades`                    | Grades overview     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/[id]`               | Grade detail        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/add/[id]/selection` | Student selection   | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/add/[id]/scoring`   | Score entry         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/reports`            | Report cards        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/promotion`          | Promotion dashboard | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/transcripts`        | Transcripts         | Ready  |
| `/api/grades/[id]`                                                              | Grade API endpoint  | Ready  |

### File Structure

```
src/components/school-dashboard/grades/
├── actions/
│   ├── index.ts              # Re-exports all actions
│   ├── certificate-pdf.ts    # PDF generation (single + batch)
│   ├── notifications.ts      # Grade notification dispatch
│   ├── promotion.ts          # Promotion candidates, policies, batch approval
│   ├── report-cards.ts       # Report card generation, fetch, publish
│   └── transcripts.ts        # Transcript generation and verification
├── promotion/
│   ├── content.tsx           # Server component (fetches batches, years, grades)
│   ├── dashboard.tsx         # Client component (promotion management UI)
│   └── index.ts
├── report-cards/
│   ├── content.tsx           # Server component (report card list + generation)
│   ├── table.tsx             # Report card DataTable
│   └── index.ts
├── transcripts/
│   ├── content.tsx           # Server component (transcript list)
│   ├── table.tsx             # Transcript DataTable
│   └── index.ts
└── templates/
    ├── composable.tsx        # Main composable certificate renderer
    ├── types.ts              # Template type definitions
    ├── config.ts             # Template configuration
    ├── index.ts
    ├── atom/                 # Atomic elements (QR code, seal, ribbon, badge, etc.)
    ├── header/               # Header variants (ministry, crest, bilingual, minimal)
    ├── title/                # Title variants (classic, elegant, modern, arabic-calligraphy)
    ├── recipient/            # Recipient blocks (underline, framed, centered, photo)
    ├── body/                 # Body variants (achievement, transcript, report-summary, custom)
    ├── scores/               # Score displays (table-grid, badge-row, gauge, hidden)
    ├── signatures/           # Signature blocks (single, dual, triple, stamps)
    ├── footer/               # Footer variants (dated, verification, numbered, minimal)
    ├── composition/          # Template composition engine (registry, resolver, defaults)
    └── presets/              # Regional presets (us-standard, sa-national, sd-national, mena-private)
```

### Status

**Completion:** 85% | **Blockers:** None

### Integration Points

- `src/components/file/generate/report-card.tsx` -- React-PDF report card template
- `src/components/file/providers/factory.ts` -- File storage provider for PDF uploads
- `src/app/api/grades/[id]/route.ts` -- REST API for grade data
- Prisma models: Grade, ReportCard, Transcript, PromotionBatch, PromotionPolicy
