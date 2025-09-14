import Link from "next/link";
import NewsLetter from "./newsletter";
import { Logo } from "@/components/atom/icons";
import type { Dictionary } from '@/components/internationalization/dictionaries';

interface MarketingFooterProps {
  dictionary?: Dictionary
}

export function MarketingFooter({ dictionary }: MarketingFooterProps) {
  const footerDict = dictionary?.footer || {};

  const footerSections = [
    {
      title: footerDict.about || "ABOUT",
      links: [
        { text: footerDict.paradigm || "Paradigm", href: "/about/paradigm" },
        { text: footerDict.contributors || "Contributors", href: "/contribute" },
        { text: footerDict.careers || "Careers", href: "/about/careers" },
        { text: footerDict.investors || "Investors", href: "/about/investors" }
      ]
    },
    {
      title: footerDict.contribute || "CONTRIBUTE",
      links: [
        { text: footerDict.documentation || "Documentation", href: "/contribute/documentation" },
        { text: footerDict.guidelines || "Guidelines", href: "/contribute/guidelines" },
        { text: footerDict.inspiration || "Inspiration", href: "/contribute/inspiration" },
        { text: footerDict.issues || "Issues", href: "/contribute/issues" },
        { text: footerDict.pullRequests || "Pull Requests", href: "/contribute/pull-requests" },
        { text: footerDict.codeOfConduct || "Code of Conduct", href: "/contribute/code-of-conduct" },
      ]
    },
    {
      title: footerDict.solution || "SOLUTION",
      links: [
        { text: footerDict.workflow || "Workflow", href: "/solutions/workflow" },
        { text: footerDict.integration || "Integration", href: "/solutions/integration" },
        { text: footerDict.aiAgent || "AI Agent", href: "/agent" },
        { text: footerDict.features || "Features", href: "/features" },
        { text: footerDict.blockchain || "Blockchain", href: "/blockchain" }
      ]
    },
    {
      title: footerDict.support || "SUPPORT",
      links: [
        { text: footerDict.helpCenter || "Help Center", href: "/help" },
        { text: footerDict.faqs || "FAQs", href: "/faqs" },
        { text: footerDict.contact || "Contact", href: "/contact" },
        { text: footerDict.sitemap || "Sitemap", href: "/sitemap" }
      ]
    },
  ];

  return (
    <footer className="bg-muted full-bleed min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="w-full px-1 sm:px-2 lg:px-8 pt-6 pb-3 flex-1 flex flex-col">
        {/* Newsletter and Links Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-0 mb-auto flex-1">
          {/* Newsletter Section */}
          <div className="w-full lg:w-[25%] mb-8 lg:mb-0 flex justify-center lg:justify-start">
            <div className="w-full max-w-sm lg:max-w-none">
              <NewsLetter dictionary={dictionary} />
            </div>
          </div>

          {/* Links Section */}
          <div className="w-full ps-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 lg:gap-20 lg:flex  lg:items-start px-0 text-center lg:text-start">
              {footerSections.map((section) => (
                <div key={section.title} className="w-full lg:flex-1">
                  <h3 className="muted mb-4 rtl:text-base">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-xs rtl:text-sm lg:muted text-primary/70 hover:text-primary transition-colors"
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
        <div className="pt-8 border-t border-primary/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-10">
            <Link href="/" className="flex items-center gap-2">
              <Logo width={24} height={24} className="text-foreground" />
              <h1 className="text-base font-semibold">{footerDict.brandName || "Databayt"}</h1>
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-xs rtl:text-sm text-primary/70">
                <span>{footerDict.copyright || "© copyright free."}</span>
                <span>•</span>
                <Link href="/terms-of-use" className="hover:text-primary transition-colors">
                  {footerDict.terms || "Terms"}
                </Link>
                <span>•</span>
                <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                  {footerDict.privacy || "Privacy"}
                </Link>
                <span>•</span>
                <Link href="/safety" className="hover:text-primary transition-colors">
                  {footerDict.safety || "Safety"}
                </Link>
                <span>•</span>
                <Link href="/status" className="hover:text-primary transition-colors">
                  {footerDict.status || "Status"}
                </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}