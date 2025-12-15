import Link from "next/link"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import SectionHeading from "../atom/section-heading"

interface BoostProps {
  dictionary?: Dictionary
}

const Boost = ({ dictionary }: BoostProps) => {
  const boostDict = dictionary?.marketing?.boost || {
    title: "Boost",
    subtitle: "Thank you for the boost",
    becomePatron: "Become a Patron",
    buyMeCoffee: "Buy me a coffee",
  }
  return (
    <section className="py-14">
      <SectionHeading
        title={boostDict.title}
        description={boostDict.subtitle}
      />
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="https://www.patreon.com/your_patreon_page"
            className={cn(
              "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              "bg-muted text-primary hover:bg-muted/90",
              "h-10 px-4 py-2"
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Become a Patron"
          >
            <Icons.patreon className="mr-2 size-4" />
            <span>{boostDict.becomePatron}</span>
          </Link>
          <Link
            href="https://www.buymeacoffee.com/your_buymeacoffee_page"
            className={cn(
              "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              "hover:bg-accent hover:text-accent-foreground",
              "h-10 px-4 py-2"
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee"
          >
            <Icons.coffee className="mr-2 size-5" />
            <span>{boostDict.buyMeCoffee}</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Boost
