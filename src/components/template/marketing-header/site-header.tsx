import { AWSHeader } from "./aws-header"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface SiteHeaderProps {
    dictionary?: Dictionary
    locale?: string
}

export function SiteHeader({ dictionary, locale = "en" }: SiteHeaderProps) {
    return (
        <AWSHeader
            dictionary={dictionary}
            locale={locale}
            organizationName={dictionary?.navigation?.brandName || "Hogwarts"}
        />
    )
}