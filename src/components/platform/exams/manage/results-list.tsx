import { getExamResults } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  examId: string;
}

export async function ExamResultsList({ examId }: Props) {
  const { results } = await getExamResults({ examId });

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
          <CardDescription>Student performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            No results available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Results</CardTitle>
        <CardDescription>
          Showing {results.length} student{results.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead className="w-[120px]">Student ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-[120px]">Marks</TableHead>
                <TableHead className="w-[120px]">Percentage</TableHead>
                <TableHead className="w-[100px]">Grade</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>{result.studentId || "-"}</TableCell>
                  <TableCell>{result.studentName}</TableCell>
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
      </CardContent>
    </Card>
  );
}
