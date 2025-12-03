"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SectionHeading from "../atom/section-heading";
import Image from "next/image";

export function Core() {
  const coreValues = [
    {
      icon: <Image src="/anthropic/claude-code-best-practices.svg" alt="Network Nodes - Courage" width={32} height={32} className="dark:invert" />,
      title: "Courage",
      description: "Be brave, take risks, and stand up for what's right.",
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-500"
    },
    {
      icon: <Image src="/anthropic/category-06.svg" alt="Growth Flourish - Wisdom" width={32} height={32} className="dark:invert" />,
      title: "Wisdom",
      description: "Reflect deeply and pursue understanding beyond facts.",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500"
    },
    {
      icon: <Image src="/anthropic/think-tool.svg" alt="Frame Boundary - Loyalty" width={32} height={32} className="dark:invert" />,
      title: "Loyalty",
      description: "Support each other and stay committed to shared goals.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-500"
    },
    {
      icon: <Image src="/anthropic/category-03.svg" alt="Reaching Ascent - Ambition" width={32} height={32} className="dark:invert" />,
      title: "Ambition",
      description: "Excel, innovate, and make positive changes in the world.",
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