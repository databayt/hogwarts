import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, FileText, ArrowRight } from "lucide-react";

interface SuccessPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>;
  searchParams: Promise<{ number?: string; token?: string }>;
}

export async function generateMetadata({ params }: SuccessPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Application Submitted" };
  }

  return {
    title: `Application Submitted - ${schoolResult.data.name}`,
    description: `Your application has been successfully submitted to ${schoolResult.data.name}.`,
  };
}

export default async function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const { lang, subdomain } = await params;
  const { number: applicationNumber, token: accessToken } = await searchParams;
  const dictionary = await getDictionary(lang);
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    notFound();
  }

  const school = schoolResult.data;
  const isRTL = lang === "ar";

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
              ? `شكراً لتقديمك طلب الالتحاق بـ ${school.name}`
              : `Thank you for applying to ${school.name}`}
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
          <Link href={`/${lang}/s/${subdomain}/apply/status`}>
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

          <Link href={`/${lang}/s/${subdomain}/schedule-tour`}>
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
          <Link href={`/${lang}/s/${subdomain}`}>
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
