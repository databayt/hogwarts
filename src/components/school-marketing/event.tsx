"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"

import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"

const eventDates = ["01", "15", "31", "25"]
const eventHighlights = [true, false, false, false]
const eventDisabled = [false, false, false, true]

export default function EventCard() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.events

  const fallbackEvents = [
    {
      month: "September",
      title: "Hogwarts Welcome Feast",
      time: "7PM \u2014 10PM",
      location: "@ Great Hall, Hogwarts Castle",
    },
    {
      month: "October",
      title: "Defense Against Dark Arts Seminar",
      time: "2PM \u2014 5PM",
      location: "@ Defense, Hogwarts",
    },
    {
      month: "October",
      title: "Halloween Feast & Celebration",
      time: "6PM \u2014 11PM",
      location: "@ Great Hall, Hogwarts Castle",
    },
    {
      month: "December",
      title: "Christmas Holiday Feast",
      time: "5PM \u2014 9PM",
      location: "@ Great Hall, Hogwarts Castle",
    },
  ]

  const events = (t?.items as Array<Record<string, unknown>>) || fallbackEvents

  return (
    <section className="py-16 md:py-24">
      <SectionHeading
        title={t?.title || "Events"}
        description={t?.description || "what's happening"}
      />
      {/* Events Grid */}
      <div className="grid grid-cols-1 gap-1 py-14 md:grid-cols-4">
        {events.map((event, index) => {
          const isHighlighted = eventHighlights[index]
          const isDisabled = eventDisabled[index]

          return (
            <div
              key={index}
              className={`${
                isHighlighted ? "bg-[#6A9BCC] text-white" : "bg-muted"
              } flex h-full flex-col p-8`}
            >
              <div
                className={`mb-1 text-5xl font-light ${
                  !isHighlighted
                    ? isDisabled
                      ? "text-muted-foreground/50"
                      : "text-foreground"
                    : ""
                }`}
              >
                {eventDates[index]}
              </div>
              <div
                className={`pb-10 text-sm tracking-wider ${
                  !isHighlighted
                    ? isDisabled
                      ? "text-muted-foreground/50"
                      : "text-foreground"
                    : ""
                }`}
              >
                {String(event.month || fallbackEvents[index]?.month)}
              </div>

              <h2
                className={`pb-4 text-xl font-light ${
                  !isHighlighted
                    ? isDisabled
                      ? "text-muted-foreground/50"
                      : "text-foreground"
                    : ""
                }`}
              >
                {String(event.title || fallbackEvents[index]?.title)
                  .split(" ")
                  .slice(0, 2)
                  .join(" ")}
                <br />
                {String(event.title || fallbackEvents[index]?.title)
                  .split(" ")
                  .slice(2)
                  .join(" ")}
              </h2>

              <div
                className={`mt-auto ${
                  !isHighlighted
                    ? isDisabled
                      ? "text-muted-foreground/50"
                      : "text-foreground"
                    : ""
                }`}
              >
                <div className="pb-1 text-sm font-medium">
                  {String(event.time || fallbackEvents[index]?.time)}
                </div>
                <div className="text-sm font-medium">
                  {String(event.location || fallbackEvents[index]?.location)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feed Section */}
      <div className="border-border border-t pt-4 pt-12">
        <div className="mb-8 flex w-full items-start gap-4 md:w-[70%]">
          <Image
            src="/logo.png"
            alt="logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full bg-[#6A9BCC] object-cover p-1.5"
            priority
            quality={100}
          />
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-foreground font-semibold">
                {t?.feedHandle || "@hogwarts"}
              </span>
              <span className="text-muted-foreground text-sm">
                {t?.feedTimeAgo || "4 minutes ago in"}
              </span>
              <span className="text-primary">
                {t?.feedChannel || "#events"}
              </span>
            </div>
            <p className="text-foreground mb-2">
              {t?.feedText ||
                "Hogwarts School of Witchcraft and Wizardry invites you to attend our Welcome Feast - where we'll present our magical curriculum, discuss the challenges ahead, and open dialogue about our shared journey in the wizarding world."}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
