"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CircleAlert,
  CheckCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getStudentsByRiskLevel,
  getClassesForSelection,
  type AttendanceRiskLevel,
} from "@/components/platform/attendance/actions";

// Risk level configuration
const RISK_LEVELS = {
  SATISFACTORY: {
    label: 'Satisfactory',
    labelAr: 'مرضي',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    threshold: '≥95%',
    description: 'On track attendance',
    descriptionAr: 'حضور على المسار الصحيح',
  },
  AT_RISK: {
    label: 'At Risk',
    labelAr: 'معرض للخطر',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    threshold: '90-94.9%',
    description: 'Early intervention needed',
    descriptionAr: 'يحتاج تدخل مبكر',
  },
  MODERATELY_CHRONIC: {
    label: 'Moderately Chronic',
    labelAr: 'غياب متوسط مزمن',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    threshold: '80-89.9%',
    description: 'Requires immediate attention',
    descriptionAr: 'يتطلب اهتمام فوري',
  },
  SEVERELY_CHRONIC: {
    label: 'Severely Chronic',
    labelAr: 'غياب شديد مزمن',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    threshold: '<80%',
    description: 'Critical intervention required',
    descriptionAr: 'يتطلب تدخل عاجل',
  },
} as const;

interface StudentRisk {
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string | null;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
  riskLevel: AttendanceRiskLevel;
  trend: 'improving' | 'stable' | 'declining';
  consecutiveAbsences: number;
  lastAttendance: string | null;
}

interface Summary {
  satisfactory: number;
  atRisk: number;
  moderatelyChronic: number;
  severelyChronic: number;
  total: number;
}

interface EarlyWarningContentProps {
  locale?: string;
}

