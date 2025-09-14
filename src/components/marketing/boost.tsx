import Link from 'next/link'
import SectionHeading from '../atom/section-heading'
import { cn } from '@/lib/utils'
import { Patreon, Coffee } from '@/components/atom/icons'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface BoostProps {
    dictionary?: Dictionary
}

const Boost = ({ dictionary }: BoostProps) => {
    const boostDict = dictionary?.marketing?.boost || {
        title: "Boost",
        subtitle: "Thank you for the boost",
        becomePatron: "Become a Patron",
        buyMeCoffee: "Buy me a coffee"
    }
    return (
        <section className="py-14">
            <SectionHeading
                title={boostDict.title}
                description={boostDict.subtitle}
            />  
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="https://www.patreon.com/your_patreon_page"
                        className={cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            "bg-muted text-primary hover:bg-muted/90",
                            "h-10 px-4 py-2"
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Become a Patron"
                    >
                        <Patreon className="w-4 h-4 mr-2" />
                        <span>{boostDict.becomePatron}</span>
                    </Link>
                    <Link
                        href="https://www.buymeacoffee.com/your_buymeacoffee_page"
                        className={cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            "hover:bg-accent hover:text-accent-foreground",
                            "h-10 px-4 py-2"
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Buy me a coffee"
                    >
                        <Coffee className="w-5 h-5 mr-2" />
                        <span>{boostDict.buyMeCoffee}</span>
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Boost