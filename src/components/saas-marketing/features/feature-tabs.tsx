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

import { FEATURES } from "./constants"
import { getCategoryIcon } from "./feature-icons"
import type { FeatureCategory } from "./types"

const FEATURE_IMAGES: Record<string, string> = {
  // Core
  student: "/feature/student.png",
  faculty: "/feature/teacher.png",
  financial: "/feature/fees.png",
  exam: "/feature/exam.png",
  // Essential
  assignment: "/feature/assigment.png",
  attendance: "/feature/attendance.png",
  gradebook: "/feature/gradebook.png",
  timetable: "/feature/timetable.png",
  // Advance
  "digital-library": "/feature/library.png",
  library: "/feature/library.png",
  events: "/feature/events.png",
  "live-classroom": "/feature/video.png",
  // ERP
  payroll: "/feature/payroll.png",
  "advance-accounting": "/feature/invoicing.png",
  expense: "/feature/wallet-3.png",
  payment: "/feature/credit-card.png",
  "e-commerce": "/feature/app-store.png",
  "email-marketing": "/feature/email.png",
  recruitment: "/feature/offer.png",
  // Management
  canteen: "/feature/canteen.png",
  "parent-login": "/feature/parent.png",
  transportation: "/feature/transport.png",
  // Communication
  helpdesk: "/feature/headphone.png",
  "notice-board": "/feature/notifications.png",
  "online-appointment": "/feature/calendar-2.png",
  "secure-transcript": "/feature/id-cards.png",
  "whatsapp-integration": "/feature/phone.png",
  grievance: "/feature/messaging.png",
  convocation: "/feature/graduate.png",
  // LMS
  classroom: "/feature/blackboard.png",
  // Technical
  "mobile-application": "/feature/app-store.png",
  "data-import-export": "/feature/download.png",
  secure: "/feature/role-based.png",
  // Other
  application: "/feature/cover-letter.png",
}

type TabId = "all" | FeatureCategory

interface FeatureTabsProps {
  lang: Locale
}

const INITIAL_ROWS = 3
const COLS_LG = 4
const INITIAL_COUNT = INITIAL_ROWS * COLS_LG

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "essential", label: "Essential" },
  { id: "advance", label: "Advance" },
  { id: "erp", label: "ERP" },
  { id: "management", label: "Management" },
  { id: "communication", label: "Communication" },
  { id: "lms", label: "LMS" },
  { id: "technical", label: "Technical" },
  { id: "integration", label: "Integration" },
  { id: "ai", label: "AI" },
]

export default function FeatureTabs({ lang }: FeatureTabsProps) {
  const [active, setActive] = useState<TabId>("all")
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(
    () =>
      active === "all"
        ? FEATURES
        : FEATURES.filter((f) => f.category === active),
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
                    width={32}
                    height={32}
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
