import { cookies } from 'next/headers'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Link from "next/link"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { DocsThemeSwitcher } from "@/components/docs/docs-theme-switcher"
import { type Locale } from "@/components/internationalization/config"
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
      <SidebarProvider
        style={
          {
            "--sidebar-width": "240px",
            "--sidebar-width-icon": "3rem",
            "--sidebar-width-mobile": "280px",
            "--sidebar-top-spacing": "0",
          } as React.CSSProperties
        }
      >
        <DocsSidebar tree={pageTree} lang={lang} />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="size-7 lg:hidden" />
            <Separator orientation="vertical" className="lg:hidden data-[orientation=vertical]:h-4" />
            <Button variant="ghost" size="icon" className="size-7" asChild>
              <Link href={`/${lang}`}>
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
            <Button variant="ghost" size="icon" className="size-7">
              <Search className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
            <DocsThemeSwitcher />
          </header>
          <div className="flex flex-1 flex-col">
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}