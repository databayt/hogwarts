"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Trophy, 
  Star,
  Crown
} from "lucide-react";
import SectionHeading from "../atom/section-heading";
import Image from "next/image";

export function Features() {
  const magicalFeatures = [
    {
      icon: <Image src="/site/teleport.png" alt="Magical Learning" width={32} height={32} className="dark:invert" />,
      title: "Immersive Learning",
      description: "Interactive and immersive education that transforms traditional learning into an enchanting adventure.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: <Image src="/site/tent.png" alt="Curriculum" width={32} height={32} className="dark:invert" />,
      title: "Dynamic Programs",
      description: "Carefully crafted programs that blend core academics with creative thinking and real-world applications.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: <Image src="/site/community.png" alt="Community" width={32} height={32} className="dark:invert" />,
      title: "House Community",
      description: "Close-knit learning communities that foster friendship, collaboration, and mutual support among students.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: <Image src="/site/champion.png" alt="Champions" width={32} height={32} className="dark:invert" />,
      title: "Champions League",
      description: "Academic competitions, sports tournaments, and creative challenges that celebrate every student's unique talents.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      icon: <Image src="/site/world.png" alt="World Adventures" width={32} height={32} className="dark:invert" />,
      title: "Worldwide Adventures",
      description: "Global exchange programs and virtual international collaborations that expand horizons beyond our castle walls.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      icon: <Image src="/site/light-bulb.png" alt="Innovation" width={32} height={32} className="dark:invert" />,
      title: "Innovation Potions",
      description: "STEAM laboratories and maker spaces where students concoct creative solutions to real-world challenges.",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const achievements = [
    { number: "98%", label: "Graduation Rate", icon: <Crown className="w-6 h-6" /> },
    { number: "15:1", label: "Student-Teacher Ratio", icon: <Users className="w-6 h-6" /> },
    { number: "40+", label: "Magical Programs", icon: <Star className="w-6 h-6" /> },
    { number: "25", label: "Years of Excellence", icon: <Trophy className="w-6 h-6" /> }
  ];

  return (
    <>
      <section className="py-14">
        <div className="container">
          {/* Header */}
          <SectionHeading title="Features" description="What makes us special" />

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 pt-10">
            {magicalFeatures.map((feature, index) => (
              <Card key={index} className="shadow-none rounded-md">
                <CardHeader className="text-center flex flex-col items-center">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold mb-2">
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
        </div>
      </section>

      {/* Stats Section - Outside container for proper full-bleed */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16 text-white">
        <div className="container">
          <div className="text-center pb-12">
            <h2 className="font-heading font-extrabold text-4xl md:text-5xl mb-4">
              Numbers
            </h2>
            <p className="text-purple-100 max-w-2xl mx-auto">
              Numbers that reflect our commitment to excellence and the magical transformations happening in our classrooms every day.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center pb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="text-white">
                      {achievement.icon}
                    </div>
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold pb-2">
                  {achievement.number}
                </div>
                <div className="text-purple-100 font-medium">
                  {achievement.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
} 