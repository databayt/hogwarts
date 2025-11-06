"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getExamWithStudents, enterMarks } from "./actions";

interface Props {
  examId: string;
}

interface Student {
  id: string;
  studentId: string | null;
  name: string;
  marksObtained: number | null;
  isAbsent: boolean;
  resultId: string | null;
}

interface ExamInfo {
  id: string;
  title: string;
  totalMarks: number;
  passingMarks: number;
  className: string;
}

const marksEntrySchema = z.object({
  marks: z.array(
    z.object({
      studentId: z.string(),
      marksObtained: z.number().min(0).nullable(),
      isAbsent: z.boolean(),
    })
  ),
});

export function MarksEntryForm({ examId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(marksEntrySchema),
    defaultValues: {
      marks: [],
    },
  });

  const marksValues = watch("marks");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getExamWithStudents({ examId });
        if (data.exam) {
          setExam(data.exam);
          setStudents(data.students);
          setValue(
            "marks",
            data.students.map((s: Student) => ({
              studentId: s.id,
              marksObtained: s.marksObtained,
              isAbsent: s.isAbsent,
            }))
          );
        }
      } catch (error) {
        toast.error("Failed to load exam data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [examId, setValue]);

  const onSubmit = async (data: z.infer<typeof marksEntrySchema>) => {
    try {
      setSaving(true);
      const result = await enterMarks({
        examId,
        marks: data.marks,
      });
      if (result.success && result.data) {
        toast.success(`Saved marks for ${result.data.count} students`);
      }
    } catch (error) {
      toast.error("Failed to save marks");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleMarksChange = (index: number, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    if (numValue !== null && exam && numValue > exam.totalMarks) {
      toast.error(`Marks cannot exceed ${exam.totalMarks}`);
      return;
    }
    setValue(`marks.${index}.marksObtained`, numValue);
  };

  const handleAbsentChange = (index: number, checked: boolean) => {
    setValue(`marks.${index}.isAbsent`, checked);
    if (checked) {
      setValue(`marks.${index}.marksObtained`, null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!exam) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Exam not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exam.title}</CardTitle>
        <CardDescription>
          {exam.className} • Total Marks: {exam.totalMarks} • Passing Marks: {exam.passingMarks}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[150px]">Marks Obtained</TableHead>
                  <TableHead className="w-[100px]">Absent</TableHead>
                  <TableHead className="w-[100px]">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No students enrolled in this class
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student, index) => {
                    const marks = marksValues[index];
                    const percentage =
                      marks?.marksObtained !== null && !marks?.isAbsent
                        ? ((marks.marksObtained / exam.totalMarks) * 100).toFixed(2)
                        : "-";
                    const isPassing =
                      marks?.marksObtained !== null &&
                      !marks?.isAbsent &&
                      marks.marksObtained >= exam.passingMarks;

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.studentId || "-"}
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={exam.totalMarks}
                            step="0.5"
                            disabled={marks?.isAbsent}
                            value={marks?.marksObtained ?? ""}
                            onChange={(e) => handleMarksChange(index, e.target.value)}
                            className="w-full"
                            placeholder="Enter marks"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={marks?.isAbsent}
                            onCheckedChange={(checked) =>
                              handleAbsentChange(index, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <span className={isPassing ? "text-green-600 font-medium" : ""}>
                            {percentage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {errors.marks && (
            <p className="text-sm text-destructive">{errors.marks.message}</p>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={saving || students.length === 0}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Marks"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
