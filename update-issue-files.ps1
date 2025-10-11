# PowerShell script to add Technology Stack section to ISSUE.md files

$technologySection = @"
---

## Technology Stack & Version Requirements

This feature uses the platform's standard technology stack (see [Platform ISSUE.md](../ISSUE.md#technology-stack--version-requirements) for complete details):

### Core Stack
- **Next.js 15.4+** with App Router and Server Components
- **React 19+** with Server Actions and new hooks
- **TypeScript 5.x** in strict mode
- **Neon PostgreSQL** with autoscaling and branching
- **Prisma ORM 6.14+** for type-safe database access

### UI & Forms
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS 4** with OKLCH colors
- **React Hook Form 7.61+** for form state management
- **Zod 4.0+** for schema validation
- **TanStack Table 8.21+** for data tables

### Authentication & Security
- **NextAuth.js v5** with JWT sessions
- Multi-tenant isolation via ``schoolId`` scoping
- CSRF protection and secure cookie handling
- Type-safe environment variables

### Development & Testing
- **Vitest 2.0+** for unit testing
- **Playwright 1.55+** for E2E testing
- **ESLint + Prettier** for code quality
- **pnpm 9.x** as package manager

### Key Patterns
- **Server Actions**: All mutations use "use server" directive
- **Multi-Tenant**: Every query scoped by ``schoolId`` from session
- **Type Safety**: End-to-end TypeScript with Prisma + Zod
- **Validation**: Double validation (client UX + server security)

For detailed version requirements and architecture patterns, see [Platform Technology Stack](../ISSUE.md#technology-stack--version-requirements).

---
"@

$files = @(
    "D:\repo\hogwarts\src\components\platform\assignments\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\results\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\lessons\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\announcements\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\events\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\parents\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\parent-portal\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\dashboard\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\settings\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\admin\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\profile\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\import\ISSUE.md",
    "D:\repo\hogwarts\src\components\platform\subjects\ISSUE.md"
)

$updated = 0
$failed = 0

foreach ($file in $files) {
    try {
        if (Test-Path $file) {
            $content = Get-Content -Path $file -Raw

            # Find the "Last Review:" line and insert before it
            if ($content -match '(\r?\n)(---\r?\n\r?\n\*\*Status Legend:\*\*)') {
                $newContent = $content -replace '(\r?\n)(---\r?\n\r?\n\*\*Status Legend:\*\*)', "`$1$technologySection`$2"
                Set-Content -Path $file -Value $newContent -NoNewline
                Write-Host "Updated: $file" -ForegroundColor Green
                $updated++
            } else {
                Write-Host "Pattern not found in: $file" -ForegroundColor Yellow
                $failed++
            }
        } else {
            Write-Host "File not found: $file" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "Error updating $file : $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Successfully updated: $updated files" -ForegroundColor Green
Write-Host "Failed: $failed files" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
