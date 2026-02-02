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
  admin: {
    title: string
    description: string
    overview: string
    totalCourses: string
    totalEnrollments: string
    totalRevenue: string
    recentEnrollments: string
    manageCourses: string
    createCourse: {
      title: string
      description: string
      courseTitleLabel: string
      courseTitlePlaceholder: string
      descriptionLabel: string
      descriptionPlaceholder: string
      categoryLabel: string
      selectCategory: string
      priceLabel: string
      pricePlaceholder: string
      freeOption: string
      submit: string
      creating: string
      success: string
      error: string
    }
    editCourse: {
      title: string
      description: string
      save: string
      publish: string
      unpublish: string
      delete: string
      addChapter: string
      addLesson: string
      reorderHint: string
      saving: string
    }
  }
  notAdmin: {
    title: string
    description: string
    message: string
    detail: string
    goBack: string
    goToDashboard: string
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
  adminCourses: {
    yourCourses: string
    coursesInLibrary: string
    createCourse: string
    noCoursesYet: string
    createFirstCourse: string
    createYourFirstCourse: string
    uncategorized: string
    enrolled: string
    free: string
    published: string
    draft: string
    edit: string
    delete: string
  }
  deleteDialog: {
    delete: string
    deleteCourse: string
    confirmDelete: string
    cancel: string
    deleting: string
  }
  header: {
    home: string
    courses: string
    favorite: string
    dashboard: string
    signIn: string
    profile: string
  }
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

// Course types
export interface StreamCourse {
  id: string
  schoolId: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  price: number | null
  isPublished: boolean
  categoryId: string | null
  category?: StreamCategory | null
  userId: string
  user?: {
    id: string
    email: string | null
    username: string | null
  }
  chapters?: StreamChapter[]
  enrollments?: StreamEnrollment[]
  createdAt: Date
  updatedAt: Date
}

export interface StreamCategory {
  id: string
  schoolId: string
  name: string
}

export interface StreamChapter {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  position: number
  isPublished: boolean
  isFree: boolean
  courseId: string
  lessons?: StreamLesson[]
}

export interface StreamLesson {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  position: number
  isPublished: boolean
  isFree: boolean
  duration: number | null
  chapterId: string
  progress?: StreamLessonProgress[]
  attachments?: StreamAttachment[]
}

export interface StreamAttachment {
  id: string
  name: string
  url: string
  lessonId: string
}

export interface StreamEnrollment {
  id: string
  schoolId: string
  userId: string
  courseId: string
  stripeCustomerId: string | null
  stripeCheckoutSessionId: string | null
  stripePriceId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface StreamLessonProgress {
  id: string
  userId: string
  lessonId: string
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface StreamCertificate {
  id: string
  schoolId: string
  userId: string
  courseId: string
  courseTitle: string
  certificateNumber: string
  completedAt: Date
  issuedAt: Date
}

// Form data types
export interface CreateCourseData {
  title: string
  description?: string
  categoryId?: string
  price?: number
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  imageUrl?: string
  isPublished?: boolean
}

export interface CreateChapterData {
  title: string
  description?: string
  position: number
  isFree?: boolean
}

export interface CreateLessonData {
  title: string
  description?: string
  position: number
  duration?: number
  isFree?: boolean
}

// Dashboard statistics
export interface StreamStats {
  totalCourses: number
  totalEnrollments: number
  totalRevenue: number
  recentEnrollments: Array<{
    id: string
    courseName: string
    studentName: string
    enrolledAt: Date
    amount: number
  }>
}
