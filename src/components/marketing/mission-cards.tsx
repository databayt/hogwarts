import Image from "next/image"
import Link from "next/link"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import "@/styles/animation-box.css"

interface MissionCardsProps {
  dictionary?: Dictionary
  lang?: Locale
}

export default function MissionCards({ dictionary, lang }: MissionCardsProps) {
  const isRTL = lang === "ar"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = (dictionary?.marketing as any)?.missionCards || {
    heading: "A restoration of time, elimination of repetitive.",
    description:
      "We sell time—the origin of value. Schools lose 40 hours monthly to paperwork; we give 80% of that back. Our open-source platform transforms fragmented systems into unified infrastructure, cutting operational costs by 60%.",
    values:
      "Transparency breeds accountability—when every stakeholder has access to real-time data, trust grows and outcomes improve. Open-source is participatory development: communities inspect, modify, and own their tools. They're not consumers—they're co-creators building capacity, reducing dependency, and ensuring sustainability.",
    studentSuccess: "Student Success",
    schoolOperations: "School Operations",
    openAcademy: "Open Academy",
  }

  const cards = [
    {
      title: dict.studentSuccess,
      icon: "/icons/hands-build.svg",
      href: "/about",
      bgColor: "bg-[#E3DACC]", // oat - rgb(227, 218, 204)
    },
    {
      title: dict.schoolOperations,
      icon: "/icons/hands-stack.svg",
      href: "/features",
      bgColor: "bg-[#BCD1CA]", // cactus - rgb(188, 209, 202)
    },
    {
      title: dict.openAcademy,
      icon: "/icons/objects-puzzle.svg",
      href: "/docs",
      bgColor: "bg-[#CBCADB]", // heather - rgb(203, 202, 219)
    },
  ]

  return (
    <section className="py-16 md:py-24" dir={isRTL ? "rtl" : "ltr"}>
      <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
        {/* Left column - Heading */}
        <div className="lg:col-span-4">
          <p className="text-2xl leading-snug font-medium md:text-3xl">
            {dict.heading}
          </p>
        </div>

        {/* Right column - Description */}
        <div className="space-y-4 lg:col-span-7 lg:col-start-6">
          <p className="text-muted-foreground leading-relaxed">
            {dict.description}
          </p>
          <p className="text-muted-foreground hidden leading-relaxed md:block">
            {dict.values}
          </p>
        </div>

        {/* Three Cards */}
        {cards.map((card, index) => (
          <div key={index} className="lg:col-span-4">
            <Link href={card.href} className="block">
              <div
                className={`${card.bgColor} flex aspect-[5/4] flex-col rounded-lg p-6`}
              >
                {/* Icon with slow animation effect */}
                <div className="animation-box flex-1">
                  <div className="relative h-24 w-24 md:h-28 md:w-28">
                    <Image
                      src={card.icon}
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-4 text-lg font-medium md:text-xl">
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
