"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { EncryptedText } from "@/components/atom/encrypted-text"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"

const houseImages = [
  "/site/gryffindor.jpeg",
  "/site/ravenclaw.jpeg",
  "/site/hupplepuff.jpeg",
  "/site/slytherin.jpg",
]

const houseColors = [
  "text-red-800",
  "text-blue-900",
  "text-yellow-500",
  "text-green-700",
]

export function Houses() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.houses

  const fallbackHouses = [
    {
      description: "Leadership & Social",
      longDescription:
        "Develop courage and leadership skills through history, government, and community service programs.",
    },
    {
      description: "Sciences & Innovation",
      longDescription:
        "Pursue wisdom through cutting-edge STEM programs and innovative problem-solving challenges.",
    },
    {
      description: "Arts & Humanities",
      longDescription:
        "Cultivate creativity and empathy through comprehensive arts, literature, and humanities programs.",
    },
    {
      description: "Business & Mathematics",
      longDescription:
        "Foster determination and strategic reasoning through finance, business studies, and innovation programs.",
    },
  ]

  const items = t?.items || fallbackHouses

  return (
    <section className="py-16 md:py-24">
      <SectionHeading
        title={t?.title || "Houses"}
        description={t?.description || "Find where your passion belongs."}
      />

      <div className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-2 lg:grid-cols-4">
        {items.map((house: Record<string, unknown>, index: number) => (
          <div key={index} className="overflow-hidden">
            <div className="animation-box relative h-64 overflow-hidden bg-transparent">
              <div className="relative h-64 w-full">
                <Image
                  src={houseImages[index]}
                  alt={String(house.name || "")}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="p-6 text-center">
              <h3 className={houseColors[index]}>
                {String(
                  house.description || fallbackHouses[index]?.description
                )}
              </h3>
              <p className="muted leading-relaxed">
                {String(
                  house.longDescription ||
                    fallbackHouses[index]?.longDescription
                )}
              </p>
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
              text={t?.sortingQuiz || "Take Sorting Quiz"}
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
