import { siteConfig } from "./config"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface SiteFooterProps {
  dictionary?: Dictionary
}

export function SiteFooter({ dictionary }: SiteFooterProps) {
  return (
    <footer className="border-grid border-t py-6 md:py-0">
      <div className="w-full">
        <div className="py-4 px-0 mx-0">
          <div className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left rtl:md:text-right px-0 mx-0">
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
