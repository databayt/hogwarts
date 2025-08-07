'use client'

interface TableRow {
  [key: string]: string | number | boolean | null
  id: string
}

interface ModelTablesProps {
  className?: string
}

export function ModelTables({ className }: ModelTablesProps) {
  const schoolData = [
    { id: "sch_001", name: "Hogwarts", domain: "hogwarts", planType: "premium", maxStudents: 1000, isActive: true },
    { id: "sch_002", name: "Beauxbatons", domain: "beauxbatons", planType: "premium", maxStudents: 500, isActive: true },
    { id: "sch_003", name: "Durmstrang", domain: "durmstrang", planType: "basic", maxStudents: 300, isActive: true }
  ]

  const teacherData = [
    { id: "tch_001", schoolId: "sch_001", givenName: "Minerva", surname: "McGonagall", emailAddress: "m.mcg@hogwarts.edu", gender: "F" },
    { id: "tch_002", schoolId: "sch_001", givenName: "Severus", surname: "Snape", emailAddress: "s.snape@hogwarts.edu", gender: "M" },
    { id: "tch_003", schoolId: "sch_001", givenName: "Rubeus", surname: "Hagrid", emailAddress: "r.hagrid@hogwarts.edu", gender: "M" }
  ]

  const studentData = [
    { id: "std_001", schoolId: "sch_001", givenName: "Harry", middleName: "J", surname: "Potter", dateOfBirth: "1980-07-31", gender: "M" },
    { id: "std_002", schoolId: "sch_001", givenName: "Hermione", middleName: "J", surname: "Granger", dateOfBirth: "1979-09-19", gender: "F" },
    { id: "std_003", schoolId: "sch_001", givenName: "Ron", middleName: "B", surname: "Weasley", dateOfBirth: "1980-03-01", gender: "M" }
  ]

  const departmentData = [
    { id: "dep_001", schoolId: "sch_001", departmentName: "Transfiguration" },
    { id: "dep_002", schoolId: "sch_001", departmentName: "Potions" },
    { id: "dep_003", schoolId: "sch_001", departmentName: "Creatures" }
  ]

  const subjectData = [
    { id: "sub_001", schoolId: "sch_001", departmentId: "dep_001", subjectName: "Transfiguration" },
    { id: "sub_002", schoolId: "sch_001", departmentId: "dep_002", subjectName: "Potions" },
    { id: "sub_003", schoolId: "sch_001", departmentId: "dep_003", subjectName: "Creatures" }
  ]

  const classroomData = [
    { id: "cls_001", schoolId: "sch_001", roomName: "Great Hall", capacity: 400, type: "Hall" },
    { id: "cls_002", schoolId: "sch_001", roomName: "Dungeon", capacity: 30, type: "Lab" },
    { id: "cls_003", schoolId: "sch_001", roomName: "Room 101", capacity: 35, type: "Class" }
  ]

  const assignmentData = [
    { id: "asg_001", schoolId: "sch_001", title: "Essay", type: "ESSAY", status: "PUBLISHED", totalPoints: 100, dueDate: "2024-02-15" },
    { id: "asg_002", schoolId: "sch_001", title: "Quiz", type: "QUIZ", status: "COMPLETED", totalPoints: 50, dueDate: "2024-02-10" },
    { id: "asg_003", schoolId: "sch_001", title: "Project", type: "PROJECT", status: "IN_PROGRESS", totalPoints: 150, dueDate: "2024-02-20" }
  ]

  const attendanceData = [
    { id: "att_001", schoolId: "sch_001", studentId: "std_001", date: "2024-02-08", status: "PRESENT", notes: null },
    { id: "att_002", schoolId: "sch_001", studentId: "std_002", date: "2024-02-08", status: "PRESENT", notes: null },
    { id: "att_003", schoolId: "sch_001", studentId: "std_003", date: "2024-02-08", status: "LATE", notes: "Late" }
  ]

  const userData = [
    { id: "usr_001", email: "harry@hog.edu", role: "STUDENT", schoolId: "sch_001", emailVerified: true },
    { id: "usr_002", email: "mcg@hog.edu", role: "TEACHER", schoolId: "sch_001", emailVerified: true },
    { id: "usr_003", email: "admin@dev.com", role: "DEVELOPER", schoolId: null, emailVerified: true }
  ]

  const TableSection = ({ title, description, data, columns }: { 
    title: string
    description: string
    data: TableRow[]
    columns: { key: string; label: string; width?: string }[]
  }) => (
    <div className="border rounded-lg overflow-hidden mb-6">
      <div className="bg-muted px-4 py-3 border-b">
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th key={col.key} className={`text-left px-3 py-2 font-medium text-sm ${col.width || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={row.id || index} 
                className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-sm">
                    {col.key === 'schoolId' && row[col.key] === null ? (
                      <span className="text-muted-foreground italic">null (all schools)</span>
                    ) : col.key.includes('Date') ? (
                      <code className="text-xs">{row[col.key]}</code>
                    ) : col.key === 'emailVerified' || col.key === 'isActive' ? (
                      <span className={`px-2 py-1 rounded text-xs ${
                        row[col.key] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row[col.key] ? 'Yes' : 'No'}
                      </span>
                    ) : col.key === 'status' ? (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {row[col.key]}
                      </span>
                    ) : col.key === 'role' ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row[col.key] === 'DEVELOPER' ? 'bg-purple-100 text-purple-800' :
                        row[col.key] === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        row[col.key] === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                        row[col.key] === 'STUDENT' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row[col.key]}
                      </span>
                    ) : (
                      <span className={col.key === 'id' || col.key.endsWith('Id') ? 'font-mono text-xs text-muted-foreground' : ''}>
                        {row[col.key]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="space-y-6">
       

        <TableSection
          title="School (Tenant Entity)"
          description="Main tenant entities representing different schools in the multi-tenant system"
          data={schoolData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'name', label: 'School Name', width: 'w-48' },
            { key: 'domain', label: 'Domain' },
            { key: 'planType', label: 'Plan' },
            { key: 'maxStudents', label: 'Max Students' },
            { key: 'isActive', label: 'Active' }
          ]}
        />

        <TableSection
          title="Teacher"
          description="Teaching staff with school-specific isolation and department assignments"
          data={teacherData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'givenName', label: 'First Name' },
            { key: 'surname', label: 'Last Name' },
            { key: 'emailAddress', label: 'Email', width: 'w-48' },
            { key: 'gender', label: 'Gender' }
          ]}
        />

        <TableSection
          title="Student"
          description="Student enrollment records with guardian relationships and year-level tracking"
          data={studentData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'givenName', label: 'First Name' },
            { key: 'middleName', label: 'Middle Name' },
            { key: 'surname', label: 'Last Name' },
            { key: 'dateOfBirth', label: 'Date of Birth' },
            { key: 'gender', label: 'Gender' }
          ]}
        />

        <TableSection
          title="Department"
          description="Academic departments organizing subjects and teacher assignments"
          data={departmentData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'departmentName', label: 'Department Name', width: 'w-48' }
          ]}
        />

        <TableSection
          title="Subject"
          description="Academic subjects within departments that form the basis of classes"
          data={subjectData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'departmentId', label: 'Department ID' },
            { key: 'subjectName', label: 'Subject Name', width: 'w-48' }
          ]}
        />

        <TableSection
          title="Classroom"
          description="Physical classroom locations with capacity and type information"
          data={classroomData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'roomName', label: 'Room Name', width: 'w-32' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'type', label: 'Type', width: 'w-32' }
          ]}
        />

        <TableSection
          title="Assignment"
          description="Assessment tasks including homework, quizzes, tests, and projects"
          data={assignmentData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'title', label: 'Title', width: 'w-40' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'totalPoints', label: 'Points' },
            { key: 'dueDate', label: 'Due Date' }
          ]}
        />

        <TableSection
          title="Attendance"
          description="Daily attendance tracking per student per class with detailed status information"
          data={attendanceData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'studentId', label: 'Student ID' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'notes', label: 'Notes', width: 'w-40' }
          ]}
        />

        <TableSection
          title="User (Authentication)"
          description="Multi-tenant user accounts with role-based access control and school isolation"
          data={userData}
          columns={[
            { key: 'id', label: 'ID', width: 'w-20' },
            { key: 'email', label: 'Email', width: 'w-48' },
            { key: 'role', label: 'Role' },
            { key: 'schoolId', label: 'School ID' },
            { key: 'emailVerified', label: 'Verified' }
          ]}
        />
      </div>
    </div>
  )
}
