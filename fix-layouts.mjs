import { readFileSync, writeFileSync } from "fs"

const files = [
  "src/app/[lang]/s/[subdomain]/(platform)/admin/billing/layout.tsx",
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
  "src/app/[lang]/s/[subdomain]/(platform)/timetable/layout.tsx",
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
