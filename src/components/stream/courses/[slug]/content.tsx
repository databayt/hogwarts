"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IndividualCourseType } from "@/components/stream/data/course/get-course";
import { EnrollmentButton } from "@/components/stream/courses/enrollment/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  Clock,
  FileText,
  Download,
  Smartphone,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  Star,
  Globe,
  Calendar,
  Users,
  BookOpen,
} from "lucide-react";

interface Props {
  dictionary: any;
  lang: string;
  schoolId: string | null;
  course: IndividualCourseType;
  isEnrolled: boolean;
}

export function StreamCourseDetailContent({
  dictionary,
  lang,
  schoolId,
  course,
  isEnrolled,
}: Props) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(
    course.chapters[0]?.id || null
  );
  const [showFullDescription, setShowFullDescription] = useState(false);

  const totalLessons = course.chapters.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0
  );

  const totalDuration = course.chapters.reduce(
    (total, chapter) =>
      total + chapter.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
    0
  );

  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;

  const toggleChapter = (chapterId: string) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const isRTL = lang === "ar";

  // Mock data for demonstration (these would come from your data model)
  const courseIncludes = [
    { icon: PlayCircle, text: `${totalHours > 0 ? `${totalHours}h ` : ""}${totalMinutes}m on-demand video` },
    { icon: FileText, text: "3 articles" },
    { icon: Download, text: "5 downloadable resources" },
    { icon: Smartphone, text: "Access on mobile and TV" },
    { icon: Award, text: "Certificate of completion" },
  ];

  const whatYouWillLearn = [
    "Master the fundamentals and core concepts",
    "Build real-world projects from scratch",
    "Learn industry best practices and patterns",
    "Gain practical, hands-on experience",
    "Understand advanced techniques and methods",
    "Apply knowledge to solve complex problems",
  ];

  const requirements = [
    "No previous experience required - we start from basics",
    "Eagerness and motivation to learn",
    "A computer with internet access",
  ];

  return (
    <div className="min-h-screen">
      {/* Dark Header Bar - Sticky */}
      <div className="sticky top-0 z-40 bg-[#1c1d1f] text-white py-3 px-4 hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base line-clamp-1">{course.title}</h2>
            <div className="flex items-center gap-3 text-sm mt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[#f69c08] font-bold">4.6</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3",
                        i < 4 ? "fill-[#f69c08] text-[#f69c08]" : "fill-[#f69c08]/50 text-[#f69c08]/50"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[#cec0fc] underline cursor-pointer">(2,769 ratings)</span>
              </div>
              <span className="text-gray-300">{course._count?.enrollments || 0} students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href={`/${lang}/stream`}
                className="text-[#5624d0] hover:text-[#401b9c] font-medium"
              >
                Development
              </Link>
              <ChevronDown className="size-3 -rotate-90 text-muted-foreground" />
              <Link
                href={`/${lang}/stream/courses`}
                className="text-[#5624d0] hover:text-[#401b9c] font-medium"
              >
                {course.category?.name || "Courses"}
              </Link>
            </nav>

            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight">{course.title}</h1>

              {course.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Rating & Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge className="bg-[#eceb98] text-[#3d3c0a] hover:bg-[#eceb98] font-medium">
                  Bestseller
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="text-[#b4690e] font-bold">4.6</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-3.5",
                          i < 4 ? "fill-[#f69c08] text-[#f69c08]" : "fill-[#f69c08]/50 text-[#f69c08]/50"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[#5624d0] underline cursor-pointer">(2,769 ratings)</span>
                </div>
                <span className="text-muted-foreground">{course._count?.enrollments || 0} students</span>
              </div>

              {/* Instructor & Meta Info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span>
                  Created by{" "}
                  <Link href="#instructor" className="text-[#5624d0] underline hover:text-[#401b9c]">
                    Course Instructor
                  </Link>
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  <span>Last updated 12/2024</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="size-4" />
                  <span>{lang === "ar" ? "العربية" : "English"}</span>
                </div>
              </div>
            </div>

            {/* Mobile Preview Card - Shows on mobile only */}
            <div className="lg:hidden">
              <div className="rounded-lg border border-border overflow-hidden bg-card">
                {/* Video Preview */}
                <div className="relative aspect-video bg-muted">
                  {course.imageUrl ? (
                    <>
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="text-center text-white">
                          <PlayCircle className="size-16 mx-auto mb-2" />
                          <p className="font-medium">Preview this course</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="size-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* Price */}
                  <div className="text-3xl font-bold">
                    {course.price && course.price > 0 ? (
                      `$${course.price.toFixed(2)}`
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </div>

                  {/* Buttons */}
                  {isEnrolled ? (
                    <Link href={`/${lang}/stream/dashboard/${course.slug}`} className="block">
                      <Button className="w-full bg-[#5624d0] hover:bg-[#401b9c] h-12 text-base font-bold">
                        Continue Learning
                      </Button>
                    </Link>
                  ) : (
                    <EnrollmentButton courseId={course.id} lang={lang} />
                  )}

                  <p className="text-center text-sm text-muted-foreground">
                    30-Day Money-Back Guarantee
                  </p>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explore Related Topics */}
            {course.category && (
              <div>
                <h2 className="text-xl font-bold mb-4">Explore related topics</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full px-4 py-2 font-normal">
                    {course.category.name}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-4 py-2 font-normal">
                    Development
                  </Badge>
                </div>
              </div>
            )}

            {/* This Course Includes - Mobile */}
            <div className="lg:hidden">
              <h2 className="text-xl font-bold mb-4">This course includes:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courseIncludes.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <item.icon className="size-5 text-muted-foreground" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content */}
            <div>
              <h2 className="text-xl font-bold mb-2">Course content</h2>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  {course.chapters.length} sections • {totalLessons} lectures •{" "}
                  {totalHours > 0 ? `${totalHours}h ` : ""}{totalMinutes}m total length
                </span>
                <button
                  className="text-[#5624d0] hover:text-[#401b9c] font-medium"
                  onClick={() => setExpandedChapter(expandedChapter ? null : course.chapters[0]?.id)}
                >
                  {expandedChapter ? "Collapse all sections" : "Expand all sections"}
                </button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                {course.chapters.map((chapter, index) => {
                  const isExpanded = expandedChapter === chapter.id;
                  const chapterDuration = chapter.lessons.reduce(
                    (sum, lesson) => sum + (lesson.duration || 0),
                    0
                  );

                  return (
                    <div key={chapter.id} className={cn(index > 0 && "border-t border-border")}>
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="w-full px-4 py-4 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                          <span className="font-semibold text-left">{chapter.title}</span>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {chapter.lessons.length} lectures •{" "}
                          {Math.floor(chapterDuration / 60) > 0
                            ? `${Math.floor(chapterDuration / 60)}hr `
                            : ""}
                          {chapterDuration % 60}min
                        </span>
                      </button>

                      {/* Chapter Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-background">
                              {chapter.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="px-4 py-3 flex items-center justify-between border-t border-border/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <PlayCircle className="size-4 text-muted-foreground" />
                                    <span className="text-sm">{lesson.title}</span>
                                    {lesson.isFree && (
                                      <span className="text-xs text-[#5624d0] underline cursor-pointer">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {lesson.duration ? `${String(Math.floor(lesson.duration / 60)).padStart(2, "0")}:${String(lesson.duration % 60).padStart(2, "0")}` : "00:00"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-2">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <div className={cn("text-sm leading-relaxed", !showFullDescription && "line-clamp-6")}>
                <p className="mb-4">
                  {course.description || "This comprehensive course is designed to take you from beginner to advanced level. You will learn all the essential concepts and gain practical experience through hands-on projects."}
                </p>
                <p className="mb-4">
                  Whether you're just starting out or looking to enhance your existing skills, this course provides everything you need to succeed. Our step-by-step approach ensures that you understand each concept before moving on to the next.
                </p>
                <p>
                  By the end of this course, you'll have the confidence and knowledge to apply what you've learned to real-world scenarios. Join thousands of students who have already transformed their careers with this course.
                </p>
              </div>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-[#5624d0] hover:text-[#401b9c] font-medium text-sm mt-3 flex items-center gap-1"
              >
                Show {showFullDescription ? "less" : "more"}
                {showFullDescription ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            </div>

            {/* Instructor */}
            <div id="instructor">
              <h2 className="text-xl font-bold mb-4">Instructor</h2>
              <div className="space-y-4">
                <div>
                  <Link href="#" className="text-[#5624d0] hover:text-[#401b9c] text-lg font-bold underline">
                    Course Instructor
                  </Link>
                  <p className="text-sm text-muted-foreground">Training Professionals of Tomorrow</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="size-24 rounded-full bg-muted overflow-hidden shrink-0">
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                      CI
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="size-4 text-muted-foreground" />
                      <span>4.6 Instructor Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="size-4 text-muted-foreground" />
                      <span>119,779 Reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground" />
                      <span>613,212 Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="size-4 text-muted-foreground" />
                      <span>46 Courses</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  Are you thinking about pursuing a career in this field? Do you ever think that your career could take a leap forward if you would have more knowledge and skills? This instructor has helped thousands of students achieve their goals.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="rounded-lg border border-border overflow-hidden bg-card shadow-lg">
                {/* Video Preview */}
                <div className="relative aspect-video bg-muted cursor-pointer group">
                  {course.imageUrl ? (
                    <>
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                        <div className="text-center text-white">
                          <PlayCircle className="size-16 mx-auto mb-2" />
                          <p className="font-medium">Preview this course</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="size-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {/* Price */}
                  <div className="text-3xl font-bold">
                    {course.price && course.price > 0 ? (
                      `$${course.price.toFixed(2)}`
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </div>

                  {/* Buttons */}
                  {isEnrolled ? (
                    <Link href={`/${lang}/stream/dashboard/${course.slug}`} className="block">
                      <Button className="w-full bg-[#5624d0] hover:bg-[#401b9c] h-12 text-base font-bold">
                        Continue Learning
                      </Button>
                    </Link>
                  ) : (
                    <div className="space-y-3">
                      <EnrollmentButton courseId={course.id} lang={lang} />
                      <Button variant="outline" className="w-full h-12 text-base font-bold">
                        Add to cart
                      </Button>
                    </div>
                  )}

                  <p className="text-center text-xs text-muted-foreground">
                    30-Day Money-Back Guarantee
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    Full Lifetime Access
                  </p>

                  {/* Action Links */}
                  <div className="flex items-center justify-center gap-4 text-sm pt-2 border-t border-border">
                    <button className="underline hover:text-[#5624d0]">Share</button>
                    <button className="underline hover:text-[#5624d0]">Gift this course</button>
                    <button className="underline hover:text-[#5624d0]">Apply Coupon</button>
                  </div>

                  {/* Course Includes */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-bold mb-3">This course includes:</h3>
                    <div className="space-y-2.5">
                      {courseIncludes.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <item.icon className="size-4 text-muted-foreground" />
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
