"use client";

import { useState, useTransition, useCallback } from "react";
import { format } from "date-fns";
import { FileText, Upload, X, Loader2, CheckCircle2, AlertCircle, File, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useImageKitUpload, IMAGEKIT_FOLDERS } from "@/components/file";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitExcuse } from "@/components/platform/attendance/actions";

// Excuse reasons with labels (English and Arabic)
const EXCUSE_REASONS = [
  { value: 'MEDICAL', labelEn: 'Medical', labelAr: 'طبي' },
  { value: 'FAMILY_EMERGENCY', labelEn: 'Family Emergency', labelAr: 'طوارئ عائلية' },
  { value: 'RELIGIOUS', labelEn: 'Religious', labelAr: 'ديني' },
  { value: 'SCHOOL_ACTIVITY', labelEn: 'School Activity', labelAr: 'نشاط مدرسي' },
  { value: 'TRANSPORTATION', labelEn: 'Transportation', labelAr: 'مواصلات' },
  { value: 'WEATHER', labelEn: 'Weather', labelAr: 'طقس' },
  { value: 'OTHER', labelEn: 'Other', labelAr: 'أخرى' },
] as const;

// Form schema
const excuseFormSchema = z.object({
  reason: z.enum(['MEDICAL', 'FAMILY_EMERGENCY', 'RELIGIOUS', 'SCHOOL_ACTIVITY', 'TRANSPORTATION', 'WEATHER', 'OTHER']),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  attachments: z.array(z.string().url()).max(5, 'Maximum 5 attachments allowed').optional(),
});

type ExcuseFormValues = z.infer<typeof excuseFormSchema>;

interface Absence {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  status: string;
}

interface ExcuseFormProps {
  absence: Absence;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  locale?: string;
}

// Allowed file types and max size
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

