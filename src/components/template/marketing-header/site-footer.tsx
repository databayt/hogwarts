import type { Dictionary } from "@/components/internationalization/dictionaries"

import { siteConfig } from "./config"

interface SiteFooterProps {
  dictionary?: Dictionary
}

export function SiteFooter({ dictionary }: SiteFooterProps) {
  return (
    <footer className="border-grid border-t py-6 md:py-0">
      <div className="w-full">
        <div className="mx-0 px-0 py-4">
          <div className="text-muted-foreground mx-0 px-0 text-center text-sm leading-loose text-balance md:text-left rtl:md:text-right">
            Inspired by{" "}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Shadcn
            </a>
            . Built by{" "}
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Databayt
            </a>
            . The source code is available on{" "}
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
