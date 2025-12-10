"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/atom/animated-button";
import SectionHeading from "@/components/atom/section-heading";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  MapPin,
  Users,
  Sparkles,
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle,
  Star,
  Globe,
  Heart,
  Shield
} from "lucide-react";
import Image from "next/image";
import type { School } from '../types';
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  school: School;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
}

export default function AdmissionContent({ school, dictionary, lang, subdomain }: Props) {
  const isRTL = lang === "ar";
  const admissionSteps = [
    {
      title: "Submit Application",
      icon: <BookOpen className="w-8 h-8" />,
      description: "Complete our comprehensive online application with all required documents and information.",
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
      details: ["Online application form", "Student information", "Parent/Guardian details", "Academic history"]
    },
    {
      title: "Campus Tour",
      icon: <MapPin className="w-8 h-8" />,
      description: "Experience our enchanting campus firsthand with a guided tour to all facilities and departments.",
      color: "bg-gradient-to-br from-purple-400 to-purple-600",
      details: ["Facility tour", "Classroom visits", "Meet current students", "Q&A session"]
    },
    {
      title: "Meet & Greet",
      icon: <Users className="w-8 h-8" />,
      description: "Personal interview with our admissions team to discuss goals, expectations, and fit.",
      color: "bg-gradient-to-br from-green-400 to-green-600",
      details: ["Student interview", "Parent meeting", "Academic assessment", "Goal discussion"]
    },
    {
      title: "Join Family",
      icon: <Sparkles className="w-8 h-8" />,
      description: "Complete your enrollment process and officially join our educational family to begin your journey.",
      color: "bg-gradient-to-br from-yellow-400 to-yellow-600",
      details: ["Enrollment completion", "Orientation materials", "Welcome package", "First day preparation"]
    }
  ];

  const admissionRequirements = [
    {
      title: "Academic Records",
      icon: <FileText className="w-8 h-8" />,
      description: "Transcripts from previous schools, standardized test scores, and academic recommendations.",
      requirements: ["Official transcripts", "Test scores (if applicable)", "Teacher recommendations", "Academic portfolio"]
    },
    {
      title: "Personal Information",
      icon: <Users className="w-8 h-8" />,
      description: "Complete family information, emergency contacts, and student background details.",
      requirements: ["Birth certificate", "Immunization records", "Emergency contacts", "Family information"]
    },
    {
      title: "Application Forms",
      icon: <CheckCircle className="w-8 h-8" />,
      description: "Completed application forms, parent questionnaires, and student essays.",
      requirements: ["Application form", "Parent questionnaire", "Student essay", "Photo consent"]
    },
    {
      title: "Financial Information",
      icon: <GraduationCap className="w-8 h-8" />,
      description: "Financial aid applications, payment plans, and scholarship information if applicable.",
      requirements: ["Financial aid form", "Income verification", "Payment plan selection", "Scholarship applications"]
    }
  ];

  const whyChooseUs = [
    {
      icon: <Star className="w-8 h-8" />,
      title: "Academic Excellence",
      description: "Consistently high academic standards with proven track record of student success and college placement.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Perspective",
      description: "International curriculum and cultural exchange programs that prepare students for a connected world.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Nurturing Environment",
      description: "Supportive community where every student feels valued, supported, and encouraged to reach their potential.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Character Development",
      description: "Values-based education that develops integrity, leadership, and social responsibility in every student.",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const importantDates = [
    { month: "September", event: "Applications Open", description: "Early bird applications begin" },
    { month: "December", event: "Early Decision Deadline", description: "Priority consideration for fall enrollment" },
    { month: "February", event: "Regular Deadline", description: "Final application submission date" },
    { month: "March", event: "Admissions Decisions", description: "Notification letters sent to families" },
    { month: "April", event: "Enrollment Deadline", description: "Confirm enrollment and submit deposits" }
  ];

  return (
    <div>
      {/* Hero Section - Pricing Style */}
      <div className="flex w-full flex-col py-14 items-center">
        <div className="flex w-full max-w-4xl flex-col gap-4 text-center">
          <div className="flex justify-center">
            <Badge className="bg-muted text-foreground">Admissions Open</Badge>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-3xl md:text-6xl">
            Magic. Journey.
          </h1>
          <p className="max-w-[85%] mx-auto leading-normal text-muted-foreground sm:text-lg sm:leading-7">
           Streamlined guide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href={`/${lang}/s/${subdomain}/apply`}>
              <AnimatedButton size="lg">
                {isRTL ? "بدء التقديم" : "Start Application"}
              </AnimatedButton>
            </Link>
            <Link href={`/${lang}/s/${subdomain}/schedule-tour`}>
              <Button variant="outline" size="lg">
                {isRTL ? "حجز جولة" : "Schedule Tour"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <section className="py-14">
        <div>
          <SectionHeading 
            title="Why Choose Us" 
            description="Discover what makes our school the perfect place for your child's educational journey and personal growth." 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-20 pt-10">
            {whyChooseUs.map((feature, index) => (
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
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <div className={feature.color}>
                        {feature.icon}
                      </div>
                    </div>
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

      {/* Admission Process */}
      <section className="py-20">
        <div>
          <SectionHeading 
            title="Admission Process" 
            description="Starting your journey is easier than casting a spell. Our streamlined process guides you through every step." 
          />
          
          {/* Timeline Container */}
          <div className="relative mt-8 py-28">
            {/* Timeline line */}
            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-0.5 bg-muted-foreground"></div>

            {/* Timeline items */}
            <div className="relative flex justify-between px-4 md:px-24 py-16">
              {admissionSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center relative">
                  {/* Content above timeline (for dots 2 & 4) */}
                  {(index === 1 || index === 3) && (
                    <div className="absolute bottom-12 text-center w-48">
                      <h3 className="text-lg font-semibold mb-2">
                        {step.title}
                      </h3>
                      <p className="muted text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  )}

                  {/* Dot */}
                  <div 
                    className={`w-10 h-10 rounded-full relative top-1/2 transform -translate-y-1/2 z-10 overflow-hidden border-2 border-background ${step.color} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="w-full h-full flex items-center justify-center text-white">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content below timeline (for dots 1 & 3) */}
                  {(index === 0 || index === 2) && (
                    <div className="absolute top-12 text-center w-48">
                      <h3 className="text-lg font-semibold mb-2">
                        {step.title}
                      </h3>
                      <p className="muted text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div>
          <SectionHeading 
            title="Admission Requirements" 
            description="Everything you need to prepare for a successful application and smooth enrollment process." 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-14">
            {admissionRequirements.map((requirement, index) => (
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
                      <div className="text-white">
                        {requirement.icon}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {requirement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center leading-relaxed mb-4">
                    {requirement.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {requirement.requirements.map((req, reqIndex) => (
                      <li key={reqIndex} className="flex items-center muted">
                        <CheckCircle className="w-4 h-4 text-green-500 me-3 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-20">
        <div>
          <SectionHeading 
            title="Important Dates" 
            description="Mark your calendar with key dates for the upcoming academic year admissions cycle." 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pt-14">
            {importantDates.map((date, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-blue-600">
                    {date.month}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="font-semibold mb-2">
                    {date.event}
                  </CardDescription>
                  <p className="muted text-muted-foreground">
                    {date.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
            Take the first step towards an extraordinary education. Our admissions team is here to guide you through every step of the process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${lang}/s/${subdomain}/apply`}>
              <AnimatedButton size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                {isRTL ? "بدء التقديم" : "Start Application"}
              </AnimatedButton>
            </Link>
            <Link href={`/${lang}/s/${subdomain}/inquiry`}>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                {isRTL ? "تواصل معنا" : "Contact Admissions"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
