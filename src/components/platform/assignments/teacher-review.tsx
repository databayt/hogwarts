"use client";

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Download, Eye, MessageSquare, Check, X, Clock, AlertCircle, ChevronLeft, ChevronRight, FileText, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  totalPoints: number;
  dueDate: Date | string;
  class: {
    name: string;
    subject: {
      subjectName: string;
    };
  };
}

interface Student {
  id: string;
  givenName: string;
  surname: string;
  studentId?: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'NOT_SUBMITTED' | 'DRAFT' | 'SUBMITTED' | 'LATE_SUBMITTED' | 'GRADED' | 'RETURNED';
  submittedAt?: Date | string;
  content?: string;
  attachments?: string[];
  score?: number;
  feedback?: string;
  gradedAt?: Date | string;
  student: Student;
}

interface TeacherReviewProps {
  assignment: Assignment;
  submissions: Submission[];
  onGradeSubmission: (submissionId: string, score: number, feedback: string) => Promise<void>;
  onReturnSubmission: (submissionId: string) => Promise<void>;
  onBatchGrade: (grades: Array<{ submissionId: string; score: number; feedback: string }>) => Promise<void>;
}

const statusColors = {
  NOT_SUBMITTED: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  LATE_SUBMITTED: 'bg-orange-100 text-orange-800',
  GRADED: 'bg-green-100 text-green-800',
  RETURNED: 'bg-purple-100 text-purple-800',
};

