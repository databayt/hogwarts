"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getPeriodsForClass,
  getCurrentPeriod,
} from "@/components/platform/attendance/actions";

interface Period {
  periodId: string;
  periodName: string;
  startTime: string;
  endTime: string;
  timetableId: string;
  subjectName: string | null;
  teacherName: string | null;
  hasAttendance: boolean;
}

interface PeriodSelectorProps {
  classId: string;
  date: string;
  onPeriodSelect: (period: Period) => void;
  selectedPeriodId?: string;
  locale?: string;
}

export function PeriodSelector({
  classId,
  date,
  onPeriodSelect,
  selectedPeriodId,
  locale = 'en',
}: PeriodSelectorProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isPeriodBased, setIsPeriodBased] = useState(false);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const isArabic = locale === 'ar';

  useEffect(() => {
    const fetchPeriods = async () => {
      setIsLoading(true);

      const [periodsResult, currentResult] = await Promise.all([
        getPeriodsForClass({ classId, date }),
        getCurrentPeriod(classId),
      ]);

      if (periodsResult.success && periodsResult.data) {
        setPeriods(periodsResult.data.periods);
        setIsPeriodBased(periodsResult.data.settings.isPeriodBasedAttendance);
      }

      if (currentResult.success && currentResult.data?.currentPeriod) {
        setCurrentPeriodId(currentResult.data.currentPeriod.periodId);
      }

      setIsLoading(false);
    };

    fetchPeriods();
  }, [classId, date]);

  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isPeriodBased || periods.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {isArabic
              ? 'الحضور اليومي مفعل لهذا الفصل'
              : 'Daily attendance mode enabled for this class'}
          </p>
          <p className="text-xs mt-1">
            {isArabic
              ? 'لا يوجد جدول حصص لهذا اليوم'
              : 'No timetable periods configured for this day'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {isArabic ? 'اختر الحصة' : 'Select Period'}
        </CardTitle>
        <CardDescription>
          {isArabic
            ? 'اختر الحصة لتسجيل الحضور'
            : 'Choose a period to mark attendance'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {periods.map((period) => {
            const isSelected = selectedPeriodId === period.periodId;
            const isCurrent = currentPeriodId === period.periodId;

            return (
              <button
                key={period.periodId}
                onClick={() => onPeriodSelect(period)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left",
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : period.hasAttendance
                    ? "bg-green-50 border-green-200 hover:bg-green-100"
                    : "hover:bg-muted/50",
                  isCurrent && !isSelected && "ring-2 ring-blue-400"
                )}
              >
                <div className="flex items-center gap-3">
                  {period.hasAttendance ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{period.periodName}</span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          {isArabic ? 'الحالية' : 'Current'}
                        </Badge>
                      )}
                      {period.hasAttendance && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          {isArabic ? 'مكتمل' : 'Done'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(period.startTime)} - {formatTime(period.endTime)}
                      {period.subjectName && (
                        <span className="mx-1">•</span>
                      )}
                      {period.subjectName}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Current period indicator for quick access
interface CurrentPeriodIndicatorProps {
  classId?: string;
  locale?: string;
  onMarkAttendance?: (periodId: string) => void;
}

export function CurrentPeriodIndicator({
  classId,
  locale = 'en',
  onMarkAttendance,
}: CurrentPeriodIndicatorProps) {
  const [currentPeriod, setCurrentPeriod] = useState<{
    periodId: string;
    periodName: string;
    startTime: string;
    endTime: string;
    subjectName: string | null;
  } | null>(null);
  const [nextPeriod, setNextPeriod] = useState<{
    periodId: string;
    periodName: string;
    startTime: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    const fetchCurrent = async () => {
      const result = await getCurrentPeriod(classId);
      if (result.success && result.data) {
        setCurrentPeriod(result.data.currentPeriod);
        setNextPeriod(result.data.nextPeriod);
      }
      setIsLoading(false);
    };

    fetchCurrent();

    // Refresh every minute
    const interval = setInterval(fetchCurrent, 60000);
    return () => clearInterval(interval);
  }, [classId]);

  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!currentPeriod && !nextPeriod) {
    return (
      <Card className="border-muted">
        <CardContent className="py-4 text-center text-muted-foreground">
          <Clock className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <p className="text-sm">
            {isArabic ? 'لا توجد حصص حالياً' : 'No active periods'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={currentPeriod ? "border-blue-200 bg-blue-50/50" : ""}>
      <CardContent className="py-3">
        {currentPeriod ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentPeriod.periodName}</span>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    {isArabic ? 'الآن' : 'Now'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTime(currentPeriod.startTime)} - {formatTime(currentPeriod.endTime)}
                  {currentPeriod.subjectName && ` • ${currentPeriod.subjectName}`}
                </p>
              </div>
            </div>
            {onMarkAttendance && (
              <Button
                size="sm"
                onClick={() => onMarkAttendance(currentPeriod.periodId)}
              >
                {isArabic ? 'تسجيل الحضور' : 'Mark Attendance'}
              </Button>
            )}
          </div>
        ) : nextPeriod && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'الحصة التالية' : 'Next Period'}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-medium">{nextPeriod.periodName}</span>
                <span className="text-xs text-muted-foreground">
                  {isArabic ? 'تبدأ' : 'starts at'} {formatTime(nextPeriod.startTime)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Period attendance summary
interface PeriodAttendanceSummaryProps {
  classId: string;
  date: string;
  locale?: string;
}

export function PeriodAttendanceSummary({
  classId,
  date,
  locale = 'en',
}: PeriodAttendanceSummaryProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    const fetchPeriods = async () => {
      const result = await getPeriodsForClass({ classId, date });
      if (result.success && result.data) {
        setPeriods(result.data.periods);
      }
      setIsLoading(false);
    };
    fetchPeriods();
  }, [classId, date]);

  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  if (periods.length === 0) {
    return null;
  }

  const completedCount = periods.filter(p => p.hasAttendance).length;
  const totalCount = periods.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex gap-1">
        {periods.map((period, i) => (
          <div
            key={period.periodId}
            className={cn(
              "w-6 h-2 rounded-full",
              period.hasAttendance ? "bg-green-500" : "bg-gray-200"
            )}
            title={period.periodName}
          />
        ))}
      </div>
      <span className="text-muted-foreground">
        {completedCount}/{totalCount} {isArabic ? 'حصص' : 'periods'}
      </span>
      {completedCount === totalCount && (
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
          {isArabic ? 'مكتمل' : 'Complete'}
        </Badge>
      )}
    </div>
  );
}
