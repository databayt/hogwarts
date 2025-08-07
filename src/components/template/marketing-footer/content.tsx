import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { footerSections, footerInfo } from "./constant"

export default function MarketingFooter() {
  return (
    <footer className="bg-muted py-8 md:py-12 full-bleed">
      <div className="space-y-8 container-responsive">
        <div className="w-full flex flex-col md:flex-row justify-between">
          {footerSections.map((section) => (
            <div key={section.title} className="flex-1 space-y-4">
              <h3 className="text-sm md:text-md font-semibold md:font-bold text-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-normal text-muted-foreground hover:text-foreground transition-colors duration-300"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <hr className="border-dashed border-border" />
        
        <Card className="w-full bg-transparent border-none shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm justify-center md:justify-start text-muted-foreground">
              {footerInfo.map((info) => (
                <p key={info} className="text-[13px] md:text-[15px]">
                  {info}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </footer>
  )
}