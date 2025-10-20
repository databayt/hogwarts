"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BookOpen, Clock, ChevronDown, Users, CheckCircle, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { IndividualCourseType } from "@/components/stream/data/course/get-course";
import { EnrollmentButton } from "@/components/stream/courses/enrollment/button";

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
  const totalLessons = course.chapters.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0
  );

  const totalDuration = course.chapters.reduce(
    (total, chapter) =>
      total + chapter.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
    0
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-5">
      <div className="order-1 lg:col-span-2">
        {/* Course Image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
          {course.imageUrl ? (
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="size-24 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Course Info */}
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <h1>{course.title}</h1>
          </div>

          {course.category && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {course.category.name}
            </Badge>
          )}

          <Separator />

          {/* Course Description */}
          {course.description && (
            <div className="space-y-4">
              <h2>Course Description</h2>
              <p className="leading-relaxed">{course.description}</p>
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2>Course Content</h2>
            <div className="text-sm text-muted-foreground">
              {course.chapters.length} chapters | {totalLessons} lessons
              {totalDuration > 0 && ` | ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`}
            </div>
          </div>

          <div className="space-y-4">
            {course.chapters.map((chapter, index) => (
              <Collapsible key={chapter.id} defaultOpen={index === 0}>
                <Card className="p-0 overflow-hidden border-2 transition-all duration-200 hover:shadow-md">
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {index + 1}
                          </div>
                          <div className="text-left">
                            <h3>{chapter.title}</h3>
                            {chapter.description && (
                              <p className="muted mt-1">{chapter.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                          </Badge>
                          <ChevronDown className="size-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20">
                      <div className="p-6 pt-4 space-y-3">
                        {chapter.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
                              <Play className="size-4 text-muted-foreground" />
                            </div>

                            <div className="flex-1">
                              <p className="font-medium text-sm">{lesson.title}</p>
                              {lesson.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {lesson.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  Lesson {lessonIndex + 1}
                                </p>
                                {lesson.duration && (
                                  <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">
                                      {lesson.duration} min
                                    </p>
                                  </>
                                )}
                                {lesson.isFree && (
                                  <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                      Free Preview
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>

      {/* Enrollment Card */}
      <div className="order-2 lg:col-span-1">
        <div className="sticky top-20">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-medium">Price:</span>
                {course.price && course.price > 0 ? (
                  <span className="text-2xl font-bold text-primary">
                    ${course.price.toFixed(2)}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Free
                  </Badge>
                )}
              </div>

              <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
                <h4 className="font-medium">Course includes:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                      <CheckCircle className="size-3" />
                    </div>
                    <span>{totalLessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                      <CheckCircle className="size-3" />
                    </div>
                    <span>{course.chapters.length} chapters</span>
                  </div>
                  {totalDuration > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                        <CheckCircle className="size-3" />
                      </div>
                      <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m total duration</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                      <CheckCircle className="size-3" />
                    </div>
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                      <CheckCircle className="size-3" />
                    </div>
                    <span>Certificate of completion</span>
                  </div>
                  {course._count.enrollments > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="rounded-full p-1 bg-blue-500/10 text-blue-500">
                        <Users className="size-3" />
                      </div>
                      <span>{course._count.enrollments} students enrolled</span>
                    </div>
                  )}
                </div>
              </div>

              {isEnrolled ? (
                <Link
                  className={buttonVariants({ className: "w-full" })}
                  href={`/${lang}/stream/dashboard/${course.slug}`}
                >
                  Continue Learning
                </Link>
              ) : (
                <EnrollmentButton courseId={course.id} lang={lang} />
              )}

              {course.price && course.price > 0 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  30-day money-back guarantee
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
