import { type Locale } from '@/components/internationalization/config'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ProfileLayout({ children, params }: Props) {
  return <>{children}</>
}
