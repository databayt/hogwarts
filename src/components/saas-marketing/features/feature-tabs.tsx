// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Card from "@/components/atom/card"
import { SeeMore } from "@/components/atom/see-more"
import type { Locale } from "@/components/internationalization/config"

import { FEATURE_GROUPS, GROUP_OF, SHOWN_FEATURES } from "./constants"
import { getCategoryIcon } from "./feature-icons"

// Clean 512×512 icon set served locally from `public/feature/`.
// NOTE: do NOT route these through asset()/the CDN — the flat CDN namespace
// (cdn.databayt.org/hogwarts/<file>) serves PHOTOS for some of these names
// (events = a sack-race photo, transport = a train, library = a girl reading),
// because /illustrations/* and /photos/* collide once flattened. The local
// `/feature/` directory holds the correct icon for each. Only features with a
// matching clean icon are listed; the rest use the category fallback.
const FEATURE_IMAGES: Record<string, string> = {
  // Core
  admission: "/feature/id-card-1.png",
  student: "/feature/student.png",
  faculty: "/feature/teacher.png",
  financial: "/feature/fees.png",
  exam: "/feature/exam.png",
  // Essential
  application: "/feature/human-resource.png",
  assignment: "/feature/assigment.png",
  attendance: "/feature/attendance.png",
  classroom: "/feature/blackboard.png",
  gradebook: "/feature/gradebook.png",
  "leave-request": "/feature/calendar-silhouette.png",
  timetable: "/feature/timetable.png",
  timesheet: "/feature/checklist.png",
  // Advance
  dashboard: "/feature/dashboards.png",
  documents: "/feature/files.png",
  reporting: "/feature/certificate-2.png",
  events: "/feature/events.png",
  library: "/feature/library.png",
  "live-classroom": "/feature/streaming.png", // "Conference"
  "mobile-application": "/feature/app-store.png",
  // Finance
  payment: "/feature/fees.png",
  accounting: "/feature/invoicing.png",
  invoice: "/feature/receipt.png",
  expense: "/feature/calculator.png",
  payroll: "/feature/payroll.png",
  sales: "/feature/money.png",
  "automated-marketing": "/feature/poll.png", // "Marketing"
  // Management
  canteen: "/feature/canteen.png",
  campus: "/feature/college.png",
  "parent-login": "/feature/parent.png",
  placement: "/feature/offer.png",
  transportation: "/feature/transport.png",
  // Communication
  announcement: "/feature/notifications.png",
  discussion: "/feature/messaging.png", // "Message"
  "notice-board": "/feature/notifications.png",
  "online-appointment": "/feature/calendar-2.png", // "Appointment"
  transcript: "/feature/id-cards.png",
  // E-Learning
  "e-learning": "/feature/video.png",
  qbank: "/feature/reading-book.png",
  // Integration
  "google-meet": "/feature/meet.png",
  "microsoft-teams": "/feature/teams.png",
  zoom: "/feature/zoom.png",
  "whatsapp-integration": "/feature/phone.png", // "WhatsApp"
  // AI
  "ai-powered": "/feature/robot.png",
}

// Icons whose artwork reads visually heavier than the rest — rendered one
// step smaller (28px vs the default 32px) so the grid looks balanced.
const SMALLER_ICONS = new Set<string>([
  "admission",
  "timetable",
  "e-learning",
  "discussion", // "Message"
  "transportation",
])

type TabId = "all" | string

interface FeatureTabsProps {
  lang: Locale
}

const INITIAL_ROWS = 3
const COLS_LG = 4
const INITIAL_COUNT = INITIAL_ROWS * COLS_LG

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  ...FEATURE_GROUPS.map((g) => ({ id: g.id, label: g.label })),
]

export default function FeatureTabs({ lang }: FeatureTabsProps) {
  const [active, setActive] = useState<TabId>("all")
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(
    () =>
      active === "all"
        ? SHOWN_FEATURES
        : SHOWN_FEATURES.filter((f) => GROUP_OF[f.id] === active),
    [active]
  )

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)
  const hasMore = filtered.length > INITIAL_COUNT

  return (
    <>
      {/* Tabs */}
      <div className="border-b-[0.5px] py-3">
        <div className="relative">
          <ScrollArea className="max-w-[600px] lg:max-w-none">
            <nav className="flex items-center gap-2 rtl:flex-row-reverse">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActive(tab.id)
                    setExpanded(false)
                  }}
                  className={cn(
                    "hover:text-primary flex h-7 shrink-0 items-center justify-center rounded-full px-3 text-center text-sm transition-colors",
                    active === tab.id ? "bg-muted text-primary" : ""
                  )}
                >
                  <h6>{tab.label}</h6>
                </button>
              ))}
            </nav>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((feature) => {
          const imageSrc = FEATURE_IMAGES[feature.id]
          const Icon = getCategoryIcon(feature.category)
          const dim = SMALLER_ICONS.has(feature.id) ? 28 : 32
          return (
            <Card
              key={feature.id}
              id={feature.id}
              title={feature.title}
              description={feature.description}
              icon={
                imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={feature.title}
                    width={dim}
                    height={dim}
                    className="dark:brightness-90 dark:contrast-125 dark:invert"
                  />
                ) : (
                  <Icon />
                )
              }
              href={`/${lang}/features/${feature.id}`}
            />
          )
        })}
      </div>

      {/* See more */}
      <SeeMore
        hasMore={hasMore && !expanded}
        onClick={() => setExpanded(true)}
        label="See more"
        className="pb-8"
      />
    </>
  )
}
