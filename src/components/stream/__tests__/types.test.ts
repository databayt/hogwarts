import { describe, expectTypeOf, it } from "vitest"

import type {
  StreamCertificate,
  StreamChapter,
  StreamContentProps,
  StreamCourse,
  StreamDictionary,
  StreamEnrollment,
  StreamLesson,
  StreamLessonProgress,
} from "../types"

describe("Stream Types", () => {
  describe("StreamDictionary", () => {
    it("should have correct structure for stream property", () => {
      const dict: StreamDictionary = {
        stream: {
          title: "Stream LMS",
          description: "Learning Management System",
          home: {
            badge: "Welcome",
            title: "Learn",
            description: "Start learning",
            exploreCourses: "Explore",
            signIn: "Sign In",
            features: [],
          },
          courses: {
            title: "Courses",
            description: "Browse courses",
            searchPlaceholder: "Search...",
            filterByCategory: "Filter",
            allCategories: "All",
            noCourses: "No courses",
            noCoursesDescription: "No courses found",
            price: "Price",
            free: "Free",
            enrolled: "Enrolled",
            enroll: "Enroll",
            viewDetails: "View",
          },
          course: {
            title: "Course",
            description: "Course details",
            aboutCourse: "About",
            whatYouWillLearn: "What you'll learn",
            courseContent: "Content",
            instructor: "Instructor",
            enrollNow: "Enroll Now",
            startLearning: "Start",
            continueWatching: "Continue",
            chapters: "chapters",
            lessons: "lessons",
            duration: "duration",
            students: "students",
          },
          dashboard: {
            title: "Dashboard",
            description: "Track progress",
            welcome: "Welcome",
            enrolledCourses: "Enrolled",
            inProgress: "In Progress",
            completed: "Completed",
            continueLesson: "Continue",
            viewCertificate: "View Certificate",
            noCourses: "No courses",
            exploreNow: "Explore",
            progress: "Progress",
            completionRate: "completion",
          },
          admin: {
            title: "Admin",
            description: "Manage courses",
            overview: "Overview",
            totalCourses: "Total Courses",
            totalEnrollments: "Total Enrollments",
            totalRevenue: "Total Revenue",
            recentEnrollments: "Recent",
            manageCourses: "Manage",
            createCourse: {
              title: "Create Course",
              description: "Create a new course",
              courseTitleLabel: "Title",
              courseTitlePlaceholder: "Enter title",
              descriptionLabel: "Description",
              descriptionPlaceholder: "Enter description",
              categoryLabel: "Category",
              selectCategory: "Select",
              priceLabel: "Price",
              pricePlaceholder: "0.00",
              freeOption: "Free",
              submit: "Create",
              creating: "Creating...",
              success: "Success",
              error: "Error",
            },
            editCourse: {
              title: "Edit Course",
              description: "Update course",
              save: "Save",
              publish: "Publish",
              unpublish: "Unpublish",
              delete: "Delete",
              addChapter: "Add Chapter",
              addLesson: "Add Lesson",
              reorderHint: "Drag to reorder",
              saving: "Saving...",
            },
          },
          notAdmin: {
            title: "Access Denied",
            description: "No permission",
            message: "Admin required",
            detail: "You need admin access",
            goBack: "Go Back",
            goToDashboard: "Dashboard",
          },
          payment: {
            success: {
              title: "Payment Success",
              description: "Payment completed",
              message: "Thank you",
              detail: "You are enrolled",
              goToCourse: "Go to Course",
              viewDashboard: "Dashboard",
            },
            cancel: {
              title: "Payment Cancelled",
              description: "Payment cancelled",
              message: "Cancelled",
              detail: "Not completed",
              tryAgain: "Try Again",
              browseCourses: "Browse",
            },
          },
          lesson: {
            markComplete: "Mark Complete",
            completed: "Completed",
            nextLesson: "Next",
            previousLesson: "Previous",
            downloadAttachments: "Download",
            transcript: "Transcript",
            notes: "Notes",
            discussion: "Discussion",
          },
          courseDetail: {
            home: "Home",
            courses: "Courses",
            continueLearning: "Continue",
            free: "FREE",
            alreadyRegistered: "Already registered?",
            signIn: "Sign In",
            shareOnX: "Share on X",
            shareOnLinkedIn: "Share on LinkedIn",
            lectures: "lectures",
            hours: "hours",
            hour: "hour",
            hoursOfVideo: "hours of video",
            hourOfVideo: "hour of video",
            minOfVideo: "min of video",
            certificate: "Certificate",
            aboutThisCourse: "About",
            thisCourseDescription: "Course description",
            learningObjectives: "Objectives",
            byTheEnd: "By the end",
            prerequisites: "Prerequisites",
            whoThisCourseIsFor: "Who this is for",
            learnersDescription: "Learners",
            courseSections: "Sections",
            lesson: "lesson",
            lessons: "lessons",
            preview: "Preview",
            instructor: "Instructor",
            courseInstructor: "Course Instructor",
            trainingProfessionals: "Training",
          },
          adminCourses: {
            yourCourses: "Your Courses",
            coursesInLibrary: "courses",
            createCourse: "Create",
            noCoursesYet: "No courses",
            createFirstCourse: "Create first",
            createYourFirstCourse: "Create",
            uncategorized: "Uncategorized",
            enrolled: "enrolled",
            free: "Free",
            published: "Published",
            draft: "Draft",
            edit: "Edit",
            delete: "Delete",
          },
          deleteDialog: {
            delete: "Delete",
            deleteCourse: "Delete Course",
            confirmDelete: "Confirm",
            cancel: "Cancel",
            deleting: "Deleting...",
          },
          header: {
            home: "Home",
            courses: "Courses",
            favorite: "Favorite",
            dashboard: "Dashboard",
            signIn: "Sign In",
            profile: "Profile",
          },
          studentDashboard: {
            myCourses: "My Courses",
            continueFromWhereYouLeftOff: "Continue",
            noCoursesEnrolled: "No courses",
            notEnrolledYet: "Not enrolled",
            browseCourses: "Browse",
            completed: "Completed",
            progress: "Progress",
            lessonsCompleted: "completed",
            continueLearning: "Continue",
            startLearning: "Start",
            availableCourses: "Available",
            discoverNewCourses: "Discover",
            viewAll: "View All",
            noDescription: "No description",
            chapters: "chapters",
            lessons: "lessons",
            enrolled: "enrolled",
          },
          adminDashboard: {
            title: "Admin Dashboard",
            description: "Manage",
            totalCourses: "Courses",
            noCoursesYet: "No courses",
            coursesAvailable: "available",
            totalEnrollments: "Enrollments",
            noEnrollmentsYet: "No enrollments",
            activeStudents: "students",
            totalRevenue: "Revenue",
            noRevenueYet: "No revenue",
            fromCourseSales: "from sales",
            growth: "Growth",
            vsLastMonth: "vs last month",
            enrollmentStatistics: "Statistics",
            overviewOfEnrollments: "Overview",
            chartComingSoon: "Coming soon",
            enrollmentDataWillBeDisplayed: "Data",
            recentCourses: "Recent",
            mostRecentlyCreated: "Recently created",
            viewAllCourses: "View All",
            published: "Published",
            draft: "Draft",
            chapters: "chapters",
            lessons: "lessons",
            enrolled: "enrolled",
            edit: "Edit",
            noCoursesCreated: "No courses",
            createFirstCourse: "Create first",
            createCourse: "Create",
          },
          paymentSuccess: {
            invalidSession: "Invalid",
            noSessionFound: "No session",
            browseCourses: "Browse",
            paymentVerificationFailed: "Failed",
            couldNotVerify: "Could not verify",
            paymentSuccessful: "Success",
            congratulations: "Congratulations",
            startLearning: "Start",
            goToDashboard: "Dashboard",
          },
          enrollmentButton: {
            loading: "Loading...",
            enrollInCourse: "Enroll",
          },
        },
      }

      expectTypeOf(dict).toMatchTypeOf<StreamDictionary>()
    })
  })

  describe("StreamContentProps", () => {
    it("should have correct structure", () => {
      expectTypeOf<StreamContentProps>().toHaveProperty("dictionary")
      expectTypeOf<StreamContentProps>().toHaveProperty("lang")
      expectTypeOf<StreamContentProps>().toHaveProperty("schoolId")
    })
  })

  describe("StreamCourse", () => {
    it("should have required fields", () => {
      expectTypeOf<StreamCourse>().toHaveProperty("id")
      expectTypeOf<StreamCourse>().toHaveProperty("schoolId")
      expectTypeOf<StreamCourse>().toHaveProperty("title")
      expectTypeOf<StreamCourse>().toHaveProperty("slug")
      expectTypeOf<StreamCourse>().toHaveProperty("isPublished")
    })

    it("should have optional fields", () => {
      expectTypeOf<StreamCourse>().toHaveProperty("description")
      expectTypeOf<StreamCourse>().toHaveProperty("imageUrl")
      expectTypeOf<StreamCourse>().toHaveProperty("price")
    })
  })

  describe("StreamChapter", () => {
    it("should have required fields", () => {
      expectTypeOf<StreamChapter>().toHaveProperty("id")
      expectTypeOf<StreamChapter>().toHaveProperty("title")
      expectTypeOf<StreamChapter>().toHaveProperty("position")
      expectTypeOf<StreamChapter>().toHaveProperty("courseId")
    })
  })

  describe("StreamLesson", () => {
    it("should have required fields", () => {
      expectTypeOf<StreamLesson>().toHaveProperty("id")
      expectTypeOf<StreamLesson>().toHaveProperty("title")
      expectTypeOf<StreamLesson>().toHaveProperty("position")
      expectTypeOf<StreamLesson>().toHaveProperty("chapterId")
    })
  })

  describe("StreamEnrollment", () => {
    it("should have required fields", () => {
      expectTypeOf<StreamEnrollment>().toHaveProperty("id")
      expectTypeOf<StreamEnrollment>().toHaveProperty("schoolId")
      expectTypeOf<StreamEnrollment>().toHaveProperty("userId")
      expectTypeOf<StreamEnrollment>().toHaveProperty("courseId")
      expectTypeOf<StreamEnrollment>().toHaveProperty("isActive")
    })
  })

  describe("StreamLessonProgress", () => {
    it("should have required fields", () => {
      expectTypeOf<StreamLessonProgress>().toHaveProperty("id")
      expectTypeOf<StreamLessonProgress>().toHaveProperty("userId")
      expectTypeOf<StreamLessonProgress>().toHaveProperty("lessonId")
      expectTypeOf<StreamLessonProgress>().toHaveProperty("isCompleted")
    })
  })

  describe("StreamCertificate", () => {
    it("should have required fields", () => {
      expectTypeOf<StreamCertificate>().toHaveProperty("id")
      expectTypeOf<StreamCertificate>().toHaveProperty("schoolId")
      expectTypeOf<StreamCertificate>().toHaveProperty("userId")
      expectTypeOf<StreamCertificate>().toHaveProperty("courseId")
      expectTypeOf<StreamCertificate>().toHaveProperty("certificateNumber")
      expectTypeOf<StreamCertificate>().toHaveProperty("completedAt")
    })
  })
})
