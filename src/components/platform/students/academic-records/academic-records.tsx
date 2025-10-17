"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Award,
  TrendingUp,
  Download,
  Printer,
  Trophy,
  Medal,
  Target,
  BarChart,
  Calendar,
  Clock,
  CheckCircle
} from "lucide-react";
import type { Student, Achievement } from "../registration/types";
import { format } from "date-fns";
import { toast } from "sonner";

interface AcademicRecord {
  id: string;
  studentId: string;
  academicYearId: string;
  termId: string;
  subjects: SubjectGrade[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  attendance: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks?: string;
  assignments: AssignmentGrade[];
  exams: ExamGrade[];
}

interface AssignmentGrade {
  id: string;
  name: string;
  maxMarks: number;
  obtainedMarks: number;
  submittedDate: Date;
  grade: string;
}

interface ExamGrade {
  id: string;
  examType: "MIDTERM" | "FINAL" | "QUIZ" | "PRACTICAL";
  maxMarks: number;
  obtainedMarks: number;
  examDate: Date;
  grade: string;
}

interface Transcript {
  student: Student;
  academicRecords: AcademicRecord[];
  cumulativeGPA: number;
  totalCredits: number;
  achievements: Achievement[];
  generatedDate: Date;
}

interface AcademicRecordsProps {
  student: Student;
  academicRecords: AcademicRecord[];
  achievements: Achievement[];
  onGenerateTranscript?: () => void;
  onDownloadReport?: (format: "pdf" | "excel") => void;
}

export function AcademicRecords({
  student,
  academicRecords,
  achievements,
  onGenerateTranscript,
  onDownloadReport,
}: AcademicRecordsProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");

  // Filter records based on selection
  const filteredRecords = academicRecords.filter(record => {
    const matchesYear = selectedYear === "all" || record.academicYearId === selectedYear;
    const matchesTerm = selectedTerm === "all" || record.termId === selectedTerm;
    return matchesYear && matchesTerm;
  });

  // Calculate statistics
  const stats = {
    averagePercentage: filteredRecords.reduce((sum, r) => sum + r.percentage, 0) / filteredRecords.length || 0,
    highestPercentage: Math.max(...filteredRecords.map(r => r.percentage)) || 0,
    lowestPercentage: Math.min(...filteredRecords.map(r => r.percentage)) || 0,
    averageAttendance: filteredRecords.reduce((sum, r) => sum + r.attendance, 0) / filteredRecords.length || 0,
    totalAchievements: achievements.length,
    recentAchievements: achievements.filter(a => {
      const achievementDate = new Date(a.dateAchieved);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return achievementDate > sixMonthsAgo;
    }).length,
  };

  const getGradeColor = (grade: string) => {
    switch (grade[0]) {
      case "A": return "text-green-600";
      case "B": return "text-blue-600";
      case "C": return "text-yellow-600";
      case "D": return "text-orange-600";
      case "F": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className={`text-2xl font-bold ${getPercentageColor(stats.averagePercentage)}`}>
                  {stats.averagePercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.highestPercentage}%</p>
                <p className="text-sm text-muted-foreground">Best Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.averageAttendance.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAchievements}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="grades">
            <BarChart className="h-4 w-4 mr-2" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <FileText className="h-4 w-4 mr-2" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="transcript">
            <FileText className="h-4 w-4 mr-2" />
            Transcript
          </TabsTrigger>
        </TabsList>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Academic Performance</CardTitle>
                  <CardDescription>
                    Term-wise grades and performance metrics
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024-25">2024-25</SelectItem>
                      <SelectItem value="2023-24">2023-24</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      <SelectItem value="term1">Term 1</SelectItem>
                      <SelectItem value="term2">Term 2</SelectItem>
                      <SelectItem value="term3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Obtained</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.academicYearId}</TableCell>
                      <TableCell>{record.termId}</TableCell>
                      <TableCell>{record.totalMarks}</TableCell>
                      <TableCell>{record.obtainedMarks}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getPercentageColor(record.percentage)}`}>
                          {record.percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(record.grade)}>
                          {record.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.rank ? (
                          <Badge variant="outline">#{record.rank}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{record.attendance}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Visual representation of academic progress over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {record.academicYearId} - {record.termId}
                      </span>
                      <span className={getPercentageColor(record.percentage)}>
                        {record.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={record.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <CardTitle>{record.academicYearId} - {record.termId}</CardTitle>
                <CardDescription>
                  Subject-wise performance breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Max Marks</TableHead>
                      <TableHead>Obtained</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {record.subjects.map((subject) => {
                      const percentage = (subject.obtainedMarks / subject.maxMarks) * 100;
                      return (
                        <TableRow key={subject.subjectId}>
                          <TableCell className="font-medium">{subject.subjectName}</TableCell>
                          <TableCell>{subject.subjectCode}</TableCell>
                          <TableCell>{subject.maxMarks}</TableCell>
                          <TableCell>{subject.obtainedMarks}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${getPercentageColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(subject.grade)}>
                              {subject.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {subject.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Subject Performance Summary */}
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Performance</p>
                      <p className="text-2xl font-bold">{record.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Score</p>
                      <p className="text-xl font-medium">
                        {record.obtainedMarks}/{record.totalMarks}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Achievements & Awards</CardTitle>
                  <CardDescription>
                    Academic and extracurricular achievements
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {achievements.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 bg-yellow-100 rounded-full">
                        {achievement.category === "ACADEMIC" ? (
                          <Medal className="h-6 w-6 text-yellow-600" />
                        ) : achievement.category === "SPORTS" ? (
                          <Trophy className="h-6 w-6 text-yellow-600" />
                        ) : (
                          <Award className="h-6 w-6 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="outline">
                                {achievement.category}
                              </Badge>
                              {achievement.level && (
                                <Badge variant="outline">
                                  {achievement.level} Level
                                </Badge>
                              )}
                              {achievement.rank && (
                                <Badge variant="secondary">
                                  Rank #{achievement.rank}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(achievement.dateAchieved), "MMM dd, yyyy")}
                            </p>
                            {achievement.issuedBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                by {achievement.issuedBy}
                              </p>
                            )}
                          </div>
                        </div>
                        {achievement.certificateUrl && (
                          <Button variant="link" size="sm" className="mt-2 p-0 h-auto">
                            View Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {achievements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No achievements recorded yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Achievement Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Medal className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="text-xl font-bold">
                      {achievements.filter(a => a.category === "ACADEMIC").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Academic</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-xl font-bold">
                      {achievements.filter(a => a.category === "SPORTS").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Sports</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-purple-500" />
                  <div>
                    <p className="text-xl font-bold">
                      {achievements.filter(a => a.category === "EXTRACURRICULAR").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Extra-curricular</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Official Transcript</CardTitle>
                  <CardDescription>
                    Complete academic record and transcript generation
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onDownloadReport?.("excel")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button variant="outline" onClick={() => onDownloadReport?.("pdf")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={onGenerateTranscript}>
                    <Printer className="h-4 w-4 mr-2" />
                    Generate Transcript
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Transcript Preview */}
              <div className="border rounded-lg p-6 space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h3 className="text-xl font-bold">Academic Transcript</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {student.givenName} {student.middleName} {student.surname}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.grNumber} | {student.email}
                  </p>
                </div>

                {/* Academic Summary */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Academic Summary</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Enrollment Date:</span>{" "}
                        {student.enrollmentDate && format(new Date(student.enrollmentDate), "MMM dd, yyyy")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Current Status:</span>{" "}
                        <Badge variant="outline">{student.status}</Badge>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Total Terms:</span>{" "}
                        {academicRecords.length}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Overall Average:</span>{" "}
                        <span className={`font-medium ${getPercentageColor(stats.averagePercentage)}`}>
                          {stats.averagePercentage.toFixed(2)}%
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Best Performance:</span>{" "}
                        {stats.highestPercentage}%
                      </p>
                      <p>
                        <span className="text-muted-foreground">Total Achievements:</span>{" "}
                        {achievements.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Records Table */}
                <div>
                  <h4 className="font-medium mb-3">Academic Records</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.academicYearId}</TableCell>
                          <TableCell>{record.termId}</TableCell>
                          <TableCell>
                            {record.obtainedMarks}/{record.totalMarks} ({record.percentage.toFixed(1)}%)
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(record.grade)}>
                              {record.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.attendance}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 text-center text-xs text-muted-foreground">
                  <p>Generated on {format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}</p>
                  <p className="mt-1">This is an official academic transcript</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}