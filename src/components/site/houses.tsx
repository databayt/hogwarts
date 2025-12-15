"use client"

import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { EncryptedText } from "@/components/atom/encrypted-text"

import SectionHeading from "../atom/section-heading"

export function Houses() {
  const houses = [
    {
      name: "Gryffindor Academy",
      description: "Leadership & Social",
      longDescription:
        "Develop courage and leadership skills through history, government, and community service programs.",
      image: "/site/gryffindor.jpeg",
      color: "bg-red-600",
      lightColor: "bg-red-50",
      textColor: "text-red-800",
      features: [
        "History & Government",
        "Leadership Training",
        "Community Service",
        "Public Speaking",
      ],
    },
    {
      name: "Ravenclaw Institute",
      description: "Sciences & Innovation",
      longDescription:
        "Pursue wisdom through cutting-edge STEM programs and innovative problem-solving challenges.",
      image: "/site/ravenclaw.jpeg",
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-900",
      features: [
        "Advanced Sciences",
        "Research Projects",
        "Technology Integration",
        "Innovation Labs",
      ],
    },
    {
      name: "Hufflepuff College",
      description: "Arts & Humanities",
      longDescription:
        "Cultivate creativity and empathy through comprehensive arts, literature, and humanities programs.",
      image: "/site/hupplepuff.jpeg",
      color: "bg-yellow-600",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-500",
      features: [
        "Visual & Performing Arts",
        "Literature Studies",
        "Cultural Diversity",
        "Creative Writing",
      ],
    },
    {
      name: "Slytherin School",
      description: "Business & Mathematics",
      longDescription:
        "Foster determination and strategic reasoning through finance, business studies, and innovation programs.",
      image: "/site/slytherin.jpg",
      color: "bg-green-600",
      lightColor: "bg-green-50",
      textColor: "text-green-700",
      features: [
        "Advanced Mathematics",
        "Economics",
        "Entrepreneurship",
        "Financial Literacy",
      ],
    },
  ]

  return (
    <section className="py-16 md:py-24">
      <SectionHeading
        title="Houses"
        description="Find where your passion belongs."
      />

      <div className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-2 lg:grid-cols-4">
        {houses.map((house, index) => (
          <div key={index} className="overflow-hidden">
            <div className="animation-box relative h-64 overflow-hidden bg-transparent">
              <div className="relative h-64 w-full">
                <Image
                  src={house.image}
                  alt={`${house.name} crest`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="p-6 text-center">
              <h3 className={`${house.textColor}`}>{house.description}</h3>
              <p className="muted leading-relaxed">{house.longDescription}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-12 text-center">
        <Button
          variant="ghost"
          asChild
          className="flex items-end justify-center p-0 hover:bg-transparent hover:underline"
        >
          <Link href="/#" className="flex">
            <Image
              src="/site/hat.png"
              alt="Witch"
              width={40}
              height={40}
              className="me-1 dark:invert"
            />
            <EncryptedText
              text="Take Sorting Quiz"
              encryptedClassName="text-muted-foreground"
              revealedClassName="text-foreground"
              revealDelayMs={80}
              flipDelayMs={50}
            />
          </Link>
        </Button>
      </div>
    </section>
  )
}
