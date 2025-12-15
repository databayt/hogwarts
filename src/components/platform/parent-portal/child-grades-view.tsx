import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getChildGrades } from "./actions"

interface Props {
  studentId: string
}

export async function ChildGradesView({ studentId }: Props) {
  const { grades } = await getChildGrades({ studentId })

  const { examResults, classScores } = grades

  return (
    <div className="space-y-6">
      <Tabs defaultValue="exams" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exams">Exam Results</TabsTrigger>
          <TabsTrigger value="classes">Class Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
              <CardDescription>
                {examResults.length > 0
                  ? `Showing ${examResults.length} exam result${examResults.length !== 1 ? "s" : ""}`
                  : "No exam results available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {examResults.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No exam results recorded yet
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[120px]">Marks</TableHead>
                        <TableHead className="w-[120px]">Percentage</TableHead>
                        <TableHead className="w-[100px]">Grade</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            {result.examTitle}
                          </TableCell>
                          <TableCell>{result.subjectName}</TableCell>
                          <TableCell>
                            {new Date(result.examDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.examType}</Badge>
                          </TableCell>
                          <TableCell>
                            {result.isAbsent ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <span className="font-medium">
                                {result.marksObtained}/{result.totalMarks}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.isAbsent ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <span className="font-medium">
                                {result.percentage.toFixed(2)}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.grade ? (
                              <Badge variant="outline">{result.grade}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.isAbsent ? (
                              <Badge variant="destructive">Absent</Badge>
                            ) : result.percentage >= 50 ? (
                              <Badge variant="default" className="bg-green-600">
                                Pass
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Fail</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Scores</CardTitle>
              <CardDescription>
                {classScores.length > 0
                  ? `Showing ${classScores.length} class${classScores.length !== 1 ? "es" : ""}`
                  : "No class scores available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classScores.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No class scores recorded yet
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="w-[150px]">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classScores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell className="font-medium">
                            {score.className}
                          </TableCell>
                          <TableCell>{score.subjectName}</TableCell>
                          <TableCell>
                            {score.score !== null ? (
                              <span className="font-medium">{score.score}</span>
                            ) : (
                              <span className="text-muted-foreground">
                                Not graded
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
