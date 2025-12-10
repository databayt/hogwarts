"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { School } from "../../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { InquiryFormData } from "../types";
import { INQUIRY_SOURCES, DEFAULT_GRADES } from "../types";
import { submitInquiry } from "../actions";

interface Props {
  school: School;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
}

const inquirySchema = z.object({
  parentName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  studentName: z.string().optional(),
  studentDOB: z.string().optional(),
  interestedGrade: z.string().optional(),
  source: z.string().optional(),
  message: z.string().optional(),
  subscribeNewsletter: z.boolean(),
});

type InquiryForm = z.infer<typeof inquirySchema>;

export default function InquiryFormContent({
  school,
  dictionary,
  lang,
  subdomain,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isRTL = lang === "ar";

  const form = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      parentName: "",
      email: "",
      phone: "",
      studentName: "",
      studentDOB: "",
      interestedGrade: "",
      source: "",
      message: "",
      subscribeNewsletter: false,
    },
  });

  const onSubmit = async (data: InquiryForm) => {
    setIsSubmitting(true);
    try {
      const inquiryData: InquiryFormData = {
        parentName: data.parentName,
        email: data.email,
        phone: data.phone,
        studentName: data.studentName,
        studentDOB: data.studentDOB,
        interestedGrade: data.interestedGrade,
        source: data.source,
        message: data.message,
        subscribeNewsletter: data.subscribeNewsletter,
      };

      const result = await submitInquiry(subdomain, inquiryData);

      if (result.success) {
        setIsSubmitted(true);
        toast.success(isRTL ? "تم إرسال استفسارك بنجاح" : "Inquiry submitted successfully");
      } else {
        toast.error(result.error || (isRTL ? "فشل في إرسال الاستفسار" : "Failed to submit inquiry"));
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في إرسال الاستفسار" : "Failed to submit inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">
            {isRTL ? "شكراً لتواصلك معنا!" : "Thank You for Reaching Out!"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL
              ? "تم استلام استفسارك وسنتواصل معك قريباً"
              : "We've received your inquiry and will get back to you soon"}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {isRTL
                ? "عادة ما نرد خلال 24-48 ساعة عمل"
                : "We typically respond within 24-48 business hours"}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/${lang}/s/${subdomain}`}>
            <Button variant="outline">
              {isRTL ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </Link>
          <Link href={`/${lang}/s/${subdomain}/apply`}>
            <Button>
              {isRTL ? "قدم الآن" : "Apply Now"}
              <ArrowRight className="w-4 h-4 ms-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-bold">
          {isRTL ? "تواصل معنا" : "Contact Admissions"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isRTL
            ? `هل لديك أسئلة حول ${school.name}؟ نحن هنا للمساعدة.`
            : `Have questions about ${school.name}? We're here to help.`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isRTL ? "نموذج الاستفسار" : "Inquiry Form"}
          </CardTitle>
          <CardDescription>
            {isRTL
              ? "أخبرنا عن نفسك وسنتواصل معك قريباً"
              : "Tell us about yourself and we'll get in touch soon"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-medium">
                  {isRTL ? "معلومات الاتصال" : "Contact Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isRTL ? "اسمك" : "Your Name"} *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={isRTL ? "أدخل اسمك" : "Enter your name"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isRTL ? "البريد الإلكتروني" : "Email"} *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="example@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "رقم الهاتف" : "Phone Number"}</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+249 123 456 789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="font-medium">
                  {isRTL ? "معلومات الطالب (اختياري)" : "Student Information (Optional)"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "اسم الطالب" : "Student Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={isRTL ? "أدخل اسم الطالب" : "Enter student name"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentDOB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "تاريخ ميلاد الطالب" : "Student Date of Birth"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="interestedGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "الصف المهتم به" : "Interested Grade"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isRTL ? "اختر الصف" : "Select grade"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEFAULT_GRADES.map((grade) => (
                            <SelectItem key={grade.grade} value={grade.grade}>
                              {isRTL ? grade.gradeAr : grade.grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Message */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "رسالتك" : "Your Message"}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={isRTL ? "اكتب استفسارك هنا..." : "Write your inquiry here..."}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Source */}
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "كيف سمعت عنا؟" : "How did you hear about us?"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isRTL ? "اختر" : "Select"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INQUIRY_SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {isRTL ? source.labelAr : source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Newsletter */}
              <FormField
                control={form.control}
                name="subscribeNewsletter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal">
                        {isRTL
                          ? "أرغب في تلقي التحديثات والأخبار"
                          : "I'd like to receive updates and news"}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {isRTL ? "جارٍ الإرسال..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 me-2" />
                    {isRTL ? "إرسال الاستفسار" : "Submit Inquiry"}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">{isRTL ? "روابط سريعة" : "Quick Links"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href={`/${lang}/s/${subdomain}/apply`}>
              <Button variant="outline" className="w-full justify-start">
                {isRTL ? "قدم طلب التحاق" : "Apply Now"}
              </Button>
            </Link>
            <Link href={`/${lang}/s/${subdomain}/schedule-tour`}>
              <Button variant="outline" className="w-full justify-start">
                {isRTL ? "حجز جولة" : "Schedule a Tour"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
