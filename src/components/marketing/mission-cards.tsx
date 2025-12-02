import Image from "next/image"
import Link from "next/link"
import type { Dictionary } from '@/components/internationalization/dictionaries'
import '@/styles/animation-box.css'

interface MissionCardsProps {
    dictionary?: Dictionary
}

const cards = [
    {
        title: "Student Success",
        icon: "/icons/hands-build.svg",
        href: "/about",
        bgColor: "bg-[#E3DACC]", // oat - rgb(227, 218, 204)
    },
    {
        title: "School Operations",
        icon: "/icons/hands-stack.svg",
        href: "/features",
        bgColor: "bg-[#BCD1CA]", // cactus - rgb(188, 209, 202)
    },
    {
        title: "Open Academy",
        icon: "/icons/objects-puzzle.svg",
        href: "/docs",
        bgColor: "bg-[#CBCADB]", // heather - rgb(203, 202, 219)
    },
]

export default function MissionCards({ dictionary }: MissionCardsProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = (dictionary?.marketing as any)?.missionCards || {
        heading: "A restoration of time, elimination of repetitive.",
        description: "We sell time—the origin of value. Schools lose 40 hours monthly to paperwork; we give 80% of that back. Our open-source platform transforms fragmented systems into unified infrastructure, cutting operational costs by 60%. From atomic components to complete solutions, every contribution adds lasting value to a global ecosystem. This isn't vendor dependency—it's community ownership: transparent, auditable, and built by developers worldwide solving shared challenges together.",
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
                            <div className={`${card.bgColor} rounded-lg p-8 aspect-square flex flex-col`}>
                                {/* Icon with slow animation effect */}
                                <div className="flex-1 animation-box">
                                    <div className="w-28 h-28 md:w-36 md:h-36 relative">
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
