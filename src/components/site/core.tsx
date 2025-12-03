"use client";import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";import {   Heart,   Lightbulb,   Shield,   Zap} from "lucide-react";
import SectionHeading from "../atom/section-heading";

export function Core() {
  const coreValues = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Courage",
      description: "We encourage students to be brave in their learning, take intellectual risks, and stand up for what's right.",
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-500"
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Wisdom",
      description: "Knowledge becomes wisdom through reflection, critical thinking, and the pursuit of understanding beyond facts.",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Loyalty",
      description: "We build strong communities where students support each other and remain committed to shared goals.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Ambition",
      description: "We nurture the drive to excel, innovate, and make positive changes in the world through education.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-500"
    }
  ];

  return (
    <section className="py-16 md:py-24">
        {/* Header */}
        <SectionHeading title="Core" description="We create an enchanting
             inspired by the timeless virtues of courage, wisdom, loyalty, and ambition, these values guide everything we do at our school." />

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-14">
          {coreValues.map((value, index) => (
            <Card key={index} className={`group rounded-md relative border-none shadow-none`}>
               <div className="border-animation border border-muted absolute inset-0 pointer-events-none">
              <span className="absolute inset-0"></span>
              <div className="left-top absolute top-0 left-0"></div>
              <div className="left-bottom absolute bottom-0 left-0"></div>
              <div className="right-top absolute top-0 right-0"></div>
              <div className="right-bottom absolute bottom-0 right-0"></div>
            </div>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <div className={`w-16 h-16 ${value.bgColor} rounded-full flex items-center justify-center`}>
                    <div className={value.color}>
                      {value.icon}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">
                  {value.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center leading-relaxed">
                  {value.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
    </section>
  );
} 