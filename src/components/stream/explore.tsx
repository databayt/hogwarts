"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

interface ExploreProps {
  lang: string
  dictionary?: any
}

const exploreRoles = [
  { title: "Data Analyst", href: "/courses?role=data-analyst" },
  { title: "Project Manager", href: "/courses?role=project-manager" },
  { title: "Cyber Security Analyst", href: "/courses?role=cyber-security" },
  { title: "Data Scientist", href: "/courses?role=data-scientist" },
  { title: "Business Intelligence Analyst", href: "/courses?role=bi-analyst" },
  { title: "Digital Marketing Specialist", href: "/courses?role=digital-marketing" },
  { title: "UI / UX Designer", href: "/courses?role=ui-ux" },
  { title: "Machine Learning Engineer", href: "/courses?role=ml-engineer" },
]

const exploreCategories = [
  { title: "Artificial Intelligence", href: "/courses?category=ai" },
  { title: "Business", href: "/courses?category=business" },
  { title: "Data Science", href: "/courses?category=data-science" },
  { title: "Information Technology", href: "/courses?category=it" },
  { title: "Computer Science", href: "/courses?category=cs" },
  { title: "Healthcare", href: "/courses?category=healthcare" },
  { title: "Physical Science and Engineering", href: "/courses?category=engineering" },
  { title: "Personal Development", href: "/courses?category=personal-dev" },
  { title: "Social Sciences", href: "/courses?category=social-sciences" },
  { title: "Language Learning", href: "/courses?category=languages" },
]

const certificates = [
  { title: "Business", href: "/certificates?field=business" },
  { title: "Computer Science", href: "/certificates?field=cs" },
  { title: "Data Science", href: "/certificates?field=data-science" },
  { title: "Information Technology", href: "/certificates?field=it" },
]

const degrees = [
  { title: "Bachelor's Degrees", href: "/degrees?level=bachelors" },
  { title: "Master's Degrees", href: "/degrees?level=masters" },
  { title: "Postgraduate Programs", href: "/degrees?level=postgraduate" },
]

const trendingSkills = [
  { title: "Python", href: "/courses?skill=python" },
  { title: "Artificial Intelligence", href: "/courses?skill=ai" },
  { title: "Excel", href: "/courses?skill=excel" },
  { title: "Machine Learning", href: "/courses?skill=ml" },
  { title: "SQL", href: "/courses?skill=sql" },
  { title: "Project Management", href: "/courses?skill=project-management" },
  { title: "Power BI", href: "/courses?skill=power-bi" },
  { title: "Marketing", href: "/courses?skill=marketing" },
]

export function Explore({ lang, dictionary }: ExploreProps) {
  const isRTL = lang === "ar"

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-muted hover:bg-muted/80 data-[state=open]:bg-muted rounded-lg">
            <span className="font-medium">
              {dictionary?.explore?.title || "Explore"}
            </span>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className={cn(
              "grid gap-8 p-8 w-[52rem] lg:w-[58rem] grid-cols-4",
              isRTL && "direction-rtl"
            )}>
              {/* Column 1: Explore roles */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">
                  {dictionary?.explore?.roles || "Explore roles"}
                </h4>
                <ul className="space-y-2">
                  {exploreRoles.map((role) => (
                    <li key={role.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/${lang}/stream${role.href}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {role.title}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`/${lang}/stream/courses`}
                      className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                    >
                      {dictionary?.explore?.viewAll || "View all"}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Explore categories */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">
                  {dictionary?.explore?.categories || "Explore categories"}
                </h4>
                <ul className="space-y-2">
                  {exploreCategories.map((category) => (
                    <li key={category.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/${lang}/stream${category.href}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {category.title}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`/${lang}/stream/courses`}
                      className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                    >
                      {dictionary?.explore?.viewAll || "View all"}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Certificates & Degrees */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">
                    {dictionary?.explore?.certificates || "Earn a Professional Certificate"}
                  </h4>
                  <ul className="space-y-2">
                    {certificates.map((cert) => (
                      <li key={cert.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={`/${lang}/stream${cert.href}`}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {cert.title}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={`/${lang}/stream/certificates`}
                        className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                      >
                        {dictionary?.explore?.viewAll || "View all"}
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">
                    {dictionary?.explore?.degrees || "Earn an online degree"}
                  </h4>
                  <ul className="space-y-2">
                    {degrees.map((degree) => (
                      <li key={degree.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={`/${lang}/stream${degree.href}`}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {degree.title}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={`/${lang}/stream/degrees`}
                        className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                      >
                        {dictionary?.explore?.viewAll || "View all"}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Column 4: Trending skills */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">
                    {dictionary?.explore?.trending || "Explore trending skills"}
                  </h4>
                  <ul className="space-y-2">
                    {trendingSkills.map((skill) => (
                      <li key={skill.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={`/${lang}/stream${skill.href}`}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {skill.title}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">
                    {dictionary?.explore?.certification || "Prepare for a certification exam"}
                  </h4>
                  <Link
                    href={`/${lang}/stream/certifications`}
                    className="text-sm font-medium underline underline-offset-2 hover:text-primary"
                  >
                    {dictionary?.explore?.viewAll || "View all"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t py-5 bg-muted/30 rounded-b-2xl">
              <p className="text-sm text-muted-foreground">
                {dictionary?.explore?.notSure || "Not sure where to begin?"}{" "}
                <Link
                  href={`/${lang}/stream/courses?filter=free`}
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  {dictionary?.explore?.browseFree || "Browse free courses"}
                </Link>
              </p>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
