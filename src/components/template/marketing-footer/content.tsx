import Link from "next/link"

import { Icons } from "@/components/icons"

import { footerSections } from "./config"
import NewsLetter from "./newsletter"

export function MarketingFooter() {
  return (
    <footer className="bg-muted full-bleed py-8">
      <div className="w-full px-1 pt-6 pb-3 sm:px-2 lg:px-8">
        {/* Newsletter and Links Section */}
        <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:gap-0">
          {/* Newsletter Section */}
          <div className="mb-8 flex w-full justify-center lg:mb-0 lg:w-[25%] lg:justify-start">
            <div className="w-full max-w-sm lg:max-w-none">
              <NewsLetter />
            </div>
          </div>

          {/* Links Section */}
          <div className="w-full pl-20">
            <div className="grid grid-cols-2 gap-4 px-0 text-center md:grid-cols-4 md:gap-8 lg:flex lg:items-start lg:gap-20 lg:text-left">
              {footerSections.map((section) => (
                <div key={section.title} className="w-full lg:flex-1">
                  <h3 className="mb-4 text-sm font-medium">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-primary/70 hover:text-primary text-xs font-normal transition-colors lg:text-sm"
                        >
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-primary/20 border-t pt-8">
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-10">
            <Link href="/" className="hidden items-center gap-2 md:flex">
              <div className="h-8 w-8">
                <Icons.logo className="text-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Databayt</h1>
            </Link>
            <div className="text-primary/70 w-full text-xs lg:w-[75%]">
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1 lg:justify-start">
                <span>© copyright free.</span>
                <span className="hidden sm:inline">•</span>
                <Link
                  href="/terms-of-use"
                  className="hover:text-primary transition-colors"
                >
                  Terms
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link
                  href="/privacy-policy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link
                  href="/safety"
                  className="hover:text-primary transition-colors"
                >
                  Safety
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link
                  href="/status"
                  className="hover:text-primary transition-colors"
                >
                  Status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
