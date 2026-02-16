-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "SchoolLevel" AS ENUM ('ELEMENTARY', 'MIDDLE', 'HIGH');

-- CreateEnum
CREATE TYPE "StreamType" AS ENUM ('GENERAL', 'SCIENCE', 'ARTS', 'COMMERCE', 'TECHNICAL', 'RELIGIOUS');

-- CreateEnum
CREATE TYPE "VideoVisibility" AS ENUM ('PRIVATE', 'SCHOOL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ContentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "catalog_subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "description" TEXT,
    "department" TEXT NOT NULL,
    "levels" "SchoolLevel"[],
    "country" TEXT NOT NULL DEFAULT 'SD',
    "system" TEXT NOT NULL DEFAULT 'national',
    "imageKey" TEXT,
    "color" TEXT,
    "iconUrl" TEXT,
    "bannerUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "gradeRange" TEXT,
    "totalChapters" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "totalContent" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_chapters" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "description" TEXT,
    "sequenceOrder" INTEGER NOT NULL,
    "imageKey" TEXT,
    "color" TEXT,
    "gradeRange" TEXT,
    "levels" "SchoolLevel"[],
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "totalContent" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_lessons" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "description" TEXT,
    "sequenceOrder" INTEGER NOT NULL,
    "imageKey" TEXT,
    "color" TEXT,
    "durationMinutes" INTEGER,
    "objectives" TEXT,
    "gradeRange" TEXT,
    "levels" "SchoolLevel"[],
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_exams" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "examType" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "totalMarks" INTEGER,
    "passingMarks" INTEGER,
    "questions" JSONB,
    "totalQuestions" INTEGER,
    "distribution" JSONB,
    "gradeRange" TEXT,
    "levels" "SchoolLevel"[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_videos" (
    "id" TEXT NOT NULL,
    "catalogLessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSeconds" INTEGER,
    "provider" TEXT NOT NULL,
    "externalId" TEXT,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "visibility" "VideoVisibility" NOT NULL DEFAULT 'PRIVATE',
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "approvalStatus" "ContentApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_attachments" (
    "id" TEXT NOT NULL,
    "catalogLessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogSubjectId" TEXT NOT NULL,
    "schoolId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePriceId" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogLessonId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonVideoId" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "totalSeconds" INTEGER,
    "lastWatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogSubjectId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "schoolId" TEXT,
    "certificateNumber" TEXT NOT NULL,
    "subjectTitle" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_levels" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "level" "SchoolLevel" NOT NULL,
    "levelOrder" INTEGER NOT NULL,
    "startGrade" INTEGER NOT NULL,
    "endGrade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_grades" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "yearLevelId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "gradeNumber" INTEGER NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 40,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_streams" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "streamType" "StreamType" NOT NULL DEFAULT 'GENERAL',
    "maxStudents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_subject_selections" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "catalogSubjectId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "streamId" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "weeklyPeriods" INTEGER,
    "customName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_subject_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_content_overrides" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "catalogChapterId" TEXT,
    "catalogLessonId" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "overriddenBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_content_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_schemes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "system" "GradingSystem" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "passingThreshold" INTEGER NOT NULL DEFAULT 60,
    "showPercentage" BOOLEAN NOT NULL DEFAULT true,
    "showGPA" BOOLEAN NOT NULL DEFAULT false,
    "showLetter" BOOLEAN NOT NULL DEFAULT true,
    "maxGPA" DECIMAL(3,1),
    "roundingMethod" TEXT NOT NULL DEFAULT 'round',
    "decimalPlaces" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_scheme_grades" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "gpaValue" DECIMAL(3,1),
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_scheme_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_subjects_slug_key" ON "catalog_subjects"("slug");
CREATE INDEX "catalog_subjects_slug_idx" ON "catalog_subjects"("slug");
CREATE INDEX "catalog_subjects_status_idx" ON "catalog_subjects"("status");
CREATE INDEX "catalog_subjects_country_system_idx" ON "catalog_subjects"("country", "system");
CREATE INDEX "catalog_subjects_department_idx" ON "catalog_subjects"("department");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_chapters_subjectId_slug_key" ON "catalog_chapters"("subjectId", "slug");
CREATE INDEX "catalog_chapters_subjectId_sequenceOrder_idx" ON "catalog_chapters"("subjectId", "sequenceOrder");
CREATE INDEX "catalog_chapters_status_idx" ON "catalog_chapters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_lessons_chapterId_slug_key" ON "catalog_lessons"("chapterId", "slug");
CREATE INDEX "catalog_lessons_chapterId_sequenceOrder_idx" ON "catalog_lessons"("chapterId", "sequenceOrder");
CREATE INDEX "catalog_lessons_status_idx" ON "catalog_lessons"("status");

-- CreateIndex
CREATE INDEX "catalog_exams_subjectId_idx" ON "catalog_exams"("subjectId");
CREATE INDEX "catalog_exams_chapterId_idx" ON "catalog_exams"("chapterId");
CREATE INDEX "catalog_exams_status_idx" ON "catalog_exams"("status");

-- CreateIndex
CREATE INDEX "lesson_videos_catalogLessonId_approvalStatus_visibility_idx" ON "lesson_videos"("catalogLessonId", "approvalStatus", "visibility");
CREATE INDEX "lesson_videos_userId_idx" ON "lesson_videos"("userId");
CREATE INDEX "lesson_videos_schoolId_idx" ON "lesson_videos"("schoolId");
CREATE INDEX "lesson_videos_viewCount_idx" ON "lesson_videos"("viewCount");

-- CreateIndex
CREATE INDEX "lesson_attachments_catalogLessonId_idx" ON "lesson_attachments"("catalogLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_stripeCheckoutSessionId_key" ON "enrollments"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "enrollments_userId_catalogSubjectId_key" ON "enrollments"("userId", "catalogSubjectId");
CREATE INDEX "enrollments_userId_idx" ON "enrollments"("userId");
CREATE INDEX "enrollments_catalogSubjectId_idx" ON "enrollments"("catalogSubjectId");
CREATE INDEX "enrollments_schoolId_idx" ON "enrollments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_userId_catalogLessonId_key" ON "lesson_progress"("userId", "catalogLessonId");
CREATE INDEX "lesson_progress_userId_idx" ON "lesson_progress"("userId");
CREATE INDEX "lesson_progress_catalogLessonId_idx" ON "lesson_progress"("catalogLessonId");
CREATE INDEX "lesson_progress_lastWatchedAt_idx" ON "lesson_progress"("lastWatchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "subject_certificates_enrollmentId_key" ON "subject_certificates"("enrollmentId");
CREATE UNIQUE INDEX "subject_certificates_certificateNumber_key" ON "subject_certificates"("certificateNumber");
CREATE UNIQUE INDEX "subject_certificates_userId_catalogSubjectId_key" ON "subject_certificates"("userId", "catalogSubjectId");
CREATE INDEX "subject_certificates_userId_idx" ON "subject_certificates"("userId");
CREATE INDEX "subject_certificates_certificateNumber_idx" ON "subject_certificates"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "academic_levels_schoolId_slug_key" ON "academic_levels"("schoolId", "slug");
CREATE INDEX "academic_levels_schoolId_idx" ON "academic_levels"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_grades_schoolId_gradeNumber_key" ON "academic_grades"("schoolId", "gradeNumber");
CREATE INDEX "academic_grades_schoolId_idx" ON "academic_grades"("schoolId");
CREATE INDEX "academic_grades_levelId_idx" ON "academic_grades"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_streams_schoolId_gradeId_slug_key" ON "academic_streams"("schoolId", "gradeId", "slug");
CREATE INDEX "academic_streams_schoolId_idx" ON "academic_streams"("schoolId");
CREATE INDEX "academic_streams_gradeId_idx" ON "academic_streams"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "school_subject_selections_schoolId_catalogSubjectId_gradeId_s_key" ON "school_subject_selections"("schoolId", "catalogSubjectId", "gradeId", "streamId");
CREATE INDEX "school_subject_selections_schoolId_gradeId_idx" ON "school_subject_selections"("schoolId", "gradeId");
CREATE INDEX "school_subject_selections_schoolId_gradeId_streamId_idx" ON "school_subject_selections"("schoolId", "gradeId", "streamId");

-- CreateIndex
CREATE UNIQUE INDEX "school_content_overrides_schoolId_catalogChapterId_catalogLes_key" ON "school_content_overrides"("schoolId", "catalogChapterId", "catalogLessonId");
CREATE INDEX "school_content_overrides_schoolId_catalogChapterId_idx" ON "school_content_overrides"("schoolId", "catalogChapterId");
CREATE INDEX "school_content_overrides_schoolId_catalogLessonId_idx" ON "school_content_overrides"("schoolId", "catalogLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "grading_schemes_schoolId_name_key" ON "grading_schemes"("schoolId", "name");
CREATE INDEX "grading_schemes_schoolId_idx" ON "grading_schemes"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scheme_grades_schemeId_grade_key" ON "grading_scheme_grades"("schemeId", "grade");
CREATE INDEX "grading_scheme_grades_schemeId_idx" ON "grading_scheme_grades"("schemeId");

-- AddForeignKey
ALTER TABLE "catalog_chapters" ADD CONSTRAINT "catalog_chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "catalog_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_lessons" ADD CONSTRAINT "catalog_lessons_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "catalog_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_exams" ADD CONSTRAINT "catalog_exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "catalog_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_exams" ADD CONSTRAINT "catalog_exams_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "catalog_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_catalogLessonId_fkey" FOREIGN KEY ("catalogLessonId") REFERENCES "catalog_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_attachments" ADD CONSTRAINT "lesson_attachments_catalogLessonId_fkey" FOREIGN KEY ("catalogLessonId") REFERENCES "catalog_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_attachments" ADD CONSTRAINT "lesson_attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_catalogSubjectId_fkey" FOREIGN KEY ("catalogSubjectId") REFERENCES "catalog_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_catalogLessonId_fkey" FOREIGN KEY ("catalogLessonId") REFERENCES "catalog_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonVideoId_fkey" FOREIGN KEY ("lessonVideoId") REFERENCES "lesson_videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_certificates" ADD CONSTRAINT "subject_certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_certificates" ADD CONSTRAINT "subject_certificates_catalogSubjectId_fkey" FOREIGN KEY ("catalogSubjectId") REFERENCES "catalog_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_certificates" ADD CONSTRAINT "subject_certificates_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_certificates" ADD CONSTRAINT "subject_certificates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_levels" ADD CONSTRAINT "academic_levels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_grades" ADD CONSTRAINT "academic_grades_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academic_grades" ADD CONSTRAINT "academic_grades_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "academic_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academic_grades" ADD CONSTRAINT "academic_grades_yearLevelId_fkey" FOREIGN KEY ("yearLevelId") REFERENCES "year_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_streams" ADD CONSTRAINT "academic_streams_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academic_streams" ADD CONSTRAINT "academic_streams_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "academic_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_subject_selections" ADD CONSTRAINT "school_subject_selections_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_subject_selections" ADD CONSTRAINT "school_subject_selections_catalogSubjectId_fkey" FOREIGN KEY ("catalogSubjectId") REFERENCES "catalog_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_subject_selections" ADD CONSTRAINT "school_subject_selections_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "academic_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_subject_selections" ADD CONSTRAINT "school_subject_selections_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "academic_streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_content_overrides" ADD CONSTRAINT "school_content_overrides_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_content_overrides" ADD CONSTRAINT "school_content_overrides_catalogChapterId_fkey" FOREIGN KEY ("catalogChapterId") REFERENCES "catalog_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_content_overrides" ADD CONSTRAINT "school_content_overrides_catalogLessonId_fkey" FOREIGN KEY ("catalogLessonId") REFERENCES "catalog_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_schemes" ADD CONSTRAINT "grading_schemes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_scheme_grades" ADD CONSTRAINT "grading_scheme_grades_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "grading_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
