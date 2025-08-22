"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/atom/animated-button";
import SectionHeading from "@/components/atom/section-heading";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  GraduationCap, 
  Lightbulb, 
  Trophy, 
  Users, 
  Star,
  Globe,
  Zap,
  Heart,
  Shield
} from "lucide-react";
import Image from "next/image";
import type { School } from '../types';

interface AcademicContentProps {
  school: School;
}

export default function AcademicContent({ school }: AcademicContentProps) {
  const academicPrograms = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Core Academic Excellence",
      description: "Rigorous curriculum in Mathematics, Sciences, Literature, and Humanities that builds strong foundational knowledge.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "STEAM Innovation",
      description: "Science, Technology, Engineering, Arts, and Mathematics programs that foster creativity and problem-solving skills.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Studies",
      description: "International perspectives, language learning, and cultural exchange programs that prepare students for a connected world.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Advanced Placement",
      description: "College-level courses that challenge high-achieving students and provide college credit opportunities.",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Arts & Creativity",
      description: "Comprehensive arts education including music, visual arts, drama, and creative writing to nurture artistic expression.",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Character Education",
      description: "Values-based learning that develops integrity, leadership, and social responsibility in every student.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];

  const academicAchievements = [
    { number: "95%", label: "College Acceptance Rate", icon: <GraduationCap className="w-6 h-6" /> },
    { number: "12:1", label: "Student-Teacher Ratio", icon: <Users className="w-6 h-6" /> },
    { number: "25+", label: "AP Courses Offered", icon: <BookOpen className="w-6 h-6" /> },
    { number: "98%", label: "Graduation Rate", icon: <Trophy className="w-6 h-6" /> }
  ];

  const curriculumHighlights = [
    {
      title: "Early Years (K-5)",
      description: "Foundation building with hands-on learning, literacy development, and social skills through play-based education.",
      features: ["Phonics & Reading", "Math Foundations", "Science Exploration", "Social Studies", "Arts & Music"]
    },
    {
      title: "Middle School (6-8)",
      description: "Transitional years focusing on critical thinking, independent learning, and preparation for advanced studies.",
      features: ["Advanced Mathematics", "Literature Analysis", "Scientific Method", "World History", "Technology Skills"]
    },
    {
      title: "High School (9-12)",
      description: "College preparatory curriculum with specialized tracks, AP courses, and career exploration opportunities.",
      features: ["College Prep Courses", "AP & Honors Classes", "Career Pathways", "Research Projects", "Leadership Development"]
    }
  ];

  return (
    <div>
      {/* Hero Section - Pricing Style */}
      <section className="flex w-full flex-col py-14 items-center">
        <div className="flex w-full max-w-4xl flex-col gap-4 text-center">
          <div className="flex justify-center">
            <Badge className="bg-muted text-foreground">Academic Excellence</Badge>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-3xl md:text-6xl">
            Curiosity. Knowledge
          </h1>
          <p className="max-w-[85%] mx-auto leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Discover your potential through rigorous academics and innovative learning. Our comprehensive programs are designed to unlock every student's capabilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <AnimatedButton size="lg">
              Explore Programs
            </AnimatedButton>
            <Button variant="outline" size="lg">
              View Curriculum
            </Button>
          </div>
        </div>
      </section>

      {/* Academic Programs */}
      <section className="py-14">
        <div>
          <SectionHeading 
            title="Academic Programs" 
            description="Comprehensive educational pathways designed to unlock every student's potential and prepare them for future success." 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 pt-10">
            {academicPrograms.map((program, index) => (
              <Card key={index} className="group rounded-md relative border-none shadow-none hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="border-animation border border-muted absolute inset-0 pointer-events-none">
                  <span className="absolute inset-0"></span>
                  <div className="left-top absolute top-0 left-0"></div>
                  <div className="left-bottom absolute bottom-0 left-0"></div>
                  <div className="right-top absolute top-0 right-0"></div>
                  <div className="right-bottom absolute bottom-0 right-0"></div>
                </div>
                <CardHeader className="text-center flex flex-col items-center">
                  <div className="mb-4">
                    <div className={`w-16 h-16 ${program.bgColor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <div className={program.color}>
                        {program.icon}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold mb-2">
                    {program.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center leading-relaxed">
                    {program.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 md:p-12 text-white full-bleed">
        <div className="text-center pb-12 container-responsive">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">
            Academic Excellence
          </h2>
          <p className="text-blue-100 px-4 md:px-40 mb-12 text-lg">
            Numbers that reflect our commitment to academic excellence and the transformative impact of our educational programs.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {academicAchievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    {achievement.icon}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-1">{achievement.number}</div>
                <div className="text-blue-100 text-sm font-medium">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Overview */}
      <section className="py-20">
        <div>
          <SectionHeading 
            title="Curriculum Overview" 
            description="Our progressive curriculum is designed to build knowledge systematically while fostering critical thinking and creativity at every stage." 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-14">
            {curriculumHighlights.map((level, index) => (
              <Card key={index} className="group rounded-md relative border-none shadow-none hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="border-animation border border-muted absolute inset-0 pointer-events-none">
                  <span className="absolute inset-0"></span>
                  <div className="left-top absolute top-0 left-0"></div>
                  <div className="left-bottom absolute bottom-0 left-0"></div>
                  <div className="right-top absolute top-0 right-0"></div>
                  <div className="right-bottom absolute bottom-0 right-0"></div>
                </div>
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {level.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center leading-relaxed mb-4">
                    {level.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {level.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Begin Your Academic Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
            Join our community of learners and discover how our academic programs can transform your future. 
            Schedule a visit or contact our admissions team to learn more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AnimatedButton size="lg">
              Schedule a Visit
            </AnimatedButton>
            <Button variant="outline" size="lg">
              Contact Admissions
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
