import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Trophy, TrendingUp, Calendar, GraduationCap } from "lucide-react";
import type { Student } from "../../registration/types";
import { format } from "date-fns";

interface AcademicTabProps {
  student: Student;
}

// Helper to calculate grade from score
const getGradeFromScore = (score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 95) return "A+";
  if (percentage >= 90) return "A";
  if (percentage >= 85) return "A-";
  if (percentage >= 80) return "B+";
  if (percentage >= 75) return "B";
  if (percentage >= 70) return "B-";
  if (percentage >= 65) return "C+";
  if (percentage >= 60) return "C";
  if (percentage >= 55) return "C-";
  if (percentage >= 50) return "D";
  return "F";
};

// Calculate GPA from exam results
const calculateGPA = (examResults: any[]): number => {
  if (!examResults || examResults.length === 0) return 0;
  const gradePoints: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D": 1.0, "F": 0
  };
  let totalPoints = 0;
  let count = 0;
  examResults.forEach(result => {
    const grade = getGradeFromScore(result.score || 0, result.maxScore || 100);
    if (gradePoints[grade] !== undefined) {
      totalPoints += gradePoints[grade];
      count++;
    }
  });
  return count > 0 ? totalPoints / count : 0;
};

export function AcademicTab({ student }: AcademicTabProps) {
  // Use real data from student object
  const studentClasses = student.studentClasses || [];
  const examResults = student.examResults || [];
  const submissions = student.submissions || [];
  const yearLevels = student.studentYearLevels || [];

  // Get current class info
  const currentClass = studentClasses.length > 0 ? {
    name: studentClasses[0]?.class?.name || "Not Assigned",
    teacher: studentClasses[0]?.class?.teacher
      ? `${studentClasses[0].class.teacher.givenName} ${studentClasses[0].class.teacher.surname}`
      : "Not Assigned",
    subjects: studentClasses.map((sc: any) => ({
      name: sc.class?.subject?.name || sc.class?.name || "Unknown",
      teacher: sc.class?.teacher
        ? `${sc.class.teacher.givenName} ${sc.class.teacher.surname}`
        : "Not Assigned",
      // Calculate grade from exam results for this subject
      grade: examResults.find((er: any) => er.subjectId === sc.class?.subject?.id)
        ? getGradeFromScore(
            examResults.find((er: any) => er.subjectId === sc.class?.subject?.id)?.score || 0,
            examResults.find((er: any) => er.subjectId === sc.class?.subject?.id)?.maxScore || 100
          )
        : "-",
      score: examResults.find((er: any) => er.subjectId === sc.class?.subject?.id)?.score
        ? Math.round((examResults.find((er: any) => er.subjectId === sc.class?.subject?.id).score /
            examResults.find((er: any) => er.subjectId === sc.class?.subject?.id).maxScore) * 100)
        : 0
    }))
  } : null;

  // Calculate GPA
  const gpa = calculateGPA(examResults);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600";
    if (grade.startsWith("B")) return "text-blue-600";
    if (grade.startsWith("C")) return "text-yellow-600";
    if (grade === "-") return "text-muted-foreground";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted":
      case "graded": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_progress":
      case "draft": return "bg-blue-100 text-blue-800";
      case "late": return "bg-red-100 text-red-800";
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
          {currentClass ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Class</p>
                  <p className="font-medium">{currentClass.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class Teacher</p>
                  <p className="font-medium">{currentClass.teacher}</p>
                </div>
              </div>

              {/* GPA Overview */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current GPA</span>
                  <span className={`text-2xl font-bold ${gpa >= 3.0 ? 'text-green-600' : gpa >= 2.0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {gpa.toFixed(1)}/4.0
                  </span>
                </div>
                <Progress value={(gpa / 4) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {examResults.length} exam{examResults.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mb-4" />
              <p>No class enrollment yet</p>
            </div>
          )}
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
          {currentClass && currentClass.subjects.length > 0 ? (
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
                    <TableCell className="text-right">{subject.score > 0 ? `${subject.score}%` : '-'}</TableCell>
                    <TableCell>
                      <Progress value={subject.score} className="h-2 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4" />
              <p>No subjects enrolled yet</p>
            </div>
          )}
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
          {examResults.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examResults.map((result: any, index: number) => {
                  const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
                  const grade = getGradeFromScore(result.score || 0, result.maxScore || 100);
                  return (
                    <TableRow key={result.id || index}>
                      <TableCell className="font-medium">{result.exam?.name || 'Exam'}</TableCell>
                      <TableCell>{result.subject?.name || '-'}</TableCell>
                      <TableCell>
                        {result.createdAt ? format(new Date(result.createdAt), "dd MMM yyyy") : '-'}
                      </TableCell>
                      <TableCell>
                        {result.score}/{result.maxScore} ({percentage}%)
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getGradeColor(grade)}>
                          {grade}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mb-4" />
              <p>No exam results yet</p>
            </div>
          )}
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
          {submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission: any, index: number) => (
                  <TableRow key={submission.id || index}>
                    <TableCell className="font-medium">
                      {submission.assignment?.title || 'Assignment'}
                    </TableCell>
                    <TableCell>
                      {submission.assignment?.dueDate
                        ? format(new Date(submission.assignment.dueDate), "dd MMM yyyy")
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {submission.submittedAt
                        ? format(new Date(submission.submittedAt), "dd MMM yyyy")
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(submission.status)}>
                        {submission.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {submission.score !== null && submission.score !== undefined
                        ? `${submission.score}/${submission.assignment?.maxScore || 100}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4" />
              <p>No assignments yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic History */}
      <Card>
        <CardHeader>
          <CardTitle>Academic History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {yearLevels.length > 0 ? (
              yearLevels.map((yearLevel: any, index: number) => (
                <div key={yearLevel.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {yearLevel.schoolYear?.name || 'Academic Year'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {yearLevel.yearLevel?.name || 'Grade'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${yearLevel.score && Number(yearLevel.score) >= 50 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {yearLevel.score && Number(yearLevel.score) >= 50 ? 'Passed' : 'In Progress'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score: {yearLevel.score?.toString() || "N/A"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mb-4" />
                <p>No academic history available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}