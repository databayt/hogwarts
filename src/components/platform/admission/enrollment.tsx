"use client";

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { format, addDays, differenceInDays, differenceInYears } from 'date-fns';
import {
  UserPlus, Upload, Download, CheckCircle, XCircle, Clock,
  AlertCircle, Eye, Edit, Trash2, Send, FileText, Search,
  Filter, Calendar, Phone, Mail, MapPin, Users, GraduationCap,
  Home, Heart, Award, DollarSign, Paperclip, Save, ArrowRight,
  ArrowLeft, Check, X, Star, Share2, Printer, RefreshCw
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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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

interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  submittedDate: Date;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'waitlisted' | 'enrolled';
  priority: 'normal' | 'high' | 'urgent';

  // Student Information
  student: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    bloodGroup?: string;
    nationality: string;
    religion?: string;
    photoUrl?: string;
    birthCertificateUrl?: string;
  };

  // Contact Information
  contact: {
    email: string;
    phone: string;
    alternatePhone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };

  // Parent/Guardian Information
  parents: {
    father?: {
      name: string;
      occupation: string;
      phone: string;
      email: string;
      annualIncome?: number;
    };
    mother?: {
      name: string;
      occupation: string;
      phone: string;
      email: string;
      annualIncome?: number;
    };
    guardian?: {
      name: string;
      relation: string;
      occupation: string;
      phone: string;
      email: string;
    };
  };

  // Academic Information
  academic: {
    classAppliedFor: string;
    previousSchool?: string;
    lastClassAttended?: string;
    lastGrade?: string;
    reasonForTransfer?: string;
    achievements?: string[];
    specialNeeds?: string;
  };

  // Documents
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
    verified: boolean;
  }[];

  // Interview & Test
  assessment?: {
    interviewDate?: Date;
    interviewScore?: number;
    interviewNotes?: string;
    entranceTestDate?: Date;
    entranceTestScore?: number;
    totalMarks?: number;
  };

  // Admission Decision
  decision?: {
    decidedBy: string;
    decidedDate: Date;
    remarks: string;
    rejectionReason?: string;
    waitlistReason?: string;
  };

  // Fees
  fees?: {
    admissionFee: number;
    securityDeposit: number;
    tuitionFee: number;
    totalAmount: number;
    paymentStatus: 'pending' | 'partial' | 'paid';
    paidAmount?: number;
  };
}

interface AdmissionEnrollmentProps {
  applications: AdmissionApplication[];
  availableClasses: string[];
  currentUser: {
    id: string;
    name: string;
    role: 'admin' | 'admission-officer' | 'parent';
    permissions: {
      canReview: boolean;
      canApprove: boolean;
      canReject: boolean;
      canScheduleInterview: boolean;
    };
  };
  onSubmitApplication: (application: Omit<AdmissionApplication, 'id' | 'applicationNumber' | 'submittedDate'>) => Promise<void>;
  onUpdateStatus: (applicationId: string, status: AdmissionApplication['status'], remarks?: string) => Promise<void>;
  onScheduleInterview: (applicationId: string, date: Date) => Promise<void>;
  onRecordAssessment: (applicationId: string, assessment: AdmissionApplication['assessment']) => Promise<void>;
  onGenerateAdmissionLetter: (applicationId: string) => Promise<Blob>;
  onExportApplications: (filters: any) => void;
}

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'under-review': 'bg-blue-100 text-blue-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'waitlisted': 'bg-purple-100 text-purple-800',
  'enrolled': 'bg-gray-100 text-gray-800',
};

