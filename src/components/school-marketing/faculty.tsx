"use client"

import Image from "next/image"

import { Badge } from "@/components/ui/badge"

import SectionHeading from "../atom/section-heading"

export function Faculty() {
  const professors = [
    {
      name: "Albus Dumbledore",
      title: "Headmaster & Chief Warlock",
      subject: "Transfiguration & Ancient Magic",
      image: "/site/dumbledore.jpeg",
      description:
        "Leading our school with wisdom and extraordinary magical knowledge, Professor Dumbledore guides students through the most complex magical arts.",
      specialties: ["Ancient Magic", "Transfiguration", "Leadership"],
      experience: "50+ years",
      education: "Order of Merlin, First Class",
      quote:
        "It is our choices that show what we truly are, far more than our abilities.",
      email: "dumbledore@hogwarts.edu",
    },
    {
      name: "Severus Snape",
      title: "Potions Master & Head of Slytherin",
      subject: "Potions & Dark Arts Defense",
      image: "/site/snape.jpeg",
      description:
        "With precision and dedication, Professor Snape guides students through the intricate art of potion-making and magical defense.",
      specialties: ["Potions", "Dark Arts Defense", "Occlumency"],
      experience: "20+ years",
      education: "Master of Potions, Hogwarts",
      quote:
        "Attention to detail separates the exceptional from the merely adequate.",
      email: "snape@hogwarts.edu",
    },
    {
      name: "Minerva McGonagall",
      title: "Deputy & Head of Gryffindor",
      subject: "Transfiguration",
      image: "/site/mcgonagall.jpeg",
      description:
        "Professor McGonagall transforms students' understanding of magic through her mastery of Transfiguration and unwavering dedication to excellence.",
      specialties: ["Transfiguration", "Animagus Studies", "Quidditch"],
      experience: "40+ years",
      education: "Transfiguration Mistress, Hogwarts",
      quote: "We teachers are rather good at magic, you know.",
      email: "mcgonagall@hogwarts.edu",
    },
    {
      name: "Rubeus Hagrid",
      title: "Keeper of Keys & Grounds",
      subject: "Care of Magical Creatures",
      image: "/site/hagrid.jpeg",
      description:
        "Hagrid nurtures both magical creatures and students with his boundless enthusiasm and deep knowledge of the magical world.",
      specialties: ["Magical Creatures", "Groundskeeping", "Dragon Studies"],
      experience: "30+ years",
      education: "Hogwarts School (Expelled, later cleared)",
      quote: "What's comin' will come, and we'll meet it when it does.",
      email: "hagrid@hogwarts.edu",
    },
  ]

  const facultyStats = [
    {
      icon: (
        <Image
          src="/anthropic/graduation-cap.svg"
          alt="Experience"
          width={24}
          height={24}
        />
      ),
      label: "Average Experience",
      value: "15+ Years",
      bgColor: "bg-[#D97757]",
    }, // Anthropic terracotta
    {
      icon: (
        <Image
          src="/anthropic/star-outline.svg"
          alt="Degrees"
          width={24}
          height={24}
        />
      ),
      label: "Advanced Degrees",
      value: "100%",
      bgColor: "bg-[#6A9BCC]",
    }, // Anthropic blue
    {
      icon: (
        <Image
          src="/anthropic/book-open.svg"
          alt="Research"
          width={24}
          height={24}
        />
      ),
      label: "Published Researchers",
      value: "85%",
      bgColor: "bg-[#CBCADB]",
    }, // Anthropic lavender
    {
      icon: (
        <Image
          src="/anthropic/user.svg"
          alt="Satisfaction"
          width={24}
          height={24}
        />
      ),
      label: "Student Satisfaction",
      value: "98%",
      bgColor: "bg-[#BCD1CA]",
    }, // Anthropic sage
  ]

  return (
    <section className="py-16 md:py-24">
      <SectionHeading
        title="Faculty"
        description="Meet the wizards who make learning magical"
      />

      {/* Faculty Stats */}
      <div className="my-10 grid grid-cols-2 gap-6 md:grid-cols-4">
        {facultyStats.map((stat, index) => (
          <div
            key={index}
            className={`rounded-2xl p-6 text-center ${stat.bgColor}`}
          >
            <div className="mb-3 flex justify-center">
              <div className="bg-background flex h-12 w-12 items-center justify-center rounded-full">
                {stat.icon}
              </div>
            </div>
            <div className="text-foreground mb-1 text-2xl font-bold">
              {stat.value}
            </div>
            <div className="text-foreground text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Faculty Cards - Clean Simple Layout */}
      <div>
        <div className="my-14 grid max-w-none grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
          {professors.map((professor, index) => (
            <div key={index} className="group relative">
              {/* Main Card */}
              <div className="overflow-hidden">
                <div className="flex">
                  {/* Image Section - At Top of Container */}
                  <div className="relative w-2/5 ps-6 pe-2">
                    <div className="relative h-40 w-40">
                      <Image
                        src={professor.image}
                        alt={professor.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="w-3/5 space-y-2 ps-2 pe-6">
                    {/* Header */}
                    <div className="">
                      <h3 className="font-bold">{professor.name}</h3>
                      <p className="text-muted-foreground">
                        {professor.title} <br />
                        {professor.subject}
                      </p>
                    </div>

                    {/* Specialties */}
                    <div className="">
                      <div className="flex flex-wrap gap-1.5">
                        {professor.specialties.map((specialty, idx) => (
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
                    <div className="">
                      <div>
                        <span className="text-xs font-semibold">
                          {professor.experience}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-semibold">
                          {professor.education}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
    </section>
  )
}
