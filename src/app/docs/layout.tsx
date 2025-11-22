import { cookies } from 'next/headers'
import { SidebarProvider } from "@/components/ui/sidebar"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { getPageTree } from "@/lib/source"

interface DocsLayoutProps {
  children: React.ReactNode
}

// Helper to get language from cookies
async function getLanguage(): Promise<'ar' | 'en'> {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || cookieStore.get('NEXT_LOCALE')?.value
  return (lang === 'en' ? 'en' : 'ar') as 'ar' | 'en'
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
  const lang = await getLanguage()
  const isRTL = lang === 'ar'
  const pageTree = getPageTree(lang)

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} lang={lang} className={isRTL ? 'font-tajawal' : 'font-inter'}>
      <div className="container-wrapper flex flex-1 flex-col">
        <SidebarProvider
          className="min-h-min flex-1 items-start pb-24 [--sidebar-width:220px] lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:[--sidebar-width:240px]"
          style={
            {
              "--header-height": "3.5rem",
              "--top-spacing": "1rem",
            } as React.CSSProperties
          }
        >
          <DocsSidebar tree={pageTree} lang={lang} />
          <div className="h-full w-full pb-8">
            {children}
          </div>
        </SidebarProvider>
      </div>
    </div>
  )
}