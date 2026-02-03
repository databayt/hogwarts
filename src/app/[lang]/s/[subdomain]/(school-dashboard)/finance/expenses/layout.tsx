import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ExpensesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.expenses

  // Define expenses page navigation
  const expensesPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/finance/expenses` },
    { name: "Submit Expense", href: `/${lang}/finance/expenses/submit` },
    { name: "Pending Approval", href: `/${lang}/finance/expenses/pending` },
    { name: "Approved", href: `/${lang}/finance/expenses/approved` },
    { name: "Reports", href: `/${lang}/finance/expenses/reports` },
    { name: "Categories", href: `/${lang}/finance/expenses/categories` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Expenses"} />
      <PageNav pages={expensesPages} />
      {children}
    </div>
  )
}
