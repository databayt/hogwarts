"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"

const professorImages = [
  "/site/dumbledore.jpeg",
  "/site/snape.jpeg",
  "/site/mcgonagall.jpeg",
  "/site/hagrid.jpeg",
]

const statIcons = [
  { src: "/anthropic/graduation-cap.svg", alt: "Experience" },
  { src: "/anthropic/star-outline.svg", alt: "Degrees" },
  { src: "/anthropic/book-open.svg", alt: "Research" },
  { src: "/anthropic/user.svg", alt: "Satisfaction" },
]

const statBgColors = [
  "bg-[#D97757]",
  "bg-[#6A9BCC]",
  "bg-[#CBCADB]",
  "bg-[#BCD1CA]",
]

export function Faculty() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.faculty

  const fallbackStats = [
    { label: "Average Experience", value: "15+ Years" },
    { label: "Advanced Degrees", value: "100%" },
    { label: "Published Researchers", value: "85%" },
    { label: "Student Satisfaction", value: "98%" },
  ]

  const fallbackProfessors = [
    {
      name: "Albus Dumbledore",
      title: "Headmaster & Chief Warlock",
      subject: "Transfiguration & Ancient Magic",
      specialties: ["Ancient Magic", "Transfiguration", "Leadership"],
      experience: "50+ years",
      education: "Order of Merlin, First Class",
    },
    {
      name: "Severus Snape",
      title: "Potions Master & Head of Slytherin",
      subject: "Potions & Dark Arts Defense",
      specialties: ["Potions", "Dark Arts Defense", "Occlumency"],
      experience: "20+ years",
      education: "Master of Potions, Hogwarts",
    },
    {
      name: "Minerva McGonagall",
      title: "Deputy & Head of Gryffindor",
      subject: "Transfiguration",
      specialties: ["Transfiguration", "Animagus Studies", "Quidditch"],
      experience: "40+ years",
      education: "Transfiguration Mistress, Hogwarts",
    },
    {
      name: "Rubeus Hagrid",
      title: "Keeper of Keys & Grounds",
      subject: "Care of Magical Creatures",
      specialties: ["Magical Creatures", "Groundskeeping", "Dragon Studies"],
      experience: "30+ years",
      education: "Hogwarts School (Expelled, later cleared)",
    },
  ]

  const stats = t?.stats || fallbackStats
  const professors = t?.professors || fallbackProfessors

  return (
    <section className="py-16 md:py-24">
      <SectionHeading
        title={t?.title || "Faculty"}
        description={
          t?.description || "Meet the wizards who make learning magical"
        }
      />

      {/* Faculty Stats */}
      <div className="my-10 grid grid-cols-2 gap-6 md:grid-cols-4">
        {(stats as Array<Record<string, unknown>>).map(
          (stat: Record<string, unknown>, index: number) => (
            <div
              key={index}
              className={`rounded-2xl p-6 text-center ${statBgColors[index]}`}
            >
              <div className="mb-3 flex justify-center">
                <div className="bg-background flex h-12 w-12 items-center justify-center rounded-full">
                  <Image
                    src={statIcons[index].src}
                    alt={statIcons[index].alt}
                    width={24}
                    height={24}
                  />
                </div>
              </div>
              <div className="text-foreground mb-1 text-2xl font-bold">
                {String(stat.value || fallbackStats[index]?.value)}
              </div>
              <div className="text-foreground text-sm">
                {String(stat.label || fallbackStats[index]?.label)}
              </div>
            </div>
          )
        )}
      </div>

      {/* Faculty Cards */}
      <div>
        <div className="my-14 grid max-w-none grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
          {(professors as Array<Record<string, unknown>>).map(
            (professor: Record<string, unknown>, index: number) => (
              <div key={index} className="group relative">
                <div className="overflow-hidden">
                  <div className="flex">
                    {/* Image Section */}
                    <div className="relative w-2/5 ps-0 pe-0 md:ps-6 md:pe-2">
                      <div className="relative h-28 w-28 md:h-40 md:w-40">
                        <Image
                          src={professorImages[index]}
                          alt={String(professor.name || "")}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-3/5 space-y-2 ps-2 pe-0 md:pe-6">
                      <div>
                        <h3 className="font-bold">
                          {String(
                            professor.name || fallbackProfessors[index]?.name
                          )}
                        </h3>
                        <p>
                          {String(
                            professor.title || fallbackProfessors[index]?.title
                          )}{" "}
                          <br />
                          {String(
                            professor.subject ||
                              fallbackProfessors[index]?.subject
                          )}
                        </p>
                      </div>

                      {/* Specialties */}
                      <div>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            (professor.specialties as string[]) ||
                            fallbackProfessors[index]?.specialties ||
                            []
                          ).map((specialty: string, idx: number) => (
                            <Badge
                              key={idx}
                              className="bg-primary/10 text-primary border-primary/20 border px-2.5 py-1 text-xs font-medium shadow-none"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div>
                        <div>
                          <span className="text-xs font-semibold">
                            {String(
                              professor.experience ||
                                fallbackProfessors[index]?.experience
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold">
                            {String(
                              professor.education ||
                                fallbackProfessors[index]?.education
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}
