"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  Users,
  Home,
  GraduationCap,
  UserCheck,
  FileText,
  AlertTriangle,
  Building,
  Award,
  HelpCircle,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Loader2,
  Calendar,
  User,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getActiveInterventions,
  getStudentInterventions,
  createIntervention,
  updateIntervention,
  escalateIntervention,
  getInterventionAssignees,
} from "@/components/platform/attendance/actions";
import type { InterventionType, InterventionStatus } from "@/components/platform/attendance/validation";

// Intervention type configuration
const INTERVENTION_TYPES: Record<string, {
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  color: string;
}> = {
  PARENT_PHONE_CALL: {
    label: 'Phone Call',
    labelAr: 'مكالمة هاتفية',
    icon: <Phone className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  PARENT_EMAIL: {
    label: 'Email',
    labelAr: 'بريد إلكتروني',
    icon: <Mail className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  PARENT_MEETING: {
    label: 'Parent Meeting',
    labelAr: 'اجتماع مع ولي الأمر',
    icon: <Users className="h-4 w-4" />,
    color: 'text-green-500',
  },
  HOME_VISIT: {
    label: 'Home Visit',
    labelAr: 'زيارة منزلية',
    icon: <Home className="h-4 w-4" />,
    color: 'text-purple-500',
  },
  COUNSELOR_REFERRAL: {
    label: 'Counselor',
    labelAr: 'إحالة للمرشد',
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'text-yellow-500',
  },
  SOCIAL_WORKER_REFERRAL: {
    label: 'Social Worker',
    labelAr: 'إحالة للأخصائي',
    icon: <UserCheck className="h-4 w-4" />,
    color: 'text-orange-500',
  },
  ADMINISTRATOR_MEETING: {
    label: 'Admin Meeting',
    labelAr: 'اجتماع إداري',
    icon: <Building className="h-4 w-4" />,
    color: 'text-red-500',
  },
  ATTENDANCE_CONTRACT: {
    label: 'Contract',
    labelAr: 'عقد حضور',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-red-500',
  },
  TRUANCY_REFERRAL: {
    label: 'Truancy Referral',
    labelAr: 'إحالة تهرب',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-700',
  },
  COMMUNITY_RESOURCE: {
    label: 'Community',
    labelAr: 'موارد مجتمعية',
    icon: <Building className="h-4 w-4" />,
    color: 'text-teal-500',
  },
  ACADEMIC_SUPPORT: {
    label: 'Academic Support',
    labelAr: 'دعم أكاديمي',
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'text-indigo-500',
  },
  MENTORSHIP_ASSIGNMENT: {
    label: 'Mentorship',
    labelAr: 'إرشاد',
    icon: <Award className="h-4 w-4" />,
    color: 'text-pink-500',
  },
  INCENTIVE_PROGRAM: {
    label: 'Incentive',
    labelAr: 'حوافز',
    icon: <Award className="h-4 w-4" />,
    color: 'text-green-500',
  },
  OTHER: {
    label: 'Other',
    labelAr: 'أخرى',
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'text-gray-500',
  },
};

// Status configuration
const STATUS_CONFIG: Record<string, {
  label: string;
  labelAr: string;
  color: string;
  bgColor: string;
}> = {
  SCHEDULED: {
    label: 'Scheduled',
    labelAr: 'مجدول',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    labelAr: 'قيد التنفيذ',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  COMPLETED: {
    label: 'Completed',
    labelAr: 'مكتمل',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  CANCELLED: {
    label: 'Cancelled',
    labelAr: 'ملغى',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  ESCALATED: {
    label: 'Escalated',
    labelAr: 'تم التصعيد',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

// Priority configuration
const PRIORITY_CONFIG: Record<number, { label: string; labelAr: string; color: string }> = {
  1: { label: 'Low', labelAr: 'منخفض', color: 'text-gray-500' },
  2: { label: 'Medium', labelAr: 'متوسط', color: 'text-blue-500' },
  3: { label: 'High', labelAr: 'مرتفع', color: 'text-orange-500' },
  4: { label: 'Critical', labelAr: 'حرج', color: 'text-red-500' },
};

interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  className: string | null;
  type: string;
  title: string;
  status: string;
  priority: number;
  scheduledDate: string | null;
  assigneeName: string | null;
  riskLevel: string;
}

interface Assignee {
  id: string;
  name: string;
  role: string;
  activeInterventions: number;
}

interface InterventionTrackerProps {
  studentId?: string;
  locale?: string;
}

export function InterventionTracker({ studentId, locale = 'en' }: InterventionTrackerProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'all'>('active');

  // Form state
  const [formData, setFormData] = useState({
    studentId: studentId || '',
    type: 'PARENT_PHONE_CALL' as InterventionType,
    title: '',
    description: '',
    priority: 2,
    scheduledDate: '',
    assignedTo: '',
  });

  // Update form state
  const [updateData, setUpdateData] = useState({
    status: '' as InterventionStatus | '',
    outcome: '',
    contactMethod: '',
    contactResult: '',
    parentNotified: false,
  });

  const isArabic = locale === 'ar';

  // Fetch active interventions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [interventionsResult, assigneesResult] = await Promise.all([
        getActiveInterventions(),
        getInterventionAssignees(),
      ]);

      if (interventionsResult.success && interventionsResult.data) {
        setInterventions(interventionsResult.data.interventions);
      }
      if (assigneesResult.success && assigneesResult.data) {
        setAssignees(assigneesResult.data.assignees);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleCreateIntervention = () => {
    setError(null);
    startTransition(async () => {
      const result = await createIntervention({
        studentId: formData.studentId,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        scheduledDate: formData.scheduledDate || undefined,
        assignedTo: formData.assignedTo || undefined,
      });

      if (result.success) {
        setIsCreateDialogOpen(false);
        // Refresh list
        const refreshResult = await getActiveInterventions();
        if (refreshResult.success && refreshResult.data) {
          setInterventions(refreshResult.data.interventions);
        }
        // Reset form
        setFormData({
          studentId: studentId || '',
          type: 'PARENT_PHONE_CALL',
          title: '',
          description: '',
          priority: 2,
          scheduledDate: '',
          assignedTo: '',
        });
      } else {
        setError(result.error || 'Failed to create intervention');
      }
    });
  };

  const handleUpdateIntervention = () => {
    if (!selectedIntervention) return;
    setError(null);

    startTransition(async () => {
      const result = await updateIntervention({
        interventionId: selectedIntervention.id,
        status: updateData.status as InterventionStatus || undefined,
        outcome: updateData.outcome || undefined,
        contactMethod: updateData.contactMethod || undefined,
        contactResult: updateData.contactResult || undefined,
        parentNotified: updateData.parentNotified,
        completedDate: updateData.status === 'COMPLETED' ? new Date().toISOString() : undefined,
      });

      if (result.success) {
        setIsUpdateDialogOpen(false);
        // Refresh list
        const refreshResult = await getActiveInterventions();
        if (refreshResult.success && refreshResult.data) {
          setInterventions(refreshResult.data.interventions);
        }
      } else {
        setError(result.error || 'Failed to update intervention');
      }
    });
  };

  const openUpdateDialog = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setUpdateData({
      status: intervention.status as InterventionStatus,
      outcome: '',
      contactMethod: '',
      contactResult: '',
      parentNotified: false,
    });
    setIsUpdateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;
    return (
      <Badge className={cn(config.bgColor, config.color)}>
        {isArabic ? config.labelAr : config.label}
      </Badge>
    );
  };

  const getTypeInfo = (type: string) => {
    return INTERVENTION_TYPES[type] || INTERVENTION_TYPES.OTHER;
  };

  const getPriorityInfo = (priority: number) => {
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[2];
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors: Record<string, string> = {
      SATISFACTORY: 'bg-green-100 text-green-700',
      AT_RISK: 'bg-yellow-100 text-yellow-700',
      MODERATELY_CHRONIC: 'bg-orange-100 text-orange-700',
      SEVERELY_CHRONIC: 'bg-red-100 text-red-700',
    };
    return colors[riskLevel] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {isArabic ? 'متتبع التدخلات' : 'Intervention Tracker'}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? 'إدارة ومتابعة تدخلات الحضور للطلاب المعرضين للخطر'
                  : 'Manage and track attendance interventions for at-risk students'}
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'تدخل جديد' : 'New Intervention'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'active' | 'all')}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                {isArabic ? 'نشطة' : 'Active'} ({interventions.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                {isArabic ? 'الكل' : 'All'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {interventions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p>{isArabic ? 'لا توجد تدخلات نشطة' : 'No active interventions'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interventions.map(intervention => {
                    const typeInfo = getTypeInfo(intervention.type);
                    const priorityInfo = getPriorityInfo(intervention.priority);

                    return (
                      <div
                        key={intervention.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn("p-2 rounded-full bg-muted", typeInfo.color)}>
                            {typeInfo.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{intervention.title}</h4>
                              {getStatusBadge(intervention.status)}
                              <Badge variant="outline" className={priorityInfo.color}>
                                {isArabic ? priorityInfo.labelAr : priorityInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {intervention.studentName}
                              </span>
                              {intervention.className && (
                                <span>{intervention.className}</span>
                              )}
                              <Badge className={getRiskBadge(intervention.riskLevel)}>
                                {intervention.riskLevel.replace('_', ' ')}
                              </Badge>
                            </div>
                            {intervention.scheduledDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(intervention.scheduledDate), 'PPP')}
                              </div>
                            )}
                            {intervention.assigneeName && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {isArabic ? 'معين إلى:' : 'Assigned to:'} {intervention.assigneeName}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUpdateDialog(intervention)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              <p className="text-center text-muted-foreground py-8">
                {isArabic ? 'عرض كل التدخلات (قريباً)' : 'View all interventions (coming soon)'}
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Intervention Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={isArabic ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {isArabic ? 'إنشاء تدخل جديد' : 'Create New Intervention'}
            </DialogTitle>
            <DialogDescription>
              {isArabic
                ? 'أضف تدخلاً جديداً لطالب معرض للخطر'
                : 'Add a new intervention for an at-risk student'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium">
                {isArabic ? 'نوع التدخل' : 'Intervention Type'}
              </label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as InterventionType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTERVENTION_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {config.icon}
                        {isArabic ? config.labelAr : config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                {isArabic ? 'العنوان' : 'Title'}
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={isArabic ? 'عنوان التدخل' : 'Intervention title'}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                {isArabic ? 'الوصف' : 'Description'}
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isArabic ? 'وصف مفصل للتدخل' : 'Detailed description'}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  {isArabic ? 'الأولوية' : 'Priority'}
                </label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {isArabic ? config.labelAr : config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {isArabic ? 'تاريخ الموعد' : 'Scheduled Date'}
                </label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {assignees.length > 0 && (
              <div>
                <label className="text-sm font-medium">
                  {isArabic ? 'تعيين إلى' : 'Assign To'}
                </label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(v) => setFormData({ ...formData, assignedTo: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isArabic ? 'اختر شخصاً' : 'Select assignee'} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignees.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.role}) - {a.activeInterventions} active
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isPending}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateIntervention} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isArabic ? 'إنشاء' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Intervention Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={isArabic ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {isArabic ? 'تحديث التدخل' : 'Update Intervention'}
            </DialogTitle>
            <DialogDescription>
              {selectedIntervention?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium">
                {isArabic ? 'الحالة' : 'Status'}
              </label>
              <Select
                value={updateData.status}
                onValueChange={(v) => setUpdateData({ ...updateData, status: v as InterventionStatus })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {isArabic ? config.labelAr : config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                {isArabic ? 'طريقة التواصل' : 'Contact Method'}
              </label>
              <Input
                value={updateData.contactMethod}
                onChange={(e) => setUpdateData({ ...updateData, contactMethod: e.target.value })}
                placeholder={isArabic ? 'هاتف، بريد، شخصي' : 'Phone, email, in-person'}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                {isArabic ? 'نتيجة التواصل' : 'Contact Result'}
              </label>
              <Input
                value={updateData.contactResult}
                onChange={(e) => setUpdateData({ ...updateData, contactResult: e.target.value })}
                placeholder={isArabic ? 'تم الاتصال، لم يرد' : 'Reached, no answer, etc.'}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                {isArabic ? 'النتيجة/الملاحظات' : 'Outcome/Notes'}
              </label>
              <Textarea
                value={updateData.outcome}
                onChange={(e) => setUpdateData({ ...updateData, outcome: e.target.value })}
                placeholder={isArabic ? 'ملاحظات حول نتيجة التدخل' : 'Notes about the intervention outcome'}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="parentNotified"
                checked={updateData.parentNotified}
                onChange={(e) => setUpdateData({ ...updateData, parentNotified: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="parentNotified" className="text-sm">
                {isArabic ? 'تم إخطار ولي الأمر' : 'Parent notified'}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              disabled={isPending}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleUpdateIntervention} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isArabic ? 'تحديث' : 'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact intervention summary for student profile
interface StudentInterventionSummaryProps {
  studentId: string;
  locale?: string;
}

export function StudentInterventionSummary({ studentId, locale = 'en' }: StudentInterventionSummaryProps) {
  const [data, setData] = useState<{
    interventions: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
      createdAt: string;
    }>;
    summary: {
      total: number;
      scheduled: number;
      inProgress: number;
      completed: number;
      escalated: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isArabic = locale === 'ar';

  useEffect(() => {
    const fetchData = async () => {
      const result = await getStudentInterventions(studentId);
      if (result.success && result.data) {
        setData({
          interventions: result.data.interventions.map(i => ({
            id: i.id,
            type: i.type,
            title: i.title,
            status: i.status,
            createdAt: i.createdAt,
          })),
          summary: result.data.summary,
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [studentId]);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!data || data.summary.total === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {isArabic ? 'لا توجد تدخلات مسجلة' : 'No interventions recorded'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {isArabic ? 'ملخص التدخلات' : 'Intervention Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center mb-3">
          <div>
            <h3 className="text-blue-600">{data.summary.scheduled}</h3>
            <p className="text-xs text-muted-foreground">{isArabic ? 'مجدول' : 'Scheduled'}</p>
          </div>
          <div>
            <h3 className="text-yellow-600">{data.summary.inProgress}</h3>
            <p className="text-xs text-muted-foreground">{isArabic ? 'قيد التنفيذ' : 'In Progress'}</p>
          </div>
          <div>
            <h3 className="text-green-600">{data.summary.completed}</h3>
            <p className="text-xs text-muted-foreground">{isArabic ? 'مكتمل' : 'Completed'}</p>
          </div>
          <div>
            <h3 className="text-red-600">{data.summary.escalated}</h3>
            <p className="text-xs text-muted-foreground">{isArabic ? 'تم التصعيد' : 'Escalated'}</p>
          </div>
        </div>

        {data.interventions.slice(0, 3).map(intervention => {
          const typeInfo = INTERVENTION_TYPES[intervention.type] || INTERVENTION_TYPES.OTHER;
          return (
            <div key={intervention.id} className="flex items-center gap-2 py-1 text-sm">
              <span className={typeInfo.color}>{typeInfo.icon}</span>
              <span className="flex-1 truncate">{intervention.title}</span>
              <Badge variant="outline" className="text-xs">
                {STATUS_CONFIG[intervention.status]?.[isArabic ? 'labelAr' : 'label'] || intervention.status}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
