"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/atom/infinite-cards";
import { 
  Star, 
  Users,
  GraduationCap,
  Heart
} from "lucide-react";
import SectionHeading from "../atom/section-heading";

export function Testimonials() {
  const stats = [
    { icon: <Star className="w-6 h-6" />, value: "4.9/5", label: "Parent Satisfaction" },
    { icon: <GraduationCap className="w-6 h-6" />, value: "98%", label: "College Acceptance" },
    { icon: <Users className="w-6 h-6" />, value: "500+", label: "Happy Families" },
    { icon: <Heart className="w-6 h-6" />, value: "25+", label: "Years of Trust" }
  ];

  return (
    <section className="py-14 ">
      <div>
        {/* Header */}
        <SectionHeading title="Testimonials" description="Hear from our students, alumni, and parents about the transformative power of education 
           and the magical moments that happen within our school community every day." />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-14">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-md p-6 text-center border border-card-border">
              <div className="flex justify-center pb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="text-primary">
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold pb-1">
                {stat.value}
              </div>
              <div className="text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Infinite Moving Testimonials */}
        <div className="pb-14">
          <InfiniteMovingCards
            items={testimonials}
            direction="right"
            speed="slow"
            className="pb-8"
          />
        </div>

        
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote: "This school didn't just teach me subjects—it taught me to believe in magic, both in learning and in myself. The teachers here don't just educate; they inspire and transform.",
    name: "Emily Harrison",
    title: "Class of 2023, Gryffindor Academy"
  },
  {
    quote: "The innovation labs here are incredible! I've been able to work on real research projects and even present at science fairs. It's like having access to a magical laboratory.",
    name: "Michael Chen",
    title: "Current Student, Ravenclaw Institute"
  },
  {
    quote: "Watching my daughter flourish here has been magical. She's gained confidence, made lifelong friends, and discovered passions I never knew she had. The community feeling is extraordinary.",
    name: "Sarah Martinez",
    title: "Parent of Sofia Martinez"
  },
  {
    quote: "The arts program here is phenomenal. I discovered my love for theater and creative writing, and the teachers supported every creative endeavor. It truly felt like Hogwarts for artists.",
    name: "James Wilson",
    title: "Class of 2022, Hufflepuff College"
  },
  {
    quote: "As an educator myself, I was impressed by the innovative teaching methods and genuine care for each student's individual growth. The house system creates such meaningful connections.",
    name: "Dr. Patricia Kumar",
    title: "Parent of Arjun Kumar"
  },
  {
    quote: "The business and entrepreneurship program opened my eyes to possibilities I never imagined. I've already started my own small venture with guidance from our amazing teachers!",
    name: "Olivia Thompson",
    title: "Current Student, Slytherin School"
  }
]; 