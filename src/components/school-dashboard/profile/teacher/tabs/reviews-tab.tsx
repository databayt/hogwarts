/**
 * Teacher Profile Reviews Tab
 * Student feedback, ratings, and testimonials
 */

"use client"

import React, { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  EllipsisVertical,
  Flag,
  Heart,
  ListFilter,
  MessageSquare,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { TeacherProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface ReviewsTabProps {
  profile: TeacherProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  isOwner?: boolean
  className?: string
}

interface Review {
  id: string
  studentId: string
  studentName: string
  studentAvatar?: string
  courseId: string
  courseName: string
  rating: number
  comment: string
  date: Date
  semester: string
  year: number
  helpful: number
  notHelpful: number
  verified: boolean
  response?: {
    comment: string
    date: Date
  }
  categories: {
    teaching: number
    knowledge: number
    helpfulness: number
    clarity: number
    engagement: number
  }
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: Record<number, number>
  categories: {
    teaching: number
    knowledge: number
    helpfulness: number
    clarity: number
    engagement: number
  }
  trends: {
    month: string
    average: number
    count: number
  }[]
  recommendationRate: number
  responseRate: number
}

// ============================================================================
// Mock Data
// ============================================================================

const mockReviews: Review[] = [
  {
    id: "review-1",
    studentId: "student-1",
    studentName: "Alex Thompson",
    studentAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    courseId: "cs101",
    courseName: "Programming Fundamentals",
    rating: 5,
    comment:
      "Dr. Johnson is an exceptional teacher! Her explanations are crystal clear and she makes complex topics easy to understand. The course was well-structured and the assignments were challenging but fair. Highly recommend taking her classes!",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    semester: "Fall",
    year: 2023,
    helpful: 24,
    notHelpful: 2,
    verified: true,
    categories: {
      teaching: 5,
      knowledge: 5,
      helpfulness: 5,
      clarity: 5,
      engagement: 5,
    },
  },
  {
    id: "review-2",
    studentId: "student-2",
    studentName: "Emma Wilson",
    studentAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    courseId: "cs201",
    courseName: "Data Structures",
    rating: 4,
    comment:
      "Great professor who really cares about student success. The lectures were engaging and she was always available during office hours. Sometimes the pace was a bit fast, but overall excellent learning experience.",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    semester: "Fall",
    year: 2023,
    helpful: 18,
    notHelpful: 1,
    verified: true,
    response: {
      comment:
        "Thank you for your feedback, Emma! I appreciate your input about the pace and will work on providing more review sessions.",
      date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    },
    categories: {
      teaching: 4,
      knowledge: 5,
      helpfulness: 5,
      clarity: 4,
      engagement: 4,
    },
  },
  {
    id: "review-3",
    studentId: "student-3",
    studentName: "Michael Chen",
    studentAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    courseId: "cs301",
    courseName: "Machine Learning",
    rating: 5,
    comment:
      "One of the best professors I've had! Dr. Johnson brings real-world experience to the classroom and her passion for the subject is contagious. The projects were practical and helped me build a strong portfolio.",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    semester: "Spring",
    year: 2023,
    helpful: 32,
    notHelpful: 0,
    verified: true,
    categories: {
      teaching: 5,
      knowledge: 5,
      helpfulness: 5,
      clarity: 5,
      engagement: 5,
    },
  },
  {
    id: "review-4",
    studentId: "student-4",
    studentName: "Sarah Miller",
    studentAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    courseId: "cs101",
    courseName: "Programming Fundamentals",
    rating: 4,
    comment:
      "Very knowledgeable and approachable. The course material was well-organized. I struggled a bit with some concepts but Dr. Johnson was patient and provided extra help when needed.",
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    semester: "Spring",
    year: 2023,
    helpful: 15,
    notHelpful: 3,
    verified: true,
    categories: {
      teaching: 4,
      knowledge: 5,
      helpfulness: 5,
      clarity: 4,
      engagement: 4,
    },
  },
  {
    id: "review-5",
    studentId: "student-5",
    studentName: "David Park",
    studentAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    courseId: "cs201",
    courseName: "Data Structures",
    rating: 5,
    comment:
      "Fantastic instructor! Makes difficult concepts accessible and creates a supportive learning environment. The hands-on approach really helped solidify my understanding.",
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    semester: "Spring",
    year: 2023,
    helpful: 28,
    notHelpful: 1,
    verified: true,
    categories: {
      teaching: 5,
      knowledge: 5,
      helpfulness: 5,
      clarity: 5,
      engagement: 5,
    },
  },
]

const mockStats: ReviewStats = {
  averageRating: 4.6,
  totalReviews: 234,
  distribution: {
    5: 145,
    4: 62,
    3: 20,
    2: 5,
    1: 2,
  },
  categories: {
    teaching: 4.7,
    knowledge: 4.9,
    helpfulness: 4.8,
    clarity: 4.5,
    engagement: 4.6,
  },
  trends: [
    { month: "Sep", average: 4.5, count: 28 },
    { month: "Oct", average: 4.6, count: 32 },
    { month: "Nov", average: 4.7, count: 35 },
    { month: "Dec", average: 4.6, count: 30 },
    { month: "Jan", average: 4.8, count: 42 },
    { month: "Feb", average: 4.7, count: 38 },
  ],
  recommendationRate: 94,
  responseRate: 32,
}

// ============================================================================
// Component
// ============================================================================

export function ReviewsTab({
  profile,
  dictionary,
  lang = "en",
  isOwner = false,
  className,
}: ReviewsTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "recent" | "highest" | "lowest"
  >("all")
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set())

  const { teachingMetrics } = profile

  // Filter and sort reviews
  const filteredReviews = mockReviews
    .filter((review) => {
      if (selectedCourse !== "all" && review.courseId !== selectedCourse) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (selectedFilter) {
        case "recent":
          return b.date.getTime() - a.date.getTime()
        case "highest":
          return b.rating - a.rating
        case "lowest":
          return a.rating - b.rating
        default:
          return b.helpful - a.helpful // Most helpful first
      }
    })

  // Get unique courses
  const courses = Array.from(new Set(mockReviews.map((r) => r.courseName)))

  const markHelpful = (reviewId: string) => {
    setHelpfulReviews((prev) => new Set(prev).add(reviewId))
  }

  const renderStars = (rating: number, size: string = "h-4 w-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              size,
              i < rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold">
                {mockStats.averageRating}
              </div>
              <div className="mt-2">
                {renderStars(Math.round(mockStats.averageRating))}
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                Based on {mockStats.totalReviews} reviews
              </p>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {mockStats.recommendationRate}% recommend
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {mockStats.responseRate}% response rate
                </span>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              <p className="mb-3 text-sm font-medium">Rating Distribution</p>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = mockStats.distribution[rating] || 0
                const percentage = (count / mockStats.totalReviews) * 100
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="w-3 text-sm">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <span className="text-muted-foreground w-10 text-end text-xs">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Category Ratings */}
            <div className="space-y-2">
              <p className="mb-3 text-sm font-medium">Category Breakdown</p>
              {Object.entries(mockStats.categories).map(
                ([category, rating]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {rating.toFixed(1)}
                      </span>
                      {renderStars(Math.round(rating), "h-3 w-3")}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
          >
            <option value="all">Most Helpful</option>
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <Button variant="outline" size="icon">
            <ListFilter className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>{filteredReviews.length} reviews</span>
        </div>
      </div>

      {/* Reviews Tabs */}
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {/* Individual Reviews */}
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.studentAvatar} />
                        <AvatarFallback>{review.studentName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{review.studentName}</p>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <CircleCheck className="me-1 h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          {renderStars(review.rating)}
                          <span className="text-muted-foreground text-xs">
                            {review.courseName} • {review.semester}{" "}
                            {review.year}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(review.date, { addSuffix: true })}
                      </span>
                      {isOwner && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm leading-relaxed">{review.comment}</p>

                  {/* Category Ratings */}
                  {review.categories && (
                    <div className="bg-muted/50 flex flex-wrap gap-4 rounded-lg p-3">
                      {Object.entries(review.categories).map(
                        ([category, rating]) => (
                          <div
                            key={category}
                            className="flex items-center gap-2"
                          >
                            <span className="text-muted-foreground text-xs capitalize">
                              {category}:
                            </span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    i < rating ? "bg-primary" : "bg-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Teacher Response */}
                  {review.response && (
                    <div className="bg-muted/50 border-primary ms-12 rounded-lg border-s-2 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Instructor Response
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(review.response.date, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{review.response.comment}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => markHelpful(review.id)}
                        disabled={helpfulReviews.has(review.id)}
                      >
                        <ThumbsUp
                          className={cn(
                            "me-1 h-3 w-3",
                            helpfulReviews.has(review.id) &&
                              "fill-primary text-primary"
                          )}
                        />
                        Helpful (
                        {review.helpful +
                          (helpfulReviews.has(review.id) ? 1 : 0)}
                        )
                      </Button>
                      {isOwner && !review.response && (
                        <Button variant="ghost" size="sm" className="text-xs">
                          <MessageSquare className="me-1 h-3 w-3" />
                          Reply
                        </Button>
                      )}
                    </div>
                    {!isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground text-xs"
                      >
                        <Flag className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredReviews.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              No reviews found matching your criteria
            </div>
          )}

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline">
              Load More Reviews
              <ChevronDown className="ms-1 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Rating Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Rating Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Trend Chart (simplified version) */}
              <div className="space-y-4">
                {mockStats.trends.map((item) => (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="w-12 text-sm font-medium">
                      {item.month}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="bg-muted relative h-6 flex-1 rounded-full">
                        <div
                          className="bg-primary absolute inset-y-0 left-0 flex items-center justify-end rounded-full pe-2"
                          style={{ width: `${(item.average / 5) * 100}%` }}
                        >
                          <span className="text-primary-foreground text-xs font-medium">
                            {item.average.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <span className="text-muted-foreground w-20 text-xs">
                        {item.count} reviews
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Performance by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(mockStats.categories).map(
                  ([category, rating]) => (
                    <div key={category} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {category}
                        </span>
                        <span className="text-2xl font-bold">
                          {rating.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={(rating / 5) * 100} className="h-2" />
                      <p className="text-muted-foreground mt-1 text-xs">
                        {rating >= 4.5
                          ? "Excellent"
                          : rating >= 4
                            ? "Very Good"
                            : "Good"}
                      </p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          {/* Featured Testimonials */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredReviews
              .filter((r) => r.rating === 5 && r.helpful > 20)
              .slice(0, 4)
              .map((review) => (
                <Card
                  key={review.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      {renderStars(review.rating)}
                      <Badge variant="secondary" className="text-xs">
                        <Award className="me-1 h-3 w-3" />
                        Top Review
                      </Badge>
                    </div>
                    <blockquote className="text-sm italic">
                      "{review.comment}"
                    </blockquote>
                    <div className="mt-3 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={review.studentAvatar} />
                        <AvatarFallback>{review.studentName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-xs">
                        <p className="font-medium">{review.studentName}</p>
                        <p className="text-muted-foreground">
                          {review.courseName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Student Success Stories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4" />
                Student Success Stories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="mb-2 text-sm">
                  "Dr. Johnson's machine learning course changed my career
                  trajectory. I landed my dream job at a tech company thanks to
                  the practical skills I learned."
                </p>
                <p className="text-muted-foreground text-xs">
                  - Former Student, Now ML Engineer at Google
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="mb-2 text-sm">
                  "The mentorship and guidance I received went beyond the
                  classroom. Dr. Johnson helped me publish my first research
                  paper."
                </p>
                <p className="text-muted-foreground text-xs">
                  - Graduate Student, PhD Candidate at MIT
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
