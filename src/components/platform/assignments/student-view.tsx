"use client";

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import { Clock, Calendar, FileText, Upload, Check, X, AlertCircle, ChevronRight } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  totalPoints: number;
  weight: number;
  dueDate: Date | string;
  publishDate?: Date | string;
  instructions?: string;
  class: {
    name: string;
    subject: {
      subjectName: string;
    };
  };
}

interface Submission {
  id: string;
  assignmentId: string;
  status: 'NOT_SUBMITTED' | 'DRAFT' | 'SUBMITTED' | 'LATE_SUBMITTED' | 'GRADED' | 'RETURNED';
  submittedAt?: Date | string;
  content?: string;
  attachments?: string[];
  score?: number;
  feedback?: string;
  gradedAt?: Date | string;
}

interface StudentAssignmentViewProps {
  studentId: string;
  assignments: Assignment[];
  submissions: Submission[];
  onSubmitClick: (assignmentId: string) => void;
  onViewClick: (assignmentId: string) => void;
}

const statusColors = {
  NOT_SUBMITTED: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-green-100 text-green-800',
  LATE_SUBMITTED: 'bg-orange-100 text-orange-800',
  GRADED: 'bg-blue-100 text-blue-800',
  RETURNED: 'bg-purple-100 text-purple-800',
};

const typeColors = {
  HOMEWORK: 'bg-indigo-100 text-indigo-800',
  QUIZ: 'bg-pink-100 text-pink-800',
  TEST: 'bg-red-100 text-red-800',
  MIDTERM: 'bg-orange-100 text-orange-800',
  FINAL_EXAM: 'bg-red-100 text-red-800',
  PROJECT: 'bg-purple-100 text-purple-800',
  LAB_REPORT: 'bg-cyan-100 text-cyan-800',
  ESSAY: 'bg-green-100 text-green-800',
  PRESENTATION: 'bg-yellow-100 text-yellow-800',
};