export function AdmissionEnrollment({
  applications,
  availableClasses,
  currentUser,
  onSubmitApplication,
  onUpdateStatus,
  onScheduleInterview,
  onRecordAssessment,
  onGenerateAdmissionLetter,
  onExportApplications,
}: AdmissionEnrollmentProps) {
  const [selectedTab, setSelectedTab] = useState<'applications' | 'new-application' | 'analytics'>('applications');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);

  // New Application Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    status: 'pending',
    priority: 'normal',
    student: {
      firstName: '',
      lastName: '',
      dateOfBirth: new Date(),
      gender: 'male',
      nationality: '',
    } as any,
    contact: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
    } as any,
    parents: {},
    academic: {
      classAppliedFor: '',
    } as any,
    documents: [],
  });

  // Filter applications
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        `${app.student.firstName} ${app.student.lastName}`.toLowerCase().includes(query) ||
        app.applicationNumber.toLowerCase().includes(query) ||
        app.contact.email.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      // Urgent applications first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      return b.submittedDate.getTime() - a.submittedDate.getTime();
    });
  }, [applications, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending').length;
    const underReview = applications.filter(a => a.status === 'under-review').length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const enrolled = applications.filter(a => a.status === 'enrolled').length;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;

    return { total, pending, underReview, approved, rejected, enrolled, approvalRate };
  }, [applications]);

  const handleSubmitApplication = async () => {
    try {
      await onSubmitApplication(formData as any);
      toast.success('Application submitted successfully');
      setSelectedTab('applications');
      setCurrentStep(1);
      setFormData({} as any);
    } catch (error) {
      toast.error('Failed to submit application');
    }
  };

  const handleUpdateStatus = async (status: AdmissionApplication['status'], remarks?: string) => {
    if (!selectedApplication) return;

    try {
      await onUpdateStatus(selectedApplication.id, status, remarks);
      toast.success(`Application ${status}`);
      setReviewDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const renderApplicationForm = () => {
    const totalSteps = 5;
    const progress = (currentStep / totalSteps) * 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle>New Admission Application</CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps}
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {/* Step 1: Student Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={formData.student?.firstName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, firstName: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input
                      value={formData.student?.middleName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, middleName: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.student?.lastName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, lastName: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input
                      type="date"
                      value={formData.student?.dateOfBirth ? format(new Date(formData.student.dateOfBirth), 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, dateOfBirth: new Date(e.target.value) }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Gender *</Label>
                    <Select
                      value={formData.student?.gender}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, gender: value as any }
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Blood Group</Label>
                    <Select
                      value={formData.student?.bloodGroup}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, bloodGroup: value }
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nationality *</Label>
                    <Input
                      value={formData.student?.nationality}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, nationality: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Religion</Label>
                    <Input
                      value={formData.student?.religion}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        student: { ...prev.student!, religion: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.contact?.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contact: { ...prev.contact!, email: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      type="tel"
                      value={formData.contact?.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contact: { ...prev.contact!, phone: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Street Address *</Label>
                    <Input
                      value={formData.contact?.address?.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact!,
                          address: { ...prev.contact!.address, street: e.target.value }
                        }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={formData.contact?.address?.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact!,
                          address: { ...prev.contact!.address, city: e.target.value }
                        }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={formData.contact?.address?.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact!,
                          address: { ...prev.contact!.address, state: e.target.value }
                        }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Country *</Label>
                    <Input
                      value={formData.contact?.address?.country}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact!,
                          address: { ...prev.contact!.address, country: e.target.value }
                        }
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Postal Code *</Label>
                    <Input
                      value={formData.contact?.address?.postalCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact!,
                          address: { ...prev.contact!.address, postalCode: e.target.value }
                        }
                      }))}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Parent/Guardian Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>

                <div className="space-y-4">
                  <h4 className="font-medium">Father's Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input className="mt-2" />
                    </div>
                    <div>
                      <Label>Occupation</Label>
                      <Input className="mt-2" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input type="tel" className="mt-2" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" className="mt-2" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Mother's Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input className="mt-2" />
                    </div>
                    <div>
                      <Label>Occupation</Label>
                      <Input className="mt-2" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input type="tel" className="mt-2" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Academic Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Academic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Class Applied For *</Label>
                    <Select
                      value={formData.academic?.classAppliedFor}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        academic: { ...prev.academic!, classAppliedFor: value }
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Previous School</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>Last Class Attended</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>Last Grade/Percentage</Label>
                    <Input className="mt-2" />
                  </div>
                  <div className="col-span-2">
                    <Label>Reason for Transfer (if applicable)</Label>
                    <Textarea className="mt-2" rows={3} />
                  </div>
                  <div className="col-span-2">
                    <Label>Special Needs (if any)</Label>
                    <Textarea className="mt-2" rows={2} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Document Upload */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Required Documents</h3>
                <div className="space-y-3">
                  {[
                    'Student Photo',
                    'Birth Certificate',
                    'Previous School Records',
                    'Transfer Certificate (if applicable)',
                    'Medical Records',
                    'Parent ID Proof',
                  ].map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{doc}</p>
                          <p className="text-xs text-muted-foreground">
                            Accepted formats: PDF, JPG, PNG (Max 5MB)
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            {currentStep < totalSteps ? (
              <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmitApplication}>
                <Check className="h-4 w-4 mr-2" />
                Submit Application
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admission & Enrollment</CardTitle>
              <CardDescription>Manage student admission applications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onExportApplications({})}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {currentUser.role === 'parent' && (
                <Button onClick={() => setSelectedTab('new-application')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Application
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <CardDescription>Under Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enrolled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approval Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          {currentUser.role === 'parent' && (
            <TabsTrigger value="new-application">New Application</TabsTrigger>
          )}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Applications Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application #</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class Applied</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map(app => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono">{app.applicationNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {app.student.firstName} {app.student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{app.contact.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.academic.classAppliedFor}</TableCell>
                      <TableCell>{format(app.submittedDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[app.status]}>
                          {app.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.priority === 'urgent' && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                        {app.priority === 'high' && (
                          <Badge variant="secondary">High</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {currentUser.permissions.canReview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(app);
                                setReviewDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-application">
          {renderApplicationForm()}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Admission Analytics</CardTitle>
              <CardDescription>Application trends and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics charts and reports will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {selectedApplication?.applicationNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Student Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{' '}
                      {selectedApplication.student.firstName} {selectedApplication.student.lastName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>{' '}
                      {selectedApplication.student.gender}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date of Birth:</span>{' '}
                      {format(selectedApplication.student.dateOfBirth, 'MMM dd, yyyy')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nationality:</span>{' '}
                      {selectedApplication.student.nationality}
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      {selectedApplication.contact.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{' '}
                      {selectedApplication.contact.phone}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}