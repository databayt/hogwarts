"use client";

import React from 'react';
import Link from "next/link";
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, FileText, ArrowRight } from "lucide-react";
import { useLocale } from '@/components/internationalization/use-locale';
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface SuccessContentProps {
  dictionary: Dictionary;
  applicationNumber?: string;
  schoolName?: string;
}

export default function SuccessContent({
  dictionary,
  applicationNumber,
  schoolName = "School"
}: SuccessContentProps) {
  const params = useParams();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const subdomain = params.subdomain as string;
  const id = params.id as string;

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">
            {isRTL ? "تم تقديم طلبك بنجاح!" : "Application Submitted!"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL
              ? `شكراً لتقديمك طلب الالتحاق بـ ${schoolName}`
              : `Thank you for applying to ${schoolName}`}
          </p>
        </div>

        {applicationNumber && (
          <Card className="mb-6">
            <CardHeader className="text-center pb-2">
              <CardDescription>
                {isRTL ? "رقم الطلب" : "Application Number"}
              </CardDescription>
              <CardTitle className="text-2xl font-mono">
                {applicationNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? "يرجى الاحتفاظ بهذا الرقم للمراجع المستقبلية"
                  : "Please save this number for future reference"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? "الخطوات التالية" : "Next Steps"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">1</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {isRTL ? "تأكيد البريد الإلكتروني" : "Email Confirmation"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "ستتلقى بريداً إلكترونياً يؤكد استلام طلبك"
                    : "You will receive an email confirming your application receipt"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">2</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {isRTL ? "مراجعة الطلب" : "Application Review"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "سيقوم فريق القبول بمراجعة طلبك خلال 5-7 أيام عمل"
                    : "Our admissions team will review your application within 5-7 business days"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">3</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {isRTL ? "المقابلة / الاختبار" : "Interview / Assessment"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "سيتم التواصل معك لتحديد موعد المقابلة أو الاختبار"
                    : "You will be contacted to schedule an interview or assessment"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">4</span>
              </div>
              <div>
                <h4 className="font-medium">
                  {isRTL ? "القرار النهائي" : "Final Decision"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "ستتلقى قرار القبول عبر البريد الإلكتروني"
                    : "You will receive the admission decision via email"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/${locale}/s/${subdomain}/apply/status`}>
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 pt-6">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">
                    {isRTL ? "تتبع حالة الطلب" : "Track Application Status"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "راجع حالة طلبك" : "Check your application status"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/s/${subdomain}/tour`}>
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 pt-6">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">
                    {isRTL ? "حجز جولة في المدرسة" : "Schedule a School Tour"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "زر حرمنا الجامعي" : "Visit our campus"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href={`/${locale}/s/${subdomain}`}>
            <Button variant="outline">
              {isRTL ? "العودة إلى الصفحة الرئيسية" : "Back to Home"}
              <ArrowRight className="w-4 h-4 ms-2" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {isRTL ? "هل لديك أسئلة؟ تواصل معنا على" : "Have questions? Contact us at"}{" "}
            <a href={`mailto:admissions@${subdomain}.edu`} className="text-primary hover:underline">
              admissions@{subdomain}.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
