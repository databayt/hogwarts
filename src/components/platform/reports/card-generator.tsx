"use client";

import * as React from 'react';
import { useState, useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  Download, Printer, Send, Eye, FileText, Award, TrendingUp,
  TrendingDown, Star, CircleAlert, CircleCheck, CircleX, Share2,
  Filter, Search, Calendar, Users, BookOpen, Target, BarChart3,
  Mail, MessageSquare
} from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Student {
  id: string;
  givenName: string;
  surname: string;
  studentId: string;
  profileImageUrl?: string;
  class: {
    name: string;
    section: string;
  };
  yearLevel: string;
  dateOfBirth: Date;
  guardian: {
    name: string;
    email: string;
    phone: string;
  };
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  teacher: string;
  marks: {
    obtained: number;
    total: number;
    percentage: number;
  };
  grade: string;
  gpa: number;
  assessments: {
    type: string;
    score: number;
    maxScore: number;
    weight: number;
  }[];
  attendance: {
    present: number;
    total: number;
    percentage: number;
  };
  remarks?: string;
}

interface ReportCard {
  id: string;
  studentId: string;
  student: Student;
  term: string;
  academicYear: string;
  issueDate: Date;
  subjects: SubjectGrade[];
  overall: {
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    grade: string;
    gpa: number;
    rank: number;
    totalStudents: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    percentage: number;
  };
  conduct: {
    behavior: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement';
    participation: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement';
    punctuality: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement';
  };
  cocurricular: {
    activity: string;
    performance: string;
    achievements?: string[];
  }[];
  teacherRemarks?: string;
  principalRemarks?: string;
  promotionStatus: 'promoted' | 'detained' | 'pending';
  nextTerm?: {
    startDate: Date;
    fees: number;
  };
}

interface ReportCardGeneratorProps {
  reportCards: ReportCard[];
  students: Student[];
  terms: { id: string; name: string; year: string }[];
  onGeneratePDF: (reportCardId: string) => Promise<Blob>;
  onGenerateBulkPDF: (reportCardIds: string[]) => Promise<Blob>;
  onSendToParent: (reportCardId: string, method: 'email' | 'sms') => Promise<void>;
  onUpdateRemarks: (reportCardId: string, remarks: { teacher?: string; principal?: string }) => Promise<void>;
  currentUserRole: 'admin' | 'teacher' | 'parent' | 'student';
}

const gradeColors: Record<string, string> = {
  'A+': 'text-green-600',
  'A': 'text-green-600',
  'B+': 'text-blue-600',
  'B': 'text-blue-600',
  'C+': 'text-yellow-600',
  'C': 'text-yellow-600',
  'D': 'text-orange-600',
  'F': 'text-red-600',
};

const conductColors = {
  'excellent': 'bg-green-100 text-green-800',
  'good': 'bg-blue-100 text-blue-800',
  'satisfactory': 'bg-yellow-100 text-yellow-800',
  'needs-improvement': 'bg-red-100 text-red-800',
};

