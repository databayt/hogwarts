"use client";

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  givenName: string;
  surname: string;
  studentId?: string;
}

interface BulkGradeEntry {
  studentId: string;
  score: number | '';
  grade: string;
  feedback?: string;
}

interface BulkGradeEntryProps {
  classId: string;
  assignmentId?: string;
  examId?: string;
  maxScore: number;
  students: Student[];
  gradeScale?: Array<{ min: number; max: number; grade: string }>;
  onSave: (entries: BulkGradeEntry[]) => Promise<void>;
}

export function BulkGradeEntry({
  classId,
  assignmentId,
  examId,
  maxScore,
  students,
  gradeScale = [
    { min: 90, max: 100, grade: 'A' },
    { min: 80, max: 89, grade: 'B' },
    { min: 70, max: 79, grade: 'C' },
    { min: 60, max: 69, grade: 'D' },
    { min: 0, max: 59, grade: 'F' },
  ],
  onSave,
}: BulkGradeEntryProps) {
  const [entries, setEntries] = useState<Map<string, BulkGradeEntry>>(
    new Map(students.map(s => [s.id, { studentId: s.id, score: '', grade: '', feedback: '' }]))
  );
  const [saving, setSaving] = useState(false);
  const [autoCalculateGrades, setAutoCalculateGrades] = useState(true);

  // Calculate grade based on score
  const calculateGrade = useCallback((score: number): string => {
    const percentage = (score / maxScore) * 100;
    for (const scale of gradeScale) {
      if (percentage >= scale.min && percentage <= scale.max) {
        return scale.grade;
      }
    }
    return 'F';
  }, [maxScore, gradeScale]);

  // Update a single entry
  const updateEntry = useCallback((studentId: string, field: keyof BulkGradeEntry, value: any) => {
    setEntries(prev => {
      const newEntries = new Map(prev);
      const entry = newEntries.get(studentId) || { studentId, score: '', grade: '', feedback: '' };

      if (field === 'score' && autoCalculateGrades) {
        const scoreNum = parseFloat(value);
        if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= maxScore) {
          entry.score = scoreNum;
          entry.grade = calculateGrade(scoreNum);
        } else if (value === '') {
          entry.score = '';
          entry.grade = '';
        }
      } else {
        entry[field] = value;
      }

      newEntries.set(studentId, entry);
      return newEntries;
    });
  }, [autoCalculateGrades, calculateGrade, maxScore]);

  // Calculate statistics
  const stats = useMemo(() => {
    const scores = Array.from(entries.values())
      .map(e => typeof e.score === 'number' ? e.score : null)
      .filter(s => s !== null) as number[];

    if (scores.length === 0) return null;

    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / scores.length;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      count: scores.length,
      average: avg.toFixed(2),
      median: median.toFixed(2),
      highest: Math.max(...scores).toFixed(2),
      lowest: Math.min(...scores).toFixed(2),
    };
  }, [entries]);

  // Save all entries
  const handleSave = async () => {
    setSaving(true);
    try {
      const validEntries = Array.from(entries.values()).filter(e => typeof e.score === 'number');
      if (validEntries.length === 0) {
        toast.error('No grades to save');
        return;
      }
      await onSave(validEntries);
      toast.success(`Saved ${validEntries.length} grades`);
    } catch (error) {
      toast.error('Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', 'Score', 'Grade', 'Percentage', 'Feedback'];
    const rows = students.map(student => {
      const entry = entries.get(student.id);
      const score = entry?.score || '';
      const percentage = typeof score === 'number' ? ((score / maxScore) * 100).toFixed(2) : '';
      return [
        student.studentId || student.id,
        `${student.givenName} ${student.surname}`,
        score.toString(),
        entry?.grade || '',
        percentage,
        entry?.feedback || '',
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades_${classId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Import from CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      const scoreIndex = headers.findIndex(h => h.toLowerCase().includes('score'));
      const gradeIndex = headers.findIndex(h => h.toLowerCase().includes('grade'));
      const feedbackIndex = headers.findIndex(h => h.toLowerCase().includes('feedback'));

      if (scoreIndex === -1) {
        toast.error('CSV must contain a Score column');
        return;
      }

      const newEntries = new Map(entries);
      lines.slice(1).forEach((line, idx) => {
        if (!line.trim()) return;

        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const student = students[idx];
        if (!student) return;

        const score = parseFloat(values[scoreIndex]);
        if (!isNaN(score)) {
          newEntries.set(student.id, {
            studentId: student.id,
            score,
            grade: gradeIndex >= 0 ? values[gradeIndex] : calculateGrade(score),
            feedback: feedbackIndex >= 0 ? values[feedbackIndex] : '',
          });
        }
      });

      setEntries(newEntries);
      toast.success('Grades imported successfully');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Grade Entry</CardTitle>
          <CardDescription>
            Enter grades for all students in the class. Max score: {maxScore}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-grade"
                checked={autoCalculateGrades}
                onChange={(e) => setAutoCalculateGrades(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="auto-grade">Auto-calculate grades</Label>
            </div>

            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-csv"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="import-csv" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </label>
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[120px]">Score</TableHead>
                  <TableHead className="w-[100px]">Grade</TableHead>
                  <TableHead className="w-[100px]">%</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, idx) => {
                  const entry = entries.get(student.id);
                  const percentage = typeof entry?.score === 'number'
                    ? ((entry.score / maxScore) * 100).toFixed(1)
                    : '';

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.givenName} {student.surname}</div>
                          {student.studentId && (
                            <div className="text-xs text-muted-foreground">{student.studentId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={maxScore}
                          step="0.5"
                          value={entry?.score ?? ''}
                          onChange={(e) => updateEntry(student.id, 'score', e.target.value)}
                          className={cn(
                            "w-24",
                            typeof entry?.score === 'number' && entry.score > maxScore && "border-red-500"
                          )}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        {autoCalculateGrades ? (
                          <div className="font-medium">{entry?.grade || '-'}</div>
                        ) : (
                          <Select
                            value={entry?.grade || ''}
                            onValueChange={(value) => updateEntry(student.id, 'grade', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeScale.map(scale => (
                                <SelectItem key={scale.grade} value={scale.grade}>
                                  {scale.grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          parseFloat(percentage) >= 90 && "text-green-600",
                          parseFloat(percentage) >= 70 && parseFloat(percentage) < 90 && "text-blue-600",
                          parseFloat(percentage) >= 50 && parseFloat(percentage) < 70 && "text-yellow-600",
                          parseFloat(percentage) < 50 && parseFloat(percentage) > 0 && "text-red-600"
                        )}>
                          {percentage ? `${percentage}%` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={entry?.feedback || ''}
                          onChange={(e) => updateEntry(student.id, 'feedback', e.target.value)}
                          placeholder="Optional feedback..."
                          className="min-h-[38px] h-[38px] resize-none"
                          rows={1}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {stats && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Graded</div>
                    <div className="font-medium">{stats.count}/{students.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Average</div>
                    <div className="font-medium">{stats.average}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Median</div>
                    <div className="font-medium">{stats.median}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Highest</div>
                    <div className="font-medium text-green-600">{stats.highest}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Lowest</div>
                    <div className="font-medium text-red-600">{stats.lowest}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Grades'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}