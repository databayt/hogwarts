import Image from "next/image"
import Link from "next/link"
import type { Dictionary } from '@/components/internationalization/dictionaries'
import '@/styles/animation-box.css'

interface MissionCardsProps {
    dictionary?: Dictionary
}

const cards = [
    {
        title: "Student Success First",
        icon: "/icons/hands-build.svg",
        href: "/about",
        bgColor: "bg-[#E3DACC]", // oat - rgb(227, 218, 204)
    },
    {
        title: "Scalable School Operations",
        icon: "/icons/hands-stack.svg",
        href: "/features",
        bgColor: "bg-[#BCD1CA]", // cactus - rgb(188, 209, 202)
    },
    {
        title: "Academy: Learn to Automate",
        icon: "/icons/objects-puzzle.svg",
        href: "/docs",
        bgColor: "bg-[#CBCADB]", // heather - rgb(203, 202, 219)
    },
]

export default function MissionCards({ dictionary }: MissionCardsProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = (dictionary?.marketing as any)?.missionCards || {
        heading: "A restoration of time, elimination of repetitive tasks.",
        description: "78% of schools still rely on paper-based systems, costing the industry $12B annually in wasted processes. We're building reusable automation components—from atomic building blocks to complete solutions—that give educators back their 40 hours lost each month to manual tasks. Every line of code is open source, every contribution shapes the future of how schools operate.",
    }

    return (
        <section className="py-16 md:py-24">
            <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
                {/* Left column - Heading */}
                <div className="lg:col-span-4">
                    <p className="text-2xl md:text-3xl font-medium leading-snug">
                        {dict.heading}
                    </p>
                </div>

                {/* Right column - Description */}
                <div className="lg:col-span-7 lg:col-start-6">
                    <p className="text-muted-foreground leading-relaxed">
                        {dict.description}
                    </p>
                </div>

                {/* Three Cards */}
                {cards.map((card, index) => (
                    <div key={index} className="lg:col-span-4">
                        <Link href={card.href} className="block">
                            <div className={`${card.bgColor} rounded-lg p-6 aspect-[5/4] flex flex-col`}>
                                {/* Icon with slow animation effect */}
                                <div className="flex-1 animation-box">
                                    <div className="w-24 h-24 md:w-28 md:h-28 relative">
                                        <Image
                                            src={card.icon}
                                            alt=""
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg md:text-xl font-medium mt-4">
                                    {card.title}
                                </h3>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    )
}
