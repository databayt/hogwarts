import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Link from "next/link"
import { DocsSidebar } from "@/components/template/docs-sidebar/content"
import { DocsThemeSwitcher } from "@/components/docs/docs-theme-switcher"
import { DocsTableOfContents } from "@/components/docs/toc"
import { type Locale } from "@/components/internationalization/config"

interface DocsLayoutProps {
  children: React.ReactNode
  params: { lang: Locale }
}

export default function DocsLayout({ children, params }: DocsLayoutProps) {
  // Docs are always in English, regardless of the lang parameter
  // This ensures documentation remains consistent and accessible
  return (
    <div dir="ltr" lang="en" className="font-inter">
      <SidebarProvider>
        <DocsSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="size-7" />
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
            <Button variant="ghost" size="icon" className="size-7" asChild>
              <Link href={`/${params.lang}`}>
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
        <div className="flex flex-1 flex-col p-4">
          <div className="w-full">
            <main className="relative py-6 lg:gap-10 lg:pt-3 lg:pb-8">
              <div className="w-full min-w-0 max-w-[52rem]">
                {children}
              </div>
              <DocsTableOfContents />
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </div>
  )
} 