// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

import type { Locale } from "@/components/internationalization/config"

// Stream Dictionary Types
export interface StreamFeature {
  title: string
  description: string
  icon: string
}

export interface StreamDictionary {
  title: string
  description: string
  home: {
    badge: string
    title: string
    description: string
    exploreCourses: string
    signIn: string
    features: StreamFeature[]
  }
  courses: {
    title: string
    description: string
    searchPlaceholder: string
    filterByCategory: string
    allCategories: string
    noCourses: string
    noCoursesDescription: string
    price: string
    free: string
    enrolled: string
    enroll: string
    viewDetails: string
  }
  course: {
    title: string
    description: string
    aboutCourse: string
    whatYouWillLearn: string
    courseContent: string
    instructor: string
    enrollNow: string
    startLearning: string
    continueWatching: string
    chapters: string
    lessons: string
    duration: string
    students: string
  }
  dashboard: {
    title: string
    description: string
    welcome: string
    enrolledCourses: string
    inProgress: string
    completed: string
    continueLesson: string
    viewCertificate: string
    noCourses: string
    exploreNow: string
    progress: string
    completionRate: string
  }
  settings: {
    title: string
    description: string
    overview: string
    enrollments: string
    instructors: string
    videos: string
  }
  payment: {
    success: {
      title: string
      description: string
      message: string
      detail: string
      goToCourse: string
      viewDashboard: string
    }
    cancel: {
      title: string
      description: string
      message: string
      detail: string
      tryAgain: string
      browseCourses: string
    }
  }
  lesson: {
    markComplete: string
    completed: string
    nextLesson: string
    previousLesson: string
    downloadAttachments: string
    transcript: string
    notes: string
    discussion: string
  }
  courseDetail: {
    home: string
    courses: string
    continueLearning: string
    free: string
    alreadyRegistered: string
    signIn: string
    shareOnX: string
    shareOnLinkedIn: string
    lectures: string
    hours: string
    hour: string
    hoursOfVideo: string
    hourOfVideo: string
    minOfVideo: string
    certificate: string
    aboutThisCourse: string
    thisCourseDescription: string
    learningObjectives: string
    byTheEnd: string
    prerequisites: string
    whoThisCourseIsFor: string
    learnersDescription: string
    courseSections: string
    lesson: string
    lessons: string
    preview: string
    instructor: string
    courseInstructor: string
    trainingProfessionals: string
  }
  header: {
    home: string
    courses: string
    myLearning: string
    settings: string
    signIn: string
    profile: string
  }
  teach: string
  studentDashboard: {
    myCourses: string
    continueFromWhereYouLeftOff: string
    noCoursesEnrolled: string
    notEnrolledYet: string
    browseCourses: string
    completed: string
    progress: string
    lessonsCompleted: string
    continueLearning: string
    startLearning: string
    availableCourses: string
    discoverNewCourses: string
    viewAll: string
    noDescription: string
    chapters: string
    lessons: string
    enrolled: string
  }
  adminDashboard: {
    title: string
    description: string
    totalCourses: string
    noCoursesYet: string
    coursesAvailable: string
    totalEnrollments: string
    noEnrollmentsYet: string
    activeStudents: string
    totalRevenue: string
    noRevenueYet: string
    fromCourseSales: string
    growth: string
    vsLastMonth: string
    enrollmentStatistics: string
    overviewOfEnrollments: string
    chartComingSoon: string
    enrollmentDataWillBeDisplayed: string
    recentCourses: string
    mostRecentlyCreated: string
    viewAllCourses: string
    published: string
    draft: string
    chapters: string
    lessons: string
    enrolled: string
    edit: string
    noCoursesCreated: string
    createFirstCourse: string
    createCourse: string
  }
  paymentSuccess: {
    invalidSession: string
    noSessionFound: string
    browseCourses: string
    paymentVerificationFailed: string
    couldNotVerify: string
    paymentSuccessful: string
    congratulations: string
    startLearning: string
    goToDashboard: string
  }
  enrollmentButton: {
    loading: string
    enrollInCourse: string
  }
  // Landing page sections - these use dynamic keys for i18n
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  curriculum?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hotReleases?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  howToBegin?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reasons?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skills?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teachingHero?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  courseTypes?: Record<string, any>
}

// Base props for all Stream content components
export interface StreamContentProps {
  dictionary: StreamDictionary
  lang: Locale
  schoolId: string | null
}

// Props for authenticated components
export interface StreamAuthenticatedProps extends StreamContentProps {
  userId: string
}

// Props for admin components
export interface StreamAdminProps extends StreamAuthenticatedProps {
  userRole: UserRole
}

// Props with search params
export interface StreamSearchProps {
  searchParams?: {
    category?: string
    search?: string
    page?: string
  }
}

// Catalog-backed course types (Subject viewed as course)
export interface CatalogCourseType {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  price: number | null
  category: { name: string } | null
  chaptersCount: number
  lessonsCount: number
  enrollmentsCount: number
}

export interface CatalogIndividualCourseType extends CatalogCourseType {
  objectives: string[]
  prerequisites: string | null
  targetAudience: string | null
  chapters: Array<{
    id: string
    name: string
    slug: string
    lessons: Array<{
      id: string
      name: string
      slug: string
      description: string | null
    }>
  }>
}
