import { siteConfig } from "./config"
import type { Dictionary } from '@/components/internationalization/dictionaries'
import Link from "next/link"

interface SiteFooterProps {
  dictionary?: Dictionary
}

export function SiteFooter({ dictionary }: SiteFooterProps) {
  const footerLinks = [
    { label: "Feedback", href: "#" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookie preferences", href: "#" },
  ]

  return (
    <footer className="bg-[#232f3e] text-white py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Footer Links */}
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {footerLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Copyright */}
          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()},{" "}
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Databayt
            </a>
            , Inc. or its affiliates.
          </div>
        </div>
      </div>
    </footer>
  )
}