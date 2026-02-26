"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

const Footer = () => {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.footer
  const links = t?.links as Record<string, string> | undefined

  return (
    <footer className="border-border bg-muted -mx-[var(--marketing-px)] border-t px-[var(--marketing-px)] pt-16 pb-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Map Section */}
        <div className="lg:min-w-0 lg:flex-[2]">
          <div className="relative mb-4 aspect-[3/2] w-[75%] overflow-hidden">
            <Image
              src="/site/map.jpeg"
              alt="Hogwarts Castle Map"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 70vw, (max-width: 1200px) 40vw, 33vw"
            />
          </div>

          {/* Address & Hours */}
          <div className="space-y-2 pb-4">
            <div>
              <p className="text-muted-foreground text-sm">
                {t?.address ||
                  "123 Magical Learning Lane, \n Education City, EC 12345"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            asChild
            className="flex items-center justify-start p-0 hover:bg-transparent hover:underline"
          >
            <Link href="/#" className="flex items-end">
              <Image
                src="/site/z.png"
                alt="Witch"
                width={40}
                height={40}
                className="dark:invert"
              />
              {t?.getDirections || "Get Directions"}
            </Link>
          </Button>
        </div>

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 gap-4 md:flex md:justify-between md:gap-0 lg:flex-[3]">
          {/* Academics */}
          <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              {t?.academics || "Academics"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/houses"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.houses || "Houses"}
                </Link>
              </li>
              <li>
                <Link
                  href="/curriculum"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.curriculum || "Curriculum"}
                </Link>
              </li>
              <li>
                <Link
                  href="/faculty"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.faculty || "Faculty"}
                </Link>
              </li>
              <li>
                <Link
                  href="/library"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.library || "Library"}
                </Link>
              </li>
              <li>
                <Link
                  href="/subjects"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.subjects || "Subjects"}
                </Link>
              </li>
              <li>
                <Link
                  href="/exams"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.exams || "Exams"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus */}
          <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              {t?.campus || "Campus"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admission"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.admissions || "Admissions"}
                </Link>
              </li>
              <li>
                <Link
                  href="/dormitories"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.dormitories || "Dormitories"}
                </Link>
              </li>
              <li>
                <Link
                  href="/great-hall"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.greatHall || "Great Hall"}
                </Link>
              </li>
              <li>
                <Link
                  href="/quidditch"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.quidditch || "Quidditch"}
                </Link>
              </li>
              <li>
                <Link
                  href="/grounds"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.grounds || "Grounds"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Activities */}
          <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              {t?.activities || "Activities"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/clubs"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.clubs || "Clubs"}
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.events || "Events"}
                </Link>
              </li>
              <li>
                <Link
                  href="/sports"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.sports || "Sports"}
                </Link>
              </li>
              <li>
                <Link
                  href="/competitions"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.competitions || "Competitions"}
                </Link>
              </li>
              <li>
                <Link
                  href="/tournaments"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.tournaments || "Tournaments"}
                </Link>
              </li>
              <li>
                <Link
                  href="/ceremonies"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.ceremonies || "Ceremonies"}
                </Link>
              </li>
              <li>
                <Link
                  href="/traditions"
                  className="muted hover:text-primary transition-colors"
                >
                  {links?.traditions || "Traditions"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              {t?.support || "Support"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary text-base font-light transition-colors"
                >
                  {links?.about || "About"}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary text-base font-light transition-colors"
                >
                  {links?.contact || "Contact"}
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-primary text-base font-light transition-colors"
                >
                  {links?.helpCenter || "Help Center"}
                </Link>
              </li>
              <li>
                <Link
                  href="/alumni"
                  className="text-muted-foreground hover:text-primary text-base font-light transition-colors"
                >
                  {links?.alumni || "Alumni"}
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-muted-foreground hover:text-primary text-base font-light transition-colors"
                >
                  {links?.careers || "Careers"}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-border mt-8 border-t pt-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-muted-foreground text-sm">
            {t?.buildBy || "Build by"}{" "}
            <Link
              href="https://databayt.org"
              className="hover:text-primary transition-colors"
            >
              databayt
            </Link>
            {t?.sourceCode || ", source code available on"}{" "}
            <Link
              href="https://github.com/databayt/hogwarts"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </Link>
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              {t?.terms || "Terms"}
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              {t?.privacy || "Privacy"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
