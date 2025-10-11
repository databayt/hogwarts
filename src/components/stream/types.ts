import type { Locale } from "@/components/internationalization/config";
import type { UserRole } from "@prisma/client";

// Base props for all Stream content components
export interface StreamContentProps {
  dictionary: any; // TODO: Create proper dictionary type
  lang: Locale;
  schoolId: string | null;
}

// Props for authenticated components
export interface StreamAuthenticatedProps extends StreamContentProps {
  userId: string;
}

// Props for admin components
export interface StreamAdminProps extends StreamAuthenticatedProps {
  userRole: UserRole;
}

// Props with search params
export interface StreamSearchProps {
  searchParams?: {
    category?: string;
    search?: string;
    page?: string;
  };
}

// Course types
export interface StreamCourse {
  id: string;
  schoolId: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  categoryId: string | null;
  category?: StreamCategory | null;
  userId: string;
  user?: {
    id: string;
    email: string | null;
    username: string | null;
  };
  chapters?: StreamChapter[];
  enrollments?: StreamEnrollment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamCategory {
  id: string;
  schoolId: string;
  name: string;
}

export interface StreamChapter {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  courseId: string;
  lessons?: StreamLesson[];
}

export interface StreamLesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  duration: number | null;
  chapterId: string;
  progress?: StreamLessonProgress[];
  attachments?: StreamAttachment[];
}

export interface StreamAttachment {
  id: string;
  name: string;
  url: string;
  lessonId: string;
}

export interface StreamEnrollment {
  id: string;
  schoolId: string;
  userId: string;
  courseId: string;
  stripeCustomerId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamLessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamCertificate {
  id: string;
  schoolId: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  certificateNumber: string;
  completedAt: Date;
  issuedAt: Date;
}

// Form data types
export interface CreateCourseData {
  title: string;
  description?: string;
  categoryId?: string;
  price?: number;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  imageUrl?: string;
  isPublished?: boolean;
}

export interface CreateChapterData {
  title: string;
  description?: string;
  position: number;
  isFree?: boolean;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  position: number;
  duration?: number;
  isFree?: boolean;
}

// Dashboard statistics
export interface StreamStats {
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  recentEnrollments: Array<{
    id: string;
    courseName: string;
    studentName: string;
    enrolledAt: Date;
    amount: number;
  }>;
}