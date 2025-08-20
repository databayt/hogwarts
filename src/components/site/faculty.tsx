"use client";

import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  Users
} from "lucide-react";
import Image from "next/image";
import SectionHeading from "../atom/section-heading";

export function Faculty() {
  const professors = [
    {
      name: "Albus Dumbledore",
      title: "Headmaster & Chief Warlock",
      subject: "Transfiguration & Ancient Magic",
      image: "/site/dumbledore.jpeg",
      description: "Leading our school with wisdom and extraordinary magical knowledge, Professor Dumbledore guides students through the most complex magical arts.",
      specialties: ["Ancient Magic", "Transfiguration", "Leadership"],
      experience: "50+ years",
      education: "Order of Merlin, First Class",
      quote: "It is our choices that show what we truly are, far more than our abilities.",
      email: "dumbledore@hogwarts.edu"
    },
    {
      name: "Severus Snape",
      title: "Potions Master & Head of Slytherin",
      subject: "Potions & Dark Arts Defense",
      image: "/site/snape.jpeg",
      description: "With precision and dedication, Professor Snape guides students through the intricate art of potion-making and magical defense.",
      specialties: ["Potions", "Dark Arts Defense", "Occlumency"],
      experience: "20+ years",
      education: "Master of Potions, Hogwarts",
      quote: "Attention to detail separates the exceptional from the merely adequate.",
      email: "snape@hogwarts.edu"
    },
    {
      name: "Minerva McGonagall",
      title: "Deputy & Head of Gryffindor",
      subject: "Transfiguration",
      image: "/site/mcgonagall.jpeg",
      description: "Professor McGonagall transforms students' understanding of magic through her mastery of Transfiguration and unwavering dedication to excellence.",
      specialties: ["Transfiguration", "Animagus Studies", "Quidditch"],
      experience: "40+ years",
      education: "Transfiguration Mistress, Hogwarts",
      quote: "We teachers are rather good at magic, you know.",
      email: "mcgonagall@hogwarts.edu"
    },
    {
      name: "Rubeus Hagrid",
      title: "Keeper of Keys & Grounds",
      subject: "Care of Magical Creatures",
      image: "/site/hagrid.jpeg",
      description: "Hagrid nurtures both magical creatures and students with his boundless enthusiasm and deep knowledge of the magical world.",
      specialties: ["Magical Creatures", "Groundskeeping", "Dragon Studies"],
      experience: "30+ years",
      education: "Hogwarts School (Expelled, later cleared)",
      quote: "What's comin' will come, and we'll meet it when it does.",
      email: "hagrid@hogwarts.edu"
    }
  ];

  const facultyStats = [
    { icon: <GraduationCap className="w-6 h-6" />, label: "Average Experience", value: "15+ Years" },
    { icon: <Award className="w-6 h-6" />, label: "Advanced Degrees", value: "100%" },
    { icon: <BookOpen className="w-6 h-6" />, label: "Published Researchers", value: "85%" },
    { icon: <Users className="w-6 h-6" />, label: "Student Satisfaction", value: "98%" }
  ];

  return (
    <section className="py-14 bg-muted full-bleed">
      <div className="container-responsive">
        <SectionHeading title="Faculty" description="Meet the wizards who make learning magical" />

        {/* Faculty Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-10 ">
          {facultyStats.map((stat, index) => (
            <div key={index} className="rounded-md p-6 text-center border border-card-border">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="text-primary">
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {stat.value}
              </div>
              <div className="text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Faculty Cards - Clean Simple Layout */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 my-14 max-w-none ">
            {professors.map((professor, index) => (
              <div key={index} className="group relative">
                {/* Main Card */}
                <div className="overflow-hidden">
                  <div className="flex">
                    {/* Image Section - At Top of Container */}
                    <div className="w-2/5 relative pl-6 pr-2">
                      <div className="relative w-40 h-40">
                        <Image
                          src={professor.image}
                          alt={professor.name}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-3/5 pl-2 pr-6 space-y-2">
                      {/* Header */}
                      <div className="">
                        <h3>
                          {professor.name}
                        </h3>
                        <p>
                          {professor.title} <br />
                          {professor.subject}
                        </p>
                        <p>
                          
                        </p>
                      </div>

                      {/* Specialties */}
                      <div className="">
                        <div className="flex flex-wrap gap-1.5">
                          {professor.specialties.map((specialty, idx) => (
                            <Badge 
                              key={idx} 
                              className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium border border-primary/20 shadow-none"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="">
                        <div>
                          <span className="text-xs font-semibold">{professor.experience}</span>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold">{professor.education}</span>
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
      
      </div>
    </section>
  );
} 