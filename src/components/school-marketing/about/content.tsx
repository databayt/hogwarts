// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { StickyScroll } from "@/components/atom/sticky-scroll"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../types"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
}

export default function AboutContent({ school, dictionary, lang }: Props) {
  const t = dictionary?.marketing?.site?.about as
    | Record<string, { title?: string; description?: string }>
    | undefined

  const aboutContent = [
    {
      title: t?.castle?.title || "The Castle of Hogwarts",
      description:
        t?.castle?.description ||
        "Founded over a thousand years ago by the four greatest witches and wizards of the age, Hogwarts School of Witchcraft and Wizardry stands as a magnificent castle in the Scottish Highlands. Our ancient walls have witnessed countless magical moments and housed generations of extraordinary students.",
      content: (
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
          <img
            src="/site/h.jpeg"
            width={400}
            height={300}
            className="h-full w-full object-cover"
            alt="Harry Potter in the magical world"
          />
        </div>
      ),
    },
    {
      title: t?.greatHall?.title || "The Great Hall",
      description:
        t?.greatHall?.description ||
        "The heart of Hogwarts, where students gather for meals, celebrations, and the annual Sorting Ceremony. The enchanted ceiling reflects the sky above, and floating candles provide a magical ambiance. This is where house unity and school pride flourish.",
      content: (
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
          <img
            src="/site/trian.jpeg"
            width={400}
            height={300}
            className="h-full w-full object-cover"
            alt="The trio of friends at Hogwarts"
          />
        </div>
      ),
    },
    {
      title: t?.gryffindor?.title || "Gryffindor House",
      description:
        t?.gryffindor?.description ||
        "Home to the brave and daring, Gryffindor House values courage, chivalry, and determination. Founded by Godric Gryffindor, this house has produced some of the most famous witches and wizards, including Harry Potter himself.",
      content: (
        <div className="from-destructive to-primary flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br">
          <img
            src="/site/a.jpeg"
            width={400}
            height={300}
            className="h-full w-full object-cover"
            alt="Students in Hogwarts uniforms"
          />
        </div>
      ),
    },
    {
      title: t?.studies?.title || "Magical Studies",
      description:
        t?.studies?.description ||
        "From Herbology in the greenhouses to Defense Against the Dark Arts, Hogwarts offers a comprehensive magical education. Students learn to brew potions, cast spells, and understand the mysteries of the magical world under expert guidance.",
      content: (
        <div className="from-secondary to-muted flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br">
          <img
            src="/site/b.jpeg"
            width={400}
            height={300}
            className="h-full w-full object-cover"
            alt="Students learning magical studies"
          />
        </div>
      ),
    },
    {
      title: t?.friendship?.title || "The Bonds of Friendship",
      description:
        t?.friendship?.description ||
        "At Hogwarts, friendships are forged that last a lifetime. Through shared adventures, challenges, and magical discoveries, students form unbreakable bonds that support them through their darkest hours and greatest triumphs.",
      content: (
        <div className="from-primary to-accent flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br">
          <img
            src="/contribute/h.jpeg"
            width={400}
            height={300}
            className="h-full w-full object-cover"
            alt="The enduring friendship of Harry, Ron, and Hermione"
          />
        </div>
      ),
    },
    {
      title: t?.quidditch?.title || "Quidditch Pitch",
      description:
        t?.quidditch?.description ||
        "The magical sport of Quidditch brings excitement and house rivalry to new heights. Our pitch has witnessed legendary matches and continues to be where young witches and wizards discover their passion for flying and the thrill of chasing the Golden Snitch.",
      content: (
        <div className="from-accent to-secondary flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br">
          <img
            src="/ball.png"
            width={400}
            height={300}
            className="h-full w-full object-contain p-8"
            alt="Golden Snitch - the heart of Quidditch"
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <StickyScroll content={aboutContent} />
    </div>
  )
}
