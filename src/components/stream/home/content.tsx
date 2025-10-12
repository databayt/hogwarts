"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { StreamContentProps } from "../types";

type Feature = {
  title: string;
  description: string;
  icon: string;
};

export function StreamHomeContent({
  dictionary,
  lang,
  schoolId
}: StreamContentProps) {
  // Get features from dictionary or use defaults
  const features: Feature[] = dictionary?.home?.features || [
    {
      title: "Comprehensive Courses",
      description: "Access a wide range of carefully curated courses designed by industry experts.",
      icon: "📚",
    },
    {
      title: "Interactive Learning",
      description: "Engage with interactive content, quizzes, and assignments to enhance your learning experience.",
      icon: "🎮",
    },
    {
      title: "Progress Tracking",
      description: "Monitor your progress and achievements with detailed analytics and personalized dashboards.",
      icon: "📊",
    },
    {
      title: "Community Support",
      description: "Join a vibrant community of learners and instructors to collaborate and share knowledge.",
      icon: "👥",
    },
  ];

  const isRTL = lang === "ar";

  return (
    <>
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="outline">
            {dictionary?.home?.badge || "The Future of Online Education"}
          </Badge>
          <h1>
            {dictionary?.home?.title || "Elevate your Learning Experience"}
          </h1>
          <p className="lead max-w-[700px]">
            {dictionary?.home?.description ||
              "Discover a new way to learn with our modern, interactive learning management system. Access high-quality courses anytime, anywhere."}
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 mt-8 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href={`/${lang}/s/${schoolId ? schoolId : "demo"}/stream/courses`}
            >
              {dictionary?.home?.exploreCourses || "Explore Courses"}
            </Link>

            <Link
              className={buttonVariants({
                size: "lg",
                variant: "outline",
              })}
              href={`/${lang}/s/${schoolId ? schoolId : "demo"}/auth/login`}
            >
              {dictionary?.home?.signIn || "Sign in"}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`text-4xl mb-4 ${isRTL ? "text-right" : "text-left"}`}>
                {feature.icon}
              </div>
              <CardTitle className={isRTL ? "text-right" : "text-left"}>
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}