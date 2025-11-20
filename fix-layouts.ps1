# Fix all platform layout files to use string instead of Locale in params

$files = @(
    "src/app/[lang]/s/[subdomain]/(platform)/admin/billing/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/admin/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/announcements/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/attendance/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/classes/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/dashboard/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/events/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/exams/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/accounts/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/banking/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/budget/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/expenses/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/fees/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/invoice/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/payroll/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/receipt/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/reports/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/salary/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/timesheet/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/finance/wallet/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/lessons/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/parents/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/profile/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/stream/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/students/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/subjects/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/teachers/layout.tsx",
    "src/app/[lang]/s/[subdomain]/(platform)/timetable/layout.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw

        # Replace params type from Locale to string
        $content = $content -replace 'params: Promise<\{ lang: Locale; subdomain: string \}>', 'params: Promise<{ lang: string; subdomain: string }>'

        # Replace getDictionary(lang) with getDictionary(lang as Locale)
        $content = $content -replace 'getDictionary\(lang\)', 'getDictionary(lang as Locale)'

        # Save the file
        Set-Content $file -Value $content -NoNewline

        Write-Host "Fixed: $file"
    }
}

Write-Host "`nAll layout files have been fixed!"