export function TeacherReview({
  assignment,
  submissions,
  onGradeSubmission,
  onReturnSubmission,
  onBatchGrade,
}: TeacherReviewProps) {
  const [selectedTab, setSelectedTab] = useState<'submitted' | 'graded' | 'missing'>('submitted');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [currentScore, setCurrentScore] = useState<string>('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState('');

  // Categorize submissions
  const categorizedSubmissions = useMemo(() => {
    const submitted = submissions.filter(s =>
      s.status === 'SUBMITTED' || s.status === 'LATE_SUBMITTED'
    );
    const graded = submissions.filter(s =>
      s.status === 'GRADED' || s.status === 'RETURNED'
    );
    const missing = submissions.filter(s =>
      s.status === 'NOT_SUBMITTED' || s.status === 'DRAFT'
    );

    return { submitted, graded, missing };
  }, [submissions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const submitted = categorizedSubmissions.submitted.length + categorizedSubmissions.graded.length;
    const graded = categorizedSubmissions.graded.length;
    const late = submissions.filter(s => s.status === 'LATE_SUBMITTED').length;

    const scores = submissions
      .filter(s => s.score !== undefined && s.score !== null)
      .map(s => s.score!);

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      total,
      submitted,
      graded,
      missing: total - submitted,
      late,
      submissionRate: (submitted / total) * 100,
      averageScore: averageScore.toFixed(1),
      highestScore: highestScore.toFixed(1),
      lowestScore: lowestScore.toFixed(1),
    };
  }, [submissions, categorizedSubmissions]);

  // Filter submissions based on search
  const getFilteredSubmissions = useCallback((submissions: Submission[]) => {
    return submissions.filter(s => {
      const studentName = `${s.student.givenName} ${s.student.surname}`.toLowerCase();
      const matchesSearch = searchStudent === '' ||
        studentName.includes(searchStudent.toLowerCase()) ||
        s.student.studentId?.toLowerCase().includes(searchStudent.toLowerCase());
      return matchesSearch;
    });
  }, [searchStudent]);

  const handleOpenGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setCurrentScore(submission.score?.toString() || '');
    setCurrentFeedback(submission.feedback || '');
    setGradeDialogOpen(true);
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    const score = parseFloat(currentScore);
    if (isNaN(score) || score < 0 || score > assignment.totalPoints) {
      toast.error(`Score must be between 0 and ${assignment.totalPoints}`);
      return;
    }

    try {
      await onGradeSubmission(selectedSubmission.id, score, currentFeedback);
      toast.success('Submission graded successfully');
      setGradeDialogOpen(false);
      setSelectedSubmission(null);
      setCurrentScore('');
      setCurrentFeedback('');
    } catch (error) {
      toast.error('Failed to grade submission');
    }
  };

  const handleQuickGrade = async (submission: Submission, percentage: number) => {
    const score = (assignment.totalPoints * percentage) / 100;
    try {
      await onGradeSubmission(submission.id, score, '');
      toast.success(`Quick graded: ${percentage}%`);
    } catch (error) {
      toast.error('Failed to apply quick grade');
    }
  };

  const SubmissionRow = ({ submission }: { submission: Submission }) => {
    const isLate = submission.status === 'LATE_SUBMITTED';
    const percentage = submission.score !== undefined
      ? ((submission.score / assignment.totalPoints) * 100).toFixed(1)
      : null;

    return (
      <TableRow>
        <TableCell>
          <div>
            <p className="font-medium">{submission.student.givenName} {submission.student.surname}</p>
            {submission.student.studentId && (
              <p className="text-xs text-muted-foreground">{submission.student.studentId}</p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={statusColors[submission.status]}>
            {submission.status.replace('_', ' ')}
          </Badge>
          {isLate && (
            <Badge variant="outline" className="ml-2 text-orange-600">
              Late
            </Badge>
          )}
        </TableCell>
        <TableCell>
          {submission.submittedAt ? (
            <div className="text-sm">
              <p>{format(new Date(submission.submittedAt), 'MMM dd, yyyy')}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(submission.submittedAt), 'h:mm a')}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          {submission.score !== undefined ? (
            <div>
              <p className="font-medium">
                {submission.score}/{assignment.totalPoints}
              </p>
              <p className={cn(
                "text-xs",
                parseFloat(percentage!) >= 90 && "text-green-600",
                parseFloat(percentage!) >= 70 && parseFloat(percentage!) < 90 && "text-blue-600",
                parseFloat(percentage!) >= 50 && parseFloat(percentage!) < 70 && "text-yellow-600",
                parseFloat(percentage!) < 50 && "text-red-600"
              )}>
                {percentage}%
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Not graded</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {submission.attachments && submission.attachments.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {submission.attachments.length} files
              </Badge>
            )}
            {submission.feedback && (
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {submission.status === 'SUBMITTED' || submission.status === 'LATE_SUBMITTED' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenGradeDialog(submission)}
                >
                  Grade
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickGrade(submission, 100)}
                    title="Quick grade: 100%"
                  >
                    A
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickGrade(submission, 85)}
                    title="Quick grade: 85%"
                  >
                    B
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickGrade(submission, 70)}
                    title="Quick grade: 70%"
                  >
                    C
                  </Button>
                </div>
              </>
            ) : submission.status === 'GRADED' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenGradeDialog(submission)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReturnSubmission(submission.id)}
                >
                  Return
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" disabled>
                No submission
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>
                {assignment.class.subject.subjectName} • {assignment.class.name}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              {assignment.totalPoints} points
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
              <Progress value={stats.submissionRate} className="mt-1 h-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Graded</p>
              <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missing</p>
              <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{stats.averageScore}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search student name or ID..."
          value={searchStudent}
          onChange={(e) => setSearchStudent(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Submissions Table */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="submitted">
            To Grade ({categorizedSubmissions.submitted.length})
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded ({categorizedSubmissions.graded.length})
          </TabsTrigger>
          <TabsTrigger value="missing">
            Missing ({categorizedSubmissions.missing.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submitted">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredSubmissions(categorizedSubmissions.submitted).map(submission => (
                  <SubmissionRow key={submission.id} submission={submission} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="graded">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredSubmissions(categorizedSubmissions.graded).map(submission => (
                  <SubmissionRow key={submission.id} submission={submission} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="missing">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredSubmissions(categorizedSubmissions.missing).map(submission => (
                  <SubmissionRow key={submission.id} submission={submission} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <span>
                  {selectedSubmission.student.givenName} {selectedSubmission.student.surname}
                  {selectedSubmission.status === 'LATE_SUBMITTED' && (
                    <Badge variant="outline" className="ml-2 text-orange-600">Late</Badge>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Submission Content */}
              {selectedSubmission.content && (
                <div>
                  <Label>Student Response</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-muted/30 max-h-64 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div>
                  <Label>Attachments</Label>
                  <div className="mt-2 space-y-2">
                    {selectedSubmission.attachments.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Attachment {idx + 1}</span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Grading Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="score">Score</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max={assignment.totalPoints}
                      step="0.5"
                      value={currentScore}
                      onChange={(e) => setCurrentScore(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">/ {assignment.totalPoints}</span>
                  </div>
                </div>
                <div>
                  <Label>Percentage</Label>
                  <p className="text-2xl font-bold mt-2">
                    {currentScore && !isNaN(parseFloat(currentScore))
                      ? ((parseFloat(currentScore) / assignment.totalPoints) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={currentFeedback}
                  onChange={(e) => setCurrentFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission}>
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}