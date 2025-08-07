'use client'

interface SchemaTableProps {
  className?: string
}

export function SchemaTable({ className }: SchemaTableProps) {
  const schemaData = [
    {
      domain: "School Management",
      file: "school.prisma",
      tables: [
        { name: "School", description: "Main tenant entity with domain and subscription info" },
        { name: "SchoolYear", description: "Academic years with start/end dates" },
        { name: "Period", description: "Daily class periods and scheduling" },
        { name: "Term", description: "Academic terms within school years" },
        { name: "YearLevel", description: "Grade levels (Year 1-7)" }
      ]
    },
    {
      domain: "Staff Management", 
      file: "staff.prisma",
      tables: [
        { name: "Teacher", description: "Teacher information and qualifications" },
        { name: "Department", description: "Academic departments (e.g., Transfiguration, Potions)" },
        { name: "TeacherDepartment", description: "Many-to-many teacher-department relationships" },
        { name: "TeacherPhoneNumber", description: "Multiple contact numbers per teacher" }
      ]
    },
    {
      domain: "Student Management",
      file: "students.prisma", 
      tables: [
        { name: "Student", description: "Student enrollment and personal information" },
        { name: "Guardian", description: "Parent/guardian information and contact details" },
        { name: "GuardianType", description: "Guardian relationship types (mother, father, etc.)" },
        { name: "StudentGuardian", description: "Student-guardian relationship mapping" },
        { name: "GuardianPhoneNumber", description: "Guardian contact information" },
        { name: "StudentYearLevel", description: "Student grade level tracking by year" }
      ]
    },
    {
      domain: "Academic Structure",
      file: "subjects.prisma",
      tables: [
        { name: "Subject", description: "Academic subjects within departments" },
        { name: "Class", description: "Class instances with teacher, time, and location" },
        { name: "StudentClass", description: "Student enrollment in specific classes" },
        { name: "ScoreRange", description: "Grading scales and score ranges (A+, A, B, etc.)" }
      ]
    },
    {
      domain: "Facilities",
      file: "classrooms.prisma",
      tables: [
        { name: "Classroom", description: "Physical classroom locations and capacity" },
        { name: "ClassroomType", description: "Room types (regular, lab, library, etc.)" }
      ]
    },
    {
      domain: "Assessment System",
      file: "assessments.prisma", 
      tables: [
        { name: "Assignment", description: "Tests, quizzes, homework, and projects" },
        { name: "AssignmentSubmission", description: "Student submissions with grades and feedback" }
      ]
    },
    {
      domain: "Attendance Tracking",
      file: "attendance.prisma",
      tables: [
        { name: "Attendance", description: "Daily attendance records per class session" }
      ]
    },
    {
      domain: "Authentication",
      file: "auth.prisma",
      tables: [
        { name: "User", description: "Multi-tenant user accounts with role-based access" },
        { name: "Account", description: "OAuth provider account linking" },
        { name: "Session", description: "User session management" },
        { name: "VerificationToken", description: "Email verification and password reset tokens" }
      ]
    }
  ]

  return (
    <div className={`space-y-8 ${className}`}>
      {schemaData.map((domain) => (
        <div key={domain.domain} className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{domain.domain}</h3>
              <code className="text-sm bg-background px-2 py-1 rounded border">
                {domain.file}
              </code>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-sm">Table Name</th>
                  <th className="text-left px-4 py-3 font-medium text-sm">Description</th>
                </tr>
              </thead>
              <tbody>
                {domain.tables.map((table, index) => (
                  <tr 
                    key={table.name} 
                    className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <code className="text-sm font-medium text-primary">
                        {table.name}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {table.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
      {/* Sample Data Summary */}
      <div className="border rounded-lg overflow-hidden mt-8">
        <div className="bg-muted px-4 py-3 border-b">
          <h3 className="font-semibold text-lg">Sample Schools Data</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-sm">School</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Domain</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Students</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Teachers</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Departments</th>
                <th className="text-left px-4 py-3 font-medium text-sm">Classes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">Hogwarts School of Witchcraft and Wizardry</td>
                <td className="px-4 py-3">
                  <code className="text-sm">hogwarts.schoolapp.com</code>
                </td>
                <td className="px-4 py-3 text-center">280</td>
                <td className="px-4 py-3 text-center">45</td>
                <td className="px-4 py-3 text-center">8</td>
                <td className="px-4 py-3 text-center">120</td>
              </tr>
              <tr className="border-b hover:bg-muted/30 transition-colors bg-muted/10">
                <td className="px-4 py-3 font-medium">Beauxbatons Academy of Magic</td>
                <td className="px-4 py-3">
                  <code className="text-sm">beauxbatons.schoolapp.com</code>
                </td>
                <td className="px-4 py-3 text-center">210</td>
                <td className="px-4 py-3 text-center">35</td>
                <td className="px-4 py-3 text-center">6</td>
                <td className="px-4 py-3 text-center">85</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">Durmstrang Institute</td>
                <td className="px-4 py-3">
                  <code className="text-sm">durmstrang.schoolapp.com</code>
                </td>
                <td className="px-4 py-3 text-center">195</td>
                <td className="px-4 py-3 text-center">30</td>
                <td className="px-4 py-3 text-center">7</td>
                <td className="px-4 py-3 text-center">75</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
