"use client"

import { File, Folder } from "lucide-react"

interface DirectoryNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: DirectoryNode[]
}

interface PrismaStructureProps {
  className?: string
}

export function PrismaStructure({ className }: PrismaStructureProps) {
  const prismaStructure: DirectoryNode = {
    name: "prisma/",
    type: "directory",
    description: "Database schema and migrations",
    children: [
      {
        name: "schema.prisma",
        type: "file",
        description: "Main config with datasource and generator",
      },
      {
        name: "models/",
        type: "directory",
        description: "Schema files organized by domain (30+ models)",
        children: [
          {
            name: "school.prisma",
            type: "file",
            description: "School, SchoolYear, Period, Term, YearLevel",
          },
          {
            name: "auth.prisma",
            type: "file",
            description: "User, Account, tokens, 2FA",
          },
          {
            name: "staff.prisma",
            type: "file",
            description: "Teacher, Department, TeacherDepartment",
          },
          {
            name: "students.prisma",
            type: "file",
            description: "Student, Guardian, StudentGuardian, Emergency",
          },
          {
            name: "subjects.prisma",
            type: "file",
            description: "Subject, Class, StudentClass, ScoreRange",
          },
          {
            name: "classrooms.prisma",
            type: "file",
            description: "Classroom, ClassroomType",
          },
          {
            name: "assessments.prisma",
            type: "file",
            description: "Assignment, AssignmentSubmission",
          },
          {
            name: "attendance.prisma",
            type: "file",
            description: "Attendance with status tracking",
          },
          {
            name: "attendance-enhanced.prisma",
            type: "file",
            description: "Advanced attendance features",
          },
          {
            name: "geo-attendance.prisma",
            type: "file",
            description: "Location-based attendance",
          },
          {
            name: "finance.prisma",
            type: "file",
            description: "Fees, payments, invoices, receipts",
          },
          {
            name: "subscription.prisma",
            type: "file",
            description: "Plans, billing, Stripe integration",
          },
          {
            name: "admission.prisma",
            type: "file",
            description: "Applications, enrollment workflow",
          },
          {
            name: "exam.prisma",
            type: "file",
            description: "Exams, grades, report cards",
          },
          {
            name: "qbank.prisma",
            type: "file",
            description: "Question bank, assessments",
          },
          {
            name: "quiz-game.prisma",
            type: "file",
            description: "Gamified learning",
          },
          {
            name: "stream.prisma",
            type: "file",
            description: "Live streaming, recordings",
          },
          {
            name: "timetable.prisma",
            type: "file",
            description: "Schedule, periods, slots",
          },
          {
            name: "messages.prisma",
            type: "file",
            description: "Chat, conversations, threads",
          },
          {
            name: "notifications.prisma",
            type: "file",
            description: "Push, email, in-app alerts",
          },
          {
            name: "files.prisma",
            type: "file",
            description: "File storage, attachments",
          },
          {
            name: "library.prisma",
            type: "file",
            description: "Books, borrowing, catalog",
          },
          {
            name: "lessons.prisma",
            type: "file",
            description: "Lesson plans, resources",
          },
          {
            name: "announcement.prisma",
            type: "file",
            description: "School-wide announcements",
          },
          {
            name: "branding.prisma",
            type: "file",
            description: "Theme, logo, customization",
          },
          {
            name: "theme.prisma",
            type: "file",
            description: "UI theme preferences",
          },
          {
            name: "legal.prisma",
            type: "file",
            description: "Consent, compliance, GDPR",
          },
          {
            name: "domain.prisma",
            type: "file",
            description: "Custom domain requests",
          },
          {
            name: "audit.prisma",
            type: "file",
            description: "Activity logging",
          },
          { name: "task.prisma", type: "file", description: "Task management" },
          {
            name: "schedule.prisma",
            type: "file",
            description: "Event scheduling",
          },
        ],
      },
      {
        name: "generator/",
        type: "directory",
        description: "Database seeding scripts",
        children: [
          {
            name: "seed.ts",
            type: "file",
            description: "Main seeding orchestrator",
          },
          {
            name: "seed-demo.ts",
            type: "file",
            description: "Demo data for showcases",
          },
          {
            name: "seed-community.ts",
            type: "file",
            description: "Community edition data",
          },
          {
            name: "seed-qbank-simple.ts",
            type: "file",
            description: "Question bank seeder",
          },
          {
            name: "seed-modules/",
            type: "directory",
            description: "Modular seeders",
            children: [
              {
                name: "admission.ts",
                type: "file",
                description: "Admission test data",
              },
              {
                name: "finance.ts",
                type: "file",
                description: "Financial test data",
              },
            ],
          },
        ],
      },
      {
        name: "seed/",
        type: "directory",
        description: "Additional seed data",
        children: [
          {
            name: "finance.seed.ts",
            type: "file",
            description: "Finance module seeder",
          },
          {
            name: "timetable-enhanced.ts",
            type: "file",
            description: "Timetable seeder",
          },
        ],
      },
      {
        name: "migrations/",
        type: "directory",
        description: "Auto-generated migration files",
        children: [
          {
            name: "20250807.../",
            type: "directory",
            description: "Initial multi-tenant schema",
          },
          {
            name: "20250810.../",
            type: "directory",
            description: "Audit and domain request",
          },
          {
            name: "20250811.../",
            type: "directory",
            description: "Stripe billing models",
          },
          {
            name: "20250812.../",
            type: "directory",
            description: "Timetable init",
          },
          {
            name: "migration_lock.toml",
            type: "file",
            description: "Migration provider lock",
          },
        ],
      },
      {
        name: "sql/",
        type: "directory",
        description: "Raw SQL scripts",
        children: [
          {
            name: "geo-spatial-indexes.sql",
            type: "file",
            description: "Geo-location indexes",
          },
          {
            name: "geo-triggers.sql",
            type: "file",
            description: "Geo-location triggers",
          },
        ],
      },
      {
        name: "schema-optimizations.sql",
        type: "file",
        description: "Performance optimizations",
      },
      {
        name: "README.md",
        type: "file",
        description: "Database documentation",
      },
      { name: "ISSUE.md", type: "file", description: "Known issues and fixes" },
    ],
  }

  const FileIcon = ({ type }: { type: string }) => {
    if (type === "directory") {
      return <Folder className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const FileTree = ({
    item,
    level = 0,
    isLast = false,
    parentIsLast = [],
  }: {
    item: DirectoryNode
    level?: number
    isLast?: boolean
    parentIsLast?: boolean[]
  }) => (
    <div className="relative">
      {level > 0 && (
        <>
          {parentIsLast
            .slice(0, -1)
            .map(
              (isLastParent, idx) =>
                !isLastParent && (
                  <div
                    key={idx}
                    className="absolute h-full border-l"
                    style={{ left: `${(idx + 1) * 24 - 20}px` }}
                  />
                )
            )}
          {!isLast && (
            <div
              className="absolute h-full border-l"
              style={{ left: `${level * 24 - 20}px` }}
            />
          )}
        </>
      )}
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        <FileIcon type={item.type} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <code
            className={`bg-transparent px-0 py-0 ${
              item.type === "directory" ? "font-semibold" : ""
            }`}
          >
            {item.name}
          </code>
          {item.description && (
            <span className="text-muted-foreground text-sm">
              — {item.description}
            </span>
          )}
        </div>
      </div>
      {item.children && (
        <div className="mt-1">
          {item.children.map((child: DirectoryNode, index: number) => (
            <FileTree
              key={index}
              item={child}
              level={level + 1}
              isLast={index === (item.children?.length ?? 0) - 1}
              parentIsLast={[...parentIsLast, isLast]}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="py-4">
        <FileTree item={prismaStructure} />
      </div>
    </div>
  )
}
