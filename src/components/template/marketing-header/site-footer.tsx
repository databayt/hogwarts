import type { Dictionary } from "@/components/internationalization/dictionaries"

import { siteConfig } from "./config"

interface SiteFooterProps {
  dictionary?: Dictionary
  locale?: string
}

export function SiteFooter({ dictionary, locale = "en" }: SiteFooterProps) {
  const isRTL = locale === "ar"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const footerDict = (dictionary?.marketing as any)?.footer || {
    inspiredBy: "Inspired by",
    builtBy: "Built by",
    sourceCode: "The source code is available on",
  }

  return (
    <footer
      className="border-grid border-t py-6 md:py-0"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full">
        <div className="mx-0 px-0 py-4">
          <div className="text-muted-foreground mx-0 px-0 text-center text-sm leading-loose text-balance md:text-start">
            {footerDict.inspiredBy}{" "}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Shadcn
            </a>
            . {footerDict.builtBy}{" "}
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Databayt
            </a>
            . {footerDict.sourceCode}{" "}
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </div>
        </div>
      </div>
    </footer>
  )
}
