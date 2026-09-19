"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Upcoming, type UserRole } from "./upcoming"
import { Weather } from "./weather"
import type { WeatherData } from "./weather-actions"

/**
 * The dashboard's opening pair: the role's flip card and the school's weather.
 *
 * Every role built its own copy of this — three through a local `HeroSection`,
 * three inline — and all six were cut on 2026-09-12. They come back as one
 * component so the six cannot drift apart again, and so the breakpoint below
 * lives in a single place.
 *
 * `hidden md:flex`: this is the DESKTOP dashboard's opening. Below `md` the
 * page already opens on the phone block — the calendar widget, the next
 * action, today's classes and the quick-action tiles (`home-block.tsx`,
 * `next-action.tsx`, `today-timetable.tsx`, `phone-quick-actions.tsx`, all
 * `md:hidden`) — and the flip card would be a fifth thing above the fold on a
 * screen that has room for one. Same idiom as `QuickActionsSection`'s
 * `hidden md:block`; don't reach for a JS media query, the server render has
 * no width.
 *
 * `Upcoming` still runs its mount-time work while the wrapper is CSS-hidden,
 * which is the trade every `hidden md:*` section on this page already makes.
 */
export function DashboardHero({
  role,
  locale,
  subdomain,
  weatherData,
}: {
  role: UserRole
  locale: string
  subdomain: string
  weatherData?: WeatherData | null
}) {
  return (
    <div className="hidden flex-col gap-6 md:flex lg:flex-row lg:gap-8">
      <Upcoming role={role} locale={locale} subdomain={subdomain} />
      <Weather
        current={weatherData?.current}
        forecast={weatherData?.forecast}
        location={weatherData?.location}
        className="lg:w-auto lg:max-w-sm lg:min-w-[280px] lg:self-end"
      />
    </div>
  )
}
