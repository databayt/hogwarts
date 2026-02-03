interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function BillingLayout({ children }: Props) {
  return <>{children}</>
}
