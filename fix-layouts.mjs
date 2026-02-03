import { readFileSync, writeFileSync } from "fs"

const files = [
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/admin/billing/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/announcements/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/attendance/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/classes/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/dashboard/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/events/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/accounts/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/banking/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/budget/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/expenses/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/fees/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/invoice/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/payroll/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/receipt/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/reports/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/salary/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/timesheet/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/wallet/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/lessons/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/parents/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/profile/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/stream/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/students/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/subjects/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/teachers/layout.tsx",
  "src/app/[lang]/s/[subdomain]/(school-dashboard)/timetable/layout.tsx",
]

files.forEach((file) => {
  try {
    let content = readFileSync(file, "utf8")

    // Replace the params type
    content = content.replace(
      /params: Promise<\{ lang: Locale; subdomain: string \}>/g,
      "params: Promise<{ lang: string; subdomain: string }>"
    )

    // Replace getDictionary calls
    content = content.replace(
      /getDictionary\(lang\)(?! as Locale)/g,
      "getDictionary(lang as Locale)"
    )

    writeFileSync(file, content, "utf8")
    console.log(`Fixed: ${file}`)
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message)
  }
})

console.log("\nAll layout files have been fixed!")
