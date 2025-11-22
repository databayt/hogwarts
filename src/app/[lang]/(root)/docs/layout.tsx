import { source } from "@/lib/source"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

interface DocsLayoutProps {
    children: React.ReactNode
    params: Promise<{ lang: string }>
}

export default async function DocsLayout({ children, params }: DocsLayoutProps) {
    const { lang } = await params
    const isRTL = lang === 'ar'

    return (
        <div className="container-wrapper flex flex-1 flex-col" dir={isRTL ? 'rtl' : 'ltr'} lang={lang}>
            <SidebarProvider className="3xl:fixed:container 3xl:fixed:px-3 min-h-min flex-1 items-start [--sidebar-width:220px] [--top-spacing:0] lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:[--sidebar-width:240px] lg:[--top-spacing:calc(var(--spacing)*4)]">
                <DocsSidebar tree={source.pageTree} lang={lang} />
                <div className="h-full w-full">{children}</div>
            </SidebarProvider>
        </div>
    )
} 