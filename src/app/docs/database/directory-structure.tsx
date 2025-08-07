'use client'

import { Folder, File } from 'lucide-react'

interface DirectoryNode {
  name: string
  type: 'file' | 'directory'
  description?: string
  children?: DirectoryNode[]
}

interface DirectoryStructureProps {
  className?: string
}

export function DirectoryStructure({ className }: DirectoryStructureProps) {
  const directoryData: DirectoryNode = {
    name: "prisma/",
    type: "directory",
    children: [
      {
        name: "schema.prisma",
        type: "file",
        description: "Main configuration with datasource and generator"
      },
      {
        name: "models/",
        type: "directory",
        description: "Schema files organized by domain (8 domains)",
        children: [
          {
            name: "school.prisma",
            type: "file",
            description: "School, SchoolYear, Period, Term, YearLevel"
          },
          {
            name: "staff.prisma", 
            type: "file",
            description: "Teacher, Department, TeacherDepartment"
          },
          {
            name: "students.prisma",
            type: "file",
            description: "Student, Guardian, StudentGuardian"
          },
          {
            name: "subjects.prisma",
            type: "file",
            description: "Subject, Class, StudentClass, ScoreRange"
          },
          {
            name: "classrooms.prisma",
            type: "file",
            description: "Classroom, ClassroomType"
          },
          {
            name: "assessments.prisma", 
            type: "file",
            description: "Assignment, AssignmentSubmission"
          },
          {
            name: "attendance.prisma",
            type: "file",
            description: "Attendance with status tracking"
          },
          {
            name: "auth.prisma",
            type: "file",
            description: "User, Account, tokens, 2FA"
          }
        ]
      },
      {
        name: "generator/",
        type: "directory",
        description: "Database seeding scripts",
        children: [
          {
            name: "seed.ts",
            type: "file",
            description: "Simple seeding for basic data"
          },
          {
            name: "multi-seed.ts",
            type: "file",
            description: "Multi-school seeding orchestrator"
          },
          {
            name: "seed-selector.ts",
            type: "file",
            description: "Advanced seed selection options"
          }
        ]
      },
      {
        name: "migrations/",
        type: "directory",
        description: "Auto-generated migration files",
        children: [
          {
            name: "migration_lock.toml",
            type: "file",
            description: "Migration provider lock"
          }
        ]
      },
      {
        name: "README.md",
        type: "file",
        description: "Database documentation and guide"
      },
      {
        name: "ISSUE.md",
        type: "file",
        description: "Known issues and troubleshooting"
      }
    ]
  }

  const FileIcon = ({ type }: { type: string }) => {
    if (type === "directory") {
      return <Folder className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const FileTree = ({ 
    item, 
    level = 0,
    isLast = false,
    parentIsLast = [] 
  }: { 
    item: DirectoryNode
    level?: number
    isLast?: boolean
    parentIsLast?: boolean[]
  }) => (
    <div className="relative">
      {level > 0 && (
        <>
          {/* Vertical lines from parent levels */}
          {parentIsLast.slice(0, -1).map((isLastParent, idx) => (
            !isLastParent && (
              <div
                key={idx}
                className="absolute border-l h-full"
                style={{ left: `${(idx + 1) * 24 - 20}px` }}
              />
            )
          ))}
          {/* Current level vertical line */}
          {!isLast && (
            <div
              className="absolute border-l h-full"
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
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <code className={`text-sm bg-transparent px-0 py-0 ${
            item.type === 'directory' ? 'font-semibold' : ''
          }`}>
            {item.name}
          </code>
          {item.description && (
            <span className="text-sm text-muted-foreground">
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
        <FileTree item={directoryData} />
      </div>

      {/* <div className="border rounded-lg p-4 mt-8">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <File className="w-4 h-4" />
          Seeding System
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Seed Scripts:</span>
            <span className="font-medium">12 files</span>
          </div>
          <div className="flex justify-between">
            <span>Sample Schools:</span>
            <span className="font-medium">3 schools</span>
          </div>
          <div className="flex justify-between">
            <span>Sample Students:</span>
            <span className="font-medium">280+ students</span>
          </div>
          <div className="flex justify-between">
            <span>Sample Teachers:</span>
            <span className="font-medium">45+ teachers</span>
          </div>
          <div className="flex justify-between">
            <span>Sample Classes:</span>
            <span className="font-medium">120+ classes</span>
          </div>
        </div>
      </div> */}

      {/* <div className="border-l-4 p-4 rounded-r-lg">
        <h4 className="font-semibold mb-2">Multi-File Schema Benefits</h4>
        <ul className="text-sm space-y-1">
          <li>• <strong>Better Organization:</strong> Each domain has its own file for easier navigation</li>
          <li>• <strong>Team Collaboration:</strong> Reduces merge conflicts when multiple developers work on schema</li>
          <li>• <strong>Logical Separation:</strong> Clear boundaries between different aspects of the system</li>
          <li>• <strong>Maintainability:</strong> Easier to locate and modify specific models</li>
        </ul>
      </div> */}
    </div>
  )
}