export function ReportCardGenerator({
  reportCards,
  students,
  terms,
  onGeneratePDF,
  onGenerateBulkPDF,
  onSendToParent,
  onUpdateRemarks,
  currentUserRole,
}: ReportCardGeneratorProps) {
  const [selectedTerm, setSelectedTerm] = useState<string>(terms[0]?.id || '');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [principalRemarks, setPrincipalRemarks] = useState('');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Filter report cards
  const filteredReportCards = useMemo(() => {
    let filtered = reportCards;

    if (selectedTerm !== 'all') {
      filtered = filtered.filter(rc => rc.term === selectedTerm);
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(rc => rc.student.class.name === selectedClass);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rc =>
        `${rc.student.givenName} ${rc.student.surname}`.toLowerCase().includes(query) ||
        rc.student.studentId.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.overall.rank - b.overall.rank);
  }, [reportCards, selectedTerm, selectedClass, searchQuery]);

  // Get unique classes
  const classes = useMemo(() => {
    const classSet = new Set(students.map(s => s.class.name));
    return Array.from(classSet).sort();
  }, [students]);

  // Statistics
  const stats = useMemo(() => {
    const generated = filteredReportCards.length;
    const pending = students.length - generated;
    const averageGPA = filteredReportCards.length > 0
      ? filteredReportCards.reduce((sum, rc) => sum + rc.overall.gpa, 0) / filteredReportCards.length
      : 0;
    const passRate = filteredReportCards.length > 0
      ? (filteredReportCards.filter(rc => rc.promotionStatus === 'promoted').length / filteredReportCards.length) * 100
      : 0;

    return { generated, pending, averageGPA, passRate };
  }, [filteredReportCards, students.length]);

  const handleGeneratePDF = async (reportCard: ReportCard) => {
    try {
      toast.info('Generating PDF...');
      const blob = await onGeneratePDF(reportCard.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-card-${reportCard.student.studentId}-${reportCard.term}.pdf`;
      a.click();
      toast.success('PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleBulkPDF = async () => {
    if (selectedCards.length === 0) {
      toast.error('No report cards selected');
      return;
    }

    try {
      toast.info(`Generating ${selectedCards.length} PDFs...`);
      const blob = await onGenerateBulkPDF(selectedCards);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-cards-bulk-${format(new Date(), 'yyyy-MM-dd')}.zip`;
      a.click();
      toast.success('Bulk PDFs generated successfully');
      setSelectedCards([]);
      setBulkActionMode(false);
    } catch (error) {
      toast.error('Failed to generate bulk PDFs');
    }
  };

  const handleSendToParent = async (reportCard: ReportCard, method: 'email' | 'sms') => {
    try {
      await onSendToParent(reportCard.id, method);
      toast.success(`Report card sent via ${method}`);
    } catch (error) {
      toast.error(`Failed to send report card via ${method}`);
    }
  };

  const handleSaveRemarks = async () => {
    if (!selectedReportCard) return;

    try {
      await onUpdateRemarks(selectedReportCard.id, {
        teacher: teacherRemarks,
        principal: principalRemarks,
      });
      toast.success('Remarks saved successfully');
      setRemarksDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save remarks');
    }
  };

  const getPerformanceTrend = (grade: string, previousGrade?: string) => {
    if (!previousGrade) return null;

    const gradeOrder = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
    const currentIndex = gradeOrder.indexOf(grade);
    const previousIndex = gradeOrder.indexOf(previousGrade);

    if (currentIndex > previousIndex) return 'up';
    if (currentIndex < previousIndex) return 'down';
    return 'stable';
  };

  const ReportCardPreview = ({ reportCard }: { reportCard: ReportCard }) => (
    <div ref={previewRef} className="bg-white p-8 space-y-6 text-black">
      {/* Header */}
      <div className="text-center border-b-4 border-primary pb-4">
        <h1 className="text-3xl font-bold">School Name</h1>
        <p className="text-sm text-gray-600">Address Line 1, City, Country</p>
        <p className="text-sm text-gray-600">Phone: (123) 456-7890 | Email: info@school.edu</p>
        <h2 className="text-2xl font-semibold mt-4">STUDENT REPORT CARD</h2>
        <p className="text-sm">Academic Year: {reportCard.academicYear} | Term: {reportCard.term}</p>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-2 gap-4 border p-4 rounded">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Student Name:</span>
            <span>{reportCard.student.givenName} {reportCard.student.surname}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Student ID:</span>
            <span>{reportCard.student.studentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Class:</span>
            <span>{reportCard.student.class.name} - {reportCard.student.class.section}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Year Level:</span>
            <span>{reportCard.student.yearLevel}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Date of Birth:</span>
            <span>{format(reportCard.student.dateOfBirth, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Guardian:</span>
            <span>{reportCard.student.guardian.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Rank:</span>
            <span>{reportCard.overall.rank} / {reportCard.overall.totalStudents}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Issue Date:</span>
            <span>{format(reportCard.issueDate, 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Academic Performance */}
      <div>
        <h3 className="text-xl font-semibold mb-3 border-b pb-2">Academic Performance</h3>
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Subject</th>
              <th className="border p-2 text-center">Marks</th>
              <th className="border p-2 text-center">Grade</th>
              <th className="border p-2 text-center">GPA</th>
              <th className="border p-2 text-center">Attendance</th>
              <th className="border p-2 text-left">Teacher</th>
            </tr>
          </thead>
          <tbody>
            {reportCard.subjects.map(subject => (
              <tr key={subject.subjectId}>
                <td className="border p-2">{subject.subjectName}</td>
                <td className="border p-2 text-center">
                  {subject.marks.obtained} / {subject.marks.total}
                </td>
                <td className="border p-2 text-center font-bold">
                  {subject.grade}
                </td>
                <td className="border p-2 text-center">{subject.gpa.toFixed(2)}</td>
                <td className="border p-2 text-center">
                  {subject.attendance.percentage.toFixed(1)}%
                </td>
                <td className="border p-2 text-sm">{subject.teacher}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td className="border p-2">Overall</td>
              <td className="border p-2 text-center">
                {reportCard.overall.marksObtained} / {reportCard.overall.totalMarks}
              </td>
              <td className="border p-2 text-center text-lg">
                {reportCard.overall.grade}
              </td>
              <td className="border p-2 text-center">{reportCard.overall.gpa.toFixed(2)}</td>
              <td className="border p-2 text-center">
                {reportCard.attendance.percentage.toFixed(1)}%
              </td>
              <td className="border p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h4 className="font-semibold mb-2">Attendance Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Present:</span>
              <span className="text-green-600 font-medium">{reportCard.attendance.present} days</span>
            </div>
            <div className="flex justify-between">
              <span>Absent:</span>
              <span className="text-red-600 font-medium">{reportCard.attendance.absent} days</span>
            </div>
            <div className="flex justify-between">
              <span>Late:</span>
              <span className="text-yellow-600 font-medium">{reportCard.attendance.late} days</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Percentage:</span>
              <span>{reportCard.attendance.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h4 className="font-semibold mb-2">Conduct & Behavior</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Behavior:</span>
              <span className="font-medium capitalize">{reportCard.conduct.behavior.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Participation:</span>
              <span className="font-medium capitalize">{reportCard.conduct.participation.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Punctuality:</span>
              <span className="font-medium capitalize">{reportCard.conduct.punctuality.replace('-', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Co-curricular Activities */}
      {reportCard.cocurricular.length > 0 && (
        <div className="border p-4 rounded">
          <h4 className="font-semibold mb-2">Co-curricular Activities</h4>
          <div className="space-y-2">
            {reportCard.cocurricular.map((activity, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{activity.activity}:</span> {activity.performance}
                {activity.achievements && activity.achievements.length > 0 && (
                  <div className="ms-4 mt-1 text-xs text-gray-600">
                    Achievements: {activity.achievements.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      <div className="space-y-3">
        {reportCard.teacherRemarks && (
          <div className="border p-4 rounded">
            <h4 className="font-semibold mb-2">Class Teacher's Remarks</h4>
            <p className="text-sm">{reportCard.teacherRemarks}</p>
          </div>
        )}

        {reportCard.principalRemarks && (
          <div className="border p-4 rounded">
            <h4 className="font-semibold mb-2">Principal's Remarks</h4>
            <p className="text-sm">{reportCard.principalRemarks}</p>
          </div>
        )}
      </div>

      {/* Promotion Status */}
      <div className="border-2 border-dashed p-4 text-center">
        <p className="text-lg font-semibold">
          Promotion Status:{' '}
          <span className={cn(
            "uppercase",
            reportCard.promotionStatus === 'promoted' && "text-green-600",
            reportCard.promotionStatus === 'detained' && "text-red-600",
            reportCard.promotionStatus === 'pending' && "text-yellow-600"
          )}>
            {reportCard.promotionStatus}
          </span>
        </p>
        {reportCard.nextTerm && (
          <p className="text-sm mt-2">
            Next term begins on {format(reportCard.nextTerm.startDate, 'MMMM dd, yyyy')}
          </p>
        )}
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-8">
        <div className="text-center">
          <div className="border-t-2 border-black pt-2">
            <p className="text-sm font-medium">Class Teacher</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-black pt-2">
            <p className="text-sm font-medium">Principal</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-black pt-2">
            <p className="text-sm font-medium">Parent/Guardian</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-8">
        <p>This is a computer-generated report card. No signature required.</p>
        <p>Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report Card Generator</CardTitle>
              <CardDescription>Generate and manage student report cards</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {bulkActionMode && selectedCards.length > 0 && (
                <Button onClick={handleBulkPDF}>
                  <Download className="h-4 w-4 me-2" />
                  Download {selectedCards.length} PDFs
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setBulkActionMode(!bulkActionMode)}
              >
                {bulkActionMode ? 'Cancel' : 'Bulk Actions'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.generated}</div>
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
            <CardDescription>Average GPA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGPA.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pass Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.passRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {terms.map(term => (
              <SelectItem key={term.id} value={term.id}>
                {term.name} - {term.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(className => (
              <SelectItem key={className} value={className}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Report Cards Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {bulkActionMode && <TableHead className="w-12"></TableHead>}
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Overall Grade</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReportCards.map(reportCard => (
                <TableRow key={reportCard.id}>
                  {bulkActionMode && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCards.includes(reportCard.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCards(prev => [...prev, reportCard.id]);
                          } else {
                            setSelectedCards(prev => prev.filter(id => id !== reportCard.id));
                          }
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reportCard.student.profileImageUrl} />
                        <AvatarFallback>
                          {reportCard.student.givenName[0]}{reportCard.student.surname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {reportCard.student.givenName} {reportCard.student.surname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reportCard.student.studentId}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{reportCard.student.class.name}</TableCell>
                  <TableCell>
                    <span className={cn("text-lg font-bold", gradeColors[reportCard.overall.grade])}>
                      {reportCard.overall.grade}
                    </span>
                  </TableCell>
                  <TableCell>{reportCard.overall.gpa.toFixed(2)}</TableCell>
                  <TableCell>
                    {reportCard.overall.rank} / {reportCard.overall.totalStudents}
                  </TableCell>
                  <TableCell>
                    <Badge variant={reportCard.attendance.percentage >= 90 ? "default" : "secondary"}>
                      {reportCard.attendance.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        reportCard.promotionStatus === 'promoted' ? 'default' :
                        reportCard.promotionStatus === 'detained' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {reportCard.promotionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReportCard(reportCard);
                          setPreviewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGeneratePDF(reportCard)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {currentUserRole !== 'student' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendToParent(reportCard, 'email')}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          {(currentUserRole === 'admin' || currentUserRole === 'teacher') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReportCard(reportCard);
                                setTeacherRemarks(reportCard.teacherRemarks || '');
                                setPrincipalRemarks(reportCard.principalRemarks || '');
                                setRemarksDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Report Card Preview</DialogTitle>
            <DialogDescription>
              Review before downloading or printing
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[600px]">
            {selectedReportCard && <ReportCardPreview reportCard={selectedReportCard} />}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 me-2" />
              Print
            </Button>
            {selectedReportCard && (
              <Button onClick={() => handleGeneratePDF(selectedReportCard)}>
                <Download className="h-4 w-4 me-2" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remarks Dialog */}
      <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remarks</DialogTitle>
            <DialogDescription>
              Add teacher and principal remarks for the report card
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Teacher's Remarks</Label>
              <Textarea
                value={teacherRemarks}
                onChange={(e) => setTeacherRemarks(e.target.value)}
                placeholder="Enter teacher's remarks..."
                className="mt-2"
                rows={4}
              />
            </div>
            {currentUserRole === 'admin' && (
              <div>
                <Label>Principal's Remarks</Label>
                <Textarea
                  value={principalRemarks}
                  onChange={(e) => setPrincipalRemarks(e.target.value)}
                  placeholder="Enter principal's remarks..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarksDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRemarks}>
              Save Remarks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}