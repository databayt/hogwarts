import Image from "next/image"
import Link from "next/link"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface MissionCardsProps {
    dictionary?: Dictionary
}

const cards = [
    {
        title: "Student Success First",
        icon: "/icons/hands-build.svg",
        href: "/about",
        bgColor: "bg-[#F5F0E8]", // oat
    },
    {
        title: "Scalable School Operations",
        icon: "/icons/hands-stack.svg",
        href: "/features",
        bgColor: "bg-[#D4C9B0]", // cactus
    },
    {
        title: "Academy: Learn to Automate",
        icon: "/icons/objects-puzzle.svg",
        href: "/docs",
        bgColor: "bg-[#C5D1DC]", // heather
    },
]

export default function MissionCards({ dictionary }: MissionCardsProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = (dictionary?.marketing as any)?.missionCards || {
        heading: "We build automation to serve education's long-term success.",
        description1: "While no one can foresee every challenge schools will face, we know that designing powerful systems requires both bold innovation and careful consideration of outcomes.",
        description2: "That's why we focus on building tools with educators and students at their foundation. Through our daily development, we aim to show what responsible school automation looks like in practice.",
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
                <div className="lg:col-span-7 lg:col-start-6 space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                        {dict.description1}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        {dict.description2}
                    </p>
                </div>

                {/* Three Cards */}
                {cards.map((card, index) => (
                    <div key={index} className="lg:col-span-4">
                        <Link href={card.href} className="block group">
                            <div className={`${card.bgColor} rounded-lg p-6 aspect-square flex flex-col transition-transform duration-300 group-hover:scale-[1.02]`}>
                                {/* Icon */}
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="w-32 h-32 md:w-40 md:h-40 relative">
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
