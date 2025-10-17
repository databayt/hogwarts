import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Trophy, TrendingUp, Calendar } from "lucide-react";
import type { Student } from "../../registration/types";
import { format } from "date-fns";

interface AcademicTabProps {
  student: Student;
}

export function AcademicTab({ student }: AcademicTabProps) {
  // Mock data - in real implementation, fetch from database
  const currentClass = {
    name: "Grade 10 - Section A",
    teacher: "Mrs. Sarah Johnson",
    roomNumber: "201",
    subjects: [
      { name: "Mathematics", teacher: "Mr. John Smith", grade: "A", score: 92 },
      { name: "Science", teacher: "Dr. Emily Brown", grade: "A+", score: 95 },
      { name: "English", teacher: "Mrs. Sarah Johnson", grade: "B+", score: 87 },
      { name: "History", teacher: "Mr. David Lee", grade: "A-", score: 90 },
      { name: "Physical Education", teacher: "Mr. Mike Wilson", grade: "A", score: 93 },
    ],
  };

  const examResults = [
    { exam: "Mid-Term Exam", date: "2024-10-15", totalMarks: 500, obtained: 445, percentage: 89, grade: "A" },
    { exam: "Unit Test 1", date: "2024-09-10", totalMarks: 100, obtained: 92, percentage: 92, grade: "A+" },
    { exam: "Unit Test 2", date: "2024-11-05", totalMarks: 100, obtained: 88, percentage: 88, grade: "B+" },
  ];

  const assignments = [
    { title: "Math Project", subject: "Mathematics", dueDate: "2024-12-20", status: "Submitted", score: "45/50" },
    { title: "Science Lab Report", subject: "Science", dueDate: "2024-12-18", status: "Pending", score: "-" },
    { title: "History Essay", subject: "History", dueDate: "2024-12-25", status: "In Progress", score: "-" },
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600";
    if (grade.startsWith("B")) return "text-blue-600";
    if (grade.startsWith("C")) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid gap-6">
      {/* Current Class Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Current Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Class</p>
              <p className="font-medium">{currentClass.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class Teacher</p>
              <p className="font-medium">{currentClass.teacher}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Room Number</p>
              <p className="font-medium">{currentClass.roomNumber}</p>
            </div>
          </div>

          {/* GPA Overview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current GPA</span>
              <span className="text-2xl font-bold text-green-600">3.8/4.0</span>
            </div>
            <Progress value={95} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Top 5% of class</p>
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subject Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Current Grade</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentClass.subjects.map((subject, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>{subject.teacher}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                      {subject.grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{subject.score}%</TableCell>
                  <TableCell>
                    <Progress value={subject.score} className="h-2 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Recent Exam Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examResults.map((exam, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{exam.exam}</TableCell>
                  <TableCell>{format(new Date(exam.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{exam.obtained}/{exam.totalMarks}</TableCell>
                  <TableCell>{exam.percentage}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getGradeColor(exam.grade)}>
                      {exam.grade}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{assignment.subject}</TableCell>
                  <TableCell>{format(new Date(assignment.dueDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{assignment.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Academic History */}
      <Card>
        <CardHeader>
          <CardTitle>Academic History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {student.studentYearLevels?.map((yearLevel, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Academic Year 2023-2024</p>
                  <p className="text-sm text-muted-foreground">Grade 9</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">Passed</p>
                  <p className="text-sm text-muted-foreground">Score: {yearLevel.score?.toString() || "N/A"}</p>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground">No academic history available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}