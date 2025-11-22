import { getDictionary } from "@/components/internationalization/dictionaries"
import { type Locale } from "@/components/internationalization/config"
import { SiteHeader } from "@/components/docs/site-header"

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params as { lang: Locale }
    const dictionary = await getDictionary(lang || 'en')

    return (
        <>
            <SiteHeader dictionary={dictionary} lang={lang} />
            <main className="flex-1">
                {children}
            </main>
        </>
    )
}