export function StudentAssignmentView({
  studentId,
  assignments,
  submissions,
  onSubmitClick,
  onViewClick,
}: StudentAssignmentViewProps) {
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Create submission map
  const submissionMap = useMemo(() => {
    return submissions.reduce((acc, sub) => {
      acc[sub.assignmentId] = sub;
      return acc;
    }, {} as Record<string, Submission>);
  }, [submissions]);

  // Get unique subjects
  const subjects = useMemo(() => {
    const subjectSet = new Set(assignments.map(a => a.class.subject.subjectName));
    return Array.from(subjectSet).sort();
  }, [assignments]);

  // Filter and categorize assignments
  const categorizedAssignments = useMemo(() => {
    const now = new Date();
    const filtered = assignments.filter(
      a => selectedSubject === 'all' || a.class.subject.subjectName === selectedSubject
    );

    const upcoming: Assignment[] = [];
    const overdue: Assignment[] = [];
    const completed: Assignment[] = [];

    filtered.forEach(assignment => {
      const submission = submissionMap[assignment.id];
      const dueDate = new Date(assignment.dueDate);

      if (submission?.status === 'GRADED' || submission?.status === 'RETURNED') {
        completed.push(assignment);
      } else if (isPast(dueDate) && submission?.status !== 'SUBMITTED' && submission?.status !== 'LATE_SUBMITTED') {
        overdue.push(assignment);
      } else {
        upcoming.push(assignment);
      }
    });

    return {
      upcoming: upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      overdue: overdue.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
      completed: completed.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
    };
  }, [assignments, submissionMap, selectedSubject]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const submitted = submissions.filter(s =>
      ['SUBMITTED', 'LATE_SUBMITTED', 'GRADED', 'RETURNED'].includes(s.status)
    ).length;
    const graded = submissions.filter(s => ['GRADED', 'RETURNED'].includes(s.status));

    const totalScore = graded.reduce((sum, s) => sum + (s.score || 0), 0);
    const averageScore = graded.length > 0 ? totalScore / graded.length : 0;

    return {
      total: totalAssignments,
      submitted,
      pending: totalAssignments - submitted,
      overdue: categorizedAssignments.overdue.length,
      submissionRate: totalAssignments > 0 ? (submitted / totalAssignments) * 100 : 0,
      averageScore: averageScore.toFixed(1),
    };
  }, [assignments, submissions, categorizedAssignments]);

  const getDueDateColor = (dueDate: Date | string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return 'text-red-600';
    if (daysUntilDue <= 1) return 'text-orange-600';
    if (daysUntilDue <= 3) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
    const submission = submissionMap[assignment.id];
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = isPast(dueDate) && !['SUBMITTED', 'LATE_SUBMITTED', 'GRADED', 'RETURNED'].includes(submission?.status || '');

    return (
      <Card className={cn("hover:shadow-md transition-shadow", isOverdue && "border-red-200")}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription>
                {assignment.class.subject.subjectName} • {assignment.class.name}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={typeColors[assignment.type as keyof typeof typeColors]}>
                {assignment.type.replace('_', ' ')}
              </Badge>
              {submission && (
                <Badge variant="outline" className={statusColors[submission.status]}>
                  {submission.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <p className="text-sm text-muted-foreground">{assignment.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={getDueDateColor(dueDate)}>
                Due {format(dueDate, 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={getDueDateColor(dueDate)}>
                {isPast(dueDate) ? 'Overdue' : formatDistanceToNow(dueDate, { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="font-medium">{assignment.totalPoints} points</span>
              <span className="text-muted-foreground">Weight: {assignment.weight}%</span>
            </div>
            {submission?.score !== undefined && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Score:</span>
                <span className={cn(
                  "font-bold",
                  submission.score >= assignment.totalPoints * 0.9 && "text-green-600",
                  submission.score >= assignment.totalPoints * 0.7 && submission.score < assignment.totalPoints * 0.9 && "text-blue-600",
                  submission.score < assignment.totalPoints * 0.7 && "text-red-600"
                )}>
                  {submission.score}/{assignment.totalPoints}
                </span>
              </div>
            )}
          </div>

          {submission?.submittedAt && (
            <div className="text-sm text-muted-foreground">
              Submitted on {format(new Date(submission.submittedAt), 'MMM dd, yyyy at h:mm a')}
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          {!submission || submission.status === 'NOT_SUBMITTED' || submission.status === 'DRAFT' ? (
            <Button
              className="w-full"
              onClick={() => onSubmitClick(assignment.id)}
              variant={isOverdue ? "destructive" : "default"}
            >
              <Upload className="h-4 w-4 mr-2" />
              {submission?.status === 'DRAFT' ? 'Continue Submission' : 'Submit Assignment'}
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onViewClick(assignment.id)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Submission
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <Progress value={stats.submissionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averageScore}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedSubject === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSubject('all')}
        >
          All Subjects
        </Button>
        {subjects.map(subject => (
          <Button
            key={subject}
            variant={selectedSubject === subject ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSubject(subject)}
          >
            {subject}
          </Button>
        ))}
      </div>

      {/* Assignment Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="upcoming" className="relative">
            Upcoming
            {categorizedAssignments.upcoming.length > 0 && (
              <span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                {categorizedAssignments.upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            Overdue
            {categorizedAssignments.overdue.length > 0 && (
              <span className="ml-2 text-xs bg-red-500/20 text-red-700 px-1.5 py-0.5 rounded-full">
                {categorizedAssignments.overdue.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {categorizedAssignments.completed.length > 0 && (
              <span className="ml-2 text-xs bg-green-500/20 text-green-700 px-1.5 py-0.5 rounded-full">
                {categorizedAssignments.completed.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {categorizedAssignments.upcoming.length > 0 ? (
            categorizedAssignments.upcoming.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Check className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">No upcoming assignments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {categorizedAssignments.overdue.length > 0 ? (
            categorizedAssignments.overdue.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Check className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">No overdue assignments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {categorizedAssignments.completed.length > 0 ? (
            categorizedAssignments.completed.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed assignments yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}