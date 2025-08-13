-- CreateTable
CREATE TABLE "public"."school_week_configs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT,
    "workingDays" INTEGER[],
    "defaultLunchAfterPeriod" INTEGER,
    "extraLunchRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_week_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."timetables" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "periodId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "weekOffset" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_week_configs_schoolId_termId_key" ON "public"."school_week_configs"("schoolId", "termId");

-- CreateIndex
CREATE INDEX "timetables_schoolId_termId_dayOfWeek_idx" ON "public"."timetables"("schoolId", "termId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "timetables_schoolId_termId_periodId_idx" ON "public"."timetables"("schoolId", "termId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_schoolId_termId_dayOfWeek_periodId_classId_weekO_key" ON "public"."timetables"("schoolId", "termId", "dayOfWeek", "periodId", "classId", "weekOffset");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_schoolId_termId_dayOfWeek_periodId_teacherId_wee_key" ON "public"."timetables"("schoolId", "termId", "dayOfWeek", "periodId", "teacherId", "weekOffset");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_schoolId_termId_dayOfWeek_periodId_classroomId_w_key" ON "public"."timetables"("schoolId", "termId", "dayOfWeek", "periodId", "classroomId", "weekOffset");

-- AddForeignKey
ALTER TABLE "public"."school_week_configs" ADD CONSTRAINT "school_week_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_week_configs" ADD CONSTRAINT "school_week_configs_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timetables" ADD CONSTRAINT "timetables_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timetables" ADD CONSTRAINT "timetables_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timetables" ADD CONSTRAINT "timetables_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timetables" ADD CONSTRAINT "timetables_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timetables" ADD CONSTRAINT "timetables_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timetables" ADD CONSTRAINT "timetables_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "public"."classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