export function ExcuseForm({ absence, open, onOpenChange, onSuccess, locale = 'en' }: ExcuseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<ExcuseFormValues>({
    resolver: zodResolver(excuseFormSchema),
    defaultValues: {
      reason: 'MEDICAL',
      description: '',
      attachments: [],
    },
  });

  const isArabic = locale === 'ar';

  // ImageKit upload hook
  const { upload, isUploading, progress, error: ikError, resetError } = useImageKitUpload({
    folder: IMAGEKIT_FOLDERS.EXCUSE_ATTACHMENTS,
    onSuccess: (result) => {
      const newFile: UploadedFile = {
        url: result.url,
        name: result.name,
        type: result.fileType,
        size: result.size,
      };
      setUploadedFiles(prev => {
        const updated = [...prev, newFile];
        // Update form value with all URLs
        form.setValue('attachments', updated.map(f => f.url));
        return updated;
      });
      setUploadError(null);
    },
    onError: (err) => {
      setUploadError(err);
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (uploadedFiles.length + files.length > MAX_FILES) {
      setUploadError(isArabic
        ? `الحد الأقصى ${MAX_FILES} ملفات مسموح بها`
        : `Maximum ${MAX_FILES} files allowed`
      );
      return;
    }

    for (const file of Array.from(files)) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setUploadError(isArabic
          ? 'نوع الملف غير مدعوم. يرجى استخدام PDF أو صور (JPG، PNG، WebP)'
          : 'File type not supported. Please use PDF or images (JPG, PNG, WebP)'
        );
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(isArabic
          ? 'حجم الملف كبير جدًا. الحد الأقصى 5 ميغابايت'
          : 'File size too large. Maximum 5MB allowed'
        );
        continue;
      }

      // Upload the file
      await upload(file);
    }

    // Reset the input
    e.target.value = '';
  }, [upload, uploadedFiles.length, isArabic]);

  // Remove uploaded file
  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      form.setValue('attachments', updated.map(f => f.url));
      return updated;
    });
  }, [form]);

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onSubmit = (values: ExcuseFormValues) => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitExcuse({
        attendanceId: absence.id,
        reason: values.reason,
        description: values.description,
        attachments: values.attachments,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error);
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isArabic
      ? date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : format(date, 'PPPP');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {isArabic ? 'تقديم عذر للغياب' : 'Submit Excuse for Absence'}
          </DialogTitle>
          <DialogDescription>
            {isArabic
              ? 'قدم عذرًا للغياب وسيتم مراجعته من قبل المعلم'
              : 'Submit an excuse for the absence and it will be reviewed by the teacher'}
          </DialogDescription>
        </DialogHeader>

        {/* Absence Details */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {isArabic ? 'الطالب:' : 'Student:'}
                </span>
                <p className="font-medium">{absence.studentName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {isArabic ? 'الفصل:' : 'Class:'}
                </span>
                <p className="font-medium">{absence.className}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">
                  {isArabic ? 'التاريخ:' : 'Date:'}
                </span>
                <p className="font-medium">{formatDate(absence.date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {isArabic
                ? 'تم تقديم العذر بنجاح! سيتم مراجعته قريبًا.'
                : 'Excuse submitted successfully! It will be reviewed soon.'}
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isArabic ? 'سبب الغياب' : 'Reason for Absence'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isArabic ? 'اختر السبب' : 'Select reason'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXCUSE_REASONS.map(reason => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {isArabic ? reason.labelAr : reason.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isArabic ? 'وصف إضافي (اختياري)' : 'Additional Description (Optional)'}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={isArabic
                          ? 'قدم تفاصيل إضافية حول سبب الغياب...'
                          : 'Provide additional details about the absence...'}
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {isArabic
                        ? 'يمكنك تقديم تفاصيل إضافية لدعم عذرك'
                        : 'You can provide additional details to support your excuse'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Section */}
              <div className="space-y-3">
                <FormLabel>
                  {isArabic ? 'المرفقات (اختياري)' : 'Attachments (Optional)'}
                </FormLabel>

                {/* Upload Error */}
                {(uploadError || ikError) && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {uploadError || ikError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={file.url}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md border"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(file.type)}
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeFile(index)}
                          disabled={isPending}
                          aria-label={isArabic ? 'إزالة الملف' : 'Remove file'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isArabic ? 'جاري الرفع...' : 'Uploading...'}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                )}

                {/* Upload Drop Zone */}
                {uploadedFiles.length < MAX_FILES && (
                  <label
                    className={`
                      border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                      transition-colors hover:border-primary/50 hover:bg-muted/30
                      ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      multiple
                      onChange={handleFileSelect}
                      disabled={isUploading || isPending}
                    />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isArabic
                        ? 'انقر أو اسحب لرفع الملفات'
                        : 'Click or drag to upload files'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isArabic
                        ? 'PDF، JPG، PNG، WebP (الحد الأقصى 5 ميغابايت لكل ملف)'
                        : 'PDF, JPG, PNG, WebP (max 5MB per file)'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isArabic
                        ? `${uploadedFiles.length}/${MAX_FILES} ملفات`
                        : `${uploadedFiles.length}/${MAX_FILES} files`}
                    </p>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isArabic ? 'جاري الإرسال...' : 'Submitting...'}
                    </>
                  ) : (
                    isArabic ? 'تقديم العذر' : 'Submit Excuse'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Card view for unexcused absences with submit button
interface UnexcusedAbsenceCardProps {
  absence: Absence;
  onSubmitExcuse: (absence: Absence) => void;
  locale?: string;
}

export function UnexcusedAbsenceCard({ absence, onSubmitExcuse, locale = 'en' }: UnexcusedAbsenceCardProps) {
  const isArabic = locale === 'ar';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isArabic
      ? date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
      : format(date, 'MMM d, yyyy');
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50 border-red-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="font-medium">{absence.studentName}</p>
          <p className="text-sm text-muted-foreground">
            {absence.className} - {formatDate(absence.date)}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSubmitExcuse(absence)}
        className="border-red-200 hover:bg-red-50"
      >
        <FileText className="w-4 h-4 mr-2" />
        {isArabic ? 'تقديم عذر' : 'Submit Excuse'}
      </Button>
    </div>
  );
}

// Excuse status badge
interface ExcuseStatusBadgeProps {
  status: string;
  locale?: string;
}

export function ExcuseStatusBadge({ status, locale = 'en' }: ExcuseStatusBadgeProps) {
  const isArabic = locale === 'ar';

  switch (status) {
    case 'PENDING':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          {isArabic ? 'قيد المراجعة' : 'Pending Review'}
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          {isArabic ? 'تمت الموافقة' : 'Approved'}
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          {isArabic ? 'مرفوض' : 'Rejected'}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