export function EarlyWarningContent({ locale = 'en' }: EarlyWarningContentProps) {
  const [students, setStudents] = useState<StudentRisk[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<AttendanceRiskLevel | 'all'>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [isPending, startTransition] = useTransition();

  const isArabic = locale === 'ar';

  // Fetch classes for filter
  useEffect(() => {
    const fetchClasses = async () => {
      const result = await getClassesForSelection();
      if (result.success && result.data) {
        setClasses(result.data.classes);
      }
    };
    fetchClasses();
  }, []);

  // Fetch students by risk level
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      const result = await getStudentsByRiskLevel({
        classId: selectedClassId !== 'all' ? selectedClassId : undefined,
        riskLevel: selectedRiskLevel !== 'all' ? selectedRiskLevel : undefined,
      });
      if (result.success && result.data) {
        setStudents(result.data.students);
        setSummary(result.data.summary);
      }
      setIsLoading(false);
    };
    fetchStudents();
  }, [selectedClassId, selectedRiskLevel]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRiskBadge = (riskLevel: AttendanceRiskLevel) => {
    const config = RISK_LEVELS[riskLevel];
    return (
      <Badge className={cn(config.bgColor, config.textColor, config.borderColor, 'border')}>
        {isArabic ? config.labelAr : config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={cn(RISK_LEVELS.SATISFACTORY.borderColor, 'border-2')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {isArabic ? 'مرضي' : 'Satisfactory'}
            </CardTitle>
            <CardDescription>{RISK_LEVELS.SATISFACTORY.threshold}</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-green-700">{summary?.satisfactory || 0}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic ? RISK_LEVELS.SATISFACTORY.descriptionAr : RISK_LEVELS.SATISFACTORY.description}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(RISK_LEVELS.AT_RISK.borderColor, 'border-2')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-yellow-500" />
              {isArabic ? 'معرض للخطر' : 'At Risk'}
            </CardTitle>
            <CardDescription>{RISK_LEVELS.AT_RISK.threshold}</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-yellow-700">{summary?.atRisk || 0}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic ? RISK_LEVELS.AT_RISK.descriptionAr : RISK_LEVELS.AT_RISK.description}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(RISK_LEVELS.MODERATELY_CHRONIC.borderColor, 'border-2')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {isArabic ? 'غياب متوسط' : 'Moderately Chronic'}
            </CardTitle>
            <CardDescription>{RISK_LEVELS.MODERATELY_CHRONIC.threshold}</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-orange-700">{summary?.moderatelyChronic || 0}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic ? RISK_LEVELS.MODERATELY_CHRONIC.descriptionAr : RISK_LEVELS.MODERATELY_CHRONIC.description}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(RISK_LEVELS.SEVERELY_CHRONIC.borderColor, 'border-2')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              {isArabic ? 'غياب شديد' : 'Severely Chronic'}
            </CardTitle>
            <CardDescription>{RISK_LEVELS.SEVERELY_CHRONIC.threshold}</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-red-700">{summary?.severelyChronic || 0}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic ? RISK_LEVELS.SEVERELY_CHRONIC.descriptionAr : RISK_LEVELS.SEVERELY_CHRONIC.description}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{isArabic ? 'الفلاتر' : 'Filters'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Select value={selectedRiskLevel} onValueChange={(v) => setSelectedRiskLevel(v as AttendanceRiskLevel | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isArabic ? 'مستوى الخطر' : 'Risk Level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'جميع المستويات' : 'All Levels'}</SelectItem>
                <SelectItem value="SEVERELY_CHRONIC">{isArabic ? 'غياب شديد مزمن' : 'Severely Chronic'}</SelectItem>
                <SelectItem value="MODERATELY_CHRONIC">{isArabic ? 'غياب متوسط مزمن' : 'Moderately Chronic'}</SelectItem>
                <SelectItem value="AT_RISK">{isArabic ? 'معرض للخطر' : 'At Risk'}</SelectItem>
                <SelectItem value="SATISFACTORY">{isArabic ? 'مرضي' : 'Satisfactory'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isArabic ? 'الفصل' : 'Class'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'جميع الفصول' : 'All Classes'}</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isArabic ? 'الطلاب المعرضين للخطر' : 'At-Risk Students'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? `${students.length} طالب يحتاجون للمتابعة`
              : `${students.length} students requiring attention`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p>{isArabic ? 'لا يوجد طلاب في هذه الفئة' : 'No students in this category'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map(student => (
                <div
                  key={student.studentId}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50",
                    RISK_LEVELS[student.riskLevel].bgColor,
                    RISK_LEVELS[student.riskLevel].borderColor
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{student.studentName}</h4>
                      {getRiskBadge(student.riskLevel)}
                      {getTrendIcon(student.trend)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {student.className && (
                        <span>{student.className}</span>
                      )}
                      <span>
                        {isArabic ? 'معدل الحضور:' : 'Attendance:'} {student.attendanceRate}%
                      </span>
                      <span>
                        {isArabic ? 'غياب:' : 'Absent:'} {student.absentDays} {isArabic ? 'يوم' : 'days'}
                      </span>
                      {student.consecutiveAbsences > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {student.consecutiveAbsences} {isArabic ? 'أيام متتالية' : 'consecutive'}
                        </Badge>
                      )}
                    </div>
                    <Progress
                      value={student.attendanceRate}
                      className="mt-2 h-2"
                    />
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Level Legend */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'دليل مستويات الخطر' : 'Risk Level Guide'}</CardTitle>
          <CardDescription>
            {isArabic
              ? 'معايير وزارة التعليم الأمريكية للغياب المزمن'
              : 'US Department of Education chronic absenteeism criteria'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(RISK_LEVELS).map(([key, config]) => (
              <div key={key} className={cn("p-3 rounded-lg border", config.bgColor, config.borderColor)}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-3 h-3 rounded-full", config.color)} />
                  <span className={cn("font-medium text-sm", config.textColor)}>
                    {isArabic ? config.labelAr : config.label}
                  </span>
                </div>
                <p className="text-xs font-mono">{config.threshold}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isArabic ? config.descriptionAr : config.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
