"use client"

import Image from "next/image"
import { Crown, Star, Trophy, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import SectionHeading from "../atom/section-heading"

export function Features() {
  const magicalFeatures = [
    {
      icon: (
        <Image
          src="/site/teleport.png"
          alt="Magical Learning"
          width={32}
          height={32}
          className="dark:invert"
        />
      ),
      title: "Immersive Learning",
      description:
        "Interactive and immersive education that transforms traditional learning into an enchanting adventure.",
    },
    {
      icon: (
        <Image
          src="/site/tent.png"
          alt="Curriculum"
          width={32}
          height={32}
          className="dark:invert"
        />
      ),
      title: "Dynamic Programs",
      description:
        "Carefully crafted programs that blend core academics with creative thinking and real-world applications.",
    },
    {
      icon: (
        <Image
          src="/site/community.png"
          alt="Community"
          width={32}
          height={32}
          className="dark:invert"
        />
      ),
      title: "House Community",
      description:
        "Close-knit learning communities that foster friendship, collaboration, and mutual support among students.",
    },
    {
      icon: (
        <Image
          src="/site/champion.png"
          alt="Champions"
          width={32}
          height={32}
          className="dark:invert"
        />
      ),
      title: "Champions League",
      description:
        "Academic competitions, sports tournaments, and creative challenges that celebrate every student's unique talents.",
    },
    {
      icon: (
        <Image
          src="/site/world.png"
          alt="World Adventures"
          width={32}
          height={32}
          className="dark:invert"
        />
      ),
      title: "Worldwide Adventures",
      description:
        "Global exchange programs and virtual international collaborations that expand horizons beyond our castle walls.",
    },
    {
      icon: (
        <Image
          src="/site/light-bulb.png"
          alt="Innovation"
          width={32}
          height={32}
          className="dark:invert"
        />
      ),
      title: "Innovation Potions",
      description:
        "STEAM laboratories and maker spaces where students concoct creative solutions to real-world challenges.",
    },
  ]

  const achievements = [
    {
      number: "98%",
      label: "Graduation Rate",
      icon: <Crown className="h-6 w-6" />,
    },
    {
      number: "15:1",
      label: "Student-Teacher Ratio",
      icon: <Users className="h-6 w-6" />,
    },
    {
      number: "40+",
      label: "Magical Programs",
      icon: <Star className="h-6 w-6" />,
    },
    {
      number: "25",
      label: "Years of Excellence",
      icon: <Trophy className="h-6 w-6" />,
    },
  ]

  return (
    <>
      <section className="py-16 md:py-24">
        {/* Header */}
        <SectionHeading title="Features" description="What makes us special" />

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-8 pt-10 pb-20 md:grid-cols-2 lg:grid-cols-3">
          {magicalFeatures.map((feature, index) => (
            <Card key={index} className="rounded-md shadow-none">
              <CardHeader className="flex flex-col items-center text-center">
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="mb-2 text-xl font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24">
        <div className="pb-12 text-center">
          <h2 className="font-heading mb-4 text-4xl font-extrabold md:text-5xl">
            Numbers
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Numbers that reflect our commitment to excellence and the magical
            transformations happening in our classrooms every day.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {achievements.map((achievement, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center pb-3">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <div className="text-primary">{achievement.icon}</div>
                </div>
              </div>
              <div className="pb-2 text-3xl font-bold md:text-4xl">
                {achievement.number}
              </div>
              <div className="text-muted-foreground font-medium">
                {achievement.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
