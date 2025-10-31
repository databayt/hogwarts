interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function FinanceLayout({ children }: Props) {
  // This layout now only provides a wrapper for finance pages
  // Each subpage will have its own layout with specific header and navigation
  return <>{children}</>
}